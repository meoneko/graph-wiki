/**
 * Phase 9.2b MCP tools — postprocessing + flow/community queries + minimal context.
 *
 * All tools use Zod schemas from src/mcp/schemas/index.ts as the single source of truth
 * for input validation. inputSchema is passed as ZodObject directly (not legacy string-map)
 * so MCP Inspector / Claude Desktop receive full enum/default/bounds metadata.
 */
import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';
import type { GraphNode } from '../../core/types.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { runPostProcess } from '../../pipeline/postprocess.js';
import { getDB } from '../../storage/GraphDB.js';
import {
  GetAffectedFlowsInput,
  GetCommunityInput,
  GetFlowInput,
  GetMinimalContextInput,
  ListCommunitiesInput,
  ListFlowsInput,
  RunPostProcessInput,
} from '../schemas/index.js';
import {
  filterNodesByProject,
  findNodesByFiles,
  flowProjects,
  getWorkspaceGraph,
} from './graphToolUtils.js';
import { registerTool } from './runtime.js';
import { notifyGraphUpdated } from '../server.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function db() {
  return getDB(resolveDbPath());
}

function guardPostprocessRan(workspace: string): boolean {
  const flows = db().getFlows(workspace);
  return flows.length > 0 || db().getCommunities(workspace).length > 0;
}

function flowTouchesProject(flow: { path: string[] }, nodeById: Map<string, GraphNode>, projectId?: string): boolean {
  return !projectId || flow.path.some((id) => nodeById.get(id)?.project === projectId);
}

function communityTouchesProject(community: { nodeIds: string[] }, nodeById: Map<string, GraphNode>, projectId?: string): boolean {
  return !projectId || community.nodeIds.some((id) => nodeById.get(id)?.project === projectId);
}

function graphStateNextTools(input: {
  hasFlows: boolean;
  hasCommunities: boolean;
  hasChangedMatches: boolean;
  hasNodeMatches: boolean;
  hasEntrypoints: boolean;
}): Array<{ tool: string; reasonCode: string }> {
  const suggestions: Array<{ tool: string; reasonCode: string }> = [];
  if (input.hasChangedMatches && input.hasFlows) {
    suggestions.push({ tool: 'get_affected_flows', reasonCode: 'changed_files_matched_flows_available' });
  }
  if (input.hasNodeMatches) {
    suggestions.push({ tool: 'get_node', reasonCode: 'focus_nodes_matched' });
  }
  if (input.hasFlows) {
    suggestions.push({ tool: 'list_flows', reasonCode: input.hasEntrypoints ? 'entrypoint_flows_available' : 'flows_available' });
  }
  if (input.hasCommunities) {
    suggestions.push({ tool: 'list_communities', reasonCode: 'communities_available' });
  }
  if (suggestions.length === 0) {
    suggestions.push({ tool: 'run_postprocess', reasonCode: 'postprocess_data_missing' });
  }
  return suggestions;
}

const FOCUS_HINT_LIMIT = 200;

function capArray<T>(items: T[], limit = FOCUS_HINT_LIMIT): T[] {
  return items.length > limit ? items.slice(0, limit) : items;
}

// ── Tool registration ─────────────────────────────────────────────────────────

