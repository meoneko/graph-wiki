import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { detectCommunities, generateArchitectureOverview } from '../../core/graph/analysis/community.js';
import { registerTool } from './runtime.js';
import { okResult, insufficientEvidence } from './results.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';
import type { GraphNode } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

function filterProject(nodes: GraphNode[], projectId?: string): GraphNode[] {
  return projectId ? nodes.filter((node) => node.project === projectId) : nodes;
}

function encodeCommunityId(projectId: string | undefined, communityId: string): string {
  return projectId ? `project:${encodeURIComponent(projectId)}:${communityId}` : communityId;
}

function decodeCommunityId(id: string): { projectId?: string; communityId: string } {
  const match = /^project:([^:]+):(.+)$/.exec(id);
  if (!match) return { communityId: id };
  return { projectId: decodeURIComponent(match[1] ?? ''), communityId: match[2] ?? id };
}

export function registerGraphTools(): void {
  registerTool({
    name: 'graph_stats',
    description: 'Graph statistics filtered by trust mode',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
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
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
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
    name: 'list_communities',
    description: 'List graph communities for the VS Code tree view',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        projectId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        mode: QueryModeSchema,
      }).parse(args);
      const service = getTrustedQueryService(getDB(resolveDbPath()));
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.list_communities' });
      const graph = await service.engine(input.workspaceId).getVisibleGraph(operation, input.mode as QueryMode);
      const visibleNodes = filterProject(graph.nodes, input.projectId);
      const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
      const visibleEdges = graph.edges.filter((edge) => visibleNodeIds.has(edge.from_id) && visibleNodeIds.has(edge.to_id));
      const communities = detectCommunities(visibleNodes, visibleEdges).map((community) => ({
        id: encodeCommunityId(input.projectId, community.id),
        name: community.label,
        size: community.nodeIds.length,
        cohesion: community.cohesion,
        couplingWarnings: community.couplingWarnings,
      }));
      return okResult({ communities }, ['communities grouped from visible graph']);
    },
  });

  registerTool({
    name: 'get_community',
    description: 'Get nodes in a graph community for the VS Code tree view',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        communityId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId', 'communityId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        communityId: z.string(),
        mode: QueryModeSchema,
      }).parse(args);
      const service = getTrustedQueryService(getDB(resolveDbPath()));
      const operation = OperationResolver.resolve({ caller: 'mcp.graph.get_community' });
      const graph = await service.engine(input.workspaceId).getVisibleGraph(operation, input.mode as QueryMode);
      const decoded = decodeCommunityId(input.communityId);
      const visibleNodes = filterProject(graph.nodes, decoded.projectId);
      const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
      const visibleEdges = graph.edges.filter((edge) => visibleNodeIds.has(edge.from_id) && visibleNodeIds.has(edge.to_id));
      const community = detectCommunities(visibleNodes, visibleEdges).find((entry) => entry.id === decoded.communityId);
      const nodeIds = new Set(community?.nodeIds ?? []);
      const nodes = visibleNodes
        .filter((node) => nodeIds.has(node.id))
        .map((node) => ({
          id: node.id,
          label: node.label,
          type: node.type,
          project: node.project,
          source_file: node.source_file,
        }));
      return community
        ? okResult({ nodes }, ['community nodes selected from visible graph'])
        : insufficientEvidence({ nodes: [] }, ['community not found'], ['COMMUNITY_NOT_FOUND']);
    },
  });

  registerTool({
    name: 'find_hubs',
    description: 'Find high-degree nodes within trust boundary',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
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
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
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
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
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
