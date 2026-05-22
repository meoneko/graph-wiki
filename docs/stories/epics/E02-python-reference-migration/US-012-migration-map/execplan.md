# Exec Plan

## Goal

Produce a structured capability map comparing the Python reference and TypeScript
implementations, making E02 story prioritization data-driven.

## Scope

In scope:

- Analyze Python reference codebase (if available) or reconstruct capability list from
  the backlog entries US-012 through US-019
- Create `docs/migration/` directory
- Write `docs/migration/python-reference-map.md` (human-readable)
- Write `docs/migration/python-reference-map.json` (machine-readable)
- Update `README.md` with a "Migration Status" section

Out of scope:

- Any code implementation
- CI enforcement of the map

## Risk Classification

Risk flags:

- **Low**: documentation only, no code changes.

Hard gates:

- None — purely additive docs.

## Work Phases

### Phase 1 — Capability inventory

1. List every CLI command in `src/cli/index.ts` (20 commands as of this writing).
2. List every MCP tool category registered in `src/mcp/tools/`.
3. For each item, determine if a Python reference equivalent exists and mark status.
4. Identify gaps → these become E02 stories.

### Phase 2 — Write documents

5. Create `docs/migration/python-reference-map.md` with the full capability table.
6. Create `docs/migration/python-reference-map.json` with structured entries.

### Phase 3 — README update

7. Add a short "Python Reference Migration" section to `README.md` with a link to the map
   and a summary of which capabilities are planned vs done.

## Stop Conditions

None — this is a documentation-only task with no hard blockers.
