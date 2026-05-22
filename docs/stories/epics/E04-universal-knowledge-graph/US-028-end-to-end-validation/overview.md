# Overview

## Current Behavior

Currently, validation tests in `TEST_MATRIX.md` only target typescript/dotnet workspaces independently. There is no automated framework verifying that a multi-language setup, coupled with local vector indices and declarative AST extraction, remains perfectly isolated across workspaces or doesn't degrade performance under concurrent pipelines.

## Target Behavior

Create an E2E multi-workspace regression testing harness. It sets up multiple mock projects of different languages (TS, Python, Go), executes `crg install` to configure mock client dirs, runs the full 12-stage pipeline concurrently across workspaces, triggers hybrid searches, and asserts:
1. Zero cross-workspace data contamination in the SQLite WAL databases.
2. Complete trust boundary filtering on all queried elements.
3. Stable memory usage under 250MB.

## Affected Users

- QA/DevOps pipelines certifying releases.
- AI agents verifying codebase consistency.

## Affected Product Docs

- `docs/TEST_MATRIX.md` (Integrates E04 validation rows)

## Non-Goals

- Simulating continuous internet disruptions.
