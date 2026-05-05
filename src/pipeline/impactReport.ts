import type { GraphNode, QueryMode, QueryResult } from '../core/types.js';
import { getTrustedQueryService } from '../core/graph/query/TrustedQueryService.js';
import { getDB } from '../storage/GraphDB.js';
import { resolveDbPath } from './config.js';
import type { DiffEntry } from './gitDiff.js';
import { OperationResolver } from '../core/graph/query/OperationResolver.js';
import { QueryResultFactory } from '../core/graph/query/QueryResultFactory.js';
import { fileMatchesGraphPath } from '../core/utils/pathMatch.js';

export interface ImpactReport extends QueryResult {
  changedNodes: GraphNode[];
  affectedNodes: GraphNode[];
  affectedEntrypoints: GraphNode[];
  riskScore: number;
  riskRationale: string[];
  criticalPaths: QueryResult[];
  affectedFlows: Array<{ id: number; name: string; criticality: number; nodeCount: number }>;
  reviewSuggestions: string[];
}

function isEntrypoint(node: GraphNode): boolean {
  return (node.roles ?? []).includes('entrypoint');
}

function summarizeNode(node: GraphNode): {
  id: string;
  label: string;
  type: string;
  roles: string[];
  project: string;
  source_file?: string;
} {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    roles: node.roles ?? [],
    project: node.project,
    source_file: node.source_file,
  };
}

