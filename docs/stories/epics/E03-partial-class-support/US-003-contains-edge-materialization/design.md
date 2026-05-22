# Design

## Domain Model

`contains` edge type already exists in `EdgeType` at line 60 of `src/core/types.ts` —
no change to that file needed for this story.

Edge direction:

```
contains  — from: csharp_class | virtual_class → to: csharp_method
```

## Exported Interface

```typescript
export interface ContainsEdgeResult {
  edges: GraphEdge[];
  warnings: string[];
}

export function materializeContainsEdges(
  workspaceId: string,
  db: GraphDB,
): ContainsEdgeResult
```

## Edge Shape

```typescript
const edgeId = `edge:${sid(classNodeId, methodNodeId, 'contains')}`;
const edge: GraphEdge = {
  id: edgeId,
  stableKey: edgeId,
  workspace: workspaceId,              // NOT workspace_id
  from_id: classNodeId,                // virtual_class preferred; fallback to csharp_class
  to_id: methodNodeId,
  type: 'contains',
  graph_kind: 'derived',
  confidence_band: 'INFERRED',
  metadata: {
    derivation_rule: 'contains-edge-materialization',
  },
  provenance: {
    source: 'analysis',
    artifact_source: 'cross-file-analysis',
    producer_stage: '05b_build_derived',
    timestamp: new Date().toISOString(),
    rule: 'contains-edge-materialization',
  },
};
```

`sid()` is already defined at line 29 of `05b_build_derived.ts` — use it directly,
no import needed.

## Application Flow

`materializeContainsEdges()` runs inside `buildDerivedGraph()` in `05b_build_derived.ts`,
**after** `mergePartialClasses()` so that `virtual_class` nodes are already in the DB:

1. Load all nodes for the workspace from DB.
2. Build three lookup maps using `node.type` (NOT `node.kind`) and `node.project` (NOT
   `node.project_id`):
   - `virtualByLabel`: `"${project}::${label}"` → `virtual_class` node id
   - `fragmentByFile`: `"${project}::${label}::${source_file}"` → `csharp_class` node id
   - `fragmentByLabel`: `"${project}::${label}"` → any `csharp_class` node id (last wins)
3. For each node where `node.type === 'csharp_method'` and `lang_meta.containingClass` is set:
   a. Resolve class node id using three-tier priority:
      - Tier 1 (Req 6.2): `virtualByLabel[project::containingClass]`
      - Tier 2 (Req 6.3): `fragmentByFile[project::containingClass::methodSourceFile]`
      - Tier 3 (fallback): `fragmentByLabel[project::containingClass]`
   b. If no class node found: skip + emit warning.
   c. Build and upsert `contains` edge. One edge per method node (Req 6.6).

## Data Model

`contains` edges stored in `edges` table — no schema change. `EdgeType.contains` already
exists. `is_partial_of` is added by US-002 (coordinate with US-002 Phase 1).

## UI / Platform Impact

`contains` edges are automatically traversable by `TrustAwareTraversal` and
`TrustAwareQueryEngine`. No rendering changes needed.

## Observability

- Warning summary at derived stage:
  `"materializeContainsEdges: created N edges, M unresolved"`
- Per-unresolved warning:
  `"materializeContainsEdges: no class node found for containingClass=\"...\" (method: ..., project: ...)"`

## Alternatives Considered

1. **Create `contains` edges at extraction time (inside CSharpParser)** — rejected.
   Extractors produce `ParsedSymbol` (facts), not edges. Edges are a graph-layer concern.

2. **Always prefer the same-file class fragment instead of virtual_class** — rejected.
   When US-002 is active, `virtual_class` is the logical identity of the merged class.
   Pointing to a fragment would break lineage traversal for callers who want all methods
   regardless of which file they are in.

3. **Use a foreign-key style `class_node_id` in the method fact** — rejected. Facts are
   canonical and should not reference derived constructs (`virtual_class` IDs are derived).
