# Exec Plan

## Goal

Materialize `contains` derived edges from `lang_meta.containingClass` on method nodes to
their owning class nodes, enabling traversal between a class and its members.

## Scope

In scope:

- Export `ContainsEdgeResult` interface from `05b_build_derived.ts`
- Implement `materializeContainsEdges()` in `src/pipeline/stages/05b_build_derived.ts`
- Call from `buildDerivedGraph()` **after** `mergePartialClasses()` so that `virtual_class`
  nodes exist in DB before resolution
- Upsert resulting edges to DB and include in returned derived edges

Out of scope:

- Namespace → class `contains` edges
- TypeScript class member edges
- New node types

## Risk Classification

Risk flags:

- **Low**: pure derived-layer addition. Canonical data untouched.
- **Low-medium**: resolution ambiguity when two `csharp_class` nodes share the same label
  in the same project and no `virtual_class` exists. The same-file fallback (Req 6.3)
  handles this case.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- Exactly one `contains` edge per Method_Node (Req 6.6)
- Zero `contains` edges when no `csharp_method` nodes exist (US-001 flag off)

## Work Phases

### Phase 1 — Verify EdgeType (coordinate with US-002)

1. Confirm `contains` is already present in `EdgeType` at line 60 of
   `src/core/types.ts` — **do NOT add it again**. Only `is_partial_of` needs to be
   added (done in US-002 Phase 1). Verify before editing.

### Phase 2 — Core implementation

2. Export the result interface and implement the function in
   `src/pipeline/stages/05b_build_derived.ts`. The `sid()` helper is already defined
   at line 29 of that file — use it directly (no import needed):

```typescript
export interface ContainsEdgeResult {
  edges: GraphEdge[];
  warnings: string[];
}

export function materializeContainsEdges(
  workspaceId: string,
  db: GraphDB,
): ContainsEdgeResult {
  const allNodes = db.getAllNodesByWorkspace(workspaceId);

  // Priority lookups — use node.type (NOT node.kind) and node.project (NOT node.project_id)
  const virtualByLabel = new Map<string, string>();   // `project::label` → virtual_class id
  const fragmentByFile = new Map<string, string>();   // `project::label::sourceFile` → csharp_class id
  const fragmentByLabel = new Map<string, string>();  // `project::label` → any csharp_class id

  for (const node of allNodes) {
    const key = `${node.project}::${node.label}`;   // node.project, NOT node.project_id
    if (node.type === 'virtual_class') {             // node.type, NOT node.kind
      virtualByLabel.set(key, node.id);
    } else if (node.type === 'csharp_class') {
      fragmentByLabel.set(key, node.id);
      if (node.source_file) {
        fragmentByFile.set(`${key}::${node.source_file}`, node.id);
      }
    }
  }

  const newEdges: GraphEdge[] = [];
  const warnings: string[] = [];

  for (const node of allNodes) {
    if (node.type !== 'csharp_method') continue;    // node.type, NOT node.kind
    const containingClass = node.lang_meta?.containingClass as string | undefined;
    if (!containingClass) continue;

    const key = `${node.project}::${containingClass}`;
    const methodSourceFile = node.lang_meta?.sourceFile as string | undefined;

    // Req 6.2: prefer virtual_class
    let classNodeId = virtualByLabel.get(key);

    // Req 6.3: same-file fragment fallback
    if (!classNodeId && methodSourceFile) {
      classNodeId = fragmentByFile.get(`${key}::${methodSourceFile}`);
    }

    // Final fallback: any fragment with matching label
    if (!classNodeId) {
      classNodeId = fragmentByLabel.get(key);
    }

    if (!classNodeId) {
      warnings.push(
        `materializeContainsEdges: no class node found for containingClass="${containingClass}" ` +
        `(method: ${node.label}, project: ${node.project})`
      );
      continue;
    }

    // Req 6.6: exactly one contains edge per method node
    const edgeId = `edge:${sid(classNodeId, node.id, 'contains')}`;
    const edge: GraphEdge = {
      id: edgeId,
      stableKey: edgeId,
      workspace: workspaceId,              // NOT workspace_id
      from_id: classNodeId,
      to_id: node.id,
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
    db.upsertEdge(edge);
    newEdges.push(edge);
  }

  return { edges: newEdges, warnings };
}
```

### Phase 3 — Call site in buildDerivedGraph

3. In `buildDerivedGraph()`, call after `mergePartialClasses()`:

```typescript
const containsResult = materializeContainsEdges(workspaceId, db);
allEdges.push(...containsResult.edges);

emitStageEvent(emitter, workspaceId, 'build_derived', DecisionStatus.OK, [],
  [
    `materializeContainsEdges: created ${containsResult.edges.length} edges, ` +
    `${containsResult.warnings.length} unresolved`,
    ...containsResult.warnings,
  ]
);
```

### Phase 4 — Verification

4. `npm run typecheck` — fix any errors.
5. `npm test` — fix any failures.
6. Run pipeline, then:

```bash
crg ask "Blaze_CSV_Output" --workspace b2g
```

   Confirm response shows a `contains` edge from the `Orders` class (or `virtual_class`
   if US-002 is active).

## Stop Conditions

- If `lang_meta.containingClass` is not accessible due to TypeScript type narrowing, cast
  `node.lang_meta` through `unknown` before accessing the field.
- If `db.upsertEdge()` does not exist, use the equivalent bulk-insert helper found in
  other `05b_build_derived.ts` call sites.
- If `getAllNodesByWorkspace()` does not exist, check the existing stage code for the
  correct method name.
