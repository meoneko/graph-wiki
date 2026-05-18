/**
 * Trust enforcement utilities for the GraphBuilder substeps.
 *
 * Enforces the following invariants (Requirements 4.1–4.8, 6.1–6.7):
 * - Node ID uniqueness across workspace
 * - Canonical nodes require parser provenance
 * - Derived nodes/edges require derivation rule
 * - Exploratory nodes/edges flagged as non-authoritative
 * - External nodes/edges gated and auditable
 * - No derived-from-derived unless rule is versioned, deterministic, and auditable
 * - No exploratory-to-canonical silent upgrade
 * - No AI writing directly into canonical layer
 */
import type { GraphNode, GraphEdge, NormalizedFact, Provenance } from '../../core/types.js';
import { PipelineError, RuntimeCode } from '../../core/errors.js';

export interface EnforcementViolation {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  factId?: string;
}

export interface EnforcementResult {
  passed: boolean;
  violations: EnforcementViolation[];
}

// ── Node ID Uniqueness ──────────────────────────────────────────────────────

/**
 * Validates that all node IDs are unique within the provided set.
 * Requirement 6.2: Node ID uniqueness across workspace.
 */
export function enforceNodeIdUniqueness(nodes: GraphNode[]): EnforcementResult {
  const violations: EnforcementViolation[] = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (seen.has(node.id)) {
      violations.push({
        code: PipelineError.GRAPH_BUILD_FAILED,
        message: `Duplicate node ID detected: "${node.id}". Node IDs must be unique across workspace.`,
        nodeId: node.id,
      });
    }
    seen.add(node.id);
  }

  return { passed: violations.length === 0, violations };
}

// ── Canonical Enforcement ───────────────────────────────────────────────────

/** Valid parser provenance sources for canonical nodes. */
const PARSER_PROVENANCE_SOURCES: ReadonlySet<Provenance['source']> = new Set(['parser']);

/**
 * Validates that a canonical node has parser provenance.
 * Requirement 6.3: Canonical nodes require parser provenance.
 * Requirement 4.8: No AI writing directly into canonical layer.
 */
