import type { GraphEdge, GraphNode } from '../../types.js';
import type { GraphMeta } from '../contracts.js';
import { GraphDB } from '../../../storage/GraphDB.js';
import { GraphValidator, type ValidationIssue } from '../validation/GraphValidator.js';
import { GovernanceValidator, type GovernanceIssue } from '../validation/GovernanceValidator.js';

export class GraphValidationError extends Error {
  readonly codes: string[];

  constructor(
    readonly validationIssues: ValidationIssue[],
    readonly governanceIssues: GovernanceIssue[],
  ) {
    const codes = [...validationIssues.map((issue) => issue.code), ...governanceIssues.map((issue) => issue.code)];
    super(`INVALID_GRAPH_STATE: ${[...new Set(codes)].join(', ')}`);
    this.name = 'GraphValidationError';
    this.codes = [...new Set(codes)];
  }
}

export interface LoadedGraphArtifacts {
  canonical: { nodes: GraphNode[]; edges: GraphEdge[] };
  derived: { nodes: GraphNode[]; edges: GraphEdge[] };
  exploratory: { nodes: GraphNode[]; edges: GraphEdge[] };
  external: { nodes: GraphNode[]; edges: GraphEdge[] };
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

  constructor(private readonly db: GraphDB) { }

  async load(workspaceId: string): Promise<LoadedGraphArtifacts> {
    const cached = this.cache.get(workspaceId);
    if (cached && Date.now() - cached.loadedAt < this.CACHE_TTL) return cached.artifacts;

    const canonicalNodes = this.db.getNodesByWorkspace(workspaceId, 'canonical');
    const derivedNodes = this.db.getNodesByWorkspace(workspaceId, 'derived');
    const exploratoryNodes = this.db.getNodesByWorkspace(workspaceId, 'exploratory');
    const externalNodes = this.db.getNodesByWorkspace(workspaceId, 'external');

    const allEdges = this.db.getEdgesByWorkspace(workspaceId);
    const canonicalEdges = allEdges.filter((e) => e.graph_kind === 'canonical');
    const derivedEdges = allEdges.filter((e) => e.graph_kind === 'derived');
    const exploratoryEdges = allEdges.filter((e) => e.graph_kind === 'exploratory');
    const externalEdges = allEdges.filter((e) => e.graph_kind === 'external');

    const nodeById: Record<string, GraphNode> = {};
    const edgeById: Record<string, GraphEdge> = {};
    const adjacency: Record<string, string[]> = {};
    const edgesBySource: Record<string, string[]> = {};
    const edgesByTarget: Record<string, string[]> = {};
    const labelLookup: Record<string, string[]> = {};
    const typeLookup: Record<string, string[]> = {};

    [...canonicalNodes, ...derivedNodes, ...exploratoryNodes, ...externalNodes].forEach((n) => {
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

    const canonicalDensity = canonicalNodes.length <= 1
      ? 0
      : Number((canonicalEdges.length / (canonicalNodes.length * (canonicalNodes.length - 1))).toFixed(6));

    const meta: GraphMeta = {
      workspaceId,
      builtAt: new Date().toISOString(),
      graphVersion: '1.1.0',
      canonical: { nodeCount: canonicalNodes.length, edgeCount: canonicalEdges.length, confidenceCounts: {} },
      exploratory: { nodeCount: exploratoryNodes.length, edgeCount: exploratoryEdges.length, confidenceCounts: {} },
      traversalReady: allEdges.length > 0,
      connectivity: canonicalDensity,
    };

    const artifacts: LoadedGraphArtifacts = {
      canonical: { nodes: canonicalNodes, edges: canonicalEdges },
      derived: { nodes: derivedNodes, edges: derivedEdges },
      exploratory: { nodes: exploratoryNodes, edges: exploratoryEdges },
      external: { nodes: externalNodes, edges: externalEdges },
      index: { nodeById, edgeById, adjacency, edgesBySource, edgesByTarget, labelLookup, typeLookup },
      meta,
    };

    const allNodes = [...canonicalNodes, ...derivedNodes, ...exploratoryNodes, ...externalNodes];
    const graphValidation = GraphValidator.validate(allNodes, allEdges, {
      externalWorkflowEnabled: false,
    });
    const governanceValidation = GovernanceValidator.validate(allNodes, allEdges);
    if (!graphValidation.passed || !governanceValidation.passed) {
      throw new GraphValidationError(graphValidation.issues, governanceValidation.issues);
    }

    this.cache.set(workspaceId, { artifacts, loadedAt: Date.now() });
    return artifacts;
  }

  clearCache(workspaceId?: string): void {
    if (workspaceId) this.cache.delete(workspaceId);
    else this.cache.clear();
  }
}
