# Phase 1 Requirements: Usable Trusted Tool Surface

Status: Draft
Date: 2026-04-27
Owner: Trusted Code Intelligence System

## 1. Goal

Phase 1 turns the trusted P0 substrate into a daily usable tool for:

- developers
- AI coding agents

Phase 1 does not redefine the graph model, traversal policy, validation, governance, or trust semantics. Those remain owned by P0 and `SYSTEM_CONTRACT.md`.

The success criterion is practical usage: an agent can ask for minimal context, inspect nodes and relationships, review a diff, and receive bounded, trust-aware `QueryResult` outputs without reading the full repository.

## 2. Scope

Phase 1 includes:

- unified CLI and MCP tool surface
- core graph query tools
- minimal context entrypoint
- review workflow over changed files and diff hunks
- query usability improvements
- optional lightweight graph intelligence reports

Phase 1 excludes:

- UI polish
- frontend/backend mapping as a global assumption
- AI auto-enrichment
- embeddings as a required feature
- deep performance optimization
- changes to P0 graph/traversal/governance contracts

## 3. Architecture Requirements

### REQ-P1-ARCH-001: Tool Calls Must Use the Trusted Query Path

All external query and review tools MUST follow this path:

```text
CLI/MCP
  -> Tool Layer
  -> OperationResolver
  -> TrustAwareQueryEngine
  -> GraphArtifactLoader / GraphDB
  -> Graph
```

Tools MUST NOT query `GraphDB` directly for reasoning, traversal, impact, lineage, or review conclusions.

Allowed exception: internal non-reasoning helpers may load visible graph data only through `TrustAwareQueryEngine.getVisibleGraph()` or an explicitly documented internal service path.

### REQ-P1-ARCH-002: Operation Resolution Is Mandatory

Every accepted external tool MUST resolve its operation through `OperationResolver`.

Missing or unmapped operation MUST fail closed with `POLICY_VIOLATION` or throw an `OPERATION_REQUIRED` / `OPERATION_UNMAPPED` error before traversal.

### REQ-P1-ARCH-003: External Outputs Must Be QueryResult

Every accepted Phase 1 MCP tool MUST return a complete `QueryResult`.

The result MUST include:

- `status`
- `reasoning`
- `data.nodes`
- `data.edges`
- `confidence`
- `provenance`
- `warnings`
- `codes`
- `metadata.policy`

## 4. Required Tool Surface

### REQ-P1-TOOL-001: Required MCP Core Tools

The MCP server MUST expose these core tools:

- `get_minimal_context`
- `search`
- `get_node`
- `get_neighbors`
- `get_callers`
- `get_callees`
- `impact`
- `lineage`

Each tool MUST:

- return `QueryResult`
- use `OperationResolver`
- use `TrustAwareQueryEngine`
- include provenance and policy metadata
- avoid direct ad hoc traversal

### REQ-P1-TOOL-002: Required MCP Review Tools

The MCP server MUST expose these review tools:

- `detect_changes`
- `review_diff`
- `review_pr`
- `blast_radius`

Each review tool MUST return `QueryResult`.

`review_diff` and `review_pr` MAY include additional review metadata, but the top-level response MUST still satisfy the `QueryResult` contract.

### REQ-P1-TOOL-003: CLI Surface Parity

The CLI MUST expose one namespace for the same accepted capabilities, either as direct commands or stable aliases.

Required CLI capabilities:

- minimal context
- search
- get node
- neighbors
- callers
- callees
- impact
- lineage
- detect changes
- review diff or review range
- blast radius

CLI output for these capabilities MUST be serialized `QueryResult`.

## 5. Core Query Requirements

### REQ-P1-QUERY-001: Search

`search(query, workspaceId, mode?)` MUST:

- search only policy-visible graph nodes
- prefer exact matches over fuzzy or FTS matches
- return `AMBIGUOUS` when multiple exact matches exist
- return `INSUFFICIENT_EVIDENCE` when no match exists
- include match reasoning in `reasoning.selection_explanation`
- include `NO_MATCH`, `AMBIGUOUS_EXACT_MATCH`, or `FTS_FALLBACK` codes where applicable

### REQ-P1-QUERY-002: Node Lookup

`get_node(nodeId, workspaceId, operation?, mode?)` MUST:

