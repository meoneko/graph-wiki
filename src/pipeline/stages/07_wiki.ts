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
    '## Domains',
    ...(topDomains.length > 0 ? topDomains.map((d) => `- ${d}`) : ['- UNKNOWN']),
    '',
    '## Entrypoints',
    ...entrypoints.map((n) => `- ${n.label} (${n.id})`),
  ];

  await writeFile(path.join(root, 'README.md'), lines.join('\n'), 'utf-8');
}
