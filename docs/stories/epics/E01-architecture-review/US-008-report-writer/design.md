# Design

## Domain Model

Simple file writer following existing report patterns.

## Application Flow

```typescript
class ArchitectureReportWriter {
  write(workspaceId: string, report: ArchitectureReport, outputPath?: string): string;
}
```

## Interface Contract

- Default path: `knowledge/reports/{workspace}/architecture.json`
- Custom path via `outputPath` parameter.
- Returns the path written to.
- Pretty-printed JSON (2-space indent).
- `mkdirSync({ recursive: true })` for directory creation.

## Data Model

Output: JSON file on disk.

## UI / Platform Impact

None.

## Observability

None.

## Alternatives Considered

1. Extend ReportBuilder with `writeArchitectureReport()` — acceptable alternative, but separate class is simpler and follows single-responsibility.
