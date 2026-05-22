# SPEC.md — Trusted Code Intelligence Platform

> Synthesized from TypeScript source files, type contracts, pipeline stages, docs,
> and the Python reference implementation packed at
> `.harness-backup/20260516162847/docs/code-review-graph.md`.
> Last updated: 2026-05-18. Status: **Authoritative for the TypeScript target**.

---

## 1. Purpose & Problem Statement

`code-review-graph` (CLI binary: `crg`) is a **local-first, trust-aware codebase intelligence graph** that parses multi-language source code into a SQLite knowledge graph and exposes it via CLI, MCP server (Claude Desktop), and VS Code extension.

**Core problem solved**: Code reviews lack structured, queryable context about system impact. Developers cannot instantly map which endpoints, use cases, DTOs, or services are affected by a change. Risk assessment is manual and requires deep contextual knowledge.

**Key differentiator**: The graph enforces a strict **multi-layer trust model** (canonical → derived → exploratory → external) with fail-closed query semantics. The system returns `INSUFFICIENT_EVIDENCE` rather than guessing. Every fact carries full provenance.

### 1.1 What Is In Scope

- Parse and store code structure for C#, TypeScript/React, and structured config files
- Impact analysis: given a git diff, compute blast radius across endpoints, use cases, DTOs
- Trust-aware graph queries with full reasoning traces and provenance
- MCP integration for Claude Desktop (AI-native code review context)
- VS Code extension for inline graph access
- CLI for human and automation use

### 1.2 What Is Out of Scope

- Runtime monitoring or execution tracing (static analysis only)
- Dynamic profiling or performance measurement
- Deployment orchestration
- Distributed graph processing
- Real-time collaboration

### 1.3 Python Reference Migration Policy

The packed Python implementation is accepted as a **reference implementation**
for product capability discovery, not as a replacement architecture.

Migration rules:

- TypeScript remains the target runtime and source of implementation truth.
- Python features may enrich this spec only when rewritten into TypeScript
  concepts, contracts, validation expectations, and story candidates.
- Reference benchmark numbers, language counts, and tool counts must not be
  represented as implemented TypeScript behavior until TypeScript proof exists.
- Python-specific implementation choices (`fastmcp`, `networkx`,
  `code_review_graph/`, Python packaging, `crg-daemon`) are design inputs, not
  direct contracts.
- Shared product ideas such as tool filtering, installer onboarding, multi-repo
  watch, evaluation benchmarks, visualization, hybrid search, and richer parser
  coverage may become planned TypeScript migration work.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Consumer Layer                             │
│  CLI (crg) · MCP Server · VS Code Ext      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  OperationResolver                          │
│  Validates caller + operation + mode        │
│  Mandatory gateway — no bypass              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  TrustAwareQueryEngine                      │
│  EdgePolicyTable · TrustAwareTraversal      │
│  PathSelector · QueryResultFactory          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  GraphDB (SQLite WAL + FTS5)                │
│  nodes · edges · facts · rejects            │
│  file_hashes · semantic_facts · embeddings  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  12-Stage Pipeline                          │
│  01_sync → 02_extract → 03_normalize →      │
│  04_validate → 05a–05d_build →              │
│  06_enrich → 07_verify → 08_wiki → 09_report│
└─────────────────────────────────────────────┘
```

### 2.1 Design Principles

1. **Fail-Closed**: Returns `INSUFFICIENT_EVIDENCE` rather than guessing. No silent fallback between query modes.
2. **Trust Layering**: Every node and edge carries `graph_kind` (canonical/derived/exploratory/external) and `confidence_band` (AUTHORITATIVE/EXTRACTED/INFERRED/AMBIGUOUS).
3. **Single Query Chokepoint**: All reasoning passes through `OperationResolver` → `TrustAwareQueryEngine`. No bypass paths.
4. **Deterministic Pipeline**: Fixed execution order, deterministic outputs for identical inputs.
5. **Workspace Isolation**: One workspace cannot read or affect another workspace's graph.
6. **Provenance Everywhere**: Every fact traces back to source with file, line, extraction method, and timestamp.

---

## 3. Type System (Source of Truth: `src/core/types.ts`, `src/core/errors.ts`)

### 3.1 Core Enumerations

```typescript
// Trust layer of a node or edge
type GraphKind = 'canonical' | 'derived' | 'exploratory' | 'external';

// Evidence confidence classification
type ConfidenceBand = 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

// Trust level for reasoning paths
type TrustLevel = 'AUTHORITATIVE' | 'DERIVED' | 'EXPLORATORY' | 'MIXED';

// Query operation types
type OperationType = 'ask' | 'impact' | 'lineage' | 'wiki' | 'governance';

// Query mode (controls which graph layers are visible)
type QueryMode = 'authoritative' | 'mixed_safe' | 'exploratory';

// Response confidence summary
type ResponseConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

// Node functional role
type NodeRole =
  | 'entrypoint' | 'http_handler' | 'event_handler'
  | 'domain' | 'contract' | 'config' | 'infra';
