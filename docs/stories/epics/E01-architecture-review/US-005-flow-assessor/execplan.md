# Exec Plan

## Goal

Assess flow architectural quality with threshold-based flagging.

## Scope

In scope:

- Complexity assessment (node count).
- Entrypoint detection.
- Module span computation.
- Dead branch detection.

Out of scope:

- Modifying `computeFlows()`.
- Flow refactoring suggestions.

## Risk Classification

Risk flags: None.

Hard gates: None.

## Work Phases

1. Implement `FlowAssessor`.
2. Write unit tests for threshold flagging and detection.
3. Verify typecheck and tests pass.

## Stop Conditions

None expected.
