/**
 * ReportBuilder — Generates verification and quality reports for the knowledge graph.
 *
 * Produces 8 report types:
 * - graph-quality.json: precision, recall, confidence_distribution, provenance_distribution
 * - verification.json: passed, issues, invariants_checked, invariants_passed
 * - lint.json: structural issues in the graph
 * - digest.json: high-level summary
 * - metrics.json: analytical metrics (hotspots, bridges, orphans, weak zones)
 * - edge-health.json: edge quality and distribution
 * - ask-readiness-report.json: StructuredAskEngine capability assessment
 * - agent-context-readiness-report.json: AgentContextBuilder capability assessment
 *
 * CallerID 'report-builder' is registered in OperationResolver with implicit operation 'wiki'.
 *
 * @see Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ConfidenceBand, GraphEdge, GraphNode, QueryResult } from '../../core/types.js';
import { DecisionStatus } from '../../core/errors.js';
import { computeGraphMetrics, type GraphAnalyticalMetrics } from '../../core/graph/analysis/metrics.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import type { TrustAwareQueryEngine } from '../../core/graph/query/TrustAwareQueryEngine.js';
import type { StructuredAskEngine, StructuredQueryType } from '../../core/ask/StructuredAskEngine.js';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';

// ─── Report Interfaces ───────────────────────────────────────────────────────

export interface QualityReport {
  workspaceId: string;
  generatedAt: string;
  precision: number;
  recall: number;
  confidence_distribution: Record<ConfidenceBand, number>;
  provenance_distribution: Record<string, number>;
}

export interface VerificationReport {
  passed: boolean;
  issues: string[];
  invariants_checked: number;
  invariants_passed: number;
}

export interface LintIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface LintReport {
  workspaceId: string;
  generatedAt: string;
  issues: LintIssue[];
  counts: { error: number; warning: number; info: number };
}

export interface DigestReport {
  workspaceId: string;
  generatedAt: string;
  summary: 'PASS' | 'FAIL';
  nodeCount: number;
  edgeCount: number;
  canonicalNodeCount: number;
  exploratoryNodeCount: number;
  canonicalEdgeCount: number;
  exploratoryEdgeCount: number;
  issueCount: number;
}

export interface MetricsReport {
  workspaceId: string;
  generatedAt: string;
  hotspots: GraphAnalyticalMetrics['hotspots'];
  bridges: GraphAnalyticalMetrics['bridges'];
  orphans: GraphAnalyticalMetrics['orphans'];
  weakZones: GraphAnalyticalMetrics['weakZones'];
}

export interface EdgeHealthReport {
  workspaceId: string;
  generatedAt: string;
  totalEdges: number;
  edgesByType: Record<string, number>;
  edgesByGraphKind: Record<string, number>;
  edgesByConfidenceBand: Record<string, number>;
  orphanedEdges: number;
  missingSourceNode: number;
  missingTargetNode: number;
}

export interface AskReadinessReport {
  workspaceId: string;
  generatedAt: string;
  ready: boolean;
  queryTypes: Array<{
    type: string;
    status: 'ready' | 'partial' | 'unavailable';
    reason?: string;
  }>;
  overallStatus: 'ready' | 'partial' | 'unavailable';
}

export interface AgentContextReadinessReport {
  workspaceId: string;
  generatedAt: string;
  ready: boolean;
  capabilities: {
    nodeSearch: boolean;
    impactAnalysis: boolean;
    callerLookup: boolean;
    graphStats: boolean;
  };
  overallStatus: 'ready' | 'partial' | 'unavailable';
}

// ─── ReportBuilder ───────────────────────────────────────────────────────────

export class ReportBuilder {
  private readonly reportsRoot: string;

  constructor(
    private readonly config: KnowledgeConfig,
    private readonly engineFactory?: (workspaceId: string) => TrustAwareQueryEngine,
    private readonly askEngine?: StructuredAskEngine,
  ) {
    this.reportsRoot = resolveOutputPath(config, 'reports_root');
  }

  private async ensureDir(workspaceId: string): Promise<string> {
    const dir = path.join(this.reportsRoot, workspaceId);
    await mkdir(dir, { recursive: true });
    return dir;
  }

  /**
   * Write graph quality report — precision, recall, confidence_distribution, provenance_distribution.
   * Precision: ratio of canonical nodes with full provenance.
   * Recall: ratio of nodes that have at least one edge (connected to the graph).
   */
  async writeQualityReport(workspaceId: string, nodes: GraphNode[], edges: GraphEdge[]): Promise<QualityReport> {
    const dir = await this.ensureDir(workspaceId);

    // Precision: canonical nodes with full provenance / total canonical nodes
    const canonicalNodes = nodes.filter(n => n.graph_kind === 'canonical');
    const canonicalWithProvenance = canonicalNodes.filter(
      n => n.provenance && n.provenance.source && n.provenance.artifact_source,
    );
    const precision = canonicalNodes.length > 0
      ? canonicalWithProvenance.length / canonicalNodes.length
      : 0;

    // Recall: nodes connected to at least one edge / total nodes
    const connectedNodeIds = new Set<string>();
    for (const edge of edges) {
      connectedNodeIds.add(edge.from_id);
      connectedNodeIds.add(edge.to_id);
    }
    const recall = nodes.length > 0
      ? nodes.filter(n => connectedNodeIds.has(n.id)).length / nodes.length
      : 0;

    // Confidence distribution
    const confidence_distribution: Record<ConfidenceBand, number> = {
      AUTHORITATIVE: 0,
      EXTRACTED: 0,
      INFERRED: 0,
      AMBIGUOUS: 0,
    };
    for (const node of nodes) {
      const band = node.confidence_band;
      if (band in confidence_distribution) {
        confidence_distribution[band]++;
      }
    }
    for (const edge of edges) {
      const band = edge.confidence_band;
      if (band in confidence_distribution) {
        confidence_distribution[band]++;
      }
    }

    // Provenance distribution
    const provenance_distribution: Record<string, number> = {};
    for (const node of nodes) {
      const source = node.provenance?.source ?? 'unknown';
      provenance_distribution[source] = (provenance_distribution[source] ?? 0) + 1;
    }
    for (const edge of edges) {
      const source = edge.provenance?.source ?? 'unknown';
      provenance_distribution[source] = (provenance_distribution[source] ?? 0) + 1;
    }

    const report: QualityReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      precision: Math.round(precision * 10000) / 10000,
      recall: Math.round(recall * 10000) / 10000,
      confidence_distribution,
      provenance_distribution,
    };

    await writeFile(path.join(dir, 'graph-quality.json'), JSON.stringify(report, null, 2), 'utf-8');
    return report;
  }

  /**
   * Write verification report — passed, issues, invariants_checked, invariants_passed.
   */
  async writeVerificationReport(workspaceId: string, report: VerificationReport): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    const output = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      passed: report.passed,
      issues: report.issues,
      invariants_checked: report.invariants_checked,
      invariants_passed: report.invariants_passed,
    };

    await writeFile(path.join(dir, 'verification.json'), JSON.stringify(output, null, 2), 'utf-8');
  }

  /**
   * Write lint report — structural issues in the graph.
   */
  async writeLintReport(workspaceId: string, issues: LintIssue[]): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    const counts = { error: 0, warning: 0, info: 0 };
    for (const issue of issues) {
      counts[issue.severity]++;
    }

    const report: LintReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      issues,
      counts,
    };

    await writeFile(path.join(dir, 'lint.json'), JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Write digest — high-level summary of graph state.
   */
  async writeDigest(workspaceId: string, nodes?: GraphNode[], edges?: GraphEdge[], passed?: boolean): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    const allNodes = nodes ?? [];
    const allEdges = edges ?? [];

    const canonicalNodeCount = allNodes.filter(n => n.graph_kind === 'canonical').length;
    const exploratoryNodeCount = allNodes.filter(n => n.graph_kind === 'exploratory').length;
    const canonicalEdgeCount = allEdges.filter(e => e.graph_kind === 'canonical').length;
    const exploratoryEdgeCount = allEdges.filter(e => e.graph_kind === 'exploratory').length;

    const digest: DigestReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      summary: passed !== false ? 'PASS' : 'FAIL',
      nodeCount: allNodes.length,
      edgeCount: allEdges.length,
      canonicalNodeCount,
      exploratoryNodeCount,
      canonicalEdgeCount,
      exploratoryEdgeCount,
      issueCount: 0,
    };

    await writeFile(path.join(dir, 'digest.json'), JSON.stringify(digest, null, 2), 'utf-8');
  }

  /**
   * Write metrics — analytical metrics (hotspots, bridges, orphans, weak zones).
   */
  async writeMetrics(workspaceId: string, nodes?: GraphNode[], edges?: GraphEdge[]): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    const allNodes = nodes ?? [];
    const allEdges = edges ?? [];

    const metrics: GraphAnalyticalMetrics = computeGraphMetrics({ nodes: allNodes, edges: allEdges });

    const report: MetricsReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      ...metrics,
    };

    await writeFile(path.join(dir, 'metrics.json'), JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Write edge health — edge quality and distribution analysis.
   */
  async writeEdgeHealth(workspaceId: string, edges: GraphEdge[], nodes?: GraphNode[]): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    const nodeIds = new Set((nodes ?? []).map(n => n.id));

    const edgesByType: Record<string, number> = {};
    const edgesByGraphKind: Record<string, number> = {};
    const edgesByConfidenceBand: Record<string, number> = {};
    let missingSourceNode = 0;
    let missingTargetNode = 0;

    for (const edge of edges) {
      edgesByType[edge.type] = (edgesByType[edge.type] ?? 0) + 1;
      edgesByGraphKind[edge.graph_kind] = (edgesByGraphKind[edge.graph_kind] ?? 0) + 1;
      edgesByConfidenceBand[edge.confidence_band] = (edgesByConfidenceBand[edge.confidence_band] ?? 0) + 1;

      if (nodes && !nodeIds.has(edge.from_id)) missingSourceNode++;
      if (nodes && !nodeIds.has(edge.to_id)) missingTargetNode++;
    }

    const orphanedEdges = missingSourceNode + missingTargetNode;

    const report: EdgeHealthReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      totalEdges: edges.length,
      edgesByType,
      edgesByGraphKind,
      edgesByConfidenceBand,
      orphanedEdges,
      missingSourceNode,
      missingTargetNode,
    };

    await writeFile(path.join(dir, 'edge-health.json'), JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Write ask readiness — query StructuredAskEngine capabilities.
   * Probes each query type to determine if the engine can answer queries.
   */
  async writeAskReadiness(workspaceId: string): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    // Resolve operation through OperationResolver to validate CallerID
    OperationResolver.resolve({ caller: 'report-builder', requested: 'wiki' });

    const queryTypes: StructuredQueryType[] = [
      'what-is-symbol',
      'what-depends-on',
      'what-route-calls',
      'lineage',
      'impact',
      'why-canonical',
      'why-insufficient-context',
    ];

    const results: AskReadinessReport['queryTypes'] = [];

    if (this.askEngine) {
      for (const queryType of queryTypes) {
        try {
          const result: QueryResult = await this.askEngine.ask({
            question: '__readiness_probe__',
            workspace: workspaceId,
            queryType,
            mode: 'authoritative',
          });

          if (result.status === DecisionStatus.OK || result.status === DecisionStatus.PARTIAL) {
            results.push({ type: queryType, status: 'ready' });
          } else if (result.status === DecisionStatus.INSUFFICIENT_EVIDENCE) {
            results.push({ type: queryType, status: 'partial', reason: 'No data available for probe query' });
          } else {
            results.push({ type: queryType, status: 'partial', reason: `Status: ${result.status}` });
          }
        } catch {
          results.push({ type: queryType, status: 'unavailable', reason: 'Engine threw an error' });
        }
      }
    } else if (this.engineFactory) {
      // Fallback: probe the query engine directly
      try {
        const engine = this.engineFactory(workspaceId);
        const statsResult = await engine.getGraphStats('wiki', 'authoritative');
        const hasData = statsResult.data.nodes.length > 0;

        for (const queryType of queryTypes) {
          results.push({
            type: queryType,
            status: hasData ? 'ready' : 'partial',
            reason: hasData ? undefined : 'Graph has no visible nodes',
          });
        }
      } catch {
        for (const queryType of queryTypes) {
          results.push({ type: queryType, status: 'unavailable', reason: 'Engine not available' });
        }
      }
    } else {
      for (const queryType of queryTypes) {
        results.push({ type: queryType, status: 'unavailable', reason: 'No engine configured' });
      }
    }

    const readyCount = results.filter(r => r.status === 'ready').length;
    const overallStatus: AskReadinessReport['overallStatus'] =
      readyCount === results.length ? 'ready' :
      readyCount > 0 ? 'partial' : 'unavailable';

    const report: AskReadinessReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      ready: overallStatus === 'ready',
      queryTypes: results,
      overallStatus,
    };

    await writeFile(path.join(dir, 'ask-readiness-report.json'), JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Write agent context readiness — query AgentContextBuilder capabilities.
   * Probes the query engine to assess if agent context can be built.
   */
  async writeAgentContextReadiness(workspaceId: string): Promise<void> {
    const dir = await this.ensureDir(workspaceId);

    // Resolve operation through OperationResolver to validate CallerID
    OperationResolver.resolve({ caller: 'report-builder', requested: 'wiki' });

    const capabilities = {
      nodeSearch: false,
      impactAnalysis: false,
      callerLookup: false,
      graphStats: false,
    };

    if (this.engineFactory) {
      const engine = this.engineFactory(workspaceId);

      // Probe node search
      try {
        const result = await engine.searchNodes('__probe__', 'ask', 'authoritative');
        capabilities.nodeSearch = result.status !== DecisionStatus.POLICY_VIOLATION;
      } catch { /* unavailable */ }

      // Probe impact analysis
      try {
        const result = await engine.getGraphStats('impact', 'authoritative');
        capabilities.impactAnalysis = result.status !== DecisionStatus.POLICY_VIOLATION;
      } catch { /* unavailable */ }

      // Probe caller lookup
      try {
        const result = await engine.findCallers('__probe__', 'lineage', 'authoritative');
        capabilities.callerLookup = result.status !== DecisionStatus.POLICY_VIOLATION;
      } catch { /* unavailable */ }

      // Probe graph stats
      try {
        const result = await engine.getGraphStats('wiki', 'authoritative');
        capabilities.graphStats = result.status !== DecisionStatus.POLICY_VIOLATION;
      } catch { /* unavailable */ }
    }

    const capValues = Object.values(capabilities);
    const readyCount = capValues.filter(Boolean).length;
    const overallStatus: AgentContextReadinessReport['overallStatus'] =
      readyCount === capValues.length ? 'ready' :
      readyCount > 0 ? 'partial' : 'unavailable';

    const report: AgentContextReadinessReport = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      ready: overallStatus === 'ready',
      capabilities,
      overallStatus,
    };

    await writeFile(
      path.join(dir, 'agent-context-readiness-report.json'),
      JSON.stringify(report, null, 2),
      'utf-8',
    );
  }
}

