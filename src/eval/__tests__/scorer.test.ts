import { describe, it, expect } from 'vitest';
import { scoreCase } from '../scorer.js';
import type { EvalCase } from '../types.js';
import type { QueryResult, GraphNode } from '../../core/types.js';
import { DecisionStatus } from '../../core/errors.js';

/**
 * Helper to create a minimal QueryResult with the given nodes.
 */
function makeQueryResult(nodes: Partial<GraphNode>[]): QueryResult {
  return {
    status: DecisionStatus.OK,
    reasoning: {
      selected_paths: [],
      rejected_paths: [],
      selection_explanation: [],
    },
    data: {
      nodes: nodes.map((n, i) => ({
        id: n.id ?? `node-${i}`,
        stableKey: n.stableKey ?? null,
        workspace: n.workspace ?? 'test-ws',
        project: n.project ?? 'test-project',
        type: n.type ?? 'unknown',
        label: n.label ?? `Node${i}`,
        graph_kind: n.graph_kind ?? 'canonical',
        confidence_band: n.confidence_band ?? 'AUTHORITATIVE',
        provenance: n.provenance ?? { source: 'test', extractedBy: 'test' },
        ...n,
      })) as GraphNode[],
      edges: [],
    },
    confidence: { level: 'HIGH', reasons: [] },
    provenance: { sources: [] },
    warnings: [],
    codes: [],
  };
}

/**
 * Helper to create a minimal EvalCase with the given expect predicates.
 */
function makeEvalCase(expect: EvalCase['expect']): EvalCase {
  return {
    id: 'test-case',
    description: 'Test case',
    queryType: 'what-is-symbol',
    query: 'TestQuery',
    expect,
  };
}

