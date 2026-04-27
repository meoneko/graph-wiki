# SYSTEM CONTRACT v2

Authoritative invariant contract for the Trusted Code Intelligence System.

This document defines mandatory behavior for the system. It is a contract, not a tutorial.

Rules:

- Every rule is enforceable by code or tests unless explicitly marked `NON-ENFORCED`.
- Any `NON-ENFORCED` rule blocks P0/P1 acceptance for the related feature.
- Silent behavior changes are forbidden.
- The system must remain generic and workspace-scoped.
- No BE/FE-specific mapping is allowed as a global invariant.

---

## 1. System Identity

- This system is a unified trusted code intelligence platform.
- This system builds a graph-based representation of codebases and exposes it through one CLI and one MCP server.
- This system uses parser-backed graph facts, operation-aware traversal policy, fail-closed validation, and structured query results.
- This system treats trusted graph facts as the source of truth for reasoning outputs.
- This system may ingest docs, semantic facts, images, and external sources only into non-authoritative partitions unless explicitly promoted through a gated process.
- This system is NOT a general-purpose chatbot.
- This system is NOT a fuzzy search engine as source of truth.
- This system is NOT a speculative AI enrichment layer.
- This system is NOT two separate tools glued together.
- This system is NOT a BE/FE mapping system by default.

---

## 2. Core Invariants (NON-NEGOTIABLE)

### INV-01: Graph Is Source of Truth

- **Rule**: Query and traversal behavior MUST read graph facts from `GraphDB` through the artifact/query loading path; fabricated facts are forbidden.
- **Enforcement**: `src/core/graph/query/GraphArtifactLoader.ts`; `src/storage/GraphDB.ts`.
- **Test**: `src/core/graph/query/operation-query.acceptance.test.ts`.
- **Failure mode**: Return `INSUFFICIENT_EVIDENCE` or fail the query; never synthesize authoritative data.

### INV-02: Canonical Purity

- **Rule**: Canonical nodes and edges MUST be parser-backed facts only.
- **Enforcement**: `src/pipeline/stages/04a_build_canonical.ts`; `src/core/graph/validation/GraphValidator.ts`; `verifyGraph`.
- **Test**: `src/core/graph/validation/graph-validation.acceptance.test.ts`.
- **Failure mode**: Reject during build or verify. Query policy must not be used to hide invalid canonical facts.

### INV-03: No AI Enrichment in Canonical/Derived

- **Rule**: AI-sourced facts MUST NOT be written to canonical or derived graph partitions.
- **Enforcement**: `src/pipeline/stages/04a_build_canonical.ts`; `src/pipeline/stages/04b_build_derived.ts`; `src/pipeline/stages/04c_build_exploratory.ts`; `GraphValidator`.
- **Test**: `NON-ENFORCED` until tests prove AI provenance is restricted to exploratory or pending enrichment.
- **Failure mode**: Reject the fact or classify it as exploratory/pending only.

### INV-04: Traversal Must Be Operation-Aware

- **Rule**: Every edge traversal decision MUST evaluate `OperationType` through `EdgePolicyTable.evaluateEdge()`.
- **Enforcement**: `src/core/graph/traversal/EdgePolicyTable.ts`; `src/core/graph/traversal/TrustAwareTraversal.ts`; `src/core/graph/query/TrustAwareQueryEngine.ts`.
- **Test**: `src/core/graph/traversal/traversal-policy.acceptance.test.ts`.
- **Failure mode**: Return denied policy decision with reason codes.

### INV-05: Operation Is Required (No Fallback)

- **Rule**: Traversal and query methods MUST require an explicit or centrally resolved operation; missing operation MUST NOT fall back to `ask`.
- **Enforcement**: `src/core/graph/query/OperationResolver.ts`; `src/core/graph/query/TrustAwareQueryEngine.ts`.
- **Test**: `operation-query.acceptance.test.ts` tests `OPERATION_REQUIRED` and caller mapping.
- **Failure mode**: Return or throw `POLICY_VIOLATION` with `OPERATION_REQUIRED`.

### INV-06: No Traversal Bypass Allowed

