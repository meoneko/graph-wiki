# Exec Plan

## Goal

Establish the type foundation for the architecture review feature so all analyzers share a common contract.

## Scope

In scope:

- Create directory structure.
- Define all shared interfaces and type unions.
- Re-export relevant existing types.

Out of scope:

- Implementation logic.
- Tests beyond typecheck.
- Runtime validation.

## Risk Classification

Risk flags:

- None (types only, no behavior change).

Hard gates:

- None.

## Work Phases

1. Create directories.
2. Define types in `types.ts`.
3. Verify `npm run typecheck` passes.

## Stop Conditions

None — this is a zero-risk foundation task.
