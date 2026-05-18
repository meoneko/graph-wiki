/**
 * AgentContextBuilder — Assembles bounded, trust-aware context packages for AI agents.
 *
 * Queries TrustAwareQueryEngine directly via OperationResolver (does NOT depend on
 * StructuredAskEngine at build time). Only ReportBuilder.writeAgentContextReadiness()
 * (Sprint 6) assesses readiness.
 *
 * Default query mode: canonical_only (authoritative).
 * When mixed_safe is explicitly requested, includes EXPLORATORY_USED warning.
 *
 * Deterministic ranking order:
 *   1. Exact id/symbol match
 *   2. Exact label match
 *   3. Source file/route match
 *   4. Domain/project match
 *   5. FTS fallback match
 *
 * Output limits (configurable per-request and per-workspace):
 *   - Default max 20 nodes, max 40 edges, max 5 suggestions
 *   - Emits GRAPH_RESULT_TRUNCATED when output is truncated
 *
 * @see Requirements 10.1, 10.2, 10.3, 10.4, 10.7
 */

import type {
  GraphNode,
  GraphEdge,
  QueryMode,
  OperationType,
  Provenance,
} from '../types.js';
import { OperationResolver } from '../graph/query/OperationResolver.js';
import { TrustAwareQueryEngine } from '../graph/query/TrustAwareQueryEngine.js';
import { EdgePolicyTable } from '../graph/traversal/EdgePolicyTable.js';

import type {
  AgentContextQuery,
  AgentContextPackage,
  SourceReference,
  Invariant,
  RiskItem,
  VerificationChecklistItem,
  ForbiddenAssumption,
  ToolSuggestion,
} from './types.js';

// Re-export types for backward compatibility
export type {
  AgentContextQuery,
  AgentContextPackage,
  SourceReference,
  Invariant,
  RiskItem,
  VerificationChecklistItem,
  ForbiddenAssumption,
  ToolSuggestion,
} from './types.js';

// ─── Default limits ──────────────────────────────────────────────────────────

const DEFAULT_MAX_NODES = 20;
const DEFAULT_MAX_EDGES = 40;
const DEFAULT_MAX_SUGGESTIONS = 5;

// ─── Ranking tiers ───────────────────────────────────────────────────────────

const enum RankTier {
  EXACT_ID_SYMBOL = 0,
  EXACT_LABEL = 1,
  SOURCE_FILE_ROUTE = 2,
  DOMAIN_PROJECT = 3,
  FTS_FALLBACK = 4,
}

// ─── AgentContextBuilder ─────────────────────────────────────────────────────

export class AgentContextBuilder {
  constructor(
    private readonly engineFactory: (workspaceId: string) => TrustAwareQueryEngine,
  ) {}

