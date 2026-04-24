# Trusted Code Intelligence System Specification

Version: 1.0
Status: Draft for implementation

## 1. Purpose

Tai lieu nay la ban spec hop nhat cho he thong code intelligence local-first, graph-backed, fail-closed, phuc vu AI agents va nguoi dung bang context toi thieu, explainable, va trusted.

Spec nay hop nhat:

- strategic design brief
- graph schema va edge taxonomy requirements
- trust-aware reasoning requirements
- current codebase constraints quan trong cho implementation

Spec nay la tai lieu chinh de:

- thiet ke va refactor codebase
- xac dinh contracts cho parser, builder, query engine, MCP, CLI, wiki
- danh gia Definition of Done cho P0 trusted reasoning system

## 2. System Identity

He thong nay la:

> A graph-backed, fail-closed deterministic reasoning system for code intelligence.

He thong nay khong phai:

- chatbot
- semantic search engine thuần
- documentation generator thuần
- AI-generated knowledge store

Vai tro cot loi cua he thong:

- Graph la knowledge substrate
- Reasoning engine la trust boundary
- MCP/CLI/wiki/VS Code la consumer surfaces

## 3. Objectives

System MUST:

- maximize correctness
- minimize hallucination
- minimize unnecessary token usage
- provide deterministic explainability
- fail closed khi khong du du lieu

System SHOULD:

- support multi-workspace isolation
- support additive schema evolution
- support governance-aware analysis

System MAY:

- include exploratory or AI-assisted relations
- include feedback-driven external knowledge

Nhung exploratory va external knowledge MUST NOT silently affect authoritative conclusions.

## 4. Non-Goals

Spec nay khong toi uu:

- storage layout chi vi performance
- UI details
- arbitrary AI enrichment
- best-effort answering khi graph khong du tin cay

## 4.1 P0 Non-Goals (MANDATORY)

P0 MUST NOT attempt to solve:

- advanced FE-BE mapping beyond basic contract edges
- full workflow automation or orchestration UI
- external feedback loop implementation
- AI-based knowledge generation for canonical graph
- performance optimization beyond correctness

P0 focus is strictly:

- trusted graph semantics
- deterministic reasoning
- fail-closed behavior

## 4.2 P0 Contract Mapping Scope (MANDATORY)

P0 contract mapping scope MUST distinguish basic vs advanced mapping.

### Basic contract mapping allowed in P0

P0 MAY implement deterministic contract edges:

- `requests`
- `returns`
- `binds_to`
- direct deterministic `maps_to`

### Advanced contract mapping deferred from P0

P0 MUST defer:

- probabilistic FE-BE endpoint inference
- heuristic schema matching across loosely related payloads
- orchestration-level cross-system mapping

This section resolves the boundary between Contract Flow support and P0 non-goals.

## 5. Core Principles

### 5.1 Graph is Runtime Truth

Graph khong phai cache. Graph la runtime source of truth cho reasoning.

### 5.2 Fail Closed

Khong du bang chung thi khong duoc ket luan.

### 5.3 Explicit Semantics

Moi node, edge, traversal, va output status phai co semantics ro rang.

### 5.4 Canonical Isolation

Canonical, derived, exploratory, va external la cac layer khac nhau va MUST NOT bi tron lan.

### 5.5 Provenance First

Moi ket qua reasoning MUST trace duoc ve source, line, hoac derivation rule.

### 5.6 Single Traversal Authority

Moi graph traversal phuc vu reasoning MUST di qua mot query/trust engine duy nhat.

### 5.7 AI is Non-Authoritative

AI chi duoc enrich, suggest, va annotate. AI MUST NOT create authoritative truth by itself.

## 6. System Model

### 6.1 Truth Layers

| Layer | Description | Authority | Allowed to conclude |
| --- | --- | --- | --- |
| `canonical` | Parser + deterministic extraction from source code | Parser | Yes |
| `derived` | Deterministic computation from canonical graph | Engine | Yes, if rule-approved |
| `exploratory` | Heuristic or AI-assisted relation | Heuristic/AI | No |
| `external` | User or AI feedback after gating | Approval workflow | No, until promoted |

