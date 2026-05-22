# Overview

## Current Behavior

`crg serve-mcp` starts the MCP server and exposes all registered tools unconditionally.
There is no way to limit which tools a specific client can see. Teams that want to expose
only read-only tools to certain agents, or want to reduce the tool list for context-window
efficiency, have no option to do so.

## Target Behavior

`crg serve-mcp` accepts a `--tools <comma-list>` flag that limits the exposed tool set to
the specified names. An `--exclude-tools <comma-list>` flag provides the inverse.
Additionally, `knowledge.config.yaml` supports a `mcp.tools` allowlist so that the filter
is persistent without needing to pass flags every time.

```bash
# Expose only read tools
crg serve-mcp --tools query_graph,get_neighbors,search_nodes

# Expose all tools except build tools (safe for read-only agents)
crg serve-mcp --exclude-tools build_knowledge_graph,incremental_build
```

The MCP server responds to `tools/list` with only the allowed subset. Calls to excluded
tools return a structured error (`method not found`).

## Affected Users

- Teams running `serve-mcp` in CI or shared environments where write operations should
  not be exposed to all agents
- Agent developers who want a smaller tool list to reduce context usage

## Affected Product Docs

- `README.md` — add `serve-mcp` flags to the MCP server section
- `knowledge.config.yaml.example` — add `mcp.tools` config example

## Non-Goals

- No per-client tool ACL (same filter applies to all connections on one server instance)
- No hot-reload of filter config without restart
- No tool-level authentication
