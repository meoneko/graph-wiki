import type { GraphEdge, GraphNode } from "../contracts.js";

export interface GraphAnalyticalMetrics {
  hotspots: Array<{ nodeId: string; degree: number }>;
  bridges: Array<{ edgeId: string; fromDomain: string; toDomain: string }>;
  orphans: string[];
  weakZones: Array<{ nodeIds: string[] }>;
}

function getNodeDomain(node: GraphNode): string {
  const metadata = node.metadata ?? {};
  if (typeof metadata.projectId === "string" && metadata.projectId.length > 0) {
    return metadata.projectId;
  }
  if (typeof metadata.domain === "string" && metadata.domain.length > 0) {
    return metadata.domain;
  }
  return node.type;
}

function edgeId(edge: GraphEdge): string {
  return `${edge.from}->${edge.to}:${edge.type}`;
}

export function computeGraphMetrics(graph: { nodes: GraphNode[]; edges: GraphEdge[] }): GraphAnalyticalMetrics {
  const degreeMap = new Map<string, number>();
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  function find(nodeId: string): string {
    const currentParent = parent.get(nodeId) ?? nodeId;
    if (currentParent === nodeId) return nodeId;
    const root = find(currentParent);
    parent.set(nodeId, root);
    return root;
  }

  function union(left: string, right: string): void {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;

    const leftRank = rank.get(leftRoot) ?? 0;
    const rightRank = rank.get(rightRoot) ?? 0;

    if (leftRank < rightRank) {
      parent.set(leftRoot, rightRoot);
      return;
    }
    if (leftRank > rightRank) {
      parent.set(rightRoot, leftRoot);
      return;
    }

    parent.set(rightRoot, leftRoot);
    rank.set(leftRoot, leftRank + 1);
  }

  for (const node of graph.nodes) {
    degreeMap.set(node.id, 0);
    parent.set(node.id, node.id);
    rank.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    degreeMap.set(edge.from, (degreeMap.get(edge.from) ?? 0) + 1);
    degreeMap.set(edge.to, (degreeMap.get(edge.to) ?? 0) + 1);
    if (parent.has(edge.from) && parent.has(edge.to)) {
      union(edge.from, edge.to);
    }
  }

  const hotspots = [...degreeMap.entries()]
    .filter(([, degree]) => degree > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([nodeId, degree]) => ({ nodeId, degree }));

  const bridges = graph.edges
    .map((edge) => {
      const fromNode = nodesById.get(edge.from);
      const toNode = nodesById.get(edge.to);
      if (!fromNode || !toNode) return null;

      const fromDomain = getNodeDomain(fromNode);
      const toDomain = getNodeDomain(toNode);
      if (fromDomain === toDomain) return null;

      return {
        edgeId: edgeId(edge),
        fromDomain,
        toDomain,
      };
    })
    .filter((entry): entry is { edgeId: string; fromDomain: string; toDomain: string } => Boolean(entry))
    .sort((left, right) => left.edgeId.localeCompare(right.edgeId));

  const orphans = [...degreeMap.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([nodeId]) => nodeId)
    .sort();

  const components = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const root = find(node.id);
    const component = components.get(root) ?? [];
    component.push(node.id);
    components.set(root, component);
  }

  return {
    hotspots,
    bridges,
    orphans,
    weakZones: [...components.values()]
      .filter((nodeIds) => nodeIds.length <= 2)
      .map((nodeIds) => ({ nodeIds: nodeIds.sort() }))
      .sort((left, right) => left.nodeIds.join(":").localeCompare(right.nodeIds.join(":"))),
  };
}
