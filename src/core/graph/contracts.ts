/**
 * Graph Sidecar Adapter/View-Model Layer
 * Runtime SOT: src/core/types.ts (per spec §7.1.0).
 */

import {
    GraphKind as CoreGraphKind,
    ConfidenceBand as CoreConfidenceBand,
    Provenance as CoreProvenance,
    GraphNode as CoreGraphNode,
    GraphEdge as CoreGraphEdge,
    DecisionStatus,
    QueryResult,
} from '../types.js';

export type GraphKind = CoreGraphKind;
export type GraphConfidence = CoreConfidenceBand;
export type GraphProvenance = CoreProvenance;

export interface GraphNode extends CoreGraphNode {
    // Aliases for camelCase compat if needed by legacy callers
    graphKind: GraphKind;
}

export interface GraphEdge extends CoreGraphEdge {
    // Aliases for camelCase/legacy compat
    from: string;
    to: string;
    graphKind: GraphKind;
}

export interface GraphIndex {
    nodeById: Record<string, GraphNode>;
    edgeById: Record<string, GraphEdge>;
    adjacency: Record<string, string[]>;
    edgesBySource: Record<string, string[]>;
    edgesByTarget: Record<string, string[]>;
    labelLookup: Record<string, string[]>;
    typeLookup: Record<string, string[]>;
}

export interface GraphMeta {
    workspaceId: string;
    builtAt: string;
    graphVersion: string;
    canonical: {
        nodeCount: number;
        edgeCount: number;
        confidenceCounts: Record<string, number>;
    };
    exploratory: {
        nodeCount: number;
        edgeCount: number;
        confidenceCounts: Record<string, number>;
    };
    sourceFingerprint?: string;
    traversalReady: boolean;
    connectivity?: number;
}

export interface GraphPathResult extends QueryResult {
    // Legacy fields for backward compat
    mode: 'authoritative' | 'exploratory' | 'mixed_safe';
    found: boolean;
    nodes: GraphNode[];
    edges: GraphEdge[];
    pathLength: number;
    confidenceSummary: {
        highest: GraphConfidence | null;
        lowest: GraphConfidence | null;
        containsNonAuthoritative: boolean;
    };
    warnings: string[];
}

export interface GraphTraversalState {
    nodeId: string;
    depth: number;
    viaEdgeType: string;
    previousNodeId?: string;
}

export interface GraphImpactTraversal {
    workspaceId: string;
    mode: 'authoritative' | 'exploratory' | 'mixed_safe';
    anchorNodeIds: string[];
    nodes: GraphNode[];
    edges: GraphEdge[];
    traversal: GraphTraversalState[];
    depthLimit: number;
    truncated: boolean;
}

export type GraphErrorCode =
    | 'GRAPH_ARTIFACT_MISSING'
    | 'INVALID_GRAPH_MODE'
    | 'NODE_NOT_FOUND'
    | 'NO_PATH_FOUND'
    | 'WORKSPACE_SCOPE_MISMATCH'
    | 'GRAPH_QUERY_TIMEOUT'
    | 'GRAPH_RESULT_TRUNCATED'
    | 'GRAPH_STRUCTURE_INCOMPLETE'
    | 'POLICY_VIOLATION'
    | 'AMBIGUOUS_EVIDENCE';

export interface GraphErrorResponse {
    error: string;
    code: GraphErrorCode;
    message: string;
    workspaceId?: string;
    mode?: string;
    artifact?: string;
    warnings?: string[];
}

/**
 * Helper to map core GraphNode to legacy contract GraphNode
 */
export function mapToContractNode(node: CoreGraphNode): GraphNode {
    return {
        ...node,
        graphKind: node.graph_kind,
    };
}

/**
 * Helper to map core GraphEdge to legacy contract GraphEdge
 */
export function mapToContractEdge(edge: CoreGraphEdge): GraphEdge {
    return {
        ...edge,
        from: edge.from_id,
        to: edge.to_id,
        graphKind: edge.graph_kind,
    };
}
