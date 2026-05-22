# Overview

## Current Behavior

Currently, parsers in CRG (e.g., `CSharpParser.ts`, `TypeScriptTreeSitterParser.ts`) write manual imperative AST tree-traversals to extract classes, methods, fields, imports, and caller relationships. This approach requires substantial duplicate boilerplate for each new language, making it highly labor-intensive to add support for sibling languages such as Go, Python, or Rust.

## Target Behavior

Introduce a generic, configuration-driven parser adapter `DeclarativeTreeSitterParser` implementing the existing `ILanguageParser` interface. This parser reads standard tree-sitter `.scm` query files (representing node configurations, parent/child relationships, symbol definitions, and invocation calls) to map AST nodes to standard knowledge graph `GraphNode` and `GraphEdge` arrays. Adding a new language will no longer require writing TypeScript classes; it will simply require adding declarative Tree-sitter query configurations (`LanguageRules`).

## Affected Users

- Developer agents working to add language support to the scanner pipeline.
- Developers scanning multi-language codebases (Go, Rust, Python) which will be processed correctly and seamlessly.

## Affected Product Docs

- `SPEC.md` Section 14 (Parsing Infrastructure)
- `docs/ARCHITECTURE.md` (Scanner layer contracts)

## Non-Goals

- Completely removing existing imperative parsers in this story (they will coexist alongside the declarative engine).
- Embedding custom runtime expression evaluators in tree-sitter templates (only standard query mappings are supported).
