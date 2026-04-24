import type { ConfidenceBand, GraphEdge, GraphNode, QueryMode } from '../../types.js';

export interface TrustPolicy {
    allowedConfidenceBands: ConfidenceBand[];
    requireStrictProvenance: boolean;
}

export class EdgePolicyTable {
    private static readonly POLICIES: Record<QueryMode, TrustPolicy> = {
        authoritative: {
            allowedConfidenceBands: ['AUTHORITATIVE'],
            requireStrictProvenance: true,
        },
        mixed_safe: {
            allowedConfidenceBands: ['AUTHORITATIVE', 'EXTRACTED', 'INFERRED'],
            requireStrictProvenance: false,
        },
        exploratory: {
            allowedConfidenceBands: ['AUTHORITATIVE', 'EXTRACTED', 'INFERRED', 'AMBIGUOUS'],
            requireStrictProvenance: false,
        },
    };

    /**
     * Determines if a node is visible under the given query mode.
     */
    static isNodeVisible(node: GraphNode, mode: QueryMode): boolean {
        const policy = this.POLICIES[mode];
        return policy.allowedConfidenceBands.includes(node.confidence_band);
    }

    /**
     * Determines if an edge is traversable under the given query mode.
     */
    static isEdgeTraversable(edge: GraphEdge, mode: QueryMode): boolean {
        const policy = this.POLICIES[mode];

        // Hard ceiling on confidence
        if (!policy.allowedConfidenceBands.includes(edge.confidence_band)) {
            return false;
        }

        // Explictly block certain flows in strict modes
        if (mode === 'authoritative') {
            // In authoritative mode, we only trust control flow and authority edges
            const flow = edge.metadata?.flow_type;
            if (flow && !['control', 'authority', 'contract'].includes(flow)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Gets the "cost" of traversing an edge, used for path ranking.
     * Authoritative edges have lower cost (higher trust).
     */
    static getEdgeWeight(edge: GraphEdge): number {
        switch (edge.confidence_band) {
            case 'AUTHORITATIVE': return 1;
            case 'EXTRACTED': return 2;
            case 'INFERRED': return 5;
            case 'AMBIGUOUS': return 20;
            default: return 100;
        }
    }
}
