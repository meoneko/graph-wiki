import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { registerTool } from './runtime.js';
import type { GraphEdge, GraphNode, QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import {
  GetCalleesInput,
  GetCallersInput,
  GetNeighborsInput,
  GetNodeInput,
  GetPathInput,
} from '../schemas/index.js';
import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';

const CALL_EDGE_TYPES = new Set([
  'calls',
  'invokes',
  'dispatches_to',
]);

function isCallEdge(edge: GraphEdge): boolean {
  return CALL_EDGE_TYPES.has(edge.type);
}

export function registerQueryTools(): void {
  registerTool({
    name: 'get_node',
    description: 'Get a node by id with trust-aware visibility',
    inputSchema: GetNodeInput,
    handler: async (args) => {
      const input = GetNodeInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_node', requested: input.operation, requireExplicit: true });
      return engine.getNode(input.nodeId, operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_neighbors',
    description: 'Get trust-aware neighbors of a node',
    inputSchema: GetNeighborsInput,
    handler: async (args) => {
      const input = GetNeighborsInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_neighbors', requested: input.operation, requireExplicit: true });
      return engine.analyzeImpact(input.nodeId, operation, input.mode as QueryMode, input.depth);
    },
  });

  registerTool({
    name: 'get_path',
    description: 'Find reasoning paths between two nodes (auth-first selection)',
    inputSchema: GetPathInput,
    handler: async (args) => {
      const input = GetPathInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_path', requested: input.operation, requireExplicit: true });
      return engine.findReasoningPaths(input.fromId, input.toId, operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_callers',
    description: 'Find trust-aware callers of a symbol',
    inputSchema: GetCallersInput,
    handler: async (args) => {
      const input = GetCallersInput.parse(args);
      if (!input.symbol && !input.nodeId) {
        return QueryResultFactory.create({
          status: 'POLICY_VIOLATION',
          nodes: [], edges: [],
          reasons: ['CALLER_TARGET_REQUIRED'],
          codes: ['CALLER_TARGET_REQUIRED'],
          metadata: { tool: { name: 'get_callers', workspace: input.workspaceId } },
        });
      }
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.query.get_callers', requested: input.operation });
      return engine.findCallers(input.symbol, operation, input.mode as QueryMode, input.nodeId);
    },
  });

  registerTool({
    name: 'get_callees',
    description: 'List functions/nodes called by a given node using call-semantic edges',
    inputSchema: GetCalleesInput,
    handler: async (args) => {
      const input = GetCalleesInput.parse(args);
      const store = getDB(resolveDbPath());
      const from = store.getNode(input.nodeId);
      if (!from || from.workspace !== input.workspaceId) {
        return QueryResultFactory.create({
          status: 'INSUFFICIENT_EVIDENCE',
          nodes: [],
          edges: [],
          reasons: [`Node ${input.nodeId} not found in workspace ${input.workspaceId}.`],
          codes: ['NODE_NOT_FOUND'],
          metadata: { tool: { name: 'get_callees', workspace: input.workspaceId } },
        });
      }

      const edges = store.getEdgesFrom(input.nodeId).filter((edge) => edge.workspace === input.workspaceId && isCallEdge(edge));
      const nodes = edges
        .map((edge) => store.getNode(edge.to_id))
        .filter((node): node is GraphNode => node !== undefined && node.workspace === input.workspaceId);

      return QueryResultFactory.create({
        status: 'OK',
        nodes,
        edges,
        reasons: [`${nodes.length} callees returned for ${from.label}.`],
        data: { callees: nodes.map((node) => ({ id: node.id, label: node.label, symbol: node.symbol, type: node.type })) },
        metadata: { tool: { name: 'get_callees', workspace: input.workspaceId } },
      });
    },
  });
}
