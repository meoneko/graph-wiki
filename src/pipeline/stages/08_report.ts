import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GraphEdge, GraphNode } from '../../core/types.js';
import { computeGraphMetrics, type GraphAnalyticalMetrics } from '../../core/graph/analysis/metrics.js';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';

export interface ReportGraphInput {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function writeReport(
  workspaceId: string,
  report: unknown,
  config: KnowledgeConfig,
  graph?: ReportGraphInput,
): Promise<void> {
  const root = path.join(resolveOutputPath(config, 'reports_root'), workspaceId);
  await mkdir(root, { recursive: true });

  await writeFile(path.join(root, 'verification.json'), JSON.stringify(report, null, 2), 'utf-8');

  const verification = report as {
    passed?: boolean;
    issues?: string[];
    nodeCount?: number;
    edgeCount?: number;
    graphQualityIssues?: Array<{ severity: 'error' | 'warning' }>;
  };
  const graphQualityIssueCounts = (verification.graphQualityIssues ?? []).reduce(
    (acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] ?? 0) + 1;
      return acc;
    },
    { error: 0, warning: 0 } as Record<'error' | 'warning', number>,
  );
  const metrics: GraphAnalyticalMetrics | undefined = graph
    ? computeGraphMetrics({ nodes: graph.nodes, edges: graph.edges })
    : undefined;

  const digest = {
    workspaceId,
    generatedAt: new Date().toISOString(),
    summary: verification.passed ? 'PASS' : 'FAIL',
    nodeCount: verification.nodeCount ?? 0,
    edgeCount: verification.edgeCount ?? 0,
    issueCount: verification.issues?.length ?? 0,
    graphQualityIssueCounts,
    graphMetrics: metrics ? {
      hotspotCount: metrics.hotspots.length,
      bridgeCount: metrics.bridges.length,
      orphanCount: metrics.orphans.length,
      weakZoneCount: metrics.weakZones.length,
    } : undefined,
  };

  const lint = {
    workspaceId,
    generatedAt: new Date().toISOString(),
    unknownToken: config.scheduler?.reporting?.unknown_token ?? 'UNKNOWN',
    inferredToken: config.scheduler?.reporting?.inferred_token ?? 'INFERRED_LOW_CONFIDENCE',
    violations: verification.issues ?? [],
  };

  await Promise.all([
    writeFile(path.join(root, 'digest.json'), JSON.stringify(digest, null, 2), 'utf-8'),
    writeFile(path.join(root, 'graph-quality.json'), JSON.stringify({
      workspaceId,
      generatedAt: new Date().toISOString(),
      issues: verification.graphQualityIssues ?? [],
      counts: graphQualityIssueCounts,
    }, null, 2), 'utf-8'),
    writeFile(path.join(root, 'lint.json'), JSON.stringify(lint, null, 2), 'utf-8'),
    ...(metrics ? [
      writeFile(path.join(root, 'metrics.json'), JSON.stringify({
        workspaceId,
        generatedAt: new Date().toISOString(),
        ...metrics,
      }, null, 2), 'utf-8'),
    ] : []),
  ]);
}
