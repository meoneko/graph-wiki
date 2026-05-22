# Exec Plan

## Goal

Implement `crg install` to auto-detect installed MCP clients and write the server entry
into their config files, eliminating manual JSON editing.

## Scope

In scope:

- `src/installer/clientRegistry.ts` — static registry of 4 known clients
- `src/installer/detector.ts` — fs-based detection
- `src/installer/writer.ts` — idempotent JSON merge + write
- `src/installer/index.ts` — orchestrator
- `src/cli/index.ts` — add `install` command handler
- `src/cli/index.ts` help text — add `install` entry

Out of scope:

- Uninstall command
- Electron-based GUI
- Support for clients not in the initial registry

## Risk Classification

Risk flags:

- **Medium**: writing to user config files is irreversible if the merge logic is wrong.
  Mitigated by `--dry-run` mode and a backup copy (optional) before write.
- **Low**: path detection is OS-dependent; test on all three platforms (win32, darwin,
  linux).

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- `--dry-run` must never write to disk

## Work Phases

### Phase 1 — Registry and detector

1. Create `src/installer/clientRegistry.ts` with `ClientDefinition[]` for the 4 known
   clients. Use `os.homedir()` and `process.env.APPDATA` for path expansion.

2. Create `src/installer/detector.ts`:

```typescript
export function detectClients(registry: ClientDefinition[]): DetectedClient[] {
  return registry.map(def => {
    const configPath = expandPath(def.configPaths[process.platform as NodeJS.Platform]
      ?? def.configPaths['linux']);
    const exists = fs.existsSync(configPath) || fs.existsSync(path.dirname(configPath));
    return { ...def, configPath, detected: exists };
  });
}
```

### Phase 2 — Writer

3. Create `src/installer/writer.ts`:

```typescript
export function writeClientConfig(
  configPath: string,
  serverName: string,
  entry: McpServerEntry,
  format: ClientDefinition['configFormat'],
  dryRun: boolean,
): { written: boolean; action: 'created' | 'updated' | 'unchanged' } {
  const existing = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {};

  const key = format === 'claude-desktop' ? 'mcpServers' : 'servers';
  const servers = existing[key] ?? {};

  // Idempotency: skip if entry already matches
  if (JSON.stringify(servers[serverName]) === JSON.stringify(entry)) {
    return { written: false, action: 'unchanged' };
  }

  servers[serverName] = entry;
  existing[key] = servers;

  if (!dryRun) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  }
  return { written: true, action: fs.existsSync(configPath) ? 'updated' : 'created' };
}
```

### Phase 3 — Orchestrator and CLI

4. Create `src/installer/index.ts` that ties detector + writer together and prints results.

5. In `src/cli/index.ts`, add:

```typescript
if (command === 'install') {
  const { installClients } = await import('../installer/index.js');
  const clientFlag = parseFlag(rest, '--client');
  const yes = hasFlag(rest, '--yes');
  const dryRun = hasFlag(rest, '--dry-run');
  await installClients({ clientId: clientFlag, autoAccept: yes, dryRun });
  return;
}
```

6. Add `install` to the `help()` output.

### Phase 4 — Verification

7. `npm run typecheck` — fix any errors.
8. `npm test` — fix any failures.
9. Run `crg install --dry-run` on the dev machine and verify output matches expected
   client list and no files are modified.

## Stop Conditions

- If a target config file contains invalid JSON (user-corrupted): surface a clear error
  with the file path and skip that client rather than crashing.
