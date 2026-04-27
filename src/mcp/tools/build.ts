import { z } from 'zod';
import { runPipeline } from '../../pipeline/run.js';
import { startWatch } from '../../pipeline/watch.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { registerTool } from './runtime.js';

export function registerBuildTools(): void {
  registerTool({
    name: 'build_graph',
    description: 'Run full pipeline build for a workspace',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      await runPipeline(input.workspaceId, { incremental: false });
      getTrustedQueryService(getDB(resolveDbPath())).clearCache(input.workspaceId);
      return { ok: true };
    },
  });

  registerTool({
    name: 'update_graph',
    description: 'Run incremental pipeline update',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      await runPipeline(input.workspaceId, { incremental: true });
      getTrustedQueryService(getDB(resolveDbPath())).clearCache(input.workspaceId);
      return { ok: true };
    },
  });

  registerTool({
    name: 'watch_graph',
    description: 'Start graph watch mode',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      await startWatch(input.workspaceId);
      return { ok: true, mode: 'watching' };
    },
  });
}
