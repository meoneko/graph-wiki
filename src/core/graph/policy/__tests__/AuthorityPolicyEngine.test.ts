import { describe, it, expect } from 'vitest';
import { AuthorityPolicyEngine } from './AuthorityPolicyEngine.js';
import type { CanonicalFactRule, Evidence } from './AuthorityPolicyEngine.js';
import type { NormalizedFact, ReasoningPath } from '../../types.js';
import { DecisionStatus } from '../../errors.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeFact(overrides: Partial<NormalizedFact> = {}): NormalizedFact {
  return {
    candidate_id: 'test-candidate-1',
    candidate_type: 'function',
    workspaceId: 'ws-1',
    project: 'proj-1',
    source_file: 'src/utils.ts',
    symbol: 'doSomething',
    line_start: 10,
    line_end: 20,
    status: 'validated',
    extractor: 'ts_tree_sitter_parser',
    evidence: [
      {
        evidence_id: 'ev-1',
        source_file: 'src/utils.ts',
        line_start: 10,
        line_end: 20,
        excerpt: 'function doSomething()',
        role: 'source',
      },
    ],
    fact_id: 'fact-1',
    trust_level: 'AUTHORITATIVE',
    decision_status: 'OK',
    lang_meta: {
      extractor: 'ts_tree_sitter_parser',
      confidence_score: 0.9,
    },
    ...overrides,
  };
}

