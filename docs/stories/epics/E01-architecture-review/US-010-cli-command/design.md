# Design

## Domain Model

New CallerIDs in OperationResolver:
- `'cli.review-architecture'` → `'wiki'`
- `'mcp.architecture.review'` → `'wiki'`
- `'mcp.architecture.findings'` → `'wiki'`

## Application Flow

CLI if-block in `src/cli/index.ts`:
```typescript
if (command === 'review-architecture') {
  const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? workspace);
  const mode = (parseFlag(rest, '--mode') ?? 'authoritative') as QueryMode;
  const outputPath = parseFlag(rest, '--output');
  // ... instantiate engine, run review, write report, print output
}
```

## Interface Contract

```bash
crg review-architecture [workspace] [--workspace <id>] [--mode <mode>] [--output <path>] [--json] [--fail-on-critical]
```

- Default: human-readable summary (counts + top findings)
- `--json`: full JSON output
- `--fail-on-critical`: exit code 1 if critical findings exist
- `--output`: custom report file path

## Data Model

N/A.

## UI / Platform Impact

Terminal output.

## Observability

Standard pipeline logging.

## Alternatives Considered

1. Subcommand `crg architecture review` — rejected, flat command is simpler and matches existing pattern.
