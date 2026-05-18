# Overview

## Current Behavior

Individual analysis functions exist (`computeGraphMetrics`, `detectCommunities`, `computeFlows`) but no orchestrator combines them into a unified architecture review.

## Target Behavior

`ArchitectureReviewEngine` orchestrates existing infrastructure and new analyzers into a single `review()` call that returns a complete `ArchitectureReport` wrapped in `QueryResult`.

## Affected Users

- All consumers of architecture review (MCP, CLI, reports).
- AI agents receiving structured architecture findings.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §ArchitectureReviewEngine

## Non-Goals

- Does not implement analyzers (those are US-002–006).
- Does not handle MCP/CLI wiring (those are US-009–010).
