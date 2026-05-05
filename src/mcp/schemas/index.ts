import { z } from 'zod';
// P0-1 FIX: Use queryResultZodSchema from core — do NOT hand-write a QueryResult shape here.
// All tool outputs are QueryResult; use queryResultZodSchema for output validation.
export { queryResultZodSchema } from '../../core/types.js';

export const QueryModeInput = z.enum(['authoritative', 'exploratory', 'mixed_safe']).optional().default('mixed_safe');
export const OperationInput = z.enum(['ask', 'impact', 'lineage', 'wiki', 'governance']).optional();

export const BuildGraphInput = z.object({
  workspaceId: z.string(),
  incremental: z.boolean().optional().default(false),
});

export const GetNodeInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  operation: OperationInput,
  mode: QueryModeInput,
});

export const GetNeighborsInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  depth: z.number().int().min(1).max(5).optional().default(1),
  operation: OperationInput,
  mode: QueryModeInput,
});

export const GetLineageInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  direction: z.enum(['upstream', 'downstream', 'both']).optional().default('both'),
  operation: OperationInput,
  mode: QueryModeInput,
});

export const GetPathInput = z.object({
  fromId: z.string(),
  toId: z.string(),
  workspaceId: z.string(),
  operation: OperationInput,
  mode: QueryModeInput,
});

export const GetCallersInput = z.object({
  workspaceId: z.string(),
  symbol: z.string().optional(),
  nodeId: z.string().optional(),
  operation: OperationInput,
  mode: QueryModeInput,
});

export const GetCalleesInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const SearchNodesInput = z.object({
  query: z.string().min(1),
  workspaceId: z.string(),
  projectId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  mode: QueryModeInput,
});

export const ReviewDiffInput = z.object({
  diffText: z.string(),
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const ReviewPrInput = z.object({
  base: z.string(),
  head: z.string(),
  workspaceId: z.string(),
  repoPath: z.string().optional(),
  mode: QueryModeInput,
});

export const GetBlastRadiusInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const GetRiskScoreInput = z.object({
  nodeIds: z.array(z.string()),
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const GetGraphStatsInput = z.object({
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const GetWikiPageInput = z.object({
  nodeId: z.string(),
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const GenerateWikiInput = z.object({
  workspaceId: z.string(),
  mode: QueryModeInput,
});

export const RenamePreviewInput = z.object({
  oldSymbol: z.string(),
  newSymbol: z.string(),
  workspaceId: z.string(),
});

export const FindDeadCodeInput = z.object({
  workspaceId: z.string(),
});

// Input schemas for Phase 9.2b tools
export const RunPostProcessInput = z.object({
  workspaceId: z.string(),
  flows: z.boolean().optional().default(true),
  communities: z.boolean().optional().default(true),
  fts: z.boolean().optional().default(true),
});

export const ListFlowsInput = z.object({
  workspaceId: z.string(),
  projectId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const GetFlowInput = z.object({
  workspaceId: z.string(),
  flowId: z.number().int(),
});

export const ListCommunitiesInput = z.object({
  workspaceId: z.string(),
  projectId: z.string().optional(),
});

export const GetAffectedFlowsInput = z.object({
  workspaceId: z.string(),
  projectId: z.string().optional(),
  changedFiles: z.array(z.string()).optional(),
  nodeIds: z.array(z.string()).optional(),
});

export const GetCommunityInput = z.object({
  workspaceId: z.string(),
  communityId: z.number().int(),
});

export const GetMinimalContextInput = z.object({
  workspaceId: z.string(),
  projectId: z.string().optional(),
  taskType: z.enum(['review', 'debug', 'refactor', 'onboarding', 'impact', 'explain', 'general']).optional(),
  changedFiles: z.array(z.string()).optional(),
  focus: z.object({
    symbols: z.array(z.string()).optional(),
    nodeIds: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional(),
  }).optional(),
});
