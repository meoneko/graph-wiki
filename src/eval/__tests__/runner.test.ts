/**
 * Unit tests for eval runner — executeEvalCases().
 *
 * Tests that the runner:
 * - Calls the ask engine for each case
 * - Scores results correctly
 * - Records timing
 * - Handles errors gracefully (marks as 'error')
 */

import { describe, it, expect, vi } from 'vitest';
import { executeEvalCases } from '../runner.js';
import type { EvalCase } from '../types.js';
import type { QueryResult } from '../../core/types.js';
import { DecisionStatus } from '../../core/errors.js';

function createMockQueryResult(nodes: Array<{ label: string; type: string }>): QueryResult {
  return {
    status: DecisionStatus.OK,
    reasoning: {
      selected_paths: [],
      rejected_paths: [],
      selection_explanation: ['test'],
    },
    data: {
      nodes: nodes.map((n, i) => ({
        id: `node-${i}`,
        stableKey: `stable-${i}`,
        label: n.label,
        type: n.type,
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

function createEvalCase(overrides: Partial<EvalCase> = {}): EvalCase {
  return {
    id: 'test-case-1',
    description: 'Test case',
    queryType: 'what-is-symbol',
    query: 'OrderService',
    expect: { notEmpty: true },
    ...overrides,
  };
}

describe('executeEvalCases', () => {
  it('executes each case and returns scored results', async () => {
    const cases: EvalCase[] = [
      createEvalCase({ id: 'case-1', expect: { notEmpty: true } }),
      createEvalCase({ id: 'case-2', expect: { minNodeCount: 2 } }),
    ];

    const mockResult = createMockQueryResult([
      { label: 'OrderService', type: 'service' },
      { label: 'PaymentService', type: 'service' },
    ]);

    const mockEngine = {
      ask: vi.fn().mockResolvedValue(mockResult),
    };

    const results = await executeEvalCases(cases, mockEngine as any, 'test-ws');

    expect(results).toHaveLength(2);
    expect(results[0]!.id).toBe('case-1');
    expect(results[0]!.status).toBe('pass');
    expect(results[1]!.id).toBe('case-2');
    expect(results[1]!.status).toBe('pass');
  });

  it('records durationMs for each case', async () => {
    const cases: EvalCase[] = [createEvalCase()];
    const mockResult = createMockQueryResult([{ label: 'X', type: 'service' }]);

    const mockEngine = {
      ask: vi.fn().mockResolvedValue(mockResult),
    };

    const results = await executeEvalCases(cases, mockEngine as any, 'test-ws');

    expect(results[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('marks case as error when engine throws', async () => {
    const cases: EvalCase[] = [
      createEvalCase({ id: 'error-case', expect: { nodeLabels: ['Missing'] } }),
    ];

    const mockEngine = {
      ask: vi.fn().mockRejectedValue(new Error('DB connection failed')),
    };

    const results = await executeEvalCases(cases, mockEngine as any, 'test-ws');

    expect(results[0]!.status).toBe('error');
    expect(results[0]!.errorMessage).toBe('DB connection failed');
    expect(results[0]!.actualNodeCount).toBe(0);
    expect(results[0]!.missingLabels).toEqual(['Missing']);
  });

  it('passes workspace and query details to the engine', async () => {
    const cases: EvalCase[] = [
      createEvalCase({
        query: 'find controllers',
        queryType: 'what-depends-on',
        mode: 'authoritative',
      }),
    ];

    const mockResult = createMockQueryResult([]);
    const mockEngine = {
      ask: vi.fn().mockResolvedValue(mockResult),
    };

    await executeEvalCases(cases, mockEngine as any, 'my-workspace');

    expect(mockEngine.ask).toHaveBeenCalledWith({
      question: 'find controllers',
      workspace: 'my-workspace',
      queryType: 'what-depends-on',
      mode: 'authoritative',
    });
  });

  it('defaults mode to mixed_safe when not specified', async () => {
    const cases: EvalCase[] = [createEvalCase({ mode: undefined })];
    const mockResult = createMockQueryResult([{ label: 'X', type: 'service' }]);
    const mockEngine = { ask: vi.fn().mockResolvedValue(mockResult) };

    await executeEvalCases(cases, mockEngine as any, 'ws');

    expect(mockEngine.ask).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'mixed_safe' }),
    );
  });

  it('correctly scores a failing case', async () => {
    const cases: EvalCase[] = [
      createEvalCase({ expect: { minNodeCount: 5 } }),
    ];

    const mockResult = createMockQueryResult([
      { label: 'A', type: 'service' },
    ]);

    const mockEngine = { ask: vi.fn().mockResolvedValue(mockResult) };

    const results = await executeEvalCases(cases, mockEngine as any, 'ws');

    expect(results[0]!.status).toBe('fail');
    expect(results[0]!.actualNodeCount).toBe(1);
  });
});
