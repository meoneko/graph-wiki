import { describe, it, expect, vi } from 'vitest';
import { HybridSearchEngine, type EmbedQueryFn } from '../../src/core/graph/search/HybridSearchEngine.js';
import type { GraphNode } from '../../src/core/types.js';

/**
 * Unit tests for HybridSearchEngine.
 *
 * Validates: Requirements 6.1, 6.4, 6.5
 */

function makeNode(id: string, label?: string): GraphNode {
  return {
    id,
    stableKey: `stable-${id}`,
    workspace: 'ws-1',
    project: 'proj-1',
    type: 'function',
    label: label ?? `Label ${id}`,
    graph_kind: 'canonical',
    confidence_band: 'EXTRACTED',
    provenance: {
      source: 'parser',
      artifact_source: 'test',
      producer_stage: 'test',
      timestamp: '2025-01-01T00:00:00Z',
    },
  };
}

/**
 * Creates a mock GraphDB with configurable FTS results and embeddings.
 */
function makeMockDb(options: {
  ftsResults?: GraphNode[];
  embeddings?: Array<{ nodeId: string; vector: Float32Array }>;
  nodeMap?: Map<string, GraphNode>;
}) {
  return {
    searchNodesFTS: vi.fn().mockReturnValue(options.ftsResults ?? []),
    getEmbeddingsByWorkspace: vi.fn().mockReturnValue(options.embeddings ?? []),
    getNode: vi.fn((id: string) => options.nodeMap?.get(id)),
  } as any;
}

