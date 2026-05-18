/**
 * QueryResultValidator — Enforces the QueryResult contract at external-facing boundaries.
 *
 * Every external-facing reasoning operation (MCP tools, CLI commands, wiki generation inputs)
 * MUST return a valid QueryResult. This validator ensures:
 * - status is a valid DecisionStatus
 * - reasoning includes selected_paths, rejected_paths, and selection_explanation
 * - data includes nodes and edges arrays
 * - confidence includes level and reasons
 * - provenance includes sources array
 * - warnings and codes are string arrays
 * - AMBIGUOUS status includes union of selected path nodes/edges in flattened data
 *
 * @see Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { QueryResult, GraphNode, GraphEdge } from '../../types.js';
import { DecisionStatus } from '../../errors.js';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationOutcome {
  valid: boolean;
  issues: ValidationIssue[];
}

const VALID_STATUSES: Set<string> = new Set([
  DecisionStatus.OK,
  DecisionStatus.AMBIGUOUS,
  DecisionStatus.INSUFFICIENT_EVIDENCE,
  DecisionStatus.EXPLORATORY_ONLY,
  DecisionStatus.PARTIAL,
  DecisionStatus.POLICY_VIOLATION,
  DecisionStatus.UNSUPPORTED_QUERY,
]);

const VALID_CONFIDENCE_LEVELS: Set<string> = new Set(['HIGH', 'MEDIUM', 'LOW']);

/**
 * Validates that a value conforms to the full QueryResult contract.
 * Returns a ValidationOutcome with issues if the contract is violated.
 */
export function validateQueryResult(value: unknown): ValidationOutcome {
  const issues: ValidationIssue[] = [];

  if (!value || typeof value !== 'object') {
    issues.push({ field: 'root', message: 'QueryResult must be a non-null object', severity: 'error' });
    return { valid: false, issues };
  }

  const candidate = value as Record<string, unknown>;

  // status
  if (!('status' in candidate) || typeof candidate.status !== 'string') {
    issues.push({ field: 'status', message: 'status must be a string', severity: 'error' });
  } else if (!VALID_STATUSES.has(candidate.status)) {
    issues.push({ field: 'status', message: `status "${candidate.status}" is not a valid DecisionStatus`, severity: 'error' });
  }

  // reasoning
  if (!('reasoning' in candidate) || typeof candidate.reasoning !== 'object' || candidate.reasoning === null) {
    issues.push({ field: 'reasoning', message: 'reasoning must be a non-null object', severity: 'error' });
  } else {
    const reasoning = candidate.reasoning as Record<string, unknown>;
    if (!Array.isArray(reasoning.selected_paths)) {
      issues.push({ field: 'reasoning.selected_paths', message: 'selected_paths must be an array', severity: 'error' });
    }
    if (!('selection_explanation' in reasoning) || !Array.isArray(reasoning.selection_explanation)) {
      issues.push({ field: 'reasoning.selection_explanation', message: 'selection_explanation must be an array', severity: 'error' });
    }
    // rejected_paths is optional but should be an array if present
    if ('rejected_paths' in reasoning && reasoning.rejected_paths !== undefined && !Array.isArray(reasoning.rejected_paths)) {
      issues.push({ field: 'reasoning.rejected_paths', message: 'rejected_paths must be an array when present', severity: 'warning' });
    }
  }

  // data
  if (!('data' in candidate) || typeof candidate.data !== 'object' || candidate.data === null) {
    issues.push({ field: 'data', message: 'data must be a non-null object', severity: 'error' });
  } else {
    const data = candidate.data as Record<string, unknown>;
    if (!Array.isArray(data.nodes)) {
      issues.push({ field: 'data.nodes', message: 'data.nodes must be an array', severity: 'error' });
    }
    if (!Array.isArray(data.edges)) {
      issues.push({ field: 'data.edges', message: 'data.edges must be an array', severity: 'error' });
    }
  }

  // confidence
  if (!('confidence' in candidate) || typeof candidate.confidence !== 'object' || candidate.confidence === null) {
    issues.push({ field: 'confidence', message: 'confidence must be a non-null object', severity: 'error' });
  } else {
    const confidence = candidate.confidence as Record<string, unknown>;
    if (typeof confidence.level !== 'string' || !VALID_CONFIDENCE_LEVELS.has(confidence.level)) {
      issues.push({ field: 'confidence.level', message: 'confidence.level must be HIGH, MEDIUM, or LOW', severity: 'error' });
    }
    if (!Array.isArray(confidence.reasons)) {
      issues.push({ field: 'confidence.reasons', message: 'confidence.reasons must be an array', severity: 'error' });
    }
  }

  // provenance
  if (!('provenance' in candidate) || typeof candidate.provenance !== 'object' || candidate.provenance === null) {
    issues.push({ field: 'provenance', message: 'provenance must be a non-null object', severity: 'error' });
  } else {
    const provenance = candidate.provenance as Record<string, unknown>;
    if (!Array.isArray(provenance.sources)) {
      issues.push({ field: 'provenance.sources', message: 'provenance.sources must be an array', severity: 'error' });
    }
  }

  // warnings
  if (!Array.isArray(candidate.warnings)) {
    issues.push({ field: 'warnings', message: 'warnings must be an array', severity: 'error' });
  }

  // codes
  if (!Array.isArray(candidate.codes)) {
    issues.push({ field: 'codes', message: 'codes must be an array', severity: 'error' });
  }

  // AMBIGUOUS status contract: must include union of selected path nodes/edges in flattened data
  if (candidate.status === DecisionStatus.AMBIGUOUS) {
    const reasoning = candidate.reasoning as Record<string, unknown> | undefined;
    const data = candidate.data as Record<string, unknown> | undefined;
    if (reasoning && data && Array.isArray(reasoning.selected_paths) && Array.isArray(data.nodes)) {
      const selectedPaths = reasoning.selected_paths as Array<{ nodes?: GraphNode[]; edges?: GraphEdge[] }>;
      if (selectedPaths.length > 1) {
        // Verify that data contains the union of all selected path nodes
        const dataNodeIds = new Set((data.nodes as GraphNode[]).map((n) => n.id));
        const pathNodeIds = new Set<string>();
        for (const path of selectedPaths) {
          if (path.nodes) {
            for (const node of path.nodes) {
              pathNodeIds.add(node.id);
            }
          }
        }
        for (const id of pathNodeIds) {
          if (!dataNodeIds.has(id)) {
            issues.push({
              field: 'data.nodes',
              message: `AMBIGUOUS status requires union of selected path nodes in data; missing node ${id}`,
              severity: 'warning',
            });
            break;
          }
        }
      }
    }
  }

  return { valid: issues.filter((i) => i.severity === 'error').length === 0, issues };
}

