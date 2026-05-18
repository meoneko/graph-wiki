# Design

## Domain Model

- **Module-level adjacency**: Built from `calls`, `invokes`, `imports` edges only.
- **Edge filtering**: Exclude `graph_kind === 'exploratory'`.
- **Algorithm**: Tarjan's SCC — O(V+E) complexity.
- **Severity**: >3 modules = `critical`, 2–3 modules = `warning`.

## Application Flow

```typescript
class CycleDetector {
  detect(nodes: GraphNode[], edges: GraphEdge[]): CycleDetectionResult;
}

interface DependencyCycle {
  modules: string[];
  edgeTypes: string[];
  severity: 'critical' | 'warning';
}
```

## Interface Contract

Input: full node/edge arrays (pre-filtered by trust via `getVisibleGraph()`).
Output: `CycleDetectionResult` with cycles array and findings.

## Data Model

N/A — pure computation.

## UI / Platform Impact

None.

## Observability

Cycle findings included in `ArchitectureReport.findings[]`.

## Alternatives Considered

1. Johnson's algorithm (all cycles) — rejected, SCC is sufficient for module-level detection and more efficient.
