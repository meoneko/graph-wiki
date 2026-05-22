# Validation

## Proof Strategy

Start daemon with two workspaces, verify both are running via status, stop daemon, verify
no orphan processes remain and PID file is deleted.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `pidfile.write(path, pid)` → file contains pid; `pidfile.read(path)` returns same pid |
| Unit | `pidfile.isAlive(nonexistentPid)` returns false |
| Unit | `logger.append(event)` writes valid JSONL line to temp file |
| Unit | Back-off sequence: 2s → 4s → 8s → 16s → 32s → 60s (capped) |
| Integration | `crg daemon start --foreground` with 1 workspace starts watcher and writes to daemon.log |
| Integration | Worker crash → supervisor respawns after back-off delay |
| E2E | `crg daemon start` → `crg daemon status` shows all workspaces as "running" |
| E2E | `crg daemon stop` sends SIGTERM → process exits → PID file deleted |
| E2E | Running `crg daemon start` when already running returns error "daemon already running" |
| Platform | `npm run typecheck` zero errors |
| Regression | `crg watch <workspace>` (single workspace) still works unchanged |

## Fixtures

```typescript
// Minimal workspace config for daemon tests
const tmpConfig = { workspaces: [{ id: 'test-ws', projects: [] }] };
```

## Commands

```bash
npm run typecheck
npm test
crg daemon start --foreground   # foreground mode for manual inspection
crg daemon status
crg daemon stop
ps aux | grep crg               # verify no orphan processes
```

## Acceptance Evidence

Pending implementation:

- All 4 unit cases pass
- E2E: status output shows correct workspace list and "running" status
- E2E: after stop, `ps aux | grep crg` shows no daemon processes
- PID file is absent after stop
