# Design

## Domain Model

New node type registered in `src/core/nodeTypeRegistry.ts`:

```typescript
nodeTypeRegistry.register({
  id: 'virtual_class',
  category: 'domain',
  isCanonical: false,
  isEntrypoint: false,
  languages: ['csharp'],
});
```

New edge type `is_partial_of` added to `EdgeType` const in `src/core/types.ts`:

```typescript
export const EdgeType = {
  // ... existing entries ...
  is_partial_of: 'is_partial_of',  // fragment → virtual_class
} as const;
```

(`contains` already exists in `EdgeType` — no change needed for it.)

## Exported Interfaces

```typescript
export interface PartialClassMergeResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
}

export function mergePartialClasses(
  workspaceId: string,
  db: GraphDB,
): PartialClassMergeResult
```

## `virtual_class` Node Shape

`GraphNode` uses `type`, `workspace`, `project` (not `kind`, `workspace_id`, `project_id`):

```typescript
const virtualId = `virtual_class:${sid(workspaceId, projectId, className)}`;
const virtualNode: GraphNode = {
  id: virtualId,
  stableKey: virtualId,          // derived nodes: stableKey = id
  workspace: workspaceId,
  project: projectId,
  type: 'virtual_class',         // matches nodeTypeRegistry id
  label: className,
  symbol: className,
  source_file: undefined,
  graph_kind: 'derived',
  confidence_band: 'INFERRED',
  trust_level: 'DERIVED',
  lang_meta: {
    mergedFrom: sortedFragmentIds,    // fragment node IDs sorted alphabetically by stableKey
    fragmentCount: fragments.length,
    namespace: commonNamespace,       // common namespace or undefined if they differ
  },
  provenance: {                       // required field
    source: 'analysis',
    artifact_source: 'cross-file-analysis',
    producer_stage: '05b_build_derived',
    timestamp: new Date().toISOString(),
    rule: 'partial-class-merge',
  },
};
```

## `is_partial_of` Edge Shape

```typescript
const edge: GraphEdge = {
  id: `edge:${sid(fragmentNode.id, virtualId, 'is_partial_of')}`,
  stableKey: `edge:${sid(fragmentNode.id, virtualId, 'is_partial_of')}`,
  workspace: workspaceId,
  from_id: fragmentNode.id,
  to_id: virtualId,
  type: 'is_partial_of',
  graph_kind: 'derived',
  confidence_band: 'INFERRED',
  metadata: {
    derivation_rule: 'partial-class-merge',
  },
  provenance: {
    source: 'analysis',
    artifact_source: 'cross-file-analysis',
    producer_stage: '05b_build_derived',
    timestamp: new Date().toISOString(),
    rule: 'partial-class-merge',
  },
};
```

## Application Flow

`mergePartialClasses()` runs inside `buildDerivedGraph()` in `05b_build_derived.ts` after
stale virtual nodes are deleted.

```
Load csharp_class nodes with lang_meta.isPartial = true from DB
  → group by (project, label)
  → for each group size ≥ 2:
      check first-level subdirectory set
      → ≥ 2 distinct → emit PARTIAL_CLASS_NAMESPACE_AMBIGUOUS, skip
      → same subtree → resolve common namespace → sort fragment IDs alphabetically
        → create virtual_class + N is_partial_of edges
        → upsert to DB
```

Key implementation notes:

- **Filter**: `n.type === 'csharp_class'` (NOT `n.kind`) and `n.lang_meta?.isPartial === true`
- **`sid()` function** is already defined locally in `05b_build_derived.ts` (line 29) —
  use it directly, no import needed.
- **Ambiguity check**: extract first path component of `source_file` (split on `/` or `\`),
  count distinct values. If ≥ 2 distinct first-level dirs → skip.
- **Namespace**: collect `n.lang_meta?.namespace` from all fragments. If all equal → set
  `lang_meta.namespace`; otherwise leave unset.
- **Sorting**: `fragments.map(f => f.id).sort()` gives alphabetical order for `mergedFrom`.

## Pre-Creation Cleanup (Incremental Safety)

Before calling `mergePartialClasses()`, delete all existing `virtual_class` nodes and
`is_partial_of` edges for the workspace:

```typescript
db.deleteNodesByKind(workspaceId, 'virtual_class');
db.deleteEdgesByType(workspaceId, 'is_partial_of');
```

If these methods don't exist on `GraphDB`, add them (simple DELETE queries by type/workspace).
After deletion, re-run `mergePartialClasses()` from the full current fragment set in DB.
This handles Req 8.7/8.8: if a fragment is removed, the virtual_class is not re-created
when its group drops below 2 (group size check fails → no node created).

## Trust and Query Mode Behavior (Req 7.4)

`virtual_class` nodes have `graph_kind: 'derived'` and `confidence_band: 'INFERRED'`.
The existing `EdgePolicyTable` handles trust filtering automatically:

- **authoritative** mode: derived edges excluded → `virtual_class` not traversable
- **mixed_safe** / **exploratory**: derived edges included → `virtual_class` reachable

No `EdgePolicyTable` changes needed.

## Data Model

`virtual_class` stored in `nodes` table. `is_partial_of` stored in `edges` table. No
schema change required.

## Observability

Warnings via `emitStageEvent`:

```
PARTIAL_CLASS_NAMESPACE_AMBIGUOUS: ${className} (project: ${projectId}, dirs: [${dirs.join(', ')}])
mergePartialClasses: created ${nodeCount} virtual_class nodes, ${edgeCount} is_partial_of edges, ${warningCount} warnings
```

## Alternatives Considered

1. **Merge at canonical stage** — rejected. Canonical immutability requires per-file truth.
2. **Namespace from AST as primary key** — deferred. Parser already emits `namespace` via
   `resolveQualifiedInfo()`; it's used for `lang_meta.namespace` population but not
   grouping (grouping by `project + label` is simpler and sufficient for the common case).
3. **Single virtual_class per workspace** — rejected. Same class name in different projects
   → different classes.
