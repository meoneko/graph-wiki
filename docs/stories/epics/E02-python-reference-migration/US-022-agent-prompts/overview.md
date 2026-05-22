# Overview

## Current Behavior

Currently, AI agents query the `code-review-graph` MCP server using ad-hoc, manual tool calls without structured guidance. Without standard prompt templates, agents often construct suboptimal query strategies—such as pulling thousands of flat nodes at once or failing to filter by trust boundaries—leading to excessive token costs and poor context quality.

## Target Behavior

Expose curated **Agent Workflow Prompts & Templates** natively.
1. **MCP Prompts API Integration**: Register standard workflow prompts (e.g. `review-pull-request`, `debug-broken-flow`, `onboard-new-workspace`) directly in our MCP Server.
2. **Predefined System Prompt Templates**: Save structured workflow templates under `.claude/prompts/` (or via Cursor rules). These templates instruct AI agents on exactly which tools to call, in what sequence, and how to interpret trust metadata (`graph_kind` and `confidence_band`), standardizing and optimizing the agent's reasoning process.

## Affected Users

- AI Agents onboarding onto a workspace.
- Developers looking to run structured automated reviews via AI CLI scripts.

## Affected Product Docs

- `docs/HARNESS.md` (Human-Agent collaboration contracts)
- `README.md` (Agent guidelines)

## Non-Goals

- Hardcoding proprietary prompt formats that only work in a single IDE.
