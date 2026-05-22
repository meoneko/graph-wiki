# Overview

## Current Behavior

There is no structured inventory comparing the Python reference implementation and the
TypeScript implementation. Capabilities present in one but absent in the other are tracked
informally, making prioritization and gap-closure difficult.

## Target Behavior

A living document at `docs/migration/python-reference-map.md` catalogs every capability
in the Python reference, maps it to its TypeScript equivalent (or marks it as absent), and
assigns a migration status. The document becomes the authoritative source for E02 story
prioritization and is updated as each subsequent story ships.

Additionally, a machine-readable JSON version at `docs/migration/python-reference-map.json`
enables tooling to query gap status programmatically (e.g. from CI or a future `crg gaps`
command).

## Affected Users

- Project leads deciding which E02 story to pick up next
- Contributors onboarding to the TypeScript codebase
- Automated tooling that checks migration completeness

## Affected Product Docs

- `README.md` — add a "Python Reference Migration" section pointing to the map
- `docs/stories/backlog.md` — E02 story table is derived from this map

## Non-Goals

- No code changes — this is a documentation and analysis deliverable only
- No runtime behavior change
- No enforcement of the map in CI (deferred to a future story)
