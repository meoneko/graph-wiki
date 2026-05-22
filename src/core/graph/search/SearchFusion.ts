import type { GraphNode } from '../../types.js';

/**
 * Result of hybrid search fusion combining FTS and semantic scores.
 */
export interface HybridSearchResult {
  node: GraphNode;
  ftsScore?: number;
  semanticScore?: number;
  fusedScore: number;
}

/**
 * Fuse FTS and semantic search results into a single ranked list.
 *
 * FTS results are assigned a rank-based score using 1/(rank+1) where rank is
 * the zero-based position in the input array (first result = 1.0, second = 0.5, etc.).
 *
 * Semantic results carry their own cosine similarity score directly.
 *
 * Deduplication: if a node appears in both result sets, its scores are combined.
 * Nodes only in FTS get semanticScore = 0; nodes only in semantic get ftsScore = 0.
 *
 * Fused score formula: (1 - weight) * ftsScore + weight * semanticScore
 *
 * @param ftsNodes - Nodes from full-text search, ordered by FTS relevance (best first)
 * @param semanticHits - Hits from EmbeddingIndex.search() with cosine similarity scores
 * @param allNodesById - Map of all graph nodes keyed by ID (used to resolve semantic hit node IDs)
 * @param weight - Semantic weight in [0, 1]. 0 = FTS only, 1 = semantic only.
 * @returns Fused results sorted descending by fusedScore
 */
export function fuseResults(
  ftsNodes: GraphNode[],
  semanticHits: Array<{ nodeId: string; score: number }>,
  allNodesById: Map<string, GraphNode>,
  weight: number,
): HybridSearchResult[] {
  const resultMap = new Map<string, { node: GraphNode; ftsScore: number; semanticScore: number }>();

  // Process FTS results — assign rank-based score: 1/(rank+1)
  for (let i = 0; i < ftsNodes.length; i++) {
    const node = ftsNodes[i]!;
    resultMap.set(node.id, {
      node,
      ftsScore: 1 / (i + 1),
      semanticScore: 0,
    });
  }

  // Process semantic results — merge with existing or add new
  for (const hit of semanticHits) {
    const existing = resultMap.get(hit.nodeId);
    if (existing) {
      // Node appears in both — combine scores
      existing.semanticScore = hit.score;
    } else {
      // Node only in semantic results — look up from allNodesById
      const node = allNodesById.get(hit.nodeId);
      if (node) {
        resultMap.set(hit.nodeId, {
          node,
          ftsScore: 0,
          semanticScore: hit.score,
        });
      }
    }
  }

  // Compute fused scores and build result array
  const results: HybridSearchResult[] = [];
  for (const entry of resultMap.values()) {
    const fusedScore = (1 - weight) * entry.ftsScore + weight * entry.semanticScore;
    results.push({
      node: entry.node,
      ftsScore: entry.ftsScore || undefined,
      semanticScore: entry.semanticScore || undefined,
      fusedScore,
    });
  }

  // Sort descending by fusedScore
  results.sort((a, b) => b.fusedScore - a.fusedScore);

  return results;
}
