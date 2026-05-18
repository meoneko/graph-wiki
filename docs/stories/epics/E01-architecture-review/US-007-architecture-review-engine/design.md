# Design

## Domain Model

Orchestration pipeline:
1. `getVisibleGraph(operation, mode)` — trust-filtered graph
2. `computeGraphMetrics()` — orphans, hotspots, bridges
3. `detectCommunities()` — cohesion/coupling
4. `computeFlows()` — domain grouping
5. Each analyzer receives enriched data
6. Aggregate findings → summary → recommendations
7. Return `QueryResult` via `QueryResultFactory.create()`

Confidence annotation:
- All canonical edges → `high`
- Any derived → `medium`
- Any exploratory → `low`

## Application Flow

```typescript
class ArchitectureReviewEngine {
  constructor(queryService: TrustedQueryService, config?: ArchitectureReviewConfig);
  async review(workspaceId: string, mode?: QueryMode): Promise<QueryResult>;
  async getFindings(workspaceId: string, mode?: QueryMode, severity?: Severity): Promise<QueryResult>;
}
```

Uses `OperationResolver.resolve({ caller: 'cli.review-architecture' })` → `'wiki'`.

## Interface Contract

- `review()` returns full `QueryResult` with `ArchitectureReport` in `metadata.report`.
- `getFindings()` returns filtered findings subset.
- Empty graph → valid empty report (graceful degradation).
- Missing flows → info finding.

## Data Model

N/A — orchestration only.

## UI / Platform Impact

None directly (consumed by MCP/CLI in later stories).

## Observability

TrustEventEmitter receives events via normal query engine path.

## Alternatives Considered

1. Make each analyzer a standalone CLI command — rejected, unified report is more useful.