### 6.2 Flow Types

System MUST phan biet it nhat 3 flow classes:

| Flow type | Edge types | Purpose |
| --- | --- | --- |
| Control Flow | `calls`, `invokes`, `dispatches_to`, `triggers`, `precedes` | execution reasoning |
| Data Flow | `reads`, `writes`, `transforms` | data movement reasoning |
| Contract Flow | `requests`, `returns`, `maps_to`, `binds_to` | FE-BE and API contract reasoning |

Authority edges la lop cat ngang:

- `uses_authority`
- `node_uses_authority`
- `depends_on_authority`

## 7. Graph Model

## 7.1 Runtime Contracts

Codebase MUST co mot runtime graph contract duy nhat.

Moi contract khac MAY ton tai nhu adapter hoac view model, nhung MUST NOT redefine core semantics.

### 7.1.0 Runtime Source of Truth (MANDATORY)

The system MUST define a single authoritative runtime graph contract.

Decision:

- `src/core/types.ts` is the ONLY runtime source of truth for:
  - GraphNode
  - GraphEdge
  - GraphKind
  - ConfidenceBand
  - Provenance

- `src/core/graph/contracts.ts` and any similar files:
  - MUST be treated as adapter/view-model layers
  - MUST NOT redefine semantics
  - MUST NOT introduce alternative field meanings

Violation of this rule is considered a structural architecture error.

### 7.1.1 GraphNode

```ts
type GraphKind = "canonical" | "derived" | "exploratory" | "external"

type ConfidenceBand =
  | "AUTHORITATIVE"
  | "EXTRACTED"
  | "INFERRED"
  | "AMBIGUOUS"

type Provenance = {
  source: "parser" | "analysis" | "ai" | "user"
  artifact_source: string
  producer_stage: string
  timestamp: string
  file?: string
  line_start?: number
  line_end?: number
  rule?: string
}

type GraphNode = {
  id: string
  workspace: string
  project: string
  type: string
  label: string
  source_file?: string
  symbol?: string
  graph_kind: GraphKind
  confidence_band: ConfidenceBand
  confidence_score?: number
  provenance: Provenance
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}
```

### 7.1.2 GraphEdge

```ts
type GraphEdge = {
  id: string
  workspace: string
  from_id: string
  to_id: string
  type: string
  graph_kind: "canonical" | "derived" | "exploratory" | "external"
  confidence_band: ConfidenceBand
  confidence_score?: number
  provenance: Provenance
  metadata?: {
    line?: number
    column?: number
    derivation_rule?: string
    flow_type?: "control" | "data" | "contract" | "authority" | "structural"
  }
  created_at: string
}
```

### 7.1.3 Invariants

System MUST enforce:

- `id` unique
- canonical node MUST have parser provenance
- canonical edge MUST have source reference or deterministic parser evidence
- derived node or edge MUST have derivation rule
- exploratory node or edge MUST be flagged as non-authoritative
- external node or edge MUST be gated and auditable
- external edges MAY be stored, but MUST be excluded from authoritative reasoning until promoted

## 7.2 Confidence Model

Spec nay tach ro 3 lop confidence/trust khac nhau.

### 7.2.1 Evidence Confidence

Gan cho node, edge, fact.

Muc dich:

- mo ta muc do tin cay cua bang chung
- phuc vu builder semantics, validation, promotion rules

Runtime SHOULD support:

- `confidence_band`
- `confidence_score?`

Neu chi duoc implement mot lop trong P0, he thong MUST uu tien `confidence_band`.

### 7.2.2 Decision Status

Gan cho operation reasoning.

```ts
type DecisionStatus =
  | "OK"
  | "AMBIGUOUS"
  | "INSUFFICIENT_EVIDENCE"
  | "EXPLORATORY_ONLY"
  | "PARTIAL"
  | "POLICY_VIOLATION"
```

Decision status cho biet system co duoc phep conclude hay khong.

### 7.2.3 Response Confidence

Gan cho response object.

```ts
type ResponseConfidence = "HIGH" | "MEDIUM" | "LOW"
```

Response confidence la summary cho toan cau tra loi, khong thay the evidence confidence.

