# Validation

## Proof Strategy

Verify schema output compliance and YAML parsing stability using mock MCP client invocations.

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Verify the YAML prompt loader parses template variables correctly. Verify default prompts contain mandatory tool recommendations. |
| **Integration** | Connect a mock MCP client, query `listPrompts`, and retrieve the complete PR-review payload. Assert full compliance with the Model Context Protocol prompts schema. |

## Commands

```bash
npm run test src/mcp/__tests__/Prompts.test.ts
```

## Acceptance Evidence

Pending implementation.
