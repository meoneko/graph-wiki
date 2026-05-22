import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GraphEdge, GraphNode } from '../core/types.js';

/**
 * D3-compatible node representation for the interactive visualization.
 */
interface D3Node {
  id: string;
  label: string;
  kind: string;
  confidence_band: string;
  source_file?: string;
  project_id: string;
}

/**
 * D3-compatible edge representation for the interactive visualization.
 */
interface D3Edge {
  source: string;
  target: string;
  type: string;
  graph_kind: string;
}

// Resolve asset paths relative to this module
const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, 'assets');

// Read assets at module load time (avoids repeated I/O)
const d3Bundle = readFileSync(join(assetsDir, 'd3.min.js'), 'utf-8');
const htmlTemplate = readFileSync(join(assetsDir, 'template.html'), 'utf-8');

/**
 * Produces a self-contained HTML file with an embedded D3.js force-directed
 * graph visualization. The output works offline with no CDN dependencies.
 *
 * @param nodes - Graph nodes to visualize
 * @param edges - Graph edges to visualize
 * @param workspaceId - Workspace identifier shown in the page title
 * @returns Complete HTML string ready to be written to disk
 */
export function exportHtml(nodes: GraphNode[], edges: GraphEdge[], workspaceId: string): string {
  // Map internal types to D3-friendly structures
  const d3Nodes: D3Node[] = nodes.map((n) => ({
    id: n.id,
    label: n.label,
    kind: n.type,
    confidence_band: n.confidence_band,
    source_file: n.source_file,
    project_id: n.project,
  }));

  const d3Edges: D3Edge[] = edges.map((e) => ({
    source: e.from_id,
    target: e.to_id,
    type: e.type,
    graph_kind: e.graph_kind,
  }));

  // Serialize graph data and escape </script> to prevent injection
  const graphJson = JSON.stringify({ nodes: d3Nodes, edges: d3Edges });
  const safeGraphJson = graphJson.split('</script>').join('<\\/script>');

  // Replace tokens in template
  let html = htmlTemplate;
  html = html.split('__D3_BUNDLE__').join(d3Bundle);
  html = html.split('__GRAPH_DATA__').join(safeGraphJson);
  html = html.split('__WORKSPACE__').join(workspaceId);

  return html;
}