describe('scoreCase', () => {
  describe('notEmpty predicate', () => {
    it('passes when notEmpty is true and result has nodes', () => {
      const evalCase = makeEvalCase({ notEmpty: true });
      const result = makeQueryResult([{ label: 'A', type: 'service' }]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
      expect(scored.actualNodeCount).toBe(1);
    });

    it('fails when notEmpty is true and result is empty', () => {
      const evalCase = makeEvalCase({ notEmpty: true });
      const result = makeQueryResult([]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('fail');
      expect(scored.actualNodeCount).toBe(0);
    });

    it('passes when notEmpty is not set and result is empty', () => {
      const evalCase = makeEvalCase({});
      const result = makeQueryResult([]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
    });
  });

  describe('minNodeCount predicate', () => {
    it('passes when node count meets minimum', () => {
      const evalCase = makeEvalCase({ minNodeCount: 3 });
      const result = makeQueryResult([
        { label: 'A', type: 'service' },
        { label: 'B', type: 'controller' },
        { label: 'C', type: 'helper' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
      expect(scored.actualNodeCount).toBe(3);
    });

    it('passes when node count exceeds minimum', () => {
      const evalCase = makeEvalCase({ minNodeCount: 2 });
      const result = makeQueryResult([
        { label: 'A', type: 'service' },
        { label: 'B', type: 'controller' },
        { label: 'C', type: 'helper' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
      expect(scored.actualNodeCount).toBe(3);
    });

    it('fails when node count is below minimum', () => {
      const evalCase = makeEvalCase({ minNodeCount: 3 });
      const result = makeQueryResult([
        { label: 'A', type: 'service' },
        { label: 'B', type: 'controller' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('fail');
      expect(scored.actualNodeCount).toBe(2);
    });
  });

  describe('nodeLabels predicate', () => {
    it('passes when all expected labels are present', () => {
      const evalCase = makeEvalCase({ nodeLabels: ['OrdersController', 'PaymentService'] });
      const result = makeQueryResult([
        { label: 'OrdersController', type: 'controller' },
        { label: 'PaymentService', type: 'service' },
        { label: 'HelperUtil', type: 'helper' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
      expect(scored.matchedLabels).toEqual(['OrdersController', 'PaymentService']);
      expect(scored.missingLabels).toEqual([]);
    });

    it('fails when some expected labels are missing', () => {
      const evalCase = makeEvalCase({ nodeLabels: ['OrdersController', 'MissingService'] });
      const result = makeQueryResult([
        { label: 'OrdersController', type: 'controller' },
        { label: 'PaymentService', type: 'service' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('fail');
      expect(scored.matchedLabels).toEqual(['OrdersController']);
      expect(scored.missingLabels).toEqual(['MissingService']);
    });

    it('fails when all expected labels are missing', () => {
      const evalCase = makeEvalCase({ nodeLabels: ['X', 'Y'] });
      const result = makeQueryResult([{ label: 'A', type: 'service' }]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('fail');
      expect(scored.matchedLabels).toEqual([]);
      expect(scored.missingLabels).toEqual(['X', 'Y']);
    });

    it('passes with empty nodeLabels array', () => {
      const evalCase = makeEvalCase({ nodeLabels: [] });
      const result = makeQueryResult([{ label: 'A', type: 'service' }]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
      expect(scored.matchedLabels).toEqual([]);
      expect(scored.missingLabels).toEqual([]);
    });
  });

  describe('nodeKinds predicate', () => {
    it('passes when all expected kinds are present', () => {
      const evalCase = makeEvalCase({ nodeKinds: ['service', 'controller'] });
      const result = makeQueryResult([
        { label: 'A', type: 'service' },
        { label: 'B', type: 'controller' },
        { label: 'C', type: 'helper' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
    });

    it('fails when some expected kinds are missing', () => {
      const evalCase = makeEvalCase({ nodeKinds: ['service', 'repository'] });
      const result = makeQueryResult([
        { label: 'A', type: 'service' },
        { label: 'B', type: 'controller' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('fail');
    });

    it('passes when nodeKinds is not specified', () => {
      const evalCase = makeEvalCase({});
      const result = makeQueryResult([{ label: 'A', type: 'service' }]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
    });
  });

  describe('combined predicates', () => {
    it('passes when all predicates are satisfied', () => {
      const evalCase = makeEvalCase({
        notEmpty: true,
        minNodeCount: 2,
        nodeLabels: ['OrdersController'],
        nodeKinds: ['service'],
      });
      const result = makeQueryResult([
        { label: 'OrdersController', type: 'controller' },
        { label: 'PaymentService', type: 'service' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('pass');
      expect(scored.actualNodeCount).toBe(2);
      expect(scored.matchedLabels).toEqual(['OrdersController']);
      expect(scored.missingLabels).toEqual([]);
    });

    it('fails when any single predicate fails', () => {
      const evalCase = makeEvalCase({
        notEmpty: true,
        minNodeCount: 5, // This will fail — only 2 nodes
        nodeLabels: ['OrdersController'],
      });
      const result = makeQueryResult([
        { label: 'OrdersController', type: 'controller' },
        { label: 'PaymentService', type: 'service' },
      ]);

      const scored = scoreCase(evalCase, result);

      expect(scored.status).toBe('fail');
      expect(scored.actualNodeCount).toBe(2);
      // Labels still matched even though minNodeCount failed
      expect(scored.matchedLabels).toEqual(['OrdersController']);
    });
  });

  describe('result shape', () => {
    it('preserves original EvalCase fields in the result', () => {
      const evalCase: EvalCase = {
        id: 'case-42',
        description: 'Find the service',
        queryType: 'what-is-symbol',
        query: 'MyService',
        mode: 'authoritative',
        expect: { notEmpty: true },
      };
      const result = makeQueryResult([{ label: 'MyService', type: 'service' }]);

      const scored = scoreCase(evalCase, result);

      expect(scored.id).toBe('case-42');
      expect(scored.description).toBe('Find the service');
      expect(scored.queryType).toBe('what-is-symbol');
      expect(scored.query).toBe('MyService');
      expect(scored.mode).toBe('authoritative');
      expect(scored.expect).toEqual({ notEmpty: true });
    });

    it('sets durationMs to 0 (runner sets actual duration)', () => {
      const evalCase = makeEvalCase({ notEmpty: true });
      const result = makeQueryResult([{ label: 'A', type: 'service' }]);

      const scored = scoreCase(evalCase, result);

      expect(scored.durationMs).toBe(0);
    });
  });
});