## 7.3 Node Types

P0 MUST support it nhat taxonomy sau:

### Structural

- `file`
- `module`
- `namespace`
- `class`
- `interface`
- `function`
- `method`

### Runtime

- `entrypoint`
- `controller_action`
- `api_endpoint`
- `usecase`
- `service`

### Data

- `dto`
- `model`
- `entity`
- `request`
- `response`

### Frontend

- `frontend_route`
- `react_component`
- `hook`

### System

- `external_service`
- `queue`
- `job`

### Conceptual

- `flow`
- `domain`
- `cluster`

## 7.4 Edge Taxonomy

### 7.4.1 Structural Edges

- `contains`
- `imports`
- `inherits`
- `implements`

### 7.4.2 Runtime Edges

- `calls`
- `invokes`
- `dispatches_to`
- `triggers`

Runtime edge extraction boundary:

- parser and adapters MUST emit `invokes` only for higher-level orchestration boundaries where semantic intent is explicit
- parser and adapters MUST emit `calls` for regular symbol-level method or function calls
- if a parser cannot distinguish `invokes` deterministically in P0, it MUST emit `calls` and MUST NOT fabricate `invokes`

### 7.4.3 Entry and Flow Edges

- `entry_of`
- `precedes`
- `belongs_to_flow`

### 7.4.4 Contract Edges

- `requests`
- `returns`
- `maps_to`
- `binds_to`

### 7.4.5 Authority Edges

- `uses_authority`
- `node_uses_authority`
- `depends_on_authority`

### 7.4.6 Data Flow Edges

- `reads`
- `writes`
- `transforms`

### 7.4.7 Exploratory Edges

- `likely_calls`
- `semantic_match`
- `inferred_contract`

Exploratory edges MUST satisfy:

- `graph_kind = exploratory`
- `confidence_band != AUTHORITATIVE`
- MUST be flagged in output if used

## 7.5 Edge Flow Classification Ownership

`flow_type` metadata ownership MUST be explicit.

Ownership:

- canonical and derived builders MUST set `flow_type` when edge semantics are known
- validation stage MUST validate `flow_type` consistency against edge type
- traversal policy engine MUST consume `flow_type` when present

Fallback:

- if `flow_type` is missing, traversal engine MUST derive class from edge type
- fallback derivation MUST emit warning code `FLOW_TYPE_INFERRED`

## 8. Builder Semantics

Builder MUST preserve trust semantics.

### 8.1 Canonical Builder

Canonical builder MUST:

- only materialize parser-backed deterministic facts
- respect canonical node type eligibility
- avoid writing inferred relations into canonical layer

### 8.1.1 Pipeline Integration Point (MANDATORY)

Derived computation MUST have a single deterministic integration point in the pipeline.

P0 decision:

- Stage 04 is the deterministic graph build phase
- Stage 04 MUST be split into deterministic substeps:
  - `04a canonical build`
  - `04b derived build`
- canonical build and derived build MUST execute in the graph build phase
- derived build MUST run after canonical graph materialization
- derived build MUST run before any AI enrichment, verification, wiki generation, or reporting

This means:

- `05_enrich` MUST NOT build derived facts
- AI enrichment MUST remain non-authoritative

Implementation MAY:

- split the graph build phase into separate internal steps
- or introduce a dedicated derived-build stage immediately after canonical build

But the system MUST preserve the ordering:

`canonical build -> derived build -> exploratory or enrichment -> verify -> wiki -> report`

### 8.2 Derived Builder

Derived builder MUST:

- compute deterministic graph facts from canonical graph
- record derivation rule in provenance
- be reproducible from canonical input

Examples:

- flow membership
- authority chain summary
- domain clustering if deterministic and versioned

### 8.2.1 Derived Depth Constraint (MANDATORY)

Derived facts MUST follow controlled depth rules:

- P0: derived MUST be computed directly from canonical inputs
- derived-from-derived is NOT allowed unless:
  - the derivation rule is explicitly versioned
  - the rule is deterministic and reproducible
  - the chain is auditable

Unbounded derived chaining is prohibited.

### 8.2.2 Derived Trust Boundary

