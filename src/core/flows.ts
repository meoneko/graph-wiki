import type { GraphEdge, GraphNode } from './types.js';
import { EdgeType } from './types.js';

export interface FlowSummary {
  id: string;
  name: string;
  domain: string;
  nodeIds: string[];
  edgeIds: string[];
  trust: Record<string, number>;
}

function deriveDomain(node: GraphNode): string {
  if (node.domain) return node.domain;
  const fromMetadata = node.metadata?.derived_domain ?? node.metadata?.domain;
  if (typeof fromMetadata === 'string' && fromMetadata.length > 0) return fromMetadata;
  const source = (node.source_file ?? '').replace(/\\/g, '/').toLowerCase();
  const parts = source.split('/').filter(Boolean);
  const srcIndex = Math.max(parts.lastIndexOf('src'), parts.lastIndexOf('source'));
  if (srcIndex >= 0 && parts[srcIndex + 1]) return parts[srcIndex + 1]!;
  if (parts.length >= 2) return parts[parts.length - 2]!;
  const symbol = (node.symbol ?? node.label).toLowerCase();
  const match = symbol.match(/(auth|user|course|lesson|order|payment|admin|student|teacher|report|notification)/);
  return match?.[1] ?? 'unknown';
}

export function withDerivedDomains(nodes: GraphNode[]): GraphNode[] {
  return nodes.map((node) => {
    if (node.metadata?.derived_domain || node.domain) return node;
    return {
      ...node,
      metadata: {
        ...(node.metadata ?? {}),
        derived_domain: deriveDomain(node),
      },
    };
  });
}

export function computeFlows(nodes: GraphNode[], edges: GraphEdge[]): FlowSummary[] {
  const nodesByDomain = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const domain = deriveDomain(node);
    const bucket = nodesByDomain.get(domain) ?? [];
    bucket.push(node);
    nodesByDomain.set(domain, bucket);
  }
  return [...nodesByDomain.entries()]
    .map(([domain, domainNodes]) => {
      const nodeIds = new Set(domainNodes.map((node) => node.id));
      const flowEdges = edges.filter((edge) => nodeIds.has(edge.from_id) || nodeIds.has(edge.to_id));
      const trust: Record<string, number> = {};
      for (const node of domainNodes) {
        const key = node.trust_level ?? node.confidence_band;
        trust[key] = (trust[key] ?? 0) + 1;
      }
      return {
        id: `flow:${domain}`,
        name: `${domain} flow`,
        domain,
        nodeIds: [...nodeIds],
        edgeIds: flowEdges.map((edge) => edge.id),
        trust,
      };
    })
    .sort((a, b) => b.nodeIds.length - a.nodeIds.length);
}

export function affectedFlows(flows: FlowSummary[], nodes: GraphNode[], targets: string[]): Array<FlowSummary & { touchedNodeCount: number }> {
  const targetSet = new Set(targets.map((target) => target.toLowerCase()));
  const touchedNodeIds = new Set(
    nodes
      .filter((node) =>
        targetSet.has(node.id.toLowerCase()) ||
        targetSet.has((node.source_file ?? '').toLowerCase()) ||
        targetSet.has((node.symbol ?? '').toLowerCase()) ||
        [...targetSet].some((target) => (node.source_file ?? '').toLowerCase().includes(target)),
      )
      .map((node) => node.id),
  );
  return flows
    .map((flow) => ({
      ...flow,
      touchedNodeCount: flow.nodeIds.filter((id) => touchedNodeIds.has(id)).length,
    }))
    .filter((flow) => flow.touchedNodeCount > 0)
    .sort((a, b) => b.touchedNodeCount - a.touchedNodeCount || b.nodeIds.length - a.nodeIds.length);
}

export function minimalContext(nodes: GraphNode[], edges: GraphEdge[], targets: string[], depth = 2, cap = 50): { nodes: GraphNode[]; edges: GraphEdge[]; omitted: number; trust: Record<string, number> } {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    if (edge.graph_kind === 'exploratory') continue;
    const fromEdges = adjacency.get(edge.from_id) ?? [];
    fromEdges.push(edge);
    adjacency.set(edge.from_id, fromEdges);
    const toEdges = adjacency.get(edge.to_id) ?? [];
    toEdges.push(edge);
    adjacency.set(edge.to_id, toEdges);
  }
  const start = nodes
    .filter((node) => targets.includes(node.id) || targets.includes(node.source_file ?? '') || targets.includes(node.symbol ?? ''))
    .map((node) => node.id);
  const queue = start.map((id) => ({ id, depth: 0 }));
  const seen = new Set(start);
  const selectedEdges = new Map<string, GraphEdge>();
  while (queue.length > 0 && seen.size < cap) {
    const current = queue.shift()!;
    if (current.depth >= depth) continue;
    for (const edge of adjacency.get(current.id) ?? []) {
      const next = edge.from_id === current.id ? edge.to_id : edge.to_id === current.id ? edge.from_id : undefined;
      if (!next || !byId.has(next)) continue;
      selectedEdges.set(edge.id, edge);
      if (!seen.has(next)) {
        seen.add(next);
        queue.push({ id: next, depth: current.depth + 1 });
      }
      if (seen.size >= cap) break;
    }
  }
  const resultNodes = [...seen].map((id) => byId.get(id)).filter((node): node is GraphNode => Boolean(node));
  const degree = new Map<string, number>();
  for (const edge of selectedEdges.values()) {
    degree.set(edge.from_id, (degree.get(edge.from_id) ?? 0) + 1);
    degree.set(edge.to_id, (degree.get(edge.to_id) ?? 0) + 1);
  }
  resultNodes.sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
  const trust: Record<string, number> = {};
  for (const node of resultNodes) {
    const key = node.trust_level ?? node.confidence_band;
    trust[key] = (trust[key] ?? 0) + 1;
  }
  return {
    nodes: resultNodes,
    edges: [...selectedEdges.values()].filter((edge) => seen.has(edge.from_id) && seen.has(edge.to_id)),
    omitted: Math.max(0, seen.size - resultNodes.length),
    trust,
  };
}

export function flowMembershipEdges(workspaceId: string, flows: FlowSummary[]): GraphEdge[] {
  return flows.flatMap((flow) => flow.nodeIds.map((nodeId) => ({
    id: `edge:${flow.id}:${nodeId}`,
    stableKey: `edge:${flow.id}:${nodeId}`,
    workspace: workspaceId,
    from_id: nodeId,
    to_id: flow.id,
    type: EdgeType.belongs_to_flow,
    graph_kind: 'derived' as const,
    confidence_band: 'INFERRED' as const,
    trust_level: 'DERIVED' as const,
    provenance: {
      source: 'analysis' as const,
      artifact_source: 'flow-derivation',
      producer_stage: 'computeFlows',
      timestamp: new Date().toISOString(),
    },
  })));
}
