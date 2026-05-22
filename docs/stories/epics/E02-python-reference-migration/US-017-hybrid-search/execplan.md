# Exec Plan

## Goal

Add `--semantic` flag to `crg search` and `search_nodes` MCP tool that performs vector
similarity search against stored embeddings and merges results with FTS.

## Scope

In scope:

- `src/core/graph/search/EmbeddingIndex.ts` — load and cosine-similarity rank
- `src/core/graph/search/SearchFusion.ts` — merge FTS + semantic results
- `src/core/graph/search/HybridSearchEngine.ts` — orchestrator
- `TrustedQueryService` / `TrustAwareQueryEngine` — wire `HybridSearchEngine` into search path
- `src/cli/index.ts` — `--semantic` and `--weight` flags for `search`
- `src/mcp/tools/search.ts` (or equivalent) — add `semantic` parameter
- `knowledge.config.yaml.example` — add `search` config block

Out of scope:

- Real-time embedding updates
- SQLite vec extension
- Cross-workspace semantic search

## Risk Classification

Risk flags:

- **High**: embedding API adds external network latency and cost to queries. Must only
  trigger when `--semantic` is explicitly requested.
- **Medium**: embedding table may be empty (enrich stage skipped). Must degrade gracefully
  to FTS-only with a warning.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- Without `--semantic`, query latency must be unchanged (no embedding index loaded)

## Work Phases

### Phase 1 — EmbeddingIndex

1. `src/core/graph/search/EmbeddingIndex.ts`:

```typescript
export class EmbeddingIndex {
  private embeddings: Array<{ nodeId: string; vector: Float32Array }> = [];

  load(db: GraphDB, workspaceId: string): void {
    const rows = db.getEmbeddingsByWorkspace(workspaceId);
    this.embeddings = rows.map(r => ({
      nodeId: r.node_id,
      vector: new Float32Array(r.embedding.buffer),
    }));
  }

  search(queryVector: Float32Array, topK: number): Array<{ nodeId: string; score: number }> {
    return this.embeddings
      .map(e => ({ nodeId: e.nodeId, score: cosineSimilarity(queryVector, e.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! ** 2;
    normB += b[i]! ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}
```

2. Add `getEmbeddingsByWorkspace(workspaceId: string)` to `GraphDB` if not present
   (simple `SELECT * FROM embeddings WHERE workspace_id = ?`).

### Phase 2 — SearchFusion

3. `src/core/graph/search/SearchFusion.ts`:

```typescript
export function fuseResults(
  ftsNodes: GraphNode[],
  semanticHits: Array<{ nodeId: string; score: number }>,
  allNodesById: Map<string, GraphNode>,
  weight: number,
): HybridSearchResult[] {
  const map = new Map<string, HybridSearchResult>();
  ftsNodes.forEach((n, i) => {
    map.set(n.id, { node: n, ftsScore: 1 - i / ftsNodes.length, fusedScore: 0 });
  });
  semanticHits.forEach(h => {
    const node = allNodesById.get(h.nodeId);
    if (!node) return;
    const existing = map.get(h.nodeId);
    if (existing) { existing.semanticScore = h.score; }
    else { map.set(h.nodeId, { node, semanticScore: h.score, fusedScore: 0 }); }
  });
  for (const r of map.values()) {
    r.fusedScore = (1 - weight) * (r.ftsScore ?? 0) + weight * (r.semanticScore ?? 0);
  }
  return [...map.values()].sort((a, b) => b.fusedScore - a.fusedScore);
}
```

### Phase 3 — HybridSearchEngine and wiring

4. `HybridSearchEngine.ts` — composes EmbeddingIndex + SearchFusion.
5. Thread into `TrustAwareQueryEngine.searchNodes()` with an optional `semantic` flag.
6. In `src/cli/index.ts`: add `--semantic` and `--weight` flags to `search` command.
7. In MCP `search_nodes` tool: add optional `semantic: boolean` parameter.

### Phase 4 — Verification

8. `npm run typecheck` — fix any errors.
9. `npm test` — fix any failures.
10. Run `crg search "payment" --workspace b2g` (FTS) then
    `crg search "payment" --semantic --workspace b2g` — confirm semantic adds results
    not in FTS list.

## Stop Conditions

- If embedding table is empty (enrich stage never ran): print warning
  `"Semantic search unavailable: no embeddings found for workspace. Run crg build to generate them."` and fall back to FTS.
