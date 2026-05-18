# Design

## Domain Model

- **Module identification**: Reuses `deriveDomain()` pattern — check `node.domain`, then `node.metadata.derived_domain`, then parse `source_file` path.
- **Cohesion**: Reuses `Community.cohesion` from `detectCommunities()`.
- **Coupling**: `crossEdges(A, B) / (totalEdges(A) + totalEdges(B))`.
- **Edge case**: Single-node module returns cohesion 1.0.

## Application Flow

```typescript
class ModuleBoundaryAnalyzer {
  analyze(
    nodes: GraphNode[],
    edges: GraphEdge[],
    communities: Community[],
    thresholds?: { highCoupling?: number; lowCohesion?: number }
  ): ModuleBoundaryResult;
}
```

## Interface Contract

Input: nodes, edges, communities (from `detectCommunities()`), optional thresholds.
Output: `ModuleBoundaryResult` with modules, couplingPairs, cohesionScores, findings.

## Data Model

N/A — pure computation, no persistence.

## UI / Platform Impact

None.

## Observability

Findings emitted as part of `ArchitectureReport`.

## Alternatives Considered

1. Compute cohesion from scratch — rejected, `detectCommunities()` already does this.