- **Rule**: Traversal MUST go through `TrustAwareQueryEngine`; direct BFS and ad hoc `edges.filter()` traversal outside the engine are forbidden.
- **Enforcement**: `TrustAwareQueryEngine` is the required entry point; `TrustedQueryService` owns service construction.
- **Test**: `NON-ENFORCED` until a static test rejects traversal bypass patterns.
- **Failure mode**: Feature is not accepted.

### INV-07: QueryResult Must Follow Full Contract

- **Rule**: External query outputs MUST be complete `QueryResult` objects.
- **Enforcement**: `src/core/graph/query/QueryResultFactory.ts`; `src/core/types.ts`.
- **Test**: `operation-query.acceptance.test.ts` `assertQueryResultShape()`.
- **Failure mode**: Test failure or `POLICY_VIOLATION`.

### INV-08: Denial Reasons Must Be Visible

- **Rule**: Denied policy decisions MUST propagate reason codes to `QueryResult.codes` and `metadata.policy.blockedCodes`.
- **Enforcement**: `EdgePolicyTable.evaluateEdge()`; `TrustAwareTraversal.findPaths()`; `TrustAwareQueryEngine`.
- **Test**: `operation-query.acceptance.test.ts` denial propagation tests.
- **Failure mode**: Return `PARTIAL`, `INSUFFICIENT_EVIDENCE`, or `POLICY_VIOLATION` with codes; never silently drop.

### INV-09: Deterministic Output Required

- **Rule**: Same DB state, operation, mode, and input MUST produce the same `QueryResult`.
- **Enforcement**: `QueryResultFactory.uniqueSorted()`; deterministic sort logic in query methods.
- **Test**: `operation-query.acceptance.test.ts` deterministic QueryResult test.
- **Failure mode**: Test failure.

### INV-10: Artifact Parity Must Be Fail-Closed

- **Rule**: Artifact verification MUST return `MISMATCH` when artifacts diverge from DB state.
- **Enforcement**: `src/pipeline/artifacts/graphArtifacts.ts` `verifyGraphArtifactParity()`.
- **Test**: `NON-ENFORCED` until a tamper test mutates artifacts and verifies `MISMATCH`.
- **Failure mode**: Verification status `MISMATCH`; consumers MUST NOT trust artifacts.

### INV-11: Unified Tool Surface

- **Rule**: The system MUST expose one unified CLI and one MCP server; functionality MUST NOT require separate external tools as first-class runtime dependencies.
- **Enforcement**: CLI command registry; MCP tool registry.
- **Test**: `NON-ENFORCED` until CLI/MCP registry tests prove one server exposes all accepted tools.
- **Failure mode**: Feature is not accepted.

### INV-12: Generic Workspace Model

- **Rule**: Cross-project mapping is optional, workspace-scoped, adapter-aware, and policy-driven. No BE/FE mapping assumption is allowed in core.
- **Enforcement**: workspace config schema; mapping registry; adapter profile validation.
- **Test**: `NON-ENFORCED` until tests prove a workspace can operate with zero mappings and no BE/FE-specific assumptions.
- **Failure mode**: Reject global mapping assumptions or mark feature out of core scope.

---

## 3. Data Model Contracts

### 3.1 GraphNode

Required fields:

```ts
{
  id: string;
  type: NodeType;
  graph_kind: 'canonical' | 'derived' | 'exploratory' | 'external';
  provenance: Provenance;
  confidence_band: 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
}
```

Additional runtime-required fields in `src/core/types.ts`:

- `workspace`
- `project`
- `label`

Rules:

- Canonical node rule: `graph_kind='canonical'`, `confidence_band='AUTHORITATIVE'`, `provenance.source='parser'`.
- Derived node rule: `graph_kind='derived'`, `provenance.source='analysis'`.
- Exploratory node rule: `graph_kind='exploratory'`, `provenance.source='ai'` or explicitly non-authoritative source.
- External node rule: `graph_kind='external'`, source must be explicitly enabled in workspace config.
- Exploratory nodes MUST NOT be treated as authoritative.
- Authoritative mode MUST expose only canonical parser-backed nodes.
- Mixed-safe mode MUST expose canonical and derived nodes by default.
- Mixed-safe mode MAY expose exploratory nodes only when reached through allowed bounded exploratory traversal.
- Mixed-safe exploratory nodes MUST be flagged and MUST NOT become authoritative proof.
- Exploratory mode MAY expose all graph kinds.

