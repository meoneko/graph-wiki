import { z } from 'zod';
import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { registerTool } from './runtime.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerQueryTools(): void {
  registerTool({
    name: 'get_node',
    description: 'Get a node by id with trust-aware visibility',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string' },
        workspaceId: { type: 'string' },
        operation: { type: 'string', enum: ['ask', 'impact', 'lineage', 'wiki', 'governance'] },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['nodeId', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        operation: z.enum(['ask', 'impact', 'lineage', 'wiki', 'governance']).optional(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_node', requested: input.operation, requireExplicit: true });
      return engine.getNode(input.nodeId, operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_neighbors',
    description: 'Get trust-aware neighbors of a node',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string' },
        workspaceId: { type: 'string' },
        depth: { type: 'number' },
        operation: { type: 'string', enum: ['ask', 'impact', 'lineage', 'wiki', 'governance'] },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['nodeId', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        depth: z.number().int().positive().optional(),
        operation: z.enum(['ask', 'impact', 'lineage', 'wiki', 'governance']).optional(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_neighbors', requested: input.operation, requireExplicit: true });
      return engine.analyzeImpact(input.nodeId, operation, input.mode as QueryMode, input.depth ?? 1);
    },
  });

  registerTool({
    name: 'get_path',
    description: 'Find reasoning paths between two nodes (auth-first selection)',
    inputSchema: {
      type: 'object',
      properties: {
        fromId: { type: 'string' },
        toId: { type: 'string' },
        workspaceId: { type: 'string' },
        operation: { type: 'string', enum: ['ask', 'impact', 'lineage', 'wiki', 'governance'] },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['fromId', 'toId', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        fromId: z.string(),
        toId: z.string(),
        workspaceId: z.string(),
        operation: z.enum(['ask', 'impact', 'lineage', 'wiki', 'governance']).optional(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_path', requested: input.operation, requireExplicit: true });
      return engine.findReasoningPaths(input.fromId, input.toId, operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_callers',
    description: 'Find trust-aware callers of a symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        workspaceId: { type: 'string' },
        operation: { type: 'string', enum: ['ask', 'impact', 'lineage', 'wiki', 'governance'] },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['symbol', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        symbol: z.string(),
        workspaceId: z.string(),
        operation: z.enum(['ask', 'impact', 'lineage', 'wiki', 'governance']).optional(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_callers', requested: input.operation, requireExplicit: true });
      return engine.findCallers(input.symbol, operation, input.mode as QueryMode);
    },
  });
}
