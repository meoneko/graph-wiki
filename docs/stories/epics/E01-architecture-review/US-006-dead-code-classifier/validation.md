# Validation

## Proof Strategy

Unit tests verify classification correctness, exclusion rules, and ratio flagging.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Correct classification by type; entrypoints never in findings; test-only detected; ratio flagged iff > 0.2 |
| Integration | N/A |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Orphan nodes of various types.
- Entrypoint and controller_action nodes with no incoming edges.
- Nodes with only test-file incoming edges.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/DeadCodeClassifier.test.ts
npm run typecheck
```

## Acceptance Evidence

Implemented via `.kiro/specs/codebase-review/tasks.md` — all 46 tasks completed.