Derived facts MAY be used in authoritative reasoning ONLY IF:

- their derivation rule is explicitly defined
- their input is canonical or approved derived
- they can be recomputed deterministically

Otherwise, they MUST be downgraded or treated as exploratory.

### 8.2.3 Confidence Ownership for Derived Facts (MANDATORY)

Trust mapping responsibility MUST be centralized.

- parser and adapter layers MUST emit findings and evidence only
- parser and adapter layers MUST NOT assign authoritative reasoning trust semantics
- validation stage MUST normalize parser-backed facts into trust classes
- derived builder MUST assign trust metadata only for deterministic derived facts

In P0:

- parser-backed validated canonical facts MUST receive their trust classification from the validation layer
- Stage 03 validation MUST assign canonical trust class, including `AUTHORITATIVE` when criteria are satisfied
- derived facts MUST receive their trust classification from the derived builder
- exploratory facts MUST receive non-authoritative trust classification from exploratory builders only
- Stage 04 build MUST preserve assigned trust class and MUST NOT upgrade or downgrade trust without explicit validation rule

### 8.3 Exploratory Builder

Exploratory builder MAY:

- infer likely relations
- attach semantic matches
- annotate fuzzy FE-BE mappings

Exploratory builder MUST NOT:

- overwrite canonical truth
- silently upgrade exploratory relation to authoritative

### 8.4 External Builder

External knowledge MUST enter through:

`suggestion -> validation -> approval -> persist`

External layer MAY be modeled in P0 but its full workflow MAY be deferred.

### 8.4.1 External Anti-Corruption Rule (MANDATORY)

External knowledge MUST NOT directly enter canonical or derived layers.

All external input MUST follow:

`suggestion -> validation -> approval -> exploratory -> (optional promotion)`

### 8.4.2 Promotion Constraints

External knowledge MAY be promoted ONLY IF:

- supported by independent canonical or derived evidence
- validated by deterministic rules or human approval
- logged with full audit trail

### 8.4.3 Prohibited Actions

System MUST NOT:

- allow AI to write directly into canonical layer
- auto-promote exploratory or external relations
- override existing canonical truth without full rebuild

Violation is considered critical trust failure.

### 8.4.4 External Layer Behavior Before Full Implementation (MANDATORY)

If the external workflow is not implemented or not enabled:

- persisted `graph_kind = external` MUST be treated as `INVALID_GRAPH_STATE`
- validation MUST hard-fail

If external workflow is feature-enabled in a limited form:

- external facts MUST be excluded from authoritative reasoning
- external facts MUST be treated at most as exploratory until promoted
- promotion MUST require explicit approval path

## 9. Traversal and Trust Rules

## 9.1 Query Modes

```ts
type QueryMode = "authoritative" | "mixed_safe" | "exploratory"
```

### Authoritative

- MAY use `canonical` and approved `derived`
- MUST NOT use exploratory edges to conclude

### Mixed Safe

- MAY use canonical + derived + bounded exploratory
- bounded exploratory in P0 means maximum `2 hops`
- MUST downgrade result status if exploratory is used
- if only paths beyond the bound exist, MUST return `INSUFFICIENT_EVIDENCE`
- if both bounded and unbounded exploratory paths exist, MUST use bounded paths and emit warnings for discarded unbounded paths

Mixed-safe bound interpretation:

- for path-based operations, hop count means edge count in the selected path
- for neighborhood or set-based traversals, hop count means maximum edge distance from the anchor node

### Exploratory

- MAY include exploratory relations
- MUST be explicitly flagged

## 9.2 Operation Policies

### 9.2.1 Ask

Allowed:

- canonical
- derived
- limited exploratory only in `mixed_safe` or `exploratory`

Rules:

- no canonical or derived path -> `INSUFFICIENT_EVIDENCE`
- exploratory-only answer -> `EXPLORATORY_ONLY`
- exploratory used in mixed-safe -> warning `EXPLORATORY_USED`

### 9.2.2 Impact

Default traversal class:

- Control Flow only

Allowed edges:

- `calls`
- `invokes`
- `dispatches_to`
- `triggers`

Optional:

