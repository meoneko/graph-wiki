/**
 * GovernanceValidator — validates authority chains, workspace-defined forbidden patterns,
 * and flow integrity for the Trusted Code Intelligence Platform.
 *
 * Co-located with AuthorityPolicyEngine under src/core/graph/policy/.
 *
 * Responsibilities:
 * - Authority chain tracing: reject conclusions depending on exploratory proof
 * - Forbidden pattern detection: workspace-configured (not hardcoded)
 * - Flow integrity validation: entrypoint reachability, no dead branches in critical flows,
 *   critical paths not terminating unexpectedly
 * - Returns POLICY_VIOLATION with specific chain break identified
 *
 * @see Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 */

import type { GraphEdge, GraphNode } from '../../types.js';
import { DecisionStatus, RuntimeCode } from '../../errors.js';
import type { GovernanceConfig, ForbiddenPattern } from '../../../pipeline/config.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GovernanceIssue {
  code: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  detail: string;
  chainBreak?: ChainBreak;
}

export interface ChainBreak {
  /** The node or edge where the chain breaks */
  breakPoint: string;
  /** The expected chain path */
  expectedChain: string[];
  /** The actual chain path (up to the break) */
  actualChain: string[];
  /** Reason for the break */
  reason: string;
}

export interface GovernanceValidationResult {
  passed: boolean;
  status: typeof DecisionStatus.OK | typeof DecisionStatus.POLICY_VIOLATION;
  issues: GovernanceIssue[];
  codes: string[];
}

export interface GovernanceValidatorOptions {
  /** Governance configuration from workspace policy */
  governance?: GovernanceConfig;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTHORITY_EDGE_TYPES = new Set([
  'uses_authority',
  'node_uses_authority',
  'depends_on_authority',
]);

const CONTROL_FLOW_EDGE_TYPES = new Set([
  'calls',
  'invokes',
  'dispatches_to',
  'triggers',
  'precedes',
  'delegates_to',
]);

const ENTRYPOINT_NODE_TYPES = new Set([
  'entrypoint',
  'controller_action',
  'api_endpoint',
]);

// ─── GovernanceValidator Class ───────────────────────────────────────────────

export class GovernanceValidator {
  /**
   * Validate governance rules against the graph.
   * Checks authority chains, forbidden patterns, and flow integrity.
   */
  static validate(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options: GovernanceValidatorOptions = {},
  ): GovernanceValidationResult {
    const issues: GovernanceIssue[] = [];
    const codes: string[] = [];

    // 1. Authority chain validation
    const authorityIssues = GovernanceValidator.validateAuthorityChains(nodes, edges);
    issues.push(...authorityIssues);

    // 2. Forbidden pattern detection (workspace-configured)
    if (options.governance?.forbidden_patterns && options.governance.forbidden_patterns.length > 0) {
      const patternIssues = GovernanceValidator.validateForbiddenPatterns(
        nodes,
        edges,
        options.governance.forbidden_patterns,
      );
      issues.push(...patternIssues);
    }

    // 3. Flow integrity validation
    if (options.governance?.critical_flows && options.governance.critical_flows.length > 0) {
      const flowIssues = GovernanceValidator.validateFlowIntegrity(
        nodes,
        edges,
        options.governance.critical_flows,
      );
      issues.push(...flowIssues);
    }

    // Collect unique codes
    const uniqueCodes = new Set<string>();
    for (const issue of issues) {
      uniqueCodes.add(issue.code);
    }
    codes.push(...uniqueCodes);

    const hasErrors = issues.some((i) => i.severity === 'error');

    return {
      passed: !hasErrors,
      status: hasErrors ? DecisionStatus.POLICY_VIOLATION : DecisionStatus.OK,
      issues,
      codes,
    };
  }

  // ─── Authority Chain Validation ──────────────────────────────────────────

