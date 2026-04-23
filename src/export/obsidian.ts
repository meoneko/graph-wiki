import type { GraphNode, GraphEdge } from '../core/types.js';

export interface ObsidianFile {
  path: string;
  content: string;
}

export function exportObsidian(nodes: GraphNode[], edges: GraphEdge[]): ObsidianFile[] {
  const outbound = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const arr = outbound.get(edge.from_id) ?? [];
    arr.push(edge);
    outbound.set(edge.from_id, arr);
  }

  return nodes.map((node) => {
    const links = (outbound.get(node.id) ?? []).map((e) => `- [[${e.to_id}]] (${e.type})`).join('\n');
    return {
      path: `${node.id}.md`,
      content: `# ${node.label}\n\nType: ${node.type}\n\n## Outbound\n${links}`,
    };
  });
}
