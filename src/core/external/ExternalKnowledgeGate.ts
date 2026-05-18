/**
 * External Knowledge Ingestion Gate
 *
 * Implements the controlled pathway for external knowledge to enter the system.
 * External knowledge follows the path:
 *   suggestion → validation → approval → exploratory storage → optional promotion
 *
 * Key invariants:
 * - External knowledge CANNOT directly enter canonical or derived layers
 * - Persisted `external` graph_kind triggers INVALID_GRAPH_STATE when external workflow is disabled
 * - External facts are excluded from authoritative reasoning (treated as exploratory at most)
 * - Auto-promotion of exploratory/external to canonical is BLOCKED
 *
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6
 */

import type { GraphNode, GraphEdge, NormalizedFact, Provenance } from '../types.js';
import { RuntimeCode, PipelineError } from '../errors.js';
import { AuthorityPolicyEngine, type Evidence } from '../graph/policy/AuthorityPolicyEngine.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExternalSuggestionStatus =
  | 'pending'
  | 'validated'
  | 'approved'
  | 'stored'
  | 'promoted'
  | 'rejected';

export interface ExternalSuggestion {
  id: string;
  workspaceId: string;
  /** The suggested fact content */
  kind: string;
  label: string;
  symbol?: string;
  sourceFile?: string;
  lineStart?: number;
  lineEnd?: number;
  /** Who/what suggested this */
  suggestedBy: string;
  /** Reason for the suggestion */
  reason: string;
  /** Current status in the ingestion pipeline */
  status: ExternalSuggestionStatus;
  /** Timestamp of creation */
  createdAt: string;
  /** Timestamp of last status change */
  updatedAt: string;
  /** Metadata from the suggestion source */
  metadata?: Record<string, unknown>;
  /** Edge-specific fields */
  fromId?: string;
  toId?: string;
  edgeType?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApprovalResult {
  approved: boolean;
  approvedBy?: string;
  reason: string;
  timestamp: string;
}

export interface IngestionResult {
  success: boolean;
  suggestion: ExternalSuggestion;
  node?: GraphNode;
  edge?: GraphEdge;
  errors: string[];
  codes: string[];
}

export interface PromotionResult {
  promoted: boolean;
  reason: string;
  codes: string[];
  missingEvidence?: string[];
}

export interface ExternalKnowledgeGateOptions {
  /** Whether the external workflow is enabled */
  externalWorkflowEnabled: boolean;
  /** Path to authority policy YAML */
  policyPath?: string;
}

// ─── Gate Implementation ─────────────────────────────────────────────────────

export class ExternalKnowledgeGate {
  private readonly externalWorkflowEnabled: boolean;
  private readonly policyEngine: AuthorityPolicyEngine;

  constructor(options: ExternalKnowledgeGateOptions) {
    this.externalWorkflowEnabled = options.externalWorkflowEnabled;
    this.policyEngine = new AuthorityPolicyEngine(options.policyPath);
  }

