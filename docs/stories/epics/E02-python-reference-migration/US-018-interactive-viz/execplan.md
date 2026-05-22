# Exec Plan

## Goal

Add `crg export --format html` that produces a self-contained interactive graph
visualization HTML file with D3.js force layout.

## Scope

In scope:

- `src/export/html.ts` — `exportHtml()` function
- D3.js v7 bundled inline (download minified bundle, store in `src/export/assets/d3.min.js`)
- Inline CSS for layout and panel
- Visualization: force layout, color by confidence_band, click-to-panel, filter toolbar
- `src/cli/index.ts` — add `'html'` to export format switch, set default output path
- `README.md` — add `--format html` to export section

Out of scope:

- Edge label rendering
- PNG export (deferred — complex without a headless browser)
- Live reload
- Iframe API

## Risk Classification

Risk flags:

- **Medium**: D3 bundle size. Target < 300KB for d3-force + d3-selection + d3-zoom.
  Use a tree-shaken D3 v7 build rather than the full bundle.
- **Low**: HTML injection. `GRAPH_DATA` is JSON-serialized — ensure `</script>` strings
  in node labels are escaped.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- Output HTML must open without errors in Chromium and Firefox

## Work Phases

### Phase 1 — D3 bundle

1. Download D3 v7 tree-shaken build (or build manually with `rollup` using only
   `d3-force`, `d3-selection`, `d3-zoom`, `d3-drag`). Store as
   `src/export/assets/d3.min.js` (~80KB for the minimal subset).
2. `src/export/html.ts` reads the bundle file at module load time and inlines it.

### Phase 2 — HTML template

3. Create `src/export/assets/template.html` with the skeleton (toolbar, svg, panel divs,
   style block). The template uses `__D3_BUNDLE__` and `__GRAPH_DATA__` as replacement
   tokens.

4. `exportHtml(nodes, edges, workspaceId)`:

```typescript
export function exportHtml(nodes: GraphNode[], edges: GraphEdge[], workspaceId: string): string {
  const d3Bundle = fs.readFileSync(new URL('./assets/d3.min.js', import.meta.url), 'utf8');
  const template = fs.readFileSync(new URL('./assets/template.html', import.meta.url), 'utf8');
  const d3Nodes: D3Node[] = nodes.map(n => ({
    id: n.id, label: n.label, kind: n.kind,
    confidence_band: n.confidence_band, source_file: n.source_file, project_id: n.project_id,
  }));
  const d3Edges: D3Edge[] = edges.map(e => ({
    source: e.from_id, target: e.to_id, type: e.type, graph_kind: e.graph_kind,
  }));
  const graphData = JSON.stringify({ nodes: d3Nodes, edges: d3Edges })
    .replace(/<\/script>/gi, '<\\/script>');  // prevent injection
  return template
    .replace('__D3_BUNDLE__', d3Bundle)
    .replace('__GRAPH_DATA__', graphData)
    .replace('__WORKSPACE__', workspaceId);
}
```

### Phase 3 — CLI wiring

5. In `src/cli/index.ts`, add `'html'` to the format switch:

```typescript
else if (format === 'html') exportData = exportHtml(nodes, edges, ws);
```

6. Change default output for HTML to `knowledge/reports/{ws}/graph.html` (write to disk
   directly rather than printing to stdout, since HTML is not useful as stdout).

### Phase 4 — Visualization script (inline JS in template)

7. Write the D3 initialization script inside `template.html`:
   - `d3.forceSimulation()` setup with standard forces
   - SVG `<circle>` nodes + `<line>` edges
   - Color scale: `{ AUTHORITATIVE: '#3B82F6', EXTRACTED: '#22C55E', INFERRED: '#F59E0B', AMBIGUOUS: '#EF4444' }`
   - Click handler: populate `#panel`
   - Filter checkboxes: toggle node/edge visibility
   - Search input: add `.highlighted` class to matching nodes

### Phase 5 — Verification

8. `npm run typecheck` — fix any errors.
9. `npm test` — fix any failures.
10. Run `crg export --format html --workspace b2g`, open the output file in a browser,
    confirm nodes are visible, click works, filter works.

## Stop Conditions

- If D3 tree-shaking is too complex to set up quickly: use the full D3 v7 minified bundle
  (~280KB) from the npm package. Acceptable trade-off for initial implementation.
- If inline `<script>` injection causes CSP issues in some browsers: wrap in a `Blob` URL
  object URL instead.