  /**
   * Validate authority chains:
   * - Reject conclusions depending on exploratory proof
   * - Detect broken authority chains (missing endpoints, exploratory-only authority)
   * - Ensure governance-relevant edges have canonical/derived authority backing
   */
  private static validateAuthorityChains(
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): GovernanceIssue[] {
    const issues: GovernanceIssue[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Track authority edges by source node and their graph_kind
    const canonicalAuthorityBySource = new Set<string>();
    const exploratoryAuthorityBySource = new Set<string>();

    for (const edge of edges) {
      if (!AUTHORITY_EDGE_TYPES.has(edge.type)) continue;

      // Check for dangling authority edges (missing endpoints)
      if (!nodeIds.has(edge.from_id) || !nodeIds.has(edge.to_id)) {
        issues.push({
          code: RuntimeCode.AUTHORITY_CHAIN_BROKEN,
          severity: 'error',
          edgeId: edge.id,
          detail: `Authority edge '${edge.id}' references missing endpoint(s): from_id=${edge.from_id}, to_id=${edge.to_id}`,
          chainBreak: {
            breakPoint: edge.id,
            expectedChain: [edge.from_id, edge.to_id],
            actualChain: [
              ...(nodeIds.has(edge.from_id) ? [edge.from_id] : []),
              ...(nodeIds.has(edge.to_id) ? [edge.to_id] : []),
            ],
            reason: 'Authority edge references non-existent node(s)',
          },
        });
        continue;
      }

      // Exploratory authority edges cannot serve as governance proof (Req 17.1, 17.5)
      if (edge.graph_kind === 'exploratory') {
        issues.push({
          code: RuntimeCode.AUTHORITY_CHAIN_BROKEN,
          severity: 'error',
          edgeId: edge.id,
          detail: `Authority edge '${edge.id}' (type=${edge.type}) is graph_kind=exploratory and cannot prove governance chain`,
          chainBreak: {
            breakPoint: edge.id,
            expectedChain: [edge.from_id, `authority:${edge.type}`, edge.to_id],
            actualChain: [edge.from_id, `exploratory:${edge.type}`, edge.to_id],
            reason: 'Exploratory authority edges are rejected for governance conclusions',
          },
        });
        exploratoryAuthorityBySource.add(edge.from_id);
      } else {
        canonicalAuthorityBySource.add(edge.from_id);
      }
    }

    // Check governance-relevant edges that require authority backing
    for (const edge of edges) {
      if (AUTHORITY_EDGE_TYPES.has(edge.type)) continue;
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;
      if (!CONTROL_FLOW_EDGE_TYPES.has(edge.type)) continue;

      // Only check edges that explicitly require authority
      if (edge.metadata?.requires_authority !== true && edge.metadata?.flow_type !== 'authority') continue;

      // If the source node already has canonical authority, it's fine
      if (canonicalAuthorityBySource.has(edge.from_id)) continue;

      issues.push({
        code: RuntimeCode.AUTHORITY_CHAIN_BROKEN,
        severity: 'error',
        edgeId: edge.id,
        detail: `Governance-relevant edge '${edge.id}' from '${edge.from_id}' has no canonical/derived authority proof`,
        chainBreak: {
          breakPoint: edge.from_id,
          expectedChain: [edge.from_id, 'authority_edge', 'authority_target'],
          actualChain: [edge.from_id],
          reason: 'No canonical/derived authority edge found for governance-relevant operation',
        },
      });
    }

    // Canonical nodes with only exploratory authority — chain is broken
    for (const node of nodes) {
      if (node.graph_kind !== 'canonical') continue;
      if (!exploratoryAuthorityBySource.has(node.id)) continue;
      if (canonicalAuthorityBySource.has(node.id)) continue;

      issues.push({
        code: RuntimeCode.AUTHORITY_CHAIN_BROKEN,
        severity: 'error',
        nodeId: node.id,
        detail: `Canonical node '${node.id}' has authority edges but all are exploratory; governance chain cannot be proven`,
        chainBreak: {
          breakPoint: node.id,
          expectedChain: [node.id, 'canonical_authority_edge', 'authority_target'],
          actualChain: [node.id, 'exploratory_authority_edge(rejected)'],
          reason: 'All authority edges for this canonical node are exploratory',
        },
      });
    }

    return issues;
  }

  // ─── Forbidden Pattern Detection ────────────────────────────────────────

  /**
   * Detect workspace-defined forbidden patterns.
   * Patterns are configured per workspace policy (not hardcoded).
   * Each pattern specifies from_type, to_type, and optionally via_edge.
   */
  private static validateForbiddenPatterns(
    nodes: GraphNode[],
    edges: GraphEdge[],
    forbiddenPatterns: ForbiddenPattern[],
  ): GovernanceIssue[] {
    const issues: GovernanceIssue[] = [];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    for (const edge of edges) {
      // Only check canonical/derived edges for forbidden patterns
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;

      const fromNode = nodeById.get(edge.from_id);
      const toNode = nodeById.get(edge.to_id);
      if (!fromNode || !toNode) continue;

      for (const pattern of forbiddenPatterns) {
        const fromMatches = GovernanceValidator.nodeTypeMatches(fromNode.type, pattern.from_type);
        const toMatches = GovernanceValidator.nodeTypeMatches(toNode.type, pattern.to_type);

        if (!fromMatches || !toMatches) continue;

        // If via_edge is specified, only match if edge type matches
        if (pattern.via_edge && edge.type !== pattern.via_edge) continue;

        issues.push({
          code: 'FORBIDDEN_PATTERN_VIOLATION',
          severity: 'error',
          edgeId: edge.id,
          detail: `Forbidden pattern '${pattern.id}' violated: ${fromNode.type} → ${toNode.type}${pattern.via_edge ? ` via ${pattern.via_edge}` : ''} (${pattern.description})`,
          chainBreak: {
            breakPoint: edge.id,
            expectedChain: [`NOT(${pattern.from_type})`, `→`, `NOT(${pattern.to_type})`],
            actualChain: [fromNode.id, edge.type, toNode.id],
            reason: pattern.description,
          },
        });
      }
    }

    return issues;
  }

  /**
   * Check if a node type matches a pattern type.
   * Supports exact match and wildcard prefix matching (e.g., "frontend*" matches "frontend_route").
   */
  private static nodeTypeMatches(nodeType: string, patternType: string): boolean {
    if (patternType === '*') return true;
    if (patternType.endsWith('*')) {
      const prefix = patternType.slice(0, -1);
      return nodeType.startsWith(prefix) || nodeType.includes(prefix);
    }
    return nodeType === patternType || nodeType.includes(patternType);
  }

  // ─── Flow Integrity Validation ──────────────────────────────────────────

  /**
   * Validate flow integrity for declared critical flows:
   * - Entrypoint reachability: critical flows must have reachable entrypoints
   * - No dead branches: all nodes in critical flows must have outgoing edges
   *   (except terminal nodes)
   * - Critical paths not terminating unexpectedly
   */
  private static validateFlowIntegrity(
    nodes: GraphNode[],
    edges: GraphEdge[],
    criticalFlows: string[],
  ): GovernanceIssue[] {
    const issues: GovernanceIssue[] = [];

    // Build adjacency structures
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const outgoingEdges = new Map<string, GraphEdge[]>();
    const incomingEdges = new Map<string, GraphEdge[]>();

    for (const edge of edges) {
      // Only consider canonical/derived control flow edges for flow integrity
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;
      if (!CONTROL_FLOW_EDGE_TYPES.has(edge.type) && edge.type !== 'entry_of' && edge.type !== 'belongs_to_flow') continue;

      if (!outgoingEdges.has(edge.from_id)) outgoingEdges.set(edge.from_id, []);
      outgoingEdges.get(edge.from_id)!.push(edge);

      if (!incomingEdges.has(edge.to_id)) incomingEdges.set(edge.to_id, []);
      incomingEdges.get(edge.to_id)!.push(edge);
    }

    // Find flow nodes (nodes with belongs_to_flow edges or matching flow IDs)
    const flowMembership = new Map<string, Set<string>>(); // flowId → Set<nodeId>

    for (const edge of edges) {
      if (edge.type === 'belongs_to_flow') {
        const flowId = edge.to_id;
        if (!flowMembership.has(flowId)) flowMembership.set(flowId, new Set());
        flowMembership.get(flowId)!.add(edge.from_id);
      }
    }

    for (const flowName of criticalFlows) {
      // Find the flow node or nodes matching this critical flow
      const flowNodeIds = GovernanceValidator.findFlowNodes(nodes, flowName);

      if (flowNodeIds.length === 0) {
        issues.push({
          code: 'FLOW_INTEGRITY_VIOLATION',
          severity: 'error',
          detail: `Critical flow '${flowName}' not found in graph`,
          chainBreak: {
            breakPoint: flowName,
            expectedChain: [flowName, '→', 'flow_nodes'],
            actualChain: [],
            reason: `No flow node matching '${flowName}' exists in the graph`,
          },
        });
        continue;
      }

      for (const flowNodeId of flowNodeIds) {
        // Get all nodes belonging to this flow
        const flowMembers = flowMembership.get(flowNodeId) ?? new Set<string>();

        // If no members, check if the flow node itself has entry_of edges
        if (flowMembers.size === 0) {
          // Check for entry_of edges pointing to this flow
          const entryEdges = edges.filter(
            (e) => e.type === 'entry_of' && e.to_id === flowNodeId,
          );
          if (entryEdges.length > 0) {
            for (const entryEdge of entryEdges) {
              flowMembers.add(entryEdge.from_id);
            }
          }
        }

        // 1. Entrypoint reachability check
        const entrypoints = GovernanceValidator.findFlowEntrypoints(
          flowNodeId,
          flowMembers,
          nodes,
          edges,
          nodeById,
        );

        if (entrypoints.length === 0 && flowMembers.size > 0) {
          issues.push({
            code: 'FLOW_INTEGRITY_VIOLATION',
            severity: 'error',
            nodeId: flowNodeId,
            detail: `Critical flow '${flowName}' (${flowNodeId}) has no reachable entrypoint`,
            chainBreak: {
              breakPoint: flowNodeId,
              expectedChain: ['entrypoint', '→', flowNodeId],
              actualChain: [flowNodeId],
              reason: 'No entrypoint node can reach this critical flow',
            },
          });
        }

        // 2. Dead branch detection in critical flows
        if (flowMembers.size > 0) {
          const deadBranches = GovernanceValidator.findDeadBranches(
            flowMembers,
            outgoingEdges,
            nodeById,
          );

          for (const deadNodeId of deadBranches) {
            const deadNode = nodeById.get(deadNodeId);
            issues.push({
              code: 'FLOW_INTEGRITY_VIOLATION',
              severity: 'warning',
              nodeId: deadNodeId,
              detail: `Dead branch in critical flow '${flowName}': node '${deadNodeId}' (${deadNode?.type ?? 'unknown'}) has no outgoing control flow edges`,
              chainBreak: {
                breakPoint: deadNodeId,
                expectedChain: [deadNodeId, '→', 'next_node'],
                actualChain: [deadNodeId],
                reason: 'Node in critical flow has no outgoing control flow edges (unexpected termination)',
              },
            });
          }
        }

        // 3. Critical path termination check
        if (entrypoints.length > 0 && flowMembers.size > 0) {
          const terminationIssues = GovernanceValidator.checkCriticalPathTermination(
            flowName,
            flowNodeId,
            entrypoints,
            flowMembers,
            outgoingEdges,
            nodeById,
          );
          issues.push(...terminationIssues);
        }
      }
    }

    return issues;
  }

  /**
   * Find flow nodes matching a critical flow name.
   * Matches by id, label, or symbol.
   */
  private static findFlowNodes(nodes: GraphNode[], flowName: string): string[] {
    const normalizedName = flowName.toLowerCase();
    return nodes
      .filter((n) => {
        if (n.type === 'flow' || n.type === 'domain' || n.type === 'cluster') {
          return (
            n.id.toLowerCase() === normalizedName ||
            n.label.toLowerCase() === normalizedName ||
            n.symbol?.toLowerCase() === normalizedName ||
            n.id.toLowerCase().includes(normalizedName) ||
            n.label.toLowerCase().includes(normalizedName)
          );
        }
        return false;
      })
      .map((n) => n.id);
  }

  /**
   * Find entrypoints that can reach the flow.
   * An entrypoint is reachable if there's a path from an entrypoint-type node
   * to any member of the flow.
   */
  private static findFlowEntrypoints(
    flowNodeId: string,
    flowMembers: Set<string>,
    nodes: GraphNode[],
    edges: GraphEdge[],
    nodeById: Map<string, GraphNode>,
  ): string[] {
    const entrypoints: string[] = [];

    // Find entrypoint nodes
    const entrypointNodes = nodes.filter(
      (n) =>
        ENTRYPOINT_NODE_TYPES.has(n.type) ||
        n.type.includes('entrypoint') ||
        n.type.includes('controller') ||
        n.type.includes('api_endpoint'),
    );

    // Check entry_of edges pointing to the flow
    for (const edge of edges) {
      if (edge.type === 'entry_of' && edge.to_id === flowNodeId) {
        entrypoints.push(edge.from_id);
      }
    }

    // Check if any entrypoint node is a member of the flow
    for (const ep of entrypointNodes) {
      if (flowMembers.has(ep.id)) {
        entrypoints.push(ep.id);
      }
    }

    // Check if any entrypoint can reach a flow member via control flow
    if (entrypoints.length === 0 && flowMembers.size > 0) {
      for (const ep of entrypointNodes) {
        if (GovernanceValidator.canReach(ep.id, flowMembers, edges)) {
          entrypoints.push(ep.id);
        }
      }
    }

    return [...new Set(entrypoints)];
  }

  /**
   * BFS to check if a source node can reach any target node via control flow edges.
   * Limited to prevent infinite traversal.
   */
  private static canReach(
    sourceId: string,
    targets: Set<string>,
    edges: GraphEdge[],
    maxDepth = 10,
  ): boolean {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: sourceId, depth: 0 }];

