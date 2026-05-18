/**
 * ModuleBoundaryAnalyzer — identifies modules and computes coupling/cohesion scores.
 *
 * Module identification reuses the `deriveDomain()` pattern from `src/core/flows.ts`.
 * Cohesion scoring reuses `Community.cohesion` from `detectCommunities()`.
 * Coupling is computed as: crossEdges(A, B) / (totalEdges(A) + totalEdges(B))
 */

import type {
  GraphNode,
  GraphEdge,
  Community,
  ModuleInfo,
  CouplingPair,
  ModuleBoundaryResult,
  Finding,
} from '../types.js';

// ---------------------------------------------------------------------------
// Module identification — replicates deriveDomain() logic from src/core/flows.ts
// ---------------------------------------------------------------------------

function deriveDomain(node: GraphNode): string {
  if (node.domain) return node.domain;
  const fromMetadata = node.metadata?.derived_domain ?? node.metadata?.domain;
  if (typeof fromMetadata === 'string' && fromMetadata.length > 0) return fromMetadata;
  const source = (node.source_file ?? '').replace(/\\/g, '/').toLowerCase();
  const parts = source.split('/').filter(Boolean);
  const srcIndex = Math.max(parts.lastIndexOf('src'), parts.lastIndexOf('source'));
  if (srcIndex >= 0 && parts[srcIndex + 1]) return parts[srcIndex + 1]!;
  if (parts.length >= 2) return parts[parts.length - 2]!;
  const symbol = (node.symbol ?? node.label).toLowerCase();
  const match = symbol.match(
    /(auth|user|course|lesson|order|payment|admin|student|teacher|report|notification)/,
  );
  return match?.[1] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

export class ModuleBoundaryAnalyzer {
  analyze(
    nodes: GraphNode[],
    edges: GraphEdge[],
    communities: Community[],
    thresholds?: { highCoupling?: number; lowCohesion?: number },
  ): ModuleBoundaryResult {
    const highCouplingThreshold = thresholds?.highCoupling ?? 0.7;
    const lowCohesionThreshold = thresholds?.lowCohesion ?? 0.3;

    // 1. Group nodes by module using deriveDomain()
    const moduleMap = new Map<string, string[]>(); // moduleName → nodeIds
    for (const node of nodes) {
      const mod = deriveDomain(node);
      const arr = moduleMap.get(mod) ?? [];
      arr.push(node.id);
      moduleMap.set(mod, arr);
    }

    const modules: ModuleInfo[] = [...moduleMap.entries()].map(([name, nodeIds]) => ({
      id: name,
      name,
      nodeCount: nodeIds.length,
      nodeIds,
    }));

    // 2. Build lookup: nodeId → module name
    const nodeToModule = new Map<string, string>();
    for (const mod of modules) {
      for (const nid of mod.nodeIds) {
        nodeToModule.set(nid, mod.id);
      }
    }

    // 3. Compute coupling for each pair of modules
    // Pre-compute total edges per module (edges where at least one endpoint is in the module)
    const moduleEdgeCounts = new Map<string, number>();
    for (const mod of modules) {
      moduleEdgeCounts.set(mod.id, 0);
    }
    for (const edge of edges) {
      const fromMod = nodeToModule.get(edge.from_id);
      const toMod = nodeToModule.get(edge.to_id);
      if (fromMod) moduleEdgeCounts.set(fromMod, (moduleEdgeCounts.get(fromMod) ?? 0) + 1);
      if (toMod && toMod !== fromMod) moduleEdgeCounts.set(toMod, (moduleEdgeCounts.get(toMod) ?? 0) + 1);
    }

    // Count cross-edges between each pair
    const crossEdgeCounts = new Map<string, number>(); // "modA|modB" → count
    for (const edge of edges) {
      const fromMod = nodeToModule.get(edge.from_id);
      const toMod = nodeToModule.get(edge.to_id);
      if (fromMod && toMod && fromMod !== toMod) {
        const key = [fromMod, toMod].sort().join('|');
        crossEdgeCounts.set(key, (crossEdgeCounts.get(key) ?? 0) + 1);
      }
    }

    const couplingPairs: CouplingPair[] = [];
    for (const [key, crossCount] of crossEdgeCounts.entries()) {
      const [modA, modB] = key.split('|') as [string, string];
      const totalA = moduleEdgeCounts.get(modA) ?? 0;
      const totalB = moduleEdgeCounts.get(modB) ?? 0;
      const denominator = totalA + totalB;
      const score = denominator === 0 ? 0 : crossCount / denominator;
      couplingPairs.push({
        moduleA: modA,
        moduleB: modB,
        score: Number(score.toFixed(4)),
        crossEdgeCount: crossCount,
      });
    }

    // 4. Compute cohesion scores by mapping communities to modules
    const cohesionScores: Array<{ moduleId: string; score: number }> = [];
    for (const mod of modules) {
      // Single-node module → cohesion 1.0
      if (mod.nodeCount <= 1) {
        cohesionScores.push({ moduleId: mod.id, score: 1.0 });
        continue;
      }

      // Find the community with the best overlap to this module
      const moduleNodeSet = new Set(mod.nodeIds);
      let bestCommunity: Community | undefined;
      let bestOverlap = 0;
      for (const community of communities) {
        const overlap = community.nodeIds.filter((nid) => moduleNodeSet.has(nid)).length;
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestCommunity = community;
        }
      }

      const score = bestCommunity ? bestCommunity.cohesion : 0;
      cohesionScores.push({ moduleId: mod.id, score });
    }

    // 5. Generate findings
    const findings: Finding[] = [];
    let findingCounter = 0;

    // High coupling findings
    for (const pair of couplingPairs) {
      if (pair.score > highCouplingThreshold) {
        findingCounter++;
        findings.push({
          id: `arch-coupling-${String(findingCounter).padStart(3, '0')}`,
          type: 'high_coupling',
          severity: 'warning',
          description: `High coupling (${pair.score.toFixed(2)}) between modules "${pair.moduleA}" and "${pair.moduleB}" (${pair.crossEdgeCount} cross-edges)`,
          affectedModules: [pair.moduleA, pair.moduleB],
          sourceReferences: [],
          confidence: 'high',
        });
      }
    }

    // Low cohesion findings
    for (const entry of cohesionScores) {
      if (entry.score < lowCohesionThreshold) {
        findingCounter++;
        findings.push({
          id: `arch-cohesion-${String(findingCounter).padStart(3, '0')}`,
          type: 'low_cohesion',
          severity: 'warning',
          description: `Low cohesion (${entry.score.toFixed(2)}) in module "${entry.moduleId}"`,
          affectedModules: [entry.moduleId],
          sourceReferences: [],
          confidence: 'high',
        });
      }
    }

    return {
      modules,
      couplingPairs,
      cohesionScores,
      findings,
    };
  }
}
