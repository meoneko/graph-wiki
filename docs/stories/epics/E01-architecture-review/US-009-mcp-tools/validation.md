# Validation

## Proof Strategy

Unit tests verify tool registration, invocation, and error responses.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Tools registered; invocation returns QueryResult; severity filter works; invalid workspace returns error code |
| Integration | N/A |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Mock TrustedQueryService.
- Valid and invalid workspace IDs.

## Commands

```bash
npx vitest run src/mcp/tools/__tests__/architecture.test.ts
npm run typecheck
```

## Acceptance Evidence

Pending implementation.
