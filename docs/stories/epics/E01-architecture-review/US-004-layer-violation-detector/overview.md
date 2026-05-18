# Overview

## Current Behavior

No layer hierarchy enforcement exists in the analysis layer. The `EdgePolicyTable` enforces trust-based traversal rules but not architectural layering.

## Target Behavior

`LayerViolationDetector` enforces a configurable layer hierarchy. Detects skip-layer violations (warning) and reverse dependencies (critical). Includes source references in findings.

## Affected Users

- Developers enforcing clean architecture.
- CI pipelines checking layer discipline.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §LayerViolationDetector

## Non-Goals

- Does not modify `EdgePolicyTable` (that's trust policy, not architecture policy).
- Does not block graph builds — analysis only.
