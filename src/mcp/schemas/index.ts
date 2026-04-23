import { z } from 'zod';

export const BuildGraphInput = z.object({
  workspaceId: z.string(),
  incremental: z.boolean().optional().default(false),
});
export const BuildGraphOutput = z.object({
  nodeCount: z.number(),
  edgeCount: z.number(),
  duration: z.number(),
});

export const GetNodeInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  mode: z.enum(['authoritative', 'exploratory', 'mixed_safe']).optional().default('authoritative'),
});

export const GetNeighborsInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  depth: z.number().int().min(1).max(5).optional().default(1),
});

export const GetLineageInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  direction: z.enum(['upstream', 'downstream', 'both']).optional().default('both'),
});

export const SearchNodesInput = z.object({
  query: z.string().min(1),
  workspaceId: z.string(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const ReviewDiffInput = z.object({
  diffText: z.string(),
  workspaceId: z.string(),
});

export const ReviewPrInput = z.object({
  base: z.string(),
  head: z.string(),
  workspaceId: z.string(),
  repoPath: z.string().optional(),
});

export const GetBlastRadiusInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
});

export const GetGraphStatsInput = z.object({
  workspaceId: z.string(),
});

export const ImpactReportOutput = z.object({
  changedNodes: z.array(z.object({ id: z.string(), label: z.string(), type: z.string() })),
  affectedNodes: z.array(z.object({ id: z.string(), label: z.string(), type: z.string() })),
  riskScore: z.number().min(0).max(100),
  riskRationale: z.array(z.string()),
  reviewSuggestions: z.array(z.string()),
});
