import { z } from 'zod';
import { getDiff, parseDiff } from '../../pipeline/gitDiff.js';
import { buildImpactReport } from '../../pipeline/impactReport.js';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';

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
    name: 'blast_radius',
    description: 'Get trust-aware blast radius from node',
    inputSchema: { nodeId: 'string', workspaceId: 'string', mode: 'string?' },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.review.blast_radius' });
      return engine.getBlastRadiusIds(input.nodeId, operation, input.mode as QueryMode);
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
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.review.get_risk_score' });
      return engine.getRiskScore(input.nodeIds, operation, input.mode as QueryMode);
    },
  });
}
