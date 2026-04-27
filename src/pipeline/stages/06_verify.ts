import { access } from 'node:fs/promises';
import path from 'node:path';
import type { GraphNode, GraphEdge } from '../../core/types.js';
import type { KnowledgeConfig, WorkspaceConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { getGraphArtifactDir, verifyGraphArtifactParity } from '../artifacts/graphArtifacts.js';
import { GraphValidator, type ValidationIssue } from '../../core/graph/validation/GraphValidator.js';
import { GovernanceValidator, type GovernanceIssue } from '../../core/graph/validation/GovernanceValidator.js';

export interface VerifyReport {
  workspaceId: string;
  passed: boolean;
  nodeCount: number;
  edgeCount: number;
  processCoverage: number;
  issues: string[];
  validationIssues?: ValidationIssue[];
  governanceIssues?: GovernanceIssue[];
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
    const expected = flowName.toLowerCase();
    const found = nodes.some((n) =>
      n.id.toLowerCase() === expected ||
      n.label.toLowerCase() === expected ||
      n.symbol?.toLowerCase() === expected ||
      n.http_path?.toLowerCase() === expected
    );
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
    const artifactDir = getGraphArtifactDir(workspace.id);
    const expected = [
      path.join(artifactDir, 'canonical.graph.json'),
      path.join(artifactDir, 'exploratory.graph.json'),
      path.join(artifactDir, 'graph.meta.json'),
      path.join(artifactDir, 'edges.jsonl'),
    ];

    for (const file of expected) {
      if (!(await exists(file))) {
        issues.push(`ARTIFACT_MISSING`);
      }
    }

    if (!issues.includes('ARTIFACT_MISSING')) {
      const fs = await import('node:fs/promises');
      try {
        const canonicalRaw = await fs.readFile(path.join(artifactDir, 'canonical.graph.json'), 'utf8');
        const exploratoryRaw = await fs.readFile(path.join(artifactDir, 'exploratory.graph.json'), 'utf8');
        const metaRaw = await fs.readFile(path.join(artifactDir, 'graph.meta.json'), 'utf8');
        const edgesRaw = await fs.readFile(path.join(artifactDir, 'edges.jsonl'), 'utf8');

        let canonical, exploratory, meta;
        try {
          canonical = JSON.parse(canonicalRaw);
          exploratory = JSON.parse(exploratoryRaw);
          meta = JSON.parse(metaRaw);
        } catch {
          issues.push('ARTIFACT_SCHEMA_INVALID');
        }

        if (canonical && exploratory && meta) {
          if (!canonical.nodes || !canonical.edges || !exploratory.nodes || !exploratory.edges) {
            issues.push('ARTIFACT_SCHEMA_INVALID');
          } else {
            const canonicalPure = canonical.nodes.every((n: any) => n.graph_kind === 'canonical') &&
              canonical.edges.every((e: any) => e.graph_kind === 'canonical');
            if (!canonicalPure) issues.push('ARTIFACT_PURITY_VIOLATION');

            const exploratoryPure = exploratory.nodes.every((n: any) => n.graph_kind === 'exploratory') &&
              exploratory.edges.every((e: any) => e.graph_kind === 'exploratory');
            if (!exploratoryPure) issues.push('ARTIFACT_PURITY_VIOLATION');

            const edgeLines = edgesRaw.trim().split('\n').filter(Boolean).length;
            if (edgeLines !== _db.getEdgesByWorkspace(workspace.id).length) {
              issues.push('ARTIFACT_WRITE_INCOMPLETE');
            }

            const parityResult = await verifyGraphArtifactParity(_db, workspace.id);
            if (parityResult.status !== 'OK') {
              issues.push('ARTIFACT_PARITY_MISMATCH');
            }
          }
        }
      } catch (e) {
        issues.push('ARTIFACT_WRITE_INCOMPLETE');
      }
    }
  }

  // Graph structural validation
  const graphValidation = GraphValidator.validate(nodes, edges, {
    externalWorkflowEnabled: workspace.external_workflow_enabled ?? false,
  });
  for (const vi of graphValidation.issues) {
    if (vi.severity === 'error') {
      const target = vi.nodeId ?? vi.edgeId ?? 'unknown';
      issues.push(`${vi.code}:${target}`);
    }
  }

  // Governance / authority chain validation
  const govValidation = GovernanceValidator.validate(nodes, edges);
  for (const gi of govValidation.issues) {
    const target = gi.nodeId ?? gi.edgeId ?? 'unknown';
    issues.push(`${gi.code}:${target}`);
  }

  return {
    workspaceId: workspace.id,
    passed: issues.length === 0,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    processCoverage: Number(processCoverage.toFixed(4)),
    issues,
    validationIssues: graphValidation.issues,
    governanceIssues: govValidation.issues,
  };
}
