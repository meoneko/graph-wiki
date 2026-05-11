import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';
import type { GraphEdge, GraphNode } from '../../core/types.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { getDB } from '../../storage/GraphDB.js';
import { GenerateAgentContextInput, GetSymbolContextInput } from '../schemas/index.js';
import {
  filterNodesByProject,
  getWorkspaceGraph,
  nodeSummary,
} from './graphToolUtils.js';
import { registerTool } from './runtime.js';

function db() {
  return getDB(resolveDbPath());
}

const CALL_EDGE_TYPES = new Set(['calls', 'invokes', 'dispatches_to']);

function isCallEdge(edge: GraphEdge): boolean {
  return CALL_EDGE_TYPES.has(edge.type);
}

function isVisibleInMode(node: GraphNode, mode: string): boolean {
  if (mode === 'authoritative') return node.trust_level === 'AUTHORITATIVE' || node.graph_kind === 'canonical';
  if (mode === 'exploratory') return true;
  return node.graph_kind !== 'external';
}

function roleCounts(nodes: GraphNode[]): Array<{ role: string; count: number }> {
  const counts = new Map<string, number>();
  for (const node of nodes) {
    for (const role of node.roles ?? []) counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([role, count]) => ({ role, count }));
}

function languageCounts(nodes: GraphNode[]): Array<{ name: string; nodeCount: number }> {
  const counts = new Map<string, number>();
  for (const node of nodes) counts.set(node.language, (counts.get(node.language) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, nodeCount]) => ({ name, nodeCount }));
}

function frameworkCounts(nodes: GraphNode[]): Array<{ name: string; nodeCount: number; entrypointCount: number }> {
  const counts = new Map<string, { nodeCount: number; entrypointCount: number }>();
  for (const node of nodes) {
    if (!node.framework) continue;
    const current = counts.get(node.framework) ?? { nodeCount: 0, entrypointCount: 0 };
    current.nodeCount += 1;
    if ((node.roles ?? []).includes('entrypoint')) current.entrypointCount += 1;
    counts.set(node.framework, current);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].nodeCount - a[1].nodeCount)
    .map(([name, value]) => ({ name, ...value }));
}

function flowTouchesProject(flow: { path: string[] }, nodeById: Map<string, GraphNode>, projectId?: string): boolean {
  return !projectId || flow.path.some((id) => nodeById.get(id)?.project === projectId);
}

function communityTouchesProject(community: { nodeIds: string[] }, nodeById: Map<string, GraphNode>, projectId?: string): boolean {
  return !projectId || community.nodeIds.some((id) => nodeById.get(id)?.project === projectId);
}

function resolveSymbolTarget(nodes: GraphNode[], symbol: string): GraphNode | GraphNode[] | undefined {
  const exact = nodes.filter((node) => node.symbol === symbol);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return exact;

  const lower = symbol.toLowerCase();
  const insensitive = nodes.filter((node) => node.symbol?.toLowerCase() === lower);
  if (insensitive.length === 1) return insensitive[0];
  if (insensitive.length > 1) return insensitive;
  return undefined;
}

