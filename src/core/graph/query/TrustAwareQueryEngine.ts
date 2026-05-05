import type {
    GraphEdge,
    GraphNode,
    QueryMode,
    QueryResult,
    ReasoningPath,
    OperationType
} from '../../types.js';
import { GraphArtifactLoader, GraphValidationError, type LoadedGraphArtifacts } from './GraphArtifactLoader.js';
import { TrustAwareTraversal } from '../traversal/TrustAwareTraversal.js';
import { PathSelector } from '../traversal/pathSelector.js';
import { EdgePolicyTable } from '../traversal/EdgePolicyTable.js';
import { ReasoningTrace } from './ReasoningTrace.js';
import { TrustEventEmitter } from '../../observability/TrustEventEmitter.js';
import { QueryResultFactory } from './QueryResultFactory.js';

export class TrustAwareQueryEngine {
    private readonly emitter = TrustEventEmitter.getInstance();

    constructor(private readonly workspaceId: string, private readonly loader: GraphArtifactLoader) { }

    /**
     * The primary trust-aware entrypoint for finding reasoning paths between nodes.
     * This is the "Chokepoint" that prevents reasoning bypasses.
     */
    async findReasoningPaths(fromId: string, toId: string, operation: OperationType, mode: QueryMode): Promise<QueryResult> {
        if (!operation) {
            return QueryResultFactory.create({
                status: 'POLICY_VIOLATION',
                warnings: ['OPERATION_REQUIRED'],
                codes: ['OPERATION_REQUIRED'],
                metadata: {
                    policy: { operation: null, mode, traversedEdgeCount: 0, blockedEdgeCount: 0, blockedCodes: [] },
                },
            });
        }
        this.emitter.emitTrustEvent({
            workspaceId: this.workspaceId,
            timestamp: new Date().toISOString(),
            mode,
            type: 'TRUST_REASONING_START',
            message: `Starting trust-aware reasoning (${operation}) from ${fromId} to ${toId}`,
        });

        let artifacts: LoadedGraphArtifacts;
        try {
            artifacts = await this.loader.load(this.workspaceId);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const traversal = new TrustAwareTraversal(artifacts);
        const trace = new ReasoningTrace(this.workspaceId, mode);

        // 1. Path Discovery
        const { paths: allPaths, deniedEdges } = await traversal.findPaths(fromId, toId, operation, mode);
        const allCodes = new Set<string>();

        deniedEdges.forEach(d => d.codes.forEach(c => allCodes.add(c)));

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
            if (operation === 'governance') {
                allCodes.add('AUTHORITY_CHAIN_BROKEN');
                allCodes.add('POLICY_VIOLATION');
            }
            return QueryResultFactory.create({
                status: operation === 'governance' ? 'POLICY_VIOLATION' : 'INSUFFICIENT_EVIDENCE',
                warnings: ['NO_VALID_PATHS_UNDER_CURRENT_TRUST_POLICY'],
                codes: [...allCodes],
                metadata: {
                    trace: trace.getSummary(),
                    policy: {
                        operation,
                        mode,
                        traversedEdgeCount: 0,
                        blockedEdgeCount: deniedEdges.length,
                        blockedCodes: [...allCodes],
                    },
                },
            });
        }

        // 2. Path Selection (Auth-first strategy)
        const bestPath = PathSelector.selectBestPath(allPaths);
        const rejectedPaths = allPaths.filter(p => p !== bestPath);
        rejectedPaths.forEach(p => trace.logRejected(p, 'REPLACED_BY_MORE_AUTHORITATIVE_PATH'));

        if (!bestPath) {
            return this.emptyResult('AMBIGUOUS', ['CONFLICTING_PATHS_WITHOUT_CLEAR_AUTHORITY'], trace, { operation, mode });
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
        const warnings = mode === 'authoritative' && bestPath.trust_level !== 'AUTHORITATIVE' ? ['RESULT_BELOW_REQUESTED_TRUST_LEVEL'] : [];
        if (bestPath.status === 'PARTIAL') {
            warnings.push('EXPLORATORY_USED');
            allCodes.add('EXPLORATORY_USED');
        }

        return QueryResultFactory.create({
            status: bestPath.status,
            nodes: bestPath.nodes,
            edges: bestPath.edges,
            selectedPaths: [bestPath],
            rejectedPaths: rejectedPaths.slice(0, 5),
            reasons: [
                `Selected most authoritative path with trust level: ${bestPath.trust_level}`,
                `Filtered ${allPaths.length - 1} other paths based on trust policy.`,
            ],
            confidenceLevel: bestPath.trust_level === 'AUTHORITATIVE' ? 'HIGH' : (bestPath.trust_level === 'DERIVED' ? 'MEDIUM' : 'LOW'),
            confidenceReasons: [`Path trust level: ${bestPath.trust_level}`],
            warnings: [...new Set(warnings)],
            codes: [...allCodes],
            metadata: {
                trace: trace.getSummary(),
                policy: {
                    operation,
                    mode,
                    traversedEdgeCount: bestPath.edges.length,
                    blockedEdgeCount: deniedEdges.length,
                    blockedCodes: [...new Set(deniedEdges.flatMap((d) => d.codes))],
                },
            },
            provenanceSources: bestPath.nodes.map((node) => node.provenance),
        });
    }

    /**
     * Impact analysis with trust pruning.
     */
    private async collectImpactGraph(nodeId: string, operation: OperationType, mode: QueryMode, depth = 3): Promise<{ nodes: GraphNode[]; edges: GraphEdge[]; truncated: boolean; codes: string[]; warnings: string[]; blockedEdgeCount: number; blockedCodes: string[] }> {
        const artifacts = await this.loader.load(this.workspaceId);
        const nodes = new Map<string, GraphNode>();
        const edges = new Map<string, GraphEdge>();
        const queue: Array<{ id: string; d: number; exploratoryHops: number }> = [{ id: nodeId, d: 0, exploratoryHops: 0 }];
        const visited = new Set<string>([nodeId]);
        const maxVisited = 2000;
        let truncated = false;
        const codes = new Set<string>();
        const warnings = new Set<string>();
        const blockedCodes = new Set<string>();
        let blockedEdgeCount = 0;

        const root = artifacts.index.nodeById[nodeId];
        if (root && EdgePolicyTable.isNodeVisible(root, { operation, mode })) nodes.set(nodeId, root);

        while (queue.length > 0) {
            if (visited.size > maxVisited) {
                truncated = true;
                break;
            }
            const cur = queue.shift()!;
            if (cur.d >= depth) continue;

            const outgoing = artifacts.index.edgesBySource[cur.id] ?? [];
            for (const edgeId of outgoing) {
                const edge = artifacts.index.edgeById[edgeId];
                if (!edge) continue;

                const decision = EdgePolicyTable.evaluateEdge(edge, {
                    operation,
                    mode,
                    currentExploratoryHops: cur.exploratoryHops
                });

                decision.codes.forEach(c => codes.add(c));
                decision.warnings.forEach(w => warnings.add(w));
                if (!decision.allowed) {
                    blockedEdgeCount++;
                    decision.codes.forEach(c => blockedCodes.add(c));
                    continue;
                }

                const next = artifacts.index.nodeById[edge.to_id];
                if (next && EdgePolicyTable.isNodeVisible(next, { operation, mode })) {
                    edges.set(edge.id, edge);
                    nodes.set(next.id, next);
                    if (!visited.has(next.id)) {
                        visited.add(next.id);
                        queue.push({
                            id: next.id,
                            d: cur.d + 1,
                            exploratoryHops: cur.exploratoryHops + (edge.graph_kind === 'exploratory' ? 1 : 0)
                        });
                    }
                }
            }
        }

        return { nodes: [...nodes.values()], edges: [...edges.values()], truncated, codes: [...codes], warnings: [...warnings], blockedEdgeCount, blockedCodes: [...blockedCodes] };
    }

    async analyzeImpact(nodeId: string, operation: OperationType, mode: QueryMode, depth = 3): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let impact: Awaited<ReturnType<typeof this.collectImpactGraph>>;
        try {
            impact = await this.collectImpactGraph(nodeId, operation, mode, depth);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        if (impact.nodes.length === 0) {
            return this.emptyResult('INSUFFICIENT_EVIDENCE', ['NODE_NOT_FOUND_OR_NO_TRAVERSABLE_IMPACT'], undefined, { operation, mode });
        }
        return this.graphResult(
            impact.nodes,
            impact.edges,
            impact.truncated ? 'PARTIAL' : (impact.codes.includes('EXPLORATORY_USED') ? 'PARTIAL' : 'OK'),
            ['impact', `mode=${mode}`, `depth=${depth}`],
            [...new Set([...(impact.truncated ? ['GRAPH_RESULT_TRUNCATED'] : []), ...impact.warnings])],
            { truncated: impact.truncated, operation, codes: impact.codes },
            impact.codes,
            { operation, mode, blockedEdgeCount: impact.blockedEdgeCount, blockedCodes: impact.blockedCodes },
        );
    }

    async getNode(nodeId: string, operation: OperationType, mode: QueryMode): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let artifacts: LoadedGraphArtifacts;
        try {
            artifacts = await this.loader.load(this.workspaceId);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const node = artifacts.index.nodeById[nodeId];
        if (!node || !EdgePolicyTable.isNodeVisible(node, { operation, mode })) {
            return this.emptyResult('INSUFFICIENT_EVIDENCE', ['NODE_NOT_FOUND_OR_INACCESSIBLE_UNDER_POLICY'], undefined, { operation, mode });
        }
        return this.graphResult([node], [], 'OK', ['ask', `mode=${mode}`], [], undefined, [], { operation, mode });
    }


    async getVisibleGraph(operation: OperationType, mode: QueryMode): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
        if (!operation) throw new Error('OPERATION_REQUIRED');
        const artifacts = await this.loader.load(this.workspaceId);
        const nodes = Object.values(artifacts.index.nodeById).filter((node) => EdgePolicyTable.isNodeVisible(node, { operation, mode }));
        const visibleNodeIds = new Set(nodes.map((node) => node.id));
        const edges = Object.values(artifacts.index.edgeById).filter((edge) =>
            visibleNodeIds.has(edge.from_id) &&
            visibleNodeIds.has(edge.to_id) &&
            EdgePolicyTable.evaluateEdge(edge, { operation, mode }).allowed
        );
        return { nodes, edges };
    }

