import type { GraphNode } from '../../types.js';
import type { GraphDB } from '../../../storage/GraphDB.js';
import { EmbeddingIndex } from './EmbeddingIndex.js';
import { fuseResults, type HybridSearchResult } from './SearchFusion.js';

/**
 * Function type for embedding a text query into a vector.
 * Consumers provide this to enable semantic search.
 */
export type EmbedQueryFn = (text: string) => Promise<Float32Array>;

export interface HybridSearchOptions {
  /** Enable semantic search path. Default: false */
  semantic?: boolean;
  /** Weight for semantic vs FTS fusion. 0 = FTS only, 1 = semantic only. Default: 0.5 */
  weight?: number;
  /** Maximum number of results to return. Default: 25 */
  topK?: number;
}

/**
 * Composes EmbeddingIndex + SearchFusion to provide hybrid FTS/semantic search.
 *
 * When semantic is disabled or no embeddings exist, delegates directly to FTS
 * with zero overhead. When semantic is enabled, embeds the query, runs both
 * FTS and vector search, and fuses results.
 */
export class HybridSearchEngine {
  private readonly embeddingIndex = new EmbeddingIndex();

  constructor(
    private readonly db: GraphDB,
    private readonly embedQuery?: EmbedQueryFn,
  ) {}

  /**
   * Search nodes using FTS, semantic search, or both (hybrid).
   *
   * @param query - The search query string
   * @param workspaceId - Workspace to search within
   * @param options - Search options (semantic, weight, topK)
   * @returns Array of search results with fused scores, plus any warnings
   */
  async search(
    query: string,
    workspaceId: string,
    options?: HybridSearchOptions,
  ): Promise<{ results: HybridSearchResult[]; warnings: string[] }> {
    const semantic = options?.semantic ?? false;
    const weight = options?.weight ?? 0.5;
    const topK = options?.topK ?? 25;
    const warnings: string[] = [];

    // Fast path: no semantic requested — delegate directly to FTS
    if (!semantic) {
      return this.ftsOnly(query, workspaceId, topK, warnings);
    }

    // Semantic requested — check if embeddings exist
    this.embeddingIndex.load(this.db, workspaceId);

    if (this.embeddingIndex.size === 0) {
      warnings.push('Semantic search requested but no embeddings exist for this workspace. Falling back to FTS-only.');
      return this.ftsOnly(query, workspaceId, topK, warnings);
    }

    // Check if we have an embedding function
    if (!this.embedQuery) {
      warnings.push('Semantic search requested but no embedding function configured. Falling back to FTS-only.');
      return this.ftsOnly(query, workspaceId, topK, warnings);
    }

    // Run both paths: FTS + semantic
    const queryVector = await this.embedQuery(query);
    const semanticHits = this.embeddingIndex.search(queryVector, topK);
    const ftsNodes = this.db.searchNodesFTS(query, workspaceId, topK);

    // Build node lookup map for fusion
    const allNodesById = new Map<string, GraphNode>();
    for (const node of ftsNodes) {
      allNodesById.set(node.id, node);
    }
    // Also load nodes referenced by semantic hits that aren't in FTS results
    for (const hit of semanticHits) {
      if (!allNodesById.has(hit.nodeId)) {
        const node = this.db.getNode(hit.nodeId);
        if (node) {
          allNodesById.set(node.id, node);
        }
      }
    }

    // Fuse results
    const results = fuseResults(ftsNodes, semanticHits, allNodesById, weight);

    return { results: results.slice(0, topK), warnings };
  }

  private ftsOnly(
    query: string,
    workspaceId: string,
    topK: number,
    warnings: string[],
  ): { results: HybridSearchResult[]; warnings: string[] } {
    const ftsNodes = this.db.searchNodesFTS(query, workspaceId, topK);
    const results: HybridSearchResult[] = ftsNodes.map((node, i) => ({
      node,
      ftsScore: 1 / (i + 1),
      fusedScore: 1 / (i + 1),
    }));
    return { results, warnings };
  }
}
