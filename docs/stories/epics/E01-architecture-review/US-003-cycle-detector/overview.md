# Overview

## Current Behavior

No module-level cycle detection exists. `computeGraphMetrics()` computes bridges (cross-domain edges) but does not detect circular dependencies.

## Target Behavior

`CycleDetector` uses Tarjan's SCC algorithm to find strongly connected components at the module level. Reports each SCC with >1 module as a dependency cycle with severity classification.

## Affected Users

- Developers identifying circular dependencies.
- CI pipelines using `--fail-on-critical`.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §CycleDetector

## Non-Goals

- Does not detect node-level cycles (only module-level).
- Does not suggest how to break cycles.
