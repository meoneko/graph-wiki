# Validation

## Proof Strategy

Validate context-packing constraints using mock graph configurations representing oversized code structures.

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Verify approximate token counts are within 5% error margin. Verify sorting logic by centrality. |
| **Integration** | Inject 50 overlapping symbol nodes into the context builder. Request a budget of 2000 tokens. Ensure the output strictly respects the budget while keeping highly central entry points. |

## Commands

```bash
npm run test src/pipeline/__tests__/AgentContextBuilder.test.ts
```

## Acceptance Evidence

Pending implementation.