// ─── Legacy writeReport function (backward compat) ───────────────────────────

export interface ReportGraphInput {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * @deprecated Use ReportBuilder class instead. Kept for backward compatibility.
 */
export async function writeReport(
  workspaceId: string,
  report: unknown,
  config: KnowledgeConfig,
  graph?: ReportGraphInput,
): Promise<void> {
  const builder = new ReportBuilder(config);
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const verification = report as {
    passed?: boolean;
    issues?: string[];
    invariants_checked?: number;
    invariants_passed?: number;
    graphQualityIssues?: Array<{ id?: string; severity: 'error' | 'warning'; message?: string }>;
  };

  // Write verification report
  await builder.writeVerificationReport(workspaceId, {
    passed: verification.passed ?? false,
    issues: verification.issues ?? [],
    invariants_checked: verification.invariants_checked ?? 0,
    invariants_passed: verification.invariants_passed ?? 0,
  });

  // Write quality report
  await builder.writeQualityReport(workspaceId, nodes, edges);

  // Write lint report
  const lintIssues: LintIssue[] = (verification.graphQualityIssues ?? []).map((issue, idx) => ({
    id: issue.id ?? `lint-${idx}`,
    severity: issue.severity,
    message: issue.message ?? 'Unknown issue',
  }));
  await builder.writeLintReport(workspaceId, lintIssues);

  // Write digest
  await builder.writeDigest(workspaceId, nodes, edges, verification.passed);

  // Write metrics
  if (nodes.length > 0) {
    await builder.writeMetrics(workspaceId, nodes, edges);
  }
}
