# Overview

## Current Behavior

Currently, community detection (`detectCommunities()` in `src/core/graph/analysis/community.ts`) relies on static connected-component groups. On very large repositories, this can produce giant communities (oversized components) containing hundreds of symbols, making them completely unreadable and useless for AI agents seeking granular module coupling insights. Additionally, there is no structural fallback if community algorithms fail due to disconnected graph fragments.

## Target Behavior

Implement a robust **Community Fallback and Splitting** algorithm.
1. **Adaptive Splitting**: If a detected community exceeds a maximum size threshold (e.g. 50 nodes), automatically execute a secondary partitioning pass (e.g. edge-betweenness centrality or folder-nested subdivisions) to split it into smaller, cohesive sub-communities.
2. **Deterministic Fallback**: If the graph is entirely disjointed or the algorithm yields poor partitioning, fall back gracefully to a folder-structure-based grouping (e.g. `src/controllers`, `src/services`), ensuring AI agents always receive structured community groupings.

## Affected Users

- AI Agents querying module coupling or community boundaries via `list_communities` or `get_community`.
- Developers analyzing structural coupling.

## Affected Product Docs

- `SPEC.md` Section 15 (Community Detection & Graph Metrics)

## Non-Goals

- Dynamically refactoring code folders automatically based on communities.