```

### 3.2 GraphNode

```typescript
interface GraphNode {
  id: string;
  // Required for canonical/derived; null for exploratory/external
  stableKey: string | null;
  workspace: string;
  project: string;
  type: NodeType;        // From node type taxonomy (§3.6)
  label: string;
  source_file?: string;
  symbol?: string;
  graph_kind: GraphKind;
  confidence_band: ConfidenceBand;
  confidence?: string;   // @deprecated — use confidence_band
  confidence_score?: number;  // 0–1
  provenance: Provenance;
  metadata?: Record<string, unknown>;
  trust_level?: TrustLevel;
  created_at?: string;
  updated_at?: string;
  // Legacy / language-specific fields
  http_method?: string;
  http_path?: string;
  domain?: string;
  lang_meta?: Record<string, unknown>;
}
```

### 3.3 GraphEdge

```typescript
interface GraphEdge {
  id: string;
  stableKey: string | null;  // Same semantics as GraphNode.stableKey
  workspace: string;
  from_id: string;
  to_id: string;
  type: string;              // From EdgeType taxonomy (§3.5)
  graph_kind: GraphKind;
  confidence_band: ConfidenceBand;
  confidence?: string;       // @deprecated
  confidence_score?: number;
  provenance: Provenance;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    line?: number;
    column?: number;
    derivation_rule?: string;   // Required for derived edges
    flow_type?: 'control' | 'data' | 'contract' | 'authority' | 'structural';
    fromSymbol?: string;
    toSymbol?: string;
    [key: string]: unknown;
  };
  trust_level?: TrustLevel;
}
```

### 3.4 Provenance

```typescript
interface Provenance {
  source: 'parser' | 'analysis' | 'ai' | 'user';
  artifact_source: string;      // File path or adapter ID
  producer_stage: string;       // Pipeline stage name
  timestamp: string;            // ISO 8601
  file?: string;
  line_start?: number;
  line_end?: number;
  rule?: string;                // Derivation rule (derived edges)
  workspaceId?: string;
  sourceRootId?: string;
  filePath?: string;            // Alias for file
  extractionStage?: string;     // Alias for producer_stage
  extractionMethod?: string;    // ast | static-analysis | regex | doc-parse | manual
  adapterId?: string;
  adapterVersion?: string;
  confidence?: number;          // 0–1
  hash?: string;                // Content hash for drift detection
}
```

### 3.5 EdgeType Taxonomy

```typescript
const EdgeType = {
  // Structural
  contains, imports, inherits, implements, delegates_to,
  configures, defines_schema, documents, deploys,

  // Runtime
  calls, invokes, dispatches_to, triggers,

  // Entry & Flow
  entry_of, precedes, belongs_to_flow,

  // Contract
  requests, returns, maps_to, binds_to,

  // Authority
  uses_authority, node_uses_authority, depends_on_authority,

  // Data Flow
  reads, writes, transforms,

  // Exploratory (non-authoritative)
  likely_calls, semantic_match, inferred_contract,

  // Layer build artifacts
  canonical_dependency, derived_dependency, exploratory_dependency,
} as const;
```

**flow_type mapping per edge category**:

| EdgeType group | flow_type |
|---|---|
| calls, invokes, dispatches_to, triggers, entry_of, precedes, belongs_to_flow | `control` |
| reads, writes, transforms | `data` |
| requests, returns, maps_to, binds_to | `contract` |
| uses_authority, node_uses_authority, depends_on_authority | `authority` |
| contains, imports, inherits, implements, delegates_to, defines_schema | `structural` |
| likely_calls, semantic_match, inferred_contract | (inferred) |

### 3.6 Node Type Taxonomy

| Category | Node Types |
|---|---|
| Structural | `file`, `module`, `namespace`, `class`, `interface`, `function`, `method` |
| Runtime | `entrypoint`, `controller_action`, `api_endpoint`, `usecase`, `service` |
| Data | `dto`, `model`, `entity`, `request`, `response` |
| Frontend | `frontend_route`, `react_component`, `hook` |
| System | `external_service`, `queue`, `job` |
| Conceptual | `flow`, `domain`, `cluster` |

### 3.7 CandidateRecord (Adapter Output Contract)

```typescript
interface CandidateRecord {
  candidate_id: string;
  candidate_type: NodeType;
  workspaceId: string;
  project: string;
  source_file: string;
  symbol: string;
  line_start: number;
  line_end: number;
  status: 'candidate' | 'validated' | 'rejected';
  extractor: string;
  evidence: EvidenceSpan[];
  called_symbols?: string[];
  is_entrypoint?: boolean;
  entrypoint_class?: 'api' | 'command' | 'event' | 'unknown';
  execution_role?: string;
  http_method?: string;
  http_path?: string;
  annotations?: string[];
  roles?: NodeRole[];
  framework?: string;
  language?: string;
  lang_meta?: Record<string, unknown>;
  domain?: string;
}

