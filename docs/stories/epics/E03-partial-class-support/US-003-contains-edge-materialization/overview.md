# Overview

## Current Behavior

The `CSharpParser` tracks which class a symbol belongs to via `lang_meta.containingClass`,
but this relationship is never materialized as a graph edge. As a result, there is no way
to traverse from a class node to its member methods (or vice versa) in the knowledge graph.
Impact queries on a class do not enumerate its methods; wiki pages for a class list no
members.

## Target Behavior

During the derived build stage (`05b_build_derived.ts`), a `materializeContainsEdges()`
pass reads `lang_meta.containingClass` from all nodes that carry it (primarily
`csharp_method` nodes produced by US-001). For each such node, it looks up the best
matching class node and creates a `contains` derived edge:

```
csharp_class (or virtual_class) ──[contains]──> csharp_method
```

If US-002 is also active and a `virtual_class` node exists for the containing class, the
edge points to the `virtual_class` instead, so that methods are reachable from the merged
identity. If US-002 is not active, the edge points to the best per-file `csharp_class`
fragment.

## Affected Users

- Developers using `crg impact` on a class — now includes method nodes in blast radius
- MCP `get_lineage` — traversal can follow `contains` edges into methods
- Wiki generator — `contains` edges can be used to list class members in generated docs

## Affected Product Docs

- `SPEC.md` §EdgeType — document `contains` edge (if not already present)
- `README.md` §Graph Edge Types — add `contains` to the table

## Non-Goals

- No extraction of fields/properties (only methods from US-001)
- No C# namespace → class `contains` edges (deferred)
- No TypeScript class member contains edges (separate story)
- No bidirectional traversal enforcement (graph traversal already handles both directions)

## Dependencies

- **US-001 must be complete**: `csharp_method` nodes must exist for `contains` edges to
  connect. Without US-001, `materializeContainsEdges()` produces zero edges.
- **US-002 is optional**: when active, edges point to `virtual_class`; when absent, edges
  point to per-file `csharp_class` fragments. Both configurations are valid.
