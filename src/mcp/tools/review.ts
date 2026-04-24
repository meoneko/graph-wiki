import { z } from 'zod';
import { getDiff, parseDiff } from '../../pipeline/gitDiff.js';
import { buildImpactReport } from '../../pipeline/impactReport.js';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { GraphArtifactLoader } from '../../core/graph/query/GraphArtifactLoader.js';
import { EdgePolicyTable } from '../../core/graph/traversal/EdgePolicyTable.js';
import type { QueryMode } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

export function registerReviewTools(): void {
  registerTool({
    name: 'review_diff',
    description: 'Review a raw diff text with trust boundary',
    inputSchema: { diffText: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        diffText: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const diff = await parseDiff(input.diffText);
      return buildImpactReport(diff, input.workspaceId, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'review_pr',
    description: 'Review impact by git range with trust boundary',
    inputSchema: { base: 'string', head: 'string', workspaceId: 'string', repoPath: 'string?', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        base: z.string(),
        head: z.string(),
        workspaceId: z.string(),
        repoPath: z.string().optional(),
        mode: QueryModeSchema
      }).parse(args);
      const diff = await getDiff(input.repoPath ?? process.cwd(), input.base, input.head);
      return buildImpactReport(diff, input.workspaceId, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_blast_radius',
    description: 'Get trust-aware blast radius from node',
    inputSchema: { nodeId: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const db = getDB(resolveDbPath());
      const loader = new GraphArtifactLoader(db);
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const nodes = artifacts.index.nodeById;
      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));

      const startNode = nodes[input.nodeId];
      if (!startNode || !EdgePolicyTable.isNodeVisible(startNode, mode)) return [];

      const visited = new Set<string>([input.nodeId]);
      const queue = [input.nodeId];
      while (queue.length > 0) {
        const cur = queue.shift()!;
        // Use edges where 'cur' is the source (downstream impact)
        const outgoing = edges.filter(e => e.from_id === cur);
        for (const e of outgoing) {
          const target = nodes[e.to_id];
          if (target && !visited.has(e.to_id) && EdgePolicyTable.isNodeVisible(target, mode)) {
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
    description: 'Compute risk score for node set within trust boundary',
    inputSchema: { nodeIds: 'string[]', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        nodeIds: z.array(z.string()),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const db = getDB(resolveDbPath());
      const loader = new GraphArtifactLoader(db);
      const artifacts = await loader.load(input.workspaceId);
      const mode = input.mode as QueryMode;

      const edges = Object.values(artifacts.index.edgeById).filter(e => EdgePolicyTable.isEdgeTraversable(e, mode));
      const touching = edges.filter((e) => input.nodeIds.includes(e.from_id) || input.nodeIds.includes(e.to_id)).length;
      return { riskScore: Math.min(100, input.nodeIds.length * 7 + touching * 3) };
    },
  });
}
