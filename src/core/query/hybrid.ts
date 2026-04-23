import { retrieve } from './retrieve.js';

export async function hybridSearch(query: string, workspaceId: string): Promise<string[]> {
  return retrieve(query, workspaceId);
}
