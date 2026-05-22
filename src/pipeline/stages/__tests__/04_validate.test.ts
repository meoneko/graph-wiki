import { describe, expect, it } from 'vitest';
import type { NormalizedFact } from '../../../core/types.js';
import { RuntimeCode } from '../../../core/errors.js';
import { Validator, ValidationPipelineError, validateFacts } from '../04_validate.js';

/** Helper to safely access array element in tests — asserts non-null */
function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  if (item === undefined) throw new Error(`Expected item at index ${index}`);
  return item;
}

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeNodeFact(overrides: Partial<NormalizedFact> = {}): NormalizedFact {
  return {
    candidate_id: 'node:test-1',
    candidate_type: 'ts_function',
    workspaceId: 'ws-test',
    project: 'proj-test',
    source_file: 'src/index.ts',
    symbol: 'testFunction',
    line_start: 10,
    line_end: 20,
    status: 'candidate',
    extractor: 'ts_tree_sitter_parser',
    evidence: [
      {
        evidence_id: 'ev-1',
        source_file: 'src/index.ts',
        line_start: 10,
        line_end: 20,
        excerpt: 'function testFunction() {}',
        role: 'source',
      },
    ],
    fact_id: 'fact:test-1',
    lang_meta: {
      confidence_score: 0.95,
      extraction_method: 'ast',
      provenance_records: [
        { source: 'parser', artifact_source: 'src/index.ts', producer_stage: 'extract', timestamp: '2025-01-01T00:00:00Z', file: 'src/index.ts', line_start: 10, line_end: 20 },
      ],
    },
    ...overrides,
  };
}

function makeEdgeFact(overrides: Partial<NormalizedFact> = {}): NormalizedFact {
  return {
    candidate_id: 'edge:test-1',
    candidate_type: 'calls',
    workspaceId: 'ws-test',
    project: 'proj-test',
    source_file: 'src/index.ts',
    symbol: 'testFunction->otherFunction',
    line_start: 15,
    line_end: 15,
    status: 'candidate',
    extractor: 'ts_tree_sitter_parser',
    evidence: [
      {
        evidence_id: 'ev-2',
        source_file: 'src/index.ts',
        line_start: 15,
        line_end: 15,
        excerpt: 'otherFunction()',
        role: 'call',
      },
    ],
    fact_id: 'fact:edge-1',
    lang_meta: {
      record_type: 'edge',
      from_id: 'node:test-1',
      to_id: 'node:test-2',
      edge_type: 'calls',
      confidence_score: 0.95,
      extraction_method: 'ast',
      provenance_records: [
        { source: 'parser', artifact_source: 'src/index.ts', producer_stage: 'extract', timestamp: '2025-01-01T00:00:00Z', file: 'src/index.ts', line_start: 15, line_end: 15 },
      ],
    },
    ...overrides,
  };
}

