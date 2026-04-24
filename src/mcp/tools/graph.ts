import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { detectCommunities, generateArchitectureOverview } from '../../core/graph/analysis/community.js';
import { registerTool } from './runtime.js';
import { GraphArtifactLoader } from '../../core/graph/query/GraphArtifactLoader.js';
import { EdgePolicyTable } from '../../core/graph/traversal/EdgePolicyTable.js';
import type { QueryMode } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerGraphTools(): void {
  registerTool({
    name: 'get_graph_stats',
    description: 'Graph statistics filtered by trust mode',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const loader = new GraphArtifactLoader(getDB(resolveDbPath()));
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = Object.values(artifacts.index.nodeById).filter(n => EdgePolicyTable.isNodeVisible(n, mode));
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

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
    description: 'Architecture overview markdown with trust filtering',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const loader = new GraphArtifactLoader(getDB(resolveDbPath()));
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = Object.values(artifacts.index.nodeById).filter(n => EdgePolicyTable.isNodeVisible(n, mode));
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

      const communities = detectCommunities(nodes, edges);
      return { markdown: generateArchitectureOverview(communities) };
    },
  });

  registerTool({
    name: 'find_hubs',
    description: 'Find high-degree nodes within trust boundary',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const loader = new GraphArtifactLoader(getDB(resolveDbPath()));
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = Object.values(artifacts.index.nodeById).filter(n => EdgePolicyTable.isNodeVisible(n, mode));
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

      const degree = new Map<string, number>();
      for (const e of edges) {
        degree.set(e.from_id, (degree.get(e.from_id) ?? 0) + 1);
        degree.set(e.to_id, (degree.get(e.to_id) ?? 0) + 1);
      }
      return [...degree.entries()]
        .filter(([id]) => artifacts.index.nodeById[id] && EdgePolicyTable.isNodeVisible(artifacts.index.nodeById[id]!, mode))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([nodeId, degree]) => ({ nodeId, degree, label: artifacts.index.nodeById[nodeId]?.label }));
    },
  });

  registerTool({
    name: 'find_bridges',
    description: 'Find cross-domain edges within trust boundary',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const loader = new GraphArtifactLoader(getDB(resolveDbPath()));
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = artifacts.index.nodeById;
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

      return edges.filter((e) => {
        const from = nodes[e.from_id];
        const to = nodes[e.to_id];
        return from && to && from.domain !== to.domain && EdgePolicyTable.isNodeVisible(from, mode) && EdgePolicyTable.isNodeVisible(to, mode);
      });
    },
  });

  registerTool({
    name: 'find_knowledge_gaps',
    description: 'Find nodes with zero outbound edges within trust boundary',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const loader = new GraphArtifactLoader(getDB(resolveDbPath()));
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = Object.values(artifacts.index.nodeById).filter(n => EdgePolicyTable.isNodeVisible(n, mode));
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

      return nodes.filter((n) => !edges.some((e) => e.from_id === n.id));
    },
  });
}
