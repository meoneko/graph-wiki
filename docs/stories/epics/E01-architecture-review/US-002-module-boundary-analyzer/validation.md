# Validation

## Proof Strategy

Unit tests verify module partitioning correctness, score bounds, and threshold flagging.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Module partitions all nodes; coupling in [0,1]; cohesion in [0,1]; flagging at thresholds; single-node cohesion = 1.0 |
| Integration | N/A |
| E2E | N/A |
| Platform | N/A |
| Performance | N/A |
| Logs/Audit | N/A |

## Fixtures

- Generated `GraphNode[]` with varied `source_file` paths.
- Generated module pairs with known edge counts.

## Commands

```bash
npx vitest run src/core/graph/analysis/architecture/__tests__/ModuleBoundaryAnalyzer.test.ts
npm run typecheck
```

## Acceptance Evidence

Pending implementation.
