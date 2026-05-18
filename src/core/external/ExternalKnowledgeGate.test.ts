/**
 * Tests for ExternalKnowledgeGate
 *
 * Validates the external knowledge ingestion path:
 *   suggestion → validation → approval → exploratory storage → optional promotion
 *
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6
 */
import { describe, it, expect } from 'vitest';
import {
  ExternalKnowledgeGate,
  ExternalWorkflowDisabledError,
  type ExternalSuggestion,
} from './ExternalKnowledgeGate.js';
import type { GraphNode, NormalizedFact } from '../types.js';
import { RuntimeCode, PipelineError } from '../errors.js';
import type { Evidence } from '../graph/policy/AuthorityPolicyEngine.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeGate(enabled = true) {
  return new ExternalKnowledgeGate({ externalWorkflowEnabled: enabled });
}

function makeSuggestionInput() {
  return {
    workspaceId: 'ws-test',
    kind: 'service',
    label: 'PaymentService',
    symbol: 'PaymentService',
    suggestedBy: 'user:alice',
    reason: 'Observed in production logs',
  };
}

function makeEdgeSuggestionInput() {
  return {
    workspaceId: 'ws-test',
    kind: 'calls',
    label: 'OrderService calls PaymentService',
    suggestedBy: 'ai:copilot',
    reason: 'Inferred from code patterns',
    fromId: 'node:order-service',
    toId: 'node:payment-service',
    edgeType: 'calls',
  };
}

function makeExternalNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: 'ext-node:test',
    stableKey: null,
    workspace: 'ws-test',
    project: 'ws-test',
    type: 'service',
    label: 'TestService',
    graph_kind: 'external',
    confidence_band: 'AMBIGUOUS',
    trust_level: 'EXPLORATORY',
    provenance: {
      source: 'user',
      artifact_source: 'external-suggestion:user:alice',
      producer_stage: 'external-ingestion',
      timestamp: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

function makeNormalizedFact(overrides: Partial<NormalizedFact> = {}): NormalizedFact {
  return {
    candidate_id: 'fact-1',
    candidate_type: 'service',
    workspaceId: 'ws-test',
    project: 'ws-test',
    source_file: 'src/services/Payment.ts',
    symbol: 'PaymentService',
    line_start: 1,
    line_end: 50,
    status: 'validated',
    extractor: 'user_feedback',
    evidence: [],
    fact_id: 'fact-1',
    lang_meta: { graph_kind: 'external' },
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExternalKnowledgeGate', () => {
  describe('Requirement 22.1: Full ingestion path (suggestion → validation → approval → storage → promotion)', () => {
    it('completes the full ingestion path for a node suggestion', () => {
      const gate = makeGate(true);

      // Step 1: Suggest
      const suggestion = gate.suggest(makeSuggestionInput());
      expect(suggestion.status).toBe('pending');
      expect(suggestion.id).toMatch(/^ext-/);

      // Step 2: Validate
      const validation = gate.validate(suggestion);
      expect(validation.valid).toBe(true);
      expect(suggestion.status).toBe('validated');

      // Step 3: Approve
      const approval = gate.approve(suggestion, 'admin:bob', 'Verified in production');
      expect(approval.approved).toBe(true);
      expect(suggestion.status).toBe('approved');

      // Step 4: Store
      const result = gate.store(suggestion);
      expect(result.success).toBe(true);
      expect(result.node).toBeDefined();
      expect(result.node!.graph_kind).toBe('external');
      expect(result.node!.trust_level).toBe('EXPLORATORY');
      expect(suggestion.status).toBe('stored');
    });

    it('completes the full ingestion path for an edge suggestion', () => {
      const gate = makeGate(true);

      const suggestion = gate.suggest(makeEdgeSuggestionInput());
      expect(suggestion.status).toBe('pending');

      const validation = gate.validate(suggestion);
      expect(validation.valid).toBe(true);

      const approval = gate.approve(suggestion, 'admin:bob', 'Confirmed');
      expect(approval.approved).toBe(true);

      const result = gate.store(suggestion);
      expect(result.success).toBe(true);
      expect(result.edge).toBeDefined();
      expect(result.edge!.graph_kind).toBe('external');
      expect(result.edge!.trust_level).toBe('EXPLORATORY');
    });

    it('rejects storing a suggestion that has not been approved', () => {
      const gate = makeGate(true);
      const suggestion = gate.suggest(makeSuggestionInput());

      // Try to store without validation/approval
      const result = gate.store(suggestion);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('must be \'approved\' first');
    });

    it('rejects approving a suggestion that has not been validated', () => {
      const gate = makeGate(true);
      const suggestion = gate.suggest(makeSuggestionInput());

      // Try to approve without validation
      const approval = gate.approve(suggestion, 'admin', 'reason');
      expect(approval.approved).toBe(false);
      expect(approval.reason).toContain('must be \'validated\' first');
    });
  });

  describe('Requirement 22.2: External knowledge cannot directly enter canonical or derived layers', () => {
    it('blocks external source from entering canonical layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('canonical', 'user');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('blocks external source from entering derived layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('derived', 'user');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('blocks AI source from entering canonical layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('canonical', 'ai');
      expect(result.blocked).toBe(true);
    });

    it('allows parser source to enter canonical layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('canonical', 'parser');
      expect(result.blocked).toBe(false);
    });

    it('allows external source to enter exploratory layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('exploratory', 'user');
      expect(result.blocked).toBe(false);
    });

    it('stored external nodes always have graph_kind=external', () => {
      const gate = makeGate(true);
      const suggestion = gate.suggest(makeSuggestionInput());
      gate.validate(suggestion);
      gate.approve(suggestion, 'admin', 'ok');
      const result = gate.store(suggestion);

      expect(result.node!.graph_kind).toBe('external');
      // Never canonical or derived
      expect(result.node!.graph_kind).not.toBe('canonical');
      expect(result.node!.graph_kind).not.toBe('derived');
    });
  });

  describe('Requirement 22.3: Persisted external graph_kind triggers INVALID_GRAPH_STATE when disabled', () => {
    it('returns invalid when external graph_kind is persisted and workflow is disabled', () => {
      const result = ExternalKnowledgeGate.validateExternalGraphKind('external', false);
      expect(result.valid).toBe(false);
      expect(result.code).toBe(RuntimeCode.INVALID_GRAPH_STATE);
    });

    it('returns valid when external graph_kind is persisted and workflow is enabled', () => {
      const result = ExternalKnowledgeGate.validateExternalGraphKind('external', true);
      expect(result.valid).toBe(true);
    });

    it('returns valid for canonical graph_kind regardless of workflow state', () => {
      expect(ExternalKnowledgeGate.validateExternalGraphKind('canonical', false).valid).toBe(true);
      expect(ExternalKnowledgeGate.validateExternalGraphKind('canonical', true).valid).toBe(true);
    });

    it('throws when trying to suggest with workflow disabled', () => {
      const gate = makeGate(false);
      expect(() => gate.suggest(makeSuggestionInput())).toThrow(ExternalWorkflowDisabledError);
    });

    it('store fails when workflow is disabled', () => {
      const gate = makeGate(false);
      const suggestion: ExternalSuggestion = {
        ...makeSuggestionInput(),
        id: 'ext-test',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = gate.store(suggestion);
      expect(result.success).toBe(false);
      expect(result.codes).toContain(RuntimeCode.INVALID_GRAPH_STATE);
    });
  });

  describe('Requirement 22.4: External facts excluded from authoritative reasoning', () => {
    it('identifies external nodes as excluded from authoritative reasoning', () => {
      const node = makeExternalNode();
      expect(ExternalKnowledgeGate.isExcludedFromAuthoritativeReasoning(node)).toBe(true);
    });

    it('does not exclude canonical nodes from authoritative reasoning', () => {
      const node = makeExternalNode({ graph_kind: 'canonical' });
      expect(ExternalKnowledgeGate.isExcludedFromAuthoritativeReasoning(node)).toBe(false);
    });

    it('does not exclude derived nodes from authoritative reasoning', () => {
      const node = makeExternalNode({ graph_kind: 'derived' });
      expect(ExternalKnowledgeGate.isExcludedFromAuthoritativeReasoning(node)).toBe(false);
    });

    it('stored external facts have trust_level=EXPLORATORY (not AUTHORITATIVE)', () => {
      const gate = makeGate(true);
      const suggestion = gate.suggest(makeSuggestionInput());
      gate.validate(suggestion);
      gate.approve(suggestion, 'admin', 'ok');
      const result = gate.store(suggestion);

      expect(result.node!.trust_level).toBe('EXPLORATORY');
      expect(result.node!.confidence_band).toBe('AMBIGUOUS');
    });
  });

  describe('Requirement 22.5: Block auto-promotion of exploratory/external to canonical', () => {
    it('blocks auto-promotion from external to canonical', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('external', 'canonical');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('blocks auto-promotion from exploratory to canonical', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('exploratory', 'canonical');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('allows canonical to remain canonical', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('canonical', 'canonical');
      expect(result.blocked).toBe(false);
    });

    it('allows derived to remain derived', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('derived', 'derived');
      expect(result.blocked).toBe(false);
    });

    it('attemptPromotion denies without sufficient evidence', () => {
      const gate = makeGate(true);
      const fact = makeNormalizedFact();
      const evidence: Evidence[] = []; // No evidence

      const result = gate.attemptPromotion(fact, evidence);
      expect(result.promoted).toBe(false);
      expect(result.codes).toContain(PipelineError.CANONICAL_PROMOTION_DENIED);
      expect(result.missingEvidence).toBeDefined();
      expect(result.missingEvidence!.length).toBeGreaterThan(0);
    });

    it('attemptPromotion approves with full canonical evidence', () => {
      const gate = makeGate(true);
      const fact = makeNormalizedFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'canonical',
          source: 'parser',
          confidence: 0.95,
          provenance: {
            extraction_method: 'ast',
            file: 'src/services/Payment.ts',
            line_start: 1,
          },
        },
      ];

      const result = gate.attemptPromotion(fact, evidence);
      expect(result.promoted).toBe(true);
    });

    it('attemptPromotion fails when workflow is disabled', () => {
      const gate = makeGate(false);
      const fact = makeNormalizedFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'canonical',
          source: 'parser',
          confidence: 0.95,
          provenance: {
            extraction_method: 'ast',
            file: 'src/services/Payment.ts',
            line_start: 1,
          },
        },
      ];

      const result = gate.attemptPromotion(fact, evidence);
      expect(result.promoted).toBe(false);
      expect(result.codes).toContain(RuntimeCode.INVALID_GRAPH_STATE);
    });
  });

  describe('Requirement 22.6: Cannot override existing canonical truth without full rebuild', () => {
    it('external nodes never have canonical graph_kind', () => {
      const gate = makeGate(true);
      const suggestion = gate.suggest(makeSuggestionInput());
      gate.validate(suggestion);
      gate.approve(suggestion, 'admin', 'ok');
      const result = gate.store(suggestion);

      // The stored node is always external, never canonical
      expect(result.node!.graph_kind).toBe('external');
    });

    it('blockAutoPromotion prevents external from overriding canonical', () => {
      // This ensures that even if someone tries to promote external to canonical,
      // it's blocked unless going through the full promotion path
      const result = ExternalKnowledgeGate.blockAutoPromotion('external', 'canonical');
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('Auto-promotion');
    });
  });

  describe('Validation edge cases', () => {
    it('rejects suggestion without workspaceId', () => {
      const gate = makeGate(true);
      const suggestion = gate.suggest({ ...makeSuggestionInput(), workspaceId: '' });
      // Manually clear workspaceId to test validation
      suggestion.workspaceId = '';
      const result = gate.validate(suggestion);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Suggestion must have a workspaceId');
    });

    it('rejects edge suggestion without fromId', () => {
      const gate = makeGate(true);
      const input = makeEdgeSuggestionInput();
      delete (input as any).fromId;
      const suggestion = gate.suggest(input);
      suggestion.fromId = undefined;
      const result = gate.validate(suggestion);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Edge suggestion must have a fromId');
    });

    it('warns about suggestion without reason', () => {
      const gate = makeGate(true);
      const input = { ...makeSuggestionInput(), reason: '' };
      const suggestion = gate.suggest(input);
      suggestion.reason = '';
      const result = gate.validate(suggestion);
      expect(result.warnings).toContain('Suggestion has no reason — consider adding justification');
    });
  });
});
