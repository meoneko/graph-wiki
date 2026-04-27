import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, QueryMode, ReasoningPath, TrustLevel, OperationType, DecisionStatus } from '../../types.js';
import type { LoadedGraphArtifacts } from '../query/GraphArtifactLoader.js';
import { EdgePolicyTable } from './EdgePolicyTable.js';

export interface DeniedEdgeDecision {
    edgeId: string;
    operation: OperationType;
    mode: QueryMode;
    codes: string[];
    warnings: string[];
    reason?: string;
}

export class TrustAwareTraversal {
    constructor(private readonly artifacts: LoadedGraphArtifacts) { }

    /**
     * Finds all reachable paths between two nodes that satisfy the trust policy.
     * Uses a modified BFS to find multiple paths for selection.
     */
    async findPaths(fromId: string, toId: string, operation: OperationType, mode: QueryMode, maxHops = 6, maxPaths = 50, maxQueue = 5000): Promise<{ paths: ReasoningPath[], deniedEdges: DeniedEdgeDecision[] }> {
        const startNode = this.artifacts.index.nodeById[fromId];
        const endNode = this.artifacts.index.nodeById[toId];

        if (!startNode || !endNode || !EdgePolicyTable.isNodeVisible(startNode, { operation, mode }) || !EdgePolicyTable.isNodeVisible(endNode, { operation, mode })) {
            return { paths: [], deniedEdges: [] };
        }

        const paths: ReasoningPath[] = [];
        const deniedEdges: DeniedEdgeDecision[] = [];
        const queue: Array<{
            currentId: string;
            path: string[];
            edgeIds: string[];
            seen: Set<string>;
            exploratoryHops: number;
            codes: string[];
            warnings: string[];
        }> = [
                {
                    currentId: fromId,
                    path: [fromId],
                    edgeIds: [],
                    seen: new Set([fromId]),
                    exploratoryHops: 0,
                    codes: [],
                    warnings: [],
                }
            ];

        while (queue.length > 0) {
            if (paths.length >= maxPaths || queue.length > maxQueue) break;
            const { currentId, path, edgeIds, seen, exploratoryHops, codes, warnings } = queue.shift()!;

            if (path.length > maxHops) continue;

            if (currentId === toId) {
                paths.push(this.reconstructPath(path, edgeIds, mode, codes, warnings));
                continue;
            }

            const outgoing = this.artifacts.index.edgesBySource[currentId] ?? [];
            for (const edgeId of outgoing) {
                const edge = this.artifacts.index.edgeById[edgeId];
                if (!edge) continue;

                const decision = EdgePolicyTable.evaluateEdge(edge, {
                    operation,
                    mode,
                    currentExploratoryHops: exploratoryHops
                });

                if (!decision.allowed) {
                    deniedEdges.push({
                        edgeId: edge.id,
                        operation,
                        mode,
                        codes: [...decision.codes],
                        warnings: [...decision.warnings],
                        reason: decision.reason
                    });
                    continue;
                }

                const nextNodeId = edge.to_id;
                const nextNode = this.artifacts.index.nodeById[nextNodeId];
                if (!nextNode || !EdgePolicyTable.isNodeVisible(nextNode, { operation, mode }) || seen.has(nextNodeId)) continue;

                const nextExploratoryHops = exploratoryHops + (edge.graph_kind === 'exploratory' ? 1 : 0);

                queue.push({
                    currentId: nextNodeId,
                    path: [...path, nextNodeId],
                    edgeIds: [...edgeIds, edgeId],
                    seen: new Set([...seen, nextNodeId]),
                    exploratoryHops: nextExploratoryHops,
                    codes: [...new Set([...codes, ...decision.codes])],
                    warnings: [...new Set([...warnings, ...decision.warnings])],
                });
            }
        }

        return { paths, deniedEdges };
    }

    private reconstructPath(nodeIds: string[], edgeIds: string[], mode: QueryMode, codes: string[], warnings: string[]): ReasoningPath {
        const nodes = nodeIds.map(id => this.artifacts.index.nodeById[id]!);
        const edges = edgeIds.map(id => this.artifacts.index.edgeById[id]!);

        // Determine overall trust level of the path
        const confidenceBands = new Set([...nodes.map(n => n.confidence_band), ...edges.map(e => e.confidence_band)]);
        let trust_level: TrustLevel = 'AUTHORITATIVE';

        if (confidenceBands.has('AMBIGUOUS')) trust_level = 'EXPLORATORY';
        else if (confidenceBands.has('INFERRED')) trust_level = 'MIXED';
        else if (confidenceBands.has('EXTRACTED')) trust_level = 'DERIVED';

        // Map trust level to decision status
        let status: DecisionStatus = 'OK';
        if (trust_level === 'EXPLORATORY') status = 'AMBIGUOUS';
        if (codes.includes('EXPLORATORY_USED')) status = 'PARTIAL';

        return {
            path_id: `path:${createHash('sha1').update([mode, ...nodeIds, ...edgeIds].join('|')).digest('hex')}`,
            nodes,
            edges,
            trust_level,
            status,
            summary: `Path via ${nodes.length} nodes from ${nodes[0]?.label ?? 'unknown'} to ${nodes.at(-1)?.label ?? 'unknown'}`,
        };
    }
}
