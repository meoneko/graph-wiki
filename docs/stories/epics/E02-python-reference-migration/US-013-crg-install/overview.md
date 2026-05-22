# Overview

## Current Behavior

Setting up `code-review-graph` as an MCP server requires users to manually edit JSON config
files for each client (Claude Desktop, VS Code, Cursor, Windsurf, etc.). The paths,
command format, and config file locations differ per client and per OS, making first-time
setup error-prone and undocumented.

## Target Behavior

`crg install` auto-detects which MCP-capable clients are installed on the current machine,
presents a selection list, and writes (or merges) the correct MCP server entry into each
client's config file. The command is idempotent — running it twice does not duplicate
entries.

```
$ crg install
Detected clients:
  [x] Claude Desktop  (~/.config/claude/claude_desktop_config.json)
  [x] VS Code (Cursor)  (~/.cursor/mcp.json)
  [ ] Windsurf         (not found)

Installing for: Claude Desktop, VS Code (Cursor)
  ✓ Claude Desktop — written
  ✓ VS Code (Cursor) — written

Restart clients to load the new MCP server.
```

Non-interactive mode for CI/scripting:
```
crg install --client claude-desktop --yes
```

## Affected Users

- First-time users who want the MCP server registered without manual JSON editing
- Teams maintaining shared workstations where config files are managed by scripts

## Affected Product Docs

- `README.md` — update "Getting Started" to use `crg install`
- `knowledge.config.yaml.example` — no change

## Non-Goals

- No uninstall (deferred — manual removal is documented)
- No config validation of the existing MCP tools (separate concern)
- No support for clients not yet known (extensible registry, but only known clients ship)
