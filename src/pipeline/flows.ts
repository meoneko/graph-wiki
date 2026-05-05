/**
 * Flow tracing — BFS-based execution flow discovery from entry points.
 *
 * Ported from Python reference flows.py, adapted for TypeScript + GraphDB.
 * Criticality formula weights are production-tested from the reference implementation.
 */
import type { GraphEdge, GraphNode } from '../core/types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FLOW_DEPTH = 15;
const MIN_FLOW_LENGTH = 2; // minimum nodes to form a meaningful flow

// ── Types ────────────────────────────────────────────────────────────────────

export interface Flow {
  name: string;
  entryPointId: string;
  path: string[];           // ordered node IDs, entry point first
  depth: number;
  nodeCount: number;
  fileCount: number;
  criticality: number;
}

interface FlowAdjacency {
  /** outgoing CALLS edges per node ID */
  callsOut: Map<string, Set<string>>;
  /** all known node IDs in this workspace */
  nodesById: Map<string, GraphNode>;
  /** node IDs that have test coverage (has incoming tested_by edge) */
  hasTestedBy: Set<string>;
}

// ── Entry-point detection ────────────────────────────────────────────────────

/**
 * A node is an entry point if a framework/language enrichment stage has
 * assigned the neutral `entrypoint` role. Flow tracing intentionally does not
 * infer entry points from legacy node types or incoming-call topology.
 */
export function isEntryPoint(node: GraphNode): boolean {
  return (node.roles ?? []).includes('entrypoint');
}
// ── Adjacency build ────────────────────────────────────────────────────────

export function buildFlowAdjacency(nodes: GraphNode[], edges: GraphEdge[]): FlowAdjacency {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const callsOut = new Map<string, Set<string>>();
  const hasTestedBy = new Set<string>();

  for (const edge of edges) {
    const isCallEdge = edge.type === 'calls';

    if (isCallEdge) {
      if (!callsOut.has(edge.from_id)) callsOut.set(edge.from_id, new Set());
      callsOut.get(edge.from_id)!.add(edge.to_id);
    }
    if (edge.type === 'tested_by') {
      hasTestedBy.add(edge.from_id);
    }
  }

  // Keep explicit empty adjacency sets for nodes with no outgoing calls.
  for (const node of nodes) {
    if (!callsOut.has(node.id)) callsOut.set(node.id, new Set());
  }
  return { callsOut, nodesById, hasTestedBy };
}

// ── BFS flow tracing ─────────────────────────────────────────────────────────

function traceSingleFlow(
  adj: FlowAdjacency,
  entryPoint: GraphNode,
  maxDepth = MAX_FLOW_DEPTH,
): Flow | null {
  const visited = new Set<string>([entryPoint.id]);
  const queue: Array<[string, number]> = [[entryPoint.id, 0]];
  const pathIds: string[] = [entryPoint.id];
  let actualDepth = 0;

  while (queue.length > 0) {
    const [currentId, depth] = queue.shift()!;
    if (depth > actualDepth) actualDepth = depth;
    if (depth >= maxDepth) continue;

    for (const targetId of adj.callsOut.get(currentId) ?? []) {
      if (visited.has(targetId)) continue;
      visited.add(targetId);
      pathIds.push(targetId);
      queue.push([targetId, depth + 1]);
    }
  }

  if (pathIds.length < MIN_FLOW_LENGTH) return null;

  const pathNodes = pathIds.map((id) => adj.nodesById.get(id)).filter(Boolean) as GraphNode[];
  const criticality = computeCriticality(
    { path: pathIds, depth: actualDepth },
    adj,
    pathNodes,
  );
  const fileCount = new Set(pathNodes.map((n) => n.source_file).filter(Boolean)).size;

  return {
    name: entryPoint.label,
    entryPointId: entryPoint.id,
    path: pathIds,
    depth: actualDepth,
    nodeCount: pathIds.length,
    fileCount,
    criticality,
  };
}

// ── Criticality formula ───────────────────────────────────────────────────────

/**
 * Criticality formula from Python reference (production-tested weights):
 *   fileSpread × 0.30 + external × 0.20 + security × 0.25 + testGap × 0.15 + depth × 0.10
 *
 * Result is clamped to [0.0, 1.0] and rounded to 4 decimal places.
 */
function computeCriticality(
  flow: Pick<Flow, 'path' | 'depth'>,
  adj: FlowAdjacency,
  pathNodes: GraphNode[],
): number {
  const nodeCount = Math.max(pathNodes.length, 1);

  // File spread: how many distinct files (capped at 4)
  const fileCount = new Set(pathNodes.map((n) => n.source_file).filter(Boolean)).size;
  const fileSpread = Math.min((fileCount - 1) / 4.0, 1.0);

  // External calls: calls to nodes NOT in this flow
  const flowNodeSet = new Set(flow.path);
  const externalCalls = pathNodes
    .flatMap((n) => [...(adj.callsOut.get(n.id) ?? [])])
    .filter((id) => !flowNodeSet.has(id) && !adj.nodesById.has(id)).length;
  const externalScore = Math.min(externalCalls / 5.0, 1.0);

  // Security sensitivity is graph-derived/configurable metadata only.
  // Do not infer it from English symbol names; that is not universal across codebases.
  const securityHits = pathNodes.filter((n) => {
    const roles = n.roles ?? [];
    const metadata = n.metadata ?? {};
    const langMeta = n.lang_meta ?? {};
    return roles.includes('external')
      || metadata.security_sensitive === true
      || metadata.auth_boundary === true
      || metadata.external_boundary === true
      || langMeta.security_sensitive === true
      || langMeta.auth_boundary === true
      || langMeta.external_boundary === true;
  }).length;
  const securityScore = Math.min(securityHits / nodeCount, 1.0);

  // Test gap: fraction of nodes without test coverage
  const testedCount = pathNodes.filter((n) => adj.hasTestedBy.has(n.id)).length;
  const testGap = 1.0 - testedCount / nodeCount;

  // Depth: normalized to max expected depth of 10
  const depthScore = Math.min(flow.depth / 10.0, 1.0);

  const raw =
    fileSpread    * 0.30 +
    externalScore * 0.20 +
    securityScore * 0.25 +
    testGap       * 0.15 +
    depthScore    * 0.10;

  return Math.round(Math.min(Math.max(raw, 0.0), 1.0) * 10000) / 10000;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Trace all flows from entry-point nodes in the given workspace.
 *
 * Returns one `Flow` per entry point that reaches at least one other node.
 * Sorted by criticality descending.
 */
export function traceFlows(
  nodes: GraphNode[],
  edges: GraphEdge[],
  maxDepth = MAX_FLOW_DEPTH,
): Flow[] {
  const adj = buildFlowAdjacency(nodes, edges);


  const entryPoints = nodes.filter(isEntryPoint);
  const flows: Flow[] = [];

  for (const ep of entryPoints) {
    const flow = traceSingleFlow(adj, ep, maxDepth);
    if (flow) flows.push(flow);
  }

  return flows.sort((a, b) => b.criticality - a.criticality);
}
