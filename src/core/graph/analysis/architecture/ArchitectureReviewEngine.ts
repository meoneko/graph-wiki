/**
 * ArchitectureReviewEngine — orchestrates existing infrastructure and new analyzers
 * to produce a comprehensive architecture review.
 *
 * Pipeline:
 * 1. Load — Fetch visible graph via TrustAwareQueryEngine.getVisibleGraph()
 * 2. Enrich — Run computeGraphMetrics(), detectCommunities(), computeFlows()
 * 3. Analyze — Run each analyzer on the enriched data
 * 4. Aggregate — Collect findings, compute summary metrics, generate recommendations
 * 5. Output — Return QueryResult via QueryResultFactory.create() with report in metadata
 */

import { TrustedQueryService } from '../../query/TrustedQueryService.js';
import { computeGraphMetrics } from '../metrics.js';
import { detectCommunities } from '../community.js';
import { computeFlows } from '../../../flows.js';
import { QueryResultFactory } from '../../query/QueryResultFactory.js';
import { ModuleBoundaryAnalyzer } from './analyzers/ModuleBoundaryAnalyzer.js';
import { CycleDetector } from './analyzers/CycleDetector.js';
import { LayerViolationDetector } from './analyzers/LayerViolationDetector.js';
import { FlowAssessor } from './analyzers/FlowAssessor.js';
import { DeadCodeClassifier } from './analyzers/DeadCodeClassifier.js';
import type {
  QueryMode,
  QueryResult,
  GraphEdge,
} from '../../../types.js';
import type {
  ArchitectureReviewConfig,
  ArchitectureReport,
  Finding,
  Recommendation,
  Severity,
} from './types.js';

export type { ArchitectureReviewConfig } from './types.js';

export class ArchitectureReviewEngine {
  constructor(
    private readonly queryService: TrustedQueryService,
    private readonly config: ArchitectureReviewConfig = {},
  ) {}

  /**
   * Run a full architecture review for the given workspace.
   *
   * @param workspaceId - The workspace to analyze
   * @param mode - Trust mode for graph filtering (default: 'authoritative')
   * @param operation - Operation type for trust filtering (default: 'wiki')
   */
  async review(
    workspaceId: string,
    mode: QueryMode = 'authoritative',
    operation: 'ask' | 'impact' | 'lineage' | 'wiki' | 'governance' = 'wiki',
  ): Promise<QueryResult> {
    const engine = this.queryService.engine(workspaceId);

    // 1. Get trust-filtered graph
    const { nodes, edges } = await engine.getVisibleGraph(operation, mode);

    // 2. Filter exploratory edges if config says to exclude them
    const filteredEdges = this.config.includeExploratory
      ? edges
      : edges.filter((e) => e.graph_kind !== 'exploratory');

    // 3. Run existing analysis infrastructure
    const metrics = computeGraphMetrics({ nodes, edges: filteredEdges });
    const communities = detectCommunities(nodes, filteredEdges);
    const flows = computeFlows(nodes, filteredEdges);

    // 4. Run new analyzers
    const moduleBoundary = new ModuleBoundaryAnalyzer().analyze(
      nodes,
      filteredEdges,
      communities,
      this.config.thresholds,
    );
    const cycles = new CycleDetector().detect(nodes, filteredEdges);
    const layerViolations = new LayerViolationDetector(this.config.layers).detect(
      nodes,
      filteredEdges,
    );
    const flowAssessment = new FlowAssessor().assess(
      nodes,
      filteredEdges,
      flows,
      this.config.thresholds,
    );
    const deadCode = new DeadCodeClassifier().classify(
      nodes,
      filteredEdges,
      metrics.orphans,
    );

    // 5. Aggregate findings from all analyzers
    const allFindings: Finding[] = [
      ...moduleBoundary.findings,
      ...cycles.findings,
      ...layerViolations.findings,
      ...flowAssessment.findings,
      ...deadCode.findings,
    ];

    // 6. Set confidence on findings based on mode
    const annotatedFindings = this.annotateConfidence(allFindings, mode, filteredEdges);

    // 7. Compute summary metrics
    const summary = {
      totalFindings: annotatedFindings.length,
      critical: annotatedFindings.filter((f) => f.severity === 'critical').length,
      warning: annotatedFindings.filter((f) => f.severity === 'warning').length,
      info: annotatedFindings.filter((f) => f.severity === 'info').length,
    };

    // 8. Compute report metrics
    const averageCoupling =
      moduleBoundary.couplingPairs.length > 0
        ? moduleBoundary.couplingPairs.reduce((sum, p) => sum + p.score, 0) /
          moduleBoundary.couplingPairs.length
        : 0;
    const averageCohesion =
      moduleBoundary.cohesionScores.length > 0
        ? moduleBoundary.cohesionScores.reduce((sum, s) => sum + s.score, 0) /
          moduleBoundary.cohesionScores.length
        : 0;

    const reportMetrics = {
      moduleCount: moduleBoundary.modules.length,
      averageCoupling: Number(averageCoupling.toFixed(4)),
      averageCohesion: Number(averageCohesion.toFixed(4)),
      cycleCount: cycles.cycles.length,
      deadCodeCount: deadCode.entries.length,
      flowCount: flows.length,
    };

    // 9. Generate recommendations
    const recommendations = this.generateRecommendations(annotatedFindings);

    // 10. Build the report
    const report: ArchitectureReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      summary,
      metrics: reportMetrics,
      findings: annotatedFindings,
      recommendations,
    };

