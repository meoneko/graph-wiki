---

# **Graph Schema & Edge Taxonomy Specification (v1)**

---

# 1. Purpose

## 1.1 Objective

Định nghĩa:

* cấu trúc **node / edge**
* ngữ nghĩa **edge types**
* rule phân biệt **canonical vs exploratory**
* rule cho **traversal / reasoning / governance**

---

## 1.2 Scope

Áp dụng cho:

* parser (C#, TS/React, future adapters)
* graph builder
* query engine
* MCP tools
* wiki generator
* review / ask / impact
* governance engine

---

## 1.3 Non-Goals

* không tối ưu storage
* không optimize performance
* không define UI

---

# 2. Core Principles

---

## Principle 1 — Graph is Runtime Truth

Graph không phải cache → là **nguồn sự thật duy nhất**

---

## Principle 2 — Fail Closed

* không đủ dữ liệu → không kết luận
* không fallback sang AI

---

## Principle 3 — Explicit Semantics

Mỗi edge phải có nghĩa rõ ràng, không ambiguous

---

## Principle 4 — Canonical Isolation

* canonical ≠ exploratory
* không được trộn

---

## Principle 5 — Provenance First

Mọi node/edge phải trace được nguồn

---

# 3. Graph Model Overview

---

## 3.1 Graph Entity Types

```id="l3l0o3"
Graph
 ├── Nodes
 └── Edges
```

---

## 3.2 Graph Layers

| Layer       | Description             |
| ----------- | ----------------------- |
| Canonical   | Parser + deterministic  |
| Derived     | Computed from canonical |
| Exploratory | AI / heuristic          |
| External    | User / AI feedback      |

---

# 4. Node Schema

---

## 4.1 Node Definition

```ts
type GraphNode = {
  id: string
  workspace: string
  project: string

  type: NodeType
  label: string

  source_file: string
  symbol?: string

  graph_kind: "canonical" | "derived" | "exploratory" | "external"

  confidence: number   // 0 → 1
  provenance: Provenance

  metadata?: Record<string, any>

  created_at: string
  updated_at: string
}
```

---

## 4.2 NodeType (v1)

### Structural

* `file`
* `module`
* `namespace`
* `class`
* `interface`
* `function`
* `method`

---

### Runtime

* `entrypoint`
* `controller_action`
* `api_endpoint`
* `usecase`
* `service`

---

### Data

* `dto`
* `model`
* `entity`
* `request`
* `response`

---

### Frontend

* `frontend_route`
* `react_component`
* `hook`

---

### System

* `external_service`
* `queue`
* `job`

---

### Conceptual (Derived)

* `flow`
* `domain`
* `cluster`

---

## 4.3 Node Invariants

* `id` phải unique
* `graph_kind = canonical` → phải có provenance từ parser
* `confidence = 1` chỉ khi deterministic

---

# 5. Edge Schema

---

## 5.1 Edge Definition

```ts
type GraphEdge = {
  id: string

  from_id: string
  to_id: string

  type: EdgeType

  graph_kind: "canonical" | "derived" | "exploratory"

  confidence: number
  provenance: Provenance

  metadata?: {
    line?: number
    column?: number
    derivation_rule?: string
  }

  created_at: string
}
```

---

## 5.2 Edge Invariants

* edge phải có `type`
* edge canonical phải có source reference
* edge exploratory phải có confidence < 1

---

# 6. Edge Taxonomy

---

# 6.1 Structural Edges

| Type         | Meaning                  | Canonical |
| ------------ | ------------------------ | --------- |
| `contains`   | file → class/function    | ✅         |
| `imports`    | module dependency        | ✅         |
| `inherits`   | class inheritance        | ✅         |
| `implements` | interface implementation | ✅         |

---

# 6.2 Runtime Edges

| Type            | Meaning                     | Canonical |
| --------------- | --------------------------- | --------- |
| `calls`         | function/method call        | ✅         |
| `invokes`       | higher-level call (usecase) | ✅         |
| `dispatches_to` | routing/dispatch            | ✅         |
| `triggers`      | async trigger/job           | ⚠️        |

---

# 6.3 Entry & Flow Edges

| Type              | Meaning           |
| ----------------- | ----------------- |
| `entry_of`        | entrypoint → flow |
| `precedes`        | step A → step B   |
| `belongs_to_flow` | node → flow       |

---

# 6.4 Contract Edges

| Type       | Meaning            |
| ---------- | ------------------ |
| `requests` | FE → API           |
| `returns`  | API → DTO          |
| `maps_to`  | DTO ↔ entity       |
| `binds_to` | route → controller |

---

# 6.5 Authority Edges (CRITICAL)

| Type                   | Meaning              |
| ---------------------- | -------------------- |
| `uses_authority`       | depends on authority |
| `node_uses_authority`  | node-level authority |
| `depends_on_authority` | stronger dependency  |

👉 dùng cho governance + critical lineage

---

# 6.6 Data Flow Edges

| Type         | Meaning         |
| ------------ | --------------- |
| `reads`      | reads data      |
| `writes`     | writes data     |
| `transforms` | transforms data |

---

# 6.7 Exploratory Edges

| Type                | Meaning             |
| ------------------- | ------------------- |
| `likely_calls`      | inferred call       |
| `semantic_match`    | fuzzy relation      |
| `inferred_contract` | AI inferred mapping |

👉 luôn:

* graph_kind = exploratory
* confidence < 1

---

# 7. Edge Strength Classification

---

| Level    | Edge Types                    | Usage             |
| -------- | ----------------------------- | ----------------- |
| Strong   | calls, invokes, dispatches_to | runtime reasoning |
| Medium   | imports, contains             | structural        |
| Weak     | semantic_match                | exploratory       |
| Critical | uses_authority                | governance        |

---

# 8. Traversal Rules

---

## 8.1 Impact Analysis

Allowed:

* calls
* invokes
* dispatches_to
* triggers

Optional:

* imports

Forbidden:

* semantic_match

---

## 8.2 Lineage

Allowed:

* calls
* uses_authority

Forbidden:

* imports

---

## 8.3 Ask (Fail-Closed)

Mode:

### Authoritative

* canonical + derived only

### Mixed Safe

* canonical + limited exploratory (≤ 2 hops)

### Exploratory

* exploratory allowed nhưng flagged

---

## 8.4 Wiki Generation

Allowed:

* canonical + derived
* exploratory chỉ để annotate

---

# 9. Canonical vs Exploratory Rules

---

## 9.1 Canonical

* source: parser
* confidence = 1
* không cần approval

---

## 9.2 Derived

* computed từ canonical
* deterministic
* confidence ≥ 0.9

---

## 9.3 Exploratory

* AI / heuristic
* confidence < 0.8
* không được dùng để conclude

---

## 9.4 Promotion Rules

Exploratory → Canonical khi:

* có ≥ 2 independent evidence
* pass validation rules
* được approve

---

# 10. Provenance Model

---

```ts
type Provenance = {
  source: "parser" | "analysis" | "ai" | "user"
  file?: string
  line?: number
  rule?: string
  timestamp: string
}
```

---

## 10.1 Requirements

* canonical phải có file + line
* derived phải có rule
* exploratory phải có AI marker

---

# 11. Validation Rules

---

## 11.1 Hard Fail

* edge không có type
* node không có source_file
* canonical không có provenance

---

## 11.2 Soft Warning

* confidence < threshold
* orphan node
* flow không có entrypoint

---

# 12. Governance Hooks

---

## 12.1 Authority Chain Validation

* phải trace được full chain
* không được đi qua exploratory edge

---

## 12.2 Forbidden Pattern

Ví dụ:

* FE gọi DB trực tiếp
* bypass usecase

---

## 12.3 Flow Integrity

* entrypoint phải dẫn đến end
* không dead branch

---

# 13. Example (Applied)

Dựa trên workflow:



```id="n8eh4g"
Processor.Process_Orders
   └── Orders.Process_Order
        ├── validate payment
        ├── update order status
        ├── dispatch logic
        └── notifications
```

Graph representation:

* node: `entrypoint`
* node: `usecase`
* edges:

  * `entry_of`
  * `calls`
  * `precedes`

Impact:

* propagate via `calls` edges
* NOT via `semantic_match`

---

# 14. Definition of Done

Spec được coi là DONE khi:

* tất cả parser output tuân theo schema
* tất cả edges có type hợp lệ
* query engine enforce traversal rules
* MCP không bypass schema
* wiki hiển thị provenance
* exploratory không ảnh hưởng canonical

---

# 15. Final Statement

---

> This specification transforms the graph from a data structure into a **trusted execution model for reasoning**.

---

