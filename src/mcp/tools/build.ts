import { runPipeline } from '../../pipeline/run.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';
import { BuildGraphInput } from '../schemas/index.js';
import { registerTool } from './runtime.js';
import { notifyGraphUpdated } from '../server.js';

function graphCounts(workspaceId: string): { nodeCount: number; edgeCount: number } {
  const db = getDB(resolveDbPath());
  return {
    nodeCount: db.getAllNodesByWorkspace(workspaceId).length,
    edgeCount: db.getEdgesByWorkspace(workspaceId).length,
  };
}

export function registerBuildTools(): void {
  registerTool({
    name: 'build_graph',
    description: 'Run full pipeline build for a workspace',
    inputSchema: BuildGraphInput,
    handler: async (args) => {
      const input = BuildGraphInput.parse(args);
      await runPipeline(input.workspaceId, { incremental: input.incremental });
      getTrustedQueryService(getDB(resolveDbPath())).clearCache(input.workspaceId);
      notifyGraphUpdated();
      const counts = graphCounts(input.workspaceId);
      return QueryResultFactory.create({
        status: 'OK',
        nodes: [],
        edges: [],
        data: counts,
        reasons: [`Build complete: ${counts.nodeCount} nodes, ${counts.edgeCount} edges.`],
        metadata: { tool: { name: 'build_graph', workspace: input.workspaceId } },
      });
    },
  });

  registerTool({
    name: 'update_graph',
    description: 'Run incremental pipeline update',
    inputSchema: BuildGraphInput,
    handler: async (args) => {
      const input = BuildGraphInput.parse(args);
      await runPipeline(input.workspaceId, { incremental: true });
      getTrustedQueryService(getDB(resolveDbPath())).clearCache(input.workspaceId);
      notifyGraphUpdated();
      const counts = graphCounts(input.workspaceId);
      return QueryResultFactory.create({
        status: 'OK',
        nodes: [],
        edges: [],
        data: counts,
        reasons: [`Incremental update complete: ${counts.nodeCount} nodes, ${counts.edgeCount} edges.`],
        metadata: { tool: { name: 'update_graph', workspace: input.workspaceId } },
      });
    },
  });
}
