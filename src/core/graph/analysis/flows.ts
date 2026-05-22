import type { GraphEdge, GraphNode } from '../../types.js';
import type { FlowSummary } from '../../flows.js';

/**
 * Flow criticality scoring — assigns a criticality rating to business flows
 * based on the structural importance of their constituent nodes.
 */

export interface FlowCriticalityRecord {
  flowId: string;
  score: number;
  rating: 'low' | 'medium' | 'high' | 'critical';
  externalEndpoints: string[];
}

/**
 * Node weight matrix — higher weights indicate more critical node types.
 * Controller/Webhook entry points and DB/external integrations carry the most weight.
 */
const NODE_WEIGHTS: Record<string, number> = {
  controller_action: 10,
  webhook: 10,
  db_entity: 8,
  external_service: 8,
  service: 2,
  helper: 2,
  utility: 2,
};

/** Types considered external endpoints for reporting purposes */
const EXTERNAL_ENDPOINT_TYPES = new Set(['external_service', 'webhook']);

/**
 * Computes the criticality score and rating for a given flow.
 *
 * Algorithm:
 * 1. Sum the weights of all nodes in the flow based on their type
 * 2. Apply log-scale normalization: normalizedScore = rawScore * (1 + log2(nodeCount)) / nodeCount
 *    This prevents long flows from dominating purely by having many low-weight nodes.
 * 3. Assign rating based on thresholds: critical ≥ 40, high ≥ 25, medium ≥ 10, low < 10
 * 4. Collect external endpoints (nodes of type external_service or webhook)
 */
export function computeFlowCriticality(flow: FlowSummary, nodes: GraphNode[]): FlowCriticalityRecord {
  // Build a lookup of nodes that belong to this flow
  const flowNodeIds = new Set(flow.nodeIds);
  const flowNodes = nodes.filter((node) => flowNodeIds.has(node.id));

  // Step 1: Sum raw weights
  let rawScore = 0;
  for (const node of flowNodes) {
    const weight = NODE_WEIGHTS[node.type] ?? 0;
    rawScore += weight;
  }

  // Step 2: Log-scale normalization to prevent score bloat on long flows
  const nodeCount = flowNodes.length;
  let normalizedScore: number;
  if (nodeCount <= 0) {
    normalizedScore = 0;
  } else if (nodeCount === 1) {
    // For a single node, normalization factor is (1 + log2(1)) / 1 = 1
    normalizedScore = rawScore;
  } else {
    normalizedScore = rawScore * (1 + Math.log2(nodeCount)) / nodeCount;
  }

  // Step 3: Assign rating based on thresholds
  const rating = assignRating(normalizedScore);

  // Step 4: Collect external endpoints
  const externalEndpoints: string[] = [];
  for (const node of flowNodes) {
    if (EXTERNAL_ENDPOINT_TYPES.has(node.type)) {
      externalEndpoints.push(node.id);
    }
  }

  return {
    flowId: flow.id,
    score: normalizedScore,
    rating,
    externalEndpoints,
  };
}

/**
 * Assigns a criticality rating based on the normalized score.
 * Thresholds: critical ≥ 40, high ≥ 25, medium ≥ 10, low < 10
 */
function assignRating(score: number): FlowCriticalityRecord['rating'] {
  if (score >= 40) return 'critical';
  if (score >= 25) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

/**
 * Result of an affected-flow lookup — identifies a flow impacted by code changes
 * along with its criticality and the reason it was flagged.
 */
export interface AffectedFlowResult {
  flowId: string;
  criticality: FlowCriticalityRecord;
  affectedReason: string; // e.g. "Direct dependency on modified file Payment.cs"
}

/** Rating priority for sorting (higher = more critical) */
const RATING_PRIORITY: Record<FlowCriticalityRecord['rating'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Given a set of changed symbols (file paths or symbol identifiers), returns all
 * flows that contain at least one node matching a changed symbol, sorted by
 * criticality rating (highest first).
 *
 * Algorithm:
 * 1. Build an inverse index: for each changed symbol, find matching node IDs
 *    (matching by node `symbol` field or `source_file` field)
 * 2. For each flow, check if any of its node IDs are in the affected set
 * 3. For each affected flow, compute criticality via `computeFlowCriticality()`
 * 4. Include the reason explaining which modified symbol triggered inclusion
 * 5. Sort by criticality rating (critical > high > medium > low), then by score descending
 *
 * @param changedSymbols - Array of changed file paths or symbol identifiers
 * @param flows - All known flows to check against
 * @param nodes - All graph nodes (used for matching and criticality computation)
 * @param _edges - Graph edges (reserved for future use with edge-based matching)
 * @returns Affected flows sorted by criticality (highest first)
 */
export function getAffectedFlows(
  changedSymbols: string[],
  flows: FlowSummary[],
  nodes: GraphNode[],
  _edges: GraphEdge[],
): AffectedFlowResult[] {
  if (changedSymbols.length === 0 || flows.length === 0) {
    return [];
  }

  // Normalize changed symbols for case-insensitive matching
  const changedSet = new Set(changedSymbols.map((s) => s.toLowerCase()));

  // Step 1: Build inverse index — map each node to the changed symbol that matches it
  // nodeId → first matching changed symbol (for the reason string)
  const affectedNodeToReason = new Map<string, string>();

  for (const node of nodes) {
    const nodeSymbol = (node.symbol ?? '').toLowerCase();
    const nodeSourceFile = (node.source_file ?? '').toLowerCase();

    for (const changed of changedSet) {
      if (
        (nodeSymbol && nodeSymbol === changed) ||
        (nodeSourceFile && nodeSourceFile === changed)
      ) {
        // Store the original (non-lowercased) changed symbol for the reason
        const originalChanged = changedSymbols.find((s) => s.toLowerCase() === changed) ?? changed;
        affectedNodeToReason.set(node.id, originalChanged);
        break; // One match is sufficient to flag this node
      }
    }
  }

  if (affectedNodeToReason.size === 0) {
    return [];
  }

  // Step 2: For each flow, check if any of its node IDs are in the affected set
  const results: AffectedFlowResult[] = [];

  for (const flow of flows) {
    // Find the first affected node in this flow to use as the reason
    let matchedReason: string | undefined;
    for (const nodeId of flow.nodeIds) {
      const reason = affectedNodeToReason.get(nodeId);
      if (reason !== undefined) {
        matchedReason = reason;
        break;
      }
    }

    if (matchedReason === undefined) {
      continue; // This flow is not affected
    }

    // Step 3: Compute criticality for this flow
    const criticality = computeFlowCriticality(flow, nodes);

    // Step 4: Build the affected reason string
    const affectedReason = `Direct dependency on modified symbol ${matchedReason}`;

    results.push({
      flowId: flow.id,
      criticality,
      affectedReason,
    });
  }

  // Step 5: Sort by criticality rating (highest first), then by score descending
  results.sort((a, b) => {
    const priorityDiff = RATING_PRIORITY[b.criticality.rating] - RATING_PRIORITY[a.criticality.rating];
    if (priorityDiff !== 0) return priorityDiff;
    return b.criticality.score - a.criticality.score;
  });

  return results;
}
