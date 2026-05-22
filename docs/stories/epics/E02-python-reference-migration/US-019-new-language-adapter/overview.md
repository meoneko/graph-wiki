# Overview

## Current Behavior

The knowledge graph supports only C# (via `CSharpAdapter`) and TypeScript/TSX (via
`TypeScriptAdapter`) as first-class parsed languages. Projects written in other languages
(Python, Java, Go, etc.) produce zero canonical nodes — they are invisible to the graph.
The adapter registry (`src/pipeline/adapters/registry.ts`) is designed to be extensible
but no additional adapters have been implemented.

## Target Behavior

This story delivers two outputs:

1. **Adapter roadmap** (`docs/migration/adapter-roadmap.md`): documents which languages
   are candidates for adapter implementation, in priority order, with complexity estimates.

2. **First new adapter**: implements one language slice from the roadmap (recommended:
   **Java** — common in enterprise alongside C#, has mature tree-sitter grammar, similar
   class/method structure to C#). The Java adapter extracts:
   - `@RestController` / `@Controller` annotated classes → `java_controller` nodes
   - `@Service` annotated classes → `java_service` nodes
   - `@Repository` annotated classes → `java_repository` nodes
   - Public methods in the above classes → candidate for later story (scoped like C# US-001)

## Affected Users

- Teams with mixed-language codebases (Java backend + TypeScript frontend)
- Organizations standardizing on `code-review-graph` across multiple tech stacks

## Affected Product Docs

- `README.md` — add Java to supported languages table
- `knowledge.config.yaml.example` — add Java project example
- `docs/migration/adapter-roadmap.md` — new file

## Non-Goals

- No Java method-level extraction (mirrors the C# starting point — classes only)
- No Python, Go, or Kotlin adapters in this story (roadmap documents them)
- No framework detection beyond Spring annotations
