import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { computeFlows, minimalContext, withDerivedDomains } from '../../core/flows.js';
import { registerTool } from './runtime.js';
import { detectCommunities } from '../../core/graph/analysis/community.js';
import type { GraphEdge, GraphNode, QueryMode } from '../../core/types.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { insufficientEvidence, okResult } from './results.js';

const QueryModeSchema = z.enum(['authoritative', 'mixed_safe', 'exploratory']).default('mixed_safe');

function projectNodes(nodes: GraphNode[], projectId?: string): GraphNode[] {
  return projectId ? nodes.filter((node) => node.project === projectId) : nodes;
}

function projectEdges(edges: GraphEdge[], nodes: GraphNode[]): GraphEdge[] {
  const ids = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => ids.has(edge.from_id) && ids.has(edge.to_id));
}

function comparablePath(value: string | undefined): string {
  return (value ?? '').replace(/\\/g, '/').toLowerCase();
}

function nodeMatchesTarget(node: GraphNode, targets: string[]): boolean {
  const nodeId = node.id.toLowerCase();
  const source = comparablePath(node.source_file);
  const symbol = (node.symbol ?? '').toLowerCase();
  const label = node.label.toLowerCase();
  return targets.some((target) => {
    const raw = target.toLowerCase();
    const pathTarget = comparablePath(target);
    return (
      nodeId === raw ||
      symbol === raw ||
      label === raw ||
      source === pathTarget ||
      source.endsWith(pathTarget) ||
      pathTarget.endsWith(source) ||
      source.includes(pathTarget)
    );
  });
}

function toPanelNode(node: GraphNode): Record<string, unknown> {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    project: node.project,
    source_file: node.source_file,
    symbol: node.symbol,
  };
}

function toPanelEdge(edge: GraphEdge): Record<string, unknown> {
  return {
    id: edge.id,
    from_id: edge.from_id,
    to_id: edge.to_id,
    type: edge.type,
    graph_kind: edge.graph_kind,
  };
}

function traceLane(
  startId: string,
  direction: 'upstream' | 'downstream',
  nodesById: Map<string, GraphNode>,
  edges: GraphEdge[],
  maxDepth: number,
  maxNodes: number,
): { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[]; depthReached: number; truncated: boolean } {
  const selectedNodes = new Map<string, GraphNode>();
  const selectedEdges = new Map<string, GraphEdge>();
  const visited = new Set<string>([startId]);
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startId, depth: 0 }];
  let depthReached = 0;
  let truncated = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    depthReached = Math.max(depthReached, current.depth);
    if (current.depth >= maxDepth) continue;

    const nextEdges = edges.filter((edge) =>
      direction === 'upstream' ? edge.to_id === current.nodeId : edge.from_id === current.nodeId,
    );
    for (const edge of nextEdges) {
      const nextId = direction === 'upstream' ? edge.from_id : edge.to_id;
      const nextNode = nodesById.get(nextId);
      if (!nextNode) continue;
      selectedEdges.set(edge.id, edge);
      selectedNodes.set(nextNode.id, nextNode);
      if (selectedNodes.size >= maxNodes) {
        truncated = true;
        break;
      }
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push({ nodeId: nextId, depth: current.depth + 1 });
      }
    }
    if (truncated) break;
  }

  return {
    nodes: [...selectedNodes.values()].map(toPanelNode),
    edges: [...selectedEdges.values()].map(toPanelEdge),
    depthReached,
    truncated,
  };
}

async function visibleGraph(workspaceId: string, caller: 'mcp.flows.list_flows' | 'mcp.flows.get_flow' | 'mcp.flows.get_affected_flows' | 'mcp.flows.get_minimal_context' | 'mcp.flows.get_lineage', mode: QueryMode = 'mixed_safe', projectId?: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const service = getTrustedQueryService(getDB(resolveDbPath()));
  const operation = OperationResolver.resolve({ caller });
  const graph = await service.engine(workspaceId).getVisibleGraph(operation, mode);
  const nodes = projectNodes(withDerivedDomains(graph.nodes), projectId).filter((node) => node.graph_kind !== 'exploratory');
  return { nodes, edges: projectEdges(graph.edges.filter((edge) => edge.graph_kind !== 'exploratory'), nodes) };
}

