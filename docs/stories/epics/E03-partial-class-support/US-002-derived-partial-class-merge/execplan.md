# Exec Plan

## Goal

Create `virtual_class` merged nodes and `is_partial_of` derived edges in the derived build
stage so that partial class fragments are connected in the graph without altering canonical
nodes.

## Scope

In scope:

- Register `virtual_class` in `nodeTypeRegistry.ts` (correct schema with `id`, `category`, etc.)
- Add `'is_partial_of'` to `EdgeType` const in `src/core/types.ts`
  (`contains` already exists at line 60 — do NOT add it again)
- Export `PartialClassMergeResult` interface from `05b_build_derived.ts`
- Implement `mergePartialClasses()` in `src/pipeline/stages/05b_build_derived.ts`
- Call from `buildDerivedGraph()` and include output in returned nodes/edges
- Delete stale `virtual_class` nodes and `is_partial_of` edges before re-creating (both
  full rebuild and incremental)
- Emit `PARTIAL_CLASS_NAMESPACE_AMBIGUOUS` warnings via `emitStageEvent`

Out of scope:

- Canonical node changes
- Config flags (merging is always on when partial fragments exist)
- Contains edges (US-003)

## Risk Classification

Risk flags:

- **High**: first-level subdirectory check could incorrectly skip a valid merge (e.g. two
  files in `Order/A/` and `Order/B/` that genuinely belong to the same namespace). The
  warning allows operators to see skipped cases.
- **Medium**: stale `virtual_class` nodes in incremental builds if cleanup step is
  omitted. Mitigated by the pre-creation delete described in Phase 3.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- A class with exactly one `csharp_class` fragment must NOT produce a `virtual_class` node

## Work Phases

### Phase 1 — Type registration

1. Register `virtual_class` in `src/core/nodeTypeRegistry.ts`:

```typescript
nodeTypeRegistry.register({
  id: 'virtual_class',
  category: 'domain',
  isCanonical: false,
  isEntrypoint: false,
  languages: ['csharp'],
});
```

2. In `src/core/types.ts`, add `is_partial_of` to the `EdgeType` const
   (`contains` is already at line 60 — verify before editing):

```typescript
export const EdgeType = {
  // ... existing entries including contains ...
  is_partial_of: 'is_partial_of',
} as const;
```

### Phase 2 — Core implementation

3. Export the result interface and implement the function in
   `src/pipeline/stages/05b_build_derived.ts`. The `sid()` helper is already defined
   at line 29 of that file — use it directly (no import needed):

```typescript
export interface PartialClassMergeResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
}

export function mergePartialClasses(
  workspaceId: string,
  db: GraphDB,
): PartialClassMergeResult {
  // Filter: use n.type (NOT n.kind) and check lang_meta.isPartial
  const allClassNodes = db.getAllNodesByWorkspace(workspaceId)
    .filter(n => n.type === 'csharp_class' && n.lang_meta?.isPartial === true);

  // Group by (project, label) — use n.project (NOT n.project_id)
  const groups = new Map<string, GraphNode[]>();
  for (const node of allClassNodes) {
    const key = `${node.project}::${node.label}`;
    const arr = groups.get(key) ?? [];
    arr.push(node);
    groups.set(key, arr);
  }

  const newNodes: GraphNode[] = [];
  const newEdges: GraphEdge[] = [];
  const warnings: string[] = [];

  for (const [, fragments] of groups) {
    if (fragments.length < 2) continue;

    const first = fragments[0]!;
    const className = first.label;
    const projectId = first.project;   // NOT project_id

    // Ambiguity check: distinct first-level subdirectories relative to project root
    const firstLevelDirs = new Set(
      fragments.map(f => {
        const rel = f.source_file ?? '';
        return rel.replace(/\\/g, '/').split('/')[0] ?? '';
      })
    );
    if (firstLevelDirs.size >= 2) {
      warnings.push(
        `PARTIAL_CLASS_NAMESPACE_AMBIGUOUS: ${className} (project: ${projectId}, dirs: [${[...firstLevelDirs].join(', ')}])`
      );
      continue;
    }

    // Namespace resolution: common namespace or unset
    const namespaces = new Set(
      fragments
        .map(f => f.lang_meta?.namespace as string | undefined)
        .filter((ns): ns is string => !!ns)
    );
    const commonNamespace = namespaces.size === 1 ? [...namespaces][0] : undefined;

    // Sort fragment IDs alphabetically for deterministic mergedFrom (Req 5.4)
    const sortedFragmentIds = fragments.map(f => f.id).sort();

    // Use sid() (defined at line 29 of this file) for a stable, collision-resistant id
    const virtualId = `virtual_class:${sid(workspaceId, projectId, className)}`;

    const virtualNode: GraphNode = {
      id: virtualId,
      stableKey: virtualId,                  // derived nodes: stableKey = id
      workspace: workspaceId,                // NOT workspace_id
      project: projectId,                    // NOT project_id
      type: 'virtual_class',                 // NOT kind
      label: className,
      symbol: className,
      source_file: undefined,
      graph_kind: 'derived',
      confidence_band: 'INFERRED',
      trust_level: 'DERIVED',
      lang_meta: {
        mergedFrom: sortedFragmentIds,
        fragmentCount: fragments.length,
        namespace: commonNamespace,
      },
      provenance: {
        source: 'analysis',
        artifact_source: 'cross-file-analysis',
        producer_stage: '05b_build_derived',
        timestamp: new Date().toISOString(),
        rule: 'partial-class-merge',
      },
    };
    newNodes.push(virtualNode);

    for (const fragment of fragments) {
      const edgeId = `edge:${sid(fragment.id, virtualId, 'is_partial_of')}`;
      const edge: GraphEdge = {
        id: edgeId,
        stableKey: edgeId,
        workspace: workspaceId,              // NOT workspace_id
        from_id: fragment.id,
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
      newEdges.push(edge);
    }
  }

  return { nodes: newNodes, edges: newEdges, warnings };
}
```

