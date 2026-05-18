/**
 * DeadCodeClassifier — extends existing findDeadCode() with richer classification.
 *
 * Reuses `computeGraphMetrics().orphans` for initial detection and applies the same
 * `deriveDomain()` pattern for module identification. Entrypoint detection mirrors
 * `TrustAwareQueryEngine.isEntrypoint()`.
 *
 * Classification categories:
 * - `potentially_dead_code`: function/method/usecase with no incoming cross-module edges
 * - `unused_component`: class/service with no incoming calls/invokes/dispatches_to
 * - `test_only_reachable`: all incoming edges from test files
 */

import type {
  GraphNode,
  GraphEdge,
  DeadCodeEntry,
  DeadCodeResult,
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
// Entrypoint detection — mirrors TrustAwareQueryEngine.isEntrypoint()
// ---------------------------------------------------------------------------

function isEntrypoint(node: GraphNode): boolean {
  const type = node.type.toLowerCase();
  return (
    Boolean(node.metadata?.is_entrypoint) ||
    type.includes('api') ||
    type.includes('route') ||
    type.includes('controller') ||
    Boolean(node.http_method || node.http_path)
  );
}

// ---------------------------------------------------------------------------
// Test file detection
// ---------------------------------------------------------------------------

function isTestFile(sourceFile: string | undefined): boolean {
  if (!sourceFile) return false;
  const normalized = sourceFile.replace(/\\/g, '/');
  return (
    normalized.includes('/test/') ||
    normalized.includes('.test.') ||
    normalized.includes('.spec.')
  );
}

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

export class DeadCodeClassifier {
  classify(
    nodes: GraphNode[],
    edges: GraphEdge[],
    orphanIds: string[],
  ): DeadCodeResult {
    // Build lookup maps
    const nodeById = new Map<string, GraphNode>();
    for (const node of nodes) {
      nodeById.set(node.id, node);
    }

    // Compute module for each node
    const nodeModule = new Map<string, string>();
    for (const node of nodes) {
      nodeModule.set(node.id, deriveDomain(node));
    }

    // Build incoming edges map (nodeId → incoming edges)
    const incomingEdges = new Map<string, GraphEdge[]>();
    for (const edge of edges) {
      const existing = incomingEdges.get(edge.to_id);
      if (existing) {
        existing.push(edge);
      } else {
        incomingEdges.set(edge.to_id, [edge]);
      }
    }

    // 1. Start with orphans (nodes with degree 0 from computeGraphMetrics)
    const orphanSet = new Set(orphanIds);

    // 2. Also find nodes with no incoming cross-module edges
    const noCrossModuleIncoming = new Set<string>();
    for (const node of nodes) {
      if (orphanSet.has(node.id)) {
        // Already an orphan, will be included
        noCrossModuleIncoming.add(node.id);
        continue;
      }
      const nodeIncoming = incomingEdges.get(node.id) ?? [];
      const targetModule = nodeModule.get(node.id)!;
      const hasCrossModuleIncoming = nodeIncoming.some((edge) => {
        const sourceModule = nodeModule.get(edge.from_id);
        return sourceModule !== undefined && sourceModule !== targetModule;
      });
      if (!hasCrossModuleIncoming) {
        noCrossModuleIncoming.add(node.id);
      }
    }

    // 3. Exclude entrypoints/controller_actions
    const candidates = new Set<string>();
    for (const nodeId of noCrossModuleIncoming) {
      const node = nodeById.get(nodeId);
      if (node && !isEntrypoint(node)) {
        candidates.add(nodeId);
      }
    }

    // 4 & 5. Classify each candidate
    const entries: DeadCodeEntry[] = [];

    for (const nodeId of candidates) {
      const node = nodeById.get(nodeId)!;
      const nodeIncoming = incomingEdges.get(nodeId) ?? [];

      // 5. Test-only detection: all incoming edges from test files
      if (nodeIncoming.length > 0) {
        const allFromTest = nodeIncoming.every((edge) => {
          const sourceNode = nodeById.get(edge.from_id);
          return sourceNode && isTestFile(sourceNode.source_file);
        });
        if (allFromTest) {
          entries.push({
            nodeId: node.id,
            label: node.label,
            type: node.type,
            sourceFile: node.source_file ?? '',
            classification: 'test_only_reachable',
            severity: 'info',
          });
          continue;
        }
      }

      // 4. Classify by type
      const typeLower = node.type.toLowerCase();

      if (
        typeLower === 'function' ||
        typeLower === 'method' ||
        typeLower === 'usecase'
      ) {
        entries.push({
          nodeId: node.id,
          label: node.label,
          type: node.type,
          sourceFile: node.source_file ?? '',
          classification: 'potentially_dead_code',
          severity: 'warning',
        });
      } else if (typeLower === 'class' || typeLower === 'service') {
        // Check if it has no incoming calls/invokes/dispatches_to edges
        const hasRelevantIncoming = nodeIncoming.some(
          (edge) =>
            edge.type === 'calls' ||
            edge.type === 'invokes' ||
            edge.type === 'dispatches_to',
        );
        if (!hasRelevantIncoming) {
          entries.push({
            nodeId: node.id,
            label: node.label,
            type: node.type,
            sourceFile: node.source_file ?? '',
            classification: 'unused_component',
            severity: 'warning',
          });
        }
      }
    }

    // 6. Compute per-module dead code ratio
    const moduleNodeCounts = new Map<string, number>();
    for (const node of nodes) {
      const mod = nodeModule.get(node.id)!;
      moduleNodeCounts.set(mod, (moduleNodeCounts.get(mod) ?? 0) + 1);
    }

    const moduleDeadCounts = new Map<string, number>();
    for (const entry of entries) {
      const mod = nodeModule.get(entry.nodeId)!;
      moduleDeadCounts.set(mod, (moduleDeadCounts.get(mod) ?? 0) + 1);
    }

    const moduleRatios: Array<{ moduleId: string; ratio: number; flagged: boolean }> = [];
    for (const [moduleId, totalCount] of moduleNodeCounts) {
      const deadCount = moduleDeadCounts.get(moduleId) ?? 0;
      const ratio = totalCount > 0 ? deadCount / totalCount : 0;
      moduleRatios.push({
        moduleId,
        ratio,
        flagged: ratio > 0.2,
      });
    }

    // Sort for deterministic output
    moduleRatios.sort((a, b) => a.moduleId.localeCompare(b.moduleId));

    // Generate findings
    const findings: Finding[] = [];
    let findingCounter = 0;

    for (const entry of entries) {
      findingCounter++;
      const mod = nodeModule.get(entry.nodeId)!;

      findings.push({
        id: `arch-deadcode-${String(findingCounter).padStart(3, '0')}`,
        type: entry.classification === 'potentially_dead_code'
          ? 'dead_code'
          : entry.classification === 'unused_component'
            ? 'unused_component'
            : 'test_only_reachable',
        severity: entry.severity,
        description:
          entry.classification === 'test_only_reachable'
            ? `Node "${entry.label}" (${entry.type}) is only reachable from test files`
            : entry.classification === 'unused_component'
              ? `Component "${entry.label}" (${entry.type}) has no incoming calls, invokes, or dispatches_to edges`
              : `Node "${entry.label}" (${entry.type}) has no incoming cross-module edges and may be dead code`,
        affectedModules: [mod],
        sourceReferences: [
          {
            file: entry.sourceFile,
            nodeId: entry.nodeId,
            label: entry.label,
          },
        ],
        confidence: 'high',
      });
    }

    // Flag modules with high dead code ratio
    for (const moduleRatio of moduleRatios) {
      if (moduleRatio.flagged) {
        findingCounter++;
        findings.push({
          id: `arch-deadcode-${String(findingCounter).padStart(3, '0')}`,
          type: 'high_dead_code_ratio',
          severity: 'warning',
          description: `Module "${moduleRatio.moduleId}" has ${(moduleRatio.ratio * 100).toFixed(1)}% dead code (threshold: 20%)`,
          affectedModules: [moduleRatio.moduleId],
          sourceReferences: [],
          confidence: 'high',
        });
      }
    }

    return {
      entries,
      moduleRatios,
      findings,
    };
  }
}
