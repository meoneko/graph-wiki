import type {
    GraphEdge,
    GraphNode,
    QueryMode,
    QueryResult,
    ReasoningPath
} from '../../types.js';
import { GraphArtifactLoader } from './GraphArtifactLoader.js';
import { TrustAwareTraversal } from '../traversal/TrustAwareTraversal.js';
import { PathSelector } from '../traversal/pathSelector.js';
import { EdgePolicyTable } from '../traversal/EdgePolicyTable.js';
import { ReasoningTrace } from './ReasoningTrace.js';
import { TrustEventEmitter } from '../../observability/TrustEventEmitter.js';

export class TrustAwareQueryEngine {
    private readonly emitter = TrustEventEmitter.getInstance();

    constructor(private readonly workspaceId: string, private readonly loader: GraphArtifactLoader) { }

    /**
     * The primary trust-aware entrypoint for finding reasoning paths between nodes.
     * This is the "Chokepoint" that prevents reasoning bypasses.
     */
    async findReasoningPaths(fromId: string, toId: string, mode: QueryMode): Promise<QueryResult> {
        this.emitter.emitTrustEvent({
            workspaceId: this.workspaceId,
            timestamp: new Date().toISOString(),
            mode,
            type: 'TRUST_REASONING_START',
            message: `Starting trust-aware reasoning from ${fromId} to ${toId}`,
        });

        const artifacts = await this.loader.load(this.workspaceId);
        const traversal = new TrustAwareTraversal(artifacts);
        const trace = new ReasoningTrace(this.workspaceId, mode);

        // 1. Path Discovery
        const allPaths = await traversal.findPaths(fromId, toId, mode);
        allPaths.forEach(p => {
            trace.logDiscovered(p);
            this.emitter.emitTrustEvent({
                workspaceId: this.workspaceId,
                timestamp: new Date().toISOString(),
                mode,
                type: 'PATH_DISCOVERED',
                message: `Discovered path with trust: ${p.trust_level}`,
                meta: { pathId: p.path_id, trust: p.trust_level },
            });
        });

        if (allPaths.length === 0) {
            this.emitter.emitTrustEvent({
                workspaceId: this.workspaceId,
                timestamp: new Date().toISOString(),
                mode,
                type: 'TRUST_REASONING_FAILURE',
                message: 'No valid paths found under current trust policy',
            });
            return this.emptyResult('INSUFFICIENT_EVIDENCE', ['NO_VALID_PATHS_UNDER_CURRENT_TRUST_POLICY'], trace);
        }

        // 2. Path Selection (Auth-first strategy)
        const bestPath = PathSelector.selectBestPath(allPaths);
        const rejectedPaths = allPaths.filter(p => p !== bestPath);
        rejectedPaths.forEach(p => trace.logRejected(p, 'REPLACED_BY_MORE_AUTHORITATIVE_PATH'));

        if (!bestPath) {
            return this.emptyResult('AMBIGUOUS', ['CONFLICTING_PATHS_WITHOUT_CLEAR_AUTHORITY'], trace);
        }

        this.emitter.emitTrustEvent({
            workspaceId: this.workspaceId,
            timestamp: new Date().toISOString(),
            mode,
            type: 'TRUST_REASONING_SUCCESS',
            message: `Reasoning successful. Best path trust: ${bestPath.trust_level}`,
            meta: { trust: bestPath.trust_level },
        });

        // 3. Construct Final Result
        return {
            status: bestPath.status,
            reasoning: {
                selected_paths: [bestPath],
                rejected_paths: rejectedPaths.slice(0, 5),
                selection_explanation: [
                    `Selected most authoritative path with trust level: ${bestPath.trust_level}`,
                    `Filtered ${allPaths.length - 1} other paths based on trust policy.`
                ],
            },
            data: {
                nodes: bestPath.nodes,
                edges: bestPath.edges,
            },
            confidence: {
                level: bestPath.trust_level === 'AUTHORITATIVE' ? 'HIGH' : (bestPath.trust_level === 'DERIVED' ? 'MEDIUM' : 'LOW'),
                reasons: [`Path trust level: ${bestPath.trust_level}`],
            },
            provenance: {
                sources: bestPath.nodes.map(n => n.provenance),
            },
            warnings: mode === 'authoritative' && bestPath.trust_level !== 'AUTHORITATIVE' ? ['RESULT_BELOW_REQUESTED_TRUST_LEVEL'] : [],
            codes: [],
            metadata: { trace: trace.getSummary() } as any,
        };
    }

    /**
     * Impact analysis with trust pruning.
     */
    async analyzeImpact(nodeId: string, mode: QueryMode, depth = 3): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
        const artifacts = await this.loader.load(this.workspaceId);
        const nodes = new Map<string, GraphNode>();
        const edges = new Map<string, GraphEdge>();
        const queue: Array<{ id: string; d: number }> = [{ id: nodeId, d: 0 }];
        const visited = new Set<string>([nodeId]);

        const root = artifacts.index.nodeById[nodeId];
        if (root && EdgePolicyTable.isNodeVisible(root, mode)) nodes.set(nodeId, root);

        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (cur.d >= depth) continue;

            const outgoing = artifacts.index.edgesBySource[cur.id] ?? [];
            for (const edgeId of outgoing) {
                const edge = artifacts.index.edgeById[edgeId];
                if (!edge || !EdgePolicyTable.isEdgeTraversable(edge, mode)) continue;

                const next = artifacts.index.nodeById[edge.to_id];
                if (next && EdgePolicyTable.isNodeVisible(next, mode)) {
                    edges.set(edge.id, edge);
                    nodes.set(next.id, next);
                    if (!visited.has(next.id)) {
                        visited.add(next.id);
                        queue.push({ id: next.id, d: cur.d + 1 });
                    }
                }
            }
        }

        return { nodes: [...nodes.values()], edges: [...edges.values()] };
    }

    private emptyResult(status: any, warnings: string[], trace?: ReasoningTrace): QueryResult {
        return {
            status,
            reasoning: { selected_paths: [], selection_explanation: [] },
            data: { nodes: [], edges: [] },
            confidence: { level: 'LOW', reasons: ['NO_EVIDENCE_FOUND'] },
            provenance: { sources: [] },
            warnings,
            codes: [],
            metadata: trace ? { trace: trace.getSummary() } : undefined,
        } as any;
    }
}
