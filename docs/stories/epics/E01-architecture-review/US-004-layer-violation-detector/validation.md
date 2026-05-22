# Validation

## Proof Strategy

Unit tests verify direction/distance classification and source reference preservation.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Skip-layer for >1 down; reverse for upward; no violation for 1 down; source refs preserved; custom config overrides default |
| Integration | N/A |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Edges between nodes in different layers (known positions).
- Canonical edges with `source_file` and `metadata.line`.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/LayerViolationDetector.test.ts
npm run typecheck
```

## Acceptance Evidence

Implemented via `.kiro/specs/codebase-review/tasks.md` — all 46 tasks completed.
