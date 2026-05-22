import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { StructuredAskEngine } from '../../core/ask/StructuredAskEngine.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

/**
 * Creates a StructuredAskEngine instance backed by TrustedQueryService.
 * Used by the search tool to route through the structured ask layer
 * with 'what-is-symbol' query type for trust-aware search.
 */
function createAskEngine(): StructuredAskEngine {
  const service = getTrustedQueryService(getDB(resolveDbPath()));
  return new StructuredAskEngine((workspaceId) => service.engine(workspaceId));
}

export function registerSearchTools(): void {
  registerTool({
    name: 'search',
    description: 'Search visible graph nodes with trust-aware filtering',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
        semantic: { type: 'boolean', description: 'Enable hybrid FTS + embedding search' },
      },
      required: ['query', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        query: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema,
        semantic: z.boolean().optional().default(false),
      }).parse(args);
      // Validate caller registration through OperationResolver
      OperationResolver.resolve({ caller: 'mcp.search.search' });
      // Route through StructuredAskEngine with 'what-is-symbol' query type
      // for trust-aware search with full QueryResult semantics
      const askEngine = createAskEngine();

      // When semantic is requested, use TrustAwareQueryEngine directly with search options
      if (input.semantic) {
        const service = getTrustedQueryService(getDB(resolveDbPath()));
        const operation = OperationResolver.resolve({ caller: 'mcp.search.search' });
        return service.engine(input.workspaceId).searchNodes(
          input.query,
          operation,
          input.mode as QueryMode,
          undefined,
          { semantic: true },
        );
      }

      return askEngine.ask({
        question: input.query,
        workspace: input.workspaceId,
        queryType: 'what-is-symbol',
        mode: input.mode as QueryMode,
      });
    },
  });
}
