# Design

## Domain Model

New module: `src/installer/`

```
src/installer/
  index.ts          — entry point; exported as installClients()
  clientRegistry.ts — static registry of known MCP clients
  detector.ts       — detects which clients are installed
  writer.ts         — merges MCP server entry into client config
```

`ClientDefinition`:

```typescript
interface ClientDefinition {
  id: string;                        // e.g. "claude-desktop"
  label: string;                     // e.g. "Claude Desktop"
  configPaths: Record<NodeJS.Platform, string>;  // OS-keyed paths (~-expanded)
  configFormat: 'claude-desktop' | 'vscode-mcp';
}
```

Known clients (initial set):

| id | Config path (win32) | Config path (linux/darwin) |
|---|---|---|
| `claude-desktop` | `%APPDATA%\Claude\claude_desktop_config.json` | `~/.config/claude/claude_desktop_config.json` |
| `cursor` | `%APPDATA%\Cursor\User\globalStorage\mcp.json` | `~/.cursor/mcp.json` |
| `windsurf` | `%APPDATA%\Windsurf\mcp.json` | `~/.codeium/windsurf/mcp.json` |
| `vscode` | `%APPDATA%\Code\User\globalStorage\mcp.json` | `~/.vscode/mcp.json` |

MCP server entry written into config:

```json
{
  "mcpServers": {
    "code-review-graph": {
      "command": "npx",
      "args": ["crg", "serve-mcp"],
      "cwd": "<cwd of knowledge.config.yaml>"
    }
  }
}
```

For VS Code / Cursor format (uses `servers` key instead of `mcpServers`):
```json
{
  "servers": {
    "code-review-graph": { "command": "npx", "args": ["crg", "serve-mcp"] }
  }
}
```

## Application Flow

1. `detector.ts` checks each `ClientDefinition.configPaths[process.platform]` for
   existence (file or parent directory). Returns list of detected clients.
2. Interactive mode: `inquirer` (or a minimal stdin prompt) presents checkboxes; user
   selects clients.
3. Non-interactive mode (`--yes`): select all detected clients. `--client <id>` selects
   a specific client regardless of detection.
4. `writer.ts` for each selected client:
   a. Read existing config JSON (empty object `{}` if file absent).
   b. Merge server entry under correct key (`mcpServers` or `servers`) — idempotent.
   c. Write back with 2-space indent.
5. Print summary line per client.

## Interface Contract

New CLI command in `src/cli/index.ts`:

```
crg install [--client <id>] [--yes] [--dry-run]
```

- `--client <id>`: install for a specific client only; skip detection
- `--yes`: non-interactive, install for all detected clients
- `--dry-run`: print what would be written without touching files

## Data Model

No DB changes. Writes to client config files on disk.

## UI / Platform Impact

Terminal output only. No graph DB change.

## Observability

Prints per-client result to stdout. Errors (permission denied, malformed existing JSON)
are surfaced with actionable messages.

## Alternatives Considered

1. **Shell script** — rejected. Cross-platform path expansion, JSON merging, and
   idempotency are easier to implement correctly in TypeScript with proper error handling.

2. **VS Code extension install command** — complementary, not a replacement. The CLI
   command works headlessly in Docker/CI environments where VS Code is absent.
