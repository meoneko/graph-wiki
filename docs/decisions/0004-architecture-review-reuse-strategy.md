# 0004 Architecture Review Reuse Strategy

Date: 2026-05-17

## Status

Accepted

## Context

The Codebase Architecture Review feature needs to analyze module boundaries,
dependency cycles, layer violations, dead code, and flow complexity. The existing
codebase already has infrastructure for graph metrics, community detection, flow
computation, and dead code identification.

The question is whether to build a standalone analysis system or to compose thin
analyzers on top of existing infrastructure.

## Decision

Reuse existing infrastructure as the data source and add thin analyzer layers
that classify and flag issues. The `ArchitectureReviewEngine` orchestrates
existing modules (`computeGraphMetrics`, `detectCommunities`, `computeFlows`)
and passes enriched data to new analyzers.

Key choices:
- Use `'wiki'` operation type (not a new `'architecture'` type) because the
  review is read-only analysis, same category as `graph_stats`, `find_hubs`.
- Follow existing patterns exactly: `registerTool` + `z` (MCP), `parseFlag`/
  `hasFlag` if-block (CLI), `QueryResultFactory.create()` (returns).
- Trust filtering handled by `getVisibleGraph()` — no custom trust logic needed.

## Alternatives Considered

1. **New OperationType `'architecture'`** — Rejected because it would require
   updating EdgePolicyTable, OperationResolver, and all consumers. The review
   is functionally equivalent to wiki/stats operations.

2. **Standalone graph analysis system** — Rejected because it would duplicate
   graph loading, trust filtering, and community detection logic.

3. **Extend ReportBuilder** — Rejected because architecture review is
   interactive (MCP + CLI) not just a pipeline output.

## Consequences

Positive:
- Minimal new code — analyzers are pure functions over pre-computed data.
- Trust filtering is automatic via existing `EdgePolicyTable`.
- No changes to core query engine or operation types.
- Consistent UX — same patterns as existing tools.

Tradeoffs:
- Architecture review inherits limitations of existing community detection.
- Cannot add architecture-specific traversal rules without a new operation type.

## Follow-Up

- If architecture-specific traversal rules are needed later, consider adding
  `'architecture'` as an OperationType at that point.
- Monitor whether `'wiki'` operation type is too permissive for architecture
  analysis (it allows all edge types except exploratory in authoritative mode).
