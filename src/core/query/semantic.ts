import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';

export async function semanticSearch(queryVector: Float32Array, workspaceId: string, topK = 10): Promise<Array<{ nodeId: string; score: number }>> {
  const db = getDB(resolveDbPath());
  return db.findSimilarByVector(queryVector, workspaceId, topK);
}
