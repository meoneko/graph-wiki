# Design

## Domain Model

New exporter: `src/export/html.ts` — `exportHtml(nodes, edges): string`

Returns a single HTML string (no file system operations — CLI writes the string to disk).

No new graph types or DB changes.

## Application Flow

1. `crg export --format html` resolves workspace, loads `TrustAwareQueryEngine.getVisibleGraph()`.
2. Passes `{ nodes, edges }` to `exportHtml()`.
3. `exportHtml()` serializes nodes and edges as embedded JSON, injects into HTML template
   with D3.js loaded from a bundled inline script (no CDN dependency for offline use).
4. CLI writes the returned string to `--output` path (default:
   `knowledge/reports/{workspace}/graph.html`).

## Generated HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>Graph: {workspace}</title>
  <style>/* inline CSS for layout, panels, toolbar */</style>
</head>
<body>
  <div id="toolbar"><!-- filter checkboxes, search --></div>
  <svg id="graph"></svg>
  <div id="panel"><!-- node detail panel --></div>
  <script>
    const GRAPH_DATA = { nodes: [...], edges: [...] };
    /* D3.js v7 bundled inline (~250KB minified) */
    /* visualization initialization */
  </script>
</body>
</html>
```

Node data shape for D3:

```typescript
interface D3Node {
  id: string;
  label: string;
  kind: string;
  confidence_band: string;
  source_file?: string;
  project_id: string;
}

interface D3Edge {
  source: string;   // node id
  target: string;   // node id
  type: string;
  graph_kind: string;
}
```

## D3 Visualization Details

- `d3.forceSimulation` with `forceManyBody`, `forceLink`, `forceCenter`
- Node radius: 6px default; entrypoint nodes: 10px
- Edge stroke: 1px, opacity 0.4; derived edges dashed
- Color palette keyed by `confidence_band`
- On click: populate `#panel` div with node metadata table
- Filter toolbar: `<input type="checkbox">` per node kind; toggle node/edge visibility
- Search: `<input>` that highlights matching nodes with a yellow ring

## Interface Contract

`src/export/html.ts`:

```typescript
export function exportHtml(nodes: GraphNode[], edges: GraphEdge[], workspaceId: string): string
```

`src/cli/index.ts` — add `'html'` to the format switch in the `export` command.

## Data Model

No DB changes. Static snapshot of current visible graph.

## UI / Platform Impact

Self-contained HTML file. Works in any modern browser. File size expected 300–600KB for
a typical 500-node workspace (D3 bundle ~250KB + graph data).

## Observability

`crg export --format html` prints output file path on success.

## Alternatives Considered

1. **CDN-hosted D3** — rejected. Requires internet access to open the file. Inline bundle
   ensures offline use.

2. **Cytoscape.js instead of D3** — similar capability. D3 chosen because it is already
   commonly understood and the force layout is more appropriate for code graphs than
   Cytoscape's hierarchical defaults.

3. **Vite-built SPA with live reload** — rejected for initial version. A SPA requires a
   build step and local server. Self-contained HTML is simpler to distribute.
