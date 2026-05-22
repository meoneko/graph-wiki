# Validation

## Proof Strategy

Simulate platform installations using mock environments and verify outputs match configuration schemas.

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Test path resolver logic on mock environment variables. Verify JSON merge does not delete unrelated configuration nodes. |
| **Integration** | Simulate writing configuration to mock Cursor/Claude directories. Verify backups are created successfully. |
| **Platform** | Verify file permission operations succeed on Windows target folders. |

## Commands

```bash
npm run test src/cli/__tests__/Installer.test.ts
```

## Acceptance Evidence

Pending implementation.
