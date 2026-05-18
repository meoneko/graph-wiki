# Validation

## Proof Strategy

Unit tests verify threshold flagging and detection logic.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | High complexity iff >10 nodes; missing entrypoint iff none; cross module iff >3; dead branches detected |
| Integration | N/A |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Flows with varied node counts and module distributions.
- Flows with/without entrypoints.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/FlowAssessor.test.ts
npm run typecheck
```

## Acceptance Evidence

Pending implementation.
