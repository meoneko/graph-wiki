# code-review-graph

Local-first codebase intelligence graph for code review and impact analysis.

Parses your codebase into a SQLite knowledge graph, then exposes it via a CLI, an MCP server (for Claude), and a VS Code extension. Key use case: given a git diff or PR, instantly know which nodes (endpoints, use cases, DTOs) are affected and what the blast radius looks like.

---

## Features

- **8-stage pipeline** — sync → extract → validate → build graph → AI enrich → verify → wiki → report
- **Tree-sitter parsing** — AST-accurate extraction for C# (controllers, use cases, DTOs, minimal APIs, partial classes, extension methods, top-level statements) and TypeScript/React (routes, API calls)
- **SQLite storage** — local-first, no external services required; FTS5 full-text search + vector embeddings
- **Impact analysis** — blast radius BFS, risk scoring, git diff → affected node mapping
- **MCP server** — 8 core tools callable from Claude Desktop or any MCP client
- **CLI binary** (`crg`) — build, watch, ask, impact, stats, search, export
- **Multi-workspace** — manage multiple repos (backend + frontend + other services) from one config
- **AI enrichment** — optional OpenRouter/Gemini enrichment pass over extracted facts
- **Export** — GraphML, Obsidian vault, Neo4j Cypher

---

## Quick Start

```bash
npm install
cp knowledge.config.yaml.example knowledge.config.yaml  # edit paths to your repos
npm run build

# Build the graph for a workspace
npm run crg -- build my-workspace

# Ask about a node
npm run crg -- ask "CreateOrderUseCase" --workspace my-workspace

# Impact analysis on last commit
npm run crg -- impact --diff HEAD~1..HEAD --workspace my-workspace

# Watch mode (rebuilds on file change)
npm run crg -- watch my-workspace

# Serve as MCP server (for Claude Desktop)
npm run crg -- serve-mcp
```

---

## Configuration

All settings live in `knowledge.config.yaml`:

```yaml
workspaces:
  - id: my-workspace
    projects: [backend, frontend]
    verification:
      require_flows: true
      required_golden_flows: [Core User Flow]

projects:
  backend:
    path: /path/to/your/backend
    sources:
      include: [src/**/*.cs]
      exclude: ["**/bin/**", "**/obj/**"]
    rules:
      extract: [overview, concepts, entities, flows, endpoints, services]

  frontend:
    path: /path/to/your/frontend
    sources:
      include: [src/**/*.ts, src/**/*.tsx]
      exclude: ["**/node_modules/**", "**/dist/**"]
    rules:
      extract: [overview, pages, routes, services, flows, fe_be_mapping]

ai:
  provider: openrouter
  model_extract: google/gemini-2.5-flash
  api_key_env: OPENROUTER_API_KEY

outputs:
  wiki_root: ./knowledge/wiki
  reports_root: ./knowledge/reports
```

---

## CLI Reference

```
crg build [workspace] [--incremental]   Build or incrementally update the graph
crg watch [workspace]                   Watch mode — rebuild on file change
crg ask <question> [--workspace <id>]   Look up a node by name
crg impact [--diff base..head]          Show impact report for a git range
crg stats [workspace]                   Node/edge counts
crg search <query> [--workspace <id>]   Full-text search over nodes
crg wiki [workspace]                    Regenerate wiki output
crg serve-mcp                           Start MCP server (stdio)
crg export [--format graphml|obsidian|neo4j] [--workspace <id>]
```

---

## MCP Tools

When running `crg serve-mcp`, the following tools are available to Claude:

| Tool | Description |
|---|---|
| `build_graph` | Build or incrementally update the graph |
| `get_node` | Fetch a single node by ID |
| `get_neighbors` | Get neighbouring nodes up to N hops |
| `get_lineage` | Upstream/downstream lineage from a node |
| `search_nodes` | Full-text search |
| `review_diff` | Impact report from raw diff text |
| `get_blast_radius` | BFS blast radius from a node |
| `get_graph_stats` | Node/edge counts and metrics |

---

## Project Structure

```
src/
  cli/              CLI entry point (crg)
  core/             Graph engine, query, reasoning, type registry
  scanner/          Tree-sitter parsers (C#, TypeScript)
  pipeline/         8-stage pipeline + adapters + config
    stages/         01_sync … 08_report
    adapters/       CSharpAdapter, TSReactAdapter
  storage/          SQLite (GraphDB, migrations, pathUtils)
  mcp/              MCP server, tools, schemas
  export/           GraphML, Obsidian, Neo4j exporters
  registry/         Multi-repo registry
packages/
  vscode-extension/ VS Code extension (blast radius command)
fixtures/
  dotnet-mvc/       MVC controller fixture (acceptance tests)
  dotnet-minimal/   Minimal API fixture (acceptance tests)
knowledge.config.yaml
```

---

## Pipeline Stages

| Stage | File | Description |
|---|---|---|
| 01 sync | `01_sync.ts` | Copy source files to `knowledge/sources/` |
| 02 extract | `02_extract.ts` | Hash-based incremental extraction via adapters |
| 03 validate | `03_validate.ts` | NodeType registry gate — unknown types → rejects table |
| 04 build graph | `04a_build_canonical.ts`, `04b_build_derived.ts`, `04c_build_exploratory.ts` | Assemble multi-layer nodes + dependency edges into SQLite |
| 05 enrich | `05_enrich.ts` | Optional AI enrichment pass (OpenRouter) |
| 06 verify | `06_verify.ts` | Workspace verification rules (flows, coverage, parity) |
| 07 wiki | `07_wiki.ts` | Generate markdown wiki to `knowledge/wiki/` |
| 08 report | `08_report.ts` | Write `verification.json`, `digest.json`, `lint.json` |

---

## Supported Languages

| Language | Adapter | Extracts |
|---|---|---|
| C# | `CSharpAdapter` + tree-sitter | Controller actions, Minimal API routes, Use cases, DTOs, Interfaces, Classes, Partial classes, Extension methods, Top-level statements |
| TypeScript / React | `TSReactAdapter` | Routes, API calls (fetch/axios) |

---

## Storage

- **Database**: `knowledge/artifacts/internal/state/graph.db` (SQLite, WAL mode)
- **Tables**: `nodes`, `edges`, `facts`, `rejects`, `file_hashes`, `semantic_facts`, `embeddings`
- **Search**: FTS5 virtual tables (`nodes_fts`, `facts_fts`)
- **Vectors**: `embeddings` table — cosine similarity via in-memory linear scan (suitable for < 50k nodes)
- **Migrations**: versioned TypeScript constants, applied automatically on first run

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | No | Enables AI enrichment in stage 05 |

---

## Development

```bash
npm install
npm run build        # tsc compile
npm run dev          # run CLI via tsx (no build needed)
npm run serve:mcp    # MCP server via tsx
npm run test         # vitest
npm run typecheck    # tsc --noEmit
```