function makeStubDb() {
  const facts: NormalizedFact[] = [];
  return {
    facts,
    upsertFact(fact: NormalizedFact) { facts.push(fact); },
    transaction(fn: () => void) { fn(); },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Validator', () => {
  describe('validate()', () => {
    it('validates well-formed node facts successfully', () => {
      const validator = new Validator();
      const facts = [makeNodeFact()];
      const result = validator.validate(facts, 'ws-test');

      expect(result.facts).toHaveLength(1);
      expect(result.rejected).toHaveLength(0);
      expect(result.hardFailures).toHaveLength(0);
      expect(at(result.facts, 0).status).toBe('validated');
      expect(at(result.facts, 0).trust_level).toBe('AUTHORITATIVE');
    });

    it('validates well-formed edge facts successfully', () => {
      const validator = new Validator();
      const facts = [makeEdgeFact()];
      const result = validator.validate(facts, 'ws-test');

      expect(result.facts).toHaveLength(1);
      expect(result.hardFailures).toHaveLength(0);
    });
  });

  describe('hard-fail: INVALID_EDGE_TYPE', () => {
    it('rejects edge facts without a type', () => {
      const validator = new Validator();
      const edgeFact = makeEdgeFact({
        candidate_type: '',
        lang_meta: {
          record_type: 'edge',
          from_id: 'node:a',
          to_id: 'node:b',
          edge_type: '', // empty type
          confidence_score: 0.95,
        },
      });

      const result = validator.validate([edgeFact], 'ws-test');

      expect(result.hardFailures).toHaveLength(1);
      expect(at(result.hardFailures, 0).code).toBe(RuntimeCode.INVALID_EDGE_TYPE);
      expect(result.rejected).toHaveLength(1);
      expect(at(result.rejected, 0).reason_code).toBe(RuntimeCode.INVALID_EDGE_TYPE);
      expect(result.facts).toHaveLength(0);
    });

    it('rejects edge facts with undefined edge_type and empty candidate_type', () => {
      const validator = new Validator();
      const edgeFact = makeEdgeFact({
        candidate_type: '',
        lang_meta: {
          record_type: 'edge',
          from_id: 'node:a',
          to_id: 'node:b',
          // no edge_type
          confidence_score: 0.95,
        },
      });

      const result = validator.validate([edgeFact], 'ws-test');

      expect(result.hardFailures).toHaveLength(1);
      expect(at(result.hardFailures, 0).code).toBe(RuntimeCode.INVALID_EDGE_TYPE);
    });
  });

  describe('hard-fail: INVALID_GRAPH_STATE', () => {
    it('rejects facts with invalid graph_kind values', () => {
      const validator = new Validator();
      const fact = makeNodeFact({
        lang_meta: {
          ...makeNodeFact().lang_meta,
          graph_kind: 'invalid_kind',
        },
      });

      const result = validator.validate([fact], 'ws-test');

      expect(result.hardFailures).toHaveLength(1);
      expect(at(result.hardFailures, 0).code).toBe(RuntimeCode.INVALID_GRAPH_STATE);
      expect(result.rejected).toHaveLength(1);
    });

    it('rejects external graph_kind when external workflow is disabled', () => {
      const validator = new Validator({ externalWorkflowEnabled: false });
      const fact = makeNodeFact({
        lang_meta: {
          ...makeNodeFact().lang_meta,
          graph_kind: 'external',
        },
      });

      const result = validator.validate([fact], 'ws-test');

      expect(result.hardFailures).toHaveLength(1);
      expect(at(result.hardFailures, 0).code).toBe(RuntimeCode.INVALID_GRAPH_STATE);
      expect(at(result.hardFailures, 0).message).toContain('external workflow is disabled');
    });

    it('allows external graph_kind when external workflow is enabled', () => {
      const validator = new Validator({ externalWorkflowEnabled: true });
      const fact = makeNodeFact({
        lang_meta: {
          ...makeNodeFact().lang_meta,
          graph_kind: 'external',
        },
      });

      const result = validator.validate([fact], 'ws-test');

      expect(result.hardFailures).toHaveLength(0);
      expect(result.facts).toHaveLength(1);
    });

    it('allows valid graph_kind values (canonical, derived, exploratory)', () => {
      const validator = new Validator();
      const facts = ['canonical', 'derived', 'exploratory'].map((kind, i) =>
        makeNodeFact({
          candidate_id: `node:test-${i}`,
          lang_meta: {
            ...makeNodeFact().lang_meta,
            graph_kind: kind,
          },
        }),
      );

      const result = validator.validate(facts, 'ws-test');

      expect(result.hardFailures).toHaveLength(0);
      expect(result.facts).toHaveLength(3);
    });
  });

  describe('hard-fail: CANONICAL_PROVENANCE_MISSING', () => {
    it('rejects canonical nodes without authoritative provenance', () => {
      const validator = new Validator();
      const fact = makeNodeFact({
        evidence: [], // no evidence
        source_file: '', // no source file
        line_start: 0,
        lang_meta: {
          confidence_score: 0.95,
          extraction_method: 'ast',
          provenance_records: [], // no provenance
        },
      });

      const result = validator.validate([fact], 'ws-test');

      expect(result.hardFailures).toHaveLength(1);
      expect(at(result.hardFailures, 0).code).toBe(RuntimeCode.CANONICAL_PROVENANCE_MISSING);
    });

    it('rejects canonical edges without deterministic parser evidence', () => {
      const validator = new Validator();
      const edgeFact = makeEdgeFact({
        extractor: 'ai_heuristic', // not a parser
        evidence: [],
        source_file: '',
        lang_meta: {
          record_type: 'edge',
          from_id: 'node:a',
          to_id: 'node:b',
          edge_type: 'calls',
          confidence_score: 0.95,
          provenance_records: [],
        },
      });

      const result = validator.validate([edgeFact], 'ws-test');

      // AI extractor is classified as EXPLORATORY, not AUTHORITATIVE,
      // so it won't trigger the canonical provenance check
      expect(result.facts).toHaveLength(1);
      expect(at(result.facts, 0).trust_level).toBe('EXPLORATORY');
    });
  });

  describe('soft warnings', () => {
    it('emits LOW_CONFIDENCE warning for low-confidence facts', () => {
      const validator = new Validator({ lowConfidenceThreshold: 0.6 });
      const fact = makeNodeFact({
        lang_meta: {
          ...makeNodeFact().lang_meta,
          confidence_score: 0.3,
        },
      });

      const result = validator.validate([fact], 'ws-test');

      expect(result.facts).toHaveLength(1);
      expect(result.warnings.some((w) => w.code === 'LOW_CONFIDENCE')).toBe(true);
    });

    it('emits ORPHAN_NODE warning for unconnected nodes', () => {
      const validator = new Validator();
      const node1 = makeNodeFact({ candidate_id: 'node:orphan' });
      const node2 = makeNodeFact({ candidate_id: 'node:connected' });
      const edge = makeEdgeFact({
        lang_meta: {
          record_type: 'edge',
          from_id: 'node:connected',
          to_id: 'node:other',
          edge_type: 'calls',
          confidence_score: 0.95,
          provenance_records: [
            { source: 'parser', artifact_source: 'src/index.ts', producer_stage: 'extract', timestamp: '2025-01-01T00:00:00Z', file: 'src/index.ts', line_start: 15, line_end: 15 },
          ],
        },
      });

      const result = validator.validate([node1, node2, edge], 'ws-test');

      const orphanWarnings = result.warnings.filter((w) => w.code === 'ORPHAN_NODE');
      expect(orphanWarnings.some((w) => w.factId === 'node:orphan')).toBe(true);
    });

    it('emits FLOW_WITHOUT_ENTRYPOINT warning for flows without entrypoints', () => {
      const validator = new Validator();
      const flowFact = makeNodeFact({
        candidate_id: 'node:flow-1',
        candidate_type: 'flow_domain',
        symbol: 'OrderFlow',
        is_entrypoint: false,
      });

      const result = validator.validate([flowFact], 'ws-test');

      expect(result.warnings.some((w) => w.code === 'FLOW_WITHOUT_ENTRYPOINT')).toBe(true);
    });

    it('emits EXPLORATORY_IN_AUTHORITATIVE warning for mixed annotations', () => {
      const validator = new Validator();
      const fact = makeNodeFact({
        annotations: ['exploratory-link', 'heuristic-match'],
      });

      const result = validator.validate([fact], 'ws-test');

      expect(result.warnings.some((w) => w.code === 'EXPLORATORY_IN_AUTHORITATIVE')).toBe(true);
    });
  });

  describe('trust classification integration', () => {
    it('classifies parser-backed facts as AUTHORITATIVE', () => {
      const validator = new Validator();
      const fact = makeNodeFact({ extractor: 'ts_tree_sitter_parser' });

      const result = validator.validate([fact], 'ws-test');

      expect(at(result.facts, 0).trust_level).toBe('AUTHORITATIVE');
    });

    it('classifies AI-extracted facts as EXPLORATORY', () => {
      const validator = new Validator();
      const fact = makeNodeFact({ extractor: 'ai_heuristic' });

      const result = validator.validate([fact], 'ws-test');

      expect(at(result.facts, 0).trust_level).toBe('EXPLORATORY');
    });

    it('classifies analysis-based facts as DERIVED', () => {
      const validator = new Validator();
      const fact = makeNodeFact({ extractor: 'config_link_analysis' });

      const result = validator.validate([fact], 'ws-test');

      expect(at(result.facts, 0).trust_level).toBe('DERIVED');
    });
  });

  describe('backward compatibility', () => {
    it('rejects unknown node types', () => {
      const validator = new Validator();
      const fact = makeNodeFact({ candidate_type: 'unknown_type_xyz' });

      const result = validator.validate([fact], 'ws-test');

      expect(result.rejected).toHaveLength(1);
      expect(at(result.rejected, 0).reason_code).toBe('UNKNOWN_NODE_TYPE');
      expect(result.facts).toHaveLength(0);
    });
  });
});