Enforcement:

- Schema: `src/core/types.ts`.
- Visibility: `src/core/graph/traversal/EdgePolicyTable.ts` `isNodeVisible()`.
- Build stages: `src/pipeline/stages/04a_build_canonical.ts`, `04b_build_derived.ts`, `04c_build_exploratory.ts`.
- Validation: `src/core/graph/validation/GraphValidator.ts`.

### 3.2 GraphEdge

Required fields:

```ts
{
  id: string;
  from_id: string;
  to_id: string;
  type: string;
  graph_kind: 'canonical' | 'derived' | 'exploratory' | 'external';
  confidence_band: 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  provenance: Provenance;
}
```

Additional runtime-required field in `src/core/types.ts`:

- `workspace`

Rules:

- Edge type MUST be a valid edge type accepted by taxonomy.
- Edge type MUST be accepted by the current operation policy before traversal.
- Unknown edge types MUST be denied when operation requires explicit edge set.
- `graph_kind` MUST be compatible with source and target node trust constraints.
- Canonical edges MUST be parser-backed.
- Derived edges MUST be traceable to canonical or validated analysis inputs.
- Exploratory edges MUST NOT be used as authoritative proof.
- External edges MUST be disabled unless external workflow is enabled.

Enforcement:

- Schema: `src/core/types.ts`.
- Operation policy: `src/core/graph/traversal/EdgePolicyTable.ts`.
- Artifact parity: `src/pipeline/artifacts/graphArtifacts.ts`.
- Validation: `src/core/graph/validation/GraphValidator.ts`.

---

## 4. Operation Model

Allowed `OperationType` values:

- `ask`
- `impact`
- `lineage`
- `wiki`
- `governance`

Rules:

- Every traversal MUST have an operation.
- No default or fallback operation is allowed inside traversal.
- Missing operation = `POLICY_VIOLATION` with `OPERATION_REQUIRED`.
- Unknown operation = `POLICY_VIOLATION` with `UNKNOWN_OPERATION`.
- Tool-to-operation mapping MUST be centralized in `OperationResolver`.
- Pipeline-only commands that do not traverse graph must be explicitly marked `pipeline` and must not fake an operation.

Tool to operation mapping:

| Tool / Caller | Operation |
|---|---|
| CLI ask | `ask` |
| CLI impact | `impact` |
| CLI stats | `wiki` |
| CLI search | `ask` |
| CLI export | `wiki` |
| CLI wiki/generate | `wiki` or pipeline if no traversal |
| Service ask | `ask` |
| Pipeline impact | `impact` |
| MCP `get_minimal_context` | `ask` |
| MCP `search` | `ask` |
| MCP `get_node` | `ask` |
| MCP `get_neighbors` | `impact` |
| MCP `get_path` | `lineage` |
| MCP `get_callers` | `lineage` |
| MCP `get_callees` | `lineage` |
| MCP `impact` | `impact` |
| MCP `review_diff` | `impact` |
| MCP `review_pr` | `impact` |
| MCP `detect_changes` | `impact` |
| MCP `blast_radius` | `impact` |
| MCP `graph_stats` | `wiki` |
| MCP `architecture_overview` | `wiki` |
| MCP `find_hubs` | `wiki` |
| MCP `find_bridges` | `wiki` |
| MCP `find_gaps` | `wiki` |
| MCP `get_wiki_page` | `wiki` |
| MCP `generate_wiki` | `wiki` |
| MCP `search` | `ask` |
| MCP refactor tools | `impact` |
| Governance tools | `governance` |
| CLI `wiki update` | pipeline, no traversal |
| CLI `wiki watch` | pipeline, no traversal |
| CLI `wiki build` | pipeline, no traversal |

Enforcement:

- `src/core/graph/query/OperationResolver.ts`.
- `operation-query.acceptance.test.ts`.

---

## 5. Traversal Policy Contract

Policy entry point:

- `src/core/graph/traversal/EdgePolicyTable.ts` `evaluateEdge()`.

### `ask`

- Canonical and derived evidence allowed by mode.
- Exploratory evidence allowed only in `mixed_safe` when policy permits it.
- Exploratory evidence in `mixed_safe` MUST emit `EXPLORATORY_USED`.
- Exploratory evidence in `authoritative` MUST be denied.

