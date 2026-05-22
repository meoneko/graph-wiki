/**
 * Tests for QueryResultValidator — contract enforcement across all surfaces.
 *
 * Validates Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6:
 * - Every external-facing reasoning operation returns QueryResult
 * - QueryResult includes all required fields
 * - Raw graph data is never returned without status and provenance
 * - AMBIGUOUS status includes union of selected path nodes/edges in flattened data
 */

import { describe, expect, it } from 'vitest';
import {
  validateQueryResult,
  isValidQueryResult,
  enforceQueryResultContract,
} from './QueryResultValidator.js';
import { QueryResultFactory } from './QueryResultFactory.js';
import type { QueryResult, GraphNode, GraphEdge, ReasoningPath } from '../../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(id: string, graphKind: 'canonical' | 'exploratory' = 'canonical'): GraphNode {
  return {
    id,
    stableKey: `key-${id}`,
    workspace: 'test-ws',
    project: 'test-project',
    type: 'function',
    label: `Node ${id}`,
    graph_kind: graphKind,
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test.ts',
      producer_stage: 'extract',
      timestamp: '2024-01-01T00:00:00Z',
    },
  };
}

function makeEdge(id: string, fromId: string, toId: string): GraphEdge {
  return {
    id,
    stableKey: `key-${id}`,
    workspace: 'test-ws',
    from_id: fromId,
    to_id: toId,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test.ts',
      producer_stage: 'extract',
      timestamp: '2024-01-01T00:00:00Z',
    },
  };
}

function makeValidQueryResult(overrides: Partial<QueryResult> = {}): QueryResult {
  return {
    status: 'OK',
    reasoning: {
      selected_paths: [],
      selection_explanation: ['test result'],
    },
    data: { nodes: [], edges: [] },
    confidence: { level: 'HIGH', reasons: ['test'] },
    provenance: { sources: [] },
    warnings: [],
    codes: [],
    ...overrides,
  };
}

// ─── validateQueryResult ─────────────────────────────────────────────────────

describe('validateQueryResult', () => {
  it('accepts a valid QueryResult with all required fields', () => {
    const result = makeValidQueryResult();
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(true);
    expect(outcome.issues).toHaveLength(0);
  });

  it('rejects null', () => {
    const outcome = validateQueryResult(null);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues[0]?.field).toBe('root');
  });

  it('rejects undefined', () => {
    const outcome = validateQueryResult(undefined);
    expect(outcome.valid).toBe(false);
  });

  it('rejects a primitive value', () => {
    const outcome = validateQueryResult('hello');
    expect(outcome.valid).toBe(false);
  });

  it('rejects missing status', () => {
    const { status, ...rest } = makeValidQueryResult();
    const outcome = validateQueryResult(rest);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'status')).toBe(true);
  });

  it('rejects invalid status value', () => {
    const result = makeValidQueryResult({ status: 'INVALID_STATUS' as any });
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'status')).toBe(true);
  });

  it('accepts all valid DecisionStatus values', () => {
    const statuses = ['OK', 'AMBIGUOUS', 'INSUFFICIENT_EVIDENCE', 'EXPLORATORY_ONLY', 'PARTIAL', 'POLICY_VIOLATION', 'UNSUPPORTED_QUERY'];
    for (const status of statuses) {
      const result = makeValidQueryResult({ status: status as any });
      const outcome = validateQueryResult(result);
      expect(outcome.valid).toBe(true);
    }
  });

  it('rejects missing reasoning', () => {
    const result = makeValidQueryResult();
    delete (result as any).reasoning;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'reasoning')).toBe(true);
  });

  it('rejects reasoning without selected_paths', () => {
    const result = makeValidQueryResult();
    (result.reasoning as any).selected_paths = 'not-an-array';
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'reasoning.selected_paths')).toBe(true);
  });

  it('rejects reasoning without selection_explanation', () => {
    const result = makeValidQueryResult();
    delete (result.reasoning as any).selection_explanation;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'reasoning.selection_explanation')).toBe(true);
  });

  it('rejects missing data', () => {
    const result = makeValidQueryResult();
    delete (result as any).data;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'data')).toBe(true);
  });

  it('rejects data without nodes array', () => {
    const result = makeValidQueryResult();
    delete (result.data as any).nodes;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'data.nodes')).toBe(true);
  });

  it('rejects data without edges array', () => {
    const result = makeValidQueryResult();
    delete (result.data as any).edges;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'data.edges')).toBe(true);
  });

  it('rejects missing confidence', () => {
    const result = makeValidQueryResult();
    delete (result as any).confidence;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'confidence')).toBe(true);
  });

  it('rejects invalid confidence level', () => {
    const result = makeValidQueryResult();
    (result.confidence as any).level = 'VERY_HIGH';
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'confidence.level')).toBe(true);
  });

  it('rejects missing provenance', () => {
    const result = makeValidQueryResult();
    delete (result as any).provenance;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'provenance')).toBe(true);
  });

  it('rejects provenance without sources array', () => {
    const result = makeValidQueryResult();
    (result.provenance as any).sources = 'not-an-array';
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'provenance.sources')).toBe(true);
  });

  it('rejects missing warnings', () => {
    const result = makeValidQueryResult();
    delete (result as any).warnings;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'warnings')).toBe(true);
  });

  it('rejects missing codes', () => {
    const result = makeValidQueryResult();
    delete (result as any).codes;
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(false);
    expect(outcome.issues.some((i) => i.field === 'codes')).toBe(true);
  });

  it('warns when AMBIGUOUS status has selected paths but data is missing union nodes', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');
    const pathA: ReasoningPath = {
      path_id: 'path-a',
      nodes: [nodeA],
      edges: [],
      trust_level: 'AUTHORITATIVE',
      status: 'OK',
      summary: 'path A',
    };
    const pathB: ReasoningPath = {
      path_id: 'path-b',
      nodes: [nodeB],
      edges: [],
      trust_level: 'AUTHORITATIVE',
      status: 'OK',
      summary: 'path B',
    };
    const result = makeValidQueryResult({
      status: 'AMBIGUOUS',
      reasoning: {
        selected_paths: [pathA, pathB],
        selection_explanation: ['ambiguous result'],
      },
      data: { nodes: [nodeA], edges: [] }, // Missing nodeB
    });
    const outcome = validateQueryResult(result);
    // Still valid (warning, not error) but has a warning about missing union
    expect(outcome.valid).toBe(true);
    expect(outcome.issues.some((i) => i.field === 'data.nodes' && i.severity === 'warning')).toBe(true);
  });

  it('passes AMBIGUOUS validation when data includes union of all path nodes', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');
    const pathA: ReasoningPath = {
      path_id: 'path-a',
      nodes: [nodeA],
      edges: [],
      trust_level: 'AUTHORITATIVE',
      status: 'OK',
      summary: 'path A',
    };
    const pathB: ReasoningPath = {
      path_id: 'path-b',
      nodes: [nodeB],
      edges: [],
      trust_level: 'AUTHORITATIVE',
      status: 'OK',
      summary: 'path B',
    };
    const result = makeValidQueryResult({
      status: 'AMBIGUOUS',
      reasoning: {
        selected_paths: [pathA, pathB],
        selection_explanation: ['ambiguous result'],
      },
      data: { nodes: [nodeA, nodeB], edges: [] }, // Union of both paths
    });
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(true);
    expect(outcome.issues).toHaveLength(0);
  });

  it('accepts QueryResult with optional metadata', () => {
    const result = makeValidQueryResult({
      metadata: { tool: { name: 'test_tool' } },
    });
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(true);
  });

  it('accepts QueryResult with extra data fields beyond nodes/edges', () => {
    const result = makeValidQueryResult({
      data: { nodes: [], edges: [], customField: 'value', stats: { count: 5 } },
    });
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(true);
  });
});

