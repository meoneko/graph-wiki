# Design

## Domain Model

Two tools following existing patterns:

1. `architecture_review` — full review
2. `get_architecture_findings` — filtered findings

## Application Flow

```typescript
// src/mcp/tools/architecture.ts
export function registerArchitectureTools(): void {
  registerTool({ name: 'architecture_review', ... });
  registerTool({ name: 'get_architecture_findings', ... });
}
```

Called from `registerAllTools()` in `src/mcp/tools/index.ts`.

## Interface Contract

**architecture_review**:
- Input: `{ workspaceId: string, mode?: QueryMode, config?: { highCoupling?, lowCohesion?, highComplexity?, includeExploratory? } }`
- Output: `QueryResult` with `ArchitectureReport` in metadata

**get_architecture_findings**:
- Input: `{ workspaceId: string, severity?: Severity, mode?: QueryMode }`
- Output: `QueryResult` with filtered findings

## Data Model

N/A.

## UI / Platform Impact

New tools visible in Claude Desktop tool list.

## Observability

Standard TrustEventEmitter events via query engine path.

## Alternatives Considered

1. Single tool with `action` parameter — rejected, two tools is clearer for AI consumers.
