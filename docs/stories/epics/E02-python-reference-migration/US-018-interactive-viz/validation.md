# Validation

## Proof Strategy

Generate HTML for a workspace. Open in browser. Confirm nodes render, click interaction
works, filter toolbar toggles visibility, and search highlights nodes.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `exportHtml(nodes, edges, 'ws')` returns string starting with `<!DOCTYPE html>` |
| Unit | Output contains embedded `GRAPH_DATA` JSON with correct node count |
| Unit | Labels containing `</script>` are safely escaped in the output |
| Unit | Empty graph (0 nodes, 0 edges) produces valid HTML without JS errors |
| Integration | Output file is written to `knowledge/reports/{ws}/graph.html` |
| Manual | Open file in Chromium: nodes visible, no browser console errors |
| Manual | Click a node: detail panel shows label, kind, source_file |
| Manual | Uncheck a node kind in toolbar: nodes of that kind disappear |
| Manual | Type in search box: matching nodes highlighted |
| Platform | `npm run typecheck` zero errors |

## Fixtures

```typescript
const minimalNodes: GraphNode[] = [
  { id: 'n1', label: 'OrdersController', kind: 'csharp_controller_action',
    confidence_band: 'AUTHORITATIVE', workspace_id: 'ws', project_id: 'p' },
];
const minimalEdges: GraphEdge[] = [];
```

## Commands

```bash
npm run typecheck
npm test
crg export --format html --workspace b2g
open knowledge/reports/b2g/graph.html   # macOS
# or: start knowledge/reports/b2g/graph.html  # Windows
```

## Acceptance Evidence

Pending implementation:

- All 4 unit cases pass
- Integration: file exists at expected path
- Manual: 3 browser interaction tests pass (render, click, filter)
- No `<script>` injection vulnerability for labels containing HTML special chars
