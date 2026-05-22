# 0005 Python Reference Migration Strategy

Date: 2026-05-18

## Status

Accepted

## Context

The repository has a TypeScript implementation and an archived packed Python
implementation at `.harness-backup/20260516162847/docs/code-review-graph.md`.
The Python version contains mature product ideas such as guided install,
multi-repo daemon watching, MCP tool filtering, evaluation benchmarks, broader
language coverage, hybrid search, visualization, community/flow enrichment, and
wiki/memory loops.

Replacing the TypeScript spec with the Python implementation would discard the
current trust-aware TypeScript contracts. Ignoring the Python implementation
would lose useful product learning.

## Decision

Use the Python implementation as a reference implementation for capability
discovery, while keeping TypeScript as the target runtime and authoritative
architecture.

Accepted rules:

- Do not copy Python implementation details directly into the TypeScript
  contract.
- Translate reference capabilities into TypeScript stories, validation
  expectations, and trust-aware contracts.
- Mark migrated ideas as planned until TypeScript code and tests prove them.
- Preserve the existing TypeScript trust gate: `OperationResolver`,
  `TrustAwareQueryEngine`, provenance, workspace isolation, and fail-closed
  query semantics.
- Treat Python benchmark numbers and language/tool counts as prioritization
  evidence, not TypeScript proof.

## Consequences

Positive:

- The TypeScript product can absorb proven ideas without architecture churn.
- The spec can distinguish implemented TypeScript behavior from migration
  targets.
- Future agents get a clear migration backlog instead of a conflicting second
  implementation contract.

Tradeoffs:

- Some Python features must be redesigned rather than ported mechanically.
- Broader parser coverage and daemon behavior require separate stories and
  validation before they can be claimed.

## Follow-Up

- Create story packets for E02 before implementing migration work.
- Add a decision record before implementing persistent memory/wiki re-ingestion
  because it affects provenance, retention, and trust classification.