- `imports`, but MUST be reported as lower-strength propagation

Forbidden:

- `semantic_match`
- `inferred_contract`

### 9.2.3 Lineage

Default traversal class:

- Control Flow + Authority

Allowed:

- `calls`
- `invokes`
- `uses_authority`
- `node_uses_authority`
- `depends_on_authority`

Forbidden:

- `imports` as lineage proof
- `dispatches_to` by default in P0, to avoid routing fan-out ambiguity
- exploratory edges in authoritative lineage

Optional:

- `dispatches_to` MAY be enabled only via explicit policy toggle in governance configuration

### 9.2.4 Wiki

Wiki generation MUST:

- use canonical + derived for conclusions
- use exploratory only for annotations
- show provenance and warnings where relevant

### 9.2.5 Governance

Governance traversal MUST:

- prohibit exploratory authority reasoning
- fail when authority chain cannot be traced end-to-end

### 9.2.6 Reasoning Path Ownership (MANDATORY)

All external-facing reasoning operations MUST execute through the trust-aware query engine.

Direct storage access is allowed only for:

- storage and persistence
- indexing and migration
- explicit debug or admin inspection
- operational reporting that does not perform reasoning

Any external-facing operation that selects, ranks, combines, or concludes over graph data MUST use the trust-aware query engine.

## 9.3 Trust Decision Table

| Operation | Condition | Action |
| --- | --- | --- |
| Ask | No canonical or derived path | `INSUFFICIENT_EVIDENCE` |
| Ask | Uses exploratory edge | warning `EXPLORATORY_USED` |
| Impact | Canonical or derived control path only | `OK` |
| Impact | Uses exploratory relation | `PARTIAL` |
| Lineage | Uses inferred or exploratory authority proof in authoritative mode | `POLICY_VIOLATION` |
| Wiki | Exploratory data present | annotate only |
| Governance | Authority chain broken | `POLICY_VIOLATION` |

## 9.4 Reasoning Composition Rules (MANDATORY)

The system MUST define how multiple evidence paths are combined.

### 9.4.1 Path Selection Priority

When multiple paths exist:

1. Prefer paths composed only of canonical + derived edges
2. Prefer shorter paths over longer paths
3. Prefer higher-confidence paths

### 9.4.2 Mixed Evidence Handling

If multiple paths have different trust levels:

- canonical-only path -> authoritative
- canonical + derived -> authoritative if derived is approved
- any path containing exploratory -> downgrade result

### 9.4.3 Conflict Resolution

If paths lead to conflicting conclusions:

- return `AMBIGUOUS`
- include both reasoning traces
- MUST NOT choose arbitrarily

### 9.4.4 Aggregation Rule

System MUST NOT:

- merge exploratory evidence into authoritative conclusion
- silently average confidence across unrelated paths

### 9.4.5 Output Requirement

`QueryResult` MUST include:

- selected reasoning path or paths
- rejected path or paths when available
- explanation for selection

### 9.4.6 Path Status Aggregation (MANDATORY)

`QueryResult.status` MUST be derived from `selected_paths[*].status` using pessimistic aggregation.

P0 aggregation precedence (worst to best):

1. `POLICY_VIOLATION`
2. `INSUFFICIENT_EVIDENCE`
3. `AMBIGUOUS`
4. `EXPLORATORY_ONLY`
5. `PARTIAL`
6. `OK`

Rule:

- overall status MUST equal the worst status among selected paths

### 9.4.7 TrustLevel Mapping (MANDATORY)

`ReasoningPath.trust_level` MUST be computed by the trust-aware query engine.

Computation model:

- `graph_kind` composition is the primary signal for `trust_level`
- `confidence_band` is a safety modifier for path status

P0 mapping:

- `AUTHORITATIVE`: path uses only canonical edges and no exploratory edges
- `DERIVED`: path uses canonical plus derived edges, and no exploratory edges
- `EXPLORATORY`: path uses only exploratory evidence for conclusion
- `MIXED`: path contains both authoritative or derived evidence and exploratory evidence

If mapping cannot be determined deterministically, path status MUST be downgraded to `AMBIGUOUS`.

Confidence-band modifiers:

