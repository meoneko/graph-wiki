/**
 * Unit tests for StructuredAskEngine.
 *
 * Tests:
 * - Query type → operation type mapping for all 7 types
 * - INSUFFICIENT_EVIDENCE when no canonical/derived path answers the query
 * - EXPLORATORY_ONLY when only exploratory evidence exists
 * - Reasoning paths included in every response
 * - CallerID 'structured-ask' registration in OperationResolver
 * - Explicit operation override
 * - Default mode behavior
 *
 * @see Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StructuredAskEngine, StructuredQueryType } from './StructuredAskEngine.js';
import type { StructuredQuery } from './StructuredAskEngine.js';
import type { QueryResult, GraphNode, GraphEdge, OperationType, QueryMode } from '../types.js';
import { DecisionStatus } from '../errors.js';
import { QueryResultFactory } from '../graph/query/QueryResultFactory.js';
import { OperationResolver } from '../graph/query/OperationResolver.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: 'node:test-1',
    stableKey: 'stable:test-1',
    workspace: 'test-ws',
    project: 'test-project',
    type: 'function',
    label: 'testFunction',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test.ts',
      producer_stage: 'extract',
      timestamp: '2024-01-01T00:00:00Z',
    },
    trust_level: 'AUTHORITATIVE',
    ...overrides,
  };
}

function makeEdge(overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    id: 'edge:test-1',
    stableKey: 'stable:edge-1',
    workspace: 'test-ws',
    from_id: 'node:a',
    to_id: 'node:b',
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test.ts',
      producer_stage: 'extract',
      timestamp: '2024-01-01T00:00:00Z',
    },
    trust_level: 'AUTHORITATIVE',
    ...overrides,
  };
}

function makeOkResult(nodes: GraphNode[] = [makeNode()], edges: GraphEdge[] = []): QueryResult {
  return QueryResultFactory.create({
    status: 'OK',
    nodes,
    edges,
    reasons: ['test result'],
    warnings: [],
    codes: [],
  });
}

function makeEmptyResult(): QueryResult {
  return QueryResultFactory.create({
    status: 'INSUFFICIENT_EVIDENCE',
    nodes: [],
    edges: [],
    reasons: ['NO_EVIDENCE_FOUND'],
    warnings: ['NO_MATCH'],
    codes: ['NO_MATCH'],
  });
}

function makeExploratoryResult(): QueryResult {
  const exploratoryNode = makeNode({
    id: 'node:exploratory-1',
    graph_kind: 'exploratory',
    confidence_band: 'INFERRED',
    trust_level: 'EXPLORATORY',
  });
  return QueryResultFactory.create({
    status: 'OK',
    nodes: [exploratoryNode],
    edges: [],
    reasons: ['exploratory match'],
    warnings: ['EXPLORATORY_USED'],
    codes: ['EXPLORATORY_USED'],
  });
}

// ─── Mock Engine Factory ─────────────────────────────────────────────────────

function createMockEngine() {
  return {
    searchNodes: vi.fn<(query: string, op: OperationType, mode: QueryMode, limit?: number) => Promise<QueryResult>>(),
    analyzeImpact: vi.fn<(nodeId: string, op: OperationType, mode: QueryMode, depth?: number) => Promise<QueryResult>>(),
    findCallers: vi.fn<(symbol: string, op: OperationType, mode: QueryMode) => Promise<QueryResult>>(),
    getNode: vi.fn<(nodeId: string, op: OperationType, mode: QueryMode) => Promise<QueryResult>>(),
    findReasoningPaths: vi.fn<(from: string, to: string, op: OperationType, mode: QueryMode) => Promise<QueryResult>>(),
    getVisibleGraph: vi.fn(),
    getBlastRadiusIds: vi.fn(),
    getRiskScore: vi.fn(),
    getGraphStats: vi.fn(),
    findHubs: vi.fn(),
    findBridges: vi.fn(),
    findKnowledgeGaps: vi.fn(),
    findDeadCode: vi.fn(),
    renamePreview: vi.fn(),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('StructuredAskEngine', () => {
  let mockEngine: ReturnType<typeof createMockEngine>;
  let askEngine: StructuredAskEngine;

  beforeEach(() => {
    mockEngine = createMockEngine();
    askEngine = new StructuredAskEngine(() => mockEngine as any);
  });

  describe('StructuredQueryType enum', () => {
    it('defines all 7 query types', () => {
      expect(StructuredQueryType.WHAT_IS_SYMBOL).toBe('what-is-symbol');
      expect(StructuredQueryType.WHAT_DEPENDS_ON).toBe('what-depends-on');
      expect(StructuredQueryType.WHAT_ROUTE_CALLS).toBe('what-route-calls');
      expect(StructuredQueryType.LINEAGE).toBe('lineage');
      expect(StructuredQueryType.IMPACT).toBe('impact');
      expect(StructuredQueryType.WHY_CANONICAL).toBe('why-canonical');
      expect(StructuredQueryType.WHY_INSUFFICIENT_CONTEXT).toBe('why-insufficient-context');
    });
  });

  describe('query type → operation type mapping', () => {
    it('maps what-is-symbol → ask', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'MyClass', workspace: 'test-ws', queryType: 'what-is-symbol' });
      expect(mockEngine.searchNodes).toHaveBeenCalledWith('MyClass', 'ask', 'authoritative');
    });

    it('maps what-depends-on → impact', async () => {
      mockEngine.analyzeImpact.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'node:1', workspace: 'test-ws', queryType: 'what-depends-on' });
      expect(mockEngine.analyzeImpact).toHaveBeenCalledWith('node:1', 'impact', 'authoritative');
    });

    it('maps what-route-calls → lineage', async () => {
      mockEngine.findCallers.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'handleOrder', workspace: 'test-ws', queryType: 'what-route-calls' });
      expect(mockEngine.findCallers).toHaveBeenCalledWith('handleOrder', 'lineage', 'authoritative');
    });

    it('maps lineage → lineage', async () => {
      mockEngine.findCallers.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'processPayment', workspace: 'test-ws', queryType: 'lineage' });
      expect(mockEngine.findCallers).toHaveBeenCalledWith('processPayment', 'lineage', 'authoritative');
    });

    it('maps impact → impact', async () => {
      mockEngine.analyzeImpact.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'node:2', workspace: 'test-ws', queryType: 'impact' });
      expect(mockEngine.analyzeImpact).toHaveBeenCalledWith('node:2', 'impact', 'authoritative');
    });

    it('maps why-canonical → governance', async () => {
      mockEngine.getNode.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'node:3', workspace: 'test-ws', queryType: 'why-canonical' });
      expect(mockEngine.getNode).toHaveBeenCalledWith('node:3', 'governance', 'authoritative');
    });

    it('maps why-insufficient-context → governance', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());
      await askEngine.ask({ question: 'missingSymbol', workspace: 'test-ws', queryType: 'why-insufficient-context' });
      expect(mockEngine.searchNodes).toHaveBeenCalledWith('missingSymbol', 'governance', 'authoritative');
    });
  });

  describe('INSUFFICIENT_EVIDENCE behavior (Req 11.2)', () => {
    it('returns INSUFFICIENT_EVIDENCE when engine returns OK with no data', async () => {
      // Engine returns OK but with empty nodes/edges
      const emptyOk = QueryResultFactory.create({
        status: 'OK',
        nodes: [],
        edges: [],
        reasons: ['no match'],
        warnings: [],
        codes: [],
      });
      mockEngine.searchNodes.mockResolvedValue(emptyOk);

      const result = await askEngine.ask({
        question: 'nonexistent',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
      expect(result.codes).toContain('GRAPH_QUERY_INSUFFICIENT_CONTEXT');
      expect(result.warnings).toContain('NO_EVIDENCE_FOUND');
    });

    it('preserves INSUFFICIENT_EVIDENCE from engine directly', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeEmptyResult());

      const result = await askEngine.ask({
        question: 'missing',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      // Engine already returned INSUFFICIENT_EVIDENCE, should be preserved
      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
    });
  });

  describe('EXPLORATORY_ONLY behavior (Req 11.3)', () => {
    it('returns EXPLORATORY_ONLY when only exploratory evidence exists', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeExploratoryResult());

      const result = await askEngine.ask({
        question: 'heuristicSymbol',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(result.status).toBe(DecisionStatus.EXPLORATORY_ONLY);
      expect(result.warnings).toContain('EXPLORATORY_USED');
      expect(result.codes).toContain('EXPLORATORY_USED');
      expect(result.confidence.level).toBe('LOW');
    });

    it('does not flag EXPLORATORY_ONLY when mixed canonical and exploratory', async () => {
      const mixedResult = QueryResultFactory.create({
        status: 'OK',
        nodes: [makeNode(), makeNode({ id: 'node:exp', graph_kind: 'exploratory', confidence_band: 'INFERRED', trust_level: 'EXPLORATORY' })],
        edges: [],
        reasons: ['mixed result'],
        warnings: [],
        codes: [],
      });
      mockEngine.searchNodes.mockResolvedValue(mixedResult);

      const result = await askEngine.ask({
        question: 'mixedSymbol',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      // Should NOT be EXPLORATORY_ONLY since there's canonical data too
      expect(result.status).not.toBe(DecisionStatus.EXPLORATORY_ONLY);
    });
  });

  describe('reasoning paths in every response (Req 11.4)', () => {
    it('includes selection_explanation in successful response', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      const result = await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(result.reasoning.selection_explanation).toBeDefined();
      expect(result.reasoning.selection_explanation.length).toBeGreaterThan(0);
    });

    it('includes rejected_paths array (even if empty)', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      const result = await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(result.reasoning.rejected_paths).toBeDefined();
      expect(Array.isArray(result.reasoning.rejected_paths)).toBe(true);
    });

    it('includes selected_paths array', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      const result = await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(result.reasoning.selected_paths).toBeDefined();
      expect(Array.isArray(result.reasoning.selected_paths)).toBe(true);
    });
  });

  describe('explicit operation override', () => {
    it('uses explicit operation when provided, ignoring query type mapping', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
        operation: 'governance',
      });

      // what-is-symbol dispatches to searchNodes, but operation should be governance
      expect(mockEngine.searchNodes).toHaveBeenCalledWith('MyClass', 'governance', 'authoritative');
    });
  });

  describe('mode handling', () => {
    it('defaults to authoritative mode when not specified', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(mockEngine.searchNodes).toHaveBeenCalledWith('MyClass', 'ask', 'authoritative');
    });

    it('uses specified mode', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
        mode: 'mixed_safe',
      });

      expect(mockEngine.searchNodes).toHaveBeenCalledWith('MyClass', 'ask', 'mixed_safe');
    });
  });

  describe('no query type specified', () => {
    it('falls back to general search when no query type is provided', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      await askEngine.ask({
        question: 'something',
        workspace: 'test-ws',
      });

      // Should use OperationResolver fallback (structured-ask → ask)
      expect(mockEngine.searchNodes).toHaveBeenCalledWith('something', 'ask', 'authoritative');
    });
  });

  describe('metadata in response', () => {
    it('includes queryType, operation, and mode in metadata', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());

      const result = await askEngine.ask({
        question: 'MyClass',
        workspace: 'test-ws',
        queryType: 'what-is-symbol',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.queryType).toBe('what-is-symbol');
      expect(result.metadata!.operation).toBe('ask');
      expect(result.metadata!.mode).toBe('authoritative');
    });
  });

  describe('CallerID registration', () => {
    it('structured-ask is registered in OperationResolver', () => {
      const operation = OperationResolver.resolve({
        caller: 'structured-ask',
        requested: null,
      });
      expect(operation).toBe('ask');
    });

    it('structured-ask respects explicit requested operation', () => {
      const operation = OperationResolver.resolve({
        caller: 'structured-ask',
        requested: 'governance',
      });
      expect(operation).toBe('governance');
    });
  });

  describe('DecisionStatus support (Req 11.5)', () => {
    it('supports OK status', async () => {
      mockEngine.searchNodes.mockResolvedValue(makeOkResult());
      const result = await askEngine.ask({ question: 'x', workspace: 'ws', queryType: 'what-is-symbol' });
      expect(result.status).toBe(DecisionStatus.OK);
    });

    it('supports POLICY_VIOLATION status (passed through from engine)', async () => {
      const policyResult = QueryResultFactory.create({
        status: 'POLICY_VIOLATION',
        reasons: ['WORKSPACE_BOUNDARY_VIOLATION'],
        warnings: ['WORKSPACE_BOUNDARY_VIOLATION'],
        codes: ['POLICY_VIOLATION'],
      });
      mockEngine.searchNodes.mockResolvedValue(policyResult);

      const result = await askEngine.ask({ question: 'x', workspace: 'ws', queryType: 'what-is-symbol' });
      expect(result.status).toBe(DecisionStatus.POLICY_VIOLATION);
    });

    it('supports AMBIGUOUS status (passed through from engine)', async () => {
      const ambiguousResult = QueryResultFactory.create({
        status: 'AMBIGUOUS',
        nodes: [makeNode()],
        edges: [],
        reasons: ['multiple conflicting paths'],
        warnings: [],
        codes: [],
      });
      mockEngine.searchNodes.mockResolvedValue(ambiguousResult);

      const result = await askEngine.ask({ question: 'x', workspace: 'ws', queryType: 'what-is-symbol' });
      expect(result.status).toBe(DecisionStatus.AMBIGUOUS);
    });
  });
});