function agentContextMarkdown(input: {
  workspaceId: string;
  projectId?: string;
  generatedAt: string;
  stats: { nodeCount: number; edgeCount: number; flowCount: number; communityCount: number; entrypointCount: number };
  entrypoints: ReturnType<typeof nodeSummary>[];
  criticalFlows: Array<{ id: number; name: string; criticality: number; nodeCount: number; depth: number }>;
  languages: Array<{ name: string; nodeCount: number }>;
  frameworks: Array<{ name: string; nodeCount: number; entrypointCount: number }>;
  roles: Array<{ role: string; count: number }>;
}): string {
  return [
    `# CRG Agent Context - ${input.projectId ?? input.workspaceId}`,
    '',
    `Generated: ${input.generatedAt}`,
    '',
    '## Summary',
    `- Workspace: ${input.workspaceId}`,
    ...(input.projectId ? [`- Project: ${input.projectId}`] : []),
    `- Nodes: ${input.stats.nodeCount}`,
    `- Edges: ${input.stats.edgeCount}`,
    `- Flows: ${input.stats.flowCount}`,
    `- Communities: ${input.stats.communityCount}`,
    `- Entrypoints: ${input.stats.entrypointCount}`,
    '',
    '## Dimensions',
    `- Languages: ${input.languages.map((item) => `${item.name}=${item.nodeCount}`).join(', ') || 'none'}`,
    `- Frameworks: ${input.frameworks.map((item) => `${item.name}=${item.nodeCount}/${item.entrypointCount} entrypoints`).join(', ') || 'none'}`,
    `- Roles: ${input.roles.map((item) => `${item.role}=${item.count}`).join(', ') || 'none'}`,
    '',
    '## Entrypoints',
    ...input.entrypoints.map((node) => `- ${node.label} (${node.project}${node.framework ? `, ${node.framework}` : ''})${node.source_file ? ` - ${node.source_file}` : ''}`),
    ...(input.entrypoints.length === 0 ? ['- none'] : []),
    '',
    '## Critical Flows',
    ...input.criticalFlows.map((flow) => `- #${flow.id} ${flow.name} - criticality=${flow.criticality}, nodes=${flow.nodeCount}, depth=${flow.depth}`),
    ...(input.criticalFlows.length === 0 ? ['- none'] : []),
    '',
    '## Recommended Tool Workflow',
    '- Start: get_minimal_context',
    '- Locate: search_nodes -> get_node',
    '- Understand impact: get_affected_flows -> get_lineage',
    '- Validate changes: detect_changes or review_diff with full unified diff',
  ].join('\n');
}

function symbolContextNextTools(input: {
  hasFlows: boolean;
  callers: number;
  callees: number;
  isEntrypoint: boolean;
}): Array<{ tool: string; reasonCode: string }> {
  const suggestions: Array<{ tool: string; reasonCode: string }> = [
    { tool: 'get_lineage', reasonCode: 'lineage_available' },
  ];
  if (input.hasFlows) suggestions.push({ tool: 'get_flow', reasonCode: 'flow_membership_found' });
  if (input.callers > 0) suggestions.push({ tool: 'get_callers', reasonCode: 'callers_available' });
  if (input.callees > 0) suggestions.push({ tool: 'get_callees', reasonCode: 'callees_available' });
  if (input.isEntrypoint) suggestions.push({ tool: 'get_affected_flows', reasonCode: 'entrypoint_impact_available' });
  if (input.callers === 0 && input.callees === 0) suggestions.push({ tool: 'search_nodes', reasonCode: 'isolated_symbol_check_search' });
  return suggestions;
}

