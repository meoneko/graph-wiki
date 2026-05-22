# Validation

## Proof Strategy

Unit tests verify cycle detection correctness and severity classification.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Valid cycles reported; DAGs produce zero cycles; severity >3=critical, 2-3=warning; only calls/invokes/imports edges used; exploratory excluded |
| Integration | N/A |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Random directed module-level dependency graphs.
- Known DAGs (zero cycles expected).
- Known cycles of various lengths.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/CycleDetector.test.ts
npm run typecheck
```

## Acceptance Evidence

Implemented via `.kiro/specs/codebase-review/tasks.md` — all 46 tasks completed.
