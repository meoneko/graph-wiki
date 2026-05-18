# Overview

## Current Behavior

`computeFlows()` derives flow domains and membership. `TrustAwareQueryEngine.isEntrypoint()` identifies entrypoints. No flow-level quality assessment exists.

## Target Behavior

`FlowAssessor` evaluates architectural quality of business flows: complexity, entrypoint presence, module span, and dead branches.

## Affected Users

- Developers assessing flow health.
- AI agents receiving flow complexity findings.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §FlowAssessor

## Non-Goals

- Does not modify flow computation logic.
- Does not suggest flow refactoring.
