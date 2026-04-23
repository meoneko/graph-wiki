import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';

export function registerSearchTools(): void {
  registerTool({
    name: 'search_fts',
    description: 'Search nodes with FTS',
    inputSchema: { query: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ query: z.string(), workspaceId: z.string() }).parse(args);
      return getDB(resolveDbPath()).searchNodesFTS(input.query, input.workspaceId, 25);
    },
  });

  registerTool({
    name: 'search_semantic',
    description: 'Search by vector similarity',
    inputSchema: { vector: 'number[]', workspaceId: 'string', topK: 'number?' },
    handler: async (args) => {
      const input = z.object({ vector: z.array(z.number()), workspaceId: z.string(), topK: z.number().int().positive().optional() }).parse(args);
      return getDB(resolveDbPath()).findSimilarByVector(new Float32Array(input.vector), input.workspaceId, input.topK ?? 10);
    },
  });

  registerTool({
    name: 'search_nodes',
    description: 'Hybrid search nodes',
    inputSchema: { query: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ query: z.string(), workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const fts = db.searchNodesFTS(input.query, input.workspaceId, 50);
      return fts;
    },
  });
}
