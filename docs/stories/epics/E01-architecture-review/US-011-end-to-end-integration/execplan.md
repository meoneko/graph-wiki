# Exec Plan

## Goal

Verify all components work together end-to-end. Fix any integration issues.

## Scope

In scope:

- Wire engine in MCP and CLI contexts.
- Verify graceful degradation (empty graph, missing flows).
- Verify error handling paths.
- Run full test suite.
- Run typecheck.
- Update TEST_MATRIX.md with evidence.

Out of scope:

- New features.
- Performance optimization.

## Risk Classification

Risk flags:

- Multi-domain (touches all components).

Hard gates: None.

## Work Phases

1. Verify MCP tool registration works end-to-end.
2. Verify CLI command works end-to-end.
3. Write integration test with fixture workspace.
4. Run `npm test` — all 767+ tests pass.
5. Run `npm run typecheck` — zero errors.
6. Update TEST_MATRIX.md.

## Stop Conditions

- If any existing test breaks, fix before proceeding.
