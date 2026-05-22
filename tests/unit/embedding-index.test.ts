import { describe, it, expect } from 'vitest';
import { cosineSimilarity, EmbeddingIndex } from '../../src/core/graph/search/EmbeddingIndex.js';

/**
 * Unit tests for EmbeddingIndex and cosineSimilarity.
 *
 * Validates: Requirements 6.1
 */

describe('cosineSimilarity', () => {
  it('returns 1.0 for cosineSimilarity([1,0], [1,0])', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.0 for cosineSimilarity([1,0], [0,1])', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([0, 1]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
  });

  it('returns 1.0 for identical vectors', () => {
    const a = new Float32Array([1, 2, 3]);
    expect(cosineSimilarity(a, a)).toBeCloseTo(1.0, 5);
  });

  it('returns 1.0 for parallel vectors (same direction, different magnitude)', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([5, 0, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.0 for orthogonal vectors', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([0, 1]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
  });

  it('returns -1.0 for opposite vectors', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([-1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
  });

  it('returns value in [-1, 1] for arbitrary non-zero vectors', () => {
    const a = new Float32Array([3, -1, 2, 7]);
    const b = new Float32Array([-2, 4, 1, -3]);
    const result = cosineSimilarity(a, b);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('returns 0 for zero-length vectors (empty arrays)', () => {
    const a = new Float32Array([]);
    const b = new Float32Array([]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('returns 0 when one vector is all zeros', () => {
    const a = new Float32Array([0, 0, 0]);
    const b = new Float32Array([1, 2, 3]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('returns 0 for mismatched dimensions', () => {
    const a = new Float32Array([1, 2]);
    const b = new Float32Array([1, 2, 3]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });
});

describe('EmbeddingIndex', () => {
  it('starts with size 0', () => {
    const index = new EmbeddingIndex();
    expect(index.size).toBe(0);
  });

  it('search returns empty array when no embeddings loaded', () => {
    const index = new EmbeddingIndex();
    const query = new Float32Array([1, 0, 0]);
    expect(index.search(query, 5)).toEqual([]);
  });

  it('search returns top-K results sorted by cosine similarity', () => {
    const index = new EmbeddingIndex();

    // Manually set entries via load with a mock db
    const mockDb = {
      getEmbeddingsByWorkspace: () => [
        { nodeId: 'node-a', vector: new Float32Array([1, 0, 0]) },
        { nodeId: 'node-b', vector: new Float32Array([0, 1, 0]) },
        { nodeId: 'node-c', vector: new Float32Array([0.9, 0.1, 0]) },
      ],
    } as any;

    index.load(mockDb, 'ws-1');
    expect(index.size).toBe(3);

    // Query vector is [1, 0, 0] — node-a should be most similar, then node-c, then node-b
    const results = index.search(new Float32Array([1, 0, 0]), 2);
    expect(results).toHaveLength(2);
    expect(results[0]!.nodeId).toBe('node-a');
    expect(results[0]!.score).toBeCloseTo(1.0, 5);
    expect(results[1]!.nodeId).toBe('node-c');
  });

  it('search respects topK limit', () => {
    const index = new EmbeddingIndex();

    const mockDb = {
      getEmbeddingsByWorkspace: () => [
        { nodeId: 'n1', vector: new Float32Array([1, 0]) },
        { nodeId: 'n2', vector: new Float32Array([0, 1]) },
        { nodeId: 'n3', vector: new Float32Array([0.5, 0.5]) },
        { nodeId: 'n4', vector: new Float32Array([0.8, 0.2]) },
      ],
    } as any;

    index.load(mockDb, 'ws-1');
    const results = index.search(new Float32Array([1, 0]), 2);
    expect(results).toHaveLength(2);
  });

  it('search returns all results when topK exceeds entry count', () => {
    const index = new EmbeddingIndex();

    const mockDb = {
      getEmbeddingsByWorkspace: () => [
        { nodeId: 'n1', vector: new Float32Array([1, 0]) },
        { nodeId: 'n2', vector: new Float32Array([0, 1]) },
      ],
    } as any;

    index.load(mockDb, 'ws-1');
    const results = index.search(new Float32Array([1, 0]), 10);
    expect(results).toHaveLength(2);
  });

  it('load replaces previously loaded data', () => {
    const index = new EmbeddingIndex();

    const mockDb1 = {
      getEmbeddingsByWorkspace: () => [
        { nodeId: 'old-1', vector: new Float32Array([1, 0]) },
      ],
    } as any;

    const mockDb2 = {
      getEmbeddingsByWorkspace: () => [
        { nodeId: 'new-1', vector: new Float32Array([0, 1]) },
        { nodeId: 'new-2', vector: new Float32Array([1, 1]) },
      ],
    } as any;

    index.load(mockDb1, 'ws-1');
    expect(index.size).toBe(1);

    index.load(mockDb2, 'ws-2');
    expect(index.size).toBe(2);

    const results = index.search(new Float32Array([0, 1]), 5);
    expect(results[0]!.nodeId).toBe('new-1');
  });
});
