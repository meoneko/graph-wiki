# Overview

## Current Behavior

`TrustAwareQueryEngine.findDeadCode()` identifies unreferenced nodes and excludes entrypoints. `computeGraphMetrics().orphans` provides orphan node IDs. No type-based classification or module-level ratio analysis exists.

## Target Behavior

`DeadCodeClassifier` extends dead code detection with richer classification: `potentially_dead_code`, `unused_component`, `test_only_reachable`. Computes per-module dead code ratio and flags modules exceeding 20%.

## Affected Users

- Developers identifying unused code.
- CI pipelines checking dead code ratios.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §DeadCodeClassifier

## Non-Goals

- Does not replace `findDeadCode()` — extends classification on top.
- Does not delete or modify code.
