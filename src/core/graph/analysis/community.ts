import type { GraphEdge, GraphNode } from '../../types.js';

export interface Community {
  id: string;
  label: string;
  nodeIds: string[];
  cohesion: number;
  couplingWarnings: Array<{ targetCommunityId: string; edgeCount: number }>;
}

export interface PartitionOptions {
  maxCommunitySize: number; // default: 50
  fallbackStrategy: 'folder_structure' | 'namespace';
}

export interface SplitCommunity {
  id: string;
  parentCommunityId?: string;
  nodeIds: string[];
  cohesionScore: number;
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

// ─── Community Splitting via Edge-Betweenness Centrality ───────────────────────

/**
 * Splits oversized communities into smaller sub-communities using edge-betweenness
 * centrality. Communities within the size limit are passed through unchanged.
 *
 * Algorithm:
 * 1. For each oversized community, compute edge-betweenness centrality
 * 2. Remove the edge with highest betweenness
 * 3. Check if the community has split into disconnected components
 * 4. Repeat until all sub-communities are within the size limit
 * 5. If edge-betweenness fails to produce small-enough groups, apply folder-structure fallback
 */
export function splitOversizedCommunities(
  communities: Community[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: PartitionOptions,
): SplitCommunity[] {
  const maxSize = options.maxCommunitySize;
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const results: SplitCommunity[] = [];
  let splitCounter = 0;

  for (const community of communities) {
    if (community.nodeIds.length <= maxSize) {
      // Community is within size limit — pass through as-is
      results.push({
        id: community.id,
        parentCommunityId: undefined,
        nodeIds: [...community.nodeIds],
        cohesionScore: computeCohesionScore(community.nodeIds, edges),
      });
      continue;
    }

    // Community exceeds maxCommunitySize — apply edge-betweenness splitting
    const subCommunities = edgeBetweennessSplit(
      community.nodeIds,
      edges,
      maxSize,
    );

    // Check if any sub-community still exceeds the limit
    const finalSubs: string[][] = [];
    for (const sub of subCommunities) {
      if (sub.length <= maxSize) {
        finalSubs.push(sub);
      } else {
        // Fallback: split by folder structure
        const folderGroups = applyFolderFallback(sub, nodeMap);
        finalSubs.push(...folderGroups);
      }
    }

    for (const subNodeIds of finalSubs) {
      results.push({
        id: `${community.id}_split_${splitCounter++}`,
        parentCommunityId: community.id,
        nodeIds: subNodeIds,
        cohesionScore: computeCohesionScore(subNodeIds, edges),
      });
    }
  }

  return results;
}

/**
 * Computes cohesion score as the ratio of internal edges to total possible edges (density).
 * For a sub-community with n nodes, max possible directed edges = n * (n - 1).
 */
function computeCohesionScore(nodeIds: string[], edges: GraphEdge[]): number {
  const n = nodeIds.length;
  if (n <= 1) return 1.0;

  const nodeSet = new Set(nodeIds);
  const internalEdges = edges.filter(
    (e) => nodeSet.has(e.from_id) && nodeSet.has(e.to_id),
  ).length;
  const possibleEdges = n * (n - 1);

  return Number((internalEdges / possibleEdges).toFixed(4));
}

/**
 * Edge-betweenness centrality splitting algorithm.
 * Iteratively removes the edge with highest betweenness until the graph
 * splits into components that are all within the size limit.
 */
function edgeBetweennessSplit(
  nodeIds: string[],
  allEdges: GraphEdge[],
  maxSize: number,
): string[][] {
  const nodeSet = new Set(nodeIds);

  // Build working edge list (only edges internal to this community)
  let workingEdges = allEdges.filter(
    (e) => nodeSet.has(e.from_id) && nodeSet.has(e.to_id),
  );

  // If no edges, each node is its own component — return as single group
  if (workingEdges.length === 0) {
    return [nodeIds];
  }

  // Iteratively remove highest-betweenness edge until we get small-enough components
  const maxIterations = workingEdges.length; // Safety bound
  for (let iter = 0; iter < maxIterations; iter++) {
    const components = findConnectedComponents(nodeIds, workingEdges);

    // Check if all components are within size limit
    if (components.every((c) => c.length <= maxSize)) {
      return components;
    }

    // Find the edge with highest betweenness among oversized components
    const oversized = components.filter((c) => c.length > maxSize);
    const oversizedNodes = new Set(oversized.flat());
    const oversizedEdges = workingEdges.filter(
      (e) => oversizedNodes.has(e.from_id) && oversizedNodes.has(e.to_id),
    );

    if (oversizedEdges.length === 0) {
      // No more edges to remove — return current components
      return components;
    }

    const betweenness = computeEdgeBetweenness(
      [...oversizedNodes],
      oversizedEdges,
    );

    // Find edge with max betweenness
    let maxBetweenness = -1;
    let maxEdgeId: string | null = null;
    for (const [edgeId, score] of betweenness.entries()) {
      if (score > maxBetweenness) {
        maxBetweenness = score;
        maxEdgeId = edgeId;
      }
    }

    if (maxEdgeId === null) {
      // No betweenness computed — return current components
      return components;
    }

    // Remove the highest-betweenness edge
    workingEdges = workingEdges.filter((e) => e.id !== maxEdgeId);
  }

  // Fallback: return whatever components we have
  return findConnectedComponents(nodeIds, workingEdges);
}

/**
 * Computes edge-betweenness centrality for all edges in the subgraph.
 * Uses BFS-based shortest path counting (Brandes-like approach).
 * Betweenness of an edge = number of shortest paths that pass through it.
 *
 * Complexity: O(V * E) per call — only applied to oversized communities.
 */
function computeEdgeBetweenness(
  nodeIds: string[],
  edges: GraphEdge[],
): Map<string, number> {
  const betweenness = new Map<string, number>();
  for (const e of edges) betweenness.set(e.id, 0);

  // Build adjacency list (undirected for betweenness calculation)
  const adj = new Map<string, Array<{ neighbor: string; edgeId: string }>>();
  for (const nid of nodeIds) adj.set(nid, []);

  for (const e of edges) {
    adj.get(e.from_id)?.push({ neighbor: e.to_id, edgeId: e.id });
    adj.get(e.to_id)?.push({ neighbor: e.from_id, edgeId: e.id });
  }

  // For each source node, run BFS and accumulate edge betweenness
  for (const source of nodeIds) {
    // BFS from source
    const dist = new Map<string, number>();
    const sigma = new Map<string, number>(); // number of shortest paths
    const pred = new Map<string, Array<{ node: string; edgeId: string }>>();
    const stack: string[] = [];

    for (const nid of nodeIds) {
      dist.set(nid, -1);
      sigma.set(nid, 0);
      pred.set(nid, []);
    }

    dist.set(source, 0);
    sigma.set(source, 1);
    const queue: string[] = [source];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const dv = dist.get(v)!;

      for (const { neighbor: w, edgeId } of adj.get(v) ?? []) {
        const dw = dist.get(w)!;
        if (dw === -1) {
          // First visit
          dist.set(w, dv + 1);
          queue.push(w);
          sigma.set(w, sigma.get(v)!);
          pred.get(w)!.push({ node: v, edgeId });
        } else if (dw === dv + 1) {
          // Another shortest path
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push({ node: v, edgeId });
        }
      }
    }

    // Back-propagation of dependencies
    const delta = new Map<string, number>();
    for (const nid of nodeIds) delta.set(nid, 0);

    while (stack.length > 0) {
      const w = stack.pop()!;
      const sigmaW = sigma.get(w)!;

      for (const { node: v, edgeId } of pred.get(w)!) {
        const sigmaV = sigma.get(v)!;
        const contribution = (sigmaV / sigmaW) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);

        // Accumulate edge betweenness
        betweenness.set(
          edgeId,
          (betweenness.get(edgeId) ?? 0) + contribution,
        );
      }
    }
  }