    // 11. Return QueryResult
    return QueryResultFactory.create({
      status: annotatedFindings.some((f) => f.severity === 'critical') ? 'PARTIAL' : 'OK',
      nodes: [],
      edges: [],
      reasons: [`Architecture review completed with ${annotatedFindings.length} findings`],
      warnings: annotatedFindings
        .filter((f) => f.severity === 'critical')
        .map((f) => f.description),
      codes: annotatedFindings.some((f) => f.severity === 'critical')
        ? ['CRITICAL_FINDINGS']
        : [],
      confidenceLevel: mode === 'authoritative' ? 'HIGH' : 'MEDIUM',
      confidenceReasons: [`Analysis mode: ${mode}`],
      metadata: {
        report,
        policy: {
          operation,
          mode,
          traversedEdgeCount: filteredEdges.length,
          blockedEdgeCount: 0,
          blockedCodes: [],
        },
      },
    });
  }

  /**
   * Get findings with an optional severity filter.
   *
   * @param workspaceId - The workspace to analyze
   * @param mode - Trust mode for graph filtering (default: 'authoritative')
   * @param severityFilter - Optional severity to filter by
   * @param operation - Operation type for trust filtering (default: 'wiki')
   */
  async getFindings(
    workspaceId: string,
    mode: QueryMode = 'authoritative',
    severityFilter?: Severity,
    operation: 'ask' | 'impact' | 'lineage' | 'wiki' | 'governance' = 'wiki',
  ): Promise<QueryResult> {
    const result = await this.review(workspaceId, mode, operation);
    const report = (result.metadata as { report: ArchitectureReport }).report;

    if (!severityFilter) {
      return result;
    }

    // Filter findings by severity
    const filteredFindings = report.findings.filter(
      (f) => f.severity === severityFilter,
    );

    // Recompute summary for filtered findings
    const summary = {
      totalFindings: filteredFindings.length,
      critical: filteredFindings.filter((f) => f.severity === 'critical').length,
      warning: filteredFindings.filter((f) => f.severity === 'warning').length,
      info: filteredFindings.filter((f) => f.severity === 'info').length,
    };

    const filteredReport: ArchitectureReport = {
      ...report,
      summary,
      findings: filteredFindings,
    };

    return QueryResultFactory.create({
      status: filteredFindings.some((f) => f.severity === 'critical') ? 'PARTIAL' : 'OK',
      nodes: [],
      edges: [],
      reasons: [
        `Architecture findings filtered by severity: ${severityFilter} (${filteredFindings.length} results)`,
      ],
      warnings: filteredFindings
        .filter((f) => f.severity === 'critical')
        .map((f) => f.description),
      codes: filteredFindings.some((f) => f.severity === 'critical')
        ? ['CRITICAL_FINDINGS']
        : [],
      confidenceLevel: mode === 'authoritative' ? 'HIGH' : 'MEDIUM',
      confidenceReasons: [`Analysis mode: ${mode}`],
      metadata: {
        report: filteredReport,
        policy: (result.metadata as Record<string, unknown>).policy,
      },
    });
  }

  /**
   * Annotate findings with confidence levels based on the query mode.
   *
   * - authoritative mode → all findings get 'high' confidence
   * - mixed_safe mode → findings get 'medium' confidence (derived edges present)
   * - exploratory mode with includeExploratory → findings get 'low' confidence
   */
  private annotateConfidence(
    findings: Finding[],
    mode: QueryMode,
    _edges: GraphEdge[],
  ): Finding[] {
    let confidence: 'high' | 'medium' | 'low';

    if (mode === 'authoritative') {
      confidence = 'high';
    } else if (mode === 'mixed_safe') {
      confidence = 'medium';
    } else {
      // exploratory mode
      confidence = this.config.includeExploratory ? 'low' : 'medium';
    }

    return findings.map((f) => ({
      ...f,
      confidence,
    }));
  }

  /**
   * Generate recommendations based on findings.
   * - Critical findings → high priority recommendations
   * - Multiple findings of same type → consolidated recommendation
   * - 1 recommendation per finding type that has findings
   */
  private generateRecommendations(findings: Finding[]): Recommendation[] {
    // Group findings by type
    const byType = new Map<string, Finding[]>();
    for (const finding of findings) {
      const arr = byType.get(finding.type) ?? [];
      arr.push(finding);
      byType.set(finding.type, arr);
    }

    const recommendations: Recommendation[] = [];
    let counter = 0;

    for (const [type, typeFindings] of byType.entries()) {
      counter++;
      const hasCritical = typeFindings.some((f) => f.severity === 'critical');
      const priority: 'high' | 'medium' | 'low' = hasCritical
        ? 'high'
        : typeFindings.some((f) => f.severity === 'warning')
          ? 'medium'
          : 'low';

      recommendations.push({
        id: `rec-${String(counter).padStart(3, '0')}`,
        priority,
        description: this.recommendationDescription(type, typeFindings),
        relatedFindings: typeFindings.map((f) => f.id),
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate a human-readable recommendation description for a finding type.
   */
  private recommendationDescription(type: string, findings: Finding[]): string {
    const count = findings.length;
    switch (type) {
      case 'high_coupling':
        return `Reduce coupling between ${count} highly-coupled module pair${count > 1 ? 's' : ''}. Consider introducing interfaces or mediator patterns to decouple modules.`;
      case 'low_cohesion':
        return `Improve cohesion in ${count} module${count > 1 ? 's' : ''} with low internal connectivity. Consider splitting into smaller, more focused modules.`;
      case 'dependency_cycle':
        return `Break ${count} dependency cycle${count > 1 ? 's' : ''} by introducing dependency inversion or extracting shared interfaces.`;
      case 'layer_violation':
      case 'reverse_dependency':
        return `Fix ${count} layer violation${count > 1 ? 's' : ''}. Ensure dependencies flow downward through the layer hierarchy.`;
      case 'high_complexity_flow':
        return `Simplify ${count} high-complexity flow${count > 1 ? 's' : ''}. Consider breaking into smaller sub-flows or extracting intermediate steps.`;
      case 'missing_entrypoint':
        return `Add clear entrypoints to ${count} flow${count > 1 ? 's' : ''} missing them. Flows should have identifiable API/route/controller entry nodes.`;
      case 'cross_module_flow':
        return `Review ${count} flow${count > 1 ? 's' : ''} spanning many modules. Consider whether cross-cutting concerns can be consolidated.`;
      case 'dead_branch':
        return `Investigate ${count} dead branch${count > 1 ? 'es' : ''} in flows. These nodes have no outgoing edges within their flow.`;
      case 'dead_code':
      case 'unused_component':
        return `Review ${count} potentially dead code item${count > 1 ? 's' : ''}. Consider removing unused code to reduce maintenance burden.`;
      case 'test_only_reachable':
        return `Review ${count} node${count > 1 ? 's' : ''} only reachable from tests. These may be test utilities or genuinely unused production code.`;
      case 'high_dead_code_ratio':
        return `Address high dead code ratio in ${count} module${count > 1 ? 's' : ''}. More than 20% of nodes appear unused.`;
      default:
        return `Address ${count} finding${count > 1 ? 's' : ''} of type "${type}".`;
    }
  }
}