export async function buildImpactReport(
  diff: DiffEntry[],
  workspaceId: string,
  mode: QueryMode = 'mixed_safe',
  taskType: string = 'impact',
): Promise<ImpactReport> {
  const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(workspaceId);
  const operation = OperationResolver.resolve({ caller: 'pipeline.impact' });

  const graphStats = await engine.getGraphStats(operation, mode);
  if (graphStats.status === 'POLICY_VIOLATION') {
    return {
      ...graphStats,
      changedNodes: [],
      affectedNodes: [],
      affectedEntrypoints: [],
      riskScore: 0,
      riskRationale: ['GRAPH_VALIDATION_FAILED'],
      criticalPaths: [],
      affectedFlows: [],
      reviewSuggestions: ['manual_verify'],
    };
  }

  const visibleGraph = await engine.getVisibleGraph(operation, mode);
  const store = getDB(resolveDbPath());
  const allNodes = visibleGraph.nodes.filter((node) => node.graph_kind === 'canonical');
  const totalWorkspaceNodeCount = Math.max(allNodes.length, 1);
  const changedNodes = allNodes
    .filter((n) => diff.some((d) => fileMatchesGraphPath(d.filePath, n.source_file)))
    .slice(0, 200);

  const affectedNodeMap = new Map<string, GraphNode>();
  const criticalResults: QueryResult[] = [];
  const warnings: string[] = [];

  for (const node of changedNodes) {
    const impact = await engine.analyzeImpact(node.id, operation, mode, 5);
    warnings.push(...impact.warnings);
    for (const impacted of impact.data.nodes) affectedNodeMap.set(impacted.id, impacted);

    const entrypoints = impact.data.nodes
      .filter(isEntrypoint)
      .slice(0, 50);

    if (entrypoints.length === 50) warnings.push('IMPACT_ENTRYPOINT_LIMIT_REACHED');

    for (const ep of entrypoints) {
      const result = await engine.findReasoningPaths(node.id, ep.id, operation, mode);
      if (result.status === 'OK' || result.status === 'AMBIGUOUS' || result.status === 'PARTIAL') {
        criticalResults.push(result);
      }
    }
  }

  if (changedNodes.length === 200) warnings.push('CHANGED_NODE_LIMIT_REACHED');

  const affectedNodes = [...affectedNodeMap.values()];
  const affectedEntrypoints = affectedNodes.filter(isEntrypoint);
  const relevantNodeIds = new Set([...changedNodes, ...affectedNodes].map((node) => node.id));
  const affectedFlows = store.getFlows(workspaceId)
    .filter((flow) => flow.path.some((id) => relevantNodeIds.has(id)))
    .map((flow) => ({
      id: flow.id,
      name: flow.name,
      criticality: flow.criticality,
      nodeCount: flow.nodeCount,
    }))
    .sort((a, b) => b.criticality - a.criticality)
    .slice(0, 50);
  const affectedFlowIds = new Set(affectedFlows.map((flow) => flow.id));
  const affectedCommunities = store.getCommunities(workspaceId)
    .filter((community) => community.nodeIds.some((id) => relevantNodeIds.has(id)))
    .map((community) => ({
      id: community.id,
      name: community.name,
      size: community.size,
      cohesion: community.cohesion,
    }))
    .slice(0, 50);

  const riskResult = await engine.getRiskScore(affectedNodes.map((node) => node.id), operation, mode);
  const riskScore = Number(riskResult.metadata?.riskScore ?? 0);
  const affectedProjectCount = new Set(affectedNodes.map((node) => node.project)).size;
  const affectedWorkspaceRatio = affectedNodes.length / totalWorkspaceNodeCount;
  const highCriticalityFlow = affectedFlows.some((flow) => flow.criticality >= 0.7);
  const mediumCriticalityFlow = affectedFlows.some((flow) => flow.criticality >= 0.4);
  const changedEntrypoint = changedNodes.some(isEntrypoint);
  const severity =
    highCriticalityFlow || changedEntrypoint || affectedWorkspaceRatio >= 0.2
      ? 'HIGH'
      : mediumCriticalityFlow || affectedWorkspaceRatio >= 0.05
        ? 'MEDIUM'
        : 'LOW';
  const factorCodes: Array<{ code: string; value?: number | string }> = [
    { code: 'CHANGED_NODES', value: changedNodes.length },
    { code: 'AFFECTED_NODES', value: affectedNodes.length },
    { code: 'AFFECTED_ENTRYPOINTS', value: affectedEntrypoints.length },
    { code: 'AFFECTED_FLOWS', value: affectedFlows.length },
    { code: 'AFFECTED_WORKSPACE_RATIO', value: Number(affectedWorkspaceRatio.toFixed(4)) },
  ];
  if (changedEntrypoint) factorCodes.push({ code: 'CHANGED_ENTRYPOINT' });
  if (highCriticalityFlow) factorCodes.push({ code: 'HIGH_CRITICALITY_FLOW' });
  else if (mediumCriticalityFlow) factorCodes.push({ code: 'MEDIUM_CRITICALITY_FLOW' });
  if (affectedProjectCount > 1) factorCodes.push({ code: 'CROSS_PROJECT', value: affectedProjectCount });
  const missingContextCodes = [
    ...(affectedFlows.length === 0 ? ['NO_AFFECTED_FLOWS'] : []),
    ...(changedNodes.length === 0 ? ['NO_CHANGED_NODES_MATCHED'] : []),
  ];
  const suggestedCheckCodes = [
    ...(severity === 'HIGH' ? ['run_regression', 'manual_verify'] : []),
    ...(affectedEntrypoints.length > 0 ? ['inspect_affected_flows'] : []),
    ...(affectedProjectCount > 1 ? ['notify_owner'] : []),
    ...(affectedFlows.length === 0 ? ['inspect_callers', 'inspect_callees'] : []),
  ];

  return {
    ...QueryResultFactory.create({
      status: warnings.length > 0 ? 'PARTIAL' : 'OK',
      nodes: affectedNodes,
      edges: [],
      selectedPaths: criticalResults.flatMap((result) => result.reasoning.selected_paths),
      rejectedPaths: criticalResults.flatMap((result) => result.reasoning.rejected_paths ?? []),
      reasons: [
        'IMPACT_REPORT_BUILT',
        `changed_nodes=${changedNodes.length}`,
        `affected_nodes=${affectedNodes.length}`,
      ],
      confidenceLevel: affectedNodes.some((node) => node.trust_level !== 'AUTHORITATIVE') ? 'MEDIUM' : 'HIGH',
      confidenceReasons: ['TRUST_FILTERED_GRAPH', 'TRUST_WEIGHTED_RISK_SCORE'],
      provenanceSources: affectedNodes.map((node) => node.provenance),
      warnings: [...new Set(warnings)],
      codes: [],
      metadata: {
        policy: {
          operation,
          mode,
          traversedEdgeCount: affectedNodes.length,
          blockedEdgeCount: 0,
          blockedCodes: [],
        },
      },
      data: {
        analysis: {
          scope: { workspaceId, taskType },
          inputs: { files: diff.map((entry) => entry.filePath) },
          changedNodes: changedNodes.map(summarizeNode),
          affectedNodes: affectedNodes.map(summarizeNode),
          affectedFlows,
          affectedCommunities,
          blastRadius: {
            downstreamNodeCount: affectedNodes.length,
            affectedProjectCount,
            affectedWorkspaceRatio,
          },
          severity,
          factorCodes,
          missingContextCodes,
          suggestedCheckCodes: [...new Set(suggestedCheckCodes)],
          riskScore,
        },
      },
    }),
    changedNodes,
    affectedNodes,
    affectedEntrypoints,
    riskScore,
    riskRationale: [
      `changed_nodes=${changedNodes.length}`,
      `affected_nodes=${affectedNodes.length}`,
      `affected_entrypoints=${affectedEntrypoints.length}`,
      `critical_paths=${criticalResults.length}`,
      `affected_flows=${affectedFlows.length}`,
      `query_mode=${mode}`,
      'risk_score=trust_weighted',
    ],
    criticalPaths: criticalResults,
    affectedFlows,
    reviewSuggestions: riskScore > 70
      ? ['run_regression', 'manual_verify']
      : ['inspect_affected_flows'],
  };
}
