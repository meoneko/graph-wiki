# Exec Plan

## Goal

Enable structural context packing that respects strict token boundaries without sacrificing essential code relationships.

## Scope

- **In Scope**:
  - Centrality scoring of nodes within `TrustAwareQueryEngine`.
  - Token-boundary mapping inside `AgentContextBuilder.ts`.
  - Adding `tokenBudget` configuration parameter inside `knowledge.config.yaml`.
- **Out of Scope**:
  - Compiling multi-threading Tokenizers.

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Underestimating token counts could still trigger LLM context truncation on strict APIs.
- **Mitigation**:
  - Apply a safety buffer of 10% on calculated token capacities.

## Work Phases

1. **Phase 1**: Implement approximation tokenizer utilities.
2. **Phase 2**: Add scoring weights based on degree centrality to the query engine.
3. **Phase 3**: Refactor `AgentContextBuilder` to pack blocks within limits.
4. **Phase 4**: Add test coverage verifying budgeting constraints.
