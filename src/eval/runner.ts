/**
 * Eval runner — executes each eval case against the StructuredAskEngine and scores results.
 *
 * For each case in the suite:
 * 1. Calls StructuredAskEngine.ask() with the case's query, queryType, and mode
 * 2. Scores the result via scoreCase()
 * 3. Records timing information
 *
 * @see Requirements 5.2, 5.5
 */

import { StructuredAskEngine } from '../core/ask/StructuredAskEngine.js';
import type { StructuredQuery } from '../core/ask/StructuredAskEngine.js';
import type { QueryResult } from '../core/types.js';
import type { EvalCase, EvalCaseResult } from './types.js';
import { scoreCase } from './scorer.js';

/**
 * Runs all eval cases against the ask engine and returns scored results.
 *
 * @param cases - Array of eval cases to execute.
 * @param engine - The StructuredAskEngine instance to query against.
 * @param workspaceId - The workspace to query.
 * @returns Array of EvalCaseResult with status, timing, and match details.
 */
export async function executeEvalCases(
  cases: EvalCase[],
  engine: StructuredAskEngine,
  workspaceId: string,
): Promise<EvalCaseResult[]> {
  const results: EvalCaseResult[] = [];

  for (const evalCase of cases) {
    const result = await executeOneCase(evalCase, engine, workspaceId);
    results.push(result);
  }

  return results;
}

/**
 * Executes a single eval case: queries the engine, scores the result, and records timing.
 */
async function executeOneCase(
  evalCase: EvalCase,
  engine: StructuredAskEngine,
  workspaceId: string,
): Promise<EvalCaseResult> {
  const startMs = Date.now();

  try {
    const query: StructuredQuery = {
      question: evalCase.query,
      workspace: workspaceId,
      queryType: evalCase.queryType,
      mode: evalCase.mode ?? 'mixed_safe',
    };

    const queryResult: QueryResult = await engine.ask(query);
    const scored = scoreCase(evalCase, queryResult);

    return {
      ...scored,
      durationMs: Date.now() - startMs,
    };
  } catch (err) {
    // Mark case as 'error' if the query itself throws
    return {
      ...evalCase,
      status: 'error',
      actualNodeCount: 0,
      matchedLabels: [],
      missingLabels: evalCase.expect.nodeLabels ?? [],
      errorMessage: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startMs,
    };
  }
}
