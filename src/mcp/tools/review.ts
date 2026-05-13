import { z } from 'zod';
import { getDiff, parseDiff } from '../../pipeline/gitDiff.js';
import { buildImpactReport, type ImpactReport } from '../../pipeline/impactReport.js';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { ensureQueryResult } from './results.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode, QueryResult } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

function toImpactResult(report: ImpactReport, projectId?: string): QueryResult {
  return {
    ...report,
    data: {
      ...report.data,
      changedNodes: report.changedNodes,
      affectedNodes: report.affectedNodes,
      affectedEntrypoints: report.affectedEntrypoints,
      riskScore: report.riskScore,
      riskRationale: report.riskRationale,
      affectedFlows: report.affectedFlows,
      reviewSuggestions: report.reviewSuggestions,
      ...(projectId !== undefined ? { projectId } : {}),
      stats: {
        nodes: report.affectedNodes.length,
        edges: report.data.edges.length,
        flows: report.affectedFlows.length,
        communities: 0,
        entrypoints: report.affectedEntrypoints.length,
      },
    },
  };
}

export function registerReviewTools(): void {
  registerTool({
    name: 'detect_changes',
    description: 'Analyze a raw git diff and return trust-aware change impact for the VS Code extension',
    inputSchema: {
      type: 'object',
      properties: {
        diff: { type: 'string' },
        workspaceId: { type: 'string' },
        projectId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['diff', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        diff: z.string(),
        workspaceId: z.string(),
        projectId: z.string().optional(),
        mode: QueryModeSchema,
      }).parse(args);
      const parsed = await parseDiff(input.diff);
      const report = await buildImpactReport(parsed, input.workspaceId, input.mode as QueryMode);
      return toImpactResult(report, input.projectId);
    },
  });

  registerTool({
    name: 'review_diff',
    description: 'Review a raw diff text with trust boundary',
    inputSchema: {
      type: 'object',
      properties: {
        diffText: { type: 'string' },
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['diffText', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        diffText: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const diff = await parseDiff(input.diffText);
      return toImpactResult(await buildImpactReport(diff, input.workspaceId, input.mode as QueryMode));
    },
  });

  registerTool({
    name: 'review_pr',
    description: 'Review impact by git range with trust boundary',
    inputSchema: {
      type: 'object',
      properties: {
        base: { type: 'string' },
        head: { type: 'string' },
        workspaceId: { type: 'string' },
        repoPath: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['base', 'head', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        base: z.string(),
        head: z.string(),
        workspaceId: z.string(),
        repoPath: z.string().optional(),
        mode: QueryModeSchema
      }).parse(args);
      const diff = await getDiff(input.repoPath ?? process.cwd(), input.base, input.head);
      return toImpactResult(await buildImpactReport(diff, input.workspaceId, input.mode as QueryMode));
    },
  });

  registerTool({
    name: 'blast_radius',
    description: 'Get trust-aware blast radius (all transitively affected nodes/edges) starting from a single node ID. Use this for open-ended impact analysis. For flow-level impact use get_affected_flows.',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string' },
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['nodeId', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        nodeId: z.string(),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.review.blast_radius' });
      return ensureQueryResult(await engine.getBlastRadiusIds(input.nodeId, operation, input.mode as QueryMode));
    },
  });

  registerTool({
    name: 'get_risk_score',
    description: 'Compute risk score for node set within trust boundary',
    inputSchema: {
      type: 'object',
      properties: {
        nodeIds: { type: 'array', items: { type: 'string' } },
        workspaceId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['nodeIds', 'workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        nodeIds: z.array(z.string()),
        workspaceId: z.string(),
        mode: QueryModeSchema
      }).parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.review.get_risk_score' });
      return ensureQueryResult(await engine.getRiskScore(input.nodeIds, operation, input.mode as QueryMode));
    },
  });
}
