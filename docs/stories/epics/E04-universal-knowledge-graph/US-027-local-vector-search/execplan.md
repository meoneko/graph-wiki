# Exec Plan

## Goal

Provide a robust local-first hybrid search capability that operates within sub-millisecond ranges and respects workspace isolation boundaries.

## Scope

- **In Scope**:
  - Embedding tables in `GraphDB.ts`.
  - Integrator for `@xenova/transformers` (local ONNX runtime loading `nomic-embed-text`).
  - Pipeline Stage `05c_build_exploratory.ts` generating and storing embeddings for class/method nodes.
  - Hybrid search query integration.
- **Out of Scope**:
  - Multi-gigabyte model binaries (only < 100MB compact models are permitted).

## Risk Classification

- **Lane**: High-Risk.
- **Risks**:
  - sqlite-vss pre-compiled binaries are notoriously difficult to load reliably across Windows/macOS/Linux Node environments.
- **Mitigation**:
  - Gracefully fallback to character-distance or pure JavaScript cosine calculations on raw Float32 arrays if `sqlite-vss` extension loading fails at runtime.

## Work Phases

1. **Phase 1: Database Setup**: Add tables, indices, and schema migrations.
2. **Phase 2: Local Model Loader**: Integrate transformers.js to download/cache the ONNX embedding model locally.
3. **Phase 3: Pipeline Integration**: Compute embeddings incrementally in the exploratory stage.
4. **Phase 4: Hybrid Search Engine**: Write scoring formulas and hook them to the query runner.
