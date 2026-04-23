import { z } from 'zod';
import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { GraphArtifactLoader } from '../../core/graph/query/GraphArtifactLoader.js';
import { GraphQueryEngine } from '../../core/graph/query/GraphQueryEngine.js';
import { registerTool } from './runtime.js';

export function registerQueryTools(): void {
  registerTool({
    name: 'get_node',
    description: 'Get a node by id',
    inputSchema: { nodeId: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ nodeId: z.string(), workspaceId: z.string() }).parse(args);
      const engine = new GraphQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      return engine.getNode(input.nodeId);
    },
  });

  registerTool({
    name: 'get_neighbors',
    description: 'Get neighbors of a node',
    inputSchema: { nodeId: 'string', workspaceId: 'string', depth: 'number?' },
    handler: async (args) => {
      const input = z.object({ nodeId: z.string(), workspaceId: z.string(), depth: z.number().int().positive().optional() }).parse(args);
      const engine = new GraphQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      return engine.getNeighbors(input.nodeId, input.depth ?? 1);
    },
  });

  registerTool({
    name: 'get_path',
    description: 'Find path between two nodes',
    inputSchema: { fromId: 'string', toId: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ fromId: z.string(), toId: z.string(), workspaceId: z.string() }).parse(args);
      const engine = new GraphQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      return engine.getPath(input.fromId, input.toId);
    },
  });

  registerTool({
    name: 'get_lineage',
    description: 'Get lineage for a node',
    inputSchema: { nodeId: 'string', direction: 'string?', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ nodeId: z.string(), direction: z.enum(['upstream', 'downstream', 'both']).optional(), workspaceId: z.string() }).parse(args);
      const engine = new GraphQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      return engine.getLineage(input.nodeId, input.direction ?? 'both');
    },
  });

  registerTool({
    name: 'get_callers',
    description: 'Find callers of symbol',
    inputSchema: { symbol: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ symbol: z.string(), workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = db.getNodesByWorkspace(input.workspaceId, 'canonical');
      return nodes.filter((n) => n.label === input.symbol || n.symbol === input.symbol);
    },
  });
}
