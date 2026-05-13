import type { QueryResult, ResponseConfidence, DecisionStatus } from '../../core/types.js';

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

export function ensureQueryResult(value: unknown, reasons: string[] = []): QueryResult {
  if (isQueryResult(value)) return value;
  return okResult({ value }, reasons);
}

function isQueryResult(value: unknown): value is QueryResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QueryResult>;
  return (
    typeof candidate.status === 'string'
    && typeof candidate.data === 'object'
    && typeof candidate.reasoning === 'object'
    && typeof candidate.confidence === 'object'
    && typeof candidate.provenance === 'object'
    && Array.isArray(candidate.warnings)
    && Array.isArray(candidate.codes)
  );
}