async function graphState(workspaceId: string, mode: QueryMode = 'mixed_safe', projectId?: string): Promise<Record<string, unknown>> {
  const { nodes, edges } = await visibleGraph(workspaceId, 'mcp.flows.get_minimal_context', mode, projectId);
  const flows = computeFlows(nodes, edges);
  const communities = detectCommunities(nodes, edges);
  const entrypoints = nodes.filter((node) => node.metadata?.is_entrypoint === true || node.metadata?.entrypoint_class || node.type.includes('endpoint') || node.type.includes('controller'));
  const byKind = nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.graph_kind] = (acc[node.graph_kind] ?? 0) + 1;
    return acc;
  }, {});
  const byTrust = nodes.reduce<Record<string, number>>((acc, node) => {
    const key = node.trust_level ?? node.confidence_band;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    stats: {
      nodes: nodes.length,
      edges: edges.length,
      flows: flows.length,
      communities: communities.length,
      entrypoints: entrypoints.length,
    },
    dimensions: {
      workspaceId,
      projectId,
      byKind,
      byTrust,
    },
  };
}

export function registerFlowTools(): void {
  registerTool({
    name: 'list_flows',
    description: 'List derived business flows for a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        projectId: { type: 'string' },
        limit: { type: 'number' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        limit: z.number().int().positive().optional(),
        mode: QueryModeSchema,
      }).parse(args);
      const { nodes, edges } = await visibleGraph(input.workspaceId, 'mcp.flows.list_flows', input.mode as QueryMode, input.projectId);
      const flows = computeFlows(nodes, edges).slice(0, input.limit ?? 50);
      return okResult({ flows }, ['computed flows from graph data']);
    },
  });

  registerTool({
    name: 'get_flow',
    description: 'Get nodes and edges for a derived business flow',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        flowId: { type: 'string' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId', 'flowId'],
    },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string(), flowId: z.string(), mode: QueryModeSchema }).parse(args);
      const { nodes, edges } = await visibleGraph(input.workspaceId, 'mcp.flows.get_flow', input.mode as QueryMode);
      const flow = computeFlows(nodes, edges).find((f) => f.id === input.flowId || f.domain === input.flowId);
      if (!flow) {
        return insufficientEvidence({ flow: null, nodes: [], edges: [] }, ['flow not found'], ['FLOW_NOT_FOUND']);
      }
      const ids = new Set(flow.nodeIds);
      const flowNodes = nodes.filter((node) => ids.has(node.id));
      const flowEdges = edges.filter((edge) => ids.has(edge.from_id) || ids.has(edge.to_id));
      return okResult({ flow, nodes: flowNodes, edges: flowEdges }, ['loaded flow graph']);
    },
  });

  registerTool({
    name: 'get_affected_flows',
    description: 'Find business flows affected by a specific set of changed files, node IDs, or symbols.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        projectId: { type: 'string' },
        targets: { type: 'array', items: { type: 'string' } },
        changedFiles: { type: 'array', items: { type: 'string' } },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        targets: z.array(z.string()).optional(),
        changedFiles: z.array(z.string()).optional(),
        mode: QueryModeSchema,
      }).parse(args);
      const targets = [...(input.targets ?? []), ...(input.changedFiles ?? [])].filter((target) => target.length > 0);
      if (targets.length === 0) {
        return insufficientEvidence({ flows: [], matchedNodes: [], unmatchedInputs: [] }, ['no targets provided'], ['NO_TARGETS']);
      }

      const { nodes, edges } = await visibleGraph(input.workspaceId, 'mcp.flows.get_affected_flows', input.mode as QueryMode, input.projectId);
      const matchedNodes = nodes.filter((node) => nodeMatchesTarget(node, targets));
      const matchedIds = new Set(matchedNodes.map((node) => node.id));
      const unmatchedInputs = targets.filter((target) => !matchedNodes.some((node) => nodeMatchesTarget(node, [target])));
      const flows = computeFlows(nodes, edges)
        .map((flow) => {
          const memberIds = new Set(flow.nodeIds);
          const matchedNodeCount = [...matchedIds].filter((id) => memberIds.has(id)).length;
          const flowEdges = edges.filter((edge) => memberIds.has(edge.from_id) || memberIds.has(edge.to_id));
          const projects = [...new Set(nodes.filter((node) => memberIds.has(node.id)).map((node) => node.project))].sort();
          return {
            ...flow,
            nodeCount: flow.nodeIds.length,
            edgeCount: flowEdges.length,
            matchedNodeCount,
            projects,
            criticality: matchedNodeCount * 10 + Math.min(100, flow.nodeIds.length),
          };
        })
        .filter((flow) => flow.matchedNodeCount > 0)
        .sort((a, b) => b.criticality - a.criticality || b.nodeCount - a.nodeCount);

      const status = matchedNodes.length > 0 ? 'OK' : 'INSUFFICIENT_EVIDENCE';
      const data = {
        flows,
        matchedNodes: matchedNodes.map(toPanelNode),
        unmatchedInputs,
      };
      return status === 'OK'
        ? okResult(data, ['matched affected graph nodes'])
        : insufficientEvidence(data, ['no graph nodes matched targets'], ['NO_MATCHING_NODES']);
    },
  });

  registerTool({
    name: 'get_minimal_context',
    description: 'Return graph state when targets are omitted, or a bounded canonical/derived context subgraph around targets.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        projectId: { type: 'string' },
        targets: { type: 'array', items: { type: 'string' } },
        depth: { type: 'number' },
        cap: { type: 'number' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        targets: z.array(z.string()).optional(),
        depth: z.number().int().positive().default(2),
        cap: z.number().int().positive().default(50),
        mode: QueryModeSchema,
      }).parse(args);
      if (!input.targets || input.targets.length === 0) {
        return okResult(await graphState(input.workspaceId, input.mode as QueryMode, input.projectId), ['loaded graph state summary']);
      }
      const { nodes, edges } = await visibleGraph(input.workspaceId, 'mcp.flows.get_minimal_context', input.mode as QueryMode, input.projectId);
      const context = minimalContext(nodes, edges, input.targets, input.depth, input.cap);
      return okResult({ ...context, context }, ['loaded minimal context for targets']);
    },
  });

  registerTool({
    name: 'get_lineage',
    description: 'Trace upstream and downstream graph neighbors for a node.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        nodeId: { type: 'string' },
        direction: { type: 'string', enum: ['upstream', 'downstream', 'both'] },
        maxDepth: { type: 'number' },
        maxNodes: { type: 'number' },
        mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
      },
      required: ['workspaceId', 'nodeId'],
    },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        nodeId: z.string(),
        direction: z.enum(['upstream', 'downstream', 'both']).default('both'),
        maxDepth: z.number().int().positive().default(5),
        maxNodes: z.number().int().positive().default(100),
        mode: QueryModeSchema,
      }).parse(args);
      const { nodes, edges } = await visibleGraph(input.workspaceId, 'mcp.flows.get_lineage', input.mode as QueryMode);
      const nodesById = new Map(nodes.map((node) => [node.id, node]));
      const target = nodesById.get(input.nodeId);
      if (!target) {
        return insufficientEvidence({ target: undefined, upstream: undefined, downstream: undefined, factorCodes: [] }, ['node not found'], ['NODE_NOT_FOUND']);
      }
      const upstream = input.direction === 'downstream'
        ? { nodes: [], edges: [], depthReached: 0, truncated: false }
        : traceLane(input.nodeId, 'upstream', nodesById, edges, input.maxDepth, input.maxNodes);
      const downstream = input.direction === 'upstream'
        ? { nodes: [], edges: [], depthReached: 0, truncated: false }
        : traceLane(input.nodeId, 'downstream', nodesById, edges, input.maxDepth, input.maxNodes);
      const factorCodes = upstream.truncated || downstream.truncated ? ['LINEAGE_TRUNCATED'] : [];
      return okResult({
        target: toPanelNode(target),
        upstream,
        downstream,
        factorCodes,
      }, ['lineage traced from visible graph']);
    },
  });
}
