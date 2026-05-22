# Exec Plan

## Goal

Implement `crg daemon` subcommands for multi-workspace watch supervision with PID-based
lifecycle management and structured logging.

## Scope

In scope:

- `src/daemon/pidfile.ts` — read/write/delete PID file
- `src/daemon/logger.ts` — JSONL structured logger
- `src/daemon/worker.ts` — wraps `startWatch()` in a managed loop
- `src/daemon/supervisor.ts` — orchestrates workers, handles signals
- `src/daemon/index.ts` — daemon entry point (forked by CLI)
- `src/cli/index.ts` — `daemon start|stop|status|restart` handlers
- `help()` update

Out of scope:

- systemd/launchd service file generation
- Remote monitoring UI
- Log rotation (truncation at 10MB is acceptable for initial version)

## Risk Classification

Risk flags:

- **Medium**: process forking and PID file management are platform-sensitive (especially
  on Windows where `fork()` semantics differ). Use `child_process.spawn` with `detached: true`
  on all platforms; avoid `fork()`.
- **Medium**: `SIGUSR1` for status is Unix-only. On Windows, use a temp JSON file polling
  pattern instead (`SIGUSR1` is not supported on Windows).

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- `crg daemon stop` must not leave a zombie process or stale PID file

## Work Phases

### Phase 1 — PID file and logger

1. `src/daemon/pidfile.ts` — write/read/clear/isAlive helpers.
2. `src/daemon/logger.ts` — synchronous JSONL append to `knowledge/logs/daemon.log`.

### Phase 2 — Worker and supervisor

3. `src/daemon/worker.ts` — calls `startWatch(workspaceId)` in a try/catch loop. Writes
   events to logger. On unhandled exception, exits with code 1 so the supervisor can detect crash.

4. `src/daemon/supervisor.ts`:
   - Reads workspace list from config.
   - Spawns one `node dist/daemon/worker.js <workspaceId>` process per workspace.
   - On exit event: apply back-off (2s → 4s → 8s → max 60s), then respawn.
   - On `SIGTERM`: kill all workers, delete PID file, exit 0.
   - On `SIGUSR1` (Unix) or polling (Windows): write status JSON to temp file.

### Phase 3 — Daemon entry point and fork

5. `src/daemon/index.ts` — imports and starts supervisor. This is the forked child entry.

6. In `src/cli/index.ts`, add `daemon` command handler:

```typescript
if (command === 'daemon') {
  const sub = rest[0] ?? 'start';
  const { handleDaemonCommand } = await import('../daemon/cli.js');
  await handleDaemonCommand(sub, rest.slice(1));
  return;
}
```

7. Create `src/daemon/cli.ts` with `handleDaemonCommand(subcommand, args)`:
   - `start`: check PID, spawn detached daemon process, write PID.
   - `stop`: read PID, send SIGTERM, delete PID file.
   - `status`: read PID, request status JSON, print formatted table.
   - `restart`: stop + start.

### Phase 4 — Verification

8. `npm run typecheck` — fix any errors.
9. `npm test` — fix any failures.
10. Run `crg daemon start --foreground` with two workspaces configured, let both build,
    then `crg daemon status`, then `crg daemon stop`. Verify no orphan processes remain.

## Stop Conditions

- On Windows, if `detached: true` child_process.spawn does not behave as expected, fall
  back to documenting PM2 usage and leave the daemon implementation Unix-only with a
  clear error on Windows.
