import { access } from 'node:fs/promises';
import path from 'node:path';
import type { GraphNode, GraphEdge } from '../../core/types.js';
import type { KnowledgeConfig, WorkspaceConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';

export interface VerifyReport {
  workspaceId: string;
  passed: boolean;
  nodeCount: number;
  edgeCount: number;
  processCoverage: number;
  issues: string[];
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function verifyGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  workspace: WorkspaceConfig,
  _db: GraphDB,
  config: KnowledgeConfig,
): Promise<VerifyReport> {
  const issues: string[] = [];
  if (nodes.length === 0) issues.push('NO_NODES');
  if (edges.length === 0) issues.push('NO_EDGES');

  const verification = workspace.verification ?? {};

  const entrypoints = nodes.filter((n) => n.type.includes('route') || n.type.includes('controller') || n.type.includes('api'));
  if (verification.require_flows && entrypoints.length === 0) {
    issues.push('FLOWS_REQUIRED_BUT_NOT_FOUND');
  }

  for (const flowName of verification.required_golden_flows ?? []) {
    const found = nodes.some((n) => n.label.toLowerCase().includes(flowName.toLowerCase()));
    if (!found) issues.push(`MISSING_GOLDEN_FLOW:${flowName}`);
  }

  const touched = new Set<string>();
  for (const edge of edges) {
    touched.add(edge.from_id);
    touched.add(edge.to_id);
  }
  const processCoverage = nodes.length === 0 ? 0 : touched.size / nodes.length;

  if ((verification.min_process_coverage ?? 0) > processCoverage) {
    issues.push(`LOW_PROCESS_COVERAGE:${processCoverage.toFixed(3)}<${(verification.min_process_coverage ?? 0).toFixed(3)}`);
  }

  if (verification.require_artifact_parity) {
    const wikiRoot = resolveOutputPath(config, 'wiki_root');
    const reportsRoot = resolveOutputPath(config, 'reports_root');
    const expected = [
      path.join(wikiRoot, workspace.id, 'README.md'),
      path.join(reportsRoot, workspace.id, 'ai-enrichment.json'),
    ];

    for (const file of expected) {
      if (!(await exists(file))) {
        issues.push(`ARTIFACT_PARITY_MISSING:${file}`);
      }
    }
  }

  return {
    workspaceId: workspace.id,
    passed: issues.length === 0,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    processCoverage: Number(processCoverage.toFixed(4)),
    issues,
  };
}
