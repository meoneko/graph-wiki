import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { GraphArtifactLoader } from '../../core/graph/query/GraphArtifactLoader.js';
import { EdgePolicyTable } from '../../core/graph/traversal/EdgePolicyTable.js';
import type { QueryMode } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerSearchTools(): void {
  registerTool({
    name: 'search_fts',
    description: 'Search nodes with FTS (trust-aware)',
    inputSchema: { query: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        query: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const db = getDB(resolveDbPath());
      const loader = new GraphArtifactLoader(db);
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const rawResults = db.searchNodesFTS(input.query, input.workspaceId, 50);
      // Filter results to ensure they belong to allowed layers and satisfy policy
      return rawResults.filter(node => {
        const hydrated = artifacts.index.nodeById[node.id];
        return hydrated && EdgePolicyTable.isNodeVisible(hydrated, mode);
      });
    },
  });

  registerTool({
    name: 'search_nodes',
    description: 'Hybrid search nodes (trust-aware)',
    inputSchema: { query: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        query: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const db = getDB(resolveDbPath());
      const loader = new GraphArtifactLoader(db);
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const rawResults = db.searchNodesFTS(input.query, input.workspaceId, 50);
      return rawResults.filter(node => {
        const hydrated = artifacts.index.nodeById[node.id];
        return hydrated && EdgePolicyTable.isNodeVisible(hydrated, mode);
      });
    },
  });
}