// ─── isValidQueryResult ──────────────────────────────────────────────────────

describe('isValidQueryResult', () => {
  it('returns true for valid QueryResult', () => {
    expect(isValidQueryResult(makeValidQueryResult())).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidQueryResult(null)).toBe(false);
  });

  it('returns false for raw graph data without status', () => {
    expect(isValidQueryResult({ nodes: [makeNode('a')], edges: [] })).toBe(false);
  });

  it('returns true for QueryResultFactory output', () => {
    const result = QueryResultFactory.create({
      status: 'OK',
      nodes: [makeNode('a')],
      edges: [],
      reasons: ['test'],
    });
    expect(isValidQueryResult(result)).toBe(true);
  });
});

// ─── enforceQueryResultContract ──────────────────────────────────────────────

describe('enforceQueryResultContract', () => {
  it('passes through a valid QueryResult unchanged', () => {
    const result = makeValidQueryResult({ status: 'PARTIAL', warnings: ['test_warning'] });
    const enforced = enforceQueryResultContract(result);
    expect(enforced).toEqual(result);
  });

  it('wraps raw graph data in a QueryResult envelope', () => {
    const rawData = { nodes: [makeNode('a')], edges: [makeEdge('e1', 'a', 'b')] };
    const enforced = enforceQueryResultContract(rawData, { tool: 'test_tool' });
    expect(enforced.status).toBe('OK');
    expect(enforced.data.nodes).toEqual([]);
    expect(enforced.reasoning.selected_paths).toEqual([]);
    expect(enforced.confidence.level).toBeDefined();
    expect(enforced.provenance.sources).toBeDefined();
    expect(Array.isArray(enforced.warnings)).toBe(true);
    expect(Array.isArray(enforced.codes)).toBe(true);
  });

  it('wraps a primitive value in a QueryResult envelope', () => {
    const enforced = enforceQueryResultContract('hello');
    expect(enforced.status).toBe('OK');
    expect(enforced.data.value).toBe('hello');
    expect(enforced.data.nodes).toEqual([]);
    expect(enforced.data.edges).toEqual([]);
    expect(enforced.warnings).toContain('QUERY_RESULT_CONTRACT_ENFORCED');
    expect(enforced.codes).toContain('QUERY_RESULT_CONTRACT_ENFORCED');
  });

  it('wraps null in a QueryResult envelope', () => {
    const enforced = enforceQueryResultContract(null);
    expect(enforced.status).toBe('OK');
    expect(enforced.data.nodes).toEqual([]);
    expect(enforced.data.edges).toEqual([]);
    expect(enforced.warnings).toContain('QUERY_RESULT_CONTRACT_ENFORCED');
  });

  it('preserves partial QueryResult fields when wrapping', () => {
    const partial = {
      status: 'INSUFFICIENT_EVIDENCE',
      data: { nodes: [], edges: [], customField: 'preserved' },
      warnings: ['existing_warning'],
      // Missing: reasoning, confidence, provenance, codes
    };
    const enforced = enforceQueryResultContract(partial);
    expect(enforced.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(enforced.data.customField).toBe('preserved');
    expect(enforced.warnings).toContain('existing_warning');
    expect(enforced.reasoning.selected_paths).toEqual([]);
    expect(enforced.confidence.level).toBeDefined();
    expect(enforced.provenance.sources).toEqual([]);
    expect(Array.isArray(enforced.codes)).toBe(true);
  });

  it('includes tool context in wrapped results', () => {
    const enforced = enforceQueryResultContract({ someData: true }, { tool: 'my_tool' });
    expect(enforced.reasoning.selection_explanation[0]).toContain('my_tool');
  });

  it('ensures raw graph data is never returned without status and provenance', () => {
    // Simulating what would happen if a tool returned raw graph data
    const rawGraphData = {
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('e1', 'a', 'b')],
    };
    const enforced = enforceQueryResultContract(rawGraphData);
    // Must have status
    expect(typeof enforced.status).toBe('string');
    // Must have provenance
    expect(enforced.provenance).toBeDefined();
    expect(Array.isArray(enforced.provenance.sources)).toBe(true);
    // Must have reasoning
    expect(enforced.reasoning).toBeDefined();
    expect(Array.isArray(enforced.reasoning.selected_paths)).toBe(true);
  });
});

