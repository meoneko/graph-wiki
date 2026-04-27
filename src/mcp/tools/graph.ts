import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { detectCommunities, generateArchitectureOverview } from '../../core/graph/analysis/community.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerGraphTools(): void {
  registerTool({
    name: 'graph_stats',
    description: 'Graph statistics filtered by trust mode',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.graph_stats' });
      return engine.getGraphStats(operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'architecture_overview',
    description: 'Architecture overview markdown with trust filtering',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const service = getTrustedQueryService(getDB(resolveDbPath()));
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.architecture_overview' });
      const result = await service.engine(input.workspaceId).getGraphStats(operation, input.mode as QueryMode);
      if (result.status === 'POLICY_VIOLATION') {
        return result;
      }
      const graph = await service.engine(input.workspaceId).getVisibleGraph(operation, input.mode as QueryMode);
      const communities = detectCommunities(graph.nodes, graph.edges);
      return QueryResultFactory.withMetadata(result, { markdown: generateArchitectureOverview(communities) });
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
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.find_hubs' });
      return engine.findHubs(operation, input.mode as QueryMode, 20);
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
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.find_bridges' });
      return engine.findBridges(operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'find_gaps',
    description: 'Find nodes with zero outbound edges within trust boundary',
    inputSchema: { workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.find_gaps' });
      return engine.findKnowledgeGaps(operation, input.mode as QueryMode);
    },
  });
}
