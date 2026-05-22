# E02 Python Reference Capability Migration

## Status

planned

## Lane

normal initiative

## Source

- User prompt: enrich the current TypeScript `SPEC.md` from the Python
  reference implementation instead of replacing TypeScript.
- Reference file:
  `.harness-backup/20260516162847/docs/code-review-graph.md`
- Product contract: `SPEC.md` section 21.
- Decision: `docs/decisions/0005-python-reference-migration-strategy.md`.

## Goal

Translate mature capabilities from the Python reference into TypeScript-native
stories while preserving the existing TypeScript trust model, pipeline, storage,
MCP server, and CLI conventions.

This epic is not a port of the Python codebase. It is a controlled migration of
selected product capabilities.

## Migration Map

| Reference capability | Target story | Disposition | Notes |
|---|---|---|---|
| Guided install and client config generation | US-013 | migrate | Must be idempotent and avoid destructive overwrites. |
| MCP tool filtering | US-014 | migrate | Filter registered tools at server startup via CLI/env allow-list. |
| Multi-repo daemon watching | US-015 | migrate | Implement with TypeScript/Node process supervision, not `crg-daemon`. |
| Evaluation benchmarks | US-016 | migrate | Use reproducible fixtures and stable report schema; do not import Python benchmark claims as proof. |
| Hybrid FTS/embedding search | US-017 | migrate | High-risk because it affects query semantics, ranking, optional embeddings, and trust visibility. |
| Interactive visualization export | US-018 | migrate | Read-only export/report surface; must preserve trust metadata. |
| Broader parser coverage | US-019 | migrate one slice at a time | The first language is intentionally unselected until story design picks it. |
| Community fallback and splitting | US-020 | migrate | Reuse existing community infrastructure before adding new algorithms. |
| Flow criticality and affected-flow lookup | US-021 | migrate | Extend existing flow computation with trusted evidence. |
| Agent workflow prompts/templates | US-022 | migrate | Prefer MCP prompts if SDK support is clean; otherwise CLI/context bundles. |
| Memory/wiki re-ingestion loop | US-023 | defer pending policy | Requires a follow-up ADR before implementation because it affects provenance, trust level, retention, and stale-data behavior. |
| Python packaging, `fastmcp`, `networkx`, raw Python schema | none | reference-only | These are implementation details, not TypeScript contracts. |

## Validation Shape

| Layer | Expected proof |
|---|---|
| Unit | Config generation, allow-list parsing, ranking merge, fallback algorithms, prompt contracts. |
| Integration | MCP registration, daemon watcher supervision, FTS/search behavior, graph export payloads, parser fixtures. |
| E2E | Not required for the initiative note; individual stories may add it if a user-visible surface needs it. |
| Platform | Installer and daemon stories must cover Windows path/process behavior. |
| Release | No release proof until an implementation story reaches done. |

## Open Decisions

- Which first language slice US-019 should migrate.
- Whether HTTP/SSE MCP transport is worth a separate future epic.
- Whether memory/wiki re-ingestion is allowed, and if so which provenance and
  retention rules govern it.

## Done For US-012

- The migration map exists and links every accepted `SPEC.md` section 21
  candidate to a story or reference-only disposition.
- No Python-specific implementation detail is treated as TypeScript proof.
- Test matrix rows exist for every accepted migration story.
