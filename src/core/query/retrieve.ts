import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';

export async function retrieve(query: string, workspaceId: string): Promise<string[]> {
  const db = getDB(resolveDbPath());
  const hits = db.searchNodesFTS(query, workspaceId, 20);
  return hits.map((h) => h.id);
}