export function registerAgentTools(): void {
  registerTool({
    name: 'generate_agent_context',
    description: 'Generate read-only markdown and structured graph context for AI-agent bootstrap.',
    inputSchema: GenerateAgentContextInput,
    handler: async (args) => {
      const input = GenerateAgentContextInput.parse(args);
      const store = db();
      const { nodes: allNodes, nodeById, flows: allFlows, communities } = getWorkspaceGraph(store, input.workspaceId);
      const scopedNodes = filterNodesByProject(allNodes, input.projectId).filter((node) => isVisibleInMode(node, input.mode));
      const scopedNodeIds = new Set(scopedNodes.map((node) => node.id));
      const edges = store.getEdgesByWorkspace(input.workspaceId)
        .filter((edge) => scopedNodeIds.has(edge.from_id) || scopedNodeIds.has(edge.to_id));
      const flows = allFlows.filter((flow) =>
        flowTouchesProject(flow, nodeById, input.projectId) &&
        flow.path.some((id) => scopedNodeIds.has(id)));
      const scopedCommunities = communities.filter((community) =>
        communityTouchesProject(community, nodeById, input.projectId) &&
        community.nodeIds.some((id) => scopedNodeIds.has(id)));
      const entrypoints = scopedNodes
        .filter((node) => (node.roles ?? []).includes('entrypoint'))
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, input.maxEntrypoints)
        .map(nodeSummary);
      const criticalFlows = flows
        .slice(0, input.maxFlows)
        .map((flow) => ({
          id: flow.id,
          name: flow.name,
          criticality: flow.criticality,
          nodeCount: flow.nodeCount,
          depth: flow.depth,
        }));
      const dimensions = {
        languages: languageCounts(scopedNodes),
        frameworks: frameworkCounts(scopedNodes),
        roles: roleCounts(scopedNodes),
      };
      const generatedAt = new Date().toISOString();
      const summary = {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        generatedAt,
        nodeCount: scopedNodes.length,
        edgeCount: edges.length,
        flowCount: flows.length,
        communityCount: scopedCommunities.length,
        entrypointCount: scopedNodes.filter((node) => (node.roles ?? []).includes('entrypoint')).length,
      };
      const markdown = agentContextMarkdown({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        generatedAt,
        stats: summary,
        entrypoints,
        criticalFlows,
        ...dimensions,
      });

      return QueryResultFactory.create({
        status: 'OK',
        nodes: [],
        edges: [],
        reasons: ['AGENT_CONTEXT_GENERATED'],
        data: {
          markdown,
          summary,
          sections: { entrypoints, criticalFlows, dimensions },
        },
        metadata: { tool: { name: 'generate_agent_context', workspace: input.workspaceId, project: input.projectId } },
      });
    },
  });

  registerTool({
    name: 'get_symbol_context',
    description: 'Aggregate node, caller/callee, flow, and community context for an exact node or symbol.',
    inputSchema: GetSymbolContextInput,
    handler: async (args) => {
      const input = GetSymbolContextInput.parse(args);
      if (!input.nodeId && !input.symbol) {
        return QueryResultFactory.create({
          status: 'POLICY_VIOLATION',
          nodes: [],
          edges: [],
          reasons: ['SYMBOL_CONTEXT_TARGET_REQUIRED'],
          codes: ['SYMBOL_CONTEXT_TARGET_REQUIRED'],
          metadata: { tool: { name: 'get_symbol_context', workspace: input.workspaceId } },
        });
      }

      const store = db();
      const { nodes: allNodes, nodeById, flows: allFlows, communities: allCommunities } = getWorkspaceGraph(store, input.workspaceId);
      const scopedNodes = filterNodesByProject(allNodes, input.projectId).filter((node) => isVisibleInMode(node, input.mode));
      const target = input.nodeId
        ? scopedNodes.find((node) => node.id === input.nodeId)
        : resolveSymbolTarget(scopedNodes, input.symbol ?? '');

      if (Array.isArray(target)) {
        return QueryResultFactory.create({
          status: 'AMBIGUOUS',
          nodes: [],
          edges: [],
          reasons: ['AMBIGUOUS_SYMBOL'],
          codes: ['AMBIGUOUS_SYMBOL'],
          data: { candidates: target.map(nodeSummary) },
          metadata: { tool: { name: 'get_symbol_context', workspace: input.workspaceId } },
        });
      }
      if (!target) {
        return QueryResultFactory.create({
          status: 'INSUFFICIENT_EVIDENCE',
          nodes: [],
          edges: [],
          reasons: ['SYMBOL_NOT_FOUND'],
          codes: ['SYMBOL_NOT_FOUND'],
          metadata: { tool: { name: 'get_symbol_context', workspace: input.workspaceId } },
        });
      }

      const callerPairs = store.getEdgesTo(target.id)
        .filter((edge) => edge.workspace === input.workspaceId && isCallEdge(edge))
        .map((edge) => ({ edge, node: nodeById.get(edge.from_id) }))
        .filter((item): item is { edge: GraphEdge; node: GraphNode } =>
          Boolean(item.node && (!input.projectId || item.node.project === input.projectId) && isVisibleInMode(item.node, input.mode)))
        .sort((a, b) => a.node.label.localeCompare(b.node.label) || a.node.id.localeCompare(b.node.id))
        .slice(0, input.maxCallers);
      const calleePairs = store.getEdgesFrom(target.id)
        .filter((edge) => edge.workspace === input.workspaceId && isCallEdge(edge))
        .map((edge) => ({ edge, node: nodeById.get(edge.to_id) }))
        .filter((item): item is { edge: GraphEdge; node: GraphNode } =>
          Boolean(item.node && (!input.projectId || item.node.project === input.projectId) && isVisibleInMode(item.node, input.mode)))
        .sort((a, b) => a.node.label.localeCompare(b.node.label) || a.node.id.localeCompare(b.node.id))
        .slice(0, input.maxCallees);
      const callers = callerPairs.map((item) => item.node);
      const callees = calleePairs.map((item) => item.node);
      const flows = allFlows
        .filter((flow) => flowTouchesProject(flow, nodeById, input.projectId) && flow.path.includes(target.id))
        .slice(0, input.maxFlows)
        .map((flow) => ({
          id: flow.id,
          name: flow.name,
          criticality: flow.criticality,
          nodeCount: flow.nodeCount,
          inFlow: true as const,
        }));
      const communities = allCommunities
        .filter((community) => communityTouchesProject(community, nodeById, input.projectId) && community.nodeIds.includes(target.id))
        .map((community) => ({
          id: community.id,
          name: community.name,
          size: community.size,
          cohesion: community.cohesion,
        }));
      const isEntrypoint = (target.roles ?? []).includes('entrypoint');
      const factorCodes: Array<{ code: string; value?: number | string }> = [];
      if (isEntrypoint) factorCodes.push({ code: 'ENTRYPOINT_SYMBOL' });
      if (callers.length === 0) factorCodes.push({ code: 'NO_CALLERS_FOUND' });
      if (callees.length === 0) factorCodes.push({ code: 'NO_CALLEES_FOUND' });
      if (flows.some((flow) => flow.criticality >= 0.7)) factorCodes.push({ code: 'HIGH_CRITICALITY_FLOW' });
      if ([...callers, ...callees].some((node) => node.project !== target.project)) factorCodes.push({ code: 'CROSS_PROJECT_USAGE' });
      if (flows.length > 0) factorCodes.push({ code: 'FLOW_MEMBER' });
      if (communities.length > 0) factorCodes.push({ code: 'COMMUNITY_MEMBER' });
      if (target.trust_level === 'AUTHORITATIVE') factorCodes.push({ code: 'AUTHORITATIVE_SOURCE' });
      const suggestedNext = symbolContextNextTools({
        hasFlows: flows.length > 0,
        callers: callers.length,
        callees: callees.length,
        isEntrypoint,
      });

      return QueryResultFactory.create({
        status: 'OK',
        nodes: [target, ...callers, ...callees],
        edges: [...callerPairs.map((item) => item.edge), ...calleePairs.map((item) => item.edge)],
        reasons: ['SYMBOL_CONTEXT_READY'],
        data: {
          target: nodeSummary(target),
          callers: callers.map(nodeSummary),
          callees: callees.map(nodeSummary),
          flows,
          communities,
          lineageHint: {
            tool: 'get_lineage',
            args: { workspaceId: input.workspaceId, nodeId: target.id, direction: 'both' },
          },
          factorCodes,
          suggestedNext,
        },
        metadata: {
          tool: { name: 'get_symbol_context', workspace: input.workspaceId, project: input.projectId },
          nextTools: suggestedNext.map((hint) => ({ name: hint.tool, reason: hint.reasonCode })),
        },
      });
    },
  });
}
