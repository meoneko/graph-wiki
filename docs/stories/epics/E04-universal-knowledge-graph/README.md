# E04 — Universal Headless Semantic Knowledge Graph

## Goal

Broaden `code-review-graph` (CRG) into a universal, headless, high-performance, and workspace-segmented semantic knowledge graph engine by integrating mature components from the `CodeGraph` packed codebase. This epic aims to scale language parsers, enhance AI context packing, automate agent onboarding, and introduce offline local semantic search.

---

## Surfaces Changed

- **CLI commands**: `crg install` (new command), `crg search` (hybrid search extension)
- **Scanner Core**: `src/scanner/core/ILanguageParser.ts` and `src/scanner/languages/` (adding declarative parser configurations)
- **Pipeline Stage**: `src/pipeline/stages/05c_build_exploratory.ts` (integrating sqlite-vss local embeddings stage)
- **Agent Context Builder**: `src/pipeline/AgentContextBuilder.ts` (implementing adaptive context explorer token budgeting and symbol clustering)
- **MCP Server Tools**: `src/mcp/tools.ts` (exposing `codegraph_explore` and semantic queries)
- **Graph Storage**: `src/storage/GraphDB.ts` (adding sqlite-vss vectors, mappers, and embeddings upsert)

---

## Design Principles

- **Preserve Trust Layers**: Maintain the core 4-layer trust model (Canonical, Derived, Exploratory, External). All AI-inferred relationships and semantic vector embeddings must reside strictly in the **Exploratory** layer.
- **Fail-Closed & High Isolation**: Workspaces must remain 100% isolated. Embedding generation and hybrid search must run fully segmented using the indexed `workspace` columns.
- **Offline & Local First**: Embeddings must utilize `sqlite-vss` and `nomic-embed-text` to avoid external API calls, maintaining zero network costs and strict local privacy.
- **Adaptive Fallback**: In the absence of compiled VSS binaries or web-tree-sitter bindings, the engine must fall back gracefully to standard FTS5 keyword matching.

---

## Key Reuse Points

| Existing CRG Module | Reuse Strategy |
|---|---|
| `better-sqlite3` WAL & `getDB()` | Maintain singleton workspace database connection manager. |
| `EdgePolicyTable` & `TrustAwareQueryEngine` | Route all query queries through the trust boundaries. |
| `01_sync` File Hash Tracking | Retain incremental indexing logic to avoid re-generating embeddings for unmodified files. |
| `OperationResolver` & `QueryResultFactory` | Route the new CLI commands and MCP tools through the query orchestrator. |

---

## Candidate Stories

| Story | Title | Lane | Depends On | Status |
|---|---|---|---|---|
| **US-024** | Universal Declarative Language Parser Engine | normal | — | planned |
| **US-025** | Adaptive Context Explorer with Token Budgeting | normal | — | planned |
| **US-026** | Interactive Guided Client Installer (`crg install`) | normal | — | planned |
| **US-027** | Local Vector Search & Hybrid Search Integration | high-risk | — | planned |
| **US-028** | End-to-end multi-workspace CLI & MCP headless validation | normal | US-024–027 | planned |

---

## Story Details & Scope

### US-024: Universal Declarative Language Parser Engine
*   **Scope**: Introduce a `LanguageExtractor` declarative configuration standard (matching CodeGraph) into our Tree-sitter parsers. This removes manual AST traversal boilerplate and allows scaling parser support to Go, Rust, Python, Java, and Ruby simply by adding tree-sitter language grammar bindings.
*   **Proof**: Unit tests for Go/Python code snippets parsing correctly into `ParsedSymbol` and `CalledSymbol` sets.

### US-025: Adaptive Context Explorer with Token Budgeting
*   **Scope**: Implement an adaptive clustering algorithm inside `AgentContextBuilder.ts`. Group contiguous or kề cận symbols by line numbers in files, score their priority (entrypoint = 10, connected = 3, leaf = 1), and dynamically pack the highest-priority symbol blocks into a single query result to avoid token limits without cutting contexts off.
*   **Proof**: Integration tests verifying that retrieval from a complex codebase returns tightly packed, well-formatted code blocks instead of truncated lists.

### US-026: Interactive Guided Client Installer (`crg install`)
*   **Scope**: Port the Clack-based interactive installer. Auto-detect user environments (Claude Desktop, Cursor, Codex), prompt for global/local setups, configure the target client settings, and write the custom `.cursorrules` / `CLAUDE.md` guidelines automatically.
*   **Proof**: Mock environment tests simulating Claude/Cursor settings folder structures, validating idempotent and safe JSON merges.

### US-027: Local Vector Search & Hybrid Search Integration
*   **Scope**: Bind `sqlite-vss` to the database schema. In Stage `05c_build_exploratory`, generate vector embeddings using a fast, local embedding engine. Implement a hybrid search query inside `GraphDB.ts` combining BM25 FTS5 score with vector similarity before starting graph traversal.
*   **Proof**: Performance benchmarks showing semantic query matches (e.g. searching for "database write" yields `GraphDB.upsertNode`) under 10ms.

### US-028: End-to-end Multi-Workspace Validation
*   **Scope**: Wire all migrated capabilities together. Run test suites across distinct local fixtures (`fixtures/dotnet-mvc`, `fixtures/typescript-api`) to prove that workspace segmentation remains perfect, memory footprints are stable, and there is zero cross-workspace data leakage.
*   **Proof**: E2E pipeline regression tests and complete test matrix validation.

---

## Exit Criteria

- **Functional Completeness**: All 4 migrated capabilities are functional and covered by unit/integration tests.
- **Graceful Degradation**: System degrades gracefully to keyword search if WASM/VSS binaries fail to load on target machines.
- **Zero Leakage**: Multi-workspace validation proves absolute workspace separation.
- **Quality Gates**: `npm run typecheck` and `npm test` pass with 100% success.
