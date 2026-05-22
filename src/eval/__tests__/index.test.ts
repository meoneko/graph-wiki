/**
 * Unit tests for eval orchestrator — runEval().
 *
 * Tests the full pipeline: load → execute → score → report.
 * Mocks the DB/engine layer to test orchestration logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import type { QueryResult } from '../../core/types.js';
import { DecisionStatus } from '../../core/errors.js';

// Mock node:fs
vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(),
}));

// Mock the DB and service layer
vi.mock('../../storage/GraphDB.js', () => ({
  getDB: vi.fn(() => ({})),
}));

vi.mock('../../pipeline/config.js', () => ({
  resolveDbPath: vi.fn(() => ':memory:'),
}));

// Create a mock ask function we can control
const mockAsk = vi.fn();

vi.mock('../../core/graph/query/TrustedQueryService.js', () => ({
  getTrustedQueryService: vi.fn(() => ({
    engine: vi.fn(() => ({})),
  })),
}));

// Mock StructuredAskEngine as a class
vi.mock('../../core/ask/StructuredAskEngine.js', () => ({
  StructuredAskEngine: class MockStructuredAskEngine {
    constructor() {}
    ask = mockAsk;
  },
}));

// Mock the loader since it reads from disk
vi.mock('../loader.js', () => ({
  loadSuite: vi.fn(),
}));

import { runEval } from '../index.js';
import { loadSuite } from '../loader.js';
import { writeFileSync, mkdirSync } from 'node:fs';

function createMockQueryResult(nodeCount: number): QueryResult {
  return {
    status: DecisionStatus.OK,
    reasoning: {
      selected_paths: [],
      rejected_paths: [],
      selection_explanation: ['test'],
    },
    data: {
      nodes: Array.from({ length: nodeCount }, (_, i) => ({
        id: `node-${i}`,
        stableKey: `stable-${i}`,
        label: `Node${i}`,
        type: 'service',
        graph_kind: 'canonical' as const,
        source_file: 'test.ts',
        project: 'test',
        workspace: 'test-ws',
        confidence_band: 'AUTHORITATIVE' as const,
        provenance: { source: 'parser' as const, artifact_source: 'test', producer_stage: 'test', timestamp: new Date().toISOString() },
      })),
      edges: [],
    },
    confidence: { level: 'HIGH' as const, reasons: [] },
    provenance: { sources: [] },
    warnings: [],
    codes: [],
  };
}

describe('runEval', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns passed_overall: true when all cases pass and score >= threshold', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
      { id: 'c2', description: 'test', queryType: 'what-is-symbol', query: 'Y', expect: { notEmpty: true } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(3));

    const report = await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.9,
    });

    expect(report.passed_overall).toBe(true);
    expect(report.score).toBe(1.0);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.totalCases).toBe(2);
  });

  it('returns passed_overall: false when score < threshold', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
      { id: 'c2', description: 'test', queryType: 'what-is-symbol', query: 'Y', expect: { minNodeCount: 10 } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(3));

    const report = await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.9,
    });

    expect(report.passed_overall).toBe(false);
    expect(report.score).toBe(0.5);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
  });

  it('computes score as passed / totalCases', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
      { id: 'c2', description: 'test', queryType: 'what-is-symbol', query: 'Y', expect: { notEmpty: true } },
      { id: 'c3', description: 'test', queryType: 'what-is-symbol', query: 'Z', expect: { minNodeCount: 100 } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(2));

    const report = await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.5,
    });

    // 2 pass (notEmpty with 2 nodes), 1 fail (minNodeCount: 100)
    expect(report.score).toBeCloseTo(2 / 3);
    expect(report.passed_overall).toBe(true); // 0.667 >= 0.5
  });

  it('writes report to disk', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(1));

    await runEval({
      workspaceId: 'my-ws',
      suitePath: 'suite.json',
      threshold: 0.9,
    });

    expect(mkdirSync).toHaveBeenCalled();
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('eval.json'),
      expect.any(String),
    );
  });

  it('prints JSON to stdout when json option is true', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(1));

    await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.9,
      json: true,
    });

    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.workspaceId).toBe('ws');
    expect(parsed.cases).toHaveLength(1);
  });

  it('prints table to stdout when json option is false', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(1));

    await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.9,
    });

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('Score:');
    expect(output).toContain('---');
  });

  it('handles empty suite gracefully', async () => {
    vi.mocked(loadSuite).mockReturnValue([]);

    const report = await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.9,
    });

    expect(report.totalCases).toBe(0);
    expect(report.score).toBe(0);
    expect(report.passed_overall).toBe(false);
  });

  it('includes runAt timestamp in ISO format', async () => {
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'test', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(1));

    const report = await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.9,
    });

    // Should be a valid ISO date string
    expect(new Date(report.runAt).toISOString()).toBe(report.runAt);
  });

  it('returns passed_overall: false enabling exit code 1 when score below threshold', async () => {
    // Simulates the CLI contract: when score < threshold, process.exitCode = 1
    vi.mocked(loadSuite).mockReturnValue([
      { id: 'c1', description: 'pass', queryType: 'what-is-symbol', query: 'X', expect: { notEmpty: true } },
      { id: 'c2', description: 'fail', queryType: 'what-is-symbol', query: 'Y', expect: { minNodeCount: 50 } },
      { id: 'c3', description: 'fail', queryType: 'what-is-symbol', query: 'Z', expect: { minNodeCount: 50 } },
    ]);

    mockAsk.mockResolvedValue(createMockQueryResult(2));

    const report = await runEval({
      workspaceId: 'ws',
      suitePath: 'suite.json',
      threshold: 0.8, // 80% threshold
    });

    // Score is 1/3 ≈ 0.33, which is below 0.8 threshold
    expect(report.score).toBeCloseTo(1 / 3);
    expect(report.passed_overall).toBe(false);

    // CLI sets process.exitCode = 1 when passed_overall is false
    // This verifies the contract that enables exit code 1
    const exitCode = report.passed_overall ? 0 : 1;
    expect(exitCode).toBe(1);
  });
});
