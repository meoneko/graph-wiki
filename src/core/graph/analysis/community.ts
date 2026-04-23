import type { GraphEdge, GraphNode } from '../../types.js';

export interface Community {
  id: string;
  label: string;
  nodeIds: string[];
  cohesion: number;
  couplingWarnings: Array<{ targetCommunityId: string; edgeCount: number }>;
}

export function detectCommunities(nodes: GraphNode[], edges: GraphEdge[], _resolution = 1.0): Community[] {
  const byDomain = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const key = node.domain ?? 'default';
    const arr = byDomain.get(key) ?? [];
    arr.push(node);
    byDomain.set(key, arr);
  }

  const communities: Community[] = [];
  let i = 0;
  for (const [domain, members] of byDomain.entries()) {
    const memberIds = new Set(members.map((m) => m.id));
    const internal = edges.filter((e) => memberIds.has(e.from_id) && memberIds.has(e.to_id)).length;
    const possible = Math.max(1, members.length * (members.length - 1));
    communities.push({
      id: `community_${i++}`,
      label: `${domain}:${dominantType(members)}`,
      nodeIds: [...memberIds],
      cohesion: Number((internal / possible).toFixed(3)),
      couplingWarnings: [],
    });
  }
  return communities;
}

function dominantType(nodes: GraphNode[]): string {
  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
}

export function labelCommunity(community: Community): string {
  return community.label;
}

export function generateArchitectureOverview(communities: Community[]): string {
  const mermaid = [
    '```mermaid',
    'graph LR',
    ...communities.map((c) => `  ${c.id}["${c.label}"]`),
    '```',
  ].join('\n');

  return [
    '# Architecture Overview',
    '',
    ...communities.map((c) => `- ${c.label} (nodes=${c.nodeIds.length}, cohesion=${c.cohesion})`),
    '',
    mermaid,
  ].join('\n');
}