### `impact`

- Control-flow edges only:
  - `calls`
  - `invokes`
  - `dispatches_to`
  - `triggers`
- `imports` is forbidden unless `allowImportPropagation=true`.
- Non-control-flow edge denial code: `IMPACT_REQUIRES_CONTROL_FLOW`.
- Exploratory edge in authoritative mode denial code: `EXPLORATORY_FORBIDDEN_IN_AUTHORITATIVE`.

### `lineage`

- Authority/control proof edges only:
  - `calls`
  - `invokes`
  - `uses_authority`
  - `node_uses_authority`
  - `depends_on_authority`
- `imports` is forbidden as proof.
- Denial code for invalid proof edge: `LINEAGE_REQUIRES_AUTHORITY_CHAIN`.

### `wiki`

- Canonical and derived evidence allowed by mode.
- Structural/navigational edges allowed:
  - `contains`
  - `calls`
  - `invokes`
  - `entry_of`
  - `belongs_to_flow`
  - `requests`
  - `returns`
  - `maps_to`
  - `binds_to`
- Exploratory evidence MAY be annotation only.
- Exploratory evidence MUST NOT be authoritative conclusion.
- Exploratory edge in authoritative mode denial code: `WIKI_AUTHORITATIVE_FORBIDS_EXPLORATORY`.
- Denial of wiki edge types outside the listed set is `NON-ENFORCED` until explicit rejection tests exist.

### `governance`

- Authority edges only:
  - `uses_authority`
  - `node_uses_authority`
  - `depends_on_authority`
- Canonical or derived `graph_kind` required.
- Exploratory evidence forbidden.
- Invalid graph kind denial code: `GOVERNANCE_REQUIRES_AUTHORITY`.
- Invalid edge type denial code: `EDGE_TYPE_NOT_ALLOWED_FOR_GOVERNANCE`.

Global traversal rules:

- Policy decisions MUST include `codes[]`.
- Denied decisions SHOULD include `reason`.
- Denied edges MUST NOT be silently ignored.
- `mixed_safe` exploratory hop limit is 2.
- Exceeding exploratory hop limit denial code: `EXPLORATORY_HOP_LIMIT_EXCEEDED`.
- `AMBIGUOUS` confidence in `mixed_safe` is allowed only for exploratory edges.

---

## 6. QueryResult Contract (CRITICAL)

Exact external schema:

```ts
{
  status: 'OK' | 'PARTIAL' | 'INSUFFICIENT_EVIDENCE' | 'POLICY_VIOLATION' | 'EXPLORATORY_ONLY' | 'AMBIGUOUS',
  reasoning: {
    selected_paths: ReasoningPath[],
    rejected_paths?: ReasoningPath[],
    selection_explanation: string[]
  },
  data: {
    nodes: GraphNode[],
    edges: GraphEdge[],
    [key: string]: unknown
  },
  confidence: {
    level: 'HIGH' | 'MEDIUM' | 'LOW',
    reasons: string[]
  },
  provenance: {
    sources: Provenance[]
  },
  warnings: string[],
  codes: string[],
  metadata: {
    policy: {
      operation: OperationType | null,
      mode: QueryMode | null,
      traversedEdgeCount: number,
      blockedEdgeCount: number,
      blockedCodes: string[]
    },
    tool?: {
      name: string,
      workspace?: string,
      project?: string
    }
  }
}
```

Rules:

- ALL external query/tool outputs MUST follow this structure.
- No query method may return a partial result shape.
- No external method may return raw `GraphNode[]` or `GraphEdge[]` instead of `QueryResult`.
- `warnings[]` MUST be deduplicated and sorted.
- `codes[]` MUST be deduplicated and sorted.
- `metadata.policy` MUST exist for traversal/query outputs.
- Tool-specific payloads MUST live under `data`, not beside the contract.

Enforcement:

- Type: `src/core/types.ts`.
- Factory: `src/core/graph/query/QueryResultFactory.ts`.
- Engine: `src/core/graph/query/TrustAwareQueryEngine.ts`.
- Tests: `operation-query.acceptance.test.ts`.

Exception:

- `TrustAwareQueryEngine.getVisibleGraph()` may return `{ nodes, edges }` internally.
- MCP, CLI, UI, and other external callers MUST NOT call `getVisibleGraph()` directly unless the result is wrapped through `QueryResultFactory`.

