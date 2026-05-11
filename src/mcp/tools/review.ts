import { getDiff, parseDiff } from '../../pipeline/gitDiff.js';
import { buildImpactReport } from '../../pipeline/impactReport.js';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import {
  GetBlastRadiusInput,
  GetRiskScoreInput,
  ReviewDiffInput,
  ReviewPrInput,
} from '../schemas/index.js';

export function registerReviewTools(): void {
  registerTool({
    name: 'review_diff',
    description: 'Review a raw diff text with trust boundary',
    inputSchema: ReviewDiffInput,
    handler: async (args) => {
      const input = ReviewDiffInput.parse(args);
      const diff = await parseDiff(input.diffText);
      return buildImpactReport(diff, input.workspaceId, input.mode as QueryMode, 'review');
    },
  });

  registerTool({
    name: 'detect_changes',
    description: 'Risk-scored change analysis for a raw diff with affected nodes',
    inputSchema: ReviewDiffInput,
    handler: async (args) => {
      const input = ReviewDiffInput.parse(args);
      const diff = await parseDiff(input.diffText);
      return buildImpactReport(diff, input.workspaceId, input.mode as QueryMode, 'impact');
    },
  });

  registerTool({
    name: 'review_pr',
    description: 'Review impact by git range with trust boundary',
    inputSchema: ReviewPrInput,
    handler: async (args) => {
      const input = ReviewPrInput.parse(args);
      const diff = await getDiff(input.repoPath ?? process.cwd(), input.base, input.head);
      return buildImpactReport(diff, input.workspaceId, input.mode as QueryMode, 'review');
    },
  });

  registerTool({
    name: 'blast_radius',
    description: 'Get trust-aware blast radius from node',
    inputSchema: GetBlastRadiusInput,
    handler: async (args) => {
      const input = GetBlastRadiusInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.review.blast_radius' });
      return engine.getBlastRadiusIds(input.nodeId, operation, input.mode as QueryMode);
    },
  });

  registerTool({
    name: 'get_risk_score',
    description: 'Compute risk score for node set within trust boundary',
    inputSchema: GetRiskScoreInput,
    handler: async (args) => {
      const input = GetRiskScoreInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.review.get_risk_score' });
      return engine.getRiskScore(input.nodeIds, operation, input.mode as QueryMode);
    },
  });
}
