# Overview

## Current Behavior

`crg watch <workspace>` starts a file watcher for a single workspace. It must be invoked
once per workspace, requiring multiple terminal sessions or a process manager for
multi-repo setups. There is no supervision, no restart on crash, and no shared log
aggregation across watchers.

## Target Behavior

`crg daemon start` launches a long-running supervisor process that watches all configured
workspaces concurrently. The daemon:

- Spawns one watcher worker per workspace using the existing `watch.ts` logic
- Restarts crashed workers with exponential back-off
- Writes a PID file (`knowledge/.daemon.pid`) for lifecycle management
- Accepts `crg daemon stop` and `crg daemon status` commands

```bash
crg daemon start          # fork background process, returns immediately
crg daemon status         # show running workspaces, last build time, errors
crg daemon stop           # graceful shutdown
crg daemon restart        # stop + start
```

All workers share a single log file at `knowledge/logs/daemon.log` with structured JSON
lines per event.

## Affected Users

- Developers working across multiple repos simultaneously (e.g. backend + frontend in
  separate workspace configs)
- CI pipelines that run `crg daemon start` on boot and expect all workspaces to stay
  up-to-date

## Affected Product Docs

- `README.md` — add "Daemon Mode" section
- `knowledge.config.yaml.example` — no change

## Non-Goals

- No cluster mode (one daemon per machine, not distributed)
- No remote control (daemon runs locally only)
- No systemd / launchd service file generation (manual setup documented)