  /**
   * Build a bounded, trust-aware context package for an AI agent.
   */
  async build(query: AgentContextQuery): Promise<AgentContextPackage> {
    // Resolve operation via OperationResolver with 'agent-context' caller
    const operation = OperationResolver.resolve({
      caller: 'agent-context',
      requested: null,
    });

    // Default to canonical_only (authoritative) mode
    const mode: QueryMode = query.mode ?? 'authoritative';

    // Resolve output limits
    const maxNodes = query.limits?.maxNodes ?? DEFAULT_MAX_NODES;
    const maxEdges = query.limits?.maxEdges ?? DEFAULT_MAX_EDGES;
    const maxSuggestions = query.limits?.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS;

    // Get the workspace-scoped query engine
    const engine = this.engineFactory(query.workspace);

    // Query the visible graph
    let visibleGraph: { nodes: GraphNode[]; edges: GraphEdge[] };
    try {
      visibleGraph = await engine.getVisibleGraph(operation, mode);
    } catch (error) {
      // Handle policy violations and workspace boundary errors
      return this.buildErrorPackage(query, error);
    }

    // If no graph data available, return insufficient_context
    if (visibleGraph.nodes.length === 0) {
      return this.buildPackage(query, mode, [], [], {
        status: 'insufficient_context',
        codes: ['GRAPH_QUERY_INSUFFICIENT_CONTEXT'],
        warnings: mode === 'mixed_safe' ? ['EXPLORATORY_USED'] : [],
      });
    }

    // Rank nodes deterministically
    const rankedNodes = this.rankNodes(visibleGraph.nodes, query.task);

    // Apply node limit
    const truncatedNodes = rankedNodes.length > maxNodes;
    const selectedNodes = rankedNodes.slice(0, maxNodes);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Select edges connecting selected nodes
    const relevantEdges = visibleGraph.edges.filter(
      (e) => selectedNodeIds.has(e.from_id) && selectedNodeIds.has(e.to_id),
    );
    const truncatedEdges = relevantEdges.length > maxEdges;
    const selectedEdges = relevantEdges.slice(0, maxEdges);

    // Determine status
    const truncated = truncatedNodes || truncatedEdges;
    const codes: string[] = [];
    const warnings: string[] = [];

    if (truncated) {
      codes.push('GRAPH_RESULT_TRUNCATED');
    }

    if (mode === 'mixed_safe') {
      warnings.push('EXPLORATORY_USED');
      codes.push('EXPLORATORY_USED');
    }

    // Determine overall status
    let status: AgentContextPackage['status'] = 'ready';
    if (selectedNodes.length === 0) {
      status = 'insufficient_context';
    } else if (truncated) {
      status = 'partial';
    }

    return this.buildPackage(query, mode, selectedNodes, selectedEdges, {
      status,
      codes,
      warnings,
      maxSuggestions,
    });
  }