    async getBlastRadiusIds(nodeId: string, operation: OperationType, mode: QueryMode, depth = 6): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let impact: Awaited<ReturnType<typeof this.collectImpactGraph>>;
        try {
            impact = await this.collectImpactGraph(nodeId, operation, mode, depth);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        return this.graphResult(
            impact.nodes,
            impact.edges,
            impact.truncated ? 'PARTIAL' : (impact.codes.includes('EXPLORATORY_USED') ? 'PARTIAL' : 'OK'),
            [operation, `mode=${mode}`, `depth=${depth}`, 'blast_radius_ids in metadata'],
            [...new Set([...(impact.truncated ? ['GRAPH_RESULT_TRUNCATED'] : []), ...impact.warnings])],
            { blastRadiusIds: impact.nodes.map((node) => node.id), truncated: impact.truncated, operation, codes: impact.codes },
            impact.codes,
            { operation, mode, blockedEdgeCount: impact.blockedEdgeCount, blockedCodes: impact.blockedCodes },
        );
    }

    async getRiskScore(nodeIds: string[], operation: OperationType, mode: QueryMode): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const touchedNodes = graph.nodes.filter((node) => nodeIds.includes(node.id));
        const touchingEdges = graph.edges.filter((edge) => nodeIds.includes(edge.from_id) || nodeIds.includes(edge.to_id));
        const trustPenalty = touchedNodes.reduce((sum, node) => sum + (node.trust_level === 'AUTHORITATIVE' ? 10 : node.trust_level === 'DERIVED' ? 5 : 2), 0);
        const entrypointPenalty = touchedNodes.filter((node) => this.isEntrypoint(node)).length * 8;
        const riskScore = Math.min(100, trustPenalty + entrypointPenalty + touchingEdges.length * 2);
        return this.graphResult(touchedNodes, touchingEdges, 'OK', [`mode=${mode}`, 'risk uses trust-weighted factors'], [], { riskScore }, [], { operation, mode });
    }

    async getGraphStats(operation: OperationType, mode: QueryMode): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const stats = {
            nodes: graph.nodes.length,
            edges: graph.edges.length,
            density: graph.nodes.length <= 1 ? 0 : graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1)),
            orphans: graph.nodes.filter((node) => !graph.edges.some((edge) => edge.from_id === node.id || edge.to_id === node.id)).length,
        };
        return this.graphResult(graph.nodes, graph.edges, 'OK', [`mode=${mode}`], [], { stats }, [], { operation, mode });
    }

    async findHubs(operation: OperationType, mode: QueryMode, limit = 20): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
        const degree = new Map<string, number>();
        for (const edge of graph.edges) {
            degree.set(edge.from_id, (degree.get(edge.from_id) ?? 0) + 1);
            degree.set(edge.to_id, (degree.get(edge.to_id) ?? 0) + 1);
        }
        const hubs = [...degree.entries()]
            .filter(([id]) => nodesById.has(id))
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([nodeId, degree]) => ({ nodeId, degree, label: nodesById.get(nodeId)?.label }));
        return this.graphResult(hubs.map((hub) => nodesById.get(hub.nodeId)!).filter(Boolean), [], 'OK', [`mode=${mode}`], [], { hubs }, [], { operation, mode });
    }

    async findBridges(operation: OperationType, mode: QueryMode): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
        const bridges = graph.edges.filter((edge) => {
            const from = nodesById.get(edge.from_id);
            const to = nodesById.get(edge.to_id);
            return Boolean(from?.domain && to?.domain && from.domain !== to.domain);
        });
        return this.graphResult(graph.nodes, bridges, 'OK', [`mode=${mode}`], [], { bridgeEdgeIds: bridges.map((edge) => edge.id) }, [], { operation, mode });
    }

    async findKnowledgeGaps(operation: OperationType, mode: QueryMode): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const gaps = graph.nodes.filter((node) => {
            const hasEvidence = Boolean(node.provenance?.artifact_source && node.provenance?.producer_stage);
            const isolated = !this.isEntrypoint(node)
                && !graph.edges.some((edge) => edge.from_id === node.id || edge.to_id === node.id);
            return !hasEvidence || isolated;
        });
        return this.graphResult(gaps, [], gaps.length > 0 ? 'PARTIAL' : 'OK', [`mode=${mode}`], gaps.length > 0 ? ['KNOWLEDGE_GAPS_FOUND'] : [], { gapNodeIds: gaps.map((node) => node.id) }, [], { operation, mode });
    }

    async searchNodes(query: string, operation: OperationType, mode: QueryMode, limit = 50, projectId?: string): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const normalized = query.toLowerCase();
        const matches = graph.nodes
            .filter((node) => !projectId || node.project === projectId)
            .filter((node) => [
                node.id,
                node.label,
                node.symbol,
                node.http_path,
                node.domain,
                node.language,
                node.framework,
                node.project,
                node.source_file,
                ...(node.roles ?? []),
            ].some((value) => value?.toLowerCase().includes(normalized)))
            .sort((a, b) => a.id.localeCompare(b.id))
            .slice(0, limit);
        return this.graphResult(matches, [], matches.length > 0 ? 'OK' : 'INSUFFICIENT_EVIDENCE', [`mode=${mode}`, 'GRAPH_SEARCH'], matches.length > 0 ? [] : ['NO_MATCH'], {
            query,
            projectId,
            matchCount: matches.length,
            results: matches.map((node) => ({
                id: node.id,
                label: node.label,
                type: node.type,
                roles: node.roles ?? [],
                language: node.language,
                framework: node.framework,
                project: node.project,
                source_file: node.source_file,
            })),
        }, [], { operation, mode });
    }

    async findCallers(symbol: string | undefined, operation: OperationType, mode: QueryMode, nodeId?: string): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let artifacts: LoadedGraphArtifacts;
        try {
            artifacts = await this.loader.load(this.workspaceId);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const nodesById = artifacts.index.nodeById;
        const targetIds = new Set(
            nodeId
                ? (nodesById[nodeId] && EdgePolicyTable.isNodeVisible(nodesById[nodeId], { operation, mode }) ? [nodeId] : [])
                : Object.values(nodesById)
                    .filter((node) => (node.label === symbol || node.symbol === symbol) && EdgePolicyTable.isNodeVisible(node, { operation, mode }))
                    .map((node) => node.id)
        );

        const callers: Array<{ caller: GraphNode; via_edge: GraphEdge }> = [];
        const deniedCodes = new Set<string>();
        let deniedEdgeCount = 0;
        Object.values(artifacts.index.edgeById).forEach(edge => {
            if (targetIds.has(edge.to_id)) {
                const decision = EdgePolicyTable.evaluateEdge(edge, { operation, mode });
                if (decision.allowed) {
                    const caller = nodesById[edge.from_id];
                    if (caller && EdgePolicyTable.isNodeVisible(caller, { operation, mode })) {
                        callers.push({ caller, via_edge: edge });
                    }
                } else {
                    deniedEdgeCount++;
                    decision.codes.forEach(c => deniedCodes.add(c));
                }
            }
        });

        return this.graphResult(
            callers.map((entry) => entry.caller),
            callers.map((entry) => entry.via_edge),
            callers.length > 0 ? 'OK' : 'INSUFFICIENT_EVIDENCE',
            ['lineage', `mode=${mode}`],
            callers.length > 0 ? [] : ['NO_CALLERS_FOUND'],
            { callers },
            [...deniedCodes],
            { operation, mode, blockedEdgeCount: deniedEdgeCount, blockedCodes: [...deniedCodes] },
        );
    }

    async findDeadCode(operation: OperationType, mode: QueryMode = 'authoritative'): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const entries = graph.nodes.map((node) => {
            const incoming = graph.edges.filter((edge) => edge.to_id === node.id).length;
            const outgoing = graph.edges.filter((edge) => edge.from_id === node.id).length;
            const classification = this.isEntrypoint(node)
                ? 'entrypoint'
                : incoming === 0
                    ? 'unreferenced_internal'
                    : 'referenced';
            return { node, incoming, outgoing, classification };
        }).filter((entry) => entry.classification !== 'referenced');

        const unreferenced = entries.filter((e) => e.classification === 'unreferenced_internal');
        const entrypoints = entries.filter((e) => e.classification === 'entrypoint');
        return this.graphResult(
            unreferenced.map((e) => e.node),
            [],
            unreferenced.length > 0 ? 'PARTIAL' : 'OK',
            [`mode=${mode}`],
            unreferenced.length > 0 ? ['UNREFERENCED_SYMBOLS_FOUND'] : [],
            {
                deadCode: unreferenced.map(({ node, ...rest }) => ({ nodeId: node.id, label: node.label, ...rest })),
                entrypointCount: entrypoints.length,
            },
            [],
            { operation, mode },
        );
    }

    async renamePreview(oldSymbol: string, newSymbol: string, operation: OperationType, mode: QueryMode = 'authoritative'): Promise<QueryResult> {
        if (!operation) return this.emptyResult('POLICY_VIOLATION', ['OPERATION_REQUIRED']);
        let graph: { nodes: GraphNode[]; edges: GraphEdge[] };
        try {
            graph = await this.getVisibleGraph(operation, mode);
        } catch (error) {
            return this.validationFailureResult(error, operation, mode);
        }
        const hits = graph.nodes.filter((n) => n.graph_kind === 'canonical' && n.symbol === oldSymbol);
        return this.graphResult(hits, [], hits.length > 0 ? 'OK' : 'INSUFFICIENT_EVIDENCE', [`mode=${mode}`], hits.length > 0 ? [] : ['NO_SYMBOL_MATCH'], {
            affectedFiles: [...new Set(hits.map((h) => h.source_file).filter(Boolean))],
            proposedSymbol: newSymbol,
        }, [], { operation, mode });
    }

    private graphResult(
        nodes: GraphNode[],
        edges: GraphEdge[],
        status: QueryResult['status'],
        reasons: string[],
        warnings: string[],
        metadata?: Record<string, unknown>,
        explicitCodes: string[] = [],
        policyCtx?: { operation?: OperationType | null; mode?: QueryMode | null; blockedEdgeCount?: number; blockedCodes?: string[] },
    ): QueryResult {
        const usesNonAuthoritative = [...nodes, ...edges].some((item) => item.trust_level !== 'AUTHORITATIVE' || item.confidence_band !== 'AUTHORITATIVE');
        const exploratoryUsed = [...nodes, ...edges].some((item) => item.graph_kind === 'exploratory');

        const finalWarnings = [...new Set([...warnings])];
        if (usesNonAuthoritative) finalWarnings.push('NON_AUTHORITATIVE_EVIDENCE_PRESENT');
        if (exploratoryUsed) finalWarnings.push('EXPLORATORY_USED');

        const codes = [...explicitCodes];
        if (exploratoryUsed) codes.push('EXPLORATORY_USED');

        const policy = {
            operation: policyCtx?.operation ?? null,
            mode: policyCtx?.mode ?? null,
            traversedEdgeCount: edges.length,
            blockedEdgeCount: policyCtx?.blockedEdgeCount ?? 0,
            blockedCodes: policyCtx?.blockedCodes ?? [],
        };

        return QueryResultFactory.create({
            status,
            nodes,
            edges,
            reasons,
            warnings: finalWarnings,
            codes,
            confidenceLevel: usesNonAuthoritative ? 'MEDIUM' : 'HIGH',
            confidenceReasons: reasons,
            metadata: { ...(metadata ?? {}), policy },
            provenanceSources: nodes.map((node) => node.provenance),
        });
    }

    private validationFailureResult(error: unknown, operation: OperationType, mode: QueryMode): QueryResult {
        if (error instanceof GraphValidationError) {
            const codes = [...new Set(['POLICY_VIOLATION', ...error.codes])];
            return QueryResultFactory.create({
                status: 'POLICY_VIOLATION',
                reasons: ['GRAPH_VALIDATION_FAILED'],
                warnings: [],
                codes,
                metadata: {
                    validationIssues: error.validationIssues,
                    governanceIssues: error.governanceIssues,
                    policy: {
                        operation,
                        mode,
                        traversedEdgeCount: 0,
                        blockedEdgeCount: 0,
                        blockedCodes: codes,
                    },
                },
            });
        }

        if (error instanceof Error && error.message.includes('INVALID_GRAPH_STATE')) {
            return QueryResultFactory.create({
                status: 'POLICY_VIOLATION',
                reasons: ['GRAPH_VALIDATION_FAILED'],
                warnings: [],
                codes: ['POLICY_VIOLATION', 'INVALID_GRAPH_STATE'],
                metadata: {
                    error: error.message,
                    policy: {
                        operation,
                        mode,
                        traversedEdgeCount: 0,
                        blockedEdgeCount: 0,
                        blockedCodes: ['POLICY_VIOLATION', 'INVALID_GRAPH_STATE'],
                    },
                },
            });
        }

        throw error;
    }

    private isEntrypoint(node: GraphNode): boolean {
        return Boolean(node.metadata?.is_entrypoint)
            || (node.roles ?? []).includes('entrypoint')
            || Boolean(node.http_method || node.http_path);
    }

    private emptyResult(
        status: any,
        warnings: string[],
        trace?: ReasoningTrace,
        policyCtx?: { operation?: OperationType | null; mode?: QueryMode | null },
    ): QueryResult {
        const policy = {
            operation: policyCtx?.operation ?? null,
            mode: policyCtx?.mode ?? null,
            traversedEdgeCount: 0,
            blockedEdgeCount: 0,
            blockedCodes: [],
        };
        return QueryResultFactory.create({
            status,
            reasons: ['NO_EVIDENCE_FOUND'],
            warnings,
            codes: [...warnings],
            metadata: {
                ...(trace ? { trace: trace.getSummary() } : {}),
                policy,
            },
        });
    }
}
