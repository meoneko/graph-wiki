# E03 — Partial Class Support

## Goal

Enable the knowledge graph to correctly model C# partial classes — a common pattern in
enterprise codebases (e.g. EF Core entities, ASP.NET controllers split across files,
auto-generated scaffolding). Without this, methods declared in one part of a partial class
are invisible in the graph, and cross-file class identity is lost.

## Problem Statement

The C# tree-sitter parser extracts each `partial class` declaration as a separate node
per file. A class split across N files produces N disconnected nodes. Consequence:

1. Methods declared in `Blaze.cs (partial class Orders)` are not extracted because the
   parser's method filter only catches HTTP annotations and UseCase patterns — generic
   `public bool SomeMethod()` declarations are silently dropped.
2. Even if methods were extracted, each partial fragment has its own `stable_key` (which
   includes the file path), so `Orders` in `Blaze.cs` and `Orders` in `OrdersSeed.cs` are
   two different graph nodes with no relationship.
3. No `contains` edges exist between class nodes and method nodes anywhere in the graph.

## Solution Architecture

Three independent, stackable tiers delivered as separate user stories:

| Tier | Story | What it adds | Lane |
|---|---|---|---|
| 1 | US-001 | Config-driven method extraction for all partial class methods | normal |
| 2 | US-002 | Derived-layer partial class identity merge via `virtual_class` nodes | high-risk |
| 3 | US-003 | `contains` edge materialization from `lang_meta.containingClass` | normal |

Each tier is independently deployable. US-003 depends on US-001 (methods must exist to
connect), but not on US-002 (connects to per-file class nodes if US-002 is absent).

## Design Principle

- **Trust layering preserved**: canonical parser output is never mutated. Merges happen
  in the derived layer (stage 05b) as `virtual_class` nodes and `is_partial_of` edges.
- **Incremental-safe**: no new hashing semantics. `stable_key` unchanged.
- **Opt-in extraction**: method extraction is gated by `extract_partial_methods: true`
  in `knowledge.config.yaml` to avoid node-count explosion on large codebases.

## Surfaces Changed

| Surface | US-001 | US-002 | US-003 |
|---|---|---|---|
| `src/scanner/languages/csharp/CSharpParser.ts` | yes | no | no |
| `src/core/nodeTypeRegistry.ts` | yes | yes | no |
| `src/pipeline/stages/05b_build_derived.ts` | no | yes | yes |
| `knowledge.config.yaml` schema | yes | no | no |
| MCP tool output | indirect | yes | yes |

## Candidate Stories

| Story | Title | Status |
|---|---|---|
| US-001 | Partial class method extraction | planned |
| US-002 | Derived partial class identity merge | planned |
| US-003 | Contains edge materialization | planned |

## Exit Criteria

- `Blaze_CSV_Output` method is a queryable graph node reachable via `contains` from its
  partial class fragment node (US-001 + US-003 minimum)
- Graph query `crg ask "show methods of Orders"` returns results from all partial files
  when US-002 is active (virtual_class node connected to all fragments)
- `npm run typecheck` passes with zero errors
- `npm test` passes

## Trust and Query Mode Behavior

`virtual_class` nodes and `is_partial_of` edges carry `confidence_band: 'INFERRED'` and
`graph_kind: 'derived'`. The existing `EdgePolicyTable` handles trust filtering:

- **authoritative** mode: derived edges excluded → `virtual_class` not reachable (Req 7.4)
- **mixed_safe** / **exploratory** mode: derived edges included → `virtual_class` reachable
  from its Fragment_Nodes and via `contains` edges to its Method_Nodes (Req 7.3)

`csharp_method` nodes are canonical (`isCanonical: true`) and are visible in all modes.

## Spec Source

- Requirements document: `E03-partial-class-support` requirements (2026-05-18)
- Initial analysis: Blaze.cs partial class tracing case (conversation thread 2026-05-18)
