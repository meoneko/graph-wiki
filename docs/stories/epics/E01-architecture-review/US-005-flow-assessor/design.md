# Design

## Domain Model

For each `FlowSummary`:
1. Node count = `flow.nodeIds.length`
2. Module span = unique modules from `deriveDomain()` on flow nodes
3. Entrypoint check = same logic as `TrustAwareQueryEngine.isEntrypoint()`
4. Dead branches = nodes with no outgoing edges that aren't terminal

Thresholds:
- >10 nodes → `high_complexity_flow`
- No entrypoint → `missing_entrypoint` (warning)
- >3 modules → `cross_module_flow`

## Application Flow

```typescript
class FlowAssessor {
  assess(
    nodes: GraphNode[],
    edges: GraphEdge[],
    flows: FlowSummary[],
    thresholds?: { highComplexity?: number }
  ): FlowAssessmentResult;
}
```

## Interface Contract

Input: nodes, edges, flows (from `computeFlows()`), optional thresholds.
Output: `FlowAssessmentResult` with assessments and findings.

## Data Model

N/A.

## UI / Platform Impact

None.

## Observability

Findings in `ArchitectureReport.findings[]`.

## Alternatives Considered

1. Inline flow assessment in `computeFlows()` — rejected, separation of concerns.