- if any selected path element has `confidence_band = AMBIGUOUS`, path status MUST be at least `AMBIGUOUS`
- if any selected path element has `confidence_band = INFERRED` and no exploratory evidence is present, path status MUST be at least `PARTIAL`

## 10. Query Output Contract

Moi trusted query surface MUST tra ve trust-aware contract.

```ts
type TrustLevel = "AUTHORITATIVE" | "DERIVED" | "EXPLORATORY" | "MIXED"

type ReasoningPath = {
  path_id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  trust_level: TrustLevel
  status: DecisionStatus
  summary: string
}

type QueryProvenanceSource = {
  source: "parser" | "analysis" | "ai" | "user"
  artifact_source: string
  producer_stage: string
  timestamp: string
  file?: string
  line_start?: number
  line_end?: number
  rule?: string
}

type QueryResult = {
  status: DecisionStatus

  reasoning: {
    selected_paths: ReasoningPath[]
    rejected_paths?: ReasoningPath[]
    selection_explanation: string[]
  }

  data: {
    // Flattened projection from selected_paths for convenience consumers
    nodes: GraphNode[]
    edges: GraphEdge[]
  }

  confidence: {
    level: "HIGH" | "MEDIUM" | "LOW"
    reasons: string[]
  }

  provenance: {
    // Projection of runtime Provenance for response explainability
    sources: QueryProvenanceSource[]
  }

  warnings: string[]
  codes: string[]
}
```

### 10.1 Required Rules

Trusted query surfaces MUST:

- not return raw graph without status and provenance
- include warnings when exploratory or partial reasoning is involved
- include machine-readable codes
- use `DecisionStatus` as the single status type source
- avoid inline status-union duplication in external-facing contracts
- define `data.nodes` and `data.edges` as flattened projection from `reasoning.selected_paths`
- when `status = AMBIGUOUS`, flattened projection MUST include the union of selected path nodes and edges, while disambiguation MUST rely on `reasoning.selected_paths`

### 10.2 Scope

MUST use `QueryResult` or equivalent trust-aware contract:

- MCP query tools
- MCP review tools
- MCP impact tools
- CLI `ask`
- CLI `impact`
- inputs to wiki generation

Rendered wiki pages and UI panels MAY transform this contract into view models, but MUST derive from trust-aware source data.

### 10.3 Consumer Types (MANDATORY)

System MUST distinguish between:

#### A. Reasoning Consumers (AI / MCP / CLI)

- MUST receive full `QueryResult`
- MUST NOT receive raw graph without context

#### B. Human / Debug Consumers

- MAY access raw graph for inspection
- MUST NOT use raw graph for reasoning without `QueryResult`

#### C. Internal Engine

- MAY use raw graph for computation
- MUST output `QueryResult` for any external-facing operation

### 10.4 Rule

No consumer interacting with AI agents may bypass the trust-aware contract.

### 10.5 VS Code Extension Classification (MANDATORY)

The VS Code extension MUST be classified by operation mode.

#### User-facing reasoning commands

- MUST be treated as Reasoning Consumers
- MUST receive full `QueryResult`

#### Debug or graph inspection views

- MAY be treated as Human or Debug Consumers
- MAY inspect raw graph data

The extension MUST NOT pass raw graph data into AI-facing reasoning flows without trust-aware wrapping.

## 11. Standard Status and Error Codes

The system MUST define stable machine-readable codes.

### 11.1 Status Codes

- `OK`
- `AMBIGUOUS`
- `INSUFFICIENT_EVIDENCE`
- `EXPLORATORY_ONLY`
- `PARTIAL`
- `POLICY_VIOLATION`

### 11.2 Error and Warning Codes

- `EXPLORATORY_USED`
- `TRAVERSAL_FORBIDDEN`
- `AUTHORITY_CHAIN_BROKEN`
- `INVALID_GRAPH_STATE`
- `INVALID_EDGE_TYPE`
- `CANONICAL_PROVENANCE_MISSING`
- `GRAPH_QUERY_TIMEOUT`
- `GRAPH_RESULT_TRUNCATED`
- `FLOW_TYPE_INFERRED`

