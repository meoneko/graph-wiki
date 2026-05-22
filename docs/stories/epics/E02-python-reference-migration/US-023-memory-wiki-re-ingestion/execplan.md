# Exec Plan

## Goal

Provide a safe, idempotent feedback loop where manual annotations and agent reflections are safely re-ingested into the graph database without mutating canonical structures.

## Scope

- **In Scope**:
  - `external_memory` SQLite schema migration.
  - Markdown AST parser that isolates YAML frontmatter and HTML comments.
  - Integration of the re-ingestion worker prior to the `02_extract` pipeline stage.
  - Hooking `external_memory` facts into `TrustAwareQueryEngine` as metadata.
- **Out of Scope**:
  - Automatically committing annotated files to remote git repositories.

## Risk Classification

- **Lane**: High-Risk.
- **Risks**:
  - Risk of feedback loops where hallucinated AI facts are re-ingested, treated as truth, and used to generate worse hallucinations.
- **Mitigation**:
  - **Trust Gating**: Re-ingested facts carrying `author: 'agent'` are strictly filtered under the `authoritative` query mode. Only manual `author: 'human'` reviews can be treated with high confidence.

## Work Phases

1. **Phase 1: DB Migration**: Establish the SQLite database schema and indexes.
2. **Phase 2: Markdown AST Parser**: Develop robust regex/AST scanners that parse frontmatter safely without crashing on corrupted files.
3. **Phase 3: Pipeline Integration**: Hook the parser into the synchronization stage of the pipeline runner.
4. **Phase 4: Trust Gates Integration**: Update the query engine and `WikiBuilder` to read and render these persistent annotations.
