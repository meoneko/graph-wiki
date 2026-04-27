import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerSearchTools(): void {
  registerTool({
    name: 'search',
    description: 'Search visible graph nodes with trust-aware filtering',
    inputSchema: { query: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        query: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.search.search' });
      return engine.searchNodes(input.query, operation, input.mode as QueryMode, 50);
    },
  });

}
