# Exec Plan

## Goal

Add `--tools` / `--exclude-tools` flags to `crg serve-mcp` and a `mcp.tools` config block
so the exposed tool set can be narrowed without modifying source code.

## Scope

In scope:

- Parse `--tools` and `--exclude-tools` flags in `src/cli/index.ts`
- Add `mcp.tools.allow` / `mcp.tools.deny` to `ProjectConfig` (or top-level config) type
- Refactor `src/mcp/server.ts` to export `startMcpServer(options?)` and apply filter
- Add `mcp` config block to `knowledge.config.yaml.example`
- Update `help()` in CLI

Out of scope:

- Per-connection filtering
- Tool groups / categories
- Unregistering individual handlers (filter is applied at list + invoke level)

## Risk Classification

Risk flags:

- **Low**: filter is applied at startup; existing tool implementations are untouched.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- Calling an excluded tool via MCP must return JSON-RPC error code `-32601`

## Work Phases

### Phase 1 — Config type

1. Add to the top-level config type in `src/pipeline/config.ts`:

```typescript
interface McpConfig {
  tools?: {
    allow?: string[];
    deny?: string[];
  };
}

interface GlobalConfig {
  // ... existing fields ...
  mcp?: McpConfig;
}
```

### Phase 2 — Filter logic in server.ts

2. In `src/mcp/server.ts`, change the module export pattern:

```typescript
export async function startMcpServer(options: ServeMcpOptions = {}): Promise<void> {
  // existing tool registrations...
  
  // Apply filter BEFORE creating transport
  const { allowTools, denyTools } = options;
  applyToolFilter({ allow: allowTools, deny: denyTools });
  
  // existing transport setup...
}

// Start immediately if run directly (preserves current behavior)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startMcpServer();
}
```

3. Add `applyToolFilter()` to `src/mcp/tools/runtime.ts`:

```typescript
export function applyToolFilter(filter: { allow?: string[]; deny?: string[] }): void {
  const { allow, deny } = filter;
  tools = tools.filter(t => {
    if (allow && allow.length > 0 && !allow.includes(t.name)) return false;
    if (deny && deny.includes(t.name)) return false;
    return true;
  });
}
```

### Phase 3 — CLI wiring

4. In `src/cli/index.ts`, change `serve-mcp` handler:

```typescript
if (command === 'serve-mcp') {
  const toolsFlag = parseFlag(rest, '--tools');
  const excludeFlag = parseFlag(rest, '--exclude-tools');
  const config = await loadConfig();
  const mcpConfig = config.mcp?.tools;

  const allowTools = toolsFlag
    ? toolsFlag.split(',').map(s => s.trim())
    : (mcpConfig?.allow ?? []);
  const denyTools = excludeFlag
    ? excludeFlag.split(',').map(s => s.trim())
    : (mcpConfig?.deny ?? []);

  const { startMcpServer } = await import('../mcp/server.js');
  await startMcpServer({ allowTools, denyTools });
  return;
}
```

5. Update `help()` text for `serve-mcp`.

6. Add startup log in `startMcpServer()`: `console.error(`MCP: exposing ${tools.length} tools`)`.

### Phase 4 — Config example

7. Add to `knowledge.config.yaml.example`:

```yaml
# Optional: restrict which MCP tools are exposed by serve-mcp.
# mcp:
#   tools:
#     allow: []    # empty = allow all registered tools
#     deny: []     # names to exclude
```

### Phase 5 — Verification

8. `npm run typecheck` — fix any errors.
9. `npm test` — fix any failures.
10. Run `crg serve-mcp --tools query_graph --dry-run` (or start and inspect `tools/list`
    via a test MCP client) to confirm only 1 tool is listed.

## Stop Conditions

- If `startMcpServer` cannot be exported without breaking the current `await import`
  pattern, use an environment variable as a fallback signal from CLI to server module.