---

## 7. Output Construction Rule

Rules:

- All `QueryResult` objects MUST be created via `QueryResultFactory.create()` or `QueryResultFactory.withMetadata()`.
- Manual `QueryResult` object construction is forbidden outside `QueryResultFactory`.
- Adding a new output shape without updating `QueryResultFactory` is forbidden.

Enforcement:

- Factory: `src/core/graph/query/QueryResultFactory.ts`.
- Test: `NON-ENFORCED` until a static test checks factory exclusivity.
- Audit command: code search for `status:` plus `reasoning:` plus `data:` MUST only identify factory internals or tests.

Failure mode:

- Feature is not accepted.

---

## 8. Traversal Entry Rule

Rules:

- All traversal MUST go through `TrustAwareQueryEngine`.
- `TrustAwareQueryEngine` MUST apply `EdgePolicyTable.evaluateEdge()` before including traversed edges.
- Direct BFS outside the query engine is forbidden.
- Direct `edges.filter()` traversal outside the query engine is forbidden.
- Direct `TrustAwareTraversal` construction outside `TrustAwareQueryEngine` is forbidden.

Enforcement:

- Engine: `src/core/graph/query/TrustAwareQueryEngine.ts`.
- Traversal: `src/core/graph/traversal/TrustAwareTraversal.ts`.
- Policy: `src/core/graph/traversal/EdgePolicyTable.ts`.
- Test: `NON-ENFORCED` until a no-bypass static test exists.

Failure mode:

- Feature is not accepted.

---

## 9. Artifact Layer Contract

Required artifacts:

- `canonical.graph.json`
- `exploratory.graph.json`
- `graph.meta.json`
- `edges.jsonl`

Rules:

- Artifacts MUST be generated from DB only.
- Artifact generation MUST be deterministic.
- Artifact writes MUST be atomic.
- Artifact writes MUST use a lock to prevent concurrent writes.
- Artifact verification MUST compare DB and artifact counts.
- Artifact verification MUST compare node ID hashes.
- Artifact verification MUST compare edge ID hashes.
- Artifact verification MUST compare edge fields.
- Duplicate artifact edge IDs MUST fail verification.
- Duplicate artifact edge signatures MUST fail verification.
- Tamper MUST fail verification with `MISMATCH`.

Enforcement:

- `src/pipeline/artifacts/graphArtifacts.ts` `writeGraphArtifacts()`.
- `src/pipeline/artifacts/graphArtifacts.ts` `verifyGraphArtifactParity()`.
- Test: `NON-ENFORCED` until artifact parity tamper test exists.

Known contract note:

- `edges.jsonl` currently serializes `confidence_band` from legacy `edge.confidence`; this MUST remain parity-verified against DB behavior or be corrected with a migration and test.

---

## 10. Determinism Contract

Rules:

- Same input DB state, operation, mode, and query parameters MUST produce identical `QueryResult`.
- QueryResult MUST NOT include timestamps.
- Ordering MUST be stable.
- Nodes and edges returned from query methods MUST be sorted where method semantics permit ordering.
- `warnings[]` and `codes[]` MUST be stable.
- `provenance.sources[]` MUST be deduplicated and deterministically ordered.

Enforcement:

- `src/core/graph/query/QueryResultFactory.ts`.
- Query sorting in `src/core/graph/query/TrustAwareQueryEngine.ts`.
- Test: `operation-query.acceptance.test.ts` deterministic QueryResult test.

NON-ENFORCED:

- Some graph-wide query methods may use object iteration order after DB/artifact loading. They MUST receive explicit sort tests before P0/P1 acceptance.
- `TrustEventEmitter` timestamps are allowed for observability events only and MUST NOT enter `QueryResult`.

---

## 11. Failure Semantics

Allowed statuses:

- `OK`
- `PARTIAL`
- `INSUFFICIENT_EVIDENCE`
- `POLICY_VIOLATION`
- `EXPLORATORY_ONLY`
- `AMBIGUOUS`

Rules:

