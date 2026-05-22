# Overview

## Current Behavior

Currently, the `AgentContextBuilder` flat-serializes all matches into simple Markdown blocks. In very large repositories or heavily coupled modules, the returned string easily overflows AI context window limits or truncates essential details, causing AI agents to lose critical context.

## Target Behavior

Provide a token-budgeted, graph-distance aware clustering algorithm in `AgentContextBuilder.ts` (matching CodeGraph's explorer). It groups surrounding symbols, calculates their structural centrality (e.g. PageRank/Betweenness or Degree), and selectively bundles the most relevant, highly scored nodes into the final context block. If a token budget (e.g. 8000 tokens) is specified, the explorer automatically stops packing lower-tier symbols, yielding an optimal, non-truncated structural context to the LLM.

## Affected Users

- AI Agents invoking MCP query tools like `get_neighbors` or `get_minimal_context`.
- Developers seeking comprehensive structural summaries of their codebases.

## Affected Product Docs

- `SPEC.md` Section 9 (Agent Context Packing)

## Non-Goals

- Dynamically resizing the actual database size.
- Hardcoding specific LLM pricing limits in code.
