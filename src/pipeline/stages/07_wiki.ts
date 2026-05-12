import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GraphNode, GraphEdge } from '../../core/types.js';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { computeFlows } from '../../core/flows.js';
import { GraphValidator } from '../../core/graph/validation/GraphValidator.js';

const CENTRALITY_EDGE_TYPES = new Set(['calls', 'invokes', 'delegates_to', 'triggers', 'dispatches_to', 'precedes', 'canonical_dependency', 'derived_dependency']);

function trustDistributionByKind(nodes: GraphNode[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const node of nodes) {
    const kind = node.graph_kind;
    const band = node.confidence_band;
    out[kind] ??= {};
    out[kind][band] = (out[kind][band] ?? 0) + 1;
  }
  return out;
}

function whereToStart(nodes: GraphNode[], edges: GraphEdge[]): Array<{ node: GraphNode; score: number; reason: string }> {
  const incoming = new Map<string, number>();
  for (const edge of edges) {
    if (!CENTRALITY_EDGE_TYPES.has(edge.type)) continue;
    incoming.set(edge.to_id, (incoming.get(edge.to_id) ?? 0) + 1);
  }
  return nodes
    .filter((node) => node.graph_kind === 'canonical')
    .map((node) => {
      const isEntrypoint = Boolean(node.metadata?.is_entrypoint) || node.type.includes('route') || node.type.includes('controller') || node.type.includes('api');
      const score = (incoming.get(node.id) ?? 0) + (isEntrypoint ? 5 : 0);
      return {
        node,
        score,
        reason: isEntrypoint ? 'entrypoint boosted by incoming centrality' : 'high incoming centrality',
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export async function generateWiki(
  workspaceId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  _db: GraphDB,
  config: KnowledgeConfig,
): Promise<void> {
  const root = path.join(resolveOutputPath(config, 'wiki_root'), workspaceId);
  await mkdir(root, { recursive: true });

  const entrypoints = nodes.filter((n) => n.type.includes('api') || n.type.includes('controller') || n.type.includes('route'));
  const topDomains = [...new Set(nodes.map((n) => n.domain).filter(Boolean))] as string[];
  const flows = computeFlows(nodes, edges).slice(0, 10);
  const startPoints = whereToStart(nodes, edges);
  const trustByKind = trustDistributionByKind(nodes);
  const { issues: validationIssues } = GraphValidator.validate(nodes, edges);

  const trustCounts = {
    AUTHORITATIVE: nodes.filter(n => n.trust_level === 'AUTHORITATIVE').length,
    DERIVED: nodes.filter(n => n.trust_level === 'DERIVED').length,
    EXPLORATORY: nodes.filter(n => n.trust_level === 'EXPLORATORY').length,
    EXTERNAL: nodes.filter(n => n.graph_kind === 'external').length,
  };
  const edgeTrustCounts = {
    AUTHORITATIVE: edges.filter(e => e.trust_level === 'AUTHORITATIVE').length,
    DERIVED: edges.filter(e => e.trust_level === 'DERIVED').length,
    EXPLORATORY: edges.filter(e => e.trust_level === 'EXPLORATORY').length,
  };
  const edgeCountFor = (nodeId: string, direction: 'in' | 'out'): number =>
    edges.filter((edge) => direction === 'in' ? edge.to_id === nodeId : edge.from_id === nodeId).length;
  const warnings = [
    ...(trustCounts.DERIVED > 0 ? [`Derived nodes present: ${trustCounts.DERIVED}`] : []),
    ...(trustCounts.EXPLORATORY > 0 ? [`Exploratory nodes present: ${trustCounts.EXPLORATORY}`] : []),
    ...(nodes.some((node) => !node.provenance?.artifact_source) ? ['Nodes missing provenance artifact source'] : []),
  ];

  const lines = [
    `# Workspace ${workspaceId}`,
    '',
    '## System Stats',
    `- Nodes: ${nodes.length}`,
    `- Edges: ${edges.length}`,
    `- Entrypoints: ${entrypoints.length}`,
    '',
    '## Trust Distribution (Fail-Closed System)',
    `- **Authoritative**: ${trustCounts.AUTHORITATIVE} (Direct from source)`,
    `- **Derived**: ${trustCounts.DERIVED} (Inferred from code structure)`,
    `- **Exploratory**: ${trustCounts.EXPLORATORY} (Weak links/FTS)`,
    `- **External**: ${trustCounts.EXTERNAL} (Third-party docs)`,
    '',
    '## Edge Trust Distribution',
    `- **Authoritative**: ${edgeTrustCounts.AUTHORITATIVE}`,
    `- **Derived**: ${edgeTrustCounts.DERIVED}`,
    `- **Exploratory**: ${edgeTrustCounts.EXPLORATORY}`,
    '',
    '## Domains',
    ...(topDomains.length > 0 ? topDomains.map((d) => `- ${d}`) : ['- UNKNOWN']),
    '',
    '## Important Flows',
    ...(flows.length > 0 ? flows.map((flow) => `- ${flow.name} (${flow.id}) — nodes:${flow.nodeIds.length} edges:${flow.edgeIds.length}`) : ['- None detected']),
    '',
    '## Where To Start Reading',
    ...(startPoints.length > 0 ? startPoints.map(({ node, score, reason }) => `- ${node.label} (${node.id}) — score:${score} reason:${reason} source:${node.source_file ?? 'UNKNOWN'}`) : ['- No canonical start points found']),
    '',
    '## Entrypoints',
    ...entrypoints.map((n) => `- ${n.label} (${n.id}) — in:${edgeCountFor(n.id, 'in')} out:${edgeCountFor(n.id, 'out')} trust:${n.trust_level ?? n.confidence_band} source:${n.provenance?.artifact_source ?? 'UNKNOWN'}`),
    '',
    '## Graph Quality Summary',
    `- Validation errors: ${validationIssues.filter((i) => i.severity === 'error').length}`,
    `- Validation warnings: ${validationIssues.filter((i) => i.severity === 'warning').length}`,
    `- Nodes missing provenance artifact source: ${nodes.filter((node) => !node.provenance?.artifact_source).length}`,
    `- Edges missing provenance artifact source: ${edges.filter((edge) => !edge.provenance?.artifact_source).length}`,
    ...(validationIssues.length > 0 ? [
      '',
      '### Top Validation Issues',
      ...validationIssues.slice(0, 5).map((issue) =>
        `- [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.detail}${issue.suggestion ? ` → ${issue.suggestion}` : ''}`,
      ),
      ...(validationIssues.length > 5 ? [`- … and ${validationIssues.length - 5} more (see graph-quality.json)`] : []),
    ] : []),
    '',
    '## Trust Distribution By Graph Kind',
    '```json',
    JSON.stringify(trustByKind, null, 2),
    '```',
    '',
    '## Warnings',
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ['- None']),
  ];

  await writeFile(path.join(root, 'README.md'), lines.join('\n'), 'utf-8');
}
