# Design

## Domain Model

No new node/edge types.

New search path in `src/core/graph/search/`:

```
src/core/graph/search/
  HybridSearchEngine.ts   — orchestrates FTS + semantic fusion
  EmbeddingIndex.ts       — loads embeddings from DB, computes cosine similarity
  SearchFusion.ts         — merges and re-ranks FTS and semantic results
```

Config additions:

```yaml
search:
  semantic: false          # enable vector search (requires embedding provider in ai block)
  semantic_weight: 0.5     # 0 = FTS only, 1 = semantic only, 0.5 = equal blend
  top_k: 25                # candidates per search path before fusion
```

`HybridSearchResult`:

```typescript
interface HybridSearchResult {
  node: GraphNode;
  ftsScore?: number;        // normalized BM25 rank (0–1)
  semanticScore?: number;   // cosine similarity (0–1)
  fusedScore: number;       // weighted blend
}
```

## Application Flow

### Query path with semantic enabled

1. `HybridSearchEngine.search(query, workspaceId, options)`:
   a. **FTS path**: call existing `db.searchNodesFTS(workspaceId, query, topK)`.
   b. **Semantic path** (when `options.semantic` and embeddings exist):
      - Call embedding provider API to embed the query string (reuse existing
        `enrichFacts` embedding client).
      - Load all node embeddings for workspace from `embeddings` table via `EmbeddingIndex`.
      - Compute cosine similarity for all stored embeddings.
      - Return top-K by similarity.
   c. **Fusion**: `SearchFusion.merge(ftsResults, semanticResults, semanticWeight)`.
      - Deduplicate by `node.id`.
      - Compute `fusedScore = (1 - w) * ftsScore + w * semanticScore`.
      - Sort descending by `fusedScore`.
2. Return fused `HybridSearchResult[]`.

### FTS-only path (existing behavior preserved)

When `semantic: false` or no embeddings exist, `HybridSearchEngine` delegates directly
to the existing FTS path with no overhead.

## Interface Contract

`TrustedQueryService.engine(workspaceId).searchNodes()` currently returns FTS results.
Change its signature (or add overload) to accept an optional `{ semantic?: boolean }`
options bag and delegate to `HybridSearchEngine`.

MCP tool `search_nodes` gains an optional `semantic` boolean parameter.

CLI: `crg search <query> [--semantic] [--weight <float>] [--workspace <id>]`

## Data Model

`embeddings` table is already present in the schema (populated by stage 06). Schema:

```sql
CREATE TABLE embeddings (
  node_id TEXT PRIMARY KEY,
  workspace_id TEXT,
  embedding BLOB,     -- Float32Array serialized as binary
  model TEXT,
  created_at TEXT
);
```

`EmbeddingIndex` loads all rows for a workspace into memory at query time (acceptable for
typical graph sizes of <10K nodes).

## UI / Platform Impact

VS Code extension blast radius panel can surface semantic search results in a future story.
No change for this story.

## Observability

Search result includes `semanticScore` per node when semantic path was used.
Warning emitted when semantic requested but no embeddings exist for workspace.

## Alternatives Considered

1. **SQLite vec extension** — provides native vector search. Rejected for now: requires
   a native extension that is not bundled with `better-sqlite3`. Pure-JS cosine similarity
   is sufficient for <10K nodes.

2. **Always run both paths** — rejected. Embedding API latency adds 200–500ms per query.
   Opt-in with `--semantic` flag keeps the default latency unchanged.
