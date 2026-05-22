# Overview

## Current Behavior

Currently, developers must manually parse and insert CRG's MCP server configuration (executable path, arguments, environment variables) into highly nested, platform-specific client configuration files (e.g. `claude_desktop_config.json` on Windows/Mac, Cursor settings, etc.). This manual process leads to frequent configuration errors, incorrect path mappings, and friction during onboarding.

## Target Behavior

Introduce an interactive command-line installer `crg install`. It auto-detects standard target clients (Claude Desktop, Cursor, VS Code) in standard OS directories. It prompts the user via a terminal menu to choose global or local installations. If accepted, it modifies client settings files idempotently (safely merging JSON structures without data loss) and copies preconfigured template instructions (`.cursorrules` / `CLAUDE.md`) directly into the active workspace.

## Affected Users

- New developers installing CRG for the first time.
- AI Agents looking to ensure they have the proper workspace context instructions.

## Affected Product Docs

- `README.md` (Getting Started section)
- `docs/HARNESS.md` (Onboarding steps)

## Non-Goals

- Attempting to download external IDE runtimes.
- Overwriting existing client configurations without explicit user consent.
