# Python Reference Migration Map

This document maps every capability from the Python reference implementation
(CodeGraph) to its TypeScript equivalent in `code-review-graph`, along with
migration status and target story.

Generated as part of Sprint 0 — Migration Map (US-012), task 1.2.

---

## Status Legend

| Status | Meaning |
|---|---|
| `done` | Fully implemented in TypeScript |
| `partial` | Partially implemented — some functionality exists |
| `missing` | Not yet implemented — planned for migration |
| `in-progress` | Currently being implemented |
| `wont-port` | Will not be ported — reference-only or not applicable |

---

## Capability Migration Table

| Capability | Python Module | TypeScript Equivalent | Status | Story |
|---|---|---|---|---|
| Guided installer (auto-detect MCP clients, write config) | `codegraph install` CLI | `src/installer/` | `done` | US-013 |
| Client config detection (Claude Desktop, Cursor, Windsurf, VS Code) | `codegraph install --detect` | `src/installer/detector.ts` | `done` | US-013 |
| Idempotent config writer | `codegraph install` (merge logic) | `src/installer/writer.ts` | `done` | US-013 |
| MCP tool filtering (allow-list) | `--tools` flag on `codegraph serve` | `src/mcp/tools/runtime.ts` | `done` | US-014 |
| MCP tool filtering (deny-list) | `--exclude-tools` flag on `codegraph serve` | `src/mcp/tools/runtime.ts` | `done` | US-014 |
| Tool filter config (`mcp.tools.allow` / `mcp.tools.deny`) | `codegraph.yaml` config | `knowledge.config.yaml` | `done` | US-014 |
| Multi-repo daemon supervisor | Single-repo watcher (no daemon) | `src/daemon/supervisor.ts` | `done` | US-015 |
| Daemon PID file management | N/A (no daemon in Python) | `src/daemon/pidfile.ts` | `done` | US-015 |
| Daemon crash recovery (exponential back-off) | N/A | `src/daemon/supervisor.ts` | `done` | US-015 |
| Daemon structured logging (JSONL) | N/A | `src/daemon/logger.ts` | `done` | US-015 |
| Evaluation benchmarks (agent-eval) | `codegraph` agent-eval skill | `src/eval/` | `done` | US-016 |
| Eval suite loader (YAML/JSON) | Agent-eval fixtures | `src/eval/loader.ts` | `done` | US-016 |
| Eval predicate matching (notEmpty, minNodeCount, etc.) | Agent-eval assertions | `src/eval/scorer.ts` | `done` | US-016 |
| Hybrid FTS + vector embedding search | `codegraph_search` with embeddings | `src/core/graph/search/` | `done` | US-017 |
| Cosine similarity computation | Embedding search in Python | `src/core/graph/search/EmbeddingIndex.ts` | `done` | US-017 |
| Search result fusion (FTS + semantic) | Hybrid ranking in Python | `src/core/graph/search/SearchFusion.ts` | `done` | US-017 |
| Configurable semantic weight | `search.semantic_weight` config | `knowledge.config.yaml` | `done` | US-017 |
| Interactive HTML visualization (D3.js force-directed) | No direct equivalent | `src/export/html.ts` | `done` | US-018 |
| Graph export with confidence band coloring | No direct equivalent | `src/export/html.ts` | `done` | US-018 |
| Node metadata panel (click-to-inspect) | No direct equivalent | `src/export/assets/template.html` | `done` | US-018 |
| Filter toolbar and search highlight | No direct equivalent | `src/export/assets/template.html` | `done` | US-018 |
| Java language adapter (Spring annotations) | 19+ language parsers (universal) | `src/scanner/languages/java/` | `done` | US-019 |
| `@RestController` / `@Controller` extraction | Universal Java parser | `JavaParser.ts` | `done` | US-019 |
| `@Service` / `@Repository` extraction | Universal Java parser | `JavaParser.ts` | `done` | US-019 |
| tree-sitter-java WASM grammar | Native tree-sitter bindings | WASM-based | `done` | US-019 |
| Community splitting (oversized → sub-communities) | Community detection (basic) | `src/core/graph/analysis/community.ts` | `done` | US-020 |
| Edge-betweenness centrality sub-partitioning | N/A | `community.ts` | `done` | US-020 |
| Folder-structure fallback grouping | N/A | `community.ts` | `done` | US-020 |
| Flow criticality scoring | No equivalent | `src/core/graph/analysis/flows.ts` | `done` | US-021 |
| Node weight matrix (Controller=10, DB=8, etc.) | No equivalent | `flows.ts` | `done` | US-021 |
| Affected-flow lookup by changed files | No equivalent | `flows.ts` | `done` | US-021 |
| Agent workflow prompts (MCP Prompts API) | No equivalent | `src/mcp/prompts/` | `done` | US-022 |
| Prompt template loader (YAML) | No equivalent | `src/mcp/prompts/loader.ts` | `done` | US-022 |
| Default prompts (review-pr, debug-flow, onboard) | No equivalent | `src/mcp/prompts/defaults/` | `done` | US-022 |
| Memory/wiki re-ingestion loop | No equivalent | `src/pipeline/stages/00_reingest.ts` (planned) | `missing` | US-023 |
| HMAC signature verification for annotations | No equivalent | `00_reingest.ts` (planned) | `missing` | US-023 |
| AST signature drift detection | No equivalent | `00_reingest.ts` (planned) | `missing` | US-023 |
| Orphan annotation recovery (stale vault) | No equivalent | `00_reingest.ts` (planned) | `missing` | US-023 |
| Python packaging (`fastmcp`, `networkx`) | Python-specific | N/A | `wont-port` | — |
| HTTP/SSE MCP transport | `fastmcp` SSE server | N/A (stdio only) | `wont-port` | — |
| Raw Python schema (Pydantic models) | Python-specific | N/A | `wont-port` | — |
| Adaptive token budgeting (`codegraph_explore`) | `codegraph_explore` | `AgentContextBuilder` (partial) | `partial` | — |

---

## Coverage Summary

| Story | Capabilities Mapped | Status |
|---|---|---|
| US-013 (Guided Install) | 3 | `done` |
| US-014 (MCP Tool Filtering) | 3 | `done` |
| US-015 (Multi-Repo Daemon) | 4 | `done` |
| US-016 (Eval Runner) | 3 | `done` |
| US-017 (Hybrid Search) | 4 | `done` |
| US-018 (Interactive Viz) | 4 | `done` |
| US-019 (Java Adapter) | 4 | `done` |
| US-020 (Community Splitting) | 3 | `done` |
| US-021 (Flow Criticality) | 3 | `done` |
| US-022 (Agent Prompts) | 3 | `done` |
| US-023 (Memory Re-Ingestion) | 4 | `missing` |
| Reference-only / wont-port | 4 | `wont-port` / `partial` |

---

## Notes

- No Python-specific implementation detail is treated as TypeScript proof.
- Status will be updated as each sprint completes (task 24.2).
- Capabilities marked `partial` have existing infrastructure that will be extended.
- Capabilities marked `wont-port` are Python implementation details not applicable to TypeScript.
