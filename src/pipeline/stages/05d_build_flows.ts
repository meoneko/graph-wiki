/**
 * Stage 05d — Flow graph derivation with trust enforcement.
 *
 * Runs AFTER canonical + derived + exploratory graph building and BEFORE
 * writeGraphArtifacts() so that:
 *  - flow_domain nodes and belongs_to_flow edges land in the DB before artifacts are written
 *  - wiki generation, verification, and graph artifacts all see a consistent view
 *  - derived_domain metadata is written back to existing nodes so search/wiki can use it
 *
 * Enforces:
 * - Node ID uniqueness across workspace (Req 6.2)
 * - Derived nodes/edges require derivation rule (Req 6.4)
 * - Ordering invariant: flows run after canonical → derived → exploratory (Req 6.7)
 * - External nodes/edges gated and auditable (Req 6.6)
 *
 * @see Requirements 4.4, 4.5, 6.2, 6.4, 6.6, 6.7
 */
import type { GraphEdge, GraphNode } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { computeFlows, flowMembershipEdges, withDerivedDomains } from '../../core/flows.js';
import {
    enforceNodeIdUniqueness,
    enforceDerivedNodeRule,
    enforceDerivedRule,
    enforceExternalGated,
    enforceExternalEdgeGated,
    collectViolations,
    throwOnViolations,
    type EnforcementResult,
} from './graph_build_enforcement.js';

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
  // ── Trust Enforcement: Validate input nodes for external gating (Req 6.6) ─
  const externalResults: EnforcementResult[] = [];
  for (const node of nodes) {
    if (node.graph_kind === 'external') {
      externalResults.push(enforceExternalGated(node));
    }
  }
  for (const edge of edges) {
    if (edge.graph_kind === 'external') {
      externalResults.push(enforceExternalEdgeGated(edge));
    }
  }
  if (externalResults.length > 0) {
    throwOnViolations(collectViolations(...externalResults), 'buildFlowGraph (external gating)');
  }

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
    rule: 'flow-domain-derivation',
    workspaceId,
    sourceRootId: workspaceId,
    extractionStage: 'buildFlowGraph',
    extractionMethod: 'static-analysis',
    adapterId: 'flow-derivation-engine',
    adapterVersion: '1.0.0',
    confidence: 0.80,
  };

  const flowNodes: GraphNode[] = flows.map((flow): GraphNode => ({
    id: flow.id,
    stableKey: flow.id,
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

  // ── Trust Enforcement: Flow node ID uniqueness (Req 6.2) ──────────────────
  throwOnViolations(enforceNodeIdUniqueness(flowNodes), 'buildFlowGraph (flow node uniqueness)');

  // ── Trust Enforcement: Flow nodes require derivation rule (Req 6.4) ───────
  const flowNodeRuleResults: EnforcementResult[] = [];
  for (const node of flowNodes) {
    flowNodeRuleResults.push(enforceDerivedNodeRule(node));
  }
  throwOnViolations(collectViolations(...flowNodeRuleResults), 'buildFlowGraph (flow node derivation rule)');

  const flowEdges = flowMembershipEdges(workspaceId, flows);

  // ── Trust Enforcement: Flow edges require derivation rule (Req 6.4) ───────
  const flowEdgeRuleResults: EnforcementResult[] = [];
  for (const edge of flowEdges) {
    flowEdgeRuleResults.push(enforceDerivedRule(edge));
  }
  // Note: flowMembershipEdges may not set derivation_rule in metadata.
  // We only enforce if the edge is graph_kind=derived. If it passes, great.
  // If not, we log but don't block since flow edges have producer_stage as rule.
  const flowEdgeResult = collectViolations(...flowEdgeRuleResults);
  if (!flowEdgeResult.passed) {
    // Flow edges use producer_stage as their derivation rule — this is acceptable.
    // The enforceDerivedRule checks for provenance.rule OR metadata.derivation_rule OR producer_stage.
    // If it still fails, throw.
    throwOnViolations(flowEdgeResult, 'buildFlowGraph (flow edge derivation rule)');
  }

  // 4. Persist flow nodes + membership edges in a single transaction.
  db.transaction(() => {
    for (const node of flowNodes) db.upsertNode(node);
    for (const edge of flowEdges) db.upsertEdge(edge);
  });

  return { enrichedNodes, flowNodes, flowEdges };
}
