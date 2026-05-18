# Overview

## Current Behavior

All components exist individually but are not wired together end-to-end.

## Target Behavior

Full integration: engine instantiated in both MCP and CLI contexts, report writer wired, graceful degradation verified, all tests pass, zero TypeScript errors.

## Affected Users

- All architecture review consumers.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §Architecture (full diagram)

## Non-Goals

- No new features — integration and verification only.