- `OK` means the result satisfied policy.
- `PARTIAL` means usable result exists but is incomplete, truncated, or includes non-authoritative evidence.
- `INSUFFICIENT_EVIDENCE` means no acceptable evidence exists under policy.
- `POLICY_VIOLATION` means operation, mode, caller, validation, or policy contract was violated.
- `EXPLORATORY_ONLY` means evidence exists only outside authoritative trust.
- `AMBIGUOUS` means multiple/conflicting paths exist without clear authority.
- Never silently degrade.
- Every non-OK result MUST carry at least one code in `codes[]` or warning in `warnings[]`.
- Policy denials MUST use stable reason codes.

Enforcement:

- Status type: `src/core/types.ts`.
- Result construction: `src/core/graph/query/QueryResultFactory.ts`.
- Engine behavior: `src/core/graph/query/TrustAwareQueryEngine.ts`.

NON-ENFORCED:

- A global test requiring every non-OK result to include at least one `codes[]` value does not currently exist.

---

## 12. Unified Tool Contract

The system MUST expose all accepted capabilities through one CLI and one MCP server.

### 12.1 CLI Surface

Required CLI commands:

- `wiki init`
- `wiki build`
- `wiki update`
- `wiki watch`
- `wiki serve`
- `wiki status`
- `wiki ask`
- `wiki search`
- `wiki impact`
- `wiki review`
- `wiki generate`
- `wiki register`
- `wiki repos`

Rules:

- CLI command names may change, but there MUST be one unified command namespace.
- CLI must not require users to run separate first-class tools for code graph and broad knowledge graph.
- Build/update/watch are pipeline commands and must run validation before artifacts are accepted.
- Query commands must return or print a `QueryResult`-compatible structure.

### 12.2 MCP Surface

Required MCP tools:

Core tools:

- `get_minimal_context`
- `search`
- `get_node`
- `get_neighbors`
- `get_callers`
- `get_callees`
- `impact`
- `lineage`

Review tools:

- `review_diff`
- `review_pr`
- `detect_changes`
- `blast_radius`

Graph tools:

- `graph_stats`
- `find_hubs`
- `find_bridges`
- `find_gaps`
- `architecture_overview`

Wiki tools:

- `generate_wiki`
- `get_wiki_page`

Rules:

- Every MCP tool MUST use `OperationResolver` unless it is explicitly pipeline-only.
- Every MCP tool MUST return `QueryResult`.
- No MCP tool may return raw graph nodes/edges as the top-level response.
- No MCP tool may bypass `TrustAwareQueryEngine` for traversal.
- Tool outputs must be bounded unless explicitly requested otherwise.

Enforcement:

- MCP tool registry.
- CLI command registry.
- `operation-query.acceptance.test.ts`.
- `NON-ENFORCED` until tool registry tests cover every accepted tool.

Failure mode:

- Tool is rejected or returns `POLICY_VIOLATION`.

---

## 13. Minimal Context Contract

The system MUST provide a bounded context entry point for AI agents.

Required tool:

- `get_minimal_context`

Purpose:

- Provide enough graph context for an AI coding agent to choose the next tool without reading the full repository.

Required behavior:

- MUST return bounded context.
- MUST include graph health summary.
- MUST include top relevant nodes or entities.
- MUST include warnings and codes.
- MUST include suggested next tools.
- MUST include provenance when facts are used.
- MUST minimize token usage.

Rules:

- MUST NOT return full graph.
- MUST NOT return unbounded node lists.
- MUST NOT scan full source files when graph evidence is available.
- MUST return `QueryResult` via `QueryResultFactory`.
- MUST use `OperationResolver` with `ask` operation.
- MUST be deterministic for same DB state and input.

Enforcement:

- `get_minimal_context` MCP tool.
- `QueryResultFactory`.
- `OperationResolver`.

Test:

- `NON-ENFORCED` until tests prove bounded output, QueryResult shape, operation mapping, and deterministic result.

---

## 14. Review Workflow Contract

The system MUST support change-based reasoning workflows.

Required tools:

- `review_diff`
- `review_pr`
- `detect_changes`
- `blast_radius`

Purpose:

- Let AI agents review changes using graph impact instead of reading the whole repository.

Rules:

- Review tools MUST use `impact` operation.
- Review tools MUST map changed files/ranges to graph nodes.
- Review tools MUST compute affected nodes/files through policy-aware traversal.
- Review tools MUST surface test gaps when available.
- Review tools MUST include risk summary when enough evidence exists.
- Review tools MUST return `QueryResult`.
- Review tools MUST NOT perform unbounded full-repo scans during normal review.
- Review tools MUST NOT treat docs/exploratory evidence as authoritative impact proof.

