import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { ensureQueryResult, toolError } from './results.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { ArchitectureReviewEngine } from '../../core/graph/analysis/architecture/ArchitectureReviewEngine.js';
import type { QueryMode } from '../../core/types.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('authoritative');

export function registerArchitectureTools(): void {
  registerTool({
    name: 'architecture_review',
    description: 'Run full architecture review analyzing module boundaries, dependency cycles, layer violations, dead code, and flow complexity',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID to analyze' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
        config: {
          type: 'object',
          properties: {
            highCoupling: { type: 'number' },
            lowCohesion: { type: 'number' },
            highComplexity: { type: 'number' },
            includeExploratory: { type: 'boolean' },
          },
        },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        mode: QueryModeSchema,
        config: z.object({
          highCoupling: z.number().optional(),
          lowCohesion: z.number().optional(),
          highComplexity: z.number().optional(),
          includeExploratory: z.boolean().optional(),
        }).optional(),
      }).parse(args);

      try {
        const service = getTrustedQueryService(getDB(resolveDbPath()));
        const engine = new ArchitectureReviewEngine(service, {
          thresholds: input.config,
          includeExploratory: input.config?.includeExploratory,
        });
        return ensureQueryResult(await engine.review(input.workspaceId, input.mode as QueryMode));
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return toolError('Workspace not found', ['WORKSPACE_NOT_FOUND']);
        }
        throw error;
      }
    },
  });

  registerTool({
    name: 'get_architecture_findings',
    description: 'Get architecture findings with optional severity filter',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
        severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        severity: z.enum(['critical', 'warning', 'info']).optional(),
        mode: QueryModeSchema,
      }).parse(args);

      try {
        const service = getTrustedQueryService(getDB(resolveDbPath()));
        const engine = new ArchitectureReviewEngine(service);
        return ensureQueryResult(await engine.getFindings(input.workspaceId, input.mode as QueryMode, input.severity));
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return toolError('Workspace not found', ['WORKSPACE_NOT_FOUND']);
        }
        throw error;
      }
    },
  });
}
