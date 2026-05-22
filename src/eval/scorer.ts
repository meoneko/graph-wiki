/**
 * Eval case scorer — checks predicates defined in EvalCase.expect against query results.
 *
 * Predicates:
 * - `notEmpty: true` — result must have at least 1 node
 * - `minNodeCount: N` — result must have at least N nodes
 * - `nodeLabels: ['A', 'B']` — result must contain nodes with these labels
 * - `nodeKinds: ['service', 'controller']` — result must contain nodes of these kinds (type field)
 *
 * @see Requirements 5.3
 */

import type { QueryResult, GraphNode } from '../core/types.js';
import type { EvalCase, EvalCaseResult } from './types.js';

/**
 * Scores a single eval case by checking all predicates in `evalCase.expect`
 * against the actual query result.
 *
 * @param evalCase - The eval case with expected predicates.
 * @param queryResult - The result from StructuredAskEngine.ask().
 * @returns EvalCaseResult with status, actualNodeCount, matchedLabels, missingLabels.
 */
export function scoreCase(evalCase: EvalCase, queryResult: QueryResult): EvalCaseResult {
  const nodes: GraphNode[] = queryResult.data.nodes;
  const actualNodeCount = nodes.length;

  // Collect actual labels and kinds from result nodes
  const actualLabels = new Set(nodes.map((n) => n.label));
  const actualKinds = new Set(nodes.map((n) => n.type));

  // Evaluate each predicate
  const failures: string[] = [];

  // notEmpty: result must have at least 1 node
  if (evalCase.expect.notEmpty === true && actualNodeCount === 0) {
    failures.push('notEmpty: result is empty');
  }

  // minNodeCount: result must have at least N nodes
  if (
    evalCase.expect.minNodeCount !== undefined &&
    actualNodeCount < evalCase.expect.minNodeCount
  ) {
    failures.push(
      `minNodeCount: expected at least ${evalCase.expect.minNodeCount}, got ${actualNodeCount}`,
    );
  }

  // nodeLabels: result must contain nodes with these labels
  const expectedLabels = evalCase.expect.nodeLabels ?? [];
  const matchedLabels: string[] = [];
  const missingLabels: string[] = [];

  for (const label of expectedLabels) {
    if (actualLabels.has(label)) {
      matchedLabels.push(label);
    } else {
      missingLabels.push(label);
    }
  }

  if (missingLabels.length > 0) {
    failures.push(`nodeLabels: missing [${missingLabels.join(', ')}]`);
  }

  // nodeKinds: result must contain nodes of these kinds (mapped to GraphNode.type)
  if (evalCase.expect.nodeKinds !== undefined) {
    const missingKinds = evalCase.expect.nodeKinds.filter((kind) => !actualKinds.has(kind));
    if (missingKinds.length > 0) {
      failures.push(`nodeKinds: missing [${missingKinds.join(', ')}]`);
    }
  }

  // Determine status
  const status: EvalCaseResult['status'] = failures.length === 0 ? 'pass' : 'fail';

  return {
    ...evalCase,
    status,
    actualNodeCount,
    matchedLabels,
    missingLabels,
    durationMs: 0, // Duration is set by the runner, not the scorer
  };
}