  /**
   * Rank nodes using deterministic priority:
   *   1. Exact id/symbol match
   *   2. Exact label match
   *   3. Source file/route match
   *   4. Domain/project match
   *   5. FTS fallback match (substring in any searchable field)
   *
   * Within each tier, nodes are sorted lexicographically by id for determinism.
   */
  private rankNodes(nodes: GraphNode[], task: string): GraphNode[] {
    const normalizedTask = task.toLowerCase();
    const taskTokens = normalizedTask.split(/\s+/).filter((t) => t.length > 0);

    const scored = nodes.map((node) => ({
      node,
      tier: this.computeRankTier(node, normalizedTask, taskTokens),
    }));

    // Sort by tier (ascending = higher priority first), then lexicographic by id
    scored.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.node.id.localeCompare(b.node.id);
    });

    return scored.map((s) => s.node);
  }

  /**
   * Compute the ranking tier for a node based on the task description.
   */
  private computeRankTier(node: GraphNode, normalizedTask: string, taskTokens: string[]): RankTier {
    const nodeId = node.id.toLowerCase();
    const nodeSymbol = (node.symbol ?? '').toLowerCase();
    const nodeLabel = node.label.toLowerCase();
    const nodeSourceFile = (node.source_file ?? '').toLowerCase();
    const nodeHttpPath = (node.http_path ?? '').toLowerCase();
    const nodeDomain = (node.domain ?? '').toLowerCase();
    const nodeProject = node.project.toLowerCase();

    // Tier 1: Exact id/symbol match — task contains the exact id or symbol
    if (normalizedTask.includes(nodeId) || (nodeSymbol && normalizedTask.includes(nodeSymbol))) {
      return RankTier.EXACT_ID_SYMBOL;
    }

    // Tier 2: Exact label match — task contains the exact label
    if (nodeLabel && normalizedTask.includes(nodeLabel)) {
      return RankTier.EXACT_LABEL;
    }

    // Tier 3: Source file/route match — any task token matches source file or http path
    if (nodeSourceFile || nodeHttpPath) {
      for (const token of taskTokens) {
        if (token.length < 3) continue; // Skip very short tokens
        if (nodeSourceFile.includes(token) || nodeHttpPath.includes(token)) {
          return RankTier.SOURCE_FILE_ROUTE;
        }
      }
    }

    // Tier 4: Domain/project match — any task token matches domain or project
    if (nodeDomain || nodeProject) {
      for (const token of taskTokens) {
        if (token.length < 3) continue;
        if (nodeDomain.includes(token) || nodeProject.includes(token)) {
          return RankTier.DOMAIN_PROJECT;
        }
      }
    }

    // Tier 5: FTS fallback — any task token appears as substring in any searchable field
    const searchableFields = [nodeId, nodeSymbol, nodeLabel, nodeSourceFile, nodeHttpPath, nodeDomain, nodeProject];
    for (const token of taskTokens) {
      if (token.length < 3) continue;
      for (const field of searchableFields) {
        if (field && field.includes(token)) {
          return RankTier.FTS_FALLBACK;
        }
      }
    }

    // No match — still FTS_FALLBACK tier but will sort after matching nodes
    return RankTier.FTS_FALLBACK;
  }

  /**
   * Build the full AgentContextPackage from selected nodes and edges.
   */
  private buildPackage(
    query: AgentContextQuery,
    mode: QueryMode,
    nodes: GraphNode[],
    edges: GraphEdge[],
    opts: {
      status: AgentContextPackage['status'];
      codes: string[];
      warnings: string[];
      maxSuggestions?: number;
    },
  ): AgentContextPackage {
    // Extract relevant files from nodes
    const relevantFiles = this.extractRelevantFiles(nodes);

    // Collect provenance from all nodes and edges
    const provenance = this.collectProvenance(nodes, edges);

    // Generate suggestions (limited)
    const maxSuggestions = opts.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS;
    const suggestions = this.generateSuggestions(nodes, edges, query.task, maxSuggestions);

    // Generate invariants from graph evidence
    const invariants = this.collectInvariants(nodes, edges);

    // Generate risk assessment from impact analysis
    const risks = this.assessRisks(nodes, edges);

    // Generate verification checklist
    const verification_checklist = this.generateVerificationChecklist(nodes, edges, relevantFiles);

    // Generate forbidden assumptions from policy constraints
    const forbidden_assumptions = this.collectForbiddenAssumptions(nodes, edges, mode);

    return {
      workspaceId: query.workspace,
      task: query.task,
      status: opts.status,
      nodes,
      edges,
      relevantFiles,
      invariants,
      risks,
      verification_checklist,
      forbidden_assumptions,
      suggestions,
      codes: opts.codes,
      warnings: opts.warnings,
      provenance,
    };
  }

  /**
   * Build an error package when the engine throws (e.g., workspace boundary violation).
   */
  private buildErrorPackage(query: AgentContextQuery, error: unknown): AgentContextPackage {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isPolicy = errorMessage.includes('WORKSPACE_BOUNDARY_VIOLATION') ||
                     errorMessage.includes('POLICY_VIOLATION') ||
                     errorMessage.includes('INVALID_GRAPH_STATE');

    return {
      workspaceId: query.workspace,
      task: query.task,
      status: isPolicy ? 'policy_blocked' : 'insufficient_context',
      nodes: [],
      edges: [],
      relevantFiles: [],
      invariants: [],
      risks: [],
      verification_checklist: [],
      forbidden_assumptions: [],
      suggestions: [],
      codes: isPolicy ? ['POLICY_VIOLATION'] : ['GRAPH_QUERY_INSUFFICIENT_CONTEXT'],
      warnings: [errorMessage],
      provenance: [],
    };
  }

  /**
   * Extract source file references from nodes.
   */
  private extractRelevantFiles(nodes: GraphNode[]): SourceReference[] {
    const fileMap = new Map<string, SourceReference>();

    for (const node of nodes) {
      if (node.source_file) {
        const key = `${node.source_file}:${node.provenance?.line_start ?? ''}`;
        if (!fileMap.has(key)) {
          fileMap.set(key, {
            filePath: node.source_file,
            lineStart: node.provenance?.line_start,
            lineEnd: node.provenance?.line_end,
            reason: `Contains ${node.type} "${node.label}"`,
          });
        }
      }
    }

    return [...fileMap.values()].sort((a, b) => a.filePath.localeCompare(b.filePath));
  }

  /**
   * Collect unique provenance entries from nodes and edges.
   */
  private collectProvenance(nodes: GraphNode[], edges: GraphEdge[]): Provenance[] {
    const seen = new Set<string>();
    const result: Provenance[] = [];

    for (const item of [...nodes, ...edges]) {
      if (item.provenance) {
        const key = JSON.stringify(item.provenance);
        if (!seen.has(key)) {
          seen.add(key);
          result.push(item.provenance);
        }
      }
    }

    return result.sort((a, b) => {
      const aKey = `${a.artifact_source}:${a.producer_stage}`;
      const bKey = `${b.artifact_source}:${b.producer_stage}`;
      return aKey.localeCompare(bKey);
    });
  }

  /**
   * Generate tool suggestions based on graph evidence.
   * Only suggests tools when there is concrete graph evidence supporting the suggestion.
   */
  private generateSuggestions(
    nodes: GraphNode[],
    edges: GraphEdge[],
    task: string,
    maxSuggestions: number,
  ): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = [];

    // Suggest impact analysis for entrypoint nodes
    const entrypoints = nodes.filter((n) =>
      n.type === 'entrypoint' || n.type === 'api_endpoint' || n.type === 'controller_action',
    );
    if (entrypoints.length > 0) {
      suggestions.push({
        tool: 'impact_analysis',
        reason: `${entrypoints.length} entrypoint(s) found in context — analyze downstream impact`,
        args: { nodeIds: entrypoints.slice(0, 3).map((n) => n.id) },
      });
    }

    // Suggest callers lookup for functions/methods with incoming edges
    const callableNodes = nodes.filter((n) =>
      n.type === 'function' || n.type === 'method' || n.type === 'usecase',
    );
    if (callableNodes.length > 0 && suggestions.length < maxSuggestions) {
      suggestions.push({
        tool: 'find_callers',
        reason: `${callableNodes.length} callable(s) found — discover upstream callers`,
        args: { symbols: callableNodes.slice(0, 3).map((n) => n.symbol ?? n.label) },
      });
    }

    // Suggest blast radius for nodes with many outgoing edges
    const highFanOut = nodes.filter((n) =>
      edges.filter((e) => e.from_id === n.id).length >= 3,
    );
    if (highFanOut.length > 0 && suggestions.length < maxSuggestions) {
      suggestions.push({
        tool: 'blast_radius',
        reason: `${highFanOut.length} node(s) with high fan-out — assess change blast radius`,
        args: { nodeIds: highFanOut.slice(0, 3).map((n) => n.id) },
      });
    }

    return suggestions.slice(0, maxSuggestions);
  }

  // ─── Invariants ──────────────────────────────────────────────────────────────

  /**
   * Collect invariants from hard-rules, authority-policy, graph-policy, workspace-policy,
   * preset, process, and manual sources.
   *
   * Invariants are system-level rules that must hold true. They are derived from:
   * - Hard rules: fundamental graph integrity constraints
   * - Authority policy: rules governing canonical fact eligibility
   * - Graph policy: structural rules about graph relationships
   */
  private collectInvariants(nodes: GraphNode[], edges: GraphEdge[]): Invariant[] {
    const invariants: Invariant[] = [];

    // Hard-rule invariants — always present, fundamental graph integrity
    invariants.push({
      id: 'hard-rule-no-exploratory-in-canonical',
      source: 'hard-rule',
      severity: 'hard',
      category: 'graph',
      description: 'No exploratory facts in canonical layer',
      verificationHint: 'Check that no node/edge with graph_kind=exploratory appears in canonical output',
    });

    invariants.push({
      id: 'hard-rule-node-id-uniqueness',
      source: 'hard-rule',
      severity: 'hard',
      category: 'graph',
      description: 'Node ID uniqueness across workspace',
      verificationHint: 'Verify no duplicate node IDs exist in the workspace graph',
    });

    invariants.push({
      id: 'hard-rule-canonical-parser-provenance',
      source: 'hard-rule',
      severity: 'hard',
      category: 'authority',
      description: 'Canonical nodes require parser provenance',
      verificationHint: 'Verify all canonical nodes have provenance.source = parser',
    });

    // Authority-policy invariants — derived from canonical fact rules
    // These apply when canonical nodes are present in the context
    const hasCanonicalNodes = nodes.some((n) => n.graph_kind === 'canonical');
    if (hasCanonicalNodes) {
      invariants.push({
        id: 'authority-policy-canonical-eligibility',
        source: 'authority-policy',
        severity: 'hard',
        category: 'authority',
        description: 'Canonical facts must satisfy authority policy eligibility rules',
        appliesTo: nodes.filter((n) => n.graph_kind === 'canonical').map((n) => n.id),
        verificationHint: 'Verify canonical nodes pass AuthorityPolicyEngine.isCanonicalEligible()',
      });

      invariants.push({
        id: 'authority-policy-no-silent-promotion',
        source: 'authority-policy',
        severity: 'hard',
        category: 'authority',
        description: 'No silent promotion from exploratory to canonical without explicit approval',
        verificationHint: 'Verify no exploratory-to-canonical upgrades occurred without audit trail',
      });
    }

    // Graph-policy invariants — structural rules about graph relationships
    const hasDerivedEdges = edges.some((e) => e.graph_kind === 'derived');
    if (hasDerivedEdges) {
      invariants.push({
        id: 'graph-policy-no-derived-from-derived',
        source: 'graph-policy',
        severity: 'hard',
        category: 'graph',
        description: 'No derived-from-derived without versioned rule',
        appliesTo: edges.filter((e) => e.graph_kind === 'derived').map((e) => e.id),
        verificationHint: 'Verify derived edges have explicit derivation_rule in metadata',
      });
    }

    invariants.push({
      id: 'graph-policy-no-silent-trust-upgrade',
      source: 'graph-policy',
      severity: 'hard',
      category: 'graph',
      description: 'No silent trust upgrade',
      verificationHint: 'Verify no trust_level changes occurred without explicit validation rule',
    });

    // Workspace-policy invariant — workspace isolation
    invariants.push({
      id: 'workspace-policy-isolation',
      source: 'workspace-policy',
      severity: 'hard',
      category: 'workspace',
      description: 'Workspace isolation: no cross-workspace data access without explicit policy',
      verificationHint: 'Verify all nodes belong to the same workspace',
    });

    return invariants;
  }

  // ─── Risk Assessment ─────────────────────────────────────────────────────────

  /**
   * Assess risks based on impact analysis of relevant nodes.
   *
   * Risk levels:
   * - High: nodes with high fan-out (changes affect many downstream consumers)
   * - Medium: entrypoint nodes (public surface area exposed to external callers)
   * - Low: nodes with exploratory edges (uncertain connections)
   */
  private assessRisks(nodes: GraphNode[], edges: GraphEdge[]): RiskItem[] {
    const risks: RiskItem[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    // High risk: nodes with high fan-out (>=3 outgoing edges)
    const fanOutCounts = new Map<string, number>();
    for (const edge of edges) {
      if (nodeIds.has(edge.from_id)) {
        fanOutCounts.set(edge.from_id, (fanOutCounts.get(edge.from_id) ?? 0) + 1);
      }
    }

    const highFanOutNodes = nodes.filter((n) => (fanOutCounts.get(n.id) ?? 0) >= 3);
    if (highFanOutNodes.length > 0) {
      risks.push({
        id: 'risk-high-fan-out',
        severity: 'high',
        description: `${highFanOutNodes.length} node(s) with high fan-out — changes affect many downstream consumers`,
        relatedNodes: highFanOutNodes.map((n) => n.id),
        relatedFiles: [...new Set(highFanOutNodes.map((n) => n.source_file).filter(Boolean))] as string[],
      });
    }

    // Medium risk: entrypoint nodes (public surface area)
    const entrypointNodes = nodes.filter(
      (n) => n.type === 'entrypoint' || n.type === 'api_endpoint' || n.type === 'controller_action',
    );
    if (entrypointNodes.length > 0) {
      risks.push({
        id: 'risk-entrypoints',
        severity: 'medium',
        description: `${entrypointNodes.length} entrypoint(s) in context — public surface area exposed to external callers`,
        relatedNodes: entrypointNodes.map((n) => n.id),
        relatedFiles: [...new Set(entrypointNodes.map((n) => n.source_file).filter(Boolean))] as string[],
      });
    }

    // Low risk: nodes with exploratory edges (uncertain connections)
    const exploratoryEdgeNodeIds = new Set<string>();
    for (const edge of edges) {
      if (edge.graph_kind === 'exploratory') {
        if (nodeIds.has(edge.from_id)) exploratoryEdgeNodeIds.add(edge.from_id);
        if (nodeIds.has(edge.to_id)) exploratoryEdgeNodeIds.add(edge.to_id);
      }
    }

    if (exploratoryEdgeNodeIds.size > 0) {
      risks.push({
        id: 'risk-exploratory-edges',
        severity: 'low',
        description: `${exploratoryEdgeNodeIds.size} node(s) connected via exploratory edges — uncertain connections`,
        relatedNodes: [...exploratoryEdgeNodeIds],
      });
    }

    return risks;
  }

  // ─── Verification Checklist ──────────────────────────────────────────────────

  /**
   * Generate verification checklist from impact, policy, preset, test-coverage,
   * manual, and drift sources.
   */
  private generateVerificationChecklist(
    nodes: GraphNode[],
    edges: GraphEdge[],
    relevantFiles: SourceReference[],
  ): VerificationChecklistItem[] {
    const checklist: VerificationChecklistItem[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Impact: verify downstream consumers are not broken
    const nodesWithDownstream = nodes.filter((n) =>
      edges.some((e) => e.from_id === n.id),
    );
    if (nodesWithDownstream.length > 0) {
      checklist.push({
        id: 'verify-impact-downstream',
        source: 'impact',
        required: true,
        description: 'Verify downstream consumers are not broken',
        relatedNodes: nodesWithDownstream.map((n) => n.id),
        relatedFiles: [...new Set(nodesWithDownstream.map((n) => n.source_file).filter(Boolean))] as string[],
      });
    }

    // Policy: ensure no canonical provenance is missing
    const canonicalNodes = nodes.filter((n) => n.graph_kind === 'canonical');
    if (canonicalNodes.length > 0) {
      checklist.push({
        id: 'verify-policy-provenance',
        source: 'policy',
        required: true,
        description: 'Ensure no canonical provenance is missing',
        relatedNodes: canonicalNodes.map((n) => n.id),
      });
    }

    // Test-coverage: run tests for affected modules
    if (relevantFiles.length > 0) {
      checklist.push({
        id: 'verify-test-coverage',
        source: 'test-coverage',
        required: true,
        description: 'Run tests for affected modules',
        command: 'npm test',
        expectedSignal: 'All tests pass',
        relatedFiles: relevantFiles.map((f) => f.filePath),
      });
    }

    return checklist;
  }

  // ─── Forbidden Assumptions ───────────────────────────────────────────────────

  /**
   * Collect forbidden assumptions from policy constraints.
   * These are things the agent must NOT assume when working with the context.
   */
  private collectForbiddenAssumptions(
    nodes: GraphNode[],
    edges: GraphEdge[],
    mode: QueryMode,
  ): ForbiddenAssumption[] {
    const assumptions: ForbiddenAssumption[] = [];

    // Always present: exploratory edges are not reliable
    const hasExploratoryEdges = edges.some((e) => e.graph_kind === 'exploratory');
    if (hasExploratoryEdges || mode === 'mixed_safe') {
      assumptions.push({
        id: 'forbidden-exploratory-reliability',
        severity: 'hard',
        description: 'Do not assume exploratory edges are reliable',
        reason: 'Exploratory edges are heuristic/AI-assisted and may be incorrect',
        relatedPolicy: 'graph-policy',
      });
    }

    // Cross-workspace data is not accessible
    assumptions.push({
      id: 'forbidden-cross-workspace-access',
      severity: 'hard',
      description: 'Do not assume cross-workspace data is accessible',
      reason: 'Workspace isolation enforces strict boundaries between workspace graphs',
      relatedPolicy: 'workspace-policy',
    });

    // Cannot modify canonical facts without parser evidence
    const hasCanonicalNodes = nodes.some((n) => n.graph_kind === 'canonical');
    if (hasCanonicalNodes) {
      assumptions.push({
        id: 'forbidden-canonical-modification',
        severity: 'hard',
        description: 'Do not modify canonical facts without parser evidence',
        reason: 'Canonical layer requires deterministic parser extraction with full provenance',
        relatedPolicy: 'authority-policy',
      });
    }

    return assumptions;
  }
}
