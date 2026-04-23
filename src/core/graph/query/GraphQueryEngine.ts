import type { GraphEdge, GraphNode } from '../../types.js';
import type { GraphPathResult, GraphImpactTraversal, GraphLineageResult, GraphLineageTraversalStep, LineageDirection } from '../types.js';
import { GraphArtifactLoader } from './GraphArtifactLoader.js';

export class GraphQueryEngine {
  constructor(private readonly workspaceId: string, private readonly loader: GraphArtifactLoader) {}

  async getNode(id: string): Promise<GraphNode> {
    const artifacts = await this.loader.load(this.workspaceId);
    const node = artifacts.index.nodeById[id];
    if (!node) throw new Error(`NODE_NOT_FOUND: ${id}`);
    return node;
  }

  async getNeighbors(id: string, depth = 1): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const artifacts = await this.loader.load(this.workspaceId);
    const queue: Array<{ id: string; d: number }> = [{ id, d: 0 }];
    const visited = new Set<string>([id]);
    const nodeSet = new Map<string, GraphNode>();
    const edgeSet = new Map<string, GraphEdge>();

    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.d >= depth) continue;
      const edgeIds = artifacts.index.edgesBySource[cur.id] ?? [];
      for (const edgeId of edgeIds) {
        const edge = artifacts.index.edgeById[edgeId];
        if (!edge) continue;
        edgeSet.set(edge.id, edge);
        const next = artifacts.index.nodeById[edge.to_id];
        if (next) {
          nodeSet.set(next.id, next);
          if (!visited.has(next.id)) {
            visited.add(next.id);
            queue.push({ id: next.id, d: cur.d + 1 });
          }
        }
      }
    }

    return { nodes: [...nodeSet.values()], edges: [...edgeSet.values()] };
  }

  async getPath(from: string, to: string): Promise<GraphPathResult> {
    const artifacts = await this.loader.load(this.workspaceId);
    const queue: string[] = [from];
    const visited = new Set<string>([from]);
    const parent = new Map<string, { nodeId: string; edgeId: string }>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === to) break;
      const edgeIds = artifacts.index.edgesBySource[current] ?? [];
      for (const edgeId of edgeIds) {
        const edge = artifacts.index.edgeById[edgeId];
        if (!edge || visited.has(edge.to_id)) continue;
        visited.add(edge.to_id);
        parent.set(edge.to_id, { nodeId: current, edgeId });
        queue.push(edge.to_id);
      }
    }

    if (!parent.has(to)) {
      return { mode: 'authoritative', found: false, nodes: [], edges: [], pathLength: 0, confidenceSummary: { highest: null, lowest: null, containsNonAuthoritative: false }, warnings: ['NO_PATH_FOUND'] };
    }

    const nodeIds: string[] = [to];
    const edges: GraphEdge[] = [];
    let cur = to;
    while (cur !== from) {
      const p = parent.get(cur)!;
      const edge = artifacts.index.edgeById[p.edgeId];
      if (edge) edges.unshift(edge);
      cur = p.nodeId;
      nodeIds.unshift(cur);
    }

    const nodes = nodeIds.map((id) => artifacts.index.nodeById[id]).filter((n): n is GraphNode => Boolean(n));
    const conf = [...nodes.map((n) => n.confidence), ...edges.map((e) => e.confidence)];

    return {
      mode: 'authoritative',
      found: true,
      nodes,
      edges,
      pathLength: Math.max(0, nodeIds.length - 1),
      confidenceSummary: { highest: conf.includes('AUTHORITATIVE') ? 'AUTHORITATIVE' : (conf[0] ?? null), lowest: conf.includes('AMBIGUOUS') ? 'AMBIGUOUS' : (conf.at(-1) ?? null), containsNonAuthoritative: conf.some((c) => c !== 'AUTHORITATIVE') },
      warnings: [],
    };
  }

  async getLineage(nodeId: string, direction: LineageDirection = 'both', depthLimit = 6): Promise<GraphLineageResult> {
    const artifacts = await this.loader.load(this.workspaceId);
    const traversal: GraphLineageTraversalStep[] = [{ nodeId, depth: 0, viaEdgeType: 'ROOT' }];
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId, depth: 0 }];
    const seen = new Set<string>([nodeId]);
    const root = artifacts.index.nodeById[nodeId];
    if (root) nodes.set(root.id, root);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= depthLimit) continue;

      const out = direction === 'upstream' ? [] : artifacts.index.edgesBySource[current.nodeId] ?? [];
      const incoming = direction === 'downstream' ? [] : artifacts.index.edgesByTarget[current.nodeId] ?? [];

      for (const edgeId of [...out, ...incoming]) {
        const edge = artifacts.index.edgeById[edgeId];
        if (!edge) continue;
        edges.set(edge.id, edge);
        const nextId = incoming.includes(edgeId) ? edge.from_id : edge.to_id;
        const nextNode = artifacts.index.nodeById[nextId];
        if (!nextNode) continue;
        nodes.set(nextNode.id, nextNode);

        if (!seen.has(nextId)) {
          seen.add(nextId);
          queue.push({ nodeId: nextId, depth: current.depth + 1 });
          traversal.push({ nodeId: nextId, depth: current.depth + 1, previousNodeId: current.nodeId, viaEdgeType: edge.type });
        }
      }
    }

    return { workspaceId: this.workspaceId, rootNodeId: nodeId, direction, nodes: [...nodes.values()], edges: [...edges.values()], traversal };
  }

  async getImpact(anchorNodeIds: string[], depthLimit = 6): Promise<GraphImpactTraversal> {
    const allNodes = new Map<string, GraphNode>();
    const allEdges = new Map<string, GraphEdge>();
    const traversal: GraphLineageTraversalStep[] = [];

    for (const id of anchorNodeIds) {
      const lineage = await this.getLineage(id, 'downstream', depthLimit);
      lineage.nodes.forEach((n) => allNodes.set(n.id, n));
      lineage.edges.forEach((e) => allEdges.set(e.id, e));
      traversal.push(...lineage.traversal);
    }

    return { workspaceId: this.workspaceId, mode: 'authoritative', anchorNodeIds, nodes: [...allNodes.values()], edges: [...allEdges.values()], traversal, depthLimit, truncated: false };
  }
}
