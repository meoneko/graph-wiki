/**
 * FlowAssessor — evaluates architectural quality of business flows.
 *
 * Reuses `computeFlows()` output (FlowSummary[]) and applies the same
 * `deriveDomain()` pattern for module span detection. Entrypoint detection
 * mirrors `TrustAwareQueryEngine.isEntrypoint()`.
 */

import type {
  GraphNode,
  GraphEdge,
  FlowSummary,
  FlowAssessment,
  FlowAssessmentResult,
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
// Analyzer
// ---------------------------------------------------------------------------

export class FlowAssessor {
  assess(
    nodes: GraphNode[],
    edges: GraphEdge[],
    flows: FlowSummary[],
    thresholds?: { highComplexity?: number },
  ): FlowAssessmentResult {
    const highComplexityThreshold = thresholds?.highComplexity ?? 10;

    // Build lookup maps
    const nodeById = new Map<string, GraphNode>();
    for (const node of nodes) {
      nodeById.set(node.id, node);
    }

    const assessments: FlowAssessment[] = [];
    const findings: Finding[] = [];
    let findingCounter = 0;

    for (const flow of flows) {
      // 1. Count nodes
      const nodeCount = flow.nodeIds.length;

      // 2. Determine module span using deriveDomain() on flow nodes
      const moduleSet = new Set<string>();
      for (const nodeId of flow.nodeIds) {
        const node = nodeById.get(nodeId);
        if (node) {
          moduleSet.add(deriveDomain(node));
        }
      }
      const moduleSpan = [...moduleSet];

      // 3. Check for entrypoint
      let hasEntrypoint = false;
      for (const nodeId of flow.nodeIds) {
        const node = nodeById.get(nodeId);
        if (node && isEntrypoint(node)) {
          hasEntrypoint = true;
          break;
        }
      }

      // 4. Find dead branches: nodes in flow with no outgoing edges within the flow
      const flowNodeSet = new Set(flow.nodeIds);
      const nodesWithOutgoing = new Set<string>();
      for (const edge of edges) {
        if (flowNodeSet.has(edge.from_id) && flowNodeSet.has(edge.to_id)) {
          nodesWithOutgoing.add(edge.from_id);
        }
      }

      const deadBranches: Array<{ nodeId: string; label: string }> = [];
      for (const nodeId of flow.nodeIds) {
        if (!nodesWithOutgoing.has(nodeId)) {
          const node = nodeById.get(nodeId);
          if (node) {
            deadBranches.push({ nodeId: node.id, label: node.label });
          }
        }
      }

      // 5. Classify complexity
      let complexity: 'low' | 'medium' | 'high';
      if (nodeCount > highComplexityThreshold) {
        complexity = 'high';
      } else if (nodeCount >= 5) {
        complexity = 'medium';
      } else {
        complexity = 'low';
      }

      assessments.push({
        flowId: flow.id,
        flowName: flow.name,
        nodeCount,
        moduleSpan,
        hasEntrypoint,
        deadBranches,
        complexity,
      });

      // 6. Generate findings
      if (nodeCount > highComplexityThreshold) {
        findingCounter++;
        findings.push({
          id: `arch-flow-complexity-${String(findingCounter).padStart(3, '0')}`,
          type: 'high_complexity_flow',
          severity: 'warning',
          description: `Flow "${flow.name}" has high complexity with ${nodeCount} nodes (threshold: ${highComplexityThreshold})`,
          affectedModules: moduleSpan,
          sourceReferences: [],
          confidence: 'high',
        });
      }

      if (!hasEntrypoint) {
        findingCounter++;
        findings.push({
          id: `arch-flow-entrypoint-${String(findingCounter).padStart(3, '0')}`,
          type: 'missing_entrypoint',
          severity: 'warning',
          description: `Flow "${flow.name}" has no identifiable entrypoint`,
          affectedModules: moduleSpan,
          sourceReferences: [],
          confidence: 'high',
        });
      }

      if (moduleSpan.length > 3) {
        findingCounter++;
        findings.push({
          id: `arch-flow-crossmodule-${String(findingCounter).padStart(3, '0')}`,
          type: 'cross_module_flow',
          severity: 'info',
          description: `Flow "${flow.name}" spans ${moduleSpan.length} modules: ${moduleSpan.join(', ')}`,
          affectedModules: moduleSpan,
          sourceReferences: [],
          confidence: 'high',
        });
      }

      for (const branch of deadBranches) {
        findingCounter++;
        findings.push({
          id: `arch-flow-deadbranch-${String(findingCounter).padStart(3, '0')}`,
          type: 'dead_branch',
          severity: 'info',
          description: `Dead branch in flow "${flow.name}": node "${branch.label}" has no outgoing edges within the flow`,
          affectedModules: moduleSpan,
          sourceReferences: [{ nodeId: branch.nodeId, label: branch.label }],
          confidence: 'high',
        });
      }
    }

    return {
      assessments,
      findings,
    };
  }
}
