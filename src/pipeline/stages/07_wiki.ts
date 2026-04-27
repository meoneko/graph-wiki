import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GraphNode, GraphEdge } from '../../core/types.js';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';

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
    '## Entrypoints',
    ...entrypoints.map((n) => `- ${n.label} (${n.id}) — in:${edgeCountFor(n.id, 'in')} out:${edgeCountFor(n.id, 'out')} trust:${n.trust_level ?? n.confidence_band} source:${n.provenance?.artifact_source ?? 'UNKNOWN'}`),
    '',
    '## Warnings',
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ['- None']),
  ];

  await writeFile(path.join(root, 'README.md'), lines.join('\n'), 'utf-8');
}
