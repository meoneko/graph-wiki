# Overview

## Current Behavior

8 MCP tool categories registered in `src/mcp/tools/index.ts`. No architecture review tools exist.

## Target Behavior

Two new MCP tools registered: `architecture_review` and `get_architecture_findings`. Both follow the exact pattern of existing tools (`registerTool` + `z` + `ensureQueryResult`).

## Affected Users

- Claude Desktop users querying architecture health.
- VS Code extension users.

## Affected Product Docs

- `.kiro/specs/codebase-review/design.md` §MCP Tool Registration

## Non-Goals

- Does not change existing MCP tools.
- Does not add new transport mechanisms.
