# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build TypeScript
npm run build

# Run CLI without building (tsx)
npm run dev

# Run compiled CLI binary
npm run crg -- <command>

# Type check only
npm run typecheck

# Run tests
npm test

# Run a single test file
npx vitest run src/core/graph/query/operation-query.acceptance.test.ts

# Start MCP server
npm run serve:mcp
```

**VS Code extension** (`packages/vscode-extension/`):
```bash
npm run build   # compile extension TypeScript
```

There is no lint script — TypeScript strict mode (`strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`) serves as the primary code quality gate.

## Architecture Overview

`code-review-graph` is a local-first codebase intelligence system. It parses source code (C#, TypeScript/React) into a SQLite knowledge graph, then exposes that graph via a CLI (`crg`), an MCP server (for Claude Desktop), and a VS Code extension. The primary use case is impact analysis: given a git diff, compute the blast radius across endpoints, use cases, and DTOs.

### Pipeline (9 stages)

All pipeline logic lives in `src/pipeline/`. The orchestrator is `src/pipeline/run.ts`; stages execute sequentially:

| Stage | File | Responsibility |
|-------|------|---------------|
| 01 | `01_sync.ts` | Copy source files to `knowledge/sources/` |
| 02 | `02_extract.ts` | Hash-based incremental extraction via adapters |
| 03 | `03_validate.ts` | NodeTypeRegistry gate — unknown types become rejects |
| 04a | `04a_build_canonical.ts` | Authoritative structural nodes/edges |
| 04b | `04b_build_derived.ts` | Inferred relationships |
| 04c | `04c_build_exploratory.ts` | Ambiguous/low-confidence relationships |
| 04d | `04d_build_flows.ts` | Flow graph derivation — synthetic `flow_domain` nodes and `belongs_to_flow` edges |
| 05 | `05_enrich.ts` | Optional AI enrichment (OpenRouter/Gemini) |
| 06 | `06_verify.ts` | Workspace verification (flows, coverage, parity) |
| 07 | `07_wiki.ts` | Generate markdown documentation |
| 08 | `08_report.ts` | Write `verification.json`, `digest.json`, `lint.json` |

### Language Adapters (`src/pipeline/adapters/`)

- `CSharpAdapter.ts` — controllers, minimal APIs, use cases, DTOs, partial classes, extension methods
- `TypeScriptAdapter.ts` — routes, API calls (fetch/axios); uses `TypeScriptTreeSitterParser` under the hood
- `StructuredFileAdapter.ts` — JSON/YAML/SQL/Dockerfile/Terraform config extraction
- `registry.ts` — maps file extensions to adapters

### Scanner (`src/scanner/`)

Lower-level AST parsing layer that adapters delegate to:

- `core/ILanguageParser.ts` — shared `ParsedFile` / `ParsedSymbol` / `ILanguageParser` contracts
- `core/WebTreeSitterWrapper.ts` — initialises the WASM tree-sitter runtime once
- `languages/csharp/CSharpParser.ts` — C# tree-sitter parser
- `languages/typescript/TypeScriptTreeSitterParser.ts` — TypeScript/TSX tree-sitter parser

Adapters consume `ParsedFile` from scanners; scanners never touch the graph DB directly.

### Trust Classification (`src/pipeline/TrustClassifier.ts`)

`TrustClassifier.classify(extractor)` maps an extractor ID string to `{ trust_level, decision_status }`. The three trust levels drive the entire query/traversal system:

- `AUTHORITATIVE` — AST/parser-derived (e.g. `csharp_tree_sitter`, `ts_tree_sitter_parser`, config parsers)
- `DERIVED` — cross-file analysis, composition rules (e.g. `ts_react_adapter`, `sql_parser`)
- `EXPLORATORY` — AI or heuristic facts

### Framework Adapters (`src/pipeline/frameworks/`)

Post-extraction layer that detects framework conventions (currently ASP.NET via `aspnet.ts`) and adds derived edges. `globalFrameworkAdapterRegistry` in `registry.ts` resolves matching adapters per language.

### Core Graph & Query (`src/core/`)

- `types.ts` — canonical type definitions: `NodeType`, `EdgeType`, `ConfidenceBand`, `DecisionStatus`, `QueryMode`
- `nodeTypeRegistry.ts` — 27+ registered node types (grouped: C#, TypeScript, config, schema, infrastructure, API)
- `flows.ts` — flow definitions and composition (`computeFlows`, `flowMembershipEdges`, `withDerivedDomains`)
- `graph/query/TrustedQueryService.ts` — single entry point for all graph queries
- `graph/query/OperationResolver.ts` — validates and routes every operation (ask, impact, lineage, wiki, governance) — **this is mandatory; nothing bypasses it**
- `graph/query/TrustAwareQueryEngine.ts` — trust-aware BFS/DFS traversal, visible graph filtering
- `graph/traversal/EdgePolicyTable.ts` — trust-aware edge filtering matrix
- `graph/reasoning/reasoning-policy.ts` — reasoning policy for trust-aware traversal
- `graph/analysis/` — community detection, centrality metrics

### Storage (`src/storage/`)

Single SQLite database via `GraphDB.ts` with 7 tables: `nodes`, `edges`, `facts`, `rejects`, `file_hashes`, `semantic_facts`, `embeddings`. Uses WAL mode and FTS5 full-text indexes. All pipeline stages read and write through `GraphDB`.

### MCP Server (`src/mcp/`)

`server.ts` runs on stdio transport. Tools are registered in `tools/runtime.ts` and delegate to `TrustedQueryService`. The 8 tool categories: build, query, review, graph, wiki, flows, refactor, search.

### CLI (`src/cli/`)

`index.ts` uses Commander to dispatch: `build`, `watch`, `ask`, `impact`, `wiki`, `serve-mcp`, `stats`, `search`, `register`, `export`.

### Export (`src/export/`)

Three one-way exporters from `GraphNode[]`/`GraphEdge[]` — `graphml.ts`, `neo4j.ts`, `obsidian.ts`. These are write-only and do not feed back into the graph.

### Data Flow

```
CLI / MCP / VS Code extension
  → Tool / Command layer
  → OperationResolver  (mandatory trust gate)
  → TrustedQueryService
  → TrustAwareQueryEngine
  → GraphDB / GraphArtifactLoader (SQLite artifacts)
```

### Configuration

All runtime configuration is in `knowledge.config.yaml` (copy from `knowledge.config.yaml.example`). It defines workspaces (groups of projects), project source paths and extraction rules, verification requirements (flows, coverage thresholds), AI provider settings, and output paths for wiki/reports/state artifacts.

### Key Dependencies

- `better-sqlite3` — synchronous SQLite, WAL mode
- `web-tree-sitter` + `@vscode/tree-sitter-wasm` + `tree-sitter-c-sharp`/`tree-sitter-typescript` WASM grammars — AST parsing
- `@modelcontextprotocol/sdk` — MCP protocol
- `tsx` — runs TypeScript directly during development (no build needed for `npm run dev`)
- `vitest` — test runner; tests are acceptance tests (`.acceptance.test.ts`), not unit tests

### Module: NodeNext

The project uses `"module": "NodeNext"` in tsconfig, so imports must use explicit `.js` extensions even for `.ts` source files (TypeScript resolves them correctly). Do not use extensionless or `.ts` imports.
