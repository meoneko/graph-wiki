import type { QueryResult, ResponseConfidence, DecisionStatus } from '../../core/types.js';
import { enforceQueryResultContract, isValidQueryResult } from '../../core/graph/query/QueryResultValidator.js';

export function toolResult(
  status: DecisionStatus,
  data: Record<string, unknown> = {},
  reasons: string[] = [],
  options: {
    confidence?: ResponseConfidence;
    warnings?: string[];
    codes?: string[];
    metadata?: QueryResult['metadata'];
  } = {},
): QueryResult {
  return {
    status,
    data: {
      nodes: [],
      edges: [],
      ...data,
    },
    reasoning: {
      selected_paths: [],
      selection_explanation: reasons,
    },
    confidence: {
      level: options.confidence ?? (status === 'OK' ? 'MEDIUM' : 'LOW'),
      reasons,
    },
    provenance: { sources: [] },
    warnings: options.warnings ?? [],
    codes: options.codes ?? [],
    metadata: options.metadata,
  };
}

export function okResult(data: Record<string, unknown>, reasons: string[] = [], confidence: ResponseConfidence = 'MEDIUM'): QueryResult {
  return toolResult('OK', data, reasons, { confidence });
}

export function insufficientEvidence(data: Record<string, unknown>, reasons: string[] = [], codes: string[] = []): QueryResult {
  return toolResult('INSUFFICIENT_EVIDENCE', data, reasons, { confidence: 'LOW', codes });
}

export function toolError(message: string, codes: string[] = ['MCP_TOOL_ERROR']): QueryResult {
  return toolResult('INSUFFICIENT_EVIDENCE', {}, [message], {
    confidence: 'LOW',
    warnings: [message],
    codes,
  });
}

/**
 * Ensures a value conforms to the QueryResult contract.
 * If the value is already a valid QueryResult, returns it unchanged.
 * Otherwise, wraps it in a proper QueryResult envelope.
 *
 * This is the primary boundary enforcement function for MCP tools.
 * Raw graph data is NEVER returned without status and provenance.
 *
 * @see Requirements 9.1, 9.2, 9.3
 */
export function ensureQueryResult(value: unknown, reasons: string[] = [], context?: { tool?: string }): QueryResult {
  if (isValidQueryResult(value)) return value as QueryResult;
  return enforceQueryResultContract(value, context);
}

/**
 * @deprecated Use isValidQueryResult from QueryResultValidator instead
 */
function isQueryResult(value: unknown): value is QueryResult {
  return isValidQueryResult(value);
}
