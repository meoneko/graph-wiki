# Overview

## Current Behavior

`detectCommunities()` computes cohesion scores. `deriveDomain()` in `flows.ts` groups nodes by domain. No module-level coupling analysis exists.

## Target Behavior

`ModuleBoundaryAnalyzer` identifies modules from graph nodes and computes coupling/cohesion scores. Flags high coupling (>0.7) and low cohesion (<0.3) as findings.

## Affected Users

- Developers reviewing architecture health.
- AI agents receiving coupling/cohesion findings.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §ModuleBoundaryAnalyzer

## Non-Goals

- Does not replace `detectCommunities()` — reuses it.
- Does not modify existing graph data.
