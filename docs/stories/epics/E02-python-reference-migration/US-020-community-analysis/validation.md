# Validation

## Proof Strategy

Verify community division precision and fallback reliability using mock graph structures representing giant components.

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Test splitting sub-routines over a mock 60-node linear component. Assert sub-community sizes remain under 50. Verify folder fallback logic yields clean namespaces. |
| **Integration** | Execute the community builder on complex multi-repo schemas and verify no community escapes boundary limits. |

## Commands

```bash
npm run test src/core/graph/analysis/__tests__/CommunitySplitting.test.ts
```

## Acceptance Evidence

Pending implementation.
