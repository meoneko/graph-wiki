import type { ConfidenceBand, GraphEdge, GraphNode, QueryMode, OperationType } from '../../types.js';
import { EdgeType } from '../../types.js';

export interface TrustPolicy {
    allowedConfidenceBands: ConfidenceBand[];
    requireStrictProvenance: boolean;
}

export interface PolicyContext {
    operation: OperationType;
    mode: QueryMode;
    currentExploratoryHops?: number;
    allowImportPropagation?: boolean;
}

export interface PolicyDecision {
    allowed: boolean;
    codes: string[];
    warnings: string[];
    reason?: string;
}

export class EdgePolicyTable {
    private static readonly VALID_EDGE_TYPES = new Set<string>(Object.values(EdgeType));

    private static readonly POLICIES: Record<QueryMode, TrustPolicy> = {
        authoritative: {
            allowedConfidenceBands: ['AUTHORITATIVE'],
            requireStrictProvenance: true,
        },
        mixed_safe: {
            allowedConfidenceBands: ['AUTHORITATIVE', 'EXTRACTED', 'INFERRED', 'AMBIGUOUS'],
            requireStrictProvenance: false,
        },
        exploratory: {
            allowedConfidenceBands: ['AUTHORITATIVE', 'EXTRACTED', 'INFERRED', 'AMBIGUOUS'],
            requireStrictProvenance: false,
        },
    };

    static isNodeVisible(node: GraphNode, context: { operation: OperationType; mode: QueryMode }): boolean {
        const { mode } = context;
        const policy = this.POLICIES[mode];
        if (!policy.allowedConfidenceBands.includes(node.confidence_band)) return false;

        if (mode === 'authoritative') {
            return node.graph_kind === 'canonical'
                && node.confidence_band === 'AUTHORITATIVE'
                && node.provenance?.source === 'parser';
        }

        if (mode === 'mixed_safe') {
            return node.graph_kind === 'canonical' || node.graph_kind === 'derived';
        }

        return true;
    }