function makePath(overrides: Partial<ReasoningPath> = {}): ReasoningPath {
  return {
    path_id: 'path-1',
    nodes: [
      {
        id: 'node-1',
        stableKey: 'node-1',
        workspace: 'ws-1',
        project: 'proj-1',
        type: 'function',
        label: 'doSomething',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        provenance: {
          source: 'parser',
          artifact_source: 'src/utils.ts',
          producer_stage: 'extract',
          timestamp: '2024-01-01T00:00:00Z',
        },
      },
    ],
    edges: [],
    trust_level: 'AUTHORITATIVE',
    status: DecisionStatus.OK,
    summary: 'Test path',
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthorityPolicyEngine', () => {
  describe('constructor', () => {
    it('initializes with default policy when no path provided', () => {
      const engine = new AuthorityPolicyEngine();
      const policy = engine.getPolicy();

      expect(policy.version).toBe('1.0.0');
      expect(policy.canonicalFactRules.length).toBeGreaterThan(0);
      expect(policy.conflictResolution.defaultPriority).toBe(50);
      expect(policy.conflictResolution.samePriorityBehavior).toBe('deny-wins');
      expect(policy.conflictResolution.conflictingAllowDenyBehavior).toBe('deny-wins');
    });

    it('loads policy from YAML file when path provided', () => {
      // Uses the project's knowledge.config.yaml — may not have governance section
      const engine = new AuthorityPolicyEngine('knowledge.config.yaml');
      const policy = engine.getPolicy();
      // Should still have defaults even if YAML has no governance section
      expect(policy.canonicalFactRules.length).toBeGreaterThan(0);
    });

    it('keeps defaults when YAML file does not exist', () => {
      const engine = new AuthorityPolicyEngine('/nonexistent/path.yaml');
      const policy = engine.getPolicy();
      expect(policy.canonicalFactRules.length).toBeGreaterThan(0);
    });
  });

  describe('mergePolicy', () => {
    it('merges new rules on top of defaults using override-by-id', () => {
      const engine = new AuthorityPolicyEngine();
      engine.mergePolicy({
        canonicalFactRules: [
          {
            id: 'require-parser-provenance',
            effect: 'allow',
            factKind: '*',
            minConfidence: 0.9, // Override default 0.7
            priority: 50,
          },
        ],
      });

      const policy = engine.getPolicy();
      const rule = policy.canonicalFactRules.find((r) => r.id === 'require-parser-provenance');
      expect(rule?.minConfidence).toBe(0.9);
    });

    it('appends new rules that do not exist in base', () => {
      const engine = new AuthorityPolicyEngine();
      const initialCount = engine.getPolicy().canonicalFactRules.length;

      engine.mergePolicy({
        canonicalFactRules: [
          {
            id: 'custom-rule',
            effect: 'allow',
            factKind: 'api_endpoint',
            minConfidence: 0.85,
            priority: 60,
          },
        ],
      });

      expect(engine.getPolicy().canonicalFactRules.length).toBe(initialCount + 1);
    });

    it('overrides conflict resolution settings', () => {
      const engine = new AuthorityPolicyEngine();
      engine.mergePolicy({
        conflictResolution: {
          priorityRange: [0, 100],
          defaultPriority: 50,
          samePriorityBehavior: 'ambiguous',
          conflictingAllowDenyBehavior: 'ambiguous',
        },
      });

      const policy = engine.getPolicy();
      expect(policy.conflictResolution.samePriorityBehavior).toBe('ambiguous');
      expect(policy.conflictResolution.conflictingAllowDenyBehavior).toBe('ambiguous');
    });
  });

  describe('isCanonicalEligible', () => {
    it('allows facts with parser-backed extraction and provenance', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact();
      expect(engine.isCanonicalEligible(fact)).toBe(true);
    });

    it('denies facts extracted by AI', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact({
        extractor: 'ai_gemini_extractor',
        lang_meta: { extractor: 'ai_gemini_extractor', confidence_score: 0.95 },
      });
      expect(engine.isCanonicalEligible(fact)).toBe(false);
    });

    it('denies facts without provenance when required', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact({
        evidence: [],
      });
      expect(engine.isCanonicalEligible(fact)).toBe(false);
    });

    it('denies facts below minimum confidence', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact({
        lang_meta: { extractor: 'ts_tree_sitter_parser', confidence_score: 0.3 },
      });
      expect(engine.isCanonicalEligible(fact)).toBe(false);
    });

    it('returns false when no rules match the fact kind', () => {
      const engine = new AuthorityPolicyEngine();
      // Override to remove wildcard rules
      engine.mergePolicy({
        canonicalFactRules: [
          { id: 'require-parser-provenance', effect: 'allow', factKind: 'api_endpoint', priority: 50, disabled: true } as unknown as CanonicalFactRule,
          { id: 'deny-ai-canonical', effect: 'deny', factKind: 'api_endpoint', priority: 90, disabled: true } as unknown as CanonicalFactRule,
        ],
      });
      // Now add only a specific rule
      engine.mergePolicy({
        canonicalFactRules: [
          { id: 'only-endpoints', effect: 'allow', factKind: 'api_endpoint', priority: 50 },
        ],
      });

      const fact = makeFact({ candidate_type: 'unknown_type' });
      // No rules match 'unknown_type' — should deny
      expect(engine.isCanonicalEligible(fact)).toBe(false);
    });

    describe('conflictingAllowDenyBehavior takes precedence', () => {
      it('deny-wins when allow and deny rules both match', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'allow-functions',
              effect: 'allow',
              factKind: 'function',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              priority: 50,
            },
            {
              id: 'deny-all-functions',
              effect: 'deny',
              factKind: 'function',
              // No additional conditions — matches all functions
              priority: 50,
            },
          ],
          conflictResolution: {
            priorityRange: [0, 100],
            defaultPriority: 50,
            samePriorityBehavior: 'ambiguous',
            conflictingAllowDenyBehavior: 'deny-wins',
          },
        });

        // Both allow (parser-backed) and deny (all functions) match
        const fact = makeFact();
        expect(engine.isCanonicalEligible(fact)).toBe(false);
      });

      it('ambiguous behavior with priority comparison when conflictingAllowDenyBehavior is ambiguous', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'allow-functions',
              effect: 'allow',
              factKind: 'function',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              priority: 80, // Higher priority
            },
            {
              id: 'deny-all-functions',
              effect: 'deny',
              factKind: 'function',
              priority: 50, // Lower priority
            },
          ],
          conflictResolution: {
            priorityRange: [0, 100],
            defaultPriority: 50,
            samePriorityBehavior: 'deny-wins',
            conflictingAllowDenyBehavior: 'ambiguous',
          },
        });

        // Allow has higher priority — should allow
        const fact = makeFact();
        expect(engine.isCanonicalEligible(fact)).toBe(true);
      });

      it('same priority falls through to samePriorityBehavior', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'allow-functions',
              effect: 'allow',
              factKind: 'function',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              priority: 60,
            },
            {
              id: 'deny-all-functions',
              effect: 'deny',
              factKind: 'function',
              priority: 60, // Same priority
            },
          ],
          conflictResolution: {
            priorityRange: [0, 100],
            defaultPriority: 50,
            samePriorityBehavior: 'deny-wins',
            conflictingAllowDenyBehavior: 'ambiguous',
          },
        });

        // Same priority + samePriorityBehavior = deny-wins
        const fact = makeFact();
        expect(engine.isCanonicalEligible(fact)).toBe(false);
      });
    });

    describe('allowedSourceRoots and disallowedPatterns', () => {
      it('denies facts outside allowed source roots', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'require-parser-provenance',
              effect: 'allow',
              factKind: '*',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              allowedSourceRoots: ['src/core/', 'src/pipeline/'],
              priority: 50,
            },
          ],
        });

        // Fact from a disallowed root
        const fact = makeFact({ source_file: 'tests/helpers/mock.ts' });
        expect(engine.isCanonicalEligible(fact)).toBe(false);
      });

      it('allows facts within allowed source roots', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'require-parser-provenance',
              effect: 'allow',
              factKind: '*',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              allowedSourceRoots: ['src/'],
              priority: 50,
            },
          ],
        });

        const fact = makeFact({ source_file: 'src/utils.ts' });
        expect(engine.isCanonicalEligible(fact)).toBe(true);
      });

      it('denies facts matching disallowed patterns', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'require-parser-provenance',
              effect: 'allow',
              factKind: '*',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              disallowedPatterns: ['\\.test\\.ts$', '\\.spec\\.ts$'],
              priority: 50,
            },
          ],
        });

        const fact = makeFact({ source_file: 'src/utils.test.ts' });
        expect(engine.isCanonicalEligible(fact)).toBe(false);
      });

      it('allows facts not matching disallowed patterns', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'require-parser-provenance',
              effect: 'allow',
              factKind: '*',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              disallowedPatterns: ['\\.test\\.ts$'],
              priority: 50,
            },
          ],
        });

        const fact = makeFact({ source_file: 'src/utils.ts' });
        expect(engine.isCanonicalEligible(fact)).toBe(true);
      });
    });

    describe('wildcard vs specific factKind matching', () => {
      it('wildcard rules match any factKind', () => {
        const engine = new AuthorityPolicyEngine();
        // Default rules use factKind: '*' — should match 'api_endpoint'
        const fact = makeFact({ candidate_type: 'api_endpoint' });
        expect(engine.isCanonicalEligible(fact)).toBe(true);
      });

      it('specific factKind rules only match their kind', () => {
        const engine = new AuthorityPolicyEngine();
        engine.mergePolicy({
          canonicalFactRules: [
            // Disable wildcard rules
            { id: 'require-parser-provenance', effect: 'allow', factKind: '*', priority: 50, disabled: true } as unknown as CanonicalFactRule,
            { id: 'deny-ai-canonical', effect: 'deny', factKind: '*', priority: 90, disabled: true } as unknown as CanonicalFactRule,
            // Add specific rule
            {
              id: 'allow-endpoints-only',
              effect: 'allow',
              factKind: 'api_endpoint',
              requiredExtractionMethods: ['ast'],
              requiredProvenance: true,
              minConfidence: 0.7,
              priority: 50,
            },
          ],
        });

        // api_endpoint should match
        const endpointFact = makeFact({ candidate_type: 'api_endpoint' });
        expect(engine.isCanonicalEligible(endpointFact)).toBe(true);

        // function should NOT match (no rules for it → default deny)
        const functionFact = makeFact({ candidate_type: 'function' });
        expect(engine.isCanonicalEligible(functionFact)).toBe(false);
      });
    });

    describe('default deny-wins without explicit config', () => {
      it('uses deny-wins as default conflictingAllowDenyBehavior', () => {
        // Engine with default config — conflictingAllowDenyBehavior defaults to 'deny-wins'
        const engine = new AuthorityPolicyEngine();
        const policy = engine.getPolicy();
        expect(policy.conflictResolution.conflictingAllowDenyBehavior).toBe('deny-wins');

        // Add a deny rule that matches alongside the default allow rule
        engine.mergePolicy({
          canonicalFactRules: [
            {
              id: 'deny-functions-in-tests',
              effect: 'deny',
              factKind: 'function',
              priority: 50,
            },
          ],
        });

        // Both allow (require-parser-provenance) and deny (deny-functions-in-tests) match
        const fact = makeFact();
        expect(engine.isCanonicalEligible(fact)).toBe(false);
      });
    });
  });

  describe('resolveConflict', () => {
    it('returns OK for empty paths', () => {
      const engine = new AuthorityPolicyEngine();
      const result = engine.resolveConflict([]);
      expect(result.status).toBe(DecisionStatus.OK);
    });

    it('returns OK for single path', () => {
      const engine = new AuthorityPolicyEngine();
      const result = engine.resolveConflict([makePath()]);
      expect(result.status).toBe(DecisionStatus.OK);
      expect(result.selectedPaths).toHaveLength(1);
    });

    it('returns OK when paths agree', () => {
      const engine = new AuthorityPolicyEngine();
      const path1 = makePath({ path_id: 'p1' });
      const path2 = makePath({
        path_id: 'p2',
        nodes: path1.nodes, // Same terminal node
      });
      const result = engine.resolveConflict([path1, path2]);
      expect(result.status).toBe(DecisionStatus.OK);
    });

    it('returns AMBIGUOUS when paths have different statuses', () => {
      const engine = new AuthorityPolicyEngine();
      const path1 = makePath({ path_id: 'p1', status: DecisionStatus.OK });
      const path2 = makePath({ path_id: 'p2', status: DecisionStatus.PARTIAL });
      const result = engine.resolveConflict([path1, path2]);
      expect(result.status).toBe(DecisionStatus.AMBIGUOUS);
      expect(result.conflictingPaths).toHaveLength(2);
    });

    it('returns AMBIGUOUS when paths reach different terminal nodes', () => {
      const engine = new AuthorityPolicyEngine();
      const path1 = makePath({
        path_id: 'p1',
        nodes: [
          {
            id: 'node-a',
            stableKey: 'node-a',
            workspace: 'ws-1',
            project: 'proj-1',
            type: 'function',
            label: 'funcA',
            graph_kind: 'canonical',
            confidence_band: 'AUTHORITATIVE',
            provenance: { source: 'parser', artifact_source: 'a.ts', producer_stage: 'extract', timestamp: '' },
          },
        ],
      });
      const path2 = makePath({
        path_id: 'p2',
        nodes: [
          {
            id: 'node-b',
            stableKey: 'node-b',
            workspace: 'ws-1',
            project: 'proj-1',
            type: 'function',
            label: 'funcB',
            graph_kind: 'canonical',
            confidence_band: 'AUTHORITATIVE',
            provenance: { source: 'parser', artifact_source: 'b.ts', producer_stage: 'extract', timestamp: '' },
          },
        ],
      });
      const result = engine.resolveConflict([path1, path2]);
      expect(result.status).toBe(DecisionStatus.AMBIGUOUS);
      expect(result.reason).toContain('conflicting');
    });

    it('returns AMBIGUOUS when authoritative and exploratory paths conflict', () => {
      const engine = new AuthorityPolicyEngine();
      const path1 = makePath({ path_id: 'p1', trust_level: 'AUTHORITATIVE' });
      const path2 = makePath({ path_id: 'p2', trust_level: 'EXPLORATORY' });
      const result = engine.resolveConflict([path1, path2]);
      expect(result.status).toBe(DecisionStatus.AMBIGUOUS);
    });
  });

  describe('evaluatePromotion', () => {
    it('approves promotion with full canonical evidence', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'canonical',
          source: 'src/utils.ts',
          confidence: 0.95,
          provenance: {
            file: 'src/utils.ts',
            line_start: 10,
            line_end: 20,
            extraction_method: 'ast',
          },
        },
      ];

      const result = engine.evaluatePromotion(fact, evidence);
      expect(result.approved).toBe(true);
      expect(result.missingEvidence).toHaveLength(0);
    });

    it('denies promotion without canonical/derived evidence', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'exploratory',
          source: 'src/utils.ts',
          confidence: 0.8,
          provenance: {
            file: 'src/utils.ts',
            line_start: 10,
            line_end: 20,
            extraction_method: 'ast',
          },
        },
      ];

      const result = engine.evaluatePromotion(fact, evidence);
      expect(result.approved).toBe(false);
      expect(result.missingEvidence).toContain('independent_canonical_or_derived_source');
    });

    it('denies promotion without parser-backed extraction', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'canonical',
          source: 'src/utils.ts',
          confidence: 0.8,
          provenance: {
            file: 'src/utils.ts',
            line_start: 10,
            line_end: 20,
            extraction_method: 'regex', // Not parser-backed
          },
        },
      ];

      const result = engine.evaluatePromotion(fact, evidence);
      expect(result.approved).toBe(false);
      expect(result.missingEvidence).toContain('parser_backed_extraction');
    });

    it('denies promotion without complete provenance', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'canonical',
          source: 'src/utils.ts',
          confidence: 0.8,
          provenance: {
            extraction_method: 'ast',
            // Missing file and line_start
          },
        },
      ];

      const result = engine.evaluatePromotion(fact, evidence);
      expect(result.approved).toBe(false);
      expect(result.missingEvidence).toContain('provenance_complete');
    });

    it('accepts derived evidence as independent source', () => {
      const engine = new AuthorityPolicyEngine();
      const fact = makeFact();
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'derived',
          source: 'src/utils.ts',
          confidence: 0.85,
          provenance: {
            file: 'src/utils.ts',
            line_start: 10,
            line_end: 20,
            extraction_method: 'static-analysis',
          },
        },
      ];

      const result = engine.evaluatePromotion(fact, evidence);
      expect(result.approved).toBe(true);
    });
  });
});
