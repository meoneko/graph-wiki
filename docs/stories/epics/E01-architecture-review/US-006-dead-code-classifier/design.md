# Design

## Domain Model

Classification rules:
- `function`/`method`/`usecase` orphans → `potentially_dead_code`
- `class`/`service` with no incoming calls/invokes/dispatches_to → `unused_component`
- All incoming edges from test files (`.test.`, `.spec.`, `/test/`) → `test_only_reachable` (info)

Exclusions:
- Entrypoints/controller_actions excluded (same `isEntrypoint()` logic)

Module ratio:
- Per-module dead code ratio = dead nodes / total nodes in module
- Flag `high_dead_code_ratio` if > 0.2

## Application Flow

```typescript
class DeadCodeClassifier {
  classify(
    nodes: GraphNode[],
    edges: GraphEdge[],
    orphanIds: string[]
  ): DeadCodeResult;
}
```

## Interface Contract

Input: nodes, edges, orphanIds (from `computeGraphMetrics().orphans`).
Output: `DeadCodeResult` with entries, moduleRatios, findings.

## Data Model

N/A.

## UI / Platform Impact

None.

## Observability

Findings in `ArchitectureReport.findings[]`.

## Alternatives Considered

1. Modify `findDeadCode()` directly — rejected, keep existing API stable.
