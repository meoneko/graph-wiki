# Exec Plan

## Goal

Provide a robust set of standard, configuration-driven prompt templates that maximize the effectiveness of AI agent interactions.

## Scope

- **In Scope**:
  - Implement prompt registration methods in `src/mcp/server.ts`.
  - Create YAML loader for `.claude/prompts/` configurations.
  - Expose default review, debug, and onboarding prompt schemas.
- **Out of Scope**:
  - Writing native AI chat clients.

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Overly specific prompt instructions could clash with the specific reasoning patterns of different LLM architectures (Claude vs. GPT-4).
- **Mitigation**:
  - Focus prompts strictly on tool execution sequencing rather than stylistic response constraints, keeping them model-agnostic.

## Work Phases

1. **Phase 1**: Structure the external YAML templates loader.
2. **Phase 2**: Add `listPrompts` and `getPrompt` handlers in the MCP Server.
3. **Phase 3**: Code the default onboarding, PR-review, and debugging templates.
4. **Phase 4**: Verify compliance using client tests.