- return exactly one visible node when accessible
- return `INSUFFICIENT_EVIDENCE` when missing or hidden by policy
- fail closed on invalid graph state

### REQ-P1-QUERY-003: Neighbors

`get_neighbors(nodeId, workspaceId, depth?, operation?, mode?)` MUST:

- use impact-style trust-aware traversal unless explicitly resolved otherwise
- respect `EdgePolicyTable`
- include blocked edge counts and blocked codes in `metadata.policy`
- default to bounded depth

### REQ-P1-QUERY-004: Callers and Callees

`get_callers(symbolOrNodeId, workspaceId, operation?, mode?)` and `get_callees(symbolOrNodeId, workspaceId, operation?, mode?)` MUST:

- use `lineage` operation by default through `OperationResolver`
- reject edge types that are not valid lineage proof
- never treat `imports` as lineage proof
- propagate lineage denial codes

### REQ-P1-QUERY-005: Impact

`impact(nodeId | nodeIds | diff, workspaceId, depth?, mode?)` MUST:

- use `impact` operation
- return affected nodes and edges under trust policy
- be bounded by depth and result limits
- include truncation warnings when limits are reached

### REQ-P1-QUERY-006: Lineage

`lineage(fromId, toId, workspaceId, mode?)` MUST:

- use `lineage` operation
- select authoritative paths before derived or exploratory paths
- return `AMBIGUOUS` when valid paths conflict without a clear authority winner
- include selected and rejected paths in `reasoning`

## 6. Minimal Context Requirements

### REQ-P1-MC-001: Minimal Context Entrypoint

`get_minimal_context(task, workspaceId, mode?)` MUST be the primary AI-agent entrypoint.

It MUST return a bounded `QueryResult` containing:

- relevant nodes
- relevant edges when useful
- graph health summary
- warnings
- provenance
- confidence
- next tool suggestions

### REQ-P1-MC-002: Bounded Output

`get_minimal_context` MUST enforce deterministic limits.

Default limits:

- max relevant nodes: 20
- max relevant edges: 40
- max suggestions: 5

If data is truncated, the result MUST include `GRAPH_RESULT_TRUNCATED`.

### REQ-P1-MC-003: Ranking

Minimal context ranking SHOULD use this order:

1. exact id or symbol match
2. exact label match
3. source file or route match
4. domain/project match
5. FTS fallback match

Ranking MUST be deterministic.

### REQ-P1-MC-004: Next Tool Suggestions

`get_minimal_context` MUST include next tool suggestions in `metadata.nextTools`.

Each suggestion MUST include:

- `tool`
- `reason`
- minimal required arguments when known

Suggestions MUST NOT imply facts not present in graph evidence.

## 7. Review Workflow Requirements

### REQ-P1-REVIEW-001: Detect Changes

`detect_changes(diffText | base/head, workspaceId, mode?)` MUST:

- parse changed files and hunks
- map changed file/range to graph nodes
- return changed nodes as `QueryResult.data.nodes`
- include unmapped files in metadata
- avoid scanning the full repository

### REQ-P1-REVIEW-002: Diff Review

`review_diff(diffText, workspaceId, mode?)` MUST:

1. parse diff
2. detect changed files and hunks
3. map changes to graph nodes
4. run impact from changed nodes
5. return affected graph as `QueryResult`

It MUST NOT scan the full repository.

### REQ-P1-REVIEW-003: Pull Request Review

`review_pr(base, head, workspaceId, repoPath?, mode?)` MUST:

- obtain git diff for the requested range
- reuse the same workflow as `review_diff`
- return `QueryResult`

### REQ-P1-REVIEW-004: Blast Radius

`blast_radius(nodeId, workspaceId, depth?, mode?)` MUST:

- use impact operation
- return affected graph
- include `metadata.blastRadiusIds`
- include policy blocked codes

## 8. Query Usability Requirements

### REQ-P1-USABILITY-001: Ambiguity Handling

When a query matches multiple plausible nodes, the system MUST return `AMBIGUOUS` instead of choosing silently.

The result MUST include candidate nodes and reasoning explaining the ambiguity.

### REQ-P1-USABILITY-002: Fallback Suggestions

When a query returns no exact result, the system SHOULD provide fallback suggestions when available.

Fallback suggestions MUST be clearly marked with warning or code values such as `FTS_FALLBACK`.

