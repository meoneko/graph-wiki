import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { detectCommunities, generateArchitectureOverview } from '../../core/graph/analysis/community.js';
import { registerTool } from './runtime.js';

export function registerGraphTools(): void {
  registerTool({
    name: 'get_graph_stats',
    description: 'Graph statistics',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = db.getNodesByWorkspace(input.workspaceId, 'canonical');
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      return {
        nodes: nodes.length,
        edges: edges.length,
        density: nodes.length <= 1 ? 0 : edges.length / (nodes.length * (nodes.length - 1)),
        orphans: nodes.filter((n) => !edges.some((e) => e.from_id === n.id || e.to_id === n.id)).length,
      };
    },
  });

  registerTool({
    name: 'get_architecture',
    description: 'Architecture overview markdown',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const communities = detectCommunities(db.getNodesByWorkspace(input.workspaceId, 'canonical'), db.getEdgesByWorkspace(input.workspaceId));
      return { markdown: generateArchitectureOverview(communities) };
    },
  });

  registerTool({
    name: 'find_hubs',
    description: 'Find high-degree nodes',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      const degree = new Map<string, number>();
      for (const e of edges) {
        degree.set(e.from_id, (degree.get(e.from_id) ?? 0) + 1);
        degree.set(e.to_id, (degree.get(e.to_id) ?? 0) + 1);
      }
      return [...degree.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([nodeId, degree]) => ({ nodeId, degree }));
    },
  });

  registerTool({
    name: 'find_bridges',
    description: 'Find cross-domain edges',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = new Map(db.getNodesByWorkspace(input.workspaceId, 'canonical').map((n) => [n.id, n]));
      return db.getEdgesByWorkspace(input.workspaceId).filter((e) => nodes.get(e.from_id)?.domain !== nodes.get(e.to_id)?.domain);
    },
  });

  registerTool({
    name: 'find_knowledge_gaps',
    description: 'Find nodes with zero outbound edges',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = db.getNodesByWorkspace(input.workspaceId, 'canonical');
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      return nodes.filter((n) => !edges.some((e) => e.from_id === n.id));
    },
  });
}
