# Overview

## Current Behavior

CLI has 18 commands. No `review-architecture` command exists. OperationResolver has 42 CallerIDs but none for architecture review.

## Target Behavior

- `crg review-architecture` command added following existing if-block pattern.
- 3 new CallerIDs registered in OperationResolver (all → `'wiki'`).
- Human-readable summary by default, JSON with `--json`, CI exit code with `--fail-on-critical`.

## Affected Users

- Developers running architecture review from terminal.
- CI pipelines checking architecture health.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §CLI Command, §OperationResolver Updates

## Non-Goals

- Does not add interactive mode.
- Does not add watch mode for architecture.