export function registerPostprocessTools(): void {

  // ── run_postprocess ─────────────────────────────────────────────────────────
  registerTool({
    name: 'run_postprocess',
    description:
      'Run postprocessing pipeline for a workspace: traces execution flows, detects code communities, and rebuilds FTS index. ' +
      'Must be called after build_graph before list_flows or list_communities are meaningful.',
    inputSchema: RunPostProcessInput,
    handler: async (args) => {
      const input = RunPostProcessInput.parse(args);
      const result = await runPostProcess(db(), input.workspaceId, {
        flows:       input.flows,
        communities: input.communities,
        fts:         input.fts,
      });
      notifyGraphUpdated();
      return result;
    },
  });

  // ── list_flows ──────────────────────────────────────────────────────────────
  registerTool({
    name: 'list_flows',
    description:
      'List execution flows for a workspace, sorted by criticality (highest first). ' +
      'Run run_postprocess first. detail_level="minimal" returns name+criticality only.',
    inputSchema: ListFlowsInput,
    handler: async (args) => {
      const input = ListFlowsInput.parse(args);
      if (!guardPostprocessRan(input.workspaceId)) {
        return QueryResultFactory.create({
          status: 'POLICY_VIOLATION',
          nodes: [], edges: [],
          reasons: ['POSTPROCESS_REQUIRED'],
          codes: ['POSTPROCESS_REQUIRED'],
        });
      }
      const { nodes, nodeById, flows: allFlows } = getWorkspaceGraph(db(), input.workspaceId);
      const scopedFlows = allFlows
        .filter((flow) => flowTouchesProject(flow, nodeById, input.projectId))
        .slice(0, input.limit);
      return QueryResultFactory.create({
        status: 'OK',
        nodes: [], edges: [],
        reasons: ['FLOWS_RETURNED'],
        data: {
          flows: scopedFlows.map((flow) => ({
            id: flow.id,
            name: flow.name,
            criticality: flow.criticality,
            nodeCount: flow.nodeCount,
            depth: flow.depth,
            projects: flowProjects(flow.path, nodeById),
          })),
          scope: { workspaceId: input.workspaceId, projectId: input.projectId },
        },
        metadata: { tool: { name: 'list_flows', workspace: input.workspaceId } },
      });
    },
  });

  // ── get_flow ────────────────────────────────────────────────────────────────
  registerTool({
    name: 'get_flow',
    description: 'Get a single execution flow by ID, including all member nodes in path order.',
    inputSchema: GetFlowInput,
    handler: async (args) => {
      const input = GetFlowInput.parse(args);
      const flows = db().getFlows(input.workspaceId);
      const flow = flows.find((f) => f.id === input.flowId);
      if (!flow) {
        return QueryResultFactory.create({
          status: 'INSUFFICIENT_EVIDENCE',
          nodes: [], edges: [],
          reasons: ['FLOW_NOT_FOUND'],
          codes: ['FLOW_NOT_FOUND'],
        });
      }
      // Enrich with node details for the path
      const store = db();
      const pathNodes = flow.path
        .map((nodeId) => store.getNode(nodeId))
        .filter(Boolean);
      return QueryResultFactory.create({
        status: 'OK',
        nodes: pathNodes as NonNullable<typeof pathNodes[number]>[],
        edges: [],
        reasons: ['FLOW_RETURNED'],
        data: { flow },
        metadata: { tool: { name: 'get_flow', workspace: input.workspaceId } },
      });
    },
  });

  // ── get_affected_flows ──────────────────────────────────────────────────────
  registerTool({
    name: 'get_affected_flows',
    description:
      'Return flows whose member nodes include any of the given changed files. ' +
      'Useful after detect_changes to find which execution paths are at risk.',
    inputSchema: GetAffectedFlowsInput,
    handler: async (args) => {
      const input = GetAffectedFlowsInput.parse(args);
      if ((input.changedFiles?.length ?? 0) === 0 && (input.nodeIds?.length ?? 0) === 0) {
        return QueryResultFactory.create({
          status: 'POLICY_VIOLATION',
          nodes: [], edges: [],
          reasons: ['AFFECTED_FLOW_INPUT_REQUIRED'],
          codes: ['AFFECTED_FLOW_INPUT_REQUIRED'],
          data: { inputs: {}, matchedNodes: [], flows: [], unmatchedInputs: [] },
          metadata: { tool: { name: 'get_affected_flows', workspace: input.workspaceId } },
        });
      }

      if (!guardPostprocessRan(input.workspaceId)) {
        return QueryResultFactory.create({
          status: 'POLICY_VIOLATION',
          nodes: [], edges: [],
          reasons: ['POSTPROCESS_REQUIRED'],
          codes: ['POSTPROCESS_REQUIRED'],
        });
      }

      const store = db();
      const { nodes, nodeById, flows: allFlows } = getWorkspaceGraph(store, input.workspaceId);
      const projectNodes = filterNodesByProject(nodes, input.projectId);
      const fileMatches = findNodesByFiles(projectNodes, input.changedFiles ?? []);
      const nodeIdMatches = (input.nodeIds ?? [])
        .map((id) => nodeById.get(id))
        .filter((node): node is GraphNode => Boolean(node && (!input.projectId || node.project === input.projectId)));
      const matchedNodeMap = new Map<string, GraphNode>();
      for (const node of fileMatches.matchedNodes) matchedNodeMap.set(node.id, node);
      for (const node of nodeIdMatches) matchedNodeMap.set(node.id, node);
      const matchedNodeIds = new Set(matchedNodeMap.keys());
      const unmatchedNodeIds = (input.nodeIds ?? []).filter((id) => !matchedNodeMap.has(id));

      if (matchedNodeIds.size === 0) {
        return QueryResultFactory.create({
          status: 'INSUFFICIENT_EVIDENCE',
          nodes: [], edges: [],
          reasons: ['NO_INPUTS_MATCHED'],
          codes: ['NO_INPUTS_MATCHED'],
          data: {
            inputs: { changedFiles: input.changedFiles, nodeIds: input.nodeIds },
            matchedNodes: [],
            flows: [],
            unmatchedInputs: [...fileMatches.unmatchedFiles, ...unmatchedNodeIds],
          },
          metadata: { tool: { name: 'get_affected_flows', workspace: input.workspaceId } },
        });
      }

      const affected = allFlows
        .filter((flow) => flowTouchesProject(flow, nodeById, input.projectId))
        .map((flow) => {
          const matchedNodeCount = flow.path.filter((id) => matchedNodeIds.has(id)).length;
          return { flow, matchedNodeCount };
        })
        .filter((item) => item.matchedNodeCount > 0);

      return QueryResultFactory.create({
        status: affected.length > 0 ? 'OK' : 'INSUFFICIENT_EVIDENCE',
        nodes: [], edges: [],
        reasons: [
          affected.length > 0
            ? 'AFFECTED_FLOWS_FOUND'
            : 'NO_FLOWS_TOUCH_INPUTS',
        ],
        data: {
          inputs: { changedFiles: input.changedFiles, nodeIds: input.nodeIds },
          matchedNodes: [...matchedNodeMap.values()].map((node) => ({
            id: node.id,
            label: node.label,
            project: node.project,
            source_file: node.source_file,
          })),
          flows: affected.map(({ flow, matchedNodeCount }) => ({
            id: flow.id,
            name: flow.name,
            criticality: flow.criticality,
            nodeCount: flow.nodeCount,
            matchedNodeCount,
            projects: flowProjects(flow.path, nodeById),
          })),
          unmatchedInputs: [...fileMatches.unmatchedFiles, ...unmatchedNodeIds],
        },
        metadata: {
          tool: { name: 'get_affected_flows', workspace: input.workspaceId },
          nextTools: [
            { name: 'get_flow', reason: 'affected_flows_available' },
          ],
        },
      });
    },
  });

  // ── list_communities ────────────────────────────────────────────────────────
  registerTool({
    name: 'list_communities',
    description:
      'List code communities detected in the workspace, sorted by cohesion. ' +
      'Communities are clusters of nodes that frequently call each other.',
    inputSchema: ListCommunitiesInput,
    handler: async (args) => {
      const input = ListCommunitiesInput.parse(args);
      if (!guardPostprocessRan(input.workspaceId)) {
        return QueryResultFactory.create({
          status: 'POLICY_VIOLATION',
          nodes: [], edges: [],
          reasons: ['POSTPROCESS_REQUIRED'],
          codes: ['POSTPROCESS_REQUIRED'],
        });
      }
      const { nodeById, communities: allCommunities } = getWorkspaceGraph(db(), input.workspaceId);
      const communities = allCommunities.filter((community) => communityTouchesProject(community, nodeById, input.projectId));
      return QueryResultFactory.create({
        status: 'OK',
        nodes: [], edges: [],
        reasons: ['COMMUNITIES_RETURNED'],
        data: {
          communities: communities.map((c) => ({
            id: c.id,
            name: c.name,
            size: c.size,
            cohesion: c.cohesion,
            projects: flowProjects(c.nodeIds, nodeById),
          })),
          scope: { workspaceId: input.workspaceId, projectId: input.projectId },
        },
        metadata: { tool: { name: 'list_communities', workspace: input.workspaceId } },
      });
    },
  });

  // ── get_community ───────────────────────────────────────────────────────────
  registerTool({
    name: 'get_community',
    description: 'Get a single community by ID, including its member node IDs.',
    inputSchema: GetCommunityInput,
    handler: async (args) => {
      const input = GetCommunityInput.parse(args);

      const store = db();
      const communities = store.getCommunities(input.workspaceId);
      const community = communities.find((c) => c.id === input.communityId);
      if (!community) {
        return QueryResultFactory.create({
          status: 'INSUFFICIENT_EVIDENCE',
          nodes: [], edges: [],
          reasons: ['COMMUNITY_NOT_FOUND'],
          codes: ['COMMUNITY_NOT_FOUND'],
        });
      }
      const memberNodes = community.nodeIds
        .map((id) => store.getNode(id))
        .filter((node): node is GraphNode => node !== undefined);
      return QueryResultFactory.create({
        status: 'OK',
        nodes: memberNodes as NonNullable<typeof memberNodes[number]>[],
        edges: [],
        reasons: ['COMMUNITY_RETURNED'],
        data: { community },
        metadata: { tool: { name: 'get_community', workspace: input.workspaceId } },
      });
    },
  });

  // ── get_minimal_context ─────────────────────────────────────────────────────
  registerTool({
    name: 'get_minimal_context',
    description:
      'Token-efficient first call for any AI workflow. Returns graph stats, top flows by criticality, ' +
      'top communities by cohesion, and task-aware next-tool suggestions. ' +
      'Call this before any deeper analysis to orient the session.',
    inputSchema: GetMinimalContextInput,
    handler: async (args) => {
      const input = GetMinimalContextInput.parse(args);
      const store = db();
      const { nodes: allNodes, nodeById, flows: allFlows, communities: allCommunities } = getWorkspaceGraph(store, input.workspaceId);
      const scopedNodes = filterNodesByProject(allNodes, input.projectId);
      const scopedNodeIds = new Set(scopedNodes.map((node) => node.id));
      const edges = store.getEdgesByWorkspace(input.workspaceId)
        .filter((edge) => scopedNodeIds.has(edge.from_id) || scopedNodeIds.has(edge.to_id));
      const flows = allFlows.filter((flow) => flowTouchesProject(flow, nodeById, input.projectId));
      const communities = allCommunities.filter((community) => communityTouchesProject(community, nodeById, input.projectId));

      const topFlows = flows.slice(0, 3).map((f) => ({
        id: f.id,
        name: f.name,
        criticality: f.criticality,
        nodeCount: f.nodeCount,
        depth: f.depth,
      }));
      const topCommunities = communities.slice(0, 3).map((c) => ({
        id: c.id,
        name: c.name,
        size: c.size,
        cohesion: c.cohesion,
      }));

      const changedFileMatches = findNodesByFiles(scopedNodes, input.changedFiles ?? []);
      const focusNodeMatches = new Map<string, GraphNode>();
      for (const node of changedFileMatches.matchedNodes) focusNodeMatches.set(node.id, node);
      for (const nodeId of input.focus?.nodeIds ?? []) {
        const node = nodeById.get(nodeId);
        if (node && (!input.projectId || node.project === input.projectId)) focusNodeMatches.set(node.id, node);
      }
      for (const symbol of input.focus?.symbols ?? []) {
        const lower = symbol.toLowerCase();
        for (const node of scopedNodes) {
          if (node.label.toLowerCase().includes(lower) || node.symbol?.toLowerCase().includes(lower)) {
            focusNodeMatches.set(node.id, node);
          }
        }
      }
      for (const language of input.focus?.languages ?? []) {
        for (const node of scopedNodes.filter((n) => n.language === language)) focusNodeMatches.set(node.id, node);
      }
      for (const framework of input.focus?.frameworks ?? []) {
        for (const node of scopedNodes.filter((n) => n.framework === framework)) focusNodeMatches.set(node.id, node);
      }

      const focusNodeIds = new Set(focusNodeMatches.keys());
      const affectedFlowIds = flows.filter((flow) => flow.path.some((id) => focusNodeIds.has(id))).map((flow) => flow.id);
      const affectedCommunityIds = communities.filter((community) => community.nodeIds.some((id) => focusNodeIds.has(id))).map((community) => community.id);
      const unmatchedInputs = [
        ...changedFileMatches.unmatchedFiles,
        ...(input.focus?.nodeIds ?? []).filter((id) => !focusNodeMatches.has(id)),
      ];

      const roles = new Map<string, number>();
      const languages = new Map<string, number>();
      const frameworks = new Map<string, { nodeCount: number; entrypointCount: number }>();
      const nodeTypes = new Map<string, number>();
      for (const node of scopedNodes) {
        languages.set(node.language, (languages.get(node.language) ?? 0) + 1);
        nodeTypes.set(node.type, (nodeTypes.get(node.type) ?? 0) + 1);
        for (const role of node.roles ?? []) roles.set(role, (roles.get(role) ?? 0) + 1);
        if (node.framework) {
          const current = frameworks.get(node.framework) ?? { nodeCount: 0, entrypointCount: 0 };
          current.nodeCount += 1;
          if ((node.roles ?? []).includes('entrypoint')) current.entrypointCount += 1;
          frameworks.set(node.framework, current);
        }
      }

      const suggestedNext = graphStateNextTools({
        hasFlows: flows.length > 0,
        hasCommunities: communities.length > 0,
        hasChangedMatches: changedFileMatches.matchedNodes.length > 0,
        hasNodeMatches: focusNodeMatches.size > 0,
        hasEntrypoints: scopedNodes.some((node) => (node.roles ?? []).includes('entrypoint')),
      });

      return QueryResultFactory.create({
        status: 'OK',
        nodes: [], edges: [],
        reasons: ['MINIMAL_CONTEXT_READY'],
        data: {
          scope: { workspaceId: input.workspaceId, projectId: input.projectId, taskType: input.taskType },
          stats: {
            nodes: scopedNodes.length,
            edges: edges.length,
            flows: flows.length,
            communities: communities.length,
            entrypoints: scopedNodes.filter((node) => (node.roles ?? []).includes('entrypoint')).length,
          },
          dimensions: {
            languages: [...languages.entries()].map(([name, nodeCount]) => ({ name, nodeCount })),
            frameworks: [...frameworks.entries()].map(([name, value]) => ({ name, ...value })),
            nodeTypes: [...nodeTypes.entries()].map(([type, count]) => ({ type, count })),
            roles: [...roles.entries()].map(([role, count]) => ({ role, count })),
          },
          topFlows,
          topCommunities,
          focusHints: focusNodeMatches.size > 0 || unmatchedInputs.length > 0
            ? {
              matchedNodeIds: capArray([...focusNodeIds]),
              matchedNodeCount: focusNodeIds.size,
              matchedChangedFiles: changedFileMatches.matchedFiles,
              affectedFlowIds: capArray(affectedFlowIds),
              affectedFlowCount: affectedFlowIds.length,
              affectedCommunityIds: capArray(affectedCommunityIds),
              affectedCommunityCount: affectedCommunityIds.length,
              unmatchedInputs,
            }
            : undefined,
          suggestedNext,
        },
        metadata: {
          tool: { name: 'get_minimal_context', workspace: input.workspaceId },
          nextTools: suggestedNext.map((hint) => ({ name: hint.tool, reason: hint.reasonCode })),
        },
      });
    },
  });
}

