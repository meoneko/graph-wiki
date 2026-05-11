import type { GraphEdge, GraphNode } from '../../types.js';

const CALL_EDGE_TYPES = new Set(['calls', 'invokes', 'dispatches_to']);

export type NodeSummary = Pick<
  GraphNode,
  'id' | 'label' | 'type' | 'source_file' | 'project' | 'graph_kind' | 'trust_level'
>;

export type EdgeSummary = Pick<
  GraphEdge,
  'id' | 'from_id' | 'to_id' | 'type' | 'graph_kind' | 'trust_level'
>;

export interface TraceLane {
  nodes: NodeSummary[];
  edges: EdgeSummary[];
  depthReached: number;
  truncated: boolean;
}

export interface TraceNodeFlowResult {
  target: NodeSummary;
  upstream?: TraceLane;
  downstream?: TraceLane;
  factorCodes: Array<{ code: string; value?: number | string }>;
}

export interface TraceNodeFlowOptions {
  workspaceId: string;
  direction: 'upstream' | 'downstream' | 'both';
  maxDepth: number;
  maxNodes: number;
}

export interface TraceNodeFlowStore {
  getNode(id: string): GraphNode | undefined;
  getEdgesFrom(id: string): GraphEdge[];
  getEdgesTo(id: string): GraphEdge[];
}

interface QueueItem {
  nodeId: string;
  depth: number;
}

function summarizeNode(node: GraphNode): NodeSummary {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    source_file: node.source_file,
    project: node.project,
    graph_kind: node.graph_kind,
    trust_level: node.trust_level,
  };
}

function summarizeEdge(edge: GraphEdge): EdgeSummary {
  return {
    id: edge.id,
    from_id: edge.from_id,
    to_id: edge.to_id,
    type: edge.type,
    graph_kind: edge.graph_kind,
    trust_level: edge.trust_level,
  };
}

function isCallEdge(edge: GraphEdge): boolean {
  return edge.workspace !== undefined && CALL_EDGE_TYPES.has(edge.type);
}

function isNonAuthoritative(edge: GraphEdge): boolean {
  return edge.graph_kind !== 'canonical'
    || edge.trust_level !== 'AUTHORITATIVE'
    || edge.confidence_band !== 'AUTHORITATIVE';
}

function sortByNeighbor(edges: GraphEdge[], store: TraceNodeFlowStore, direction: 'upstream' | 'downstream'): GraphEdge[] {
  return [...edges].sort((a, b) => {
    const aNode = store.getNode(direction === 'upstream' ? a.from_id : a.to_id);
    const bNode = store.getNode(direction === 'upstream' ? b.from_id : b.to_id);
    const aKey = `${aNode?.label ?? ''}\0${aNode?.id ?? ''}\0${a.id}`;
    const bKey = `${bNode?.label ?? ''}\0${bNode?.id ?? ''}\0${b.id}`;
    return aKey.localeCompare(bKey);
  });
}

function traceLane(
  store: TraceNodeFlowStore,
  startNode: GraphNode,
  direction: 'upstream' | 'downstream',
  options: TraceNodeFlowOptions,
): { lane: TraceLane; hasNonAuthoritativeEdges: boolean } {
  const queue: QueueItem[] = [{ nodeId: startNode.id, depth: 0 }];
  const visited = new Set<string>([startNode.id]);
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  let depthReached = 0;
  let truncated = false;
  let hasNonAuthoritativeEdges = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    depthReached = Math.max(depthReached, current.depth);
    if (current.depth >= options.maxDepth) continue;

    const rawEdges = direction === 'upstream'
      ? store.getEdgesTo(current.nodeId)
      : store.getEdgesFrom(current.nodeId);
    const nextEdges = sortByNeighbor(
      rawEdges.filter((edge) => edge.workspace === options.workspaceId && isCallEdge(edge)),
      store,
      direction,
    );

    for (const edge of nextEdges) {
      const nextNodeId = direction === 'upstream' ? edge.from_id : edge.to_id;
      const nextNode = store.getNode(nextNodeId);
      if (!nextNode || nextNode.workspace !== options.workspaceId) continue;

      edges.set(edge.id, edge);
      if (isNonAuthoritative(edge)) hasNonAuthoritativeEdges = true;

      if (visited.has(nextNodeId)) continue;
      if (nodes.size >= options.maxNodes) {
        truncated = true;
        continue;
      }

      visited.add(nextNodeId);
      nodes.set(nextNodeId, nextNode);
      queue.push({ nodeId: nextNodeId, depth: current.depth + 1 });
    }
  }

  return {
    lane: {
      nodes: [...nodes.values()].map(summarizeNode),
      edges: [...edges.values()].map(summarizeEdge),
      depthReached,
      truncated,
    },
    hasNonAuthoritativeEdges,
  };
}

export function traceNodeFlow(
  store: TraceNodeFlowStore,
  target: GraphNode,
  options: TraceNodeFlowOptions,
): TraceNodeFlowResult {
  const factorCodes: Array<{ code: string; value?: number | string }> = [];
  let hasNonAuthoritativeEdges = false;
  const result: TraceNodeFlowResult = {
    target: summarizeNode(target),
    factorCodes,
  };

  if (options.direction === 'upstream' || options.direction === 'both') {
    const traced = traceLane(store, target, 'upstream', options);
    result.upstream = traced.lane;
    hasNonAuthoritativeEdges ||= traced.hasNonAuthoritativeEdges;
  }

  if (options.direction === 'downstream' || options.direction === 'both') {
    const traced = traceLane(store, target, 'downstream', options);
    result.downstream = traced.lane;
    hasNonAuthoritativeEdges ||= traced.hasNonAuthoritativeEdges;
  }

  if (hasNonAuthoritativeEdges) {
    factorCodes.push({ code: 'NON_AUTHORITATIVE_EDGES_INCLUDED' });
  }

  return result;
}

