# Validation

## Proof Strategy

Run `crg install --dry-run` and confirm output lists detected clients. Run with a temp
directory as target to verify actual file write. Verify idempotency by running twice.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `detectClients()` returns `detected: true` for a client whose config dir exists as a temp dir fixture |
| Unit | `detectClients()` returns `detected: false` for a client whose path does not exist |
| Unit | `writeClientConfig()` in dry-run mode does not create or modify any file |
| Unit | `writeClientConfig()` creates file with correct JSON when target does not exist |
| Unit | `writeClientConfig()` merges into existing JSON without removing other `mcpServers` entries |
| Unit | `writeClientConfig()` returns `action: 'unchanged'` when entry already matches exactly |
| Unit | `writeClientConfig()` handles malformed existing JSON by throwing with file path in message |
| Integration | `crg install --client claude-desktop --dry-run` exits 0 and prints dry-run notice |
| E2E | `crg install --client claude-desktop --yes` on a temp HOME writes correct entry to temp config path |
| Platform | `npm run typecheck` zero errors |

## Fixtures

```typescript
// Test fixture: temp dir simulating ~/.config/claude/ existing
import tmp from 'tmp';
const tmpDir = tmp.dirSync();
const configPath = path.join(tmpDir.name, 'claude_desktop_config.json');
```

## Commands

```bash
npm run typecheck
npm test
crg install --dry-run
crg install --client claude-desktop --dry-run
```

## Acceptance Evidence

Pending implementation:

- All 8 unit cases pass
- `--dry-run` output lists at least one client on the dev machine
- Integration test writes correct JSON structure verified by `JSON.parse`
- Idempotency: second run on same file returns `unchanged` for all entries