Enforcement:

- `OperationResolver` mapping.
- `TrustAwareQueryEngine` impact traversal.
- Review tool implementation.

Test:

- `NON-ENFORCED` until tests prove `review_diff`, `review_pr`, `detect_changes`, and `blast_radius` use impact operation and return QueryResult.

---

## 15. Workspace & Mapping Contract

The system MUST remain generic and workspace-scoped.

Rules:

- A workspace may contain one or more projects.
- Projects may be linkable or mappable to each other.
- Cross-project mapping is optional.
- Mapping must be workspace-scoped.
- Mapping must be adapter-aware.
- Mapping must be policy-driven.
- No BE/FE assumption is allowed in core.
- No global mapping invariant is allowed.
- A workspace with zero mappings MUST still build, validate, query, and generate wiki.

Allowed mapping examples:

- project-to-project links
- adapter-to-adapter links
- API-to-client links
- package-to-package links
- docs-to-code links
- runtime flow links

Forbidden core assumptions:

- every workspace has backend and frontend
- every workspace needs BE/FE mapping
- API/client mapping is globally required
- domain ontology is global

Enforcement:

- Workspace config schema.
- Adapter profile validation.
- Mapping registry.

Test:

- `NON-ENFORCED` until tests prove a no-mapping workspace and a mapped workspace both work.

---

## 16. Validation & Governance Contract

Required validators:

- `GraphValidator` is mandatory for structural and trust invariants.
- `GovernanceValidator` is mandatory or an equivalent governance validator MUST enforce the same checks.
- `verifyGraph` MUST run graph and governance validators before graph state is accepted.

Rules:

- Canonical purity MUST be validated before query policy is allowed to evaluate results.
- Governance rules MUST be validated before governance query results are trusted.
- Query engine MUST refuse invalid graph state.
- Validation errors MUST propagate to external callers as `QueryResult`.
- Validation errors MUST use `status='POLICY_VIOLATION'`.
- Validation error codes MUST be surfaced in `QueryResult.codes[]`.
- Validation error codes MUST remain stable enough for tests and callers.

Required validation codes:

- `CANONICAL_PROVENANCE_MISSING`
- `MISSING_PROVENANCE`
- `INVALID_EDGE_TYPE`
- `INVALID_GRAPH_STATE`
- `EXTERNAL_WORKFLOW_DISABLED`
- `AUTHORITY_CHAIN_BROKEN`
- `POLICY_VIOLATION`

Enforcement:

- `src/core/graph/validation/GraphValidator.ts`.
- `GovernanceValidator` or equivalent governance validation module.
- `verifyGraph` integration.
- `src/core/graph/query/QueryResultFactory.ts`.

Test:

- `NON-ENFORCED` until tests prove `verifyGraph` runs graph and governance validators and validation failures surface through `QueryResult`.

Failure mode:

- Invalid graph state is rejected before query results are trusted.
- External result status is `POLICY_VIOLATION` with validation codes.

---

## 17. Artifact & Wiki Generation Contract

Wiki is an explainability layer, not the source of truth.

Rules:

- Wiki pages MUST be generated from validated graph/artifacts.
- Wiki pages MUST show provenance or trust indicators where applicable.
- Wiki pages MUST NOT promote exploratory evidence to authoritative truth.
- Wiki generation MUST run after graph verification.
- Wiki generation MUST be deterministic for same input graph.
- Wiki may include exploratory annotations only if clearly marked.

Required wiki pages for P1:

- workspace overview
- project overview
- node page
- flow/path page
- community/cluster page
- graph health page

Enforcement:

- Wiki generator.
- Pipeline order.
- Graph validation gate.

Test:

- `NON-ENFORCED` until tests prove wiki runs after verification and preserves trust labels.

---

## 18. Test Requirements (MANDATORY)

Required P0 tests:

