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

  const lines = [
    `# Workspace ${workspaceId}`,
    '',
    `Nodes: ${nodes.length}`,
    `Edges: ${edges.length}`,
    `Entrypoints: ${entrypoints.length}`,
    '',
    '## Domains',
    ...(topDomains.length > 0 ? topDomains.map((d) => `- ${d}`) : ['- UNKNOWN']),
    '',
    '## Entrypoints',
    ...entrypoints.map((n) => `- ${n.label} (${n.id})`),
  ];

  await writeFile(path.join(root, 'README.md'), lines.join('\n'), 'utf-8');
}
