import type { ReasoningPath } from '../../types.js';
import { EdgePolicyTable } from './EdgePolicyTable.js';

export class PathSelector {
    /**
     * Selection strategy for choosing the most authoritative path.
     * Prefers paths with:
     * 1. Higher overall trust level
     * 2. Lower aggregate weight (shorter/stronger paths)
     * 3. Fewer non-authoritative edges
     */
    static selectBestPath(paths: ReasoningPath[]): ReasoningPath | undefined {
        if (paths.length === 0) return undefined;

        return paths.sort((a, b) => {
            // 1. Level priority: AUTHORITATIVE > DERIVED > EXPLORATORY
            const trustOrder = { AUTHORITATIVE: 0, DERIVED: 1, MIXED: 2, EXPLORATORY: 3 };
            const aLevel = trustOrder[a.trust_level] ?? 4;
            const bLevel = trustOrder[b.trust_level] ?? 4;
            if (aLevel !== bLevel) return aLevel - bLevel;

            // 2. Weight priority (Dijkstra-style aggregate cost)
            const aWeight = this.calculateTotalWeight(a);
            const bWeight = this.calculateTotalWeight(b);
            if (aWeight !== bWeight) return aWeight - bWeight;

            // 3. Length priority (shorter is better for identical weights)
            return a.edges.length - b.edges.length;
        })[0];
    }

    private static calculateTotalWeight(path: ReasoningPath): number {
        return path.edges.reduce((sum, edge) => sum + EdgePolicyTable.getEdgeWeight(edge), 0);
    }
}