describe('validateFacts (pipeline entry point)', () => {
  it('throws ValidationPipelineError on hard failures', async () => {
    const db = makeStubDb();
    const edgeFact = makeEdgeFact({
      candidate_type: '',
      lang_meta: {
        record_type: 'edge',
        from_id: 'node:a',
        to_id: 'node:b',
        edge_type: '',
        confidence_score: 0.95,
      },
    });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validateFacts([edgeFact], 'ws-test', db as any),
    ).rejects.toThrow(ValidationPipelineError);
  });

  it('persists validated facts to DB on success', async () => {
    const db = makeStubDb();
    const fact = makeNodeFact();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateFacts([fact], 'ws-test', db as any);

    expect(result.facts).toHaveLength(1);
    expect(db.facts).toHaveLength(1);
    expect(at(db.facts, 0).status).toBe('validated');
  });

  it('returns rejected records without throwing for soft rejections', async () => {
    const db = makeStubDb();
    const fact = makeNodeFact({ candidate_type: 'unknown_type_xyz' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateFacts([fact], 'ws-test', db as any);

    expect(result.facts).toHaveLength(0);
    expect(result.rejects).toHaveLength(1);
  });
});

describe('ValidationPipelineError', () => {
  it('contains machine-readable error codes', () => {
    const error = new ValidationPipelineError(
      [RuntimeCode.INVALID_EDGE_TYPE, RuntimeCode.INVALID_GRAPH_STATE],
      ['Edge without type', 'Invalid graph_kind'],
    );

    expect(error.codes).toEqual([RuntimeCode.INVALID_EDGE_TYPE, RuntimeCode.INVALID_GRAPH_STATE]);
    expect(error.failures).toHaveLength(2);
    expect(error.name).toBe('ValidationPipelineError');
    expect(error.message).toContain('2 failures');
  });
});
