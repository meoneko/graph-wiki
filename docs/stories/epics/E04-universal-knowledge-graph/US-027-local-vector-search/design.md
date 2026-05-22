# Design

## Embeddings Table Schema

We define the table structure within `GraphDB.ts`:

```sql
CREATE TABLE IF NOT EXISTS embeddings (
  node_id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  vector BLOB NOT NULL, -- Float32Array serialized buffer
  text_chunk TEXT NOT NULL,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embeddings_workspace ON embeddings(workspace);
```

## Hybrid Search Ranking Equation

We merge BM25 (keyword FTS5) score and vector cosine similarity score using Reciprocal Rank Fusion (RRF) or standard linear combination:

$$\text{Score} = w_{\text{fts}} \times \text{BM25} + w_{\text{vector}} \times \text{CosineSimilarity}$$

```mermaid
graph TD
    A[Search Query] --> B[Execute BM25 Keyword Search]
    A --> C[Compute Query Embedding via Local ONNX]
    C --> D[Execute Vector Similarity Query]
    B --> E[Merge & Rank Results]
    D --> E
    E --> F[Apply Trust Boundaries and EdgePolicies]
    F --> G[Return Search Result Node List]
