# Exec Plan

## Goal

Implement the central orchestrator that coordinates all analyzers and returns unified results.

## Scope

In scope:

- Orchestrate existing infrastructure + new analyzers.
- Aggregate findings with summary metrics.
- Generate recommendations.
- Return QueryResult with report in metadata.
- Graceful degradation for empty/partial graphs.

Out of scope:

- Individual analyzer implementation (US-002–006).
- MCP/CLI wiring (US-009–010).

## Risk Classification

Risk flags:

- Multi-domain (touches query engine, metrics, communities, flows).

Hard gates: None.

## Work Phases

1. Implement `ArchitectureReviewEngine` class.
2. Wire all analyzers.
3. Write unit tests for trust filtering, confidence, aggregation.
4. Write integration test for full pipeline.
5. Verify typecheck and tests pass.

## Stop Conditions

None expected.
