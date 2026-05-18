# Exec Plan

## Goal

Implement module identification and coupling/cohesion scoring with threshold-based flagging.

## Scope

In scope:

- Module identification from node `source_file` paths.
- Coupling score computation between module pairs.
- Cohesion score from community data.
- Threshold-based finding generation.

Out of scope:

- Modifying existing `detectCommunities()`.
- Persisting module data.

## Risk Classification

Risk flags:

- Existing behavior (reuses `deriveDomain()` pattern).

Hard gates:

- None.

## Work Phases

1. Implement `ModuleBoundaryAnalyzer` class.
2. Write unit tests for partitioning, bounds, and flagging.
3. Verify typecheck and tests pass.

## Stop Conditions

None expected.
