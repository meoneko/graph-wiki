import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';

export function registerRefactorTools(): void {
  registerTool({
    name: 'rename_preview',
    description: 'Preview symbol rename impact',
    inputSchema: { oldSymbol: 'string', newSymbol: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ oldSymbol: z.string(), newSymbol: z.string(), workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const hits = db.getNodesByWorkspace(input.workspaceId, 'canonical').filter((n) => n.symbol?.includes(input.oldSymbol));
      return { affectedFiles: [...new Set(hits.map((h) => h.source_file).filter(Boolean))], proposedSymbol: input.newSymbol };
    },
  });

  registerTool({
    name: 'find_dead_code',
    description: 'Find unreferenced symbols',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = db.getNodesByWorkspace(input.workspaceId, 'canonical');
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      return nodes.filter((n) => !edges.some((e) => e.to_id === n.id));
    },
  });
}
