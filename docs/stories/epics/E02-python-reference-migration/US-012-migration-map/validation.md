# Validation

## Proof Strategy

The map document exists, is parseable, and covers all known capability categories.

## Test Plan

| Layer | Cases |
|---|---|
| Review | `docs/migration/python-reference-map.md` contains at least one row per E02 story (US-013 through US-019) |
| Review | Each row has a status value from the allowed set: `done`, `partial`, `missing`, `wont-port`, `in-progress` |
| Review | `docs/migration/python-reference-map.json` is valid JSON (parseable with `JSON.parse`) |
| Review | `README.md` contains a link to `docs/migration/python-reference-map.md` |

## Fixtures

None needed.

## Commands

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/migration/python-reference-map.json', 'utf8'))"
```

## Acceptance Evidence

Pending implementation:

- Both documents exist at the specified paths
- JSON validity check passes
- Peer review confirms coverage of all known Python reference capabilities