interface NormalizedFact extends CandidateRecord {
  fact_id: string;
  trust_level?: TrustLevel;
  decision_status?: DecisionStatus;
}
```

---

## 4. Error Taxonomy (Source: `src/core/errors.ts`)

### 4.1 DecisionStatus — Query/Reasoning Outcome (7 codes)

| Code | Meaning |
|---|---|
| `OK` | Query answered with sufficient evidence |
| `AMBIGUOUS` | Multiple conflicting interpretations exist |
| `INSUFFICIENT_EVIDENCE` | No canonical/derived path found; system cannot conclude |
| `EXPLORATORY_ONLY` | Answer exists only in exploratory layer |
| `PARTIAL` | Partial answer with gaps in evidence chain |
| `POLICY_VIOLATION` | Query violates trust or workspace policy |
| `UNSUPPORTED_QUERY` | Operation type not supported for this query |

### 4.2 RuntimeCode — Query-time Warnings/Errors (12 codes)

Defined in `src/core/errors.ts` as stable enum constants:

| Code | When Emitted |
|---|---|
| `EXPLORATORY_USED` | Exploratory edges traversed in mixed_safe mode |
| `TRAVERSAL_FORBIDDEN` | Edge blocked by EdgePolicyTable |
| `AUTHORITY_CHAIN_BROKEN` | Authority chain depends on exploratory proof |
| `INVALID_GRAPH_STATE` | Graph state invariant violated |
| `INVALID_EDGE_TYPE` | Edge has no recognized type |
| `CANONICAL_PROVENANCE_MISSING` | Canonical node lacks parser provenance |
| `GRAPH_QUERY_TIMEOUT` | Traversal exceeded time limit |
| `GRAPH_RESULT_TRUNCATED` | Output truncated at configured limit |
| `FLOW_TYPE_INFERRED` | flow_type derived from edge type (not explicit) |
| `OPERATION_UNMAPPED` | Caller has no implicit operation and none was provided |
| `GRAPH_QUERY_POLICY_BLOCKED` | Query blocked by graph policy |
| `GRAPH_QUERY_INSUFFICIENT_CONTEXT` | Context too sparse to answer |

**Inline codes emitted by `EdgePolicyTable.evaluateEdge()`** (not in enum — raw strings in policy decisions):

| Code | Condition |
|---|---|
| `CONFIDENCE_BAND_NOT_ALLOWED` | Band not in mode whitelist; AMBIGUOUS non-exploratory edge in mixed_safe |
| `EXTERNAL_WORKFLOW_DISABLED` | External edge traversed in authoritative or mixed_safe mode |
| `EXPLORATORY_FORBIDDEN_IN_AUTHORITATIVE` | Exploratory edge encountered in authoritative mode |
| `EXPLORATORY_HOP_LIMIT_EXCEEDED` | >2 exploratory hops in mixed_safe mode |
| `GOVERNANCE_REQUIRES_AUTHORITY` | Non-canonical/derived edge in governance operation |
| `EDGE_TYPE_NOT_ALLOWED_FOR_GOVERNANCE` | Edge type not in authority group for governance op |
| `IMPACT_REQUIRES_CONTROL_FLOW` | Non-control-flow edge in impact operation |
| `LINEAGE_REQUIRES_AUTHORITY_CHAIN` | Edge type not allowed for lineage traversal |
| `WIKI_AUTHORITATIVE_FORBIDS_EXPLORATORY` | Exploratory edge in wiki/authoritative operation |
| `UNKNOWN_OPERATION` | Operation type not handled by policy switch |

> These codes appear in `QueryResult.codes[]` and `PolicyDecision.codes[]` but are not exported from `errors.ts`. When checking for these in consumers, use string literals.

### 4.3 PipelineError — Stage Failure Codes (15 codes)

| Code | Stage |
|---|---|
| `WORKSPACE_CONFIG_INVALID` | Config load |
| `ADAPTER_NOT_FOUND` | Extract |
| `EXTRACTION_FAILED` | Extract |
| `NORMALIZATION_FAILED` | Normalize |
| `AUTHORITY_POLICY_CONFLICT` | Validate |
| `PROVENANCE_MISSING` | Validate |
| `CANONICAL_PROMOTION_DENIED` | Build canonical |
| `GRAPH_BUILD_FAILED` | Build |
| `WORKSPACE_BOUNDARY_VIOLATION` | Any stage |
| `ASK_UNSUPPORTED_QUERY` | Ask engine |
| `ASK_AMBIGUOUS_INTENT` | Ask engine |
| `AGENT_CONTEXT_INSUFFICIENT` | Agent context builder |
| `WIKI_SOURCE_POLICY_VIOLATION` | Wiki builder |
| `DRIFT_BASELINE_MISSING` | Drift detector |
| `VERIFY_FAILED` | Verify |

---

## 5. Query Engine

### 5.1 OperationResolver — Mandatory Gateway

Every query operation must pass through `OperationResolver.resolve()` before reaching `TrustAwareQueryEngine`. Unregistered callers throw `OPERATION_UNMAPPED`.

**Registered CallerIDs and their implicit OperationType**:

| CallerID | OperationType |
|---|---|
| `cli.ask` | ask |
| `cli.impact` | impact |
| `cli.stats` | wiki |
| `cli.search` | ask |
| `cli.export` | wiki |
| `cli.verify` | governance |
| `cli.wiki` | wiki |
| `service.ask` | ask |
| `pipeline.impact` | impact |
| `structured-ask` | ask |
| `agent-context` | ask |
| `report-builder` | wiki |
| `mcp.query.get_node` | ask |
| `mcp.query.get_neighbors` | impact |
| `mcp.query.get_path` | lineage |
| `mcp.query.get_callers` | lineage |
| `mcp.review.review_diff` | impact |
| `mcp.review.review_pr` | impact |
| `mcp.review.detect_changes` | impact |
| `mcp.review.blast_radius` | impact |
| `mcp.review.get_risk_score` | impact |
| `mcp.graph.graph_stats` | wiki |
| `mcp.graph.architecture_overview` | wiki |
| `mcp.graph.list_communities` | wiki |
| `mcp.graph.get_community` | wiki |
| `mcp.graph.find_hubs` | wiki |
| `mcp.graph.find_bridges` | wiki |
| `mcp.graph.find_gaps` | wiki |
| `mcp.wiki.get_wiki_page` | wiki |
| `mcp.wiki.generate_wiki` | wiki |
| `mcp.search.search` | ask |
| `mcp.flows.list_flows` | wiki |
| `mcp.flows.get_flow` | wiki |
| `mcp.flows.get_affected_flows` | impact |
| `mcp.flows.get_minimal_context` | ask |
| `mcp.flows.get_lineage` | lineage |
| `mcp.refactor.rename_preview` | impact |
| `mcp.refactor.find_dead_code` | impact |

### 5.2 Query Modes (EdgePolicyTable)

| Mode | Visible GraphKinds | Allowed ConfidenceBands | Exploratory Cap | Fail Behavior |
|---|---|---|---|---|
| `authoritative` | canonical only¹ | AUTHORITATIVE | N/A | INSUFFICIENT_EVIDENCE |
| `mixed_safe` | canonical + derived + exploratory² | AUTHORITATIVE, EXTRACTED, INFERRED³ | 2 hops max | INSUFFICIENT_EVIDENCE beyond cap |
| `exploratory` | all layers (incl. external) | All | Unlimited | EXPLORATORY_ONLY if no canonical path |

**Notes**:
1. `authoritative` `isNodeVisible` enforces **all three** conditions: `graph_kind === 'canonical'` AND `confidence_band === 'AUTHORITATIVE'` AND `provenance.source === 'parser'`. AI-written canonical nodes are invisible even if tagged canonical.
2. `mixed_safe` excludes `external` graph_kind nodes entirely. External nodes are only visible in `exploratory` mode.
3. `mixed_safe` blocks `AMBIGUOUS` confidence band **except** on exploratory edges. An AMBIGUOUS non-exploratory edge returns `CONFIDENCE_BAND_NOT_ALLOWED`.

### 5.3 QueryResult Contract

```typescript
interface QueryResult {
  status: DecisionStatus;
  reasoning: {
    selected_paths: ReasoningPath[];
    rejected_paths?: ReasoningPath[];
    selection_explanation: string[];
  };
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    [key: string]: unknown;
  };
  confidence: {
    level: ResponseConfidence;  // HIGH | MEDIUM | LOW
    reasons: string[];
  };
  provenance: {
    sources: Provenance[];
  };
  warnings: string[];
  codes: string[];
  metadata?: {
    policy?: {
      operation: OperationType | null;
      mode: QueryMode | null;
      traversedEdgeCount: number;
      blockedEdgeCount: number;
      blockedCodes: string[];
    };
    tool?: { name: string; workspace?: string; project?: string };
    [key: string]: unknown;
  };
}
```

### 5.4 Path Selection Priority (Deterministic)

1. All-canonical paths (highest priority)
2. Canonical + derived paths
3. Paths with exploratory (mixed_safe/exploratory mode only)
4. Shorter paths preferred over longer
5. Higher confidence paths preferred (lower edge weight wins)
6. Lexicographic ordering by node IDs as final tie-breaker

**Edge weight table** (`EdgePolicyTable.getEdgeWeight()`):

| ConfidenceBand | Weight |
|---|---|
| `AUTHORITATIVE` | 1 |
| `EXTRACTED` | 2 |
| `INFERRED` | 5 |
| `AMBIGUOUS` | 20 |
| unknown | 100 |

Path weight = sum of all edge weights. Lower total weight = higher ranked path.

**Pessimistic status aggregation** (when multiple paths):
`POLICY_VIOLATION` > `INSUFFICIENT_EVIDENCE` > `AMBIGUOUS` > `EXPLORATORY_ONLY` > `PARTIAL` > `OK`

### 5.5 Operation-Specific Traversal Rules (EdgePolicyTable)

| Operation | Allowed Edge Types | Exploratory Allowed? |
|---|---|---|
| `impact` | control flow edges (calls, invokes, dispatches_to, triggers); imports optional | No in authoritative; bounded in mixed_safe |
| `lineage` | control flow + authority edges; imports rejected as lineage proof | No |
| `governance` | canonical/derived only; authority edges only | No |
| `wiki` | canonical + derived for conclusions; exploratory for annotations only | Annotations only |
| `ask` | general traversal per mode constraints | Per mode |

### 5.6 StructuredAskEngine — User-Facing Query Types

Maps 7 user-facing query types to internal OperationTypes:

| StructuredQueryType | OperationType |
|---|---|
| `what-is-symbol` | ask |
| `what-depends-on` | impact |
| `what-route-calls` | lineage |
| `lineage` | lineage |
| `impact` | impact |
| `why-canonical` | governance |
| `why-insufficient-context` | governance |

> Note: `wiki`, `refactor`, and `search` are internal operations used by WikiBuilder, rename tools, and FTS — not exposed as user-facing query types.

---

## 6. Pipeline (12 Stages)

All stage files live in `src/pipeline/stages/`. Executed sequentially by `src/pipeline/run.ts`.

| # | File | Responsibility | Input → Output |
|---|---|---|---|
| 01 | `01_sync.ts` | Copy source files to workspace-scoped storage | Config → `knowledge/sources/{workspace}/{project}/` |
| 02 | `02_extract.ts` | Hash-based incremental extraction via adapters | Source files → `CandidateRecord[]` |
| 03 | `03_normalize.ts` | Uniform schema, stable keys, dedup | `CandidateRecord[]` → `NormalizedFact[]` |
| 04 | `04_validate.ts` | NodeTypeRegistry gate; hard-fail on invalid facts | `NormalizedFact[]` → validated/rejected split |
| 05a | `05a_build_canonical.ts` | Materialize parser-backed canonical nodes/edges | Validated facts → canonical graph layer |
| 05b | `05b_build_derived.ts` | Compute derived facts with explicit derivation rules | Canonical graph → derived layer |
| 05c | `05c_build_exploratory.ts` | Store heuristic/AI relations as non-authoritative | Facts → exploratory layer |
| 05d | `05d_build_flows.ts` | Derive flow_domain nodes and belongs_to_flow edges | Graph → flow graph |
| 06 | `06_enrich.ts` | Optional AI enrichment via OpenRouter (disabled by default) | Graph → enriched metadata |
| 07 | `07_verify.ts` | Graph invariants, flow integrity, governance rules | Graph → verification report |
| 08 | `08_wiki.ts` | Generate trust-aware markdown wiki pages | Verified graph → wiki pages |
| 09 | `09_report.ts` | Write quality metrics, lint, digest, verification JSON | All artifacts → reports |

### 6.1 Graph Build Enforcement Rules

**Canonical layer (`05a_build_canonical.ts`)**:
- Node ID uniqueness across workspace
- Canonical nodes require parser provenance (`source: 'parser'`)
- No AI writing directly into canonical layer
- No silent exploratory → canonical upgrade

**Derived layer (`05b_build_derived.ts`)**:
- Derived nodes/edges require `metadata.derivation_rule`
- No derived-from-derived unless rule is versioned, deterministic, and auditable

**Exploratory layer (`05c_build_exploratory.ts`)**:
- All nodes/edges flagged as non-authoritative
- Cannot overwrite canonical facts

**External gating (all layers)**:
- External nodes/edges only when `external_workflow_enabled: true` in config
- Persisted `external` graph_kind when disabled → `INVALID_GRAPH_STATE` hard-fail
- External facts excluded from authoritative and mixed_safe reasoning

### 6.2 Incremental Extraction

- Hash-based change detection via `file_hashes` table
- Import map cached at `knowledge/artifacts/internal/index/{projectId}.imports.json`
- Only re-parse files with changed hash or changed imports
- Full rebuild: re-parse all files

---

## 7. Source Adapters

### 7.1 IProjectAdapter Contract

```typescript
interface IProjectAdapter {
  parse(paths: string[], context: AdapterContext): Promise<unknown>;
  extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]>;
  enrich(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  classify(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  identify_entrypoints(
    candidates: CandidateRecord[],
    context: AdapterContext
  ): Promise<CandidateRecord[]>;
}

interface AdapterContext {
  workspaceId: string;
  projectId: string;
  projectRoot: string;
}
```

**Adapter rules**:
- Adapters emit findings and evidence only — they do NOT assign trust semantics
- On unparseable file: emit `EXTRACTION_FAILED` error and continue (no abort)
- Full provenance must be populated: `adapterId`, `adapterVersion`, `extractionMethod`, `filePath`, `line_start`, `line_end`

### 7.2 Implemented Adapters

| Adapter | File | Languages | Extracts |
|---|---|---|---|
| CSharpAdapter | `adapters/CSharpAdapter.ts` | C# | Controllers, minimal APIs, use cases, DTOs, partial classes, extension methods |
| TSReactAdapter | `adapters/TSReactAdapter.ts` | TypeScript, TSX | Routes, page components, hooks, services, API calls (fetch/axios) |
| StructuredFileAdapter | `adapters/StructuredFileAdapter.ts` | JSON, YAML, TOML, SQL, Dockerfile, Terraform | Config, schema, infrastructure nodes |

**TrustClassifier** (`src/pipeline/TrustClassifier.ts`) maps extractor IDs to trust:
- Tree-sitter / static analysis extractors → `AUTHORITATIVE`
- Cross-file analysis, composition rules → `DERIVED`
- AI / heuristic sources → `EXPLORATORY`
- Unknown sources → `EXPLORATORY` (fail-closed default)

---

## 8. Storage Layer

### 8.1 SQLite Schema (`src/storage/GraphDB.ts`)

WAL mode enabled. FTS5 full-text search. Auto-migration on startup.

**Core tables**:

```sql
nodes (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  project TEXT,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  graph_kind TEXT NOT NULL,        -- canonical|derived|exploratory|external
  confidence TEXT,                  -- @deprecated
  confidence_band TEXT,             -- AUTHORITATIVE|EXTRACTED|INFERRED|AMBIGUOUS
  confidence_score REAL,
  source_file TEXT,
  symbol TEXT,
  stable_key TEXT,                  -- null for exploratory/external
  trust_level TEXT,
  http_method TEXT,
  http_path TEXT,
  domain TEXT,
  lang_meta TEXT,                   -- JSON
  provenance TEXT NOT NULL,         -- JSON (Provenance)
  metadata TEXT,                    -- JSON
  created_at TEXT,
  updated_at TEXT
)

edges (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  from_id TEXT NOT NULL REFERENCES nodes(id),
  to_id TEXT NOT NULL REFERENCES nodes(id),
  type TEXT NOT NULL,
  graph_kind TEXT NOT NULL,
  confidence TEXT,
  confidence_band TEXT,
  confidence_score REAL,
  stable_key TEXT,
  trust_level TEXT,
  provenance TEXT NOT NULL,         -- JSON
  metadata TEXT,                    -- JSON
  created_at TEXT,
  updated_at TEXT
)

facts (
  id TEXT PRIMARY KEY,
  workspace TEXT,
  project TEXT,
  type TEXT,
  symbol TEXT,
  source_file TEXT,
  line_start INTEGER,
  line_end INTEGER,
  status TEXT,                      -- candidate|validated|rejected
  data TEXT,                        -- JSON (CandidateRecord)
  fingerprint TEXT,
  created_at TEXT
)

rejects (
  id TEXT PRIMARY KEY,
  workspace TEXT,
  project TEXT,
  stage TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  details TEXT,
  source_file TEXT,
  symbol TEXT,
  created_at TEXT
)

file_hashes (
  project TEXT,
  file_path TEXT,
  hash TEXT NOT NULL,
  synced_at TEXT,
  PRIMARY KEY (project, file_path)
)

semantic_facts (
  id TEXT PRIMARY KEY,
  workspace TEXT,
  kind TEXT,
  subject TEXT,
  relation TEXT,
  object TEXT,
  confidence REAL,
  stale INTEGER DEFAULT 0,
  data TEXT,                        -- JSON
  created_at TEXT
)

embeddings (
  node_id TEXT PRIMARY KEY REFERENCES nodes(id),
  model TEXT,
  vector BLOB,
  created_at TEXT
)
```

**FTS5 virtual tables**:
```sql
nodes_fts (id, label, symbol, http_path, domain)
facts_fts (id, symbol, source_file)
```

### 8.2 Storage Mapper Layer (`src/storage/mappers.ts`)

Explicit bridging between DB column names and runtime contract:

```typescript
function mapNodeFromDB(raw: DBRow): GraphNode
function mapEdgeFromDB(raw: DBRow): GraphEdge
function mapNodeToDB(node: GraphNode): DBRow
function mapEdgeToDB(edge: GraphEdge): DBRow
function mapConfidenceToBand(confidence: string): ConfidenceBand
function mapBandToConfidence(band: ConfidenceBand): string
```

**stableKey convention**:
- Canonical/derived nodes: required non-null string (deterministic hash)
- Exploratory/external nodes: `null` — DriftDetector skips null stableKey in baseline comparison

### 8.3 Artifact Storage Layout

```
knowledge/
├── artifacts/
│   ├── internal/
│   │   ├── state/
│   │   │   ├── graph.db                    # SQLite (WAL mode)
│   │   │   └── {project}/import-map.json
│   │   ├── records/
│   │   └── index/
│   └── workspaces/
│       └── {workspace}/
│           ├── config/
│           │   └── effective-config.json
│           ├── extracted/
│           │   ├── extracted-facts.json
│           │   └── extracted-edges.json
│           ├── normalized/
│           │   └── normalized-facts.json
│           ├── validated/
│           │   ├── canonical-facts.json
│           │   ├── exploratory-facts.json
│           │   ├── ambiguous-facts.json
│           │   └── rejected-facts.json
│           ├── graph/
│           │   ├── canonical.graph.json
│           │   ├── exploratory.graph.json
│           │   ├── graph.index.json
│           │   ├── graph.meta.json
│           │   └── edges.jsonl             # Streaming append log (incremental builds)
│           ├── reports/
│           │   ├── extraction-report.json
│           │   ├── validation-report.json
│           │   ├── edge-health.json
│           │   ├── ask-readiness-report.json
│           │   ├── agent-context-readiness-report.json
│           │   └── drift-report.json
│           └── baselines/
│               ├── current.json
│               └── previous.json
├── reports/
│   └── {workspace}/
│       ├── digest.json
│       ├── graph-quality.json
│       ├── lint.json
│       ├── metrics.json
│       ├── verification.json
│       ├── trust-events.jsonl              # TrustEventEmitter stream
│       └── trust-summary.json
├── sources/
│   └── {workspace}/{project}/...          # Synced source files (stage 01)
└── wiki/
    └── {workspace}/...                    # Generated markdown pages
```

---

## 9. Configuration (`knowledge.config.yaml`)

### 9.1 Full Schema

```yaml
workspaces:
  - id: <workspace-id>
    name: <human-readable>
    profile_mode: configured | bootstrap
    # configured = full validation (default when omitted)
    # bootstrap  = exploratory-first relaxed validation for onboarding
    projects: [<project-ids>]
    verification:
      require_flows: true
      required_golden_flows: [<flow-names>]
      require_runtime_script_contract: true
      require_artifact_parity: true
      min_process_coverage: 0.0–1.0

projects:
  <project-id>:
    enabled: true
    path: <filesystem-path>
    description: <string>
    sources:
      include: [<glob-patterns>]
      exclude: [<glob-patterns>]
    rules:
      extract:
        # Extraction rule names: overview | concepts | entities | flows
        # | endpoints | services | fe_be_mapping | issues | decisions | pages
      path_hints:
        controllers: [<glob>]
        usecases: [<glob>]
        services: [<glob>]
        contracts: [<glob>]
      emphasis:
        - <natural language hints to adapters>
      classify:
        project_type: backend | frontend
        stack: [dotnet | csharp | typescript | react | ...]

outputs:
  source_root: <path>
  state_root: <path>
  records_root: <path>
  wiki_root: <path>
  index_root: <path>
  reports_root: <path>

ai:
  provider: openrouter
  model_extract: <model-id>
  model_build: <model-id>
  model_query: <model-id>
  api_key_env: OPENROUTER_API_KEY
  max_chunk_chars: <int>
  temperature: 0.0–1.0

scheduler:
  enabled: true | false
  jobs:
    - name: <job-name>
      command: <crg command>
      cron: <cron expression>
  reporting:
    unknown_token: <token>
    inferred_token: <token>
```

### 9.2 Configured Workspaces (current `knowledge.config.yaml`)

| Workspace | Projects | Stack |
|---|---|---|
| `vietiq-elearning` | backend (C#/dotnet), frontend (React/TS) | dotnet + typescript |
| `b2g` | b2g-localadmin, b2g-retailwebsite | dotnet (C#) |

**Paths**:
- vietiq backend: `D:/projects/viet/backend`
- vietiq frontend: `D:/projects/viet/client`

**AI**: OpenRouter → Gemini 2.5 Flash. Env var: `OPENROUTER_API_KEY`

---

## 10. CLI Interface

### 10.1 Commands

```bash
# Pipeline
crg build [workspace] [--incremental]     # Full pipeline (01 → 09)
crg sync [--workspace <id>]               # Stage 01 only
crg extract [--workspace <id>]            # Stages 01 + 02
crg normalize [--workspace <id>]          # Stages 01–03
crg validate [--workspace <id>]           # Stages 01–04
crg graph [--workspace <id>]              # Stages 01–05d
crg watch [workspace]                     # Watch mode (chokidar)

# Query
crg ask <question> [--workspace <id>] [--query-type <type>] [--mode <mode>]
crg impact [--diff <base..head>] [--workspace <id>]
crg search <query> [--workspace <id>]

# Agent
crg agent-context <task> [--workspace <id>] [--mode <mode>] [--max-nodes <n>]

# Reports & Validation
crg drift [--workspace <id>]
crg verify [--workspace <id>]
crg wiki [--workspace <id>]
crg report [--workspace <id>] [--type <type>]
crg stats [workspace]

# Export & Registry
crg export [--format graphml|obsidian|neo4j] [--workspace <id>]
crg register <repoPath>

# Server
crg serve-mcp                             # Start MCP server (stdio)
```

### 10.2 Planned Python-Reference CLI Enrichment

These commands are not current TypeScript implementation claims. They are
accepted migration targets derived from the Python reference implementation.

| Capability | Python reference shape | TypeScript target shape | Status |
|---|---|---|---|
| Guided install | `code-review-graph install` writes MCP config and platform instructions | `crg install` detects supported clients and writes TypeScript-compatible MCP config/hooks | planned migration |
| Tool filtering | `serve --tools` and `CRG_TOOLS` limit exposed MCP tools | `crg serve-mcp --tools <list>` plus `CRG_TOOLS` env override | planned migration |
| Multi-repo daemon | `crg-daemon` / `code-review-graph daemon` supervises repo watchers | `crg daemon` uses Node child processes and a user-scoped registry/config | planned migration |
| Visualization | `visualize` emits interactive HTML/SVG/GraphML/Cypher/Obsidian outputs | Extend existing `crg export` and add optional interactive HTML visualization | planned migration |
| Evaluation | `eval` runs token, impact, flow, search, and build benchmarks | `crg eval` runs reproducible TypeScript benchmark fixtures | planned migration |
| Incremental update | `update` rebuilds changed files only | Fold into `crg build --incremental` and optional `crg update` alias | partial/current via pipeline hashing |
| Status | `status` reports graph health/stats | Add `crg status` as a read-only graph/database health command | planned migration |

### 10.3 --query-type values

`what-is-symbol` · `what-depends-on` · `what-route-calls` · `lineage` · `impact` · `why-canonical` · `why-insufficient-context`

### 10.4 --mode values

`authoritative` (default) · `mixed_safe` · `exploratory`

---

## 11. MCP Server

### 11.1 Server Setup (`src/mcp/server.ts`)

- **Transport**: stdio
- **Name**: `code-review-graph`
- **Version**: `1.0.0`
- All tools validate inputs via Zod, resolve operations via `OperationResolver`, return `QueryResult`

### 11.2 Tool Registry (8 Categories)

| Category | Tools |
|---|---|
| **build** | `build_graph` |
| **query** | `get_node`, `get_neighbors`, `get_path`, `get_callers` |
| **review** | `review_diff`, `review_pr`, `detect_changes`, `blast_radius`, `get_risk_score` |
| **graph** | `graph_stats`, `architecture_overview`, `list_communities`, `get_community`, `find_hubs`, `find_bridges`, `find_gaps` |
| **wiki** | `get_wiki_page`, `generate_wiki` |
| **flows** | `list_flows`, `get_flow`, `get_affected_flows`, `get_minimal_context`, `get_lineage` |
| **refactor** | `rename_preview`, `find_dead_code` |
| **search** | `search` |

### 11.3 Planned MCP Enrichment From Python Reference

The TypeScript MCP server must preserve the existing Zod validation,
`OperationResolver`, and `QueryResult` contracts. Python-reference features can
be migrated only through that trust gate.

| Capability | TypeScript contract |
|---|---|
| Tool filtering | Server startup may expose a subset of registered tools by CLI flag or env var. Hidden tools are not registered for that process. |
| Minimal context tool | A compact task-oriented context tool may route agents to follow-up tools, but must build its answer from trust-aware graph queries. |
| Postprocess tool | A tool may regenerate wiki, report, FTS, embedding, flow, or community artifacts without rebuilding canonical extraction. |
| Prompt templates | Review, architecture, debug, onboard, and pre-merge prompts may be exposed as MCP prompts if the SDK supports them cleanly. |
| Multi-client transport | HTTP/SSE or streamable HTTP is reference-only until a TypeScript story selects transport, security policy, and validation proof. |

---

## 12. Preset System

### 12.1 PresetResolver (`src/pipeline/PresetResolver.ts`)

Resolves workspace presets with inheritance via `extends` field.

**Merge semantics**:
- Policy rule arrays: override-by-id (match by `id`, support `{ id, disabled: true }`)
- Object fields: shallow-merge (workspace wins)
- Primitive arrays (e.g., `projects`): full-replace

**9 available presets** (defined in `src/pipeline/presets/*.ts`):

`generic-codebase` · `web-api` · `dotnet-web-api` · `react-app` · `nextjs-app` · `node-service` · `library-package` · `markdown-docs` · `mixed-monorepo`

### 12.2 AuthorityPolicyEngine (`src/core/graph/policy/AuthorityPolicyEngine.ts`)

Governs canonical fact eligibility, conflict resolution, and ambiguity handling.

```typescript
interface CanonicalFactRule {
  id: string;
  effect: 'allow' | 'deny';
  factKind: string;
  requiredExtractionMethods?: string[];
  requiredProvenance?: boolean;
  minConfidence?: number;
  allowedSourceRoots?: string[];
  disallowedPatterns?: string[];
  priority?: number;  // 0–100, default 50
  reason?: string;
}
```

**Conflict resolution**:
1. `conflictingAllowDenyBehavior` evaluated first (opposing allow/deny effects)
2. `samePriorityBehavior` as fallback (same effect, semantic conflict)
3. Returns `AMBIGUOUS` with both reasoning traces when conflicting — never chooses arbitrarily

**Policy source**: `knowledge.config.yaml` governance section (YAML-backed, not DB-backed).

**Merge order**: workspace > preset > base defaults (override-by-id).

---

## 13. Agent Context System

### 13.1 AgentContextBuilder (`src/core/agent/AgentContextBuilder.ts`)

Assembles bounded, trust-aware context packages for AI coding agents.

```typescript
interface AgentContextPackage {
  workspaceId: string;
  task: string;
  status: 'ready' | 'partial' | 'insufficient_context' | 'policy_blocked';
  nodes: GraphNode[];
  edges: GraphEdge[];
  relevantFiles: SourceReference[];
  invariants: Invariant[];
  risks: RiskItem[];
  verification_checklist: VerificationChecklistItem[];
  forbidden_assumptions: ForbiddenAssumption[];
  suggestions: ToolSuggestion[];
  codes: string[];
  warnings: string[];
  provenance: Provenance[];
}
```

**Default mode**: `canonical_only`. Explicit `mixed_safe` request adds `EXPLORATORY_USED` warning.

**Default output limits**: max 20 nodes · max 40 edges · max 5 suggestions. Configurable per-request and per-workspace. Truncation emits `GRAPH_RESULT_TRUNCATED`.

**Ranking order** (deterministic):
1. Exact id/symbol match
2. Exact label match
3. Source file/route match
4. Domain/project match
5. FTS fallback match

**Manual invariants** sourced from `governance.invariants` section in `knowledge.config.yaml`.

---

## 14. Wiki & Drift

### 14.1 WikiBuilder (`src/pipeline/stages/08_wiki.ts`)

Generates trust-aware wiki pages. All content derived from `TrustAwareQueryEngine` via `QueryResult`.

```typescript
interface WikiPage {
  id: string;
  workspaceId: string;
  title: string;
  pageType: string;
  status: 'canonical' | 'mixed' | 'draft' | 'insufficient_context';
  content: string;
  sources: Provenance[];
  provenance_summary: ProvenanceSummary;
  confidence_summary: ConfidenceSummary;
  annotations: WikiAnnotation[];
  warnings: string[];
  generatedAt: string;
}
```

**Trust rules**:
- `canonical` pages: only canonical/derived facts for conclusions
- Exploratory facts: appear only as clearly marked annotations
- Insufficient canonical evidence → `insufficient_context` status, no speculative content

### 14.2 DriftDetector (`src/core/drift/DriftDetector.ts`)

Compares current graph state against baseline. Accesses SQLite directly (not through reasoning engine).

**13 drift types**: `artifact_missing` · `artifact_schema_changed` · `canonical_node_count_changed` · `canonical_edge_count_changed` · `exploratory_count_changed` · `provenance_missing` · `authority_policy_changed` · `workspace_boundary_violation` · `wiki_stale` · `ask_readiness_degraded` · `agent_context_readiness_degraded` · `adapter_version_changed` · `unknown`

**Baseline operations**:
- `updateBaseline(workspaceId)` — overwrite current baseline with latest graph state
- `promoteBaseline(workspaceId, opts?)` — atomic promotion (preserve previous.json, require verify pass unless `{ force: true }`)

---

## 15. Observability

### 15.1 TrustEventEmitter (`src/core/observability/TrustEventEmitter.ts`)

Singleton. Emits JSONL trust events per query operation.

```typescript
interface TrustEvent {
  timestamp: string;
  workspace_id: string;
  operation: OperationType;
  mode: QueryMode;
  status: DecisionStatus;
  codes: string[];
  warnings: string[];
  selected_path_count: number;
}
```

- Appends to `knowledge/reports/{workspace}/trust-events.jsonl`
- `writeSummary()` writes `trust-summary.json`
- Configure via `TrustEventEmitter.configure(reportsDir)`
- Get instance via `TrustEventEmitter.getInstance()`

### 15.2 RejectLog

Every pipeline rejection persists to `rejects` table:
- `reason_code`: machine-readable PipelineError code
- `details`: human-readable message
- `source_file`, `symbol`, `stage` for post-mortem analysis

---

## 16. Workspace Isolation

- All graph operations scoped to `workspace: string` field on every node/edge
- `TrustAwareQueryEngine` validates `node.workspace === this.workspaceId` before traversal
- Violation → `POLICY_VIOLATION` + early exit
- `GraphArtifactLoader` loads artifacts only for the requested workspace
- FTS searches filtered by `workspaceId`
- No implicit cross-workspace reasoning

---

## 17. Project Structure

```
src/
├── cli/index.ts                    # CLI entry point (Commander)
├── core/
│   ├── types.ts                    # Type system SOT
│   ├── errors.ts                   # Error taxonomy (3 categories, 34 codes)
│   ├── flows.ts                    # Flow derivation (computeFlows, flowMembershipEdges)
│   ├── nodeTypeRegistry.ts         # 27+ registered node types
│   ├── taxonomy.ts                     # resolveFlowType() — edge type → flow_type mapping
│   ├── graph/
│   │   ├── policy/
│   │   │   ├── AuthorityPolicyEngine.ts
│   │   │   └── GovernanceValidator.ts
│   │   ├── query/
│   │   │   ├── TrustedQueryService.ts      # Public entry point
│   │   │   ├── TrustAwareQueryEngine.ts    # Core reasoning (= GraphQueryEngine)
│   │   │   ├── OperationResolver.ts        # Mandatory gateway
│   │   │   ├── ReasoningTrace.ts
│   │   │   ├── QueryResultFactory.ts
│   │   │   └── GraphArtifactLoader.ts
│   │   ├── traversal/
│   │   │   ├── TrustAwareTraversal.ts      # BFS with policy
│   │   │   ├── EdgePolicyTable.ts          # Trust decision gate
│   │   │   └── pathSelector.ts             # Canonical-first ranking
│   │   ├── reasoning/
│   │   │   └── reasoning-policy.ts
│   │   └── analysis/
│   │       ├── community.ts
│   │       └── metrics.ts
│   ├── ask/
│   │   └── StructuredAskEngine.ts
│   ├── agent/
│   │   ├── AgentContextBuilder.ts
│   │   └── types.ts
│   ├── drift/
│   │   └── DriftDetector.ts
│   └── observability/
│       └── TrustEventEmitter.ts
├── scanner/
│   ├── core/
│   │   ├── ILanguageParser.ts
│   │   └── WebTreeSitterWrapper.ts
│   └── languages/
│       ├── csharp/CSharpParser.ts
│       └── typescript/TypeScriptTreeSitterParser.ts
├── pipeline/
│   ├── run.ts                      # PipelineStages enum, runPipeline()
│   ├── watch.ts
│   ├── config.ts                   # loadConfig(), resolveDbPath(), getWorkspace()
│   ├── gitDiff.ts
│   ├── impactReport.ts
│   ├── TrustClassifier.ts
│   ├── PresetResolver.ts
│   ├── presets/                    # 9 preset definitions (*.ts)
│   ├── stages/
│   │   ├── 01_sync.ts
│   │   ├── 02_extract.ts
│   │   ├── 03_normalize.ts
│   │   ├── 04_validate.ts
│   │   ├── 05a_build_canonical.ts
│   │   ├── 05b_build_derived.ts
│   │   ├── 05c_build_exploratory.ts
│   │   ├── 05d_build_flows.ts
│   │   ├── 06_enrich.ts
│   │   ├── 07_verify.ts
│   │   ├── 08_wiki.ts
│   │   ├── 09_report.ts
│   │   └── graph_build_enforcement.ts
│   ├── adapters/
│   │   ├── IProjectAdapter.ts
│   │   ├── CSharpAdapter.ts
│   │   ├── TSReactAdapter.ts
│   │   ├── StructuredFileAdapter.ts
│   │   └── index.ts                # globalAdapterRegistry
│   └── artifacts/
│       └── graphArtifacts.ts       # ArtifactStore
├── storage/
│   ├── GraphDB.ts                  # SQLite driver (WAL, FTS5, migrations)
│   ├── mappers.ts                  # DB row ↔ runtime object mapping
│   ├── pathUtils.ts
│   └── schema.sql
├── mcp/
│   ├── server.ts
│   └── tools/
│       ├── index.ts                # registerAllTools()
│       ├── query.ts
│       ├── review.ts
│       ├── graph.ts
│       ├── wiki.ts
│       ├── flows.ts
│       ├── search.ts
│       ├── refactor.ts
│       └── runtime.ts              # invokeTool()
├── export/
│   ├── graphml.ts
│   ├── obsidian.ts
│   └── neo4j.ts
└── registry/
    └── index.ts

fixtures/
├── dotnet-mvc/                     # Acceptance test fixture (MVC controllers, use cases, DTOs)
└── dotnet-minimal/                 # Acceptance test fixture (minimal API)

docs/
├── HARNESS.md                      # Agent operating model
├── GLOSSARY.md
├── ARCHITECTURE.md
├── TEST_MATRIX.md
├── decisions/
│   ├── 0001-harness-first-development.md
│   ├── 0002-post-spec-product-lifecycle.md
│   └── 0003-generic-spec-intake-harness.md
└── product/

packages/
└── vscode-extension/               # VS Code extension (separate build: npm run build)
```

---

## 18. Build & Dev

```bash
# Build
npm run build        # tsc + copy-grammars (WASM)

# Dev (no build)
npm run dev          # tsx src/cli/index.ts

# MCP server
npm run serve:mcp    # tsx src/mcp/server.ts

# Type check
npm run typecheck    # tsc --noEmit

# Tests
npm test             # vitest run
npx vitest run <file>  # Single test file

# VS Code extension
cd packages/vscode-extension && npm run build
```

**Module system**: `"module": "NodeNext"` — all imports must use explicit `.js` extension even for `.ts` source files.

**Key dependencies**:

| Package | Purpose |
|---|---|
| `better-sqlite3` | Synchronous SQLite, WAL mode |
| `web-tree-sitter` + WASM grammars | AST parsing for C# and TypeScript |
| `@modelcontextprotocol/sdk` | MCP protocol |
| `commander` | CLI framework |
| `zod` | Input validation |
| `yaml` | Config parsing |
| `chokidar` | File watching |
| `tsx` | TypeScript runner (dev) |
| `vitest` | Test runner |

---

## 19. Testing

- Test files: `*.acceptance.test.ts` pattern
- Fixtures: `fixtures/dotnet-mvc/`, `fixtures/dotnet-minimal/`
- No property-based tests — acceptance and integration tests only
- Test matrix: `docs/TEST_MATRIX.md` (behavior → proof mapping)

**Test scope**: vitest excludes `knowledge/`, `dist/`, `packages/`, `.claude/`

---

## 20. Known Limitations & Constraints

| Constraint | Detail |
|---|---|
| Static analysis only | No runtime tracing, no execution profiling |
| Single-writer SQLite | WAL enables concurrent reads; single writer |
| In-memory graph index | Fast queries; memory scales with graph size |
| Traversal bounds | maxHops=6, maxPaths=50, maxQueue=5000 |
| Exploratory cap | 2-hop limit in mixed_safe mode |
| Tree-sitter languages | Only C# and TypeScript/TSX are current TypeScript implementation claims; Python-reference language coverage is roadmap input only |
| Local-only | No distributed graph, no multi-machine |
| AI non-determinism | Exploratory/enrichment quality depends on model |

---

## 21. Python Reference Migration Backlog

This backlog enriches the TypeScript product contract from the Python reference
without changing current implementation status.

### 21.1 Accepted Migration Candidates

| Area | Reference capability | TypeScript migration target | Validation expectation |
|---|---|---|---|
| Installer onboarding | Detect AI coding clients and write MCP config, instructions, hooks, and skills | `crg install` supports Codex, Claude-compatible clients, Cursor-style hooks, Gemini/Qoder/Copilot-style config where applicable | Unit tests for config generation; fixture tests for idempotent merge; no destructive overwrite |
| MCP tool filtering | Limit exposed tools with `--tools` or `CRG_TOOLS` | `serve-mcp` filters registration before server start | Unit tests for allow-list parsing and hidden tool absence |
| Multi-repo watch | User-scoped daemon supervises one watcher per repo | `crg daemon` with user config, child process health checks, logs, and status | Integration tests with temp repos and simulated crashed child |
| Benchmark suite | Token, impact, flow, search, and build benchmarks against sample repos | `crg eval` with reproducible fixtures and stable report schema | Snapshot or JSON-schema tests for reports; CI-safe small fixture run |
| Hybrid search | FTS plus optional embeddings and fallback keyword search | Extend search service behind trust-aware visibility and workspace filters | Unit tests for ranking merge; integration tests for FTS and optional embedding disabled path |
| Visualization | Interactive HTML, SVG, GraphML, Obsidian, Neo4j/Cypher | Keep existing exports and add interactive HTML graph as optional report/export | Golden-file or schema tests for exported graph payload |
| Community analysis | Leiden when available, fallback grouping, oversized community split | Reuse existing community detection and add deterministic fallback/splitting rules | Unit tests for partition stability and fallback behavior |
| Flow criticality | Entry-point flow tracing with weighted criticality and affected-flow lookup | Extend `computeFlows`/flow reports while preserving trust boundaries | Fixture tests for flow membership and affected flow detection |
| Agent prompt/templates | Review/debug/onboarding/pre-merge workflow templates | MCP prompts or CLI-generated context bundles, depending on SDK support | Contract tests for prompt names, inputs, and trust warnings |
| Memory/wiki loop | Persist useful Q&A/wiki summaries for re-ingestion | Reference-only until a story defines provenance, trust level, and retention rules | Requires ADR before implementation |

### 21.2 Reference-Only For Now

| Reference item | Reason |
|---|---|
| Python packaging and command names (`code-review-graph`, `crg-daemon`) | TypeScript target keeps `crg` and npm build/development model |
| `fastmcp` server implementation | TypeScript server already uses `@modelcontextprotocol/sdk` and Zod |
| `networkx` graph algorithms | TypeScript must use existing graph/query services or selected JS libraries |
| Raw Python SQLite schema | TypeScript schema already carries trust, provenance, workspace, and graph kind contracts |
| Published benchmark claims from the Python repo | They are evidence for prioritization, not proof for this TypeScript implementation |
| 24-language support claim | Treat as adapter roadmap until TypeScript parsers and tests exist |

### 21.3 Migration Principles

1. Preserve fail-closed trust semantics before adding broader capability.
2. Prefer thin adapters around existing `OperationResolver`,
   `TrustAwareQueryEngine`, `ArtifactStore`, `ReportBuilder`, and
   pipeline stages.
3. Add language support one adapter at a time with fixtures and test matrix rows.
4. Keep optional heavyweight features optional: embeddings, visualization,
   daemon, and benchmarks must not be required for basic graph build.
5. Any new persistent artifact must document workspace scoping, provenance, and
   stale-data behavior.

---

## 22. Glossary

| Term | Definition |
|---|---|
| **Canonical** | Parser-backed, deterministic, high-confidence graph layer |
| **Derived** | Structural inference rules applied to canonical graph |
| **Exploratory** | AI/heuristic inferred; non-deterministic; lower confidence |
| **External** | Third-party/provider nodes; gated and auditable |
| **GraphKind** | `canonical \| derived \| exploratory \| external` |
| **ConfidenceBand** | `AUTHORITATIVE \| EXTRACTED \| INFERRED \| AMBIGUOUS` |
| **TrustLevel** | `AUTHORITATIVE \| DERIVED \| EXPLORATORY \| MIXED` |
| **OperationType** | `ask \| impact \| lineage \| wiki \| governance` |
| **QueryMode** | `authoritative \| mixed_safe \| exploratory` |
| **Provenance** | Source metadata chain: who said what, when, via what method |
| **stableKey** | Deterministic identifier for cross-build drift detection; null for exploratory/external |
| **Chokepoint** | OperationResolver → TrustAwareQueryEngine — the single trust enforcement gate |
| **ReasoningPath** | Ordered sequence of nodes/edges forming an answer to a query |
| **CallerID** | Registered identifier for every system component that queries the engine |
| **Workspace** | Logical isolation boundary for a group of related projects |
| **Flow/Domain** | Derived grouping of related nodes by inferred domain |
| **AgentContextPackage** | Bounded, trust-aware context package for AI coding agents |
| **Harness** | Repo-level operating model for human + agent collaboration (docs/HARNESS.md) |
| **Harness Delta** | Documentation/template/validation update that improves future agent work |
| **Product Delta** | App code, tests, API shape, or product documentation change |
| **CriticalFlow** | A flow whose failure breaks core system behavior; must not terminate unexpectedly |
