# Design

## Domain Model

New module: `src/daemon/`

```
src/daemon/
  index.ts        — exports DaemonSupervisor class
  supervisor.ts   — manages worker lifecycle
  worker.ts       — wraps single-workspace watch loop
  pidfile.ts      — PID file read/write/lock
  logger.ts       — structured JSON line logger to daemon.log
```

`WorkerState`:

```typescript
interface WorkerState {
  workspaceId: string;
  pid?: number;
  status: 'starting' | 'running' | 'crashed' | 'stopped';
  restartCount: number;
  lastBuildAt?: string;
  lastError?: string;
  backoffMs: number;
}
```

Daemon status response:

```json
{
  "daemonPid": 12345,
  "startedAt": "2026-05-18T10:00:00Z",
  "workers": [
    {
      "workspaceId": "vietiq",
      "status": "running",
      "restartCount": 0,
      "lastBuildAt": "2026-05-18T10:05:00Z"
    }
  ]
}
```

## Application Flow

### `crg daemon start`

1. Check for existing PID file — if present and process alive, error "daemon already running".
2. Fork a detached child process (`child_process.fork`) running the supervisor entry point.
3. Write PID file. Print "Daemon started (pid: N)".
4. Parent exits; child continues.

### Supervisor loop

5. Load `knowledge.config.yaml`, enumerate all `workspaceId`s.
6. For each workspace, spawn a worker that calls `startWatch(workspaceId)`.
7. On worker exit (crash): apply exponential back-off (initial 2s, max 60s), then respawn.
8. On `SIGTERM` (from `crg daemon stop`): gracefully stop all workers, delete PID file,
   exit 0.

### `crg daemon stop`

9. Read PID file, send `SIGTERM` to daemon process.

### `crg daemon status`

10. Read PID file, send `SIGUSR1` to daemon process.
11. Daemon responds by writing current `WorkerState[]` to a temp JSON file.
12. CLI reads temp file and prints formatted table.

## Interface Contract

New CLI subcommands under `daemon`:

```
crg daemon start [--foreground]
crg daemon stop
crg daemon status
crg daemon restart
```

`--foreground`: run supervisor in the current terminal (useful for Docker).

## Data Model

- PID file: `knowledge/.daemon.pid` (plain text, process PID)
- Log file: `knowledge/logs/daemon.log` (JSONL)
- Status socket/temp file: `knowledge/.daemon-status.json` (ephemeral)

## UI / Platform Impact

Terminal output only. No graph DB change.

## Observability

Each worker log event is written to `daemon.log` as JSONL:

```json
{"timestamp":"...","workspaceId":"vietiq","event":"build_complete","durationMs":1234}
{"timestamp":"...","workspaceId":"vietiq","event":"worker_crash","error":"...","restartIn":2000}
```

## Alternatives Considered

1. **PM2 / nodemon as the supervisor** — rejected. Adds a third-party process manager
   dependency that users may not have. Built-in supervision keeps `crg install` + `crg daemon`
   as the complete setup story.

2. **One process per workspace (no supervisor)** — current behavior. Does not handle crash
   recovery or unified status.