User-facing strings MAY vary. Machine-readable codes MUST remain stable.

## 12. Validation Rules

## 12.1 Hard Fail

System MUST hard fail on:

- edge without type
- canonical node without authoritative provenance
- canonical edge without evidence or deterministic parser proof
- invalid graph kind
- invalid traversal mode
- invalid query result state
- persisted `graph_kind = external` when external workflow is disabled or not implemented

## 12.2 Soft Warning

System SHOULD emit warnings for:

- low-confidence evidence
- orphan node
- flow without entrypoint
- exploratory annotation in otherwise authoritative output
- truncated result set

## 12.3 Validation Scope

Validation MUST run at least at:

- build time
- query time for trusted operations
- report generation time

## 13. Governance Hooks

## 13.1 Authority Chain Validation

System MUST support:

- tracing complete authority chain
- rejecting authority conclusions that depend on exploratory proof

## 13.2 Forbidden Pattern Detection

System SHOULD support policies such as:

- frontend calling database directly
- route bypassing use case
- service writing state without declared authority

## 13.3 Flow Integrity

System SHOULD validate:

- entrypoint leads to reachable downstream flow
- no dead branch in declared critical flow
- critical path does not terminate unexpectedly

## 13.4 Governance Policy Source (MANDATORY)

P0 governance policy source-of-truth MUST be YAML-based configuration.

Policy sources:

- `knowledge.config.yaml`
- optional workspace `rules_path` file

Rules:

- workspace-level policy overrides global defaults
- P0 MUST NOT require DB policy storage
- DB-backed policy store MAY be introduced after P0
- `pipeline/config.ts` is an implementation loader for YAML policy sources, not an independent policy authority

## 14. Explainability Requirements

Wiki va explainability surfaces MUST:

- show provenance
- show confidence summary
- distinguish authoritative conclusions from exploratory annotations
- support reverse navigation where possible
- render flow/domain/entrypoint structure where available

## 15. Implementation Constraints from Current Codebase

Spec nay duoc thiet ke de khop voi codebase hien tai nhung khac phuc cac sai lech quan trong.

### 15.1 Confirmed Starting Points

Codebase da co:

- local-first SQLite graph
- pipeline `01_sync -> 08_report`
- query engine foundation
- authority edge seeds
- MCP/CLI/wiki surfaces

### 15.2 Mandatory Corrections

Implementation MUST sua:

- duplicate graph contract definitions
- builder semantics dang collapse inferred vao canonical
- DB bypass trong reasoning paths
- shallow validation va traversal policy placeholder
- current builder taxonomy flattening into `canonical_dependency`
- current canonical edges carrying inferred confidence
- current query traversal missing enforced edge-policy table

### 15.2.1 Known P0 Reasoning Bypasses

The following current code paths are known bypasses or partial bypasses of the intended trust-aware query boundary and MUST be reviewed first:

- `src/mcp/tools/query.ts`
- `src/mcp/tools/graph.ts`
- `src/mcp/tools/search.ts`
- `src/mcp/tools/review.ts`
- `src/mcp/tools/wiki.ts`
- `src/pipeline/impactReport.ts`
- CLI reasoning-adjacent command paths in `src/cli/index.ts`

`GraphDB` itself is not a violation. The violation occurs when external-facing reasoning logic queries storage directly instead of going through the trust-aware query engine.

Current-state observations that MUST be addressed in implementation:

- `04_buildGraph` currently flattens relationships into `canonical_dependency`
- canonical edges currently carry inferred trust in canonical layer
- current query engine traversal is not yet enforcing the edge-policy table required by this spec

### 15.3 Current-Code-Informed Design Decisions

Vi codebase hien tai dang dung trust bands, P0 SHOULD:

- keep `confidence_band`
- optionally add `confidence_score`

Vi `graph_kind` trong storage hien dang la `TEXT`, rollout MAY them `derived` va `external` ma khong can bat buoc breaking storage migration. Tuy nhien TypeScript contracts, builders, filters, va validation MUST duoc cap nhat dong bo.

Compatibility note for confidence naming:

