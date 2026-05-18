# Exec Plan

## Goal

Classify dead code by type and connectivity, compute module-level ratios.

## Scope

In scope:

- Type-based classification.
- Entrypoint exclusion.
- Test-only reachable detection.
- Module dead code ratio computation and flagging.

Out of scope:

- Modifying `findDeadCode()`.
- Code deletion suggestions.

## Risk Classification

Risk flags: None.

Hard gates: None.

## Work Phases

1. Implement `DeadCodeClassifier`.
2. Write unit tests for classification, exclusion, ratio.
3. Verify typecheck and tests pass.

## Stop Conditions

None expected.
