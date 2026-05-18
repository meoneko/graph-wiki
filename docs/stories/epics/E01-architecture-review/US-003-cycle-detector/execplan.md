# Exec Plan

## Goal

Detect circular module dependencies using Tarjan's SCC with severity classification.

## Scope

In scope:

- Build module-level adjacency from calls/invokes/imports edges.
- Filter out exploratory edges.
- Implement Tarjan's SCC.
- Classify severity by cycle size.

Out of scope:

- Cycle-breaking suggestions.
- Node-level cycle detection.

## Risk Classification

Risk flags: None.

Hard gates: None.

## Work Phases

1. Implement `CycleDetector` with Tarjan's SCC.
2. Write unit tests: cycle correctness, DAG zero-cycles, severity.
3. Verify typecheck and tests pass.

## Stop Conditions

None expected.
