# Validation

## Proof Strategy

Run FTS and semantic search for the same query; confirm semantic returns at least one node
not in FTS results. Confirm FTS-only path is unaffected (no latency change, same results).

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `cosineSimilarity([1,0], [1,0])` = 1.0; `cosineSimilarity([1,0], [0,1])` = 0.0 |
| Unit | `EmbeddingIndex.search()` returns top-K by cosine similarity from stored vectors |
| Unit | `fuseResults()` with weight=0 → ranks purely by FTS score |
| Unit | `fuseResults()` with weight=1 → ranks purely by semantic score |
| Unit | `fuseResults()` deduplicates nodes that appear in both FTS and semantic results |
| Unit | `HybridSearchEngine` with no embeddings loaded → returns FTS results + warning |
| Integration | `crg search "payment" --semantic` returns non-empty results when embeddings exist |
| Integration | `crg search "payment"` (no flag) → same results as before this story (regression) |
| E2E | Semantic result set differs from FTS result set (confirms semantic path is active) |
| Platform | `npm run typecheck` zero errors |

## Fixtures

```typescript
// Mock DB that returns pre-computed embedding rows
const mockEmbedding = new Float32Array([0.1, 0.9, 0.3]);
const mockRow = { node_id: 'node-abc', workspace_id: 'ws', embedding: Buffer.from(mockEmbedding.buffer) };
```

## Commands

```bash
npm run typecheck
npm test
crg search "payment" --workspace b2g
crg search "payment" --semantic --workspace b2g
```

## Acceptance Evidence

Pending implementation:

- All 6 unit cases pass
- Integration: semantic result count > 0 when embeddings exist
- Regression: FTS-only search returns identical results before and after this story
- E2E: at least one semantic-only result (not in FTS top-25) visible with `--semantic`
