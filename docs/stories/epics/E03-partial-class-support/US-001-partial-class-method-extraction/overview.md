# Overview

## Current Behavior

The C# tree-sitter parser (`CSharpParser.ts`) extracts methods from class declarations only
when they match specific filters: HTTP verb annotations (`[HttpGet]`, `[HttpPost]`, etc.),
UseCase naming patterns, or extension method signatures. Generic `public bool SomeMethod()`
declarations inside a `partial class` are silently dropped. This means methods like
`Blaze_CSV_Output` in `Blaze.cs` are never added to the knowledge graph.

## Target Behavior

When `extract_partial_methods: true` is set for a project in `knowledge.config.yaml`, the
parser extracts all public instance methods declared inside any `partial class`. Each method
becomes a `csharp_method` node in the knowledge graph with `lang_meta` containing the
containing class name, parameters, and return type.

The `csharp_method` node type is registered in `nodeTypeRegistry.ts`.

## Affected Users

- Developers using `crg ask` or MCP `query_graph` to find methods inside partial classes
- Blast-radius impact analysis that currently misses partial-class methods as affected nodes
- US-003 (contains edge materialization) — needs these method nodes to exist before it can
  create `contains` edges

## Affected Product Docs

- `knowledge.config.yaml.example` — add `extract_partial_methods` field with comment
- `SPEC.md` §CSharpAdapter — note partial method extraction

## Non-Goals

- No extraction from non-partial classes (too many methods → node explosion)
- No private/internal/protected method extraction (public surface only)
- No parameter-level graph nodes
- No call-graph inference (that belongs in a future cross-reference story)
