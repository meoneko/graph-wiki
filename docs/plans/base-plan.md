# Implementation Plan: Trusted Reasoning System (P0)

> Spec: [docs/spec/trusted_reasoning_system_spec.md](file:///e:/Projects/graph-wiki/docs/spec/trusted_reasoning_system_spec.md) v1.0  
> Status: Ready for implementation  
> Date: 2026-04-24  
> Rev: 2026-04-24 (post-review corrections applied)

---

## Pre-Implementation Decisions

### Decision A — `contracts.ts` Frozen Label

`src/core/graph/contracts.ts` hiện có comment:
```
/** P0 Frozen Shapes - DO NOT MODIFY without policy review. */
```

**Decision:** Comment này là **outdated** và sẽ bị supersede bởi spec §7.1.0. Spec explicitly mandates `src/core/types.ts` là ONLY runtime SOT. `contracts.ts` sẽ được refactor thành adapter layer. Comment "Frozen" sẽ được thay bằng:
```
/** Adapter/view-model layer. Runtime SOT: src/core/types.ts (per spec §7.1.0). */
```
Phase 1 được phép proceed.

---

## Gap Analysis: Current vs Spec

### Critical Gaps (Blocking P0 DoD)

| # | Gap | Location | Severity |
|---|-----|----------|----------|
| G1 | `GraphNode/GraphEdge` có 2 definitions mâu thuẫn: [src/core/types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts) (runtime) vs [src/core/graph/contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts) (dùng camelCase khác, có extra fields) | Both files | 🔴 Critical |
| G2 | `graph_kind` chỉ có `canonical \| exploratory` — thiếu `derived` và `external` | `types.ts:76,93` | 🔴 Critical |
| G3 | `confidence` (storage column name) ≠ `confidence_band` (spec runtime name) — chưa có mapper bridge | `types.ts:77,94` | 🔴 Critical |
| G4 | [Provenance](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#10-20) field là `Record<string,unknown>` — không có typed structure | `types.ts:84,96` | 🔴 Critical |
| G5 | Stage 04 dùng edge type `canonical_dependency` (flat) thay vì typed taxonomy (`calls`, `invokes`, etc.) | `04_buildGraph.ts:41` | 🔴 Critical |
| G6 | Stage 04 set `confidence: 'INFERRED'` cho canonical edges — vi phạm canonical trust rule | `04_buildGraph.ts:43` | 🔴 Critical |
| G7 | Stage 04 set `confidence: 'EXTRACTED'` cho canonical nodes — trust classification phải do Stage 03 làm | `04_buildGraph.ts:17` | 🔴 Critical |
| G8 | Stage 03 không assign confidence band gì cả, không có trust class assignment | [03_validate.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/03_validate.ts) | 🔴 Critical |
| G9 | Không có `derived build` phase (04b) — Stage 04 chỉ có canonical build | Pipeline | 🔴 Critical |
| G10 | `query.ts` line 59-61: `get_callers` bypass query engine — truy cập DB trực tiếp. **Note:** Các tools còn lại trong `query.ts` (get_node, get_neighbors, get_path, get_lineage) đã dùng `GraphQueryEngine`. `graph.ts` 5 tools là operational stats (đếm, degree), không phải reasoning bypass. | [query.ts:59-61](file:///e:/Projects/graph-wiki/src/mcp/tools/query.ts) | 🔴 Critical |
| G11 | [GraphQueryEngine](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts#5-144) không enforce edge-policy table theo operation mode | [GraphQueryEngine.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts) | 🔴 Critical |
| G11b | [GraphArtifactLoader](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphArtifactLoader.ts#35-37) load nodes từ DB không apply confidence mapper — nodes thiếu `confidence_band` field | [GraphArtifactLoader.ts:35-37](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphArtifactLoader.ts) | 🔴 Critical |
| G12 | Không có `QueryResult` output contract — engine trả raw nodes/edges | [GraphQueryEngine.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts) | 🔴 Critical |
| G13 | [ReasoningEngine](file:///e:/Projects/graph-wiki/src/core/graph/reasoning/ReasoningEngine.ts#3-14) là stub (chỉ đếm nodes/edges, tính score vô nghĩa) | [ReasoningEngine.ts](file:///e:/Projects/graph-wiki/src/core/graph/reasoning/ReasoningEngine.ts) | 🔴 Critical |
| G14 | Không có `DecisionStatus`, `TrustLevel`, `QueryMode`, `TrustEvent` types | Missing | 🔴 Critical |
| G15 | Stage 05 enrich — chưa kiểm tra có build derived facts hay không | [05_enrich.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/05_enrich.ts) | 🟡 High |
| G15b | `run.ts` stage order bug: `07_wiki` chạy trước `06_verify` — wiki được generate từ unverified data | [run.ts:27-28](file:///e:/Projects/graph-wiki/src/pipeline/run.ts) | 🟡 High |
| G16 | Không có traversal policy table theo operation (`ask`, `impact`, `lineage`, etc.) | Missing | 🔴 Critical |
| G17 | Không có observability / TrustEvent emitter | Missing | 🟡 High |
| G18 | [contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts) redeclares [GraphNode](file:///e:/Projects/graph-wiki/src/core/types.ts#70-86)/[GraphEdge](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#32-41) với semantics khác (camelCase vs snake_case) | [contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts) | 🔴 Critical |

---

## Implementation Order

Theo spec §16.3, thực hiện theo 10 phases sau. **Lưu ý sau review:** Phase 5 (Query Chokepoint) được reorder về sau Phase 6 vì fix MCP bypass cần `TrustAwareQueryEngine` đã tồn tại để route sang.

---

## Phase 1 — Unify Runtime Graph Contract

> **Goal:** Một source of truth duy nhất tại [src/core/types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts). Xóa semantic redefinition trong [contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts).  
> **Spec refs:** §7.1.0, §7.1.1, §7.1.2, §7.1.3

### Tasks

**1.1 Mở rộng [src/core/types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts)** — thêm các types mới vào file này làm runtime SOT:

```ts
// Thêm vào types.ts

export type GraphKind = 'canonical' | 'derived' | 'exploratory' | 'external';

export type ConfidenceBand = 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export type Provenance = {
  source: 'parser' | 'analysis' | 'ai' | 'user';
  artifact_source: string;
  producer_stage: string;
  timestamp: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  rule?: string;
};

export type DecisionStatus =
  | 'OK'
  | 'AMBIGUOUS'
  | 'INSUFFICIENT_EVIDENCE'
  | 'EXPLORATORY_ONLY'
  | 'PARTIAL'
  | 'POLICY_VIOLATION';

export type QueryMode = 'authoritative' | 'mixed_safe' | 'exploratory';

export type TrustLevel = 'AUTHORITATIVE' | 'DERIVED' | 'EXPLORATORY' | 'MIXED';

export type ResponseConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
```

**1.2 Update [GraphNode](file:///e:/Projects/graph-wiki/src/core/types.ts#70-86) và [GraphEdge](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#32-41) trong [types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts):**

- Thêm `confidence_band: ConfidenceBand` (runtime field)
- Giữ `confidence` field hiện tại nhưng đánh dấu `@deprecated` để backward compat với storage
- Thêm `graph_kind: GraphKind` (mở rộng từ 2 sang 4 values)
- Thay `provenance: Record<string,unknown>` → `provenance: Provenance`
- `created_at`, `updated_at` là optional strings — **⚠️ DB Migration Note:** nếu add vào `GraphNode` interface thì SQLite schema cần `ALTER TABLE nodes ADD COLUMN created_at TEXT; ALTER TABLE nodes ADD COLUMN updated_at TEXT;` — phải thực hiện trong Phase 2 cùng storage mapper.
- Thêm `metadata` với typed structure theo spec §7.1.2

**1.3 Refactor [src/core/graph/contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts)** — chuyển thành adapter/view layer thuần:

- Xóa [GraphNode](file:///e:/Projects/graph-wiki/src/core/types.ts#70-86), [GraphEdge](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#32-41), [GraphKind](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#6-7), [GraphConfidence](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#8-9) redefinitions
- Import từ `../../types.js` thay vì redefine
- Giữ lại: [GraphIndex](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#42-51), [GraphMeta](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#52-70), [GraphPathResult](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#71-84), [GraphImpactTraversal](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#92-102), [GraphErrorCode](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#103-112), [GraphErrorResponse](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#113-122), [GraphTraversalState](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts#85-91) (những type này là view/adapter layer, không conflict)
- Thêm comment: "Adapter/view-model layer. Runtime SOT is src/core/types.ts"

**1.4 Thêm `QueryResult` và `ReasoningPath` contracts vào [types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts):**

```ts
export type ReasoningPath = {
  path_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  trust_level: TrustLevel;
  status: DecisionStatus;
  summary: string;
};

export type QueryResult = {
  status: DecisionStatus;
  reasoning: {
    selected_paths: ReasoningPath[];
    rejected_paths?: ReasoningPath[];
    selection_explanation: string[];
  };
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  confidence: {
    level: ResponseConfidence;
    reasons: string[];
  };
  provenance: {
    sources: Provenance[];
  };
  warnings: string[];
  codes: string[];
};
```

**Files cần sửa:**
- [src/core/types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts) — mở rộng đáng kể
- [src/core/graph/contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts) — refactor thành adapter layer

---

## Phase 2 — Storage Mapper Bridge

> **Goal:** Map `confidence` (storage column) ↔ `confidence_band` (runtime). Không rename storage column.  
> **Spec refs:** §15.3, §15.2 "Compatibility note"

### Tasks

**2.1 Tạo `src/storage/mappers.ts`:**

```ts
// confidence storage → confidence_band runtime
export function toConfidenceBand(stored: string): ConfidenceBand { ... }

// confidence_band runtime → confidence storage
export function fromConfidenceBand(band: ConfidenceBand): string { ... }

// graph_kind TEXT migration helpers
export function toGraphKind(stored: string): GraphKind { ... }
```

**2.2 Update [src/storage/GraphDB.ts](file:///e:/Projects/graph-wiki/src/storage/GraphDB.ts):**
- Tất cả `getNodesByWorkspace`, `getEdgesByWorkspace` phải chạy qua mapper
- `upsertNode`, `upsertEdge` phải serialize `confidence_band` → `confidence` column
- Không rename SQL column trong P0
- Nếu Phase 1 thêm `created_at`/`updated_at` vào `GraphNode`, **phải chạy SQL migration:**
  ```sql
  ALTER TABLE nodes ADD COLUMN created_at TEXT;
  ALTER TABLE nodes ADD COLUMN updated_at TEXT;
  ```

**2.3 Update [src/core/graph/query/GraphArtifactLoader.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphArtifactLoader.ts):**
- Lines 35-39: sau khi load nodes/edges từ DB, apply mapper để hydrate `confidence_band` từ `confidence` storage column
- Loader là điểm duy nhất đọc data từ DB để feed vào `GraphQueryEngine` — nếu không update đây, `TrustAwareQueryEngine` (Phase 6) sẽ thấy nodes không có `confidence_band`
- Update `LoadedGraphArtifacts` interface để reflect `derived` layer khi `graph_kind = 'derived'` được persist

**Files cần sửa:**
- [src/storage/GraphDB.ts](file:///e:/Projects/graph-wiki/src/storage/GraphDB.ts)
- [src/core/graph/query/GraphArtifactLoader.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphArtifactLoader.ts)
- **Tạo mới:** `src/storage/mappers.ts`

---

## Phase 3 — Stage 03 Trust Classification

> **Goal:** Stage 03 validate phải assign canonical trust class (`confidence_band = AUTHORITATIVE`) cho parser-backed facts thỏa điều kiện.  
> **Spec refs:** §8.2.3, §15.4

### Tasks

**3.1 Refactor [src/pipeline/stages/03_validate.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/03_validate.ts):**

- Sau khi fact passed node type check, thêm logic assign `confidence_band`:
  - Fact có `evidence` spans → `AUTHORITATIVE`
  - Fact không có evidence → `EXTRACTED` 
  - Fact có `status = 'candidate'` → không được promote (reject hoặc `INFERRED`)
- Thêm `canonical_provenance_missing` error code cho facts thiếu parser evidence
- Output [NormalizedFact](file:///e:/Projects/graph-wiki/src/core/types.ts#55-58) phải carry `confidence_band` field

**3.2 Update [NormalizedFact](file:///e:/Projects/graph-wiki/src/core/types.ts#55-58) type** trong [types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts):
```ts
export interface NormalizedFact extends CandidateRecord {
  fact_id: string;
  confidence_band: ConfidenceBand; // assigned by Stage 03
  trust_assigned_by: 'stage_03_validate';
}
```

**Files cần sửa:**
- [src/pipeline/stages/03_validate.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/03_validate.ts)
- [src/core/types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts) (NormalizedFact interface)

---

## Phase 4 — Split Stage 04: Canonical + Derived Build

> **Goal:** Stage 04 → `04a_buildCanonical.ts` + `04b_buildDerived.ts`. Fix edge taxonomy và trust preservation.  
> **Spec refs:** §8.1.1, §8.2, §8.2.1, §8.2.2, §8.2.3

### Tasks

**4.1 Tạo `src/pipeline/stages/04a_buildCanonical.ts`:**

- Nhận `NormalizedFact[]` từ Stage 03. Chỉ materiialize parser-backed canonical facts.
- Node mapping: preserve `confidence_band` từ Stage 03 (KHÔNG override thành EXTRACTED)
- Edge taxonomy: replace `canonical_dependency` với typed edges:
  - `called_symbols` → emit `calls` edges (không phải `invokes`, trừ khi có explicit marker)
  - `imports` metadata → emit `imports` edges
  - `authority` markers → emit `uses_authority` / `node_uses_authority` edges
- Mỗi edge phải có `flow_type` trong metadata theo spec §7.5
- `graph_kind: 'canonical'` cho tất cả output của stage này

**4.2 Tạo `src/pipeline/stages/04b_buildDerived.ts`:**

- Nhận canonical graph từ DB
- Compute deterministic derived facts:
  - Flow membership (`belongs_to_flow`)
  - Authority chain summary
  - `entry_of` edges từ `is_entrypoint` flags
- Mỗi derived fact phải có `derivation_rule` trong provenance
- `graph_kind: 'derived'`, `confidence_band: 'INFERRED'` (hoặc `EXTRACTED` nếu rule approved)
- Không được derived-from-derived trong P0

**4.3 Update [src/pipeline/run.ts](file:///e:/Projects/graph-wiki/src/pipeline/run.ts):**
- Thay [buildGraph](file:///e:/Projects/graph-wiki/src/pipeline/stages/04_buildGraph.ts#9-59) call bằng `buildCanonical` → `buildDerived` sequence
- **Fix stage order bug (G15b):** hiện tại `run.ts:27-28` chạy `generateWiki` TRƯỚC `verifyGraph` — wiki được generate từ unverified data. Sửa thành đúng order:
  ```ts
  // BEFORE (buggy):
  await generateWiki(...)   // line 27
  const report = await verifyGraph(...)  // line 28

  // AFTER (correct):
  await verifyGraph(...)    // 06
  await generateWiki(...)   // 07 — only runs on verified graph
  await writeReport(...)    // 08
  ```
- Final order: `01 → 02 → 03 → 04a → 04b → 05 → 06 → 07 → 08`

**4.4 Xóa hoặc deprecate** [src/pipeline/stages/04_buildGraph.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/04_buildGraph.ts)

**Files cần sửa/tạo:**
- **Tạo mới:** `src/pipeline/stages/04a_buildCanonical.ts`
- **Tạo mới:** `src/pipeline/stages/04b_buildDerived.ts`
- [src/pipeline/run.ts](file:///e:/Projects/graph-wiki/src/pipeline/run.ts)
- Deprecate: [src/pipeline/stages/04_buildGraph.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/04_buildGraph.ts)

---

## Phase 5 — Trust-Aware Traversal Engine

> **⚠️ Reordered:** Phase này (trước đây Phase 6) được thực hiện TRƯỚC Query Chokepoint Enforcement (Phase 6 mới) vì Phase 6 cần `TrustAwareQueryEngine` đã tồn tại để route MCP bypass sang.  
> **Goal:** Implement `TrustAwareQueryEngine` với edge-policy enforcement và `QueryResult` output contract.  
> **Spec refs:** §9.1, §9.2, §9.3, §9.4, §10

> **⚠️ Complexity Note:** Phase này là logic nặng nhất của toàn hệ thống. Ước tính effort tương đương 2-3 phases khác cộng lại. Nên dự phòng buffer time tương ứng.

> **Goal:** [GraphQueryEngine](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts#5-144) phải enforce edge-policy table, query mode, và output `QueryResult`.  
> **Spec refs:** §9.1, §9.2, §9.3, §9.4, §10

### Tasks

**5.1 Tạo `src/core/graph/traversal/EdgePolicyTable.ts`:**

```ts
// Operation → allowed edge types
const EDGE_POLICY: Record<OperationType, Record<QueryMode, EdgeFilter>> = {
  ask: {
    authoritative: { allowed: ['calls','invokes','uses_authority','contains'], forbidden: ['semantic_match','inferred_contract'] },
    mixed_safe: { allowed: [...], maxExploratoryHops: 2 },
    exploratory: { allowed: ['*'] }
  },
  impact: {
    authoritative: { allowed: ['calls','invokes','dispatches_to','triggers'], forbidden: ['semantic_match','inferred_contract'] },
    mixed_safe: { allowed: ['calls','invokes','dispatches_to','triggers','likely_calls'], maxExploratoryHops: 2 },
    exploratory: { allowed: ['*'] }
  },
  lineage: {
    authoritative: { allowed: ['calls','invokes','uses_authority','node_uses_authority','depends_on_authority'], forbidden: ['imports','dispatches_to'] },
    mixed_safe: { allowed: ['calls','invokes','uses_authority','node_uses_authority'], maxExploratoryHops: 2 },
    exploratory: { allowed: ['*'] }
  },
  wiki: {
    authoritative: { allowed: ['calls','invokes','contains','entry_of','belongs_to_flow'], forbidden: ['semantic_match'] },
    mixed_safe: { allowed: ['*canonical+derived*'], maxExploratoryHops: 2 },
    exploratory: { allowed: ['*'] }
  },
  governance: {
    authoritative: { allowed: ['uses_authority','node_uses_authority','depends_on_authority'], forbidden: ['*exploratory*'] },
    mixed_safe: { allowed: ['uses_authority','node_uses_authority','depends_on_authority'] },
    exploratory: { allowed: [] } // governance ALWAYS authoritative
  }
};
```

**5.2 Tạo `src/core/graph/traversal/pathSelector.ts`:**

- Path selection priority logic (spec §9.4.1): canonical-only > canonical+derived > mixed > exploratory-only
- Shorter paths preferred over longer (spec §9.4.1 rule 2)
- Higher confidence preferred (spec §9.4.1 rule 3)
- Conflict detection: nếu multiple paths lead to conflicting conclusions → `AMBIGUOUS`
- Returns `{ selected: ReasoningPath[], rejected: ReasoningPath[], explanation: string[] }`

**5.3 Tạo `src/core/graph/traversal/TrustAwareQueryEngine.ts`:**

- Wraps `GraphQueryEngine` (giữ internal BFS/DFS traversal)
- Constructor nhận `{ mode: QueryMode, operation: OperationType }`
- **Step 1:** Lookup `EdgePolicyTable` → get allowed/forbidden edge types
- **Step 2:** Filter edges từ `GraphArtifactLoader` trước khi traverse
- **Step 3:** Run traversal với filtered edge set
- **Step 4:** Compute `trust_level` cho mỗi path (spec §9.4.7):
  - canonical-only edges → `AUTHORITATIVE`
  - canonical + derived → `DERIVED`
  - any exploratory → `EXPLORATORY` or `MIXED`
- **Step 5:** Aggregate `DecisionStatus` theo pessimistic rule (spec §9.4.6)
- **Step 6:** Run `pathSelector` to select/reject paths
- **Step 7:** Build and return `QueryResult` (NOT raw nodes/edges)
- **Step 8:** Enforce mixed_safe hop limit (max 2 exploratory hops in P0)
- **Step 9:** Emit `INSUFFICIENT_EVIDENCE` nếu không có canonical/derived path trong authoritative mode

**5.4 Update [GraphQueryEngine.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts):**
- Expose internal traversal methods để `TrustAwareQueryEngine` có thể wrap
- Không thay đổi external API của `GraphQueryEngine` trong P0 (backward compat)

**Files cần tạo:**
- `src/core/graph/traversal/EdgePolicyTable.ts`
- `src/core/graph/traversal/TrustAwareQueryEngine.ts`
- `src/core/graph/traversal/pathSelector.ts`
- Update: [src/core/graph/query/GraphQueryEngine.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts)

---

## Phase 6 — Query Chokepoint Enforcement

> **⚠️ Reordered:** Phase này (trước đây Phase 5) thực hiện SAU Phase 5 vì cần `TrustAwareQueryEngine` đã tồn tại.  
> **Goal:** Tất cả external-facing reasoning PHẢI route qua `TrustAwareQueryEngine`. Xóa direct DB bypass trong MCP tools.  
> **Spec refs:** §9.2.6, §15.2.1, §10.3

### Tasks

**6.1 Fix [src/mcp/tools/query.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/query.ts)** — `get_callers` (line 59-61) là bypass duy nhất thực sự trong file này:

> 4 tools còn lại (`get_node`, `get_neighbors`, `get_path`, `get_lineage`) đã đúng — đang dùng `GraphQueryEngine`.

```ts
// BEFORE (bypass — line 59-61):
const nodes = db.getNodesByWorkspace(input.workspaceId, 'canonical');
return nodes.filter(n => n.label === input.symbol || n.symbol === input.symbol);

// AFTER (via TrustAwareQueryEngine):
const engine = new TrustAwareQueryEngine(input.workspaceId, loader, { mode: 'authoritative', operation: 'ask' });
return engine.findBySymbol(input.symbol);
```

**6.2 Classify [src/mcp/tools/graph.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/graph.ts)** — 5 tools trong file này là **operational stats, không phải reasoning bypass**:

- `get_graph_stats`, `find_hubs`, `find_bridges`, `find_knowledge_gaps` → phép dùng direct DB (metric/reporting, không conclude qua graph)
- `get_architecture` → community detection → OK, không phải reasoning
- **Action:** Thêm code comment `// Operational: direct DB access permitted (spec §9.2.6)` vào mỗi tool
- **Action:** Đảm bảo response không lẫn `QueryResult` format với operational stats format

**6.3 Review [src/mcp/tools/search.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/search.ts), [review.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/review.ts):**
- Nếu tool nào select/rank/conclude từ graph data → phải route qua `TrustAwareQueryEngine`
- Raw graph access chỉ cho debug/admin inspection

**6.4 Fix [src/pipeline/impactReport.ts](file:///e:/Projects/graph-wiki/src/pipeline/impactReport.ts):**
- Xác nhận không bypass query engine cho reasoning operations

**Files cần sửa:**
- [src/mcp/tools/query.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/query.ts) — chỉ fix `get_callers`
- [src/mcp/tools/graph.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/graph.ts) — add comments only, không đổi logic
- [src/mcp/tools/search.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/search.ts)
- [src/mcp/tools/review.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/review.ts)
- [src/pipeline/impactReport.ts](file:///e:/Projects/graph-wiki/src/pipeline/impactReport.ts)

---

## Phase 7 — Validation & Governance Hooks

> **Goal:** Implement hard-fail và soft-warning validation. Governance authority chain rejection.  
> **Spec refs:** §12, §13, §11

### Tasks

**7.1 Tạo `src/core/validation/GraphValidator.ts`:**

Hard-fail conditions (throw/reject):
- Edge without `type`
- Canonical node without authoritative provenance
- Canonical edge without evidence or deterministic proof
- Invalid `graph_kind` value
- Invalid traversal mode
- `graph_kind = 'external'` khi external workflow not implemented

Soft warnings (emit, không fail):
- Low-confidence evidence
- Orphan node
- Flow without entrypoint
- Exploratory annotation in authoritative output
- Truncated result set

**7.2 Tạo `src/core/validation/GovernanceEngine.ts`:**

- Authority chain tracer: `uses_authority` → `node_uses_authority` → `depends_on_authority`
- Reject khi chain broken hoặc contains exploratory proof
- Forbidden pattern detection (configurable từ YAML):
  - frontend → database direct call
  - route bypassing use case
  - service writes without authority
- Flow integrity checks

**7.3 Update [src/pipeline/stages/06_verify.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/06_verify.ts):**
- Tích hợp `GraphValidator` và `GovernanceEngine`
- Emit `POLICY_VIOLATION` codes khi appropriate

**7.4 Tạo `src/core/validation/StatusCodes.ts`:**
- Centralize tất cả machine-readable codes từ §11

**Files cần tạo:**
- `src/core/validation/GraphValidator.ts`
- `src/core/validation/GovernanceEngine.ts`
- `src/core/validation/StatusCodes.ts`
- Update: [src/pipeline/stages/06_verify.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/06_verify.ts)

---

## Phase 8 — Observability (Trust Event Stream)

> **Goal:** Local-first file-based observability. `TrustEvent` emitter tại MCP, CLI, query engine.  
> **Spec refs:** §17, §17.1

### Tasks

**8.1 Tạo `src/core/observability/TrustEventEmitter.ts`:**

```ts
// TrustEvent schema từ spec §17.1
export type TrustEvent = {
  timestamp: string;
  workspace_id: string;
  operation: string;
  mode: QueryMode;
  status: DecisionStatus;
  codes: string[];
  warnings: string[];
  selected_path_count: number;
};

export class TrustEventEmitter {
  emit(event: TrustEvent): void; // appends to JSONL file
  summarize(): void; // writes trust-summary.json
}
```

Output paths:
- `knowledge/reports/<workspace>/trust-events.jsonl`
- `knowledge/reports/<workspace>/trust-summary.json`

**8.2 Integrate emitter vào:**
- `TrustAwareQueryEngine` — emit sau mỗi query
- MCP tools — emit sau mỗi reasoning tool call
- CLI commands — emit sau mỗi reasoning operation

**Files cần tạo:**
- `src/core/observability/TrustEventEmitter.ts`
- Update: `TrustAwareQueryEngine`, MCP tools, CLI

---

## Phase 9 — Wiki Explainability Update

> **Goal:** Wiki phải distinguish authoritative vs exploratory. Show provenance.  
> **Spec refs:** §9.2.4, §14

### Tasks

**9.1 Update [src/pipeline/stages/07_wiki.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/07_wiki.ts):**
- Input phải là `QueryResult` (hoặc derived từ trust-aware source)
- Annotate exploratory facts với warning badge
- Show `provenance.source`, `confidence_band`, `status`
- Distinguish authoritative conclusions từ exploratory annotations visually

**9.2 Update [src/mcp/tools/wiki.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/wiki.ts):**
- Wiki MCP tool phải route qua `TrustAwareQueryEngine`
- Output phải include trust metadata

**Files cần sửa:**
- [src/pipeline/stages/07_wiki.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/07_wiki.ts)
- [src/mcp/tools/wiki.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/wiki.ts)

---

## Phase 10 — Full Rebuild

> **Goal:** Rebuild graph sau khi tất cả semantic changes applied.  
> **Spec refs:** §16.4

### Tasks

**10.1 Chạy full pipeline rebuild:**
```bash
npx graph-wiki pipeline run --workspace <id> --force-rebuild
```

**10.2 Verify DoD checklist (spec §18):**
- [ ] Single runtime graph contract tại [types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts)
- [ ] Parser/builder output tuân theo graph layer semantics
- [ ] Không có inferred relation silently stored as canonical
- [ ] Query engine enforce traversal rules by operation và mode
- [ ] Trusted query surfaces trả `QueryResult`
- [ ] MCP và CLI reasoning paths không bypass query engine
- [ ] Validation catches invalid canonical state
- [ ] Wiki distinguishes authoritative vs exploratory
- [ ] Governance hooks reject broken authority reasoning
- [ ] Observability tồn tại cho trust outcomes

---

## Dependency Graph

```
Phase 1 (Contract Unification)
    ↓
Phase 2 (Storage Mapper + GraphArtifactLoader) ←── depends on Phase 1
    ↓
Phase 3 (Stage 03 Trust Classification) ←── depends on Phase 1
    ↓
Phase 4 (Stage 04a/04b + run.ts order fix) ←── depends on Phase 2, 3
    ↓
Phase 5 (Trust-Aware Traversal Engine) ←── depends on Phase 1, 2, 4
    ↓
Phase 6 (Query Chokepoint Enforcement) ←── depends on Phase 5  ← REORDERED
    ↓
Phase 7 (Validation & Governance) ←── depends on Phase 5, 6
Phase 8 (Observability) ←── depends on Phase 5
    ↓
Phase 9 (Wiki Explainability) ←── depends on Phase 5, 7
    ↓
Phase 10 (Full Rebuild + DoD Verification) ←── depends on all phases
```

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| [src/core/types.ts](file:///e:/Projects/graph-wiki/src/core/types.ts) | Major expand | 1, 3 |
| [src/core/graph/contracts.ts](file:///e:/Projects/graph-wiki/src/core/graph/contracts.ts) | Refactor to adapter (frozen label removed) | 1 |
| `src/storage/mappers.ts` | **Create** | 2 |
| [src/storage/GraphDB.ts](file:///e:/Projects/graph-wiki/src/storage/GraphDB.ts) | Mapper bridge + optional SQL migration | 2 |
| [src/core/graph/query/GraphArtifactLoader.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphArtifactLoader.ts) | Apply mapper on load | 2 |
| [src/pipeline/stages/03_validate.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/03_validate.ts) | Trust classification | 3 |
| [src/pipeline/stages/04_buildGraph.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/04_buildGraph.ts) | Deprecate | 4 |
| `src/pipeline/stages/04a_buildCanonical.ts` | **Create** | 4 |
| `src/pipeline/stages/04b_buildDerived.ts` | **Create** | 4 |
| [src/pipeline/run.ts](file:///e:/Projects/graph-wiki/src/pipeline/run.ts) | Stage sequence + order bug fix | 4 |
| `src/core/graph/traversal/EdgePolicyTable.ts` | **Create** | 5 |
| `src/core/graph/traversal/TrustAwareQueryEngine.ts` | **Create** | 5 |
| `src/core/graph/traversal/pathSelector.ts` | **Create** | 5 |
| [src/core/graph/query/GraphQueryEngine.ts](file:///e:/Projects/graph-wiki/src/core/graph/query/GraphQueryEngine.ts) | Expose internals for wrapping | 5 |
| [src/mcp/tools/query.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/query.ts) | Fix `get_callers` bypass only | 6 |
| [src/mcp/tools/graph.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/graph.ts) | Add operational comments only | 6 |
| [src/mcp/tools/search.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/search.ts) | Add trust wrapper if reasoning | 6 |
| [src/mcp/tools/review.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/review.ts) | Add trust wrapper if reasoning | 6 |
| [src/mcp/tools/wiki.ts](file:///e:/Projects/graph-wiki/src/mcp/tools/wiki.ts) | Route via engine | 6, 9 |
| [src/pipeline/impactReport.ts](file:///e:/Projects/graph-wiki/src/pipeline/impactReport.ts) | Verify no bypass | 6 |
| `src/core/validation/GraphValidator.ts` | **Create** | 7 |
| `src/core/validation/GovernanceEngine.ts` | **Create** | 7 |
| `src/core/validation/StatusCodes.ts` | **Create** | 7 |
| [src/pipeline/stages/06_verify.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/06_verify.ts) | Integrate validation | 7 |
| `src/core/observability/TrustEventEmitter.ts` | **Create** | 8 |
| [src/pipeline/stages/07_wiki.ts](file:///e:/Projects/graph-wiki/src/pipeline/stages/07_wiki.ts) | Add trust metadata | 9 |

> **13 files to create, 14 files to modify** (+GraphArtifactLoader, +graph.ts comments)