  return betweenness;
}

/**
 * Finds connected components in an undirected graph using BFS.
 */
function findConnectedComponents(
  nodeIds: string[],
  edges: GraphEdge[],
): string[][] {
  const adj = new Map<string, Set<string>>();
  for (const nid of nodeIds) adj.set(nid, new Set());

  for (const e of edges) {
    if (adj.has(e.from_id) && adj.has(e.to_id)) {
      adj.get(e.from_id)!.add(e.to_id);
      adj.get(e.to_id)!.add(e.from_id);
    }
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const nid of nodeIds) {
    if (visited.has(nid)) continue;

    const component: string[] = [];
    const queue: string[] = [nid];
    visited.add(nid);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

/**
 * Extracts the folder path (first 2 levels) from a node's source_file for fallback grouping.
 */
export function getPathFallbackCommunity(node: GraphNode): string {
  const sourceFile = node.source_file;
  if (!sourceFile) return 'unknown';

  // Normalize path separators
  const normalized = sourceFile.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);

  // Take first 2 meaningful path levels (skip common prefixes like 'src')
  const meaningful = parts.slice(0, Math.min(2, parts.length));
  return meaningful.join('/') || 'unknown';
}

/**
 * Applies folder-structure-based fallback grouping to a set of node IDs.
 * Groups nodes by the first 2 levels of their source_file path.
 */
function applyFolderFallback(
  nodeIds: string[],
  nodeMap: Map<string, GraphNode>,
): string[][] {
  const groups = new Map<string, string[]>();

  for (const nid of nodeIds) {
    const node = nodeMap.get(nid);
    const folder = node ? getPathFallbackCommunity(node) : 'unknown';
    const arr = groups.get(folder) ?? [];
    arr.push(nid);
    groups.set(folder, arr);
  }

  return [...groups.values()];
}
