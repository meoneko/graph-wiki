# Overview

## Current Behavior

When C# splits a class across multiple files using the `partial` keyword, the parser emits
one separate `csharp_class` node per file. Each node has its own `stable_key` (which
includes the file path) so they appear as completely unrelated nodes in the graph. A graph
query for "all members of class Orders" returns results from whichever file the query
happens to reach — not the complete picture across all partial files.

## Target Behavior

During the derived build stage (`05b_build_derived.ts`), a new `mergePartialClasses()`
pass inspects all `csharp_class` nodes within a workspace. When two or more nodes share
the same class name and reside within the same directory subtree (heuristic for same
namespace), a single `virtual_class` node is created and `is_partial_of` derived edges
connect each fragment to it.

Result: querying the `virtual_class` node returns the full picture of the split class.
Individual fragment nodes remain unchanged (canonical layer untouched).

## Affected Users

- Developers using `crg impact` or `crg ask` on partial class types
- MCP tool consumers: `get_lineage`, `query_graph`, `impact_analysis`
- US-003 (contains edges can point to `virtual_class` when both stories are active)

## Affected Product Docs

- `SPEC.md` §TrustClassifier — document `virtual_class` as a derived-layer node type
- `README.md` §Graph Node Types — add `virtual_class` to the table

## Non-Goals

- No canonical layer mutation: `csharp_class` `stable_key` and nodes are not altered
- No cross-namespace merges (too ambiguous — a warning is emitted instead)
- No merging of non-C# types
- No UI changes needed for this story (nodes surface through existing query paths)
