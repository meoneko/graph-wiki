import { z } from 'zod';
import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { affectedFlows, computeFlows, minimalContext, withDerivedDomains } from '../../core/flows.js';
import { EdgeType } from '../../core/types.js';
import { registerTool } from './runtime.js';

export function registerFlowTools(): void {
  registerTool({
    name: 'list_flows',
    description: 'List derived business flows for a workspace',
    inputSchema: { workspaceId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = withDerivedDomains(db.getAllNodesByWorkspace(input.workspaceId));
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      return { flows: computeFlows(nodes, edges) };
    },
  });

  registerTool({
    name: 'get_flow',
    description: 'Get nodes and edges for a derived business flow',
    inputSchema: { workspaceId: 'string', flowId: 'string' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string(), flowId: z.string() }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = withDerivedDomains(db.getAllNodesByWorkspace(input.workspaceId));
      const edges = db.getEdgesByWorkspace(input.workspaceId);
      const flow = computeFlows(nodes, edges).find((f) => f.id === input.flowId || f.domain === input.flowId);
      if (!flow) return { flow: null, nodes: [], edges: [] };
      const ids = new Set(flow.nodeIds);
      return {
        flow,
        nodes: nodes.filter((node) => ids.has(node.id)),
        edges: edges.filter((edge) => ids.has(edge.from_id) || ids.has(edge.to_id)),
      };
    },
  });

  registerTool({
    name: 'get_affected_flows',
    description: 'Find business flows affected by changed files, node IDs, or symbols',
    inputSchema: { workspaceId: 'string', targets: 'string[]' },
    handler: async (args) => {
      const input = z.object({ workspaceId: z.string(), targets: z.array(z.string()) }).parse(args);
      const db = getDB(resolveDbPath());
      const allEdges = db.getEdgesByWorkspace(input.workspaceId);

      // Prefer persisted `belongs_to_flow` edges (written by 06_verify) over recomputation.
      // This keeps MCP queries consistent with the pipeline's flow classification.
      const membershipEdges = allEdges.filter((e) => e.type === EdgeType.belongs_to_flow);

      if (membershipEdges.length > 0) {
        const allNodes = db.getAllNodesByWorkspace(input.workspaceId);
        const nodeById = new Map(allNodes.map((n) => [n.id, n]));
        const targetSet = new Set(input.targets.map((t) => t.toLowerCase()));

        // Build flow → member node IDs from persisted membership
        const flowNodeIds = new Map<string, Set<string>>();
        for (const e of membershipEdges) {
          const set = flowNodeIds.get(e.to_id) ?? new Set<string>();
          set.add(e.from_id);
          flowNodeIds.set(e.to_id, set);
        }

        // Identify which nodes match the targets
        const touchedNodeIds = new Set(
          allNodes
            .filter((n) =>
              targetSet.has(n.id.toLowerCase()) ||
              targetSet.has((n.source_file ?? '').toLowerCase()) ||
              targetSet.has((n.symbol ?? '').toLowerCase()) ||
              [...targetSet].some((t) => (n.source_file ?? '').toLowerCase().includes(t)),
            )
            .map((n) => n.id),
        );

        const result = [...flowNodeIds.entries()]
          .map(([flowId, memberIds]) => {
            const touchedCount = [...memberIds].filter((id) => touchedNodeIds.has(id)).length;
            const flowNode = nodeById.get(flowId);
            return {
              id: flowId,
              name: flowNode?.label ?? flowId,
              domain: (flowNode?.metadata?.domain as string | undefined) ?? flowId.replace('flow:', ''),
              nodeIds: [...memberIds],
              edgeIds: allEdges
                .filter((e) => memberIds.has(e.from_id) || memberIds.has(e.to_id))
                .map((e) => e.id),
              trust: {} as Record<string, number>,
              touchedNodeCount: touchedCount,
            };
          })
          .filter((f) => f.touchedNodeCount > 0)
          .sort((a, b) => b.touchedNodeCount - a.touchedNodeCount || b.nodeIds.length - a.nodeIds.length);

        return { flows: result };
      }

      // Fallback: recompute flows on-the-fly (before first pipeline run)
      const nodes = withDerivedDomains(db.getAllNodesByWorkspace(input.workspaceId));
      const flows = computeFlows(nodes, allEdges);
      return { flows: affectedFlows(flows, nodes, input.targets) };
    },
  });

  registerTool({
    name: 'get_minimal_context',
    description: 'Return a bounded canonical/derived context subgraph for review prompts',
    inputSchema: { workspaceId: 'string', targets: 'string[]', depth: 'number?', cap: 'number?' },
    handler: async (args) => {
      const input = z.object({
        workspaceId: z.string(),
        targets: z.array(z.string()),
        depth: z.number().int().positive().default(2),
        cap: z.number().int().positive().default(50),
      }).parse(args);
      const db = getDB(resolveDbPath());
      const nodes = withDerivedDomains(db.getAllNodesByWorkspace(input.workspaceId)).filter((node) => node.graph_kind !== 'exploratory');
      const nodeIds = new Set(nodes.map((node) => node.id));
      const edges = db.getEdgesByWorkspace(input.workspaceId).filter((edge) => edge.graph_kind !== 'exploratory' && nodeIds.has(edge.from_id) && nodeIds.has(edge.to_id));
      return minimalContext(nodes, edges, input.targets, input.depth, input.cap);
    },
  });
}
