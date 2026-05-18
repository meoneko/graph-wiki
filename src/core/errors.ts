/**
 * Error Taxonomy for the Trusted Code Intelligence Platform.
 *
 * Defines stable machine-readable codes for:
 * - DecisionStatus: Query/reasoning outcome statuses (7 codes)
 * - RuntimeCode: Query-time and validation warning/error codes (12 codes)
 * - PipelineError: Pipeline-stage failure codes (15 codes)
 *
 * @see Requirements 18.1, 18.2, 18.3
 */

// ─── Decision Status ─────────────────────────────────────────────────────────
// Enumerated status indicating whether the system can conclude.

export const DecisionStatus = {
  OK: 'OK',
  AMBIGUOUS: 'AMBIGUOUS',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  EXPLORATORY_ONLY: 'EXPLORATORY_ONLY',
  PARTIAL: 'PARTIAL',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  UNSUPPORTED_QUERY: 'UNSUPPORTED_QUERY',
} as const;

export type DecisionStatus = (typeof DecisionStatus)[keyof typeof DecisionStatus];

// ─── Runtime Codes ───────────────────────────────────────────────────────────
// Error and warning codes emitted during query-time and validation operations.

export const RuntimeCode = {
  EXPLORATORY_USED: 'EXPLORATORY_USED',
  TRAVERSAL_FORBIDDEN: 'TRAVERSAL_FORBIDDEN',
  AUTHORITY_CHAIN_BROKEN: 'AUTHORITY_CHAIN_BROKEN',
  INVALID_GRAPH_STATE: 'INVALID_GRAPH_STATE',
  INVALID_EDGE_TYPE: 'INVALID_EDGE_TYPE',
  CANONICAL_PROVENANCE_MISSING: 'CANONICAL_PROVENANCE_MISSING',
  GRAPH_QUERY_TIMEOUT: 'GRAPH_QUERY_TIMEOUT',
  GRAPH_RESULT_TRUNCATED: 'GRAPH_RESULT_TRUNCATED',
  FLOW_TYPE_INFERRED: 'FLOW_TYPE_INFERRED',
  OPERATION_UNMAPPED: 'OPERATION_UNMAPPED',
  GRAPH_QUERY_POLICY_BLOCKED: 'GRAPH_QUERY_POLICY_BLOCKED',
  GRAPH_QUERY_INSUFFICIENT_CONTEXT: 'GRAPH_QUERY_INSUFFICIENT_CONTEXT',
} as const;

export type RuntimeCode = (typeof RuntimeCode)[keyof typeof RuntimeCode];

// ─── Pipeline Errors ─────────────────────────────────────────────────────────
// Error codes for pipeline-stage failures.

export const PipelineError = {
  WORKSPACE_CONFIG_INVALID: 'WORKSPACE_CONFIG_INVALID',
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  NORMALIZATION_FAILED: 'NORMALIZATION_FAILED',
  AUTHORITY_POLICY_CONFLICT: 'AUTHORITY_POLICY_CONFLICT',
  PROVENANCE_MISSING: 'PROVENANCE_MISSING',
  CANONICAL_PROMOTION_DENIED: 'CANONICAL_PROMOTION_DENIED',
  GRAPH_BUILD_FAILED: 'GRAPH_BUILD_FAILED',
  WORKSPACE_BOUNDARY_VIOLATION: 'WORKSPACE_BOUNDARY_VIOLATION',
  ASK_UNSUPPORTED_QUERY: 'ASK_UNSUPPORTED_QUERY',
  ASK_AMBIGUOUS_INTENT: 'ASK_AMBIGUOUS_INTENT',
  AGENT_CONTEXT_INSUFFICIENT: 'AGENT_CONTEXT_INSUFFICIENT',
  WIKI_SOURCE_POLICY_VIOLATION: 'WIKI_SOURCE_POLICY_VIOLATION',
  DRIFT_BASELINE_MISSING: 'DRIFT_BASELINE_MISSING',
  VERIFY_FAILED: 'VERIFY_FAILED',
} as const;

export type PipelineError = (typeof PipelineError)[keyof typeof PipelineError];
