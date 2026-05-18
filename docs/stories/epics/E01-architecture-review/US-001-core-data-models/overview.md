# Overview

## Current Behavior

No architecture review types exist. The graph has `GraphNode`, `GraphEdge`, `Community`, `FlowSummary` but no architecture-specific finding or report types.

## Target Behavior

A shared type module at `src/core/graph/analysis/architecture/types.ts` exports all interfaces needed by the architecture review feature: `Finding`, `FindingType`, `Severity`, `ArchitectureReport`, `Recommendation`, `ModuleInfo`, `CouplingPair`, `DeadCodeEntry`, `FlowAssessment`, `LayerViolation`, `DependencyCycle`, and `ArchitectureReviewConfig`.

Directory structure created:
- `src/core/graph/analysis/architecture/`
- `src/core/graph/analysis/architecture/analyzers/`
- `src/core/graph/analysis/architecture/__tests__/`

## Affected Users

- Developers consuming architecture review output
- AI agents receiving `ArchitectureReport` in `QueryResult.metadata`

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §Data Models

## Non-Goals

- No implementation logic — types only.
- No runtime validation (Zod schemas come later in MCP tools).
