# Exec Plan

## Goal

Provide an error-free, idempotent interactive client setup command for seamless developer onboarding.

## Scope

- **In Scope**:
  - `crg install` subcommand implementation.
  - Path detection scripts for Windows, macOS, and Linux.
  - Idempotent JSON merging unit.
  - Template copying unit for `.cursorrules` / `CLAUDE.md`.
- **Out of Scope**:
  - Installing Node.js automatically.

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Writing corrupt JSON could crash the developer's pre-configured IDE settings.
- **Mitigation**:
  - Backup target JSON files to a timestamped extension (e.g. `claude_desktop_config.json.bak`) prior to modification.

## Work Phases

1. **Phase 1**: Implement file detection and backup functions.
2. **Phase 2**: Build terminal prompt interactions.
3. **Phase 3**: Implement safe, non-destructive JSON merges.
4. **Phase 4**: Wire subcommand to `src/cli/index.ts`.
