import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { loadConfig, resolveDbPath } from '../../pipeline/config.js';
import { generateWiki } from '../../pipeline/stages/07_wiki.js';
import { registerTool } from './runtime.js';
import { GraphArtifactLoader } from '../../core/graph/query/GraphArtifactLoader.js';
import { EdgePolicyTable } from '../../core/graph/traversal/EdgePolicyTable.js';
import type { QueryMode } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerWikiTools(): void {
  registerTool({
    name: 'get_wiki_page',
    description: 'Get wiki page for node (trust-aware)',
    inputSchema: { nodeId: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const config = await loadConfig();
      const db = getDB(resolveDbPath(config));
      const loader = new GraphArtifactLoader(db);
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const node = artifacts.index.nodeById[input.nodeId];
      if (!node || !EdgePolicyTable.isNodeVisible(node, mode)) {
        return { error: 'NODE_NOT_FOUND_OR_INACCESSIBLE_UNDER_POLICY' };
      }
      return { markdown: `# ${node.label}\n\nType: ${node.type}\n\nSource: ${node.source_file ?? 'UNKNOWN'}\nTrust Level: ${node.trust_level}` };
    },
  });

  registerTool({
    name: 'generate_wiki',
    description: 'Generate trust-aware wiki for workspace',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const config = await loadConfig();
      const db = getDB(resolveDbPath(config));
      const loader = new GraphArtifactLoader(db);
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = Object.values(artifacts.index.nodeById).filter(n => EdgePolicyTable.isNodeVisible(n, mode));
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

      await generateWiki(input.workspaceId, nodes, edges, db, config);
      return { ok: true, nodeCount: nodes.length };
    },
  });
}
