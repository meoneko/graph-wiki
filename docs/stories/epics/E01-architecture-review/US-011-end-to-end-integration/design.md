# Design

## Domain Model

Integration wiring:
- `ArchitectureReviewEngine` instantiated with `TrustedQueryService` in MCP and CLI.
- `ArchitectureReportWriter` called after `review()`.
- `registerArchitectureTools()` called in `registerAllTools()`.
- Error handling: workspace not found, DB read failure, report write failure.

## Application Flow

MCP path: `registerArchitectureTools()` → tool handler → `ArchitectureReviewEngine.review()` → `ensureQueryResult()`

CLI path: `review-architecture` if-block → `ArchitectureReviewEngine.review()` → `ArchitectureReportWriter.write()` → print summary

## Interface Contract

All existing contracts from US-007 through US-010 verified end-to-end.

## Data Model

N/A.

## UI / Platform Impact

None beyond what US-009 and US-010 define.

## Observability

Verify TrustEventEmitter receives events through the full path.

## Alternatives Considered

N/A — integration story.
