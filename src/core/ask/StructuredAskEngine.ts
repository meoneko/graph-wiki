/**
 * StructuredAskEngine — Processes structured queries against the knowledge graph
 * with trust-aware responses.
 *
 * Routes all queries through OperationResolver → TrustAwareQueryEngine.
 * Returns INSUFFICIENT_EVIDENCE when no canonical/derived path answers the query.
 * Returns EXPLORATORY_ONLY when only exploratory evidence exists.
 * Includes selected reasoning paths, rejected paths, and selection explanation in every response.
 *
 * @see Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import type { OperationType, QueryMode, QueryResult } from '../types.js';
import { DecisionStatus } from '../errors.js';
import { OperationResolver } from '../graph/query/OperationResolver.js';
import { TrustAwareQueryEngine } from '../graph/query/TrustAwareQueryEngine.js';
import { QueryResultFactory } from '../graph/query/QueryResultFactory.js';

// ─── StructuredQueryType ─────────────────────────────────────────────────────
// 7 user-facing query forms that map to coarser OperationTypes.

export const StructuredQueryType = {
  WHAT_IS_SYMBOL: 'what-is-symbol',
  WHAT_DEPENDS_ON: 'what-depends-on',
  WHAT_ROUTE_CALLS: 'what-route-calls',
  LINEAGE: 'lineage',
  IMPACT: 'impact',
  WHY_CANONICAL: 'why-canonical',
  WHY_INSUFFICIENT_CONTEXT: 'why-insufficient-context',
} as const;

export type StructuredQueryType = (typeof StructuredQueryType)[keyof typeof StructuredQueryType];

// ─── Query type → OperationType mapping ──────────────────────────────────────

const QUERY_TYPE_TO_OPERATION: Record<StructuredQueryType, OperationType> = {
  'what-is-symbol': 'ask',
  'what-depends-on': 'impact',
  'what-route-calls': 'lineage',
  'lineage': 'lineage',
  'impact': 'impact',
  'why-canonical': 'governance',
  'why-insufficient-context': 'governance',
};

// ─── StructuredQuery interface ───────────────────────────────────────────────

export interface StructuredQuery {
  question: string;
  workspace: string;
  queryType?: StructuredQueryType;
  mode?: QueryMode;
  operation?: OperationType;
}

// ─── StructuredAskEngine ─────────────────────────────────────────────────────

export class StructuredAskEngine {
  constructor(private readonly engineFactory: (workspaceId: string) => TrustAwareQueryEngine) {}

  /**
   * Process a structured query against the knowledge graph.
   * Routes through OperationResolver → TrustAwareQueryEngine.
   *
   * @returns QueryResult with status, reasoning paths, provenance, and confidence.
   */
  async ask(query: StructuredQuery): Promise<QueryResult> {
    // Resolve the operation type from query type or explicit operation
    const operation = this.resolveOperation(query);
    const mode = query.mode ?? 'authoritative';

    // Get the workspace-scoped query engine
    const engine = this.engineFactory(query.workspace);

    // Dispatch to the appropriate engine method based on query type
    const result = await this.dispatch(engine, query, operation, mode);

    // Post-process: ensure reasoning paths and explanation are always present
    return this.ensureReasoningContext(result, query, operation, mode);
  }

  /**
   * Resolves the OperationType for a given query.
   * Priority: explicit operation > query type mapping > OperationResolver fallback.
   */
  private resolveOperation(query: StructuredQuery): OperationType {
    // If an explicit operation is provided, use it directly
    if (query.operation) {
      return query.operation;
    }

    // If a query type is provided, map it to an operation
    if (query.queryType) {
      const mapped = QUERY_TYPE_TO_OPERATION[query.queryType];
      if (mapped) return mapped;
    }

    // Fall back to OperationResolver with structured-ask caller
    return OperationResolver.resolve({
      caller: 'structured-ask',
      requested: null,
    });
  }

  /**
   * Dispatches the query to the appropriate TrustAwareQueryEngine method
   * based on the query type.
   */
  private async dispatch(
    engine: TrustAwareQueryEngine,
    query: StructuredQuery,
    operation: OperationType,
    mode: QueryMode,
  ): Promise<QueryResult> {
    const queryType = query.queryType;

    switch (queryType) {
      case 'what-is-symbol':
        return engine.searchNodes(query.question, operation, mode);

      case 'what-depends-on':
        return engine.analyzeImpact(query.question, operation, mode);

      case 'what-route-calls':
        return engine.findCallers(query.question, operation, mode);

      case 'lineage':
        return engine.findCallers(query.question, operation, mode);

      case 'impact':
        return engine.analyzeImpact(query.question, operation, mode);

      case 'why-canonical':
        return engine.getNode(query.question, operation, mode);

      case 'why-insufficient-context':
        return engine.searchNodes(query.question, operation, mode);

      default:
        // No query type specified — use general search
        return engine.searchNodes(query.question, operation, mode);
    }
  }

  /**
   * Ensures every response includes reasoning context:
   * - selected_paths (from the result)
   * - rejected_paths (empty if none)
   * - selection_explanation (always present)
   *
   * Also enforces INSUFFICIENT_EVIDENCE and EXPLORATORY_ONLY semantics.
   */
  private ensureReasoningContext(
    result: QueryResult,
    query: StructuredQuery,
    operation: OperationType,
    mode: QueryMode,
  ): QueryResult {
    const hasData = result.data.nodes.length > 0 || result.data.edges.length > 0;
    const exploratoryOnly = hasData && result.data.nodes.every(
      (n) => n.graph_kind === 'exploratory',
    ) && result.data.edges.every(
      (e) => e.graph_kind === 'exploratory',
    );

    // If no data and status is not already a failure status, return INSUFFICIENT_EVIDENCE
    if (!hasData && result.status === DecisionStatus.OK) {
      return QueryResultFactory.create({
        status: DecisionStatus.INSUFFICIENT_EVIDENCE,
        nodes: [],
        edges: [],
        selectedPaths: result.reasoning.selected_paths,
        rejectedPaths: result.reasoning.rejected_paths ?? [],
        reasons: [
          ...result.reasoning.selection_explanation,
          `No canonical or derived path answers the query (queryType=${query.queryType ?? 'unspecified'}, operation=${operation}, mode=${mode})`,
        ],
        warnings: [...result.warnings, 'NO_EVIDENCE_FOUND'],
        codes: [...result.codes, 'GRAPH_QUERY_INSUFFICIENT_CONTEXT'],
        confidenceLevel: 'LOW',
        confidenceReasons: ['No evidence found for query'],
        metadata: {
          queryType: query.queryType,
          operation,
          mode,
          ...(result.metadata ?? {}),
        },
      });
    }

    // If all evidence is exploratory, flag as EXPLORATORY_ONLY
    if (exploratoryOnly && result.status !== DecisionStatus.POLICY_VIOLATION) {
      return QueryResultFactory.create({
        status: DecisionStatus.EXPLORATORY_ONLY,
        nodes: result.data.nodes,
        edges: result.data.edges,
        selectedPaths: result.reasoning.selected_paths,
        rejectedPaths: result.reasoning.rejected_paths ?? [],
        reasons: [
          ...result.reasoning.selection_explanation,
          'Only exploratory evidence exists for this query',
        ],
        warnings: [...result.warnings, 'EXPLORATORY_USED'],
        codes: [...new Set([...result.codes, 'EXPLORATORY_USED'])],
        confidenceLevel: 'LOW',
        confidenceReasons: ['Only exploratory (non-authoritative) evidence available'],
        provenanceSources: result.provenance.sources,
        metadata: {
          queryType: query.queryType,
          operation,
          mode,
          ...(result.metadata ?? {}),
        },
      });
    }

    // Ensure reasoning context is always present in the response
    const selectionExplanation = result.reasoning.selection_explanation.length > 0
      ? result.reasoning.selection_explanation
      : [`Query resolved via operation=${operation}, mode=${mode}, queryType=${query.queryType ?? 'unspecified'}`];

    return {
      ...result,
      reasoning: {
        selected_paths: result.reasoning.selected_paths,
        rejected_paths: result.reasoning.rejected_paths ?? [],
        selection_explanation: selectionExplanation,
      },
      metadata: {
        queryType: query.queryType,
        operation,
        mode,
        ...(result.metadata ?? {}),
      },
    };
  }
}
