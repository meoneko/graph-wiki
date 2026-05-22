# Overview

## Current Behavior

Currently, graph lookup relies on rigid keyword matches via FTS5 or structural path traversals. If a developer searches for "database saving mechanism" but the methods are named `upsertNode` or `commitTransaction`, the search fails because there is no semantic or conceptual indexing layer in the system.

## Target Behavior

Introduce local offline semantic search. During Stage `05c_build_exploratory`, code snippets (classes, method definitions, facts) are processed through a fast, lightweight, and offline-compatible embedding model (e.g. `nomic-embed-text` via `@xenova/transformers` or `onnxruntime`). The embeddings are stored in a new `embeddings` SQLite table. We integrate `sqlite-vss` to calculate vector distances (cosine similarity) directly inside the database, merging similarity scores with BM25 FTS5 scores to deliver state-of-the-art hybrid search queries under 15ms.

## Affected Users

- AI Agents querying the graph via semantic questions or fuzzy prompts.
- Developers looking up code concepts in the terminal via `crg search --semantic`.

## Affected Product Docs

- `SPEC.md` Section 6 (Search and Indexing)
- `docs/ARCHITECTURE.md` (Exploratory trust layer)

## Non-Goals

- Making web API calls to external services like OpenAI (must run 100% offline).
- Storing massive multi-gigabyte vector indexes in Git.
