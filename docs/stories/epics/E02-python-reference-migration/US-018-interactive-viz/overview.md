# Overview

## Current Behavior

`crg export` produces static graph files in GraphML, Obsidian, or Neo4j Cypher formats.
These are useful for import into external tools but require additional software to
visualize. There is no way to open an interactive, self-contained graph exploration UI
from the CLI alone.

## Target Behavior

`crg export --format html [--workspace <id>] [--output <path>]` produces a single
self-contained HTML file embedding the graph data and a D3.js force-directed layout.
The HTML file can be opened in any browser with no server required.

Features of the interactive viewer:
- Force-directed layout with draggable nodes
- Click a node to show its metadata panel (kind, label, source_file, lang_meta)
- Color coding by `confidence_band` (AUTHORITATIVE=blue, EXTRACTED=green, INFERRED=amber, AMBIGUOUS=red)
- Filter toolbar: hide/show node kinds and edge types
- Search box: highlight matching nodes by label
- Export current view as PNG (via browser canvas)

## Affected Users

- Developers who want a quick visual overview of a workspace graph without installing
  Gephi, Neo4j Browser, or Obsidian
- Teams presenting graph structure in documentation or code reviews

## Affected Product Docs

- `README.md` — add `--format html` to the export section

## Non-Goals

- No server-side rendering (self-contained file only)
- No real-time updates (static snapshot at export time)
- No edge label rendering (deferred — clutters small graphs)
- No iframe embedding API
