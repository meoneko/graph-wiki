import type { GraphEdge, GraphNode } from '../types.js';

export type LineageDirection = 'upstream' | 'downstream' | 'both';
export type LineageEdgeClass = 'structural' | 'authority' | 'control' | 'semantic' | 'unknown';

export interface GraphLineageTraversalStep {
  nodeId: string;
  depth: number;
  viaEdgeType: string;
  previousNodeId?: string;
}

export interface GraphLineageResult {
  workspaceId: string;
  rootNodeId: string;
  direction: LineageDirection;
  nodes: GraphNode[];
  edges: GraphEdge[];
  traversal: GraphLineageTraversalStep[];
}

export interface GraphPathResult {
  mode: 'authoritative' | 'exploratory' | 'mixed_safe';
  found: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  pathLength: number;
  confidenceSummary: {
    highest: string | null;
    lowest: string | null;
    containsNonAuthoritative: boolean;
  };
  warnings: string[];
}

export interface GraphImpactTraversal {
  workspaceId: string;
  mode: 'authoritative' | 'exploratory' | 'mixed_safe';
  anchorNodeIds: string[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  traversal: GraphLineageTraversalStep[];
  depthLimit: number;
  truncated: boolean;
}