    // Build adjacency for BFS (only canonical/derived control flow)
    const adj = new Map<string, string[]>();
    for (const edge of edges) {
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;
      if (!CONTROL_FLOW_EDGE_TYPES.has(edge.type) && edge.type !== 'entry_of') continue;
      if (!adj.has(edge.from_id)) adj.set(edge.from_id, []);
      adj.get(edge.from_id)!.push(edge.to_id);
    }

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (targets.has(id)) return true;
      if (depth >= maxDepth) continue;
      if (visited.has(id)) continue;
      visited.add(id);

      const neighbors = adj.get(id) ?? [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      }
    }

    return false;
  }

  /**
   * Find dead branches in a critical flow.
   * A dead branch is a non-terminal node with no outgoing control flow edges.
   * Terminal nodes (nodes that are expected to be endpoints) are excluded.
   */
  private static findDeadBranches(
    flowMembers: Set<string>,
    outgoingEdges: Map<string, GraphEdge[]>,
    nodeById: Map<string, GraphNode>,
  ): string[] {
    const deadBranches: string[] = [];
    const TERMINAL_NODE_TYPES = new Set([
      'external_service',
      'queue',
      'job',
      'model',
      'entity',
      'dto',
      'response',
    ]);

    for (const memberId of flowMembers) {
      const node = nodeById.get(memberId);
      if (!node) continue;

      // Skip terminal node types (they're expected to have no outgoing edges)
      if (TERMINAL_NODE_TYPES.has(node.type)) continue;

      // Check if this node has any outgoing control flow edges
      const outgoing = outgoingEdges.get(memberId) ?? [];
      const hasControlFlowOut = outgoing.some((e) => CONTROL_FLOW_EDGE_TYPES.has(e.type));

      if (!hasControlFlowOut) {
        deadBranches.push(memberId);
      }
    }

    return deadBranches;
  }

  /**
   * Check that critical paths don't terminate unexpectedly.
   * A critical path terminates unexpectedly if it reaches a non-terminal node
   * that has no outgoing edges and is not at the expected end of the flow.
   */
  private static checkCriticalPathTermination(
    flowName: string,
    flowNodeId: string,
    entrypoints: string[],
    flowMembers: Set<string>,
    outgoingEdges: Map<string, GraphEdge[]>,
    nodeById: Map<string, GraphNode>,
  ): GovernanceIssue[] {
    const issues: GovernanceIssue[] = [];
    const TERMINAL_NODE_TYPES = new Set([
      'external_service',
      'queue',
      'job',
      'model',
      'entity',
      'dto',
      'response',
    ]);

    // For each entrypoint, trace the path and check for unexpected termination
    for (const entryId of entrypoints) {
      const visited = new Set<string>();
      const stack: string[] = [entryId];

      while (stack.length > 0) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const node = nodeById.get(currentId);
        if (!node) continue;

        // Skip if not a flow member (we only care about nodes in the critical flow)
        if (!flowMembers.has(currentId) && currentId !== entryId) continue;

        // Skip terminal nodes
        if (TERMINAL_NODE_TYPES.has(node.type)) continue;

        const outgoing = outgoingEdges.get(currentId) ?? [];
        const controlFlowOut = outgoing.filter((e) => CONTROL_FLOW_EDGE_TYPES.has(e.type));

        if (controlFlowOut.length === 0 && flowMembers.has(currentId)) {
          // This node terminates unexpectedly within the critical flow
          // Only report if it's not the only node (single-node flows are valid)
          if (flowMembers.size > 1) {
            // Check if this is a leaf that other nodes point to (expected terminal)
            const isExpectedTerminal = node.type.includes('service') ||
              node.type.includes('repository') ||
              node.type.includes('handler');

            if (!isExpectedTerminal) {
              issues.push({
                code: 'FLOW_INTEGRITY_VIOLATION',
                severity: 'error',
                nodeId: currentId,
                detail: `Critical path in flow '${flowName}' terminates unexpectedly at node '${currentId}' (${node.type})`,
                chainBreak: {
                  breakPoint: currentId,
                  expectedChain: [entryId, '...', currentId, '→', 'continuation'],
                  actualChain: [entryId, '...', currentId, '(terminated)'],
                  reason: 'Critical flow path ends at a non-terminal node without continuation',
                },
              });
            }
          }
        } else {
          // Continue traversal
          for (const edge of controlFlowOut) {
            if (!visited.has(edge.to_id)) {
              stack.push(edge.to_id);
            }
          }
        }
      }
    }

    return issues;
  }
}
