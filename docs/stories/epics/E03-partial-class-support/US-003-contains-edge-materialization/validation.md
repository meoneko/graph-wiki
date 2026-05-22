# Validation

## Proof Strategy

Run the pipeline with US-001 active. Confirm `contains` edges appear in the DB connecting
class nodes to method nodes. Confirm traversal returns methods when querying a class.
Confirm zero edges when no `csharp_method` nodes exist (US-001 flag off).

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `materializeContainsEdges()` with one `csharp_method` node (`lang_meta.containingClass = "Orders"`) and one `csharp_class` node labeled "Orders" → produces 1 `contains` edge |
| Unit | Same setup but with a `virtual_class` node labeled "Orders" → edge points to `virtual_class`, not `csharp_class` (Req 6.2) |
| Unit | Method's `source_file` matches one `csharp_class` fragment's `source_file`, no `virtual_class` → edge points to that fragment (Req 6.3) |
| Unit | `materializeContainsEdges()` with a method whose `containingClass` has no matching class node → 0 edges + 1 warning |
| Unit | No `csharp_method` nodes in workspace → 0 edges, 0 warnings |
| Integration | After full pipeline with `extract_partial_methods: true`, `SELECT COUNT(*) FROM edges WHERE type = 'contains'` > 0 |
| E2E | `crg ask "Orders"` result includes method nodes reachable via `contains` traversal |
| E2E | `crg impact "Blaze.cs"` result includes `Blaze_CSV_Output` as an affected node |
| Platform | `npm run typecheck` zero errors |
| Regression | Pipeline run without `extract_partial_methods` produces 0 `contains` edges (confirmed via DB query) |

## Property-Based Tests

Use `fast-check` (already a project dependency). Run with `npm test`.

| # | Property | Generators |
|---|---|---|
| P10 | For N method nodes that all have valid `containingClass` matching an available class node, `materializeContainsEdges()` produces exactly N `contains` edges | N ∈ [1, 10], random class/method names |
| P11 | When both a `virtual_class` and a `csharp_class` exist for the same label, every method in that class has its edge `from_id` pointing to the `virtual_class` node, never the fragment | any number of methods, one virtual + one fragment class |

```typescript
// Example property test skeleton (fast-check):
import fc from 'fast-check';

it('P10: exactly one contains edge per method node with valid containingClass', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 10 }),  // N method nodes
      fc.string({ minLength: 1 }),       // shared class label
      (n, className) => {
        const classNode = makeCsharpClassNode(className);
        const methodNodes = Array.from({ length: n }, (_, i) =>
          makeMethodNode(`Method_${i}`, className)
        );
        const result = materializeContainsEdges('ws', mockDb([classNode, ...methodNodes]));
        expect(result.edges).toHaveLength(n);
        expect(result.warnings).toHaveLength(0);
      }
    )
  );
});

it('P11: virtual_class is always preferred over csharp_class fragment', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 5 }),
      fc.string({ minLength: 1 }),
      (n, className) => {
        const virtualNode = makeVirtualClassNode(className);
        const fragmentNode = makeCsharpClassNode(className);
        const methodNodes = Array.from({ length: n }, (_, i) =>
          makeMethodNode(`Method_${i}`, className)
        );
        const result = materializeContainsEdges(
          'ws', mockDb([virtualNode, fragmentNode, ...methodNodes])
        );
        result.edges.forEach(e => {
          expect(e.from_id).toBe(virtualNode.id);
        });
      }
    )
  );
});
```

## Fixtures

Extend the fixture from US-002 (`partial_class_nodes.ts`) to add method nodes — use
correct field names (`type`, `workspace`, `project`):

```typescript
export const methodNode: GraphNode = {
  id: 'node:ws:proj:csharp_method:Orders.Blaze_CSV_Output:src/Order/Blaze.cs',
  stableKey: 'node:ws:proj:csharp_method:Orders.Blaze_CSV_Output:src/Order/Blaze.cs',
  workspace: 'ws',               // NOT workspace_id
  project: 'proj',               // NOT project_id
  type: 'csharp_method',         // NOT kind
  label: 'Blaze_CSV_Output',
  symbol: 'Orders.Blaze_CSV_Output',
  source_file: 'src/Order/Blaze.cs',
  graph_kind: 'canonical',
  confidence_band: 'AUTHORITATIVE',
  trust_level: 'AUTHORITATIVE',
  lang_meta: {
    containingClass: 'Orders',
    isPartialClass: true,
    returnType: 'bool',
    parameters: 'string path',
    sourceFile: 'src/Order/Blaze.cs',
  },
  provenance: { source: 'extraction', artifact_source: 'csharp_tree_sitter',
    producer_stage: '04a_build_canonical', timestamp: '2026-01-01T00:00:00.000Z' },
};
```

## Commands

```bash
npm run typecheck
npm test
npm run dev build -- --workspace b2g
crg ask "Orders" --workspace b2g
crg impact "Realex_Payments/NetAdmin/Order/CSV/Blaze.cs" --workspace b2g
```

## Acceptance Evidence

Pending implementation. Evidence must include:

- Unit test output: all 5 unit cases pass and P10, P11 properties hold
- DB query: `SELECT COUNT(*) FROM edges WHERE type = 'contains'` shows non-zero count
- `crg ask "Orders"` output: method nodes listed under class node
- `crg impact` output: `Blaze_CSV_Output` present in affected nodes list
- Regression: pipeline run on workspace without `extract_partial_methods` produces 0
  `contains` edges (confirmed via DB query)
