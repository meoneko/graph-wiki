/**
 * Validator — Pipeline Stage 04
 *
 * Validates normalized facts against quality and trust rules.
 * Enforces hard-fail and soft-warning policies per the design contract.
 *
 * Hard-Fail Conditions:
 * - Edges without type → INVALID_EDGE_TYPE
 * - Canonical nodes without authoritative provenance → CANONICAL_PROVENANCE_MISSING
 * - Canonical edges without deterministic parser evidence
 * - Invalid graph_kind values → INVALID_GRAPH_STATE
 * - Persisted external graph_kind when external workflow disabled → INVALID_GRAPH_STATE
 *
 * Soft Warnings:
 * - Low-confidence evidence
 * - Orphan nodes
 * - Flows without entrypoints
 * - Exploratory annotations in otherwise authoritative output
 *
 * Requirements: 3.3, 3.4, 3.5, 3.6, 18.4, 18.5, 18.6
 */

import type { CandidateRecord, NormalizedFact, RejectedRecord, GraphKind } from '../../core/types.js';
import { RuntimeCode } from '../../core/errors.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { AuthorityPolicyEngine } from '../../core/graph/policy/AuthorityPolicyEngine.js';
import { TRUST_POLICY_VERSION, TrustClassifier } from '../TrustClassifier.js';

// ─── Validation Result Types ─────────────────────────────────────────────────

