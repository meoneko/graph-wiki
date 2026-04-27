import type { GraphEdge, GraphNode } from '../../types.js';

const AUTHORITY_EDGE_TYPES = new Set(['uses_authority', 'node_uses_authority', 'depends_on_authority']);
const GOVERNANCE_RELEVANT_EDGE_TYPES = new Set(['calls', 'invokes', 'dispatches_to', 'triggers']);

export interface GovernanceIssue {
  code: string;
  nodeId?: string;
  edgeId?: string;
  detail: string;
}

export interface GovernanceValidationResult {
  passed: boolean;
  issues: GovernanceIssue[];
}

export class GovernanceValidator {
  static validate(nodes: GraphNode[], edges: GraphEdge[]): GovernanceValidationResult {
    const issues: GovernanceIssue[] = [];
    const nodeIds = new Set(nodes.map((node) => node.id));

    // Separate canonical/derived vs exploratory authority edges per source node.
    const canonicalAuthorityBySource = new Set<string>();
    const exploratoryAuthorityBySource = new Set<string>();

    for (const edge of edges) {
      if (!AUTHORITY_EDGE_TYPES.has(edge.type)) continue;

      if (!nodeIds.has(edge.from_id) || !nodeIds.has(edge.to_id)) {
        issues.push({
          code: 'AUTHORITY_CHAIN_BROKEN',
          edgeId: edge.id,
          detail: `Authority edge '${edge.id}' references missing endpoint(s): from_id=${edge.from_id}, to_id=${edge.to_id}`,
        });
        continue;
      }

      if (edge.graph_kind === 'exploratory') {
        // Exploratory authority edges cannot serve as governance proof
        issues.push({
          code: 'AUTHORITY_CHAIN_BROKEN',
          edgeId: edge.id,
          detail: `Authority edge '${edge.id}' (type=${edge.type}) is graph_kind=exploratory and cannot prove governance chain`,
        });
        exploratoryAuthorityBySource.add(edge.from_id);
      } else {
        canonicalAuthorityBySource.add(edge.from_id);
      }
    }

    for (const edge of edges) {
      if (AUTHORITY_EDGE_TYPES.has(edge.type)) continue;
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;
      if (!GOVERNANCE_RELEVANT_EDGE_TYPES.has(edge.type)) continue;
      if (edge.metadata?.requires_authority !== true && edge.metadata?.flow_type !== 'authority') continue;
      if (canonicalAuthorityBySource.has(edge.from_id)) continue;

      issues.push({
        code: 'AUTHORITY_CHAIN_BROKEN',
        edgeId: edge.id,
        detail: `Governance-relevant edge '${edge.id}' from '${edge.from_id}' has no canonical/derived authority proof`,
      });
    }

    // Canonical nodes that have authority edges only in exploratory layer — chain is broken
    for (const node of nodes) {
      if (node.graph_kind !== 'canonical') continue;
      if (!exploratoryAuthorityBySource.has(node.id)) continue;
      if (canonicalAuthorityBySource.has(node.id)) continue;

      issues.push({
        code: 'AUTHORITY_CHAIN_BROKEN',
        nodeId: node.id,
        detail: `Canonical node '${node.id}' has authority edges but all are exploratory; governance chain cannot be proven`,
      });
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}
