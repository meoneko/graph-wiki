import type { GraphEdge, GraphNode } from '../../types.js';
import type { GraphMeta } from '../contracts.js';
import { GraphDB } from '../../../storage/GraphDB.js';

export interface LoadedGraphArtifacts {
  canonical: { nodes: GraphNode[]; edges: GraphEdge[] };
  exploratory: { nodes: GraphNode[]; edges: GraphEdge[] };
  index: {
    nodeById: Record<string, GraphNode>;
    edgeById: Record<string, GraphEdge>;
    adjacency: Record<string, string[]>;
    edgesBySource: Record<string, string[]>;
    edgesByTarget: Record<string, string[]>;
    labelLookup: Record<string, string[]>;
    typeLookup: Record<string, string[]>;
  };
  meta: GraphMeta;
}

function pushMap(map: Record<string, string[]>, key: string, val: string): void {
  if (!map[key]) map[key] = [];
  map[key].push(val);
}

export class GraphArtifactLoader {
  private cache = new Map<string, { artifacts: LoadedGraphArtifacts; loadedAt: number }>();
  private CACHE_TTL = 1000 * 60 * 5;

  constructor(private readonly db: GraphDB) {}

  async load(workspaceId: string): Promise<LoadedGraphArtifacts> {
    const cached = this.cache.get(workspaceId);
    if (cached && Date.now() - cached.loadedAt < this.CACHE_TTL) return cached.artifacts;

    const canonicalNodes = this.db.getNodesByWorkspace(workspaceId, 'canonical');
    const exploratoryNodes = this.db.getNodesByWorkspace(workspaceId, 'exploratory');
    const allEdges = this.db.getEdgesByWorkspace(workspaceId);
    const canonicalEdges = allEdges.filter((e) => e.graph_kind === 'canonical');
    const exploratoryEdges = allEdges.filter((e) => e.graph_kind === 'exploratory');

    const nodeById: Record<string, GraphNode> = {};
    const edgeById: Record<string, GraphEdge> = {};
    const adjacency: Record<string, string[]> = {};
    const edgesBySource: Record<string, string[]> = {};
    const edgesByTarget: Record<string, string[]> = {};
    const labelLookup: Record<string, string[]> = {};
    const typeLookup: Record<string, string[]> = {};

    [...canonicalNodes, ...exploratoryNodes].forEach((n) => {
      nodeById[n.id] = n;
      pushMap(labelLookup, n.label.toLowerCase(), n.id);
      pushMap(typeLookup, n.type, n.id);
    });

    allEdges.forEach((e) => {
      edgeById[e.id] = e;
      pushMap(edgesBySource, e.from_id, e.id);
      pushMap(edgesByTarget, e.to_id, e.id);
      pushMap(adjacency, e.from_id, e.to_id);
    });

    const meta: GraphMeta = {
      workspaceId,
      builtAt: new Date().toISOString(),
      graphVersion: '1.0.0',
      canonical: { nodeCount: canonicalNodes.length, edgeCount: canonicalEdges.length, confidenceCounts: {} },
      exploratory: { nodeCount: exploratoryNodes.length, edgeCount: exploratoryEdges.length, confidenceCounts: {} },
      traversalReady: allEdges.length > 0,
      connectivity: allEdges.length === 0 ? 0 : Number((allEdges.length / Math.max(1, canonicalNodes.length)).toFixed(3)),
    };

    const artifacts: LoadedGraphArtifacts = {
      canonical: { nodes: canonicalNodes, edges: canonicalEdges },
      exploratory: { nodes: exploratoryNodes, edges: exploratoryEdges },
      index: { nodeById, edgeById, adjacency, edgesBySource, edgesByTarget, labelLookup, typeLookup },
      meta,
    };

    this.cache.set(workspaceId, { artifacts, loadedAt: Date.now() });
    return artifacts;
  }

  clearCache(workspaceId?: string): void {
    if (workspaceId) this.cache.delete(workspaceId);
    else this.cache.clear();
  }
}
