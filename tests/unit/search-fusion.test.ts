import { describe, it, expect } from 'vitest';
import { fuseResults } from '../../src/core/graph/search/SearchFusion.js';
import type { GraphNode } from '../../src/core/types.js';

/**
 * Unit tests for SearchFusion fuseResults.
 *
 * Validates: Requirements 6.2, 6.7
 */

function makeNode(id: string): GraphNode {
  return {
    id,
    stableKey: `stable-${id}`,
    workspace: 'ws-1',
    project: 'proj-1',
    type: 'function',
    label: `Label ${id}`,
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

describe('fuseResults', () => {
  it('returns empty array when both inputs are empty', () => {
    const result = fuseResults([], [], new Map(), 0.5);
    expect(result).toEqual([]);
  });

  it('with weight=0, ranks by FTS score only', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');
    const nodeC = makeNode('c');

    const allNodes = new Map([['a', nodeA], ['b', nodeB], ['c', nodeC]]);

    const result = fuseResults(
      [nodeA, nodeB, nodeC], // FTS order: a=1.0, b=0.5, c=0.333
      [{ nodeId: 'c', score: 0.99 }], // semantic: c has high score
      allNodes,
      0, // weight=0 means FTS only
    );

    // With weight=0, fusedScore = ftsScore regardless of semantic
    expect(result[0]!.node.id).toBe('a');
    expect(result[1]!.node.id).toBe('b');
    expect(result[2]!.node.id).toBe('c');
  });

  it('with weight=1, ranks by semantic score only', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');
    const nodeC = makeNode('c');

    const allNodes = new Map([['a', nodeA], ['b', nodeB], ['c', nodeC]]);

    const result = fuseResults(
      [nodeA, nodeB, nodeC], // FTS order: a first
      [
        { nodeId: 'c', score: 0.95 },
        { nodeId: 'b', score: 0.80 },
        { nodeId: 'a', score: 0.10 },
      ],
      allNodes,
      1, // weight=1 means semantic only
    );

    // With weight=1, fusedScore = semanticScore
    expect(result[0]!.node.id).toBe('c');
    expect(result[1]!.node.id).toBe('b');
    expect(result[2]!.node.id).toBe('a');
  });

  it('deduplicates nodes appearing in both FTS and semantic results', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');

    const allNodes = new Map([['a', nodeA], ['b', nodeB]]);

    const result = fuseResults(
      [nodeA, nodeB],
      [{ nodeId: 'a', score: 0.9 }, { nodeId: 'b', score: 0.5 }],
      allNodes,
      0.5,
    );

    // Should have exactly 2 results, not 4
    expect(result).toHaveLength(2);
    const ids = result.map(r => r.node.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('assigns ftsScore=0 for nodes only in semantic results', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');

    const allNodes = new Map([['a', nodeA], ['b', nodeB]]);

    const result = fuseResults(
      [nodeA], // Only nodeA in FTS
      [{ nodeId: 'b', score: 0.8 }], // Only nodeB in semantic
      allNodes,
      0.5,
    );

    const nodeAResult = result.find(r => r.node.id === 'a')!;
    const nodeBResult = result.find(r => r.node.id === 'b')!;

    // nodeA: ftsScore=1.0, semanticScore=0 → fused = 0.5*1.0 + 0.5*0 = 0.5
    expect(nodeAResult.fusedScore).toBeCloseTo(0.5, 5);
    // nodeB: ftsScore=0, semanticScore=0.8 → fused = 0.5*0 + 0.5*0.8 = 0.4
    expect(nodeBResult.fusedScore).toBeCloseTo(0.4, 5);
  });

  it('assigns semanticScore=0 for nodes only in FTS results', () => {
    const nodeA = makeNode('a');

    const allNodes = new Map([['a', nodeA]]);

    const result = fuseResults(
      [nodeA],
      [], // No semantic results
      allNodes,
      0.5,
    );

    expect(result).toHaveLength(1);
    // ftsScore=1.0, semanticScore=0 → fused = 0.5*1.0 + 0.5*0 = 0.5
    expect(result[0]!.fusedScore).toBeCloseTo(0.5, 5);
    expect(result[0]!.semanticScore).toBeUndefined();
  });

  it('computes fused score using formula (1-weight)*fts + weight*semantic', () => {
    const nodeA = makeNode('a');

    const allNodes = new Map([['a', nodeA]]);
    const weight = 0.3;

    const result = fuseResults(
      [nodeA], // ftsScore = 1/(0+1) = 1.0
      [{ nodeId: 'a', score: 0.6 }],
      allNodes,
      weight,
    );

    // (1-0.3)*1.0 + 0.3*0.6 = 0.7 + 0.18 = 0.88
    expect(result[0]!.fusedScore).toBeCloseTo(0.88, 5);
  });

  it('assigns rank-based FTS scores: 1/(rank+1)', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c'), makeNode('d')];
    const allNodes = new Map(nodes.map(n => [n.id, n]));

    const result = fuseResults(nodes, [], allNodes, 0);

    // weight=0 so fusedScore = ftsScore
    expect(result[0]!.fusedScore).toBeCloseTo(1.0, 5);     // 1/(0+1)
    expect(result[1]!.fusedScore).toBeCloseTo(0.5, 5);     // 1/(1+1)
    expect(result[2]!.fusedScore).toBeCloseTo(1 / 3, 5);   // 1/(2+1)
    expect(result[3]!.fusedScore).toBeCloseTo(0.25, 5);    // 1/(3+1)
  });

  it('sorts results descending by fusedScore', () => {
    const nodeA = makeNode('a');
    const nodeB = makeNode('b');
    const nodeC = makeNode('c');

    const allNodes = new Map([['a', nodeA], ['b', nodeB], ['c', nodeC]]);

    const result = fuseResults(
      [nodeC, nodeB, nodeA], // FTS: c=1.0, b=0.5, a=0.333
      [
        { nodeId: 'a', score: 0.99 },
        { nodeId: 'b', score: 0.5 },
        { nodeId: 'c', score: 0.1 },
      ],
      allNodes,
      0.5,
    );

    // Verify descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]!.fusedScore).toBeGreaterThanOrEqual(result[i + 1]!.fusedScore);
    }
  });

  it('ignores semantic hits whose nodeId is not in allNodesById', () => {
    const nodeA = makeNode('a');
    const allNodes = new Map([['a', nodeA]]);

    const result = fuseResults(
      [nodeA],
      [
        { nodeId: 'a', score: 0.5 },
        { nodeId: 'unknown-node', score: 0.99 }, // Not in allNodesById
      ],
      allNodes,
      0.5,
    );

    // Only nodeA should appear — unknown-node is skipped
    expect(result).toHaveLength(1);
    expect(result[0]!.node.id).toBe('a');
  });
});
