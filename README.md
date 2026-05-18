# code-review-graph

Local-first codebase intelligence graph for code review and impact analysis.

Parses your codebase into a SQLite knowledge graph, then exposes it via a CLI, an MCP server (for Claude), and a VS Code extension. Key use case: given a git diff or PR, instantly know which nodes (endpoints, use cases, DTOs) are affected and what the blast radius looks like.

---

## Features

- **12-stage pipeline** — sync → extract → normalize → validate → build graph (canonical/derived/exploratory/flows) → AI enrich → verify → wiki → report
- **Tree-sitter parsing** — AST-accurate extraction for C# (controllers, use cases, DTOs, minimal APIs, partial classes, extension methods, top-level statements) and TypeScript/React (routes, API calls)
- **Trust layering** — three graph kinds (canonical/derived/exploratory) with per-mode traversal policies; authoritative, mixed_safe, and exploratory query modes
- **SQLite storage** — local-first, no external services required; FTS5 full-text search + vector embeddings
- **Impact analysis** — blast radius BFS, risk scoring, git diff → affected node mapping
- **MCP server** — 32 tools callable from Claude Desktop or any MCP client
- **CLI binary** (`crg`) — build, watch, ask, impact, stats, search, export, architecture review, drift detection, and more
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
crg build [workspace] [--incremental]
    Run the full pipeline (sync through report)

crg sync [--workspace <id>]
    Copy/link source files only

crg extract [--workspace <id>]
    Run sync + extract stages

crg normalize [--workspace <id>]
    Run sync + extract + normalize stages

crg validate [--workspace <id>]
    Run sync + extract + normalize + validate stages

crg graph [--workspace <id>]
    Run sync through all graph build stages (canonical, derived, exploratory, flows)

crg watch [workspace]
    Rebuild on file change

crg ask <question> [--workspace <id>] [--query-type <type>] [--mode <mode>]
    Query types: what-is-symbol, what-depends-on, what-route-calls,
                 lineage, impact, why-canonical, why-insufficient-context
    Modes: authoritative (default), mixed_safe, exploratory

crg agent-context <task> [--workspace <id>] [--mode <mode>]
                         [--max-nodes <n>] [--max-edges <n>] [--max-suggestions <n>]
    Build trust-aware context bundle for an agent task

crg impact [--diff <base..head>] [--workspace <id>]
    Impact report for a git range (default: HEAD~1..HEAD)

crg drift [--workspace <id>]
    Detect drift against stored baseline

crg verify [--workspace <id>]
    Run governance validation and graph invariant checks

crg wiki [--workspace <id>]
    Generate trust-aware wiki pages

crg report [--workspace <id>] [--type <type>]
    Report types: quality, verification, lint, digest, metrics,
                  edge-health, ask-readiness, agent-context-readiness, all (default)

crg review-architecture [workspace] [--mode <mode>] [--output <path>] [--json] [--fail-on-critical]
    Analyze module boundaries, dependency cycles, layer violations, dead code, flow complexity

crg stats [workspace]
    Node/edge counts and metrics

crg search <query> [--workspace <id>]
    Full-text search over nodes

crg serve-mcp
    Start MCP server (stdio)

crg register <repoPath>
    Register a repo in the multi-repo registry

crg export [--format graphml|obsidian|neo4j] [--workspace <id>]
    Export graph to external format
