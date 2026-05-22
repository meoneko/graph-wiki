/**
 * Unit tests for eval reporter — writeEvalReport(), printEvalTable(), printEvalJson().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { writeEvalReport, printEvalTable, printEvalJson } from '../reporter.js';
import type { EvalReport } from '../types.js';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

function createReport(overrides: Partial<EvalReport> = {}): EvalReport {
  return {
    workspaceId: 'test-ws',
    suiteFile: 'suite.json',
    runAt: '2025-01-01T00:00:00.000Z',
    totalCases: 2,
    passed: 1,
    failed: 1,
    score: 0.5,
    passThreshold: 0.9,
    passed_overall: false,
    cases: [
      {
        id: 'test-1',
        description: 'First test',
        queryType: 'what-is-symbol',
        query: 'OrderService',
        expect: { notEmpty: true },
        status: 'pass',
        actualNodeCount: 3,
        matchedLabels: [],
        missingLabels: [],
        durationMs: 45,
      },
      {
        id: 'test-2',
        description: 'Second test',
        queryType: 'what-depends-on',
        query: 'PaymentService',
        expect: { minNodeCount: 5 },
        status: 'fail',
        actualNodeCount: 0,
        matchedLabels: [],
        missingLabels: [],
        durationMs: 12,
      },
    ],
    ...overrides,
  };
}

describe('writeEvalReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes report JSON to the correct path', () => {
    const report = createReport();
    const result = writeEvalReport(report, 'knowledge/reports');

    expect(mkdirSync).toHaveBeenCalledWith(join('knowledge', 'reports', 'test-ws'), { recursive: true });
    expect(writeFileSync).toHaveBeenCalledWith(
      join('knowledge', 'reports', 'test-ws', 'eval.json'),
      JSON.stringify(report, null, 2),
    );
    expect(result).toBe(join('knowledge', 'reports', 'test-ws', 'eval.json'));
  });

  it('uses workspace ID in the path', () => {
    const report = createReport({ workspaceId: 'my-project' });
    const result = writeEvalReport(report, 'reports');

    expect(result).toBe(join('reports', 'my-project', 'eval.json'));
  });
});

describe('printEvalTable', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints header, rows, separator, and summary', () => {
    const report = createReport();
    printEvalTable(report);

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');

    // Header
    expect(output).toContain('ID');
    expect(output).toContain('Status');
    expect(output).toContain('Nodes');
    expect(output).toContain('Duration');

    // Rows
    expect(output).toContain('test-1');
    expect(output).toContain('PASS');
    expect(output).toContain('45ms');
    expect(output).toContain('test-2');
    expect(output).toContain('FAIL');
    expect(output).toContain('12ms');

    // Separator
    expect(output).toContain('---');

    // Summary
    expect(output).toContain('Score: 1/2 (50%)');
    expect(output).toContain('FAIL');
    expect(output).toContain('threshold: 90%');
  });

  it('prints PASS when score meets threshold', () => {
    const report = createReport({
      passed: 2,
      failed: 0,
      score: 1.0,
      passThreshold: 0.9,
      passed_overall: true,
    });
    printEvalTable(report);

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    // The summary line should contain PASS (not just in the row)
    expect(output).toMatch(/Score:.*PASS/);
  });
});

describe('printEvalJson', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('outputs the full report as formatted JSON', () => {
    const report = createReport();
    printEvalJson(report);

    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);

    expect(parsed.workspaceId).toBe('test-ws');
    expect(parsed.totalCases).toBe(2);
    expect(parsed.cases).toHaveLength(2);
  });
});