/**
 * Type guard that checks if a value is a valid QueryResult.
 * Use this for runtime checks at external boundaries.
 */
export function isValidQueryResult(value: unknown): value is QueryResult {
  return validateQueryResult(value).valid;
}

/**
 * Enforces the QueryResult contract at an external boundary.
 * If the value is already a valid QueryResult, returns it unchanged.
 * If not, wraps it in a proper QueryResult envelope.
 *
 * This is the primary enforcement function for external-facing surfaces.
 * It ensures raw graph data is NEVER returned without status and provenance.
 *
 * @param value - The value to enforce the contract on
 * @param context - Optional context for error reporting (tool name, operation, etc.)
 * @returns A valid QueryResult
 */
export function enforceQueryResultContract(value: unknown, context?: { tool?: string; operation?: string }): QueryResult {
  if (isValidQueryResult(value)) {
    return value as QueryResult;
  }

  // If the value has partial QueryResult shape, try to fill in missing fields
  if (value && typeof value === 'object') {
    const partial = value as Partial<QueryResult> & Record<string, unknown>;
    return {
      status: (typeof partial.status === 'string' && VALID_STATUSES.has(partial.status))
        ? partial.status as QueryResult['status']
        : 'OK',
      reasoning: {
        selected_paths: partial.reasoning?.selected_paths ?? [],
        rejected_paths: partial.reasoning?.rejected_paths,
        selection_explanation: partial.reasoning?.selection_explanation ?? [
          context?.tool ? `Result from ${context.tool}` : 'Result wrapped by contract enforcement',
        ],
      },
      data: {
        nodes: Array.isArray(partial.data?.nodes) ? partial.data.nodes : [],
        edges: Array.isArray(partial.data?.edges) ? partial.data.edges : [],
        ...(partial.data && typeof partial.data === 'object'
          ? Object.fromEntries(
              Object.entries(partial.data).filter(([k]) => k !== 'nodes' && k !== 'edges'),
            )
          : {}),
      },
      confidence: {
        level: partial.confidence?.level ?? 'MEDIUM',
        reasons: partial.confidence?.reasons ?? [],
      },
      provenance: {
        sources: partial.provenance?.sources ?? [],
      },
      warnings: Array.isArray(partial.warnings) ? partial.warnings : [],
      codes: Array.isArray(partial.codes) ? partial.codes : [],
      metadata: partial.metadata,
    };
  }

  // Completely non-conforming value: wrap in a minimal QueryResult
  return {
    status: 'OK',
    reasoning: {
      selected_paths: [],
      selection_explanation: [
        context?.tool ? `Raw result from ${context.tool} wrapped by contract enforcement` : 'Raw result wrapped by contract enforcement',
      ],
    },
    data: {
      nodes: [],
      edges: [],
      value,
    },
    confidence: {
      level: 'LOW',
      reasons: ['Result did not conform to QueryResult contract; wrapped automatically'],
    },
    provenance: {
      sources: [],
    },
    warnings: ['QUERY_RESULT_CONTRACT_ENFORCED'],
    codes: ['QUERY_RESULT_CONTRACT_ENFORCED'],
    metadata: context ? { tool: { name: context.tool ?? 'unknown' } } : undefined,
  };
}
