import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { getTrustedQueryService } from '../graph/query/TrustedQueryService.js';
import { OperationResolver } from '../graph/query/OperationResolver.js';

export async function retrieve(query: string, workspaceId: string): Promise<string[]> {
  const operation = OperationResolver.resolve({ caller: 'mcp.search.search' });
  const result = await getTrustedQueryService(getDB(resolveDbPath()))
    .engine(workspaceId)
    .searchNodes(query, operation, 'mixed_safe', 20);
  return result.data.nodes.map((h) => h.id);
}
