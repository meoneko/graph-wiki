import { z } from 'zod';
import { getDiff, parseDiff } from '../../pipeline/gitDiff.js';
import { buildImpactReport } from '../../pipeline/impactReport.js';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';

export function registerReviewTools(): void {
  registerTool({
    name: 'review_diff',
    description: 'Review a raw diff text',
    inputSchema: { diffText: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ diffText: z.string(), workspaceId: z.string() }).parse(args);
      const diff = await parseDiff(input.diffText);
      return buildImpactReport(diff, input.workspaceId);
    },
  });

  registerTool({
    name: 'review_pr',
    description: 'Review impact by git range',
    inputSchema: { base: 'string', head: 'string', workspaceId: 'string', repoPath: 'string?' },
    handler: async (args) => {
      const input = z.object({ base: z.string(), head: z.string(), workspaceId: z.string(), repoPath: z.string().optional() }).parse(args);
      const diff = await getDiff(input.repoPath ?? process.cwd(), input.base, input.head);
      return buildImpactReport(diff, input.workspaceId);
    },
  });

  registerTool({
    name: 'get_blast_radius',
    description: 'Get blast radius from node',
    inputSchema: { nodeId: 'string', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ nodeId: z.string(), workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      const visited = new Set<string>([input.nodeId]);
      const queue = [input.nodeId];
      while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const e of edges.filter((edge) => edge.from_id === cur)) {
          if (!visited.has(e.to_id)) {
            visited.add(e.to_id);
            queue.push(e.to_id);
          }
        }
      }
      return [...visited];
    },
  });

  registerTool({
    name: 'get_risk_score',
    description: 'Compute risk score for node set',
    inputSchema: { nodeIds: 'string[]', workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ nodeIds: z.array(z.string()), workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      const touching = edges.filter((e) => input.nodeIds.includes(e.from_id) || input.nodeIds.includes(e.to_id)).length;
      return { riskScore: Math.min(100, input.nodeIds.length * 7 + touching * 3) };
    },
  });
}