describe('HybridSearchEngine', () => {
  describe('when semantic is false (default)', () => {
    it('delegates directly to FTS with no overhead', async () => {
      const nodeA = makeNode('a', 'OrderService');
      const nodeB = makeNode('b', 'OrderController');
      const db = makeMockDb({ ftsResults: [nodeA, nodeB] });

      const engine = new HybridSearchEngine(db);
      const { results, warnings } = await engine.search('Order', 'ws-1');

      expect(db.searchNodesFTS).toHaveBeenCalledWith('Order', 'ws-1', 25);
      expect(db.getEmbeddingsByWorkspace).not.toHaveBeenCalled();
      expect(results).toHaveLength(2);
      expect(results[0]!.node.id).toBe('a');
      expect(results[0]!.ftsScore).toBeCloseTo(1.0);
      expect(results[1]!.ftsScore).toBeCloseTo(0.5);
      expect(warnings).toHaveLength(0);
    });

    it('respects topK option for FTS-only path', async () => {
      const db = makeMockDb({ ftsResults: [] });

      const engine = new HybridSearchEngine(db);
      await engine.search('test', 'ws-1', { topK: 10 });

      expect(db.searchNodesFTS).toHaveBeenCalledWith('test', 'ws-1', 10);
    });

    it('returns empty results when FTS finds nothing', async () => {
      const db = makeMockDb({ ftsResults: [] });

      const engine = new HybridSearchEngine(db);
      const { results, warnings } = await engine.search('nonexistent', 'ws-1');

      expect(results).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('when semantic is true but no embeddings exist', () => {
    it('falls back to FTS-only with a warning', async () => {
      const nodeA = makeNode('a');
      const db = makeMockDb({ ftsResults: [nodeA], embeddings: [] });

      const engine = new HybridSearchEngine(db, async () => new Float32Array([1, 0, 0]));
      const { results, warnings } = await engine.search('test', 'ws-1', { semantic: true });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('no embeddings exist');
      expect(results).toHaveLength(1);
      expect(results[0]!.node.id).toBe('a');
    });
  });

  describe('when semantic is true but no embedding function configured', () => {
    it('falls back to FTS-only with a warning', async () => {
      const nodeA = makeNode('a');
      const db = makeMockDb({
        ftsResults: [nodeA],
        embeddings: [{ nodeId: 'a', vector: new Float32Array([1, 0, 0]) }],
      });

      // No embedQuery function provided
      const engine = new HybridSearchEngine(db);
      const { results, warnings } = await engine.search('test', 'ws-1', { semantic: true });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('no embedding function configured');
      expect(results).toHaveLength(1);
    });
  });

  describe('when semantic is true with embeddings and embed function', () => {
    it('runs both FTS and semantic paths, fuses results', async () => {
      const nodeA = makeNode('a', 'OrderService');
      const nodeB = makeNode('b', 'PaymentService');
      const nodeC = makeNode('c', 'ShippingService');

      const embeddings = [
        { nodeId: 'a', vector: new Float32Array([1, 0, 0]) },
        { nodeId: 'b', vector: new Float32Array([0, 1, 0]) },
        { nodeId: 'c', vector: new Float32Array([0.9, 0.1, 0]) },
      ];

      const nodeMap = new Map([['a', nodeA], ['b', nodeB], ['c', nodeC]]);
      const db = makeMockDb({
        ftsResults: [nodeA], // FTS only finds nodeA
        embeddings,
        nodeMap,
      });

      // Query vector is close to nodeA and nodeC
      const embedQuery: EmbedQueryFn = async () => new Float32Array([1, 0, 0]);

      const engine = new HybridSearchEngine(db, embedQuery);
      const { results, warnings } = await engine.search('order', 'ws-1', {
        semantic: true,
        weight: 0.5,
      });

      expect(warnings).toHaveLength(0);
      // Should have results from both FTS and semantic
      expect(results.length).toBeGreaterThan(0);
      // nodeA should be top since it's in both FTS and semantic
      expect(results[0]!.node.id).toBe('a');
    });

    it('uses default weight of 0.5 when not specified', async () => {
      const nodeA = makeNode('a');
      const embeddings = [{ nodeId: 'a', vector: new Float32Array([1, 0]) }];
      const nodeMap = new Map([['a', nodeA]]);
      const db = makeMockDb({ ftsResults: [nodeA], embeddings, nodeMap });

      const embedQuery: EmbedQueryFn = async () => new Float32Array([1, 0]);
      const engine = new HybridSearchEngine(db, embedQuery);
      const { results } = await engine.search('test', 'ws-1', { semantic: true });

      // nodeA: ftsScore=1.0, semanticScore=1.0 (identical vectors)
      // fusedScore = 0.5*1.0 + 0.5*1.0 = 1.0
      expect(results[0]!.fusedScore).toBeCloseTo(1.0, 2);
    });

    it('uses default topK of 25', async () => {
      const db = makeMockDb({ ftsResults: [], embeddings: [] });
      const engine = new HybridSearchEngine(db);
      await engine.search('test', 'ws-1');

      expect(db.searchNodesFTS).toHaveBeenCalledWith('test', 'ws-1', 25);
    });

    it('limits results to topK', async () => {
      // Create many nodes
      const nodes: GraphNode[] = [];
      const embeddings: Array<{ nodeId: string; vector: Float32Array }> = [];
      const nodeMap = new Map<string, GraphNode>();

      for (let i = 0; i < 30; i++) {
        const node = makeNode(`node-${i}`);
        nodes.push(node);
        embeddings.push({ nodeId: `node-${i}`, vector: new Float32Array([Math.random(), Math.random()]) });
        nodeMap.set(`node-${i}`, node);
      }

      const db = makeMockDb({ ftsResults: nodes, embeddings, nodeMap });
      const embedQuery: EmbedQueryFn = async () => new Float32Array([0.5, 0.5]);

      const engine = new HybridSearchEngine(db, embedQuery);
      const { results } = await engine.search('test', 'ws-1', { semantic: true, topK: 5 });

      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('semantic: false has no overhead', () => {
    it('does not load embeddings or call embed function', async () => {
      const db = makeMockDb({ ftsResults: [] });
      const embedQuery = vi.fn();

      const engine = new HybridSearchEngine(db, embedQuery as any);
      await engine.search('test', 'ws-1', { semantic: false });

      expect(db.getEmbeddingsByWorkspace).not.toHaveBeenCalled();
      expect(embedQuery).not.toHaveBeenCalled();
    });
  });

  describe('regression: search without --semantic produces same results as FTS-only', () => {
    it('returns same nodes in same order as direct FTS when semantic is not specified', async () => {
      const nodeA = makeNode('a', 'AuthService');
      const nodeB = makeNode('b', 'AuthController');
      const nodeC = makeNode('c', 'AuthMiddleware');
      const ftsResults = [nodeA, nodeB, nodeC];

      const db = makeMockDb({
        ftsResults,
        embeddings: [
          { nodeId: 'a', vector: new Float32Array([1, 0]) },
          { nodeId: 'b', vector: new Float32Array([0, 1]) },
          { nodeId: 'c', vector: new Float32Array([0.5, 0.5]) },
        ],
      });

      const embedQuery: EmbedQueryFn = async () => new Float32Array([1, 0]);
      const engine = new HybridSearchEngine(db, embedQuery);

      // Search WITHOUT semantic (no --semantic flag)
      const { results, warnings } = await engine.search('Auth', 'ws-1');

      // Should produce same results as FTS-only: same nodes, same order, rank-based scores
      expect(warnings).toHaveLength(0);
      expect(results).toHaveLength(3);
      expect(results[0]!.node.id).toBe('a');
      expect(results[1]!.node.id).toBe('b');
      expect(results[2]!.node.id).toBe('c');
      // FTS rank-based scores: 1/(0+1), 1/(1+1), 1/(2+1)
      expect(results[0]!.ftsScore).toBeCloseTo(1.0);
      expect(results[1]!.ftsScore).toBeCloseTo(0.5);
      expect(results[2]!.ftsScore).toBeCloseTo(1 / 3);
      // No semantic scores should be present
      expect(results[0]!.semanticScore).toBeUndefined();
      expect(results[1]!.semanticScore).toBeUndefined();
      expect(results[2]!.semanticScore).toBeUndefined();
      // Embeddings should NOT have been loaded
      expect(db.getEmbeddingsByWorkspace).not.toHaveBeenCalled();
    });
  });
});