- Operation required, no fallback.
- Operation mapping correctness.
- Traversal policy correctness for `impact`.
- Traversal policy correctness for `lineage`.
- Traversal policy correctness for `governance`.
- Denial propagation to top-level `codes[]`.
- Denial propagation to `metadata.policy.blockedCodes`.
- QueryResult contract completeness.
- Artifact parity tamper test.
- Deterministic output.
- No traversal bypass.
- QueryResult factory exclusivity.
- Canonical purity.
- AI provenance restricted from canonical/derived.
- Validation failure propagates to QueryResult.

Required P1 tests:

- Unified CLI/MCP tool registry exposes one server.
- Every accepted MCP tool returns QueryResult.
- Every accepted MCP tool resolves operation through OperationResolver.
- `get_minimal_context` is bounded and deterministic.
- `review_diff` uses impact operation and returns QueryResult.
- `review_pr` uses impact operation and returns QueryResult.
- `detect_changes` maps file paths/ranges to graph nodes.
- `blast_radius` uses impact traversal with EdgePolicyTable enforcement.
- Wiki generation runs after verification.
- Workspace with no mappings works.
- Workspace with optional mappings works.
- No BE/FE-specific assumptions exist in core.

Current test locations:

- `src/core/graph/query/operation-query.acceptance.test.ts`.
- `src/core/graph/traversal/traversal-policy.acceptance.test.ts`.
- `src/core/graph/validation/graph-validation.acceptance.test.ts`.

Current missing required tests:

- Artifact parity tamper test.
- No traversal bypass static test.
- QueryResult factory exclusivity static test.
- AI provenance partition test.
- Global non-OK reason-code test.
- Explicit wiki denial test for unlisted edge types.
- Explicit deterministic ordering tests for all graph-wide query methods.
- Unified tool registry test.
- Minimal context bounded-output test.
- Review workflow tests.
- Workspace mapping/no-mapping tests.

Rule:

- If a required test is missing, the related feature is not accepted.

---

## 19. Anti-Drift Rules

- Do not add a new output shape without updating `QueryResultFactory`.
- Do not add a new tool without adding `OperationResolver` mapping.
- Do not add a new traversal path without `EdgePolicyTable` enforcement.
- Do not add direct graph traversal outside `TrustAwareQueryEngine`.
- Do not add a new data source without provenance rules.
- Do not add a new `graph_kind` without updating node visibility and artifact rules.
- Do not add a new `OperationType` without updating operation resolver, traversal policy, tests, and this contract.
- Do not add a new `DecisionStatus` without updating failure semantics and tests.
- Do not expose exploratory evidence as authoritative proof.
- Do not treat `imports` as lineage proof.
- Do not return raw nodes or edges from external query/tool surfaces.
- Do not split accepted runtime functionality into separate first-class tools.
- Do not hardcode BE/FE or domain-specific mappings in core.
- Do not add workspace-specific ontology to global system invariants.

---

## 20. Acceptance Gates

### 20.1 P0 Acceptance Gate

System is considered P0 PASS only if all conditions are true:

- All P0 invariants are enforced by code.
- All P0 invariants are enforced by tests.
- No P0-related `NON-ENFORCED` item remains.
- Issue 1 audit returns PASS.
- Issue 2 audit returns PASS.
- Issue 3 audit returns PASS.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.
- Operation mapping audit passes.
- QueryResult factory exclusivity audit passes.
- Traversal bypass audit passes.
- Artifact parity tamper test passes.
- Deterministic output tests pass.

### 20.2 P1 Acceptance Gate

System is considered P1 PASS only if all conditions are true:

- One CLI namespace exposes accepted commands.
- One MCP server exposes accepted tools.
- `get_minimal_context` works and returns bounded QueryResult.
- Search, node lookup, neighbors, callers/callees work through policy-aware query surfaces.
- Impact and review workflows work through impact operation.
- Wiki generation works after verification.
- Graph intelligence reports work as QueryResult outputs.
- Workspace with no cross-project mapping works.
- Optional workspace mappings work when configured.
- No BE/FE-specific assumptions are present in core.
- All P1 required tests pass.

---

## 21. Product Direction Summary

The product direction is:

- One tool.
- One MCP server.
- One workspace graph model.
- Multiple trust layers.
- Fast AST-backed code graph by default.
- Optional broad-source knowledge graph through gated exploratory/external layers.
- Code-review-graph-style workflows on top of a stricter trust substrate.

The system should replace "AI reads the whole repo" with "AI queries a trusted graph."
