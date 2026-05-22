# Design

## Domain Model

No new types. Filter logic uses existing `McpToolDefinition` from `src/mcp/tools/runtime.ts`.

Config addition in `knowledge.config.yaml`:

```yaml
mcp:
  tools:
    allow: []          # empty = allow all; non-empty = allowlist
    deny: []           # tool names to exclude (applied after allow)
```

## Application Flow

1. `crg serve-mcp` handler (in `src/cli/index.ts`) parses `--tools` and
   `--exclude-tools` flags before delegating to `src/mcp/server.ts`.
2. Flags are merged with `knowledge.config.yaml` `mcp.tools` config (CLI flags take
   precedence).
3. Computed `allowSet` and `denySet` are passed to `server.ts` as startup options.
4. In `server.ts`, after all tools are registered via `registerTool()`, a filter step
   removes excluded tools from the runtime registry before the MCP transport starts.
5. `tools/list` responses contain only the filtered set. Calls to unlisted tools return
   `{ error: { code: -32601, message: 'Method not found' } }` per JSON-RPC spec.

## Interface Contract

New `ServeMcpOptions`:

```typescript
interface ServeMcpOptions {
  allowTools?: string[];   // if non-empty, only these are exposed
  denyTools?: string[];    // these are excluded (applied after allow)
}
```

`server.ts` exports `startMcpServer(options?: ServeMcpOptions): Promise<void>`.

Current `src/mcp/server.ts` is imported via `await import('../mcp/server.js')` with no
args. Change: `startMcpServer(options)` is called with parsed options instead.

## Data Model

No DB changes.

## UI / Platform Impact

None — MCP clients see a smaller `tools/list` response. Existing tool calls continue to
work if the tool is in the allowed set.

## Observability

Server startup prints: `MCP server started — exposing N of M tools`.
If `--tools` references an unknown tool name, print a warning (not an error) and start
anyway, since the tool list may expand in future versions.

## Alternatives Considered

1. **Per-connection filtering** — rejected. The MCP SDK's stdio transport has one
   connection per process; per-connection ACL adds complexity with no benefit in the
   common single-agent use case.

2. **Tool groups / categories** — deferred. `--tools build` to expose all build tools is
   a useful shorthand but not needed for the initial implementation.
