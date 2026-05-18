# Exec Plan

## Goal

Detect layer hierarchy violations with configurable rules and source references.

## Scope

In scope:

- Default 5-layer hierarchy.
- Custom LayerConfig support.
- Skip-layer and reverse dependency detection.
- Source reference preservation in findings.

Out of scope:

- Modifying EdgePolicyTable.
- Blocking graph builds.

## Risk Classification

Risk flags: None.

Hard gates: None.

## Work Phases

1. Implement `LayerViolationDetector`.
2. Write unit tests for direction/distance and source refs.
3. Verify typecheck and tests pass.

## Stop Conditions

None expected.
