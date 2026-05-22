# Design

## Document Schema

`docs/migration/python-reference-map.md` — human-readable table:

| Capability | Python module | TypeScript equivalent | Status |
|---|---|---|---|
| CLI build | `cli/build.py` | `src/cli/index.ts: build` | done |
| CLI install | `cli/install.py` | — | missing → US-013 |
| MCP tool filtering | `mcp/filter.py` | — | missing → US-014 |
| Multi-repo daemon | `daemon/supervisor.py` | — | missing → US-015 |
| Eval runner | `eval/runner.py` | — | missing → US-016 |
| Hybrid search | `search/hybrid.py` | — | missing → US-017 |
| Interactive viz | `viz/html_export.py` | — | missing → US-018 |
| Python adapter | `adapters/python.py` | — | missing → US-019 |
| ... | ... | ... | ... |

Status values: `done` | `partial` | `missing` | `wont-port` | `in-progress`

`docs/migration/python-reference-map.json` — machine-readable:

```json
[
  {
    "id": "install-cli",
    "description": "Auto-detect MCP clients and generate config",
    "pythonModule": "cli/install.py",
    "tsEquivalent": null,
    "status": "missing",
    "story": "US-013"
  }
]
```

## Application Flow

N/A — static documentation deliverable.

## Interface Contract

N/A.

## Data Model

N/A — no DB changes.

## UI / Platform Impact

None.

## Observability

None.

## Alternatives Considered

1. **Track gaps in GitHub Issues only** — rejected. Issues are ephemeral and lose context
   as they are closed. A checked-in document survives across contributors and is versioned
   with the code.
