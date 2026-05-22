# Overview

## Current Behavior

`crg search <query>` uses SQLite FTS5 full-text search against node labels, symbols, and
`lang_meta` text. FTS5 matches exact tokens — it cannot find semantically related terms.
Searching for "payment processing" will not return a node labelled `PaymentGatewayUseCase`
unless those exact words appear in the indexed text.

## Target Behavior

When semantic search is enabled (`search.semantic: true` in config and an embedding
provider is configured), `crg search --semantic <query>` uses vector similarity search
against pre-computed node embeddings, returning nodes ranked by cosine similarity to the
query embedding. Results are merged with FTS5 results using a configurable blend weight.

The existing pipeline stage 06 (`enrichFacts`) already writes embeddings to the
`embeddings` table when an AI provider is configured. This story wires those embeddings
into the search path.

```bash
crg search "payment processing" --semantic --workspace b2g
# Returns: PaymentGatewayUseCase (similarity: 0.87), ProcessPaymentHandler (0.82), ...
```

## Affected Users

- Developers exploring unfamiliar codebases where they don't know exact symbol names
- AI agents using `search_nodes` MCP tool to find relevant context by concept

## Affected Product Docs

- `README.md` — update "Search" section with `--semantic` flag
- `knowledge.config.yaml.example` — add `search.semantic` config block

## Non-Goals

- No real-time embedding updates (embeddings are written at enrich stage; must rebuild to
  update after code changes)
- No cross-workspace semantic search
- No embedding model selection at query time (model is fixed per workspace config)
