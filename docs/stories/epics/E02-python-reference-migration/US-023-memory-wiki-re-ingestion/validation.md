# Validation

## Proof Strategy

Verify ingestion correctness and trust gating using mock annotated markdown wiki files and assertions on the query engine output.

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Verify frontmatter parser successfully extracts structured objects from markdown syntax. |
| **Integration** | Populate mock wiki pages with: 1. Human annotations, 2. AI agent annotations. Run re-ingestion, and check database counts. Query under `authoritative` mode (assert AI comments excluded). Query under `mixed_safe` mode (assert AI comments visible). |
| **Drift** | Verify that subsequent pipeline runs do not delete human annotations from the database even if the source files are re-synced. |

## Commands

```bash
npm run test src/pipeline/stages/_tests/MemoryReIngestion.test.ts
```

## Acceptance Evidence

Pending implementation.
