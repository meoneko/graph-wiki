# Validation

## Proof Strategy

Integration tests verify CLI invocation, output formats, and exit codes.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | CallerIDs resolve correctly in OperationResolver |
| Integration | CLI outputs human-readable summary; --json outputs valid JSON; --fail-on-critical exits 1 when critical; --output writes to path |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Workspace with known graph data.
- Workspace with critical findings.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/cli.test.ts
npm run typecheck
node dist/cli/index.js review-architecture --help
```

## Acceptance Evidence

Pending implementation.