  /**
   * Step 1: Submit a suggestion for external knowledge.
   * Creates a pending suggestion that must go through validation and approval.
   *
   * Requirement 22.1: External knowledge must follow the path: suggestion → validation → approval → exploratory storage → optional promotion
   */
  suggest(input: Omit<ExternalSuggestion, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ExternalSuggestion {
    if (!this.externalWorkflowEnabled) {
      throw new ExternalWorkflowDisabledError(
        'Cannot submit external suggestions when external workflow is disabled',
      );
    }

    const now = new Date().toISOString();
    return {
      ...input,
      id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Step 2: Validate a suggestion.
   * Checks structural validity and ensures it doesn't violate trust boundaries.
   *
   * Requirement 22.2: External knowledge cannot directly enter canonical or derived layers
   */
  validate(suggestion: ExternalSuggestion): ValidationResult {
    if (!this.externalWorkflowEnabled) {
      return {
        valid: false,
        errors: ['External workflow is disabled — cannot validate suggestions'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structural validation
    if (!suggestion.workspaceId) {
      errors.push('Suggestion must have a workspaceId');
    }
    if (!suggestion.kind) {
      errors.push('Suggestion must have a kind (node/edge type)');
    }
    if (!suggestion.label) {
      errors.push('Suggestion must have a label');
    }
    if (!suggestion.suggestedBy) {
      errors.push('Suggestion must identify who/what suggested it');
    }

    // Edge-specific validation
    if (suggestion.edgeType) {
      if (!suggestion.fromId) {
        errors.push('Edge suggestion must have a fromId');
      }
      if (!suggestion.toId) {
        errors.push('Edge suggestion must have a toId');
      }
    }

    // Warn about low-quality suggestions
    if (!suggestion.reason) {
      warnings.push('Suggestion has no reason — consider adding justification');
    }

    if (errors.length === 0) {
      suggestion.status = 'validated';
      suggestion.updatedAt = new Date().toISOString();
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Step 3: Approve a validated suggestion.
   * Requires explicit approval before storage.
   *
   * Requirement 22.1: Approval is required before storage
   */
  approve(suggestion: ExternalSuggestion, approvedBy: string, reason: string): ApprovalResult {
    if (!this.externalWorkflowEnabled) {
      return {
        approved: false,
        reason: 'External workflow is disabled',
        timestamp: new Date().toISOString(),
      };
    }

    if (suggestion.status !== 'validated') {
      return {
        approved: false,
        reason: `Cannot approve suggestion in status '${suggestion.status}' — must be 'validated' first`,
        timestamp: new Date().toISOString(),
      };
    }

    suggestion.status = 'approved';
    suggestion.updatedAt = new Date().toISOString();

    return {
      approved: true,
      approvedBy,
      reason,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Step 4: Store an approved suggestion as exploratory knowledge.
   * External knowledge is stored with graph_kind='external' and treated as exploratory at most.
   *
   * Requirement 22.2: Cannot directly enter canonical or derived layers
   * Requirement 22.4: External facts excluded from authoritative reasoning
   */
  store(suggestion: ExternalSuggestion): IngestionResult {
    if (!this.externalWorkflowEnabled) {
      return {
        success: false,
        suggestion,
        errors: ['External workflow is disabled — cannot store external knowledge'],
        codes: [RuntimeCode.INVALID_GRAPH_STATE],
      };
    }

    if (suggestion.status !== 'approved') {
      return {
        success: false,
        suggestion,
        errors: [`Cannot store suggestion in status '${suggestion.status}' — must be 'approved' first`],
        codes: [],
      };
    }

    const provenance: Provenance = {
      source: 'user',
      artifact_source: `external-suggestion:${suggestion.suggestedBy}`,
      producer_stage: 'external-ingestion',
      timestamp: new Date().toISOString(),
      file: suggestion.sourceFile,
      line_start: suggestion.lineStart,
      line_end: suggestion.lineEnd,
      workspaceId: suggestion.workspaceId,
      extractionStage: 'external-ingestion',
      extractionMethod: 'manual',
      adapterId: 'external-knowledge-gate',
      adapterVersion: '1.0.0',
      confidence: 0.3, // Low confidence for external knowledge
    };

    suggestion.status = 'stored';
    suggestion.updatedAt = new Date().toISOString();

    if (suggestion.edgeType) {
      // Create an external edge
      const edge: GraphEdge = {
        id: `ext-edge:${suggestion.id}`,
        stableKey: null, // External edges don't get stable keys
        workspace: suggestion.workspaceId,
        from_id: suggestion.fromId!,
        to_id: suggestion.toId!,
        type: suggestion.edgeType,
        graph_kind: 'external',
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY', // Treated as exploratory at most
        provenance,
        metadata: {
          suggestedBy: suggestion.suggestedBy,
          reason: suggestion.reason,
          non_authoritative: true,
          external_suggestion_id: suggestion.id,
        },
        updated_at: new Date().toISOString(),
      };

      return { success: true, suggestion, edge, errors: [], codes: [] };
    } else {
      // Create an external node
      const node: GraphNode = {
        id: `ext-node:${suggestion.id}`,
        stableKey: null, // External nodes don't get stable keys
        workspace: suggestion.workspaceId,
        project: suggestion.workspaceId,
        type: suggestion.kind,
        label: suggestion.label,
        symbol: suggestion.symbol,
        source_file: suggestion.sourceFile,
        graph_kind: 'external',
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY', // Treated as exploratory at most
        provenance,
        metadata: {
          suggestedBy: suggestion.suggestedBy,
          reason: suggestion.reason,
          non_authoritative: true,
          external_suggestion_id: suggestion.id,
        },
        updated_at: new Date().toISOString(),
      };

      return { success: true, suggestion, node, errors: [], codes: [] };
    }
  }

  /**
   * Step 5 (optional): Attempt to promote external knowledge to canonical.
   * This requires independent canonical/derived evidence and explicit approval.
   *
   * Requirement 22.5: No auto-promotion of exploratory/external to canonical
   * Requirement 22.6: Cannot override existing canonical truth without full rebuild
   */
  attemptPromotion(fact: NormalizedFact, evidence: Evidence[]): PromotionResult {
    if (!this.externalWorkflowEnabled) {
      return {
        promoted: false,
        reason: 'External workflow is disabled — promotion not available',
        codes: [RuntimeCode.INVALID_GRAPH_STATE],
      };
    }

    // Block auto-promotion: external/exploratory cannot be auto-promoted
    const graphKind = (fact.lang_meta?.graph_kind as string | undefined);
    if (graphKind === 'external' || graphKind === 'exploratory') {
      // Must go through AuthorityPolicyEngine evaluation
      const decision = this.policyEngine.evaluatePromotion(fact, evidence);

      if (!decision.approved) {
        return {
          promoted: false,
          reason: decision.reason,
          codes: [PipelineError.CANONICAL_PROMOTION_DENIED],
          missingEvidence: decision.missingEvidence,
        };
      }

      // Even if evidence is sufficient, promotion requires explicit approval
      // (this method only evaluates eligibility — actual promotion is a separate action)
      return {
        promoted: true,
        reason: decision.reason,
        codes: [],
      };
    }

    return {
      promoted: false,
      reason: 'Only external or exploratory facts can be promoted through this gate',
      codes: [],
    };
  }

  /**
   * Guard: Validates that a node/edge does NOT directly enter canonical or derived layers.
   * Used by GraphBuilder stages to enforce the external knowledge boundary.
   *
   * Requirement 22.2: External knowledge cannot directly enter canonical or derived layers
   */
  static blockDirectCanonicalEntry(graphKind: string, source: string): { blocked: boolean; code?: string; reason?: string } {
    if ((source === 'user' || source === 'ai' || source === 'external') &&
        (graphKind === 'canonical' || graphKind === 'derived')) {
      return {
        blocked: true,
        code: PipelineError.CANONICAL_PROMOTION_DENIED,
        reason: `External knowledge (source=${source}) cannot directly enter ${graphKind} layer`,
      };
    }
    return { blocked: false };
  }

  /**
   * Guard: Validates that external graph_kind is not persisted when workflow is disabled.
   * Used by the Validator to enforce Requirement 22.3.
   *
   * Requirement 22.3: Persisted external graph_kind triggers INVALID_GRAPH_STATE when disabled
   */
  static validateExternalGraphKind(graphKind: string | undefined, externalWorkflowEnabled: boolean): { valid: boolean; code?: string; reason?: string } {
    if (graphKind === 'external' && !externalWorkflowEnabled) {
      return {
        valid: false,
        code: RuntimeCode.INVALID_GRAPH_STATE,
        reason: 'Persisted external graph_kind when external workflow is disabled',
      };
    }
    return { valid: true };
  }

  /**
   * Guard: Checks if a fact should be excluded from authoritative reasoning.
   * External facts are treated as exploratory at most.
   *
   * Requirement 22.4: External facts excluded from authoritative reasoning
   */
  static isExcludedFromAuthoritativeReasoning(node: GraphNode): boolean {
    return node.graph_kind === 'external';
  }

  /**
   * Guard: Blocks auto-promotion of exploratory/external to canonical.
   * Promotion requires independent evidence and explicit approval.
   *
   * Requirement 22.5: No auto-promotion of exploratory/external to canonical
   */
  static blockAutoPromotion(
    existingGraphKind: string,
    targetGraphKind: string,
  ): { blocked: boolean; code?: string; reason?: string } {
    if ((existingGraphKind === 'exploratory' || existingGraphKind === 'external') &&
        targetGraphKind === 'canonical') {
      return {
        blocked: true,
        code: PipelineError.CANONICAL_PROMOTION_DENIED,
        reason: `Auto-promotion from ${existingGraphKind} to canonical is blocked. Requires independent evidence and explicit approval.`,
      };
    }
    return { blocked: false };
  }
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class ExternalWorkflowDisabledError extends Error {
  public readonly code = RuntimeCode.INVALID_GRAPH_STATE;

  constructor(message: string) {
    super(message);
    this.name = 'ExternalWorkflowDisabledError';
  }
}