```

---

## MCP Tools

When running `crg serve-mcp`, the following tools are available to Claude:

**Build**
| Tool | Description |
|---|---|
| `list_workspaces` | List all configured workspaces |
| `build_graph` | Run full pipeline build for a workspace |
| `update_graph` | Run incremental pipeline update |
| `run_postprocess` | Regenerate artifacts, wiki, and caches for an existing graph |
| `watch_graph` | Start graph watch mode |

**Query**
| Tool | Description |
|---|---|
| `get_node` | Get a node by ID with trust-aware visibility |
| `get_neighbors` | Get trust-aware neighbors of a node |
| `get_path` | Find reasoning paths between two nodes |
| `get_callers` | Find trust-aware callers of a symbol |

**Search**
| Tool | Description |
|---|---|
| `search` | Full-text search over visible graph nodes with trust filtering |

**Review & Impact**
| Tool | Description |
|---|---|
| `detect_changes` | Analyze a raw git diff for trust-aware change impact |
| `review_diff` | Review raw diff text with trust boundary |
| `review_pr` | Review impact by git range |
| `blast_radius` | BFS blast radius from a single node ID |
| `get_risk_score` | Compute risk score for a node set |

**Graph Analysis**
| Tool | Description |
|---|---|
| `graph_stats` | Graph statistics filtered by trust mode |
| `architecture_overview` | Architecture overview markdown with trust filtering |
| `list_communities` | List graph communities |
| `get_community` | Get nodes in a graph community |
| `find_hubs` | Find high-degree nodes within trust boundary |
| `find_bridges` | Find cross-domain edges within trust boundary |
| `find_gaps` | Find nodes with zero outbound edges |

**Flows**
| Tool | Description |
|---|---|
| `list_flows` | List derived business flows for a workspace |
| `get_flow` | Get nodes and edges for a business flow |
| `get_affected_flows` | Find flows affected by changed files, node IDs, or symbols |
| `get_minimal_context` | Bounded context subgraph around targets |
| `get_lineage` | Trace upstream and downstream graph neighbors |

**Wiki**
| Tool | Description |
|---|---|
| `get_wiki_page` | Get wiki page for a node (trust-aware) |
| `generate_wiki` | Generate trust-aware wiki for a workspace |

**Refactor**
| Tool | Description |
|---|---|
| `rename_preview` | Preview symbol rename impact |
| `find_dead_code` | Find unreferenced symbols |

**Architecture**
| Tool | Description |
|---|---|
| `architecture_review` | Full architecture review: module boundaries, cycles, layer violations, dead code |
| `get_architecture_findings` | Get architecture findings with optional severity filter |

---

## Project Structure

```
src/
  cli/              CLI entry point (crg)
  core/             Graph engine, query, reasoning, type registry
    graph/
      query/        TrustedQueryService, OperationResolver, TrustAwareQueryEngine
      traversal/    EdgePolicyTable (trust-aware edge filtering)
      analysis/     Community detection, centrality metrics, architecture review
    ask/            StructuredAskEngine
    agent/          AgentContextBuilder
    drift/          DriftDetector
  scanner/          Tree-sitter parsers (C#, TypeScript)
  pipeline/         12-stage pipeline + adapters + config
    stages/         01_sync … 09_report
    adapters/       CSharpAdapter, TypeScriptAdapter, StructuredFileAdapter
    frameworks/     ASP.NET framework adapter
  storage/          SQLite (GraphDB, migrations, pathUtils)
  mcp/              MCP server, 32 registered tools
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
| 03 normalize | `03_normalize.ts` | Normalize candidates into typed NormalizedFacts |
| 04 validate | `04_validate.ts` | NodeTypeRegistry gate — unknown types → rejects table |
| 05a build canonical | `05a_build_canonical.ts` | Authoritative structural nodes/edges (parser-backed) |
| 05b build derived | `05b_build_derived.ts` | Inferred relationships (cross-file analysis, framework adapters) |
| 05c build exploratory | `05c_build_exploratory.ts` | Ambiguous/low-confidence relationships |
| 05d build flows | `05d_build_flows.ts` | Synthetic `flow_domain` nodes and `belongs_to_flow` edges |
| 06 enrich | `06_enrich.ts` | Optional AI enrichment pass (OpenRouter/Gemini) |
| 07 verify | `07_verify.ts` | Workspace verification (flows, coverage, parity) |
| 08 wiki | `08_wiki.ts` | Generate markdown wiki to `knowledge/wiki/` |
| 09 report | `09_report.ts` | Write `verification.json`, `digest.json`, `lint.json`, `metrics.json` |

---

## Trust Model

Every node and edge carries a `graph_kind` (canonical / derived / exploratory / external) and a `confidence_band` (AUTHORITATIVE / EXTRACTED / INFERRED / AMBIGUOUS). Query mode controls which data is visible:

| Mode | Visible graph kinds | Confidence bands allowed |
|---|---|---|
| `authoritative` | canonical only (parser-backed) | AUTHORITATIVE only |
| `mixed_safe` | canonical, derived, exploratory | AUTHORITATIVE, EXTRACTED, INFERRED (AMBIGUOUS only on exploratory edges; ≤2 exploratory hops) |
| `exploratory` | all | All |

All queries pass through `OperationResolver` (mandatory trust gate) before reaching `TrustedQueryService`.

---

## Supported Languages

| Language | Adapter | Extracts |
|---|---|---|
| C# | `CSharpAdapter` + tree-sitter | Controller actions, Minimal API routes, Use cases, DTOs, Interfaces, Classes, Partial classes, Extension methods, Top-level statements |
| TypeScript / React | `TypeScriptAdapter` + tree-sitter | Routes, API calls (fetch/axios) |
| JSON / YAML / SQL / Dockerfile / Terraform | `StructuredFileAdapter` | Config extraction |

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
| `OPENROUTER_API_KEY` | No | Enables AI enrichment in stage 06 |

---

## Development

```bash
npm install
npm run build        # tsc compile
npm run dev          # run CLI via tsx (no build needed)
npm run serve:mcp    # MCP server via tsx
npm test             # vitest
npm run typecheck    # tsc --noEmit
```
