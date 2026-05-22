/**
 * Evaluation Runner types — defines the shape of eval suites, results, and reports.
 *
 * @see Requirements 5.1, 5.2, 5.3
 */

import type { QueryMode } from '../core/types.js';
import type { StructuredQueryType } from '../core/ask/StructuredAskEngine.js';

export { StructuredQueryType } from '../core/ask/StructuredAskEngine.js';
export type { QueryMode } from '../core/types.js';

/**
 * A single evaluation case — a predefined query with expected outcome predicates.
 */
export interface EvalCase {
  id: string;
  description: string;
  queryType: StructuredQueryType;
  query: string;
  mode?: QueryMode;
  expect: {
    minNodeCount?: number;
    nodeLabels?: string[];
    nodeKinds?: string[];
    notEmpty?: boolean;
  };
}

/**
 * Result of running a single eval case — extends EvalCase with actual outcomes.
 */
export interface EvalCaseResult extends EvalCase {
  status: 'pass' | 'fail' | 'error';
  actualNodeCount: number;
  matchedLabels: string[];
  missingLabels: string[];
  errorMessage?: string;
  durationMs: number;
}

/**
 * Full evaluation report — aggregates all case results with pass/fail summary.
 */
export interface EvalReport {
  workspaceId: string;
  suiteFile: string;
  runAt: string;
  totalCases: number;
  passed: number;
  failed: number;
  score: number;
  passThreshold: number;
  passed_overall: boolean;
  cases: EvalCaseResult[];
}