### REQ-P1-USABILITY-003: No Guessing

No Phase 1 tool may invent nodes, edges, files, paths, or relationships.

If graph evidence is missing, the result MUST be `INSUFFICIENT_EVIDENCE`, `PARTIAL`, or `POLICY_VIOLATION`.

## 9. Optional Graph Intelligence Requirements

Phase 1 MAY include these tools if the required surface is complete first:

- `find_hubs`
- `find_bridges`
- `find_gaps`
- `architecture_overview`

These tools MUST still return `QueryResult`.

They MUST be treated as reporting/diagnostic tools, not authoritative proof of runtime behavior unless backed by traversal policy.

## 10. Non-Functional Requirements

### REQ-P1-NFR-001: Determinism

For the same DB state, workspace, operation, mode, and input, every Phase 1 tool MUST return deterministic output.

### REQ-P1-NFR-002: Bounded Work

All tools MUST use bounded traversal, result limits, or both.

When limits are hit, tools MUST return `PARTIAL` or include truncation warnings.

### REQ-P1-NFR-003: Local First

Phase 1 MUST work without external network services.

### REQ-P1-NFR-004: Generic Workspace Model

Phase 1 MUST work for a workspace with zero frontend/backend mapping.

No required behavior may assume a backend/frontend pair.

## 11. Required Tests

Phase 1 is not accepted until tests prove:

- MCP registry exposes all required P1 tools
- CLI exposes all required P1 capabilities
- every accepted MCP tool returns `QueryResult`
- every accepted MCP tool resolves operation through `OperationResolver`
- no accepted reasoning tool bypasses `TrustAwareQueryEngine`
- `get_minimal_context` is bounded and deterministic
- `search` handles exact, FTS fallback, ambiguity, and no-match cases
- `get_callers` and `get_callees` reject invalid lineage proof
- `impact` and `blast_radius` propagate blocked policy codes
- `detect_changes` maps diff hunks to graph nodes
- `review_diff` returns impact through `QueryResult`
- review tools do not scan the full repository

## 12. Acceptance Criteria

Phase 1 passes only if all conditions are true:

1. One MCP server exposes the accepted P1 tools.
2. One CLI namespace exposes the accepted P1 capabilities.
3. `get_minimal_context` works as the primary entrypoint.
4. Search, node lookup, neighbors, callers, callees, impact, and lineage work through policy-aware query surfaces.
5. Review workflow maps diff to graph nodes and returns affected graph.
6. All accepted external tools return `QueryResult`.
7. All accepted tools include provenance and machine-readable codes.
8. No external tool bypasses `OperationResolver`.
9. No external reasoning tool bypasses `TrustAwareQueryEngine`.
10. Missing graph evidence never becomes a guessed answer.
11. Required P1 tests pass.

## 13. Current Implementation Gaps

As of 2026-04-27, the current repository has partial Phase 1 coverage.

Present:

- `TrustAwareQueryEngine`
- `OperationResolver`
- `QueryResultFactory`
- MCP `search`
- MCP `get_node`
- MCP `get_neighbors`
- MCP `get_callers`
- MCP `review_diff`
- MCP `review_pr`
- MCP `blast_radius`
- CLI `ask`
- CLI `search`
- CLI `impact`

Missing or incomplete:

- MCP `get_minimal_context`
- MCP `get_callees`
- MCP `impact`
- MCP `lineage` as a first-class tool or accepted alias
- MCP `detect_changes`
- CLI parity for all accepted P1 tools
- registry tests for full P1 tool surface
- static or acceptance tests preventing traversal bypass
- hunk-level diff-to-node mapping in review workflow

## 14. Implementation Order

Recommended order:

1. Add registry tests for required MCP/CLI surface.
2. Add missing OperationResolver caller mappings.
3. Add missing core query methods in `TrustAwareQueryEngine`.
4. Add MCP tools: `get_callees`, `impact`, `lineage`, `detect_changes`, `get_minimal_context`.
5. Add CLI parity commands or aliases.
6. Tighten review workflow to map diff hunks to graph nodes.
7. Add query usability tests for exact, FTS, ambiguity, and suggestions.
8. Add bounded deterministic tests for `get_minimal_context`.
9. Add no-bypass static/acceptance tests.

