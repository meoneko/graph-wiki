import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { loadConfig, resolveDbPath } from '../../pipeline/config.js';
import { generateWiki } from '../../pipeline/stages/07_wiki.js';
import { registerTool } from './runtime.js';

export function registerWikiTools(): void {
  registerTool({
    name: 'get_wiki_page',
    description: 'Get wiki page for node',
    inputSchema: { nodeId: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ nodeId: z.string(), workspaceId: z.string() }).parse(args);
      const config = await loadConfig();
      const db = getDB(resolveDbPath(config));
      const node = db.getNode(input.nodeId);
      if (!node) throw new Error('NODE_NOT_FOUND');
      return { markdown: `# ${node.label}\n\nType: ${node.type}\n\nSource: ${node.source_file ?? 'UNKNOWN'}` };
    },
  });

  registerTool({
    name: 'generate_wiki',
    description: 'Generate wiki for workspace',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const config = await loadConfig();
      const db = getDB(resolveDbPath(config));
      await generateWiki(input.workspaceId, db.getNodesByWorkspace(input.workspaceId, 'canonical'), db.getEdgesByWorkspace(input.workspaceId), db, config);
      return { ok: true };
    },
  });
}
