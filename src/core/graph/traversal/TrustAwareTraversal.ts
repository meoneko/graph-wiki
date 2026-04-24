import type { GraphEdge, GraphNode, QueryMode, ReasoningPath, TrustLevel } from '../../types.js';
import type { LoadedGraphArtifacts } from '../query/GraphArtifactLoader.js';
import { EdgePolicyTable } from './EdgePolicyTable.js';

export class TrustAwareTraversal {
    constructor(private readonly artifacts: LoadedGraphArtifacts) { }

    /**
     * Finds all reachable paths between two nodes that satisfy the trust policy.
     * Uses a modified BFS to find multiple paths for selection.
     */
    async findPaths(fromId: string, toId: string, mode: QueryMode, maxHops = 6): Promise<ReasoningPath[]> {
        const startNode = this.artifacts.index.nodeById[fromId];
        const endNode = this.artifacts.index.nodeById[toId];

        if (!startNode || !endNode || !EdgePolicyTable.isNodeVisible(startNode, mode) || !EdgePolicyTable.isNodeVisible(endNode, mode)) {
            return [];
        }

        const paths: ReasoningPath[] = [];
        const queue: Array<{ currentId: string; path: string[]; edges: string[] }> = [
            { currentId: fromId, path: [fromId], edges: [] }
        ];

        while (queue.length > 0) {
            const { currentId, path, edges } = queue.shift()!;

            if (path.length > maxHops) continue;

            if (currentId === toId) {
                paths.push(this.reconstructPath(path, edges));
                continue;
            }

            const outgoing = this.artifacts.index.edgesBySource[currentId] ?? [];
            for (const edgeId of outgoing) {
                const edge = this.artifacts.index.edgeById[edgeId];
                if (!edge || !EdgePolicyTable.isEdgeTraversable(edge, mode)) continue;

                const nextNodeId = edge.to_id;
                const nextNode = this.artifacts.index.nodeById[nextNodeId];
                if (!nextNode || !EdgePolicyTable.isNodeVisible(nextNode, mode) || path.includes(nextNodeId)) continue;

                queue.push({
                    currentId: nextNodeId,
                    path: [...path, nextNodeId],
                    edges: [...edges, edgeId],
                });
            }
        }

        return paths;
    }

    private reconstructPath(nodeIds: string[], edgeIds: string[]): ReasoningPath {
        const nodes = nodeIds.map(id => this.artifacts.index.nodeById[id]!);
        const edges = edgeIds.map(id => this.artifacts.index.edgeById[id]!);

        // Determine overall trust level of the path
        const confidenceBands = new Set([...nodes.map(n => n.confidence_band), ...edges.map(e => e.confidence_band)]);
        let trust_level: TrustLevel = 'AUTHORITATIVE';

        if (confidenceBands.has('AMBIGUOUS')) trust_level = 'EXPLORATORY';
        else if (confidenceBands.has('INFERRED')) trust_level = 'MIXED';
        else if (confidenceBands.has('EXTRACTED')) trust_level = 'DERIVED';

        return {
            path_id: `path:${nodeIds[0]}:${nodeIds.at(-1)}:${Math.random().toString(36).slice(2, 7)}`,
            nodes,
            edges,
            trust_level,
            status: trust_level === 'EXPLORATORY' ? 'AMBIGUOUS' : 'OK',
            summary: `Path via ${nodes.length} nodes from ${nodes[0]?.label ?? 'unknown'} to ${nodes.at(-1)?.label ?? 'unknown'}`,
        };
    }
}