### Phase 3 — Pre-creation cleanup (incremental safety)

4. In `buildDerivedGraph()`, **before** calling `mergePartialClasses()`, delete all
   existing `virtual_class` nodes and `is_partial_of` edges for the workspace:

```typescript
// Remove stale derived partial-class nodes before recomputing
db.deleteNodesByKind(workspaceId, 'virtual_class');
db.deleteEdgesByType(workspaceId, 'is_partial_of');
```

   If `deleteNodesByKind()` / `deleteEdgesByType()` don't exist on `GraphDB`, add them:

```typescript
// In GraphDB.ts:
deleteNodesByKind(workspaceId: string, kind: string): void {
  this.db.prepare(
    `DELETE FROM nodes WHERE workspace = ? AND type = ?`
  ).run(workspaceId, kind);
}

deleteEdgesByType(workspaceId: string, type: string): void {
  this.db.prepare(
    `DELETE FROM edges WHERE workspace = ? AND type = ?`
  ).run(workspaceId, type);
}
```

### Phase 4 — Upsert and surface warnings

5. After calling `mergePartialClasses()`, upsert all returned nodes and edges to DB
   following the existing pattern in `buildDerivedGraph()`. Surface summary via
   `emitStageEvent`:

```typescript
const mergeResult = mergePartialClasses(workspaceId, db);
// upsert nodes and edges ...
emitStageEvent(emitter, workspaceId, 'build_derived', DecisionStatus.OK, [],
  [
    `mergePartialClasses: created ${mergeResult.nodes.length} virtual_class nodes, ` +
    `${mergeResult.edges.length} is_partial_of edges, ${mergeResult.warnings.length} warnings`,
    ...mergeResult.warnings,
  ]
);
```

### Phase 5 — Verification

6. `npm run typecheck` — fix any errors.
7. `npm test` — fix any failures.
8. Run pipeline against workspace with known partial classes, then:

```bash
crg ask "Orders" --workspace b2g
```

   Confirm `virtual_class` node appears with `is_partial_of` edges.

## Stop Conditions

- If `getAllNodesByWorkspace()` does not exist, use the equivalent bulk query method in
  `GraphDB.ts` (check existing stage code for the correct method name).
- If `lang_meta.isPartial` is not populated on `csharp_class` nodes: the `CSharpParser`
  already sets `isPartial: true` on `ParsedSymbol`; trace through `CSharpAdapter` to
  confirm it is passed into `lang_meta` on the candidate record.
- If `deleteNodesByKind()` / `deleteEdgesByType()` don't exist, add them before proceeding.
