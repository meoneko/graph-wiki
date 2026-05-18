# Exec Plan

## Goal

Add CLI command and register CallerIDs for architecture review.

## Scope

In scope:

- Add CallerIDs to OperationResolver.
- Add `review-architecture` if-block to CLI.
- Support all flags: --workspace, --mode, --output, --json, --fail-on-critical.
- Human-readable summary output.

Out of scope:

- Engine implementation (US-007).
- MCP tools (US-009).

## Risk Classification

Risk flags:

- Existing behavior (modifies OperationResolver CallerID list).
- Public contracts (CLI interface).

Hard gates: None.

## Work Phases

1. Add CallerIDs to OperationResolver.
2. Add CLI if-block.
3. Implement human-readable summary printer.
4. Write integration tests for CLI invocation.
5. Verify typecheck and tests pass.

## Stop Conditions

None expected.
