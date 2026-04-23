/**
 * Graph Sidecar Foundation Contracts
 * P0 Frozen Shapes - DO NOT MODIFY without policy review.
 */

export type GraphKind = 'canonical' | 'exploratory';

export type GraphConfidence = 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export interface GraphProvenance {
    workspaceId: string;
    artifactSource: string; // e.g., 'validated_fact', 'verified_workspace_relation'
    producerStage: string;  // e.g., 'validate', 'verify', 'build_exploratory'
    sourceFile?: string;
    sourceLocation?: {
        lineStart?: number;
        lineEnd?: number;
    };
}

export interface GraphNode {
    id: string;
    label: string;
    type: string;
    graphKind: GraphKind;
    confidence: GraphConfidence;
    provenance: GraphProvenance;
    // Optional legacy fields for component compatibility if needed
    metadata?: Record<string, any>;
}

export interface GraphEdge {
    from: string;
    to: string;
    type: string;
    graphKind: GraphKind;
    confidence: GraphConfidence;
    provenance: GraphProvenance;
    metadata?: Record<string, any>;
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

export interface GraphPathResult {
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
    | 'GRAPH_STRUCTURE_INCOMPLETE';

export interface GraphErrorResponse {
    error: string;
    code: GraphErrorCode;
    message: string;
    workspaceId?: string;
    mode?: string;
    artifact?: string;
    warnings?: string[];
}
