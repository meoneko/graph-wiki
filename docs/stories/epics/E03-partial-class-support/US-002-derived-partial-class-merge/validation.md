# Validation

## Proof Strategy

Run the pipeline against a workspace with known partial classes. Confirm `virtual_class`
nodes and `is_partial_of` edges appear in DB. Confirm ambiguous (cross-first-level-dir)
cases are warned and not merged. Confirm single-fragment classes produce no `virtual_class`
node. Confirm namespace is populated correctly.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | Two same-directory fragments, same namespace → 1 `virtual_class` with `lang_meta.namespace` set, 2 `is_partial_of` edges |
| Unit | Two fragments in different first-level subdirs → 0 `virtual_class` + 1 `PARTIAL_CLASS_NAMESPACE_AMBIGUOUS` warning |
| Unit | One fragment → 0 `virtual_class` (Req 5.6) |
| Unit | Three fragments, same first-level dir, two different namespaces → 1 `virtual_class` with `lang_meta.namespace` unset |
| Unit | `lang_meta.mergedFrom` is alphabetically sorted by fragment node ID (Req 5.4) |
| Unit | `virtual_class.symbol` equals the simple class name (Req 5.8) |
| Integration | Full `buildDerivedGraph()` run includes `virtual_class` output for workspace with partial class fragments |
| Integration | Re-run (incremental sim): stale `virtual_class` nodes deleted before recompute → no duplicate nodes |
| E2E | `crg ask "Orders"` returns `virtual_class` node with 2 `is_partial_of` edges on B2G/LocalAdmin |
| E2E | `crg impact "Blaze.cs"` lists `virtual_class` as an affected node |
| Trust | In authoritative query mode, `virtual_class` and `is_partial_of` edges are absent from results (Req 7.4) |
| Trust | In `mixed_safe` mode, `virtual_class` is reachable from a Fragment_Node (Req 7.3) |
| Platform | `npm run typecheck` zero errors |
| Audit | `PARTIAL_CLASS_NAMESPACE_AMBIGUOUS` present in TrustEventEmitter JSONL for the ambiguous class |

## Property-Based Tests

Use `fast-check` (already a project dependency). Run with `npm test`.

| # | Property | Generators |
|---|---|---|
| P7 | For any N ≥ 2 fragments with the same `(project, label)` and same first-level dir, `mergePartialClasses()` produces exactly 1 `virtual_class` node | N ∈ [2, 10], random project/label strings |
| P8 | `lang_meta.mergedFrom` is always sorted ascending by fragment id, regardless of input order | shuffled fragment arrays of size 2–8 |
| P9 | For any M groups where each group spans ≥ 2 distinct first-level dirs, result has exactly M warnings and 0 `virtual_class` nodes | 1–5 ambiguous groups |
| P11 | `virtual_class.id` is deterministic: calling `mergePartialClasses()` twice with the same fragments produces the same node id | any valid (workspaceId, projectId, className) triple |
| P12 | For a group of N fragments, result contains exactly N `is_partial_of` edges | N ∈ [2, 8] |

```typescript
// Example property test skeleton (fast-check):
import fc from 'fast-check';

it('P8: mergedFrom is always sorted ascending', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 8 }),
      (ids) => {
        const fragments = ids.map(id => makeFragment(id, 'Orders', 'src'));
        const result = mergePartialClasses('ws', mockDb(fragments));
        const mergedFrom = result.nodes[0]!.lang_meta!.mergedFrom as string[];
        expect(mergedFrom).toEqual([...mergedFrom].sort());
      }
    )
  );
});

it('P11: virtual_class id is deterministic', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),  // workspaceId
      fc.string({ minLength: 1 }),  // projectId
      fc.string({ minLength: 1 }),  // className
      (ws, proj, cls) => {
        const fragments = [makeFragment('id1', cls, 'src', proj), makeFragment('id2', cls, 'src', proj)];
        const r1 = mergePartialClasses(ws, mockDb(fragments));
        const r2 = mergePartialClasses(ws, mockDb(fragments));
        expect(r1.nodes[0]!.id).toBe(r2.nodes[0]!.id);
      }
    )
  );
});
```

## Fixtures

Create `src/pipeline/stages/__tests__/fixtures/partial_class_nodes.ts`:

```typescript
import type { GraphNode } from '../../../core/types.js';

// Two fragments in the same first-level directory ("src") — correct field names
export const fragmentA: GraphNode = {
  id: 'node:ws:proj:csharp_class:Orders:src/Order/Blaze.cs',
  stableKey: 'node:ws:proj:csharp_class:Orders:src/Order/Blaze.cs',
  workspace: 'ws',               // NOT workspace_id
  project: 'proj',               // NOT project_id
  type: 'csharp_class',          // NOT kind
  label: 'Orders',
  symbol: 'Orders',
  source_file: 'src/Order/Blaze.cs',
  graph_kind: 'canonical',
  confidence_band: 'AUTHORITATIVE',
  trust_level: 'AUTHORITATIVE',
  lang_meta: { isPartial: true, namespace: 'B2G.Order' },
  provenance: { source: 'extraction', artifact_source: 'csharp_tree_sitter',
    producer_stage: '04a_build_canonical', timestamp: '2026-01-01T00:00:00.000Z' },
};
export const fragmentB: GraphNode = {
  ...fragmentA,
  id: 'node:ws:proj:csharp_class:Orders:src/Order/OrdersSeed.cs',
  stableKey: 'node:ws:proj:csharp_class:Orders:src/Order/OrdersSeed.cs',
  source_file: 'src/Order/OrdersSeed.cs',
};

// Cross-directory ambiguous case (first-level dirs: "src" vs "tests")
export const fragmentAmbig1: GraphNode = {
  ...fragmentA,
  id: 'node:ws:proj:csharp_class:Processing:src/Order/Processing.cs',
  stableKey: 'node:ws:proj:csharp_class:Processing:src/Order/Processing.cs',
  label: 'Processing', symbol: 'Processing',
  source_file: 'src/Order/Processing.cs',
};
export const fragmentAmbig2: GraphNode = {
  ...fragmentA,
  id: 'node:ws:proj:csharp_class:Processing:tests/Order/Processing.cs',
  stableKey: 'node:ws:proj:csharp_class:Processing:tests/Order/Processing.cs',
  label: 'Processing', symbol: 'Processing',
  source_file: 'tests/Order/Processing.cs',
};
```

## Commands

```bash
npm run typecheck
npm test
npm run dev build -- --workspace b2g
crg ask "Orders" --workspace b2g
```

## Acceptance Evidence

Pending implementation. Evidence must include:

- All 6 unit cases pass and all P7–P9, P11, P12 properties hold
- DB query: `SELECT type, label, lang_meta FROM nodes WHERE type = 'virtual_class'` returns
  rows with correct `fragmentCount` and alphabetically-sorted `mergedFrom`
- `crg ask "Orders"` shows `virtual_class` node and its `is_partial_of` edges
- Authoritative mode test: query result excludes `virtual_class` nodes
- JSONL log: `PARTIAL_CLASS_NAMESPACE_AMBIGUOUS` entry present for the ambiguous fixture class
