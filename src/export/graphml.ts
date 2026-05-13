import type { GraphEdge, GraphNode } from '../core/types.js';

export function exportGraphML(nodes: GraphNode[], edges: GraphEdge[]): string {
  const xmlNodes = nodes.map((n) => `<node id="${escapeXml(n.id)}"><data key="label">${escapeXml(n.label)}</data></node>`).join('');
  const xmlEdges = edges.map((e) => `<edge id="${escapeXml(e.id)}" source="${escapeXml(e.from_id)}" target="${escapeXml(e.to_id)}"><data key="type">${escapeXml(e.type)}</data></edge>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><graphml><graph edgedefault="directed">${xmlNodes}${xmlEdges}</graph></graphml>`;
}

function escapeXml(input: string): string {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
