# Exec Plan

## Goal

Register architecture review MCP tools following existing patterns.

## Scope

In scope:

- Create `src/mcp/tools/architecture.ts`.
- Register both tools with Zod validation.
- Add to `registerAllTools()`.
- Handle workspace not found errors.

Out of scope:

- Engine implementation (US-007).
- CLI (US-010).

## Risk Classification

Risk flags:

- Public contracts (MCP tool interface visible to AI consumers).

Hard gates: None.

## Work Phases

1. Create tool file following `review.ts` pattern.
2. Register in index.
3. Write unit tests for registration and error handling.
4. Verify typecheck and tests pass.

## Stop Conditions

None expected.