export function enforceCanonicalProvenance(node: GraphNode): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (node.graph_kind !== 'canonical') {
    return { passed: true, violations: [] };
  }

  // Block AI provenance in canonical layer
  if (node.provenance.source === 'ai') {
    violations.push({
      code: RuntimeCode.CANONICAL_PROVENANCE_MISSING,
      message: `Canonical node "${node.id}" has AI provenance. AI cannot write directly into the canonical layer.`,
      nodeId: node.id,
    });
    return { passed: false, violations };
  }

  // Require parser provenance
  if (!PARSER_PROVENANCE_SOURCES.has(node.provenance.source)) {
    violations.push({
      code: RuntimeCode.CANONICAL_PROVENANCE_MISSING,
      message: `Canonical node "${node.id}" requires parser provenance but has source="${node.provenance.source}".`,
      nodeId: node.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Validates that a fact intended for canonical promotion has parser provenance.
 * Requirement 4.2: Canonical facts only when backed by deterministic parser extraction.
 * Requirement 4.8: No AI writing directly into canonical layer.
 */
export function enforceCanonicalFactProvenance(fact: NormalizedFact): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  // Block AI-sourced facts from canonical
  const extractor = String(fact.lang_meta?.extractor ?? fact.extractor ?? '').toLowerCase();
  if (extractor.includes('ai') || extractor.includes('llm') || extractor.includes('heuristic')) {
    violations.push({
      code: RuntimeCode.CANONICAL_PROVENANCE_MISSING,
      message: `Fact "${fact.candidate_id}" has AI/heuristic extractor "${extractor}". AI cannot write directly into the canonical layer.`,
      factId: fact.candidate_id,
    });
  }

  return { passed: violations.length === 0, violations };
}

// ── Derived Enforcement ─────────────────────────────────────────────────────

/**
 * Validates that a derived node/edge has a derivation rule recorded.
 * Requirement 6.4: Derived nodes and edges require derivation rule.
 */
export function enforceDerivedRule(edge: GraphEdge): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (edge.graph_kind !== 'derived') {
    return { passed: true, violations: [] };
  }

  const hasRule = edge.provenance.rule
    || edge.metadata?.derivation_rule
    || edge.provenance.producer_stage;

  if (!hasRule) {
    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Derived edge "${edge.id}" requires a derivation rule but none was recorded.`,
      edgeId: edge.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Validates that a derived node has a derivation rule in its provenance.
 * Requirement 6.4: Derived nodes require derivation rule.
 */
export function enforceDerivedNodeRule(node: GraphNode): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (node.graph_kind !== 'derived') {
    return { passed: true, violations: [] };
  }

  const hasRule = node.provenance.rule || node.provenance.producer_stage;

  if (!hasRule) {
    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Derived node "${node.id}" requires a derivation rule but none was recorded.`,
      nodeId: node.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Blocks derived-from-derived computation unless the derivation rule is
 * explicitly versioned, deterministic, and auditable.
 * Requirement 4.6: No derived-from-derived unless rule is versioned, deterministic, and auditable.
 */
export interface DerivedFromDerivedContext {
  ruleVersion?: string;
  isDeterministic?: boolean;
  isAuditable?: boolean;
}

export function enforceDerivedFromDerived(
  sourceNode: GraphNode,
  targetEdge: GraphEdge,
  context?: DerivedFromDerivedContext,
): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  // Only applies when source is derived and target edge is also derived
  if (sourceNode.graph_kind !== 'derived' || targetEdge.graph_kind !== 'derived') {
    return { passed: true, violations: [] };
  }

  const hasVersion = context?.ruleVersion != null && context.ruleVersion.length > 0;
  const isDeterministic = context?.isDeterministic === true;
  const isAuditable = context?.isAuditable === true;

  if (!hasVersion || !isDeterministic || !isAuditable) {
    const missing: string[] = [];
    if (!hasVersion) missing.push('versioned');
    if (!isDeterministic) missing.push('deterministic');
    if (!isAuditable) missing.push('auditable');

    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Derived-from-derived edge "${targetEdge.id}" blocked: derivation rule must be ${missing.join(', ')}.`,
      edgeId: targetEdge.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

// ── Exploratory Enforcement ─────────────────────────────────────────────────

/**
 * Validates that exploratory nodes/edges are flagged as non-authoritative.
 * Requirement 6.5: Exploratory nodes and edges flagged as non-authoritative.
 */
export function enforceExploratoryNonAuthoritative(node: GraphNode): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (node.graph_kind !== 'exploratory') {
    return { passed: true, violations: [] };
  }

  if (node.trust_level === 'AUTHORITATIVE') {
    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Exploratory node "${node.id}" cannot have AUTHORITATIVE trust level.`,
      nodeId: node.id,
    });
  }

  if (node.confidence_band === 'AUTHORITATIVE') {
    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Exploratory node "${node.id}" cannot have AUTHORITATIVE confidence band.`,
      nodeId: node.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Validates that exploratory edges are flagged as non-authoritative.
 * Requirement 6.5: Exploratory edges flagged as non-authoritative.
 */
export function enforceExploratoryEdgeNonAuthoritative(edge: GraphEdge): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (edge.graph_kind !== 'exploratory') {
    return { passed: true, violations: [] };
  }

  if (edge.trust_level === 'AUTHORITATIVE') {
    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Exploratory edge "${edge.id}" cannot have AUTHORITATIVE trust level.`,
      edgeId: edge.id,
    });
  }

  if (edge.confidence_band === 'AUTHORITATIVE') {
    violations.push({
      code: PipelineError.GRAPH_BUILD_FAILED,
      message: `Exploratory edge "${edge.id}" cannot have AUTHORITATIVE confidence band.`,
      edgeId: edge.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Blocks exploratory-to-canonical silent upgrade.
 * Requirement 4.7: No exploratory facts overwriting or silently upgrading to canonical.
 */
export function enforceNoExploratoryUpgrade(
  existingNode: GraphNode | undefined,
  newNode: GraphNode,
): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (!existingNode) {
    return { passed: true, violations: [] };
  }

  // Block upgrade from exploratory to canonical
  if (existingNode.graph_kind === 'exploratory' && newNode.graph_kind === 'canonical') {
    violations.push({
      code: PipelineError.CANONICAL_PROMOTION_DENIED,
      message: `Node "${newNode.id}" cannot be silently upgraded from exploratory to canonical. Promotion requires explicit approval.`,
      nodeId: newNode.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

// ── External Enforcement ────────────────────────────────────────────────────

/**
 * Validates that external nodes/edges are gated and auditable.
 * Requirement 6.6: External nodes and edges gated and auditable.
 */
export function enforceExternalGated(node: GraphNode): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (node.graph_kind !== 'external') {
    return { passed: true, violations: [] };
  }

  // External nodes must have provenance with audit trail
  if (!node.provenance.timestamp) {
    violations.push({
      code: RuntimeCode.INVALID_GRAPH_STATE,
      message: `External node "${node.id}" must have a timestamp for audit trail.`,
      nodeId: node.id,
    });
  }

  if (!node.provenance.source) {
    violations.push({
      code: RuntimeCode.INVALID_GRAPH_STATE,
      message: `External node "${node.id}" must have a provenance source for audit trail.`,
      nodeId: node.id,
    });
  }

  // External nodes cannot be AUTHORITATIVE
  if (node.trust_level === 'AUTHORITATIVE') {
    violations.push({
      code: RuntimeCode.INVALID_GRAPH_STATE,
      message: `External node "${node.id}" cannot have AUTHORITATIVE trust level.`,
      nodeId: node.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Validates that external edges are gated and auditable.
 * Requirement 6.6: External edges gated and auditable.
 */
export function enforceExternalEdgeGated(edge: GraphEdge): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  if (edge.graph_kind !== 'external') {
    return { passed: true, violations: [] };
  }

  if (!edge.provenance.timestamp) {
    violations.push({
      code: RuntimeCode.INVALID_GRAPH_STATE,
      message: `External edge "${edge.id}" must have a timestamp for audit trail.`,
      edgeId: edge.id,
    });
  }

  if (!edge.provenance.source) {
    violations.push({
      code: RuntimeCode.INVALID_GRAPH_STATE,
      message: `External edge "${edge.id}" must have a provenance source for audit trail.`,
      edgeId: edge.id,
    });
  }

  if (edge.trust_level === 'AUTHORITATIVE') {
    violations.push({
      code: RuntimeCode.INVALID_GRAPH_STATE,
      message: `External edge "${edge.id}" cannot have AUTHORITATIVE trust level.`,
      edgeId: edge.id,
    });
  }

  return { passed: violations.length === 0, violations };
}

// ── Aggregate Enforcement ───────────────────────────────────────────────────

/**
 * Collects all violations from multiple enforcement results.
 */
export function collectViolations(...results: EnforcementResult[]): EnforcementResult {
  const violations = results.flatMap((r) => r.violations);
  return { passed: violations.length === 0, violations };
}

/**
 * Throws a GRAPH_BUILD_FAILED error if any violations exist.
 */
export function throwOnViolations(result: EnforcementResult, stage: string): void {
  if (!result.passed) {
    const messages = result.violations.map((v) => `[${v.code}] ${v.message}`).join('\n');
    throw new Error(
      `[${PipelineError.GRAPH_BUILD_FAILED}] Trust enforcement failed in ${stage}:\n${messages}`,
    );
  }
}
