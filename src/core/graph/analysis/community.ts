import path from 'node:path';
import type { GraphEdge, GraphNode } from '../../types.js';

export interface Community {
  id: string;
  label: string;
  nodeIds: string[];
  cohesion: number;
  couplingWarnings: Array<{ targetCommunityId: string; edgeCount: number }>;
}

const EDGE_WEIGHTS: Record<string, number> = {
  calls: 1.0,
  imports: 0.6,
  inherits: 0.8,
  implements: 0.8,
  contains: 0.3,
};

export function detectCommunities(nodes: GraphNode[], edges: GraphEdge[], _resolution = 1.0): Community[] {
  const byDirectory = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const key = directoryKey(node);
    const arr = byDirectory.get(key) ?? [];
    arr.push(node);
    byDirectory.set(key, arr);
  }

  const communities: Community[] = [];
  let i = 0;
  for (const [directory, members] of byDirectory.entries()) {
    const memberIds = new Set(members.map((m) => m.id));
    const { cohesion, couplingWarnings } = computeCohesion(memberIds, edges, byDirectory, nodes);
    communities.push({
      id: `community_${i++}`,
      label: `${directory}:${dominantType(members)}`,
      nodeIds: [...memberIds],
      cohesion,
      couplingWarnings,
    });
  }
  return communities.sort((a, b) => b.nodeIds.length - a.nodeIds.length);
}

function directoryKey(node: GraphNode): string {
  const file = node.source_file?.replace(/\\/g, '/') ?? '';
  if (!file) return 'root';
  const dir = path.dirname(file).replace(/\\/g, '/');
  return dir && dir !== '.' ? dir : 'root';
}

function computeCohesion(
  memberIds: Set<string>,
  edges: GraphEdge[],
  byDirectory: Map<string, GraphNode[]>,
  allNodes: GraphNode[],
): { cohesion: number; couplingWarnings: Array<{ targetCommunityId: string; edgeCount: number }> } {
  const nodeToDirectory = new Map<string, string>();
  for (const [directory, members] of byDirectory.entries()) {
    for (const member of members) nodeToDirectory.set(member.id, directory);
  }

  let internalWeight = 0;
  let touchingWeight = 0;
  const outgoingByDirectory = new Map<string, number>();

  for (const edge of edges) {
    const weight = EDGE_WEIGHTS[edge.type];
    if (!weight) continue;
    const fromInside = memberIds.has(edge.from_id);
    const toInside = memberIds.has(edge.to_id);
    if (!fromInside && !toInside) continue;

    touchingWeight += weight;
    if (fromInside && toInside) {
      internalWeight += weight;
    } else if (fromInside && !toInside) {
      const targetDirectory = nodeToDirectory.get(edge.to_id) ?? 'external';
      outgoingByDirectory.set(targetDirectory, (outgoingByDirectory.get(targetDirectory) ?? 0) + 1);
    }
  }

  const couplingWarnings = [...outgoingByDirectory.entries()]
    .map(([targetCommunityId, edgeCount]) => ({ targetCommunityId, edgeCount }))
    .sort((a, b) => b.edgeCount - a.edgeCount)
    .slice(0, 5);

  const isolatedBonus = allNodes.length > 0 && touchingWeight === 0 ? 0 : undefined;
  const cohesion = touchingWeight === 0
    ? (isolatedBonus ?? 0)
    : Number((internalWeight / touchingWeight).toFixed(3));
  return { cohesion, couplingWarnings };
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
