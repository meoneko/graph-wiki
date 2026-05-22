/**
 * Eval orchestrator — loads suite, runs cases, computes score, writes report.
 *
 * This is the main entry point for `crg eval`. It:
 * 1. Loads the eval suite from disk
 * 2. Creates a StructuredAskEngine for the workspace
 * 3. Executes all cases and scores them
 * 4. Computes overall pass/fail based on threshold
 * 5. Writes the report to knowledge/reports/{workspace}/eval.json
 * 6. Prints formatted output (table or JSON)
 *
 * @see Requirements 5.2, 5.4, 5.5, 5.6
 */

import { StructuredAskEngine } from '../core/ask/StructuredAskEngine.js';
import { getTrustedQueryService } from '../core/graph/query/TrustedQueryService.js';
import { getDB } from '../storage/GraphDB.js';
import { resolveDbPath } from '../pipeline/config.js';
import { loadSuite } from './loader.js';
import { executeEvalCases } from './runner.js';
import { writeEvalReport, printEvalTable, printEvalJson } from './reporter.js';
import type { EvalReport } from './types.js';

export { loadSuite } from './loader.js';
export { scoreCase } from './scorer.js';
export { executeEvalCases } from './runner.js';
export { writeEvalReport, printEvalTable, printEvalJson } from './reporter.js';
export type { EvalCase, EvalCaseResult, EvalReport } from './types.js';

/**
 * Runs the full evaluation pipeline.
 *
 * @param options.workspaceId - The workspace to evaluate against.
 * @param options.suitePath - Path to the eval suite file (JSON or YAML).
 * @param options.threshold - Pass threshold (0-1). Score must be >= threshold to pass.
 * @param options.json - If true, output full JSON report to stdout instead of table.
 * @returns The complete EvalReport.
 */
export async function runEval(options: {
  workspaceId: string;
  suitePath: string;
  threshold: number;
  json?: boolean;
}): Promise<EvalReport> {
  const { workspaceId, suitePath, threshold, json } = options;

  // 1. Load the eval suite
  const cases = loadSuite(suitePath);

  // 2. Create the ask engine
  const engine = createAskEngine();

  // 3. Execute all cases
  const results = await executeEvalCases(cases, engine, workspaceId);

  // 4. Compute overall score
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.length - passed;
  const totalCases = results.length;
  const score = totalCases > 0 ? passed / totalCases : 0;
  const passed_overall = score >= threshold;

  // 5. Build the report
  const report: EvalReport = {
    workspaceId,
    suiteFile: suitePath,
    runAt: new Date().toISOString(),
    totalCases,
    passed,
    failed,
    score,
    passThreshold: threshold,
    passed_overall,
    cases: results,
  };

  // 6. Write report to disk
  writeEvalReport(report);

  // 7. Print output
  if (json) {
    printEvalJson(report);
  } else {
    printEvalTable(report);
  }

  return report;
}

/**
 * Creates a StructuredAskEngine using the default DB path.
 */
function createAskEngine(): StructuredAskEngine {
  const service = getTrustedQueryService(getDB(resolveDbPath()));
  return new StructuredAskEngine((workspaceId) => service.engine(workspaceId));
}
