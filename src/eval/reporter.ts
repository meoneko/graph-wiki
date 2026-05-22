/**
 * Eval reporter — writes eval.json to reports dir and prints formatted table to stdout.
 *
 * Output format:
 * ```
 * ID          | Status | Nodes | Duration
 * test-1      | PASS   | 3     | 45ms
 * test-2      | FAIL   | 0     | 12ms
 * ---
 * Score: 1/2 (50%) — FAIL (threshold: 90%)
 * ```
 *
 * @see Requirements 5.5, 5.6
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { EvalReport } from './types.js';

/**
 * Writes the eval report JSON to the reports directory.
 *
 * @param report - The full EvalReport to persist.
 * @param reportsRoot - Base reports directory (default: 'knowledge/reports').
 * @returns The absolute path where the report was written.
 */
export function writeEvalReport(report: EvalReport, reportsRoot = 'knowledge/reports'): string {
  const reportPath = join(reportsRoot, report.workspaceId, 'eval.json');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

/**
 * Prints a formatted summary table to stdout.
 *
 * @param report - The EvalReport to display.
 */
export function printEvalTable(report: EvalReport): void {
  // Compute column widths
  const idWidth = Math.max(
    'ID'.length,
    ...report.cases.map((c) => c.id.length),
  );
  const statusWidth = 'Status'.length; // 'PASS' / 'FAIL' / 'ERROR' all fit in 6
  const nodesWidth = 'Nodes'.length;
  const durationWidth = 'Duration'.length;

  // Header
  const header = [
    pad('ID', idWidth),
    pad('Status', statusWidth),
    pad('Nodes', nodesWidth),
    pad('Duration', durationWidth),
  ].join(' | ');

  console.log(header);

  // Rows
  for (const c of report.cases) {
    const statusStr = c.status.toUpperCase();
    const row = [
      pad(c.id, idWidth),
      pad(statusStr, statusWidth),
      pad(String(c.actualNodeCount), nodesWidth),
      pad(`${c.durationMs}ms`, durationWidth),
    ].join(' | ');
    console.log(row);
  }

  // Separator
  console.log('---');

  // Summary line
  const pct = report.totalCases > 0
    ? ((report.score * 100).toFixed(0))
    : '0';
  const thresholdPct = (report.passThreshold * 100).toFixed(0);
  const overallStatus = report.passed_overall ? 'PASS' : 'FAIL';

  console.log(
    `Score: ${report.passed}/${report.totalCases} (${pct}%) \u2014 ${overallStatus} (threshold: ${thresholdPct}%)`,
  );
}

/**
 * Outputs the full EvalReport as JSON to stdout (for --json flag).
 */
export function printEvalJson(report: EvalReport): void {
  console.log(JSON.stringify(report, null, 2));
}

/**
 * Right-pads a string to the given width.
 */
function pad(str: string, width: number): string {
  return str.padEnd(width);
}
