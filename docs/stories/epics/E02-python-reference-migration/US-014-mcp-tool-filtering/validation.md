# Validation

## Proof Strategy

Call `tools/list` on a started MCP server with a filter active and confirm only the
allowed tools are returned. Call an excluded tool and confirm JSON-RPC error -32601.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `applyToolFilter({ allow: ['query_graph'] })` — only `query_graph` remains in registry |
| Unit | `applyToolFilter({ deny: ['build_knowledge_graph'] })` — all except denied tool remain |
| Unit | `applyToolFilter({ allow: ['a', 'b'], deny: ['b'] })` — only `a` remains |
| Unit | `applyToolFilter({})` — all tools remain (empty filter = no-op) |
| Unit | `applyToolFilter({ allow: ['nonexistent'] })` — zero tools remain, no error thrown |
| Integration | MCP server started with `allowTools: ['query_graph']` — `tools/list` response contains exactly 1 tool |
| Integration | Invoking excluded tool returns error with code `-32601` |
| Integration | Config `mcp.tools.deny: ['build_knowledge_graph']` loaded from `knowledge.config.yaml` is applied correctly |
| E2E | `crg serve-mcp --tools query_graph` (start + inspect via test client) shows 1 tool |
| Platform | `npm run typecheck` zero errors |

## Fixtures

```typescript
// Reset tool registry between tests using clearRegisteredToolsForTest()
// Register 3 test tools, apply filter, assert count
```

## Commands

```bash
npm run typecheck
npm test
```

## Acceptance Evidence

Pending implementation:

- All 5 unit cases pass
- Integration: `tools/list` count matches expected filtered count
- Integration: excluded tool call returns `{ error: { code: -32601 } }`
