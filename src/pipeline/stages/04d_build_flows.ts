/**
 * Stage 04d — Flow graph derivation.
 *
 * Runs AFTER canonical + derived + exploratory graph building and BEFORE
 * writeGraphArtifacts() so that:
 *  - flow_domain nodes and belongs_to_flow edges land in the DB before artifacts are written
 *  - wiki generation, verification, and graph artifacts all see a consistent view
 *  - derived_domain metadata is written back to existing nodes so search/wiki can use it
 */
import type { GraphEdge, GraphNode } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { computeFlows, flowMembershipEdges, withDerivedDomains } from '../../core/flows.js';

export interface FlowGraphResult {
  /** Original nodes augmented with derived_domain metadata. */
  enrichedNodes: GraphNode[];
  /** Synthetic flow_domain nodes persisted to DB. */
  flowNodes: GraphNode[];
  /** belongs_to_flow membership edges persisted to DB. */
  flowEdges: GraphEdge[];
}

export async function buildFlowGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  workspaceId: string,
  db: GraphDB,
): Promise<FlowGraphResult> {
  // 1. Derive domain metadata (pure, in-memory)
  const originalNodeById = new Map(nodes.map((n) => [n.id, n]));
  const enrichedNodes = withDerivedDomains(nodes);

  // 2. Write-back derived_domain for nodes that just gained one.
  //    Only upsert nodes that changed so we don't touch provenance unnecessarily.
  db.transaction(() => {
    for (const enriched of enrichedNodes) {
      if (
        enriched.metadata?.derived_domain &&
        !originalNodeById.get(enriched.id)?.metadata?.derived_domain
      ) {
        db.upsertNode(enriched);
      }
    }
  });

  // 3. Compute flows and build synthetic flow_domain nodes.
  //    flow_domain nodes give belongs_to_flow edges a real to_id target so graph
  //    validators and traversal tools can follow them without special-casing.
  const flows = computeFlows(enrichedNodes, edges);
  const now = new Date().toISOString();
  const flowProvenance = {
    source: 'analysis' as const,
    artifact_source: 'flow-derivation',
    producer_stage: 'buildFlowGraph',
    timestamp: now,
  };

  const flowNodes: GraphNode[] = flows.map((flow): GraphNode => ({
    id: flow.id,
    workspace: workspaceId,
    project: workspaceId,
    label: flow.name,
    type: 'flow_domain',
    graph_kind: 'derived',
    confidence_band: 'INFERRED',
    trust_level: 'DERIVED',
    symbol: flow.domain,
    provenance: flowProvenance,
    metadata: { domain: flow.domain, nodeCount: flow.nodeIds.length },
    updated_at: now,
  }));

  const flowEdges = flowMembershipEdges(workspaceId, flows);

  // 4. Persist flow nodes + membership edges in a single transaction.
  db.transaction(() => {
    for (const node of flowNodes) db.upsertNode(node);
    for (const edge of flowEdges) db.upsertEdge(edge);
  });

  return { enrichedNodes, flowNodes, flowEdges };
}
