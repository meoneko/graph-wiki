# Design

## Domain Model

- **Default hierarchy**: `[mcp, cli]` (0) → `core` (1) → `pipeline` (2) → `storage` (3) → `scanner` (4)
- **Custom config**: `LayerConfig` with `hierarchy: string[]` and `aliases?: Record<string, string>`
- **Layer determination**: Same `deriveDomain()` pattern from source_file path.
- **Edge filter**: Only `calls` and `invokes` edges; exclude exploratory `graph_kind`.

Classification:
- Skip-layer (>1 layer downward): `warning`
- Reverse dependency (lower → higher): `critical`
- Single-layer downward: no violation

## Application Flow

```typescript
class LayerViolationDetector {
  constructor(layerConfig?: LayerConfig);
  detect(nodes: GraphNode[], edges: GraphEdge[]): LayerViolationResult;
}
```

## Interface Contract

Input: nodes, edges (pre-filtered by trust).
Output: `LayerViolationResult` with violations array and findings.
Each finding includes `edge.metadata?.line`, `edge.metadata?.column`, source node's `source_file`.

## Data Model

N/A.

## UI / Platform Impact

None.

## Observability

Findings in `ArchitectureReport.findings[]`.

## Alternatives Considered

1. Hardcode layer rules in EdgePolicyTable — rejected, architecture analysis should be separate from trust policy.
