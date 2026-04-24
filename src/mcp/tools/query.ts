import { z } from 'zod';
import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { GraphArtifactLoader } from '../../core/graph/query/GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from '../../core/graph/query/TrustAwareQueryEngine.js';
import { registerTool } from './runtime.js';
import type { QueryMode, QueryResult } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

function wrapQueryResult(data: { nodes: any[], edges: any[] }, status: any = 'OK', explanation = 'Found results'): QueryResult {
  if (data.nodes.length === 0 && data.edges.length === 0) {
    return {
      status: 'INSUFFICIENT_EVIDENCE',
      reasoning: { selected_paths: [], selection_explanation: ['No results found under current trust policy'] },
      data: { nodes: [], edges: [] },
      confidence: { level: 'LOW', reasons: [] },
      provenance: { sources: [] },
      warnings: [], codes: []
    };
  }
  return {
    status,
    reasoning: { selected_paths: [], selection_explanation: [explanation] },
    data,
    confidence: { level: 'MEDIUM', reasons: ['Derived from impact/neighborhood analysis'] },
    provenance: { sources: data.nodes.map(n => n.provenance).filter(Boolean) },
    warnings: [], codes: []
  };
}

export function registerQueryTools(): void {
  registerTool({
    name: 'get_node',
    description: 'Get a node by id with trust-aware visibility',
    inputSchema: { nodeId: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = new TrustAwareQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      const result = await engine.analyzeImpact(input.nodeId, input.mode as QueryMode, 0);
      return wrapQueryResult(result, 'OK', 'Direct node lookup');
    },
  });

  registerTool({
    name: 'get_neighbors',
    description: 'Get trust-aware neighbors of a node',
    inputSchema: { nodeId: 'string', workspaceId: 'string', depth: 'number?', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        depth: z.number().int().positive().optional(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = new TrustAwareQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      const result = await engine.analyzeImpact(input.nodeId, input.mode as QueryMode, input.depth ?? 1);
      return wrapQueryResult(result, 'OK', `Analyzed neighborhood depth ${input.depth ?? 1}`);
    },
  });

  registerTool({
    name: 'get_path',
    description: 'Find reasoning paths between two nodes (auth-first selection)',
    inputSchema: { fromId: 'string', toId: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        fromId: z.string(),
        toId: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = new TrustAwareQueryEngine(input.workspaceId, new GraphArtifactLoader(getDB(resolveDbPath())));
      return engine.findReasoningPaths(input.fromId, input.toId, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_callers',
    description: 'Find trust-aware callers of a symbol',
    inputSchema: { symbol: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        symbol: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const db = getDB(resolveDbPath());
      const loader = new GraphArtifactLoader(db);
      
      const artifacts = await loader.load(input.workspaceId);
      const targetNodes = Object.values(artifacts.index.nodeById).filter(
        n => (n.label === input.symbol || n.symbol === input.symbol)
      );

      const nodes = [];
      const edges = [];
      for (const target of targetNodes) {
        nodes.push(target);
        const incomingEdges = artifacts.index.edgesByTarget[target.id] ?? [];
        for (const edgeId of incomingEdges) {
          const edge = artifacts.index.edgeById[edgeId];
          if (edge) {
            const caller = artifacts.index.nodeById[edge.from_id];
            if (caller && (input.mode === 'exploratory' || edge.confidence_band === 'AUTHORITATIVE' || edge.confidence_band === 'EXTRACTED')) {
              nodes.push(caller);
              edges.push(edge);
            }
          }
        }
      }
      return wrapQueryResult({ nodes, edges }, 'OK', 'Discovered upstream callers via TrustAware policy');
    },
  });
}