- current storage and mapper layers use the `confidence` column
- runtime contract in this spec uses `confidence_band`
- P0 implementations MUST provide explicit mapper bridging between `confidence` in storage and `confidence_band` in runtime contracts
- direct storage-column rename from `confidence` to `confidence_band` is a breaking migration and MUST be treated as such

### 15.4 Parser-to-Trust Mapping Boundary

P0 MUST centralize trust mapping as follows:

- parser emits parsed symbols and evidence
- adapter emits candidate records and evidence spans
- stage 03 validation maps parser-backed validated facts into canonical trust classes
- graph build materializes validated facts without redefining their trust class
- derived builder assigns trust metadata for deterministic derived facts

Stage-level authority:

- Stage 03 validation is the authority for assigning parser-backed `AUTHORITATIVE` trust classification when criteria are met
- Stage 04 builders MUST preserve assigned trust class unless an explicit validation rule authorizes changes

Adapters MUST NOT independently decide what is authoritative reasoning truth.

## 16. Migration and Rollout Strategy

## 16.1 Additive Changes

Additive:

- new edge types
- new status codes
- `confidence_score`
- support for more graph layers when storage accepts text values

## 16.2 Breaking Changes

Breaking:

- replacing runtime graph contract
- changing canonical semantics
- changing trusted output contract for MCP or CLI
- removing direct DB reasoning bypass

## 16.3 Required Order

Implementation SHOULD proceed in this order:

1. unify runtime graph contract
2. add graph layer and confidence support in storage and mappers
3. split Stage 04 into `04a canonical build` and `04b derived build`, then correct builder semantics
4. enforce query chokepoint
5. implement traversal plus trust engine
6. implement validation and governance hooks
7. ensure Stage 05 enrich remains non-authoritative and cannot create derived facts
8. update wiki explainability
9. expand parser and taxonomy coverage
10. full rebuild graph and downstream artifacts

## 16.4 Rebuild Rules

System MUST invalidate and rebuild graph artifacts when:

- graph layer semantics change
- canonical edge semantics change
- provenance model changes
- derived layer rules change in a way that affects trusted output

Backfill SHOULD NOT be preferred over full rebuild when old semantics are incompatible.

## 17. Observability and Evaluation

System SHOULD emit metrics for:

- queries by status
- exploratory usage rate
- insufficient evidence rate
- policy violations
- authority chain failures
- validation hard-fails
- validation soft-warnings

Muc dich:

- verify fail-closed behavior
- detect drift after parser or taxonomy changes
- measure authoritative coverage

### 17.1 P0 Observability Mechanism (MANDATORY)

P0 observability MUST be local-first and file-based.

The system SHOULD write:

- trust event stream to `knowledge/reports/<workspace>/trust-events.jsonl`
- trust summary snapshots to `knowledge/reports/<workspace>/trust-summary.json`

P0 trust event schema MUST be stable across MCP, CLI, and query engine emitters.

```ts
type TrustEvent = {
  timestamp: string
  workspace_id: string
  operation: string
  mode: "authoritative" | "mixed_safe" | "exploratory"
  status: DecisionStatus
  codes: string[]
  warnings: string[]
  selected_path_count: number
}
```

These artifacts:

- MUST be treated as operational outputs
- MUST NOT be treated as graph truth
- MUST NOT require a remote telemetry backend

SQLite or other stores MAY be introduced later, but file-based observability is the P0 default.

## 18. Definition of Done

Spec duoc xem la dat P0 implementation readiness khi:

- co mot runtime graph contract duy nhat
- parser output va builder output tuan theo graph layer semantics
- no inferred relation is silently stored as canonical truth
- query engine enforce traversal rules by operation and mode
- trusted query surfaces tra ve trust-aware output contract
- MCP and CLI reasoning paths do not bypass the query engine
- validation catches invalid canonical state
- wiki distinguishes authoritative conclusions from exploratory annotations
- governance hooks can reject broken authority reasoning
- observability exists for trust outcomes

## 19. Final Statement

> This system is not merely a graph system.
> It is a graph-backed, fail-closed deterministic reasoning system.

Graph la substrate cot loi.
Gia tri san pham den tu trust model, traversal policy, explainable output, va failure semantics.