export interface ValidationWarning {
  factId: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationFailure {
  factId: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  facts: NormalizedFact[];
  rejected: RejectedRecord[];
  warnings: ValidationWarning[];
  hardFailures: ValidationFailure[];
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface ValidatorOptions {
  /** Path to the authority policy YAML file (knowledge.config.yaml) */
  policyPath?: string;
  /** Whether the external workflow is enabled for this workspace */
  externalWorkflowEnabled?: boolean;
  /** Confidence threshold below which a low-confidence warning is emitted */
  lowConfidenceThreshold?: number;
}

// ─── Valid GraphKind Values ──────────────────────────────────────────────────

const VALID_GRAPH_KINDS: ReadonlySet<string> = new Set<GraphKind>([
  'canonical',
  'derived',
  'exploratory',
  'external',
]);

// ─── Validator Class ─────────────────────────────────────────────────────────

export class Validator {
  private readonly policyEngine: AuthorityPolicyEngine;
  private readonly externalWorkflowEnabled: boolean;
  private readonly lowConfidenceThreshold: number;

  constructor(options: ValidatorOptions = {}) {
    this.policyEngine = new AuthorityPolicyEngine(options.policyPath);
    this.externalWorkflowEnabled = options.externalWorkflowEnabled ?? false;
    this.lowConfidenceThreshold = options.lowConfidenceThreshold ?? 0.5;
  }

  /**
   * Validates normalized facts against quality and trust rules.
   * Returns validated facts, rejected records, warnings, and hard failures.
   *
   * Hard failures halt the pipeline with machine-readable error codes.
   */
  validate(facts: NormalizedFact[], workspaceId: string): ValidationResult {
    const validatedFacts: NormalizedFact[] = [];
    const rejected: RejectedRecord[] = [];
    const warnings: ValidationWarning[] = [];
    const hardFailures: ValidationFailure[] = [];

    // Track node IDs for orphan detection
    const nodeFactIds = new Set<string>();
    const edgeSourceIds = new Set<string>();
    const edgeTargetIds = new Set<string>();
    const entrypointFlowIds = new Set<string>();

    // First pass: classify facts and collect edge/node info
    for (const fact of facts) {
      const isEdgeFact = this.isEdgeFact(fact);

      if (isEdgeFact) {
        // Collect edge source/target for orphan detection
        const fromId = fact.lang_meta?.from_id as string | undefined;
        const toId = fact.lang_meta?.to_id as string | undefined;
        if (fromId) edgeSourceIds.add(fromId);
        if (toId) edgeTargetIds.add(toId);
      } else {
        nodeFactIds.add(fact.candidate_id);
        // Track entrypoints for flow detection
        if (fact.is_entrypoint) {
          entrypointFlowIds.add(fact.candidate_id);
        }
      }
    }

    // Second pass: validate each fact
    for (const fact of facts) {
      const isEdgeFact = this.isEdgeFact(fact);

      // ─── Hard-Fail: Invalid graph_kind ─────────────────────────────────
      const graphKind = this.resolveGraphKind(fact);
      if (graphKind && !VALID_GRAPH_KINDS.has(graphKind)) {
        hardFailures.push({
          factId: fact.candidate_id,
          code: RuntimeCode.INVALID_GRAPH_STATE,
          message: `Invalid graph_kind '${graphKind}' on fact '${fact.candidate_id}'`,
        });
        rejected.push(this.buildRejection(fact, workspaceId, RuntimeCode.INVALID_GRAPH_STATE,
          `Invalid graph_kind '${graphKind}'`));
        continue;
      }

      // ─── Hard-Fail: External graph_kind when external workflow disabled ─
      if (graphKind === 'external' && !this.externalWorkflowEnabled) {
        hardFailures.push({
          factId: fact.candidate_id,
          code: RuntimeCode.INVALID_GRAPH_STATE,
          message: `Persisted external graph_kind on fact '${fact.candidate_id}' but external workflow is disabled`,
        });
        rejected.push(this.buildRejection(fact, workspaceId, RuntimeCode.INVALID_GRAPH_STATE,
          'Persisted external graph_kind when external workflow is disabled'));
        continue;
      }

      // ─── Hard-Fail: Edge without type ──────────────────────────────────
      if (isEdgeFact) {
        const edgeType = this.resolveEdgeType(fact);
        if (!edgeType) {
          hardFailures.push({
            factId: fact.candidate_id,
            code: RuntimeCode.INVALID_EDGE_TYPE,
            message: `Edge fact '${fact.candidate_id}' has no type`,
          });
          rejected.push(this.buildRejection(fact, workspaceId, RuntimeCode.INVALID_EDGE_TYPE,
            'Edge without type'));
          continue;
        }
      }

      // ─── Trust Classification ──────────────────────────────────────────
      const classification = TrustClassifier.classify(fact.extractor);
      const isCanonicalEligible = this.policyEngine.isCanonicalEligible(fact);

      // ─── Hard-Fail: Canonical node without authoritative provenance ────
      // A fact is considered canonical-bound when its extractor classifies it
      // as AUTHORITATIVE. If it lacks provenance, that's a hard failure.
      if (!isEdgeFact && classification.trust_level === 'AUTHORITATIVE') {
        if (!this.hasAuthoritativeProvenance(fact)) {
          hardFailures.push({
            factId: fact.candidate_id,
            code: RuntimeCode.CANONICAL_PROVENANCE_MISSING,
            message: `Canonical node '${fact.candidate_id}' (${fact.symbol}) lacks authoritative provenance`,
          });
          rejected.push(this.buildRejection(fact, workspaceId, RuntimeCode.CANONICAL_PROVENANCE_MISSING,
            'Canonical node without authoritative provenance'));
          continue;
        }
      }

      // ─── Hard-Fail: Canonical edge without deterministic parser evidence
      if (isEdgeFact && classification.trust_level === 'AUTHORITATIVE') {
        if (!this.hasDeterministicParserEvidence(fact)) {
          hardFailures.push({
            factId: fact.candidate_id,
            code: RuntimeCode.CANONICAL_PROVENANCE_MISSING,
            message: `Canonical edge '${fact.candidate_id}' lacks deterministic parser evidence`,
          });
          rejected.push(this.buildRejection(fact, workspaceId, RuntimeCode.CANONICAL_PROVENANCE_MISSING,
            'Canonical edge without deterministic parser evidence'));
          continue;
        }
      }

      // ─── Soft Warning: Low-confidence evidence ─────────────────────────
      const confidence = (fact.lang_meta?.confidence_score as number | undefined) ?? 0.5;
      if (confidence < this.lowConfidenceThreshold) {
        warnings.push({
          factId: fact.candidate_id,
          code: 'LOW_CONFIDENCE',
          message: `Fact '${fact.candidate_id}' has low confidence (${confidence.toFixed(2)})`,
          severity: 'medium',
        });
      }

      // ─── Soft Warning: Exploratory annotations in authoritative output ─
      if (classification.trust_level === 'AUTHORITATIVE' && this.hasExploratoryAnnotations(fact)) {
        warnings.push({
          factId: fact.candidate_id,
          code: 'EXPLORATORY_IN_AUTHORITATIVE',
          message: `Fact '${fact.candidate_id}' has exploratory annotations in otherwise authoritative output`,
          severity: 'low',
        });
      }

      // ─── Reject unknown node types (preserve existing behavior) ────────
      if (!isEdgeFact && !nodeTypeRegistry.has(fact.candidate_type)) {
        rejected.push({
          id: `reject:${fact.candidate_id}`,
          workspace: workspaceId,
          project: fact.project,
          stage: 'validate',
          reason_code: 'UNKNOWN_NODE_TYPE',
          details: `candidate_type=${fact.candidate_type}`,
          source_file: fact.source_file,
          symbol: fact.symbol,
        });
        continue;
      }

      // ─── Fact passes validation — hydrate trust metadata ───────────────
      // Use AuthorityPolicyEngine to refine trust classification:
      // If the extractor says AUTHORITATIVE but policy says not eligible,
      // the fact is still validated but carries the policy assessment.
      const validatedFact: NormalizedFact = {
        ...fact,
        lang_meta: {
          ...(fact.lang_meta ?? {}),
          extractor: fact.extractor,
          trustPolicyVersion: TRUST_POLICY_VERSION,
          canonical_eligible: isCanonicalEligible,
        },
        fact_id: fact.fact_id || fact.candidate_id,
        status: 'validated',
        trust_level: classification.trust_level,
        decision_status: classification.decision_status,
      };

      validatedFacts.push(validatedFact);
    }

    // ─── Post-pass: Orphan node detection (soft warning) ─────────────────
    for (const fact of validatedFacts) {
      if (this.isEdgeFact(fact)) continue;
      const factId = fact.candidate_id;
      const isReferenced = edgeSourceIds.has(factId) || edgeTargetIds.has(factId);
      if (!isReferenced) {
        warnings.push({
          factId,
          code: 'ORPHAN_NODE',
          message: `Node '${factId}' (${fact.symbol}) is not connected to any edge`,
          severity: 'low',
        });
      }
    }

    // ─── Post-pass: Flows without entrypoints (soft warning) ─────────────
    const flowFacts = validatedFacts.filter((f) =>
      f.candidate_type === 'flow_domain' || f.candidate_type === 'flow'
    );
    // Warn once at workspace level when flows exist but no entrypoints are defined anywhere
    if (flowFacts.length > 0 && entrypointFlowIds.size === 0) {
      warnings.push({
        factId: workspaceId,
        code: 'FLOW_WITHOUT_ENTRYPOINT',
        message: `${flowFacts.length} flow(s) defined in workspace '${workspaceId}' but no entrypoints found`,
        severity: 'medium',
      });
    }

    return { facts: validatedFacts, rejected, warnings, hardFailures };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Determines if a fact represents an edge (vs a node).
   * Edge facts have edge-specific metadata like from_id/to_id or edgeType.
   */
  private isEdgeFact(fact: NormalizedFact): boolean {
    const meta = fact.lang_meta ?? {};
    return (
      meta.record_type === 'edge' ||
      meta.from_id !== undefined && meta.from_id !== null ||
      meta.to_id !== undefined && meta.to_id !== null ||
      meta.edge_type !== undefined && meta.edge_type !== null
    );
  }

  /**
   * Resolves the graph_kind for a fact from its metadata.
   * Returns undefined if no explicit graph_kind is set.
   */
  private resolveGraphKind(fact: NormalizedFact): string | undefined {
    return (fact.lang_meta?.graph_kind as string | undefined) ?? undefined;
  }

  /**
   * Resolves the edge type from a fact's metadata.
   */
  private resolveEdgeType(fact: NormalizedFact): string | undefined {
    const meta = fact.lang_meta ?? {};
    return (meta.edge_type as string | undefined) ??
      (meta.type as string | undefined) ??
      fact.candidate_type;
  }

  /**
   * Checks if a fact has authoritative provenance (parser-backed with source location).
   */
  private hasAuthoritativeProvenance(fact: NormalizedFact): boolean {
    // Check evidence spans for source file and line info
    if (fact.evidence && fact.evidence.length > 0) {
      return fact.evidence.some((e) => e.source_file && e.line_start != null);
    }

    // Check provenance_records in lang_meta
    const provenanceRecords = fact.lang_meta?.provenance_records as Array<{
      source?: string;
      file?: string;
      line_start?: number;
    }> | undefined;

    if (provenanceRecords && provenanceRecords.length > 0) {
      return provenanceRecords.some((p) =>
        (p.source === 'parser' || p.source === 'analysis') &&
        p.file && p.line_start != null
      );
    }

    // Fallback: check if source_file and line_start exist on the fact itself
    return Boolean(fact.source_file && fact.line_start != null);
  }

  /**
   * Checks if an edge fact has deterministic parser evidence.
   * Canonical edges require evidence from AST or static-analysis extractors.
   */
  private hasDeterministicParserEvidence(fact: NormalizedFact): boolean {
    const extractor = (fact.extractor ?? '').toLowerCase();
    const isDeterministic =
      extractor.includes('tree_sitter') ||
      extractor.includes('parser') ||
      extractor.includes('ast') ||
      extractor.includes('static');

    if (!isDeterministic) return false;

    // Also require some form of source evidence
    return this.hasAuthoritativeProvenance(fact);
  }

  /**
   * Checks if a fact has exploratory annotations mixed in.
   * This detects cases where an otherwise authoritative fact has
   * exploratory metadata attached.
   */
  private hasExploratoryAnnotations(fact: NormalizedFact): boolean {
    const annotations = fact.annotations ?? [];
    return annotations.some((a) =>
      a.toLowerCase().includes('exploratory') ||
      a.toLowerCase().includes('heuristic') ||
      a.toLowerCase().includes('inferred') ||
      a.toLowerCase().includes('uncertain')
    );
  }

  /**
   * Builds a RejectedRecord from a fact and reason.
   */
  private buildRejection(
    fact: NormalizedFact,
    workspaceId: string,
    reasonCode: string,
    details: string,
  ): RejectedRecord {
    return {
      id: `reject:${fact.candidate_id}`,
      workspace: workspaceId,
      project: fact.project,
      stage: 'validate',
      reason_code: reasonCode,
      details,
      source_file: fact.source_file,
      symbol: fact.symbol,
    };
  }
}

// ─── Pipeline Stage Entry Point ──────────────────────────────────────────────

/**
 * Pipeline stage entry point — validates normalized facts.
 *
 * Maintains backward compatibility with the existing pipeline signature
 * while implementing the full ValidationResult contract.
 *
 * When hard failures are detected, the pipeline halts with machine-readable error codes.
 */
export async function validateFacts(
  candidates: CandidateRecord[] | NormalizedFact[],
  workspaceId: string,
  db: GraphDB,
  options?: ValidatorOptions,
): Promise<{ facts: NormalizedFact[]; rejects: RejectedRecord[] }> {
  // Coerce CandidateRecords to NormalizedFact shape for backward compatibility
  const normalizedInput: NormalizedFact[] = candidates.map((c) => {
    if ('fact_id' in c && (c as NormalizedFact).fact_id) {
      return c as NormalizedFact;
    }
    // Minimal coercion for CandidateRecords that bypassed normalization
    return {
      ...c,
      fact_id: c.candidate_id,
    } as NormalizedFact;
  });

  const validator = new Validator(options);
  const result = validator.validate(normalizedInput, workspaceId);

  // Hard failures halt the pipeline
  if (result.hardFailures.length > 0) {
    const codes = result.hardFailures.map((f) => f.code);
    const messages = result.hardFailures.map((f) => f.message);
    throw new ValidationPipelineError(codes, messages);
  }

  // Persist validated facts to DB
  for (const fact of result.facts) {
    db.upsertFact(fact);
  }

  return { facts: result.facts, rejects: result.rejected };
}

// ─── Pipeline Error ──────────────────────────────────────────────────────────

/**
 * Error thrown when validation hard-fails, halting the pipeline.
 * Contains machine-readable error codes for programmatic handling.
 */
export class ValidationPipelineError extends Error {
  public readonly codes: string[];
  public readonly failures: string[];

  constructor(codes: string[], failures: string[]) {
    const summary = codes.length === 1
      ? `Validation hard-fail: ${codes[0]} — ${failures[0]}`
      : `Validation hard-fail: ${codes.length} failures [${[...new Set(codes)].join(', ')}]`;
    super(summary);
    this.name = 'ValidationPipelineError';
    this.codes = codes;
    this.failures = failures;
  }
}
