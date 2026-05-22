# Capability Inventory — Python Reference Migration

This document inventories every CLI command and MCP tool category in the
TypeScript codebase (`code-review-graph`) and maps each to its Python reference
equivalent (from the CodeGraph project).

Generated as part of Sprint 0 — Migration Map (US-012), task 1.1.

---

## CLI Commands (`src/cli/index.ts`)

| # | CLI Command | Description | Python Reference Equivalent | Notes |
|---|---|---|---|---|
| 1 | `crg build` | Run full pipeline (sync → report) | `codegraph build` | Equivalent exists |
| 2 | `crg sync` | Run sync stage (copy/link source files) | Part of `codegraph build` pipeline | Equivalent exists (internal stage) |
| 3 | `crg extract` | Run extract stage (produce candidate records) | Part of `codegraph build` pipeline | Equivalent exists (internal stage) |
| 4 | `crg normalize` | Run sync + extract + normalize stages | Part of `codegraph build` pipeline | Equivalent exists (internal stage) |
| 5 | `crg validate` | Run sync through validate stages | Part of `codegraph build` pipeline | Equivalent exists (internal stage) |
| 6 | `crg graph` | Run sync through graph build stages | Part of `codegraph build` pipeline | Equivalent exists (internal stage) |
| 7 | `crg watch` | Start file watcher for incremental builds | `codegraph watch` (file watcher with debounce) | Equivalent exists |
| 8 | `crg ask` | Structured query engine (what-is, depends-on, etc.) | No direct equivalent | CRG-specific trust-aware query |
| 9 | `crg agent-context` | Build bounded context for AI agents | `codegraph_context` / `codegraph_explore` | Partial equivalent (different approach) |
| 10 | `crg drift` | Run drift detection against baseline | No equivalent | CRG-specific |
| 11 | `crg verify` | Run governance validation and graph invariant checks | No equivalent | CRG-specific trust governance |
| 12 | `crg wiki` | Generate trust-aware wiki pages | No equivalent | CRG-specific |
| 13 | `crg report` | Generate reports (quality, verification, lint, etc.) | No equivalent | CRG-specific |
| 14 | `crg impact` | Show impact of git diff on graph | No direct equivalent | CRG-specific (CodeGraph has `codegraph_context` with diff awareness) |
| 15 | `crg serve-mcp` | Start MCP server (stdio) | `codegraph serve --mcp` | Equivalent exists |
| 16 | `crg stats` | Show graph statistics | `codegraph stats` | Equivalent exists |
| 17 | `crg search` | Search graph nodes by text | `codegraph search` / `codegraph_search` tool | Equivalent exists |
| 18 | `crg register` | Register a repository | No direct equivalent | CRG-specific multi-repo registry |
| 19 | `crg export` | Export graph (graphml, obsidian, neo4j) | No equivalent | CRG-specific |
| 20 | `crg review-architecture` | Run architecture review analysis | No equivalent | CRG-specific (E01) |
| 21 | `crg install` (planned) | Auto-detect MCP clients and write config | `codegraph install` | **Python equivalent exists — to migrate (US-013)** |
| 22 | `crg daemon` (planned) | Multi-repo daemon supervisor | No direct equivalent (CodeGraph uses single-repo watcher) | **New capability (US-015)** |
| 23 | `crg eval` (planned) | Run evaluation benchmarks | `codegraph` agent-eval skill | **Partial equivalent — to migrate (US-016)** |

---

## MCP Tool Categories (`src/mcp/tools/`)

| # | Category File | Registered Tools | Python Reference Equivalent | Notes |
|---|---|---|---|---|
| 1 | `build.ts` | `list_workspaces`, `build_graph`, `update_graph`, `run_postprocess`, `watch_graph` | `codegraph_status` (partial) | CodeGraph has no MCP build tools; uses CLI only |
| 2 | `query.ts` | `get_node`, `get_neighbors`, `get_path`, `get_callers` | `codegraph_node`, `codegraph_callers`, `codegraph_callees` | Equivalent exists (different trust model) |
| 3 | `search.ts` | `search` | `codegraph_search` | Equivalent exists (CodeGraph adds hybrid/semantic) |
| 4 | `review.ts` | `detect_changes`, `review_diff`, `review_pr`, `blast_radius`, `get_risk_score` | No equivalent | CRG-specific trust-aware review |
| 5 | `graph.ts` | `graph_stats`, `architecture_overview`, `list_communities`, `get_community`, `find_hubs`, `find_bridges`, `find_gaps` | `codegraph_context` (partial overlap) | Partial — CodeGraph has context but not structural analysis tools |
| 6 | `wiki.ts` | `get_wiki_page`, `generate_wiki` | No equivalent | CRG-specific |
| 7 | `refactor.ts` | `rename_preview`, `find_dead_code` | No equivalent | CRG-specific |
| 8 | `flows.ts` | `list_flows`, `get_flow`, `get_affected_flows`, `get_minimal_context`, `get_lineage` | No equivalent | CRG-specific (CodeGraph has no flow concept) |
| 9 | `architecture.ts` | `architecture_review`, `get_architecture_findings` | No equivalent | CRG-specific (E01) |
| 10 | `runtime.ts` | Tool registry + filter infrastructure | Tool filtering via `--tools` flag in CodeGraph | **Python equivalent exists — to migrate (US-014)** |

---

## Python Reference Capabilities Without TypeScript Equivalent

These capabilities exist in the Python reference (CodeGraph) but are absent or
only partially present in the current TypeScript codebase:

| # | Python Reference Capability | Target Story | Status |
|---|---|---|---|
| 1 | Guided installer (`codegraph install`) | US-013 | missing — to implement |
| 2 | MCP tool filtering (allow/deny lists) | US-014 | missing — to implement |
| 3 | Multi-repo daemon watching | US-015 | missing — to implement |
| 4 | Evaluation benchmarks (agent-eval) | US-016 | missing — to implement |
| 5 | Hybrid FTS + vector embedding search | US-017 | missing — to implement (schema exists, logic absent) |
| 6 | Interactive HTML visualization export | US-018 | missing — to implement |
| 7 | Broader language support (Java, Python, Go, etc.) | US-019 | missing — to implement (only C# and TS/TSX today) |
| 8 | Community splitting / fallback | US-020 | partial — community detection exists, splitting absent |
| 9 | Flow criticality scoring | US-021 | partial — flows exist, criticality scoring absent |
| 10 | Agent workflow prompts (MCP Prompts API) | US-022 | missing — to implement |
| 11 | Memory/wiki re-ingestion loop | US-023 | missing — to implement (pending ADR 0006) |
| 12 | 19+ language parsers (universal extraction) | US-019+ | reference-only — migrate one slice at a time |
| 13 | Adaptive token budgeting (`codegraph_explore`) | future | reference-only — potential enhancement to `AgentContextBuilder` |
| 14 | HTTP/SSE MCP transport | future | reference-only — not planned for E02 |

---

## Summary

- **Total CLI commands (current):** 20
- **Total CLI commands (planned for E02):** 3 new (`install`, `daemon`, `eval`)
- **Total MCP tool categories:** 9 (+ runtime infrastructure)
- **Total registered MCP tools:** 28
- **Capabilities with Python equivalent:** 8 (full or partial)
- **Capabilities unique to CRG (no Python equivalent):** 12+ (trust model, governance, wiki, review, architecture)
- **Python capabilities to migrate:** 11 (US-013 through US-023)
- **Python capabilities marked reference-only:** 3 (packaging, HTTP/SSE, raw Python schema)