    static evaluateEdge(edge: GraphEdge, context: PolicyContext): PolicyDecision {
        const { operation, mode, currentExploratoryHops = 0, allowImportPropagation = false } = context;
        const policy = this.POLICIES[mode];
        const decision: PolicyDecision = { allowed: true, codes: [], warnings: [] };

        // 1. Basic confidence check (Hard ceiling)
        if (!policy.allowedConfidenceBands.includes(edge.confidence_band)) {
            return { allowed: false, codes: ['CONFIDENCE_BAND_NOT_ALLOWED'], warnings: [], reason: `Confidence band ${edge.confidence_band} not allowed in ${mode} mode` };
        }

        // Authoritative reasoning may only traverse parser-backed canonical edges.
        if (policy.requireStrictProvenance && (edge.graph_kind !== 'canonical' || edge.provenance?.source !== 'parser')) {
            return {
                allowed: false,
                codes: ['CANONICAL_PROVENANCE_MISSING'],
                warnings: [],
                reason: 'Authoritative traversal requires canonical parser-backed edges',
            };
        }

        // 1b. External layer gate — external edges are never allowed in authoritative or mixed_safe
        if (edge.graph_kind === 'external' && (mode === 'authoritative' || mode === 'mixed_safe')) {
            return { allowed: false, codes: ['EXTERNAL_WORKFLOW_DISABLED'], warnings: [], reason: `External edges cannot be used in ${mode} reasoning` };
        }

        // 2. Edge type taxonomy check (global guard — before any operation-specific allow logic)
        if (!this.VALID_EDGE_TYPES.has(edge.type)) {
            return { allowed: false, codes: ['INVALID_EDGE_TYPE'], warnings: [], reason: `Edge type '${edge.type}' is not in the standard taxonomy` };
        }

        // 3. Operation-specific logic
        switch (operation) {
            case 'governance':
                if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') {
                    return { allowed: false, codes: ['GOVERNANCE_REQUIRES_AUTHORITY'], warnings: [], reason: 'Governance requires canonical or derived edges' };
                }
                if (!['uses_authority', 'node_uses_authority', 'depends_on_authority'].includes(edge.type)) {
                    return { allowed: false, codes: ['EDGE_TYPE_NOT_ALLOWED_FOR_GOVERNANCE'], warnings: [], reason: `Edge type ${edge.type} not allowed for governance` };
                }
                break;

            case 'impact':
                // Control-flow only
                const isControlFlow = ['calls', 'invokes', 'dispatches_to', 'triggers'].includes(edge.type);
                const isImport = edge.type === 'imports';
                if (!isControlFlow && !(isImport && allowImportPropagation)) {
                    return { allowed: false, codes: ['IMPACT_REQUIRES_CONTROL_FLOW'], warnings: [], reason: `Edge type ${edge.type} not suitable for impact analysis` };
                }
                if (mode === 'authoritative' && edge.graph_kind === 'exploratory') {
                    return { allowed: false, codes: ['EXPLORATORY_FORBIDDEN_IN_AUTHORITATIVE'], warnings: [], reason: 'Exploratory edges forbidden in authoritative impact' };
                }
                break;

            case 'lineage':
                // Authority-chain
                const isLineageAllowed = ['calls', 'invokes', 'uses_authority', 'node_uses_authority', 'depends_on_authority'].includes(edge.type);
                if (!isLineageAllowed) {
                    return { allowed: false, codes: ['LINEAGE_REQUIRES_AUTHORITY_CHAIN'], warnings: [], reason: `Edge type ${edge.type} not suitable for lineage` };
                }
                if (mode === 'authoritative' && edge.graph_kind === 'exploratory') {
                    return { allowed: false, codes: ['EXPLORATORY_FORBIDDEN_IN_AUTHORITATIVE'], warnings: [], reason: 'Exploratory edges forbidden in authoritative lineage' };
                }
                break;

            case 'wiki':
                if (mode === 'authoritative' && edge.graph_kind === 'exploratory') {
                    return { allowed: false, codes: ['WIKI_AUTHORITATIVE_FORBIDS_EXPLORATORY'], warnings: [], reason: 'Exploratory edges cannot be used as authoritative wiki conclusions' };
                }
                break;

            case 'ask':
                if (mode === 'authoritative' && edge.graph_kind === 'exploratory') {
                    return { allowed: false, codes: ['EXPLORATORY_FORBIDDEN_IN_AUTHORITATIVE'], warnings: [], reason: 'Exploratory edges forbidden in authoritative ask' };
                }
                break;

            default:
                return { allowed: false, codes: ['POLICY_VIOLATION', 'UNKNOWN_OPERATION'], warnings: [], reason: `Unknown operation: ${operation}` };
        }

        // 4. Mixed-safe exploratory bound (after operation switch)
        if (mode === 'mixed_safe') {
            if (edge.graph_kind === 'exploratory') {
                if (currentExploratoryHops >= 2) {
                    return { allowed: false, codes: ['EXPLORATORY_HOP_LIMIT_EXCEEDED'], warnings: [], reason: 'Maximum 2 exploratory hops allowed in mixed_safe mode' };
                }
                decision.warnings.push('EXPLORATORY_USED');
                decision.codes.push('EXPLORATORY_USED');
            } else if (edge.confidence_band === 'AMBIGUOUS') {
                return { allowed: false, codes: ['CONFIDENCE_BAND_NOT_ALLOWED'], warnings: [], reason: 'AMBIGUOUS confidence only allowed for exploratory edges in mixed_safe' };
            }
        }

        return decision;
    }

    /**
     * @deprecated Use evaluateEdge().allowed
     */
    static isEdgeTraversable(edge: GraphEdge, mode: QueryMode): boolean {
        return this.evaluateEdge(edge, { operation: 'ask', mode }).allowed;
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
