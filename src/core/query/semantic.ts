import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { getTrustedQueryService } from '../graph/query/TrustedQueryService.js';
import { OperationResolver } from '../graph/query/OperationResolver.js';

export async function semanticSearch(queryVector: Float32Array, workspaceId: string, topK = 10): Promise<Array<{ nodeId: string; score: number }>> {
  const db = getDB(resolveDbPath());
  const operation = OperationResolver.resolve({ caller: 'mcp.search.search' });
  const graph = await getTrustedQueryService(db).engine(workspaceId).getVisibleGraph(operation, 'mixed_safe');
  const visibleIds = new Set(graph.nodes.map((node) => node.id));
  return db.findSimilarByVector(queryVector, workspaceId, topK)
    .filter((match) => visibleIds.has(match.nodeId));
}
