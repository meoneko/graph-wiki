import type { GraphNode, QueryMode, QueryResult } from '../core/types.js';
import { getTrustedQueryService } from '../core/graph/query/TrustedQueryService.js';
import { getDB } from '../storage/GraphDB.js';
import { resolveDbPath } from './config.js';
import type { DiffEntry } from './gitDiff.js';
import { OperationResolver } from '../core/graph/query/OperationResolver.js';
import { QueryResultFactory } from '../core/graph/query/QueryResultFactory.js';

export interface ImpactReport extends QueryResult {
  changedNodes: GraphNode[];
  affectedNodes: GraphNode[];
  affectedEntrypoints: GraphNode[];
  riskScore: number;
  riskRationale: string[];
  criticalPaths: QueryResult[];
  affectedFlows: Array<{ id: string; title: string }>;
  reviewSuggestions: string[];
}

export async function buildImpactReport(
  diff: DiffEntry[],
  workspaceId: string,
  mode: QueryMode = 'mixed_safe',
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
      riskRationale: ['Graph validation failed before impact analysis'],
      criticalPaths: [],
      affectedFlows: [],
      reviewSuggestions: ['Fix graph validation errors before reviewing impact'],
    };
  }

  const visibleGraph = await engine.getVisibleGraph(operation, mode);
  const allNodes = visibleGraph.nodes.filter((node) => node.graph_kind === 'canonical');
  const changedNodes = allNodes
    .filter((n) => diff.some((d) => n.source_file?.endsWith(d.filePath)))
    .slice(0, 200);

  const affectedNodeMap = new Map<string, GraphNode>();
  const criticalResults: QueryResult[] = [];
  const warnings: string[] = [];

  for (const node of changedNodes) {
    const impact = await engine.analyzeImpact(node.id, operation, mode, 5);
    warnings.push(...impact.warnings);
    for (const impacted of impact.data.nodes) affectedNodeMap.set(impacted.id, impacted);

    const entrypoints = impact.data.nodes
      .filter((n) => n.type.includes('api') || n.type.includes('route') || n.type.includes('controller'))
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
  const affectedEntrypoints = affectedNodes.filter((n) =>
    n.type.includes('api') || n.type.includes('route') || n.type.includes('controller')
  );

  const riskResult = await engine.getRiskScore(affectedNodes.map((node) => node.id), operation, mode);
  const riskScore = Number(riskResult.metadata?.riskScore ?? 0);
  return {
    ...QueryResultFactory.create({
      status: warnings.length > 0 ? 'PARTIAL' : 'OK',
      nodes: affectedNodes,
      edges: [],
      selectedPaths: criticalResults.flatMap((result) => result.reasoning.selected_paths),
      rejectedPaths: criticalResults.flatMap((result) => result.reasoning.rejected_paths ?? []),
      reasons: [
        'Impact report built through TrustAwareQueryEngine',
        `changed_nodes=${changedNodes.length}`,
        `affected_nodes=${affectedNodes.length}`,
      ],
      confidenceLevel: affectedNodes.some((node) => node.trust_level !== 'AUTHORITATIVE') ? 'MEDIUM' : 'HIGH',
      confidenceReasons: ['Impact uses trust-filtered visible graph and trust-weighted risk score'],
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
      `query_mode=${mode}`,
      'risk_score=trust_weighted',
    ],
    criticalPaths: criticalResults,
    affectedFlows: [],
    reviewSuggestions: riskScore > 70
      ? ['Run full regression tests', 'Request backend + API review', 'Gate merge on manual verification']
      : ['Run targeted tests for changed entrypoints'],
  };
}
