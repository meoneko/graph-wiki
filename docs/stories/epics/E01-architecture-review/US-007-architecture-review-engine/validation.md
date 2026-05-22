# Validation

## Proof Strategy

Unit tests for trust filtering and aggregation. Integration test for full pipeline.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Trust filtering excludes exploratory when disabled; confidence reflects trust level; summary counts match; severity filter works |
| Integration | Load graph → run review → verify report structure; empty graph → valid empty report; missing flows → info finding |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Graphs with mixed `graph_kind` edges.
- Empty graph.
- Graph without flow nodes.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/ArchitectureReviewEngine.test.ts
npm run typecheck
```

## Acceptance Evidence

Implemented via `.kiro/specs/codebase-review/tasks.md` — all 46 tasks completed.