// ─── QueryResultFactory integration ─────────────────────────────────────────

describe('QueryResultFactory produces valid QueryResult', () => {
  it('create() always produces a valid QueryResult', () => {
    const result = QueryResultFactory.create({
      status: 'OK',
      nodes: [makeNode('a')],
      edges: [makeEdge('e1', 'a', 'b')],
      reasons: ['test reason'],
      warnings: ['test warning'],
      codes: ['TEST_CODE'],
    });
    expect(isValidQueryResult(result)).toBe(true);
    const outcome = validateQueryResult(result);
    expect(outcome.valid).toBe(true);
    expect(outcome.issues).toHaveLength(0);
  });

  it('create() with minimal input produces valid QueryResult', () => {
    const result = QueryResultFactory.create({ status: 'INSUFFICIENT_EVIDENCE' });
    expect(isValidQueryResult(result)).toBe(true);
  });

  it('withMetadata preserves QueryResult validity', () => {
    const base = QueryResultFactory.create({ status: 'OK', reasons: ['base'] });
    const withMeta = QueryResultFactory.withMetadata(base, { extra: 'data' });
    expect(isValidQueryResult(withMeta)).toBe(true);
  });
});

// ─── Contract enforcement for specific surfaces ──────────────────────────────

describe('Contract enforcement for MCP tool results', () => {
  it('okResult produces valid QueryResult', async () => {
    const { okResult } = await import('../../../mcp/tools/results.js');
    const result = okResult({ test: true }, ['reason']);
    expect(isValidQueryResult(result)).toBe(true);
  });

  it('insufficientEvidence produces valid QueryResult', async () => {
    const { insufficientEvidence } = await import('../../../mcp/tools/results.js');
    const result = insufficientEvidence({ test: true }, ['reason'], ['CODE']);
    expect(isValidQueryResult(result)).toBe(true);
  });

  it('toolError produces valid QueryResult', async () => {
    const { toolError } = await import('../../../mcp/tools/results.js');
    const result = toolError('something went wrong');
    expect(isValidQueryResult(result)).toBe(true);
  });

  it('toolResult produces valid QueryResult for all status values', async () => {
    const { toolResult } = await import('../../../mcp/tools/results.js');
    const statuses = ['OK', 'AMBIGUOUS', 'INSUFFICIENT_EVIDENCE', 'EXPLORATORY_ONLY', 'PARTIAL', 'POLICY_VIOLATION', 'UNSUPPORTED_QUERY'] as const;
    for (const status of statuses) {
      const result = toolResult(status, { test: true }, ['reason']);
      expect(isValidQueryResult(result)).toBe(true);
    }
  });

  it('ensureQueryResult wraps non-conforming values', async () => {
    const { ensureQueryResult } = await import('../../../mcp/tools/results.js');
    const raw = { someField: 'value' };
    const result = ensureQueryResult(raw);
    expect(isValidQueryResult(result)).toBe(true);
  });

  it('ensureQueryResult passes through valid QueryResult', async () => {
    const { ensureQueryResult } = await import('../../../mcp/tools/results.js');
    const valid = makeValidQueryResult({ status: 'PARTIAL' });
    const result = ensureQueryResult(valid);
    expect(result).toEqual(valid);
  });
});
