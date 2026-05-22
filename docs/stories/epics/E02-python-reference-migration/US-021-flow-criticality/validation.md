# Validation

## Proof Strategy

Execute unit tests verifying scoring scaling and run integration workflows verifying affected flow mapping over multiple simulated changes.

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Verify criticality score returns 'critical' for a flow containing database updates and external services. Verify normalization limits score bloat. |
| **Integration** | Modify a simulated utility file in the test suite and verify `get_affected_flows` resolves all transaction lines depending on it. |

## Commands

```bash
npm run test src/core/graph/analysis/__tests__/FlowCriticality.test.ts
```

## Acceptance Evidence

Pending implementation.
