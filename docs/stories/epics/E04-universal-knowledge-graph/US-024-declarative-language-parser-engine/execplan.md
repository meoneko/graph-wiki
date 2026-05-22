# Exec Plan

## Goal

Provide a robust configuration-driven system that parses multiple target languages using unified tree-sitter DSL queries.

## Scope

- **In Scope**:
  - `LanguageRules` configuration schemas.
  - Implement `DeclarativeTreeSitterParser` under `src/scanner/core/`.
  - Add native query configuration files for `python` (first migrated language slice).
  - Register the new parser in the parser factory dynamically based on file extensions.
- **Out of Scope**:
  - Rewriting existing C# or TypeScript imperative parsers (they remain untouched).

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Native tree-sitter binary dependencies on Windows.
- **Mitigation**:
  - Fall back gracefully to simple pattern extraction if WASM tree-sitter grammar loading fails.

## Work Phases

1. **Phase 1: Architecture**: Define core types and the generic parsing engine.
2. **Phase 2: Execution**: Execute node/edge mapping logic against query files.
3. **Phase 3: Integration**: Register extensions `.py` and bind it to the Python grammar bindings.
4. **Phase 4: Validation**: Verify correctness using unit tests.
