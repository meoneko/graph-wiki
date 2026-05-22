import type { GraphDB } from '../../../storage/GraphDB.js';

/**
 * Compute cosine similarity between two non-zero vectors.
 *
 * Returns a value in [-1, 1]. For identical vectors, returns 1.0 (within floating point tolerance).
 * Returns 0 for zero-length vectors or mismatched dimensions.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface EmbeddingEntry {
  nodeId: string;
  vector: Float32Array;
}

/**
 * In-memory embedding index for fast cosine similarity search.
 *
 * Loads all embeddings for a workspace from the database into memory,
 * then provides O(n) brute-force cosine similarity search over the loaded vectors.
 */
export class EmbeddingIndex {
  private entries: EmbeddingEntry[] = [];

  /**
   * Load all embedding rows for the given workspace into memory.
   * Replaces any previously loaded data.
   */
  load(db: GraphDB, workspaceId: string): void {
    this.entries = db.getEmbeddingsByWorkspace(workspaceId);
  }

  /**
   * Search the loaded embeddings by cosine similarity to the query vector.
   * Returns the top-K results sorted by descending score.
   */
  search(queryVector: Float32Array, topK: number): Array<{ nodeId: string; score: number }> {
    if (this.entries.length === 0) return [];

    const scored = this.entries.map((entry) => ({
      nodeId: entry.nodeId,
      score: cosineSimilarity(queryVector, entry.vector),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  /**
   * Returns the number of embeddings currently loaded in memory.
   */
  get size(): number {
    return this.entries.length;
  }
}
