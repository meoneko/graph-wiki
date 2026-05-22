import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cosineSimilarity } from '../../src/core/graph/search/EmbeddingIndex.js';

/**
 * Property 5: Cosine similarity bounds
 *
 * For any two non-zero vectors a and b, `cosineSimilarity(a, b)` SHALL return a value
 * in the range [-1, 1], AND `cosineSimilarity(a, a)` SHALL return 1.0
 * (within floating point tolerance).
 *
 * **Validates: Requirements 6.1**
 */
describe('Property 5: Cosine similarity bounds', () => {
  /**
   * Arbitrary that generates non-zero Float32Array vectors of a given length.
   * Ensures at least one element is non-zero.
   */
  const nonZeroVectorArb = (length: number) =>
    fc.array(fc.float({ noNaN: true, noDefaultInfinity: true, min: -100, max: 100 }), {
      minLength: length,
      maxLength: length,
    }).filter((arr) => arr.some((v) => v !== 0))
      .map((arr) => new Float32Array(arr));

  /**
   * Arbitrary for vector dimension (keep small for performance).
   */
  const dimensionArb = fc.integer({ min: 1, max: 128 });

  it('cosineSimilarity(a, b) is always in [-1, 1] for non-zero vectors', () => {
    fc.assert(
      fc.property(
        dimensionArb.chain((dim) =>
          fc.tuple(nonZeroVectorArb(dim), nonZeroVectorArb(dim)),
        ),
        ([a, b]) => {
          const result = cosineSimilarity(a, b);
          expect(result).toBeGreaterThanOrEqual(-1.0 - 1e-6);
          expect(result).toBeLessThanOrEqual(1.0 + 1e-6);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('cosineSimilarity(a, a) returns 1.0 for any non-zero vector', () => {
    fc.assert(
      fc.property(
        dimensionArb.chain((dim) => nonZeroVectorArb(dim)),
        (a) => {
          const result = cosineSimilarity(a, a);
          expect(result).toBeCloseTo(1.0, 4);
        },
      ),
      { numRuns: 200 },
    );
  });
});
