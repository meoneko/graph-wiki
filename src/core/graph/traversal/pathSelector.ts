import type { ReasoningPath, DecisionStatus, GraphKind } from '../../types.js';
import { EdgePolicyTable } from './EdgePolicyTable.js';

export interface PathSelectionResult {
    selected: ReasoningPath[];
    rejected: ReasoningPath[];
    status: DecisionStatus;
}

export class PathSelector {
    /**
     * Pessimistic status aggregation precedence (highest severity first).
     * POLICY_VIOLATION > INSUFFICIENT_EVIDENCE > AMBIGUOUS > EXPLORATORY_ONLY > PARTIAL > OK
     *
     * @see Requirements 8.7
     */
    private static readonly STATUS_PRECEDENCE: DecisionStatus[] = [
        'POLICY_VIOLATION',
        'INSUFFICIENT_EVIDENCE',
        'AMBIGUOUS',
        'EXPLORATORY_ONLY',
        'PARTIAL',
        'OK',
    ];

    /**
     * Selection strategy for choosing the most authoritative path.
     * Uses the deterministic priority order defined in Requirements 8.5:
     * 1. Prefer canonical-plus-derived-only paths (no exploratory nodes/edges)
     * 2. Prefer shorter paths (fewer edges)
     * 3. Prefer higher-confidence paths (lower aggregate weight)
     * 4. Lexicographic ordering by node IDs as final tie-breaker
     *
     * @see Requirements 8.5
     */
    static selectBestPath(paths: ReasoningPath[]): ReasoningPath | undefined {
        if (paths.length === 0) return undefined;

        return [...paths].sort((a, b) => this.comparePaths(a, b))[0];
    }

    /**
     * Selects the best path(s) and returns rejected ones with overall status.
     * When conflict is detected among top paths, returns AMBIGUOUS with both reasoning traces.
     *
     * @see Requirements 8.5, 8.6, 8.7
     */
    static selectPaths(paths: ReasoningPath[]): PathSelectionResult {
        if (paths.length === 0) {
            return { selected: [], rejected: [], status: 'INSUFFICIENT_EVIDENCE' };
        }

        // Sort all paths by deterministic priority
        const sorted = [...paths].sort((a, b) => this.comparePaths(a, b));

        // Detect conflict among paths
        if (this.detectConflict(sorted)) {
            // When conflicting, return all paths as selected with AMBIGUOUS status
            // per Requirement 8.6: return AMBIGUOUS with both reasoning traces
            return {
                selected: sorted,
                rejected: [],
                status: 'AMBIGUOUS',
            };
        }

        // No conflict: select the best path, reject the rest
        const best = sorted[0];
        if (!best) {
            return { selected: [], rejected: [], status: 'INSUFFICIENT_EVIDENCE' };
        }
        const selected: ReasoningPath[] = [best];
        const rejected = sorted.slice(1);

        // Aggregate status pessimistically across selected paths
        const status = this.aggregateStatus(selected);

        return { selected, rejected, status };
    }

    /**
     * Pessimistic status aggregation across paths.
     * Returns the worst (highest-precedence) status found among the given paths.
     *
     * Precedence: POLICY_VIOLATION > INSUFFICIENT_EVIDENCE > AMBIGUOUS > EXPLORATORY_ONLY > PARTIAL > OK
     *
     * @see Requirements 8.7
     */
    static aggregateStatus(paths: ReasoningPath[]): DecisionStatus {
        if (paths.length === 0) return 'INSUFFICIENT_EVIDENCE';

        let worstIndex = this.STATUS_PRECEDENCE.length - 1; // Start at OK (least severe)

        for (const path of paths) {
            const idx = this.STATUS_PRECEDENCE.indexOf(path.status);
            if (idx !== -1 && idx < worstIndex) {
                worstIndex = idx;
            }
        }

        return this.STATUS_PRECEDENCE[worstIndex] ?? 'INSUFFICIENT_EVIDENCE';
    }

    /**
     * Detects conflict among paths.
     * Conflict exists when:
     * - Multiple paths lead to different terminal nodes (different conclusions)
     * - Multiple paths have contradictory trust levels (e.g., AUTHORITATIVE vs EXPLORATORY)
     *
     * @see Requirements 8.6
     */
    static detectConflict(paths: ReasoningPath[]): boolean {
        if (paths.length < 2) return false;

        // Check for different terminal nodes (different conclusions)
        const terminalNodes = new Set<string>();
        for (const path of paths) {
            if (path.nodes.length > 0) {
                const lastNode = path.nodes[path.nodes.length - 1];
                if (lastNode) {
                    terminalNodes.add(lastNode.id);
                }
            }
        }
        if (terminalNodes.size > 1) return true;

        // Check for contradictory trust levels
        const trustLevels = new Set(paths.map(p => p.trust_level));
        // Contradictory = one path is AUTHORITATIVE and another is EXPLORATORY
        if (trustLevels.has('AUTHORITATIVE') && trustLevels.has('EXPLORATORY')) return true;

        return false;
    }

    /**
     * Deterministic path comparison implementing the priority order from Requirements 8.5:
     * 1. Prefer canonical-plus-derived-only paths (no exploratory nodes/edges)
     * 2. Prefer shorter paths (fewer edges)
     * 3. Prefer higher-confidence paths (lower aggregate weight)
     * 4. Lexicographic ordering by node IDs as final tie-breaker
     */
    private static comparePaths(a: ReasoningPath, b: ReasoningPath): number {
        // 1. Prefer canonical-plus-derived-only paths
        const aCanonicalDerived = this.isCanonicalPlusDerivedOnly(a);
        const bCanonicalDerived = this.isCanonicalPlusDerivedOnly(b);
        if (aCanonicalDerived !== bCanonicalDerived) {
            return aCanonicalDerived ? -1 : 1;
        }

        // 2. Prefer shorter paths (fewer edges)
        if (a.edges.length !== b.edges.length) {
            return a.edges.length - b.edges.length;
        }

        // 3. Prefer higher-confidence paths (lower aggregate weight)
        const aWeight = this.calculateTotalWeight(a);
        const bWeight = this.calculateTotalWeight(b);
        if (aWeight !== bWeight) {
            return aWeight - bWeight;
        }

        // 4. Lexicographic ordering by node IDs as final tie-breaker
        const aNodeIds = a.nodes.map(n => n.id).join('|');
        const bNodeIds = b.nodes.map(n => n.id).join('|');
        return aNodeIds.localeCompare(bNodeIds);
    }

    /**
     * Returns true if all nodes and edges in the path are canonical or derived (no exploratory).
     */
    private static isCanonicalPlusDerivedOnly(path: ReasoningPath): boolean {
        const allowedKinds: GraphKind[] = ['canonical', 'derived'];

        for (const node of path.nodes) {
            if (!allowedKinds.includes(node.graph_kind)) return false;
        }
        for (const edge of path.edges) {
            if (!allowedKinds.includes(edge.graph_kind)) return false;
        }
        return true;
    }

    private static calculateTotalWeight(path: ReasoningPath): number {
        return path.edges.reduce((sum, edge) => sum + EdgePolicyTable.getEdgeWeight(edge), 0);
    }
}
