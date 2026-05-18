# Overview

## Current Behavior

`ReportBuilder` writes 8 report types to `knowledge/reports/{workspace}/`. No architecture-specific report exists.

## Target Behavior

`ArchitectureReportWriter` persists `ArchitectureReport` as JSON to `knowledge/reports/{workspace}/architecture.json`. Supports custom output path override.

## Affected Users

- CI pipelines consuming JSON reports.
- Developers reviewing architecture health over time.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §ArchitectureReportWriter

## Non-Goals

- Does not replace existing ReportBuilder.
- Does not generate human-readable markdown (CLI does that).
