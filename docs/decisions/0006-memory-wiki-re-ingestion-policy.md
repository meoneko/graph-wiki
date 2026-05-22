# 0006 Memory/Wiki Re-Ingestion Policy

Date: 2026-05-21

## Status

Accepted

## Context

To implement `US-023` (Memory/wiki re-ingestion loop) under the `E02` Epic, the system must support a bidirectional feedback loop where manual annotations and AI agent reflections written to generated wiki markdown files are parsed back into the SQLite graph. 

Unrestricted re-ingestion poses significant architectural risks:
1. **AI Feedback Loops**: AI agents reading their own generated comments as absolute compiler-verified truths, accelerating hallucination amplification.
2. **Data Loss**: Overwriting or deleting valuable human annotations when the underlying source code changes or files are deleted.
3. **Trust Erosion**: Contaminating the strict, compiler-verified `authoritative` query gate with unverified external claims.

## Decision

To resolve these risks, the following architectural policies are adopted for the re-ingestion pipeline:

### 1. Trust Layering and Classification
* All re-ingested annotations are classified under `graph_kind: 'external'` in the database, separating them from parser-extracted (`canonical`) and inferred (`derived`) facts.
* External annotations are **permitted** to appear in `authoritative` mode queries. However, they must be explicitly decorated with a mandatory metadata tag (e.g. `[EXTERNAL_ANNOTATION]`) and carry clear origin labels, ensuring they are easily parsed and analyzed separately by consumers.

### 2. Provenance Tracking & Cryptographic Verification
* Source attribution must be declared in YAML frontmatter or HTML blocks using the `author` attribute (e.g. `author: "human"` or `author: "agent"`).
* To prevent AI agents from spoofing human identity and upgrading their trust classification, human-authored annotations **must** include a verification signature (SHA-256 HMAC) calculated over the annotation content using a local developer secret (e.g. configured in `.env`). Annotations with invalid or missing signatures are automatically demoted to `author: "agent"` and marked as `exploratory` confidence.

### 3. Expiration, Orphan Recovery, and Retention
* When a referenced canonical code symbol is deleted, the system **blocks hard-deletion** of the associated annotations.
* Instead, orphaned annotations are transferred to a dedicated `stale_annotations` vault table, marked as `stale`, and reported in the pipeline output, allowing developers to manually re-map them to active symbols in future iterations.

### 4. Drift and Outdate Warning Mechanism
* During initial annotation, the system hashes the AST signature of the target node (e.g., method arguments, return types, class definition shape).
* During subsequent pipeline runs, the system compares the stored AST signature hash against the current live AST.
* If a signature mismatch is detected, the annotation is flagged as `OUTDATED` and registered in `drift.json` to warn developers that the manual documentation has drifted from the actual implementation.

## Consequences

### Positive
* Protects the integrity of the graph by ensuring clear provenance separation.
* Safeguards human insights from accidental deletion during code refactoring.
* Prevents self-reinforcing AI hallucinations.

### Tradeoffs
* Developers must manage a local secret key for signature signing.
* Additional runtime overhead during AST signature hashing and verification.

## Follow-Up

* Update `US-023` overview, design, and execution plans to reflect these cryptographic and retention constraints.
