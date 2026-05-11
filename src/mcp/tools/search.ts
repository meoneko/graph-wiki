import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { SearchNodesInput } from '../schemas/index.js';

export function registerSearchTools(): void {
  registerTool({
    name: 'search_nodes',
    description: 'Search visible graph nodes with trust-aware filtering',
    inputSchema: SearchNodesInput,
    handler: async (args) => {
      const input = SearchNodesInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.search.search' });
      return engine.searchNodes(input.query, operation, input.mode as QueryMode, input.limit, input.projectId);
    },
  });
}
