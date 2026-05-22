# Exec Plan

## Goal

Provide a highly reliable and readable community detection engine that prevents information overload and ensures logical groupings.

## Scope

- **In Scope**:
  - Implement edge-betweenness centrality sub-partitioning logic.
  - Implement directory path-based fallback resolver.
  - Integrate threshold controls (`max_community_size`) in `knowledge.config.yaml`.
- **Out of Scope**:
  - Compiling heavy multi-threaded C++ graph libraries.

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Edge-betweenness calculation complexity is $O(V \cdot E)$, which can be slow on very large graphs (>5000 nodes).
- **Mitigation**:
  - Apply the sub-partitioning ONLY to communities flagged as oversized, not the entire graph, capping runtimes.

## Work Phases

1. **Phase 1**: Code the pure JS community-splitting utilities.
2. **Phase 2**: Implement the folder-structure namespace fallback resolver.
3. **Phase 3**: Refactor `detectCommunities` inside `src/core/graph/analysis/community.ts`.
4. **Phase 4**: Add vitest benchmarks and validation tests.
