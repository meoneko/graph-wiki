# Overview

## Current Behavior

Currently, the 12-stage pipeline is strictly unidirectional (sync → extract → normalize → validate → build graph → AI enrich → verify → wiki → report). The wiki stage (`08_wiki.ts`) generates trust-aware markdown pages inside `knowledge/wiki/{workspace}/` for consumption by AI agents or developers. However, if a developer or an AI agent annotates these wiki pages (adding manual architectural descriptions, domain insights, or business context), these changes are lost during the next pipeline run because the wiki files are overwritten and there is no feedback loop back into the SQLite graph.

## Target Behavior

Implement a bidirectional **Memory/Wiki Re-Ingestion Loop**. Prior to the extraction stage, the pipeline scans the `knowledge/wiki/{workspace}/` folder for modified markdown files. An AST markdown parser extracts annotated blockquotes or YAML frontmatter containing human annotations. These annotations are re-ingested as `external` or `exploratory` facts in the database, allowing human reflections and agent memories to persist across code rebuilds.

## Affected Users

- AI Agents writing reflection logs or caching reasoning patterns.
- Developers manually adding rich architectural commentary directly to the generated wiki pages.

## Affected Product Docs

- `SPEC.md` Section 18 (Wiki and Documentation Generation)
- `docs/ARCHITECTURE.md` (Feedback Loop & Provenance tracking)

## Non-Goals

- Allowing re-ingested wiki data to modify compiler-verified canonical symbols (code is always the single source of truth).
- Overwriting local Git commit history based on wiki notes.
