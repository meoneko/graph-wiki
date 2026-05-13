import { z } from 'zod';
import { runPipeline } from '../../pipeline/run.js';
import { startWatch } from '../../pipeline/watch.js';
import { getWorkspace, loadConfig, resolveDbPath } from '../../pipeline/config.js';
import { writeGraphArtifacts } from '../../pipeline/artifacts/graphArtifacts.js';
import { verifyGraph } from '../../pipeline/stages/06_verify.js';
import { generateWiki } from '../../pipeline/stages/07_wiki.js';
import { writeReport } from '../../pipeline/stages/08_report.js';
import { getDB } from '../../storage/GraphDB.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { registerTool } from './runtime.js';
import { okResult } from './results.js';

export function registerBuildTools(): void {
  registerTool({
    name: 'list_workspaces',
    description: 'List all configured workspaces',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const { loadConfig } = await import('../../pipeline/config.js');
      const config = await loadConfig();
      return okResult({
        workspaces: config.workspaces.map((w) => ({ id: w.id, name: w.name ?? w.id, projects: w.projects })),
      }, ['loaded workspaces from configuration']);
    },
  });

  registerTool({
    name: 'build_graph',
    description: 'Run full pipeline build for a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      await runPipeline(input.workspaceId, { incremental: false });
      getTrustedQueryService(getDB(resolveDbPath())).clearCache(input.workspaceId);
      return okResult({ ok: true, workspaceId: input.workspaceId }, ['full graph build completed']);
    },
  });

  registerTool({
    name: 'update_graph',
    description: 'Run incremental pipeline update',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      await runPipeline(input.workspaceId, { incremental: true });
      getTrustedQueryService(getDB(resolveDbPath())).clearCache(input.workspaceId);
      return okResult({ ok: true, workspaceId: input.workspaceId }, ['incremental graph update completed']);
    },
  });

  registerTool({
    name: 'run_postprocess',
    description: 'Regenerate graph artifacts, verification report, wiki, and query caches for an existing workspace graph',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const config = await loadConfig();
      const workspace = getWorkspace(config, input.workspaceId);
      const db = getDB(resolveDbPath(config));
      const nodes = db.getAllNodesByWorkspace(workspace.id);
      const edges = db.getEdgesByWorkspace(workspace.id);

      if (nodes.length === 0) {
        throw new Error(`No graph nodes found for workspace ${workspace.id}. Run build_graph first.`);
      }

      const artifacts = await writeGraphArtifacts(db, workspace.id);
      const report = await verifyGraph(nodes, edges, workspace, db, config);
      if (!report.passed) {
        await writeReport(workspace.id, report, config, { nodes, edges });
        throw new Error(`Verification failed for workspace ${workspace.id}: ${report.issues.join(', ')}`);
      }

      await generateWiki(workspace.id, nodes, edges, db, config);
      await writeReport(workspace.id, report, config, { nodes, edges });
      getTrustedQueryService(db).clearCache(workspace.id);

      return okResult({
        ok: true,
        workspaceId: workspace.id,
        nodes: nodes.length,
        edges: edges.length,
        artifactDir: artifacts.artifactDir,
        artifactFiles: artifacts.files,
      }, ['postprocess completed from existing graph data']);
    },
  });

  registerTool({
    name: 'watch_graph',
    description: 'Start graph watch mode',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      await startWatch(input.workspaceId);
      return okResult({ ok: true, mode: 'watching', workspaceId: input.workspaceId }, ['watch mode started']);
    },
  });
}
