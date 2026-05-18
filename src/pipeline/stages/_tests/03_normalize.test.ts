import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { Normalizer, normalizeFacts } from '../03_normalize.js';
import type { CandidateRecord } from '../../../core/types.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

/** Helper to safely access array element in tests — asserts non-null */
function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  if (item === undefined) throw new Error(`Expected item at index ${index}`);
  return item;
}

function makeCandidate(overrides: Partial<CandidateRecord> = {}): CandidateRecord {
  return {
    candidate_id: 'test-candidate-1',
    candidate_type: 'ts_function',
    workspaceId: 'ws-1',
    project: 'proj-1',
    source_file: 'src/utils.ts',
    symbol: 'processOrder',
    line_start: 10,
    line_end: 25,
    status: 'candidate',
    extractor: 'ts_tree_sitter_parser',
    evidence: [
      {
        evidence_id: 'ev-1',
        source_file: 'src/utils.ts',
        line_start: 10,
        line_end: 25,
        excerpt: 'function processOrder() {}',
        role: 'source',
      },
    ],
    ...overrides,
  };
}

function expectedStableKey(workspace: string, project: string, kind: string, symbol: string, file: string): string {
  const input = [workspace, project, kind, symbol, file].join('::');
  return createHash('sha256').update(input).digest('hex');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Normalizer', () => {
  const normalizer = new Normalizer();

  describe('stable key assignment', () => {
    it('assigns a deterministic stable key based on workspace + project + kind + symbol + file', () => {
      const candidate = makeCandidate();
      const result = normalizer.normalize([candidate], 'ws-1');

      expect(result).toHaveLength(1);
      const expected = expectedStableKey('ws-1', 'proj-1', 'function', 'processOrder', 'src/utils.ts');
      expect(at(result, 0).fact_id).toBe(expected);
      expect(at(result, 0).lang_meta?.stable_key).toBe(expected);
    });

    it('produces the same stable key for the same logical fact across builds', () => {
      const candidate1 = makeCandidate({ candidate_id: 'build-1-id' });
      const candidate2 = makeCandidate({ candidate_id: 'build-2-id' });

      const result1 = normalizer.normalize([candidate1], 'ws-1');
      const result2 = normalizer.normalize([candidate2], 'ws-1');

      expect(at(result1, 0).fact_id).toBe(at(result2, 0).fact_id);
      expect(at(result1, 0).lang_meta?.stable_key).toBe(at(result2, 0).lang_meta?.stable_key);
    });

    it('produces different stable keys for different symbols', () => {
      const candidate1 = makeCandidate({ symbol: 'functionA' });
      const candidate2 = makeCandidate({ symbol: 'functionB' });

      const result = normalizer.normalize([candidate1, candidate2], 'ws-1');

      expect(at(result, 0).fact_id).not.toBe(at(result, 1).fact_id);
    });

    it('produces different stable keys for different workspaces', () => {
      const candidate = makeCandidate();

      const result1 = normalizer.normalize([candidate], 'ws-1');
      const result2 = normalizer.normalize([candidate], 'ws-2');

      expect(at(result1, 0).fact_id).not.toBe(at(result2, 0).fact_id);
    });
  });

  describe('field unification', () => {
    it('unifies TypeScript adapter types to normalized kinds', () => {
      const candidates = [
        makeCandidate({ candidate_type: 'ts_function', symbol: 'fn1' }),
        makeCandidate({ candidate_type: 'ts_class', symbol: 'cls1' }),
        makeCandidate({ candidate_type: 'ts_interface', symbol: 'iface1' }),
        makeCandidate({ candidate_type: 'ts_import', symbol: 'imp1' }),
      ];

      const result = normalizer.normalize(candidates, 'ws-1');

      expect(at(result, 0).lang_meta?.normalized_kind).toBe('function');
      expect(at(result, 1).lang_meta?.normalized_kind).toBe('class');
      expect(at(result, 2).lang_meta?.normalized_kind).toBe('interface');
      expect(at(result, 3).lang_meta?.normalized_kind).toBe('import');
    });

    it('unifies C# adapter types to normalized kinds', () => {
      const candidates = [
        makeCandidate({ candidate_type: 'csharp_class', extractor: 'csharp_tree_sitter', symbol: 'OrderService', source_file: 'OrderService.cs' }),
        makeCandidate({ candidate_type: 'csharp_controller', extractor: 'csharp_tree_sitter', symbol: 'OrdersController', source_file: 'OrdersController.cs' }),
        makeCandidate({ candidate_type: 'csharp_dto', extractor: 'csharp_tree_sitter', symbol: 'OrderDto', source_file: 'OrderDto.cs' }),
      ];

      const result = normalizer.normalize(candidates, 'ws-1');

      expect(at(result, 0).lang_meta?.normalized_kind).toBe('class');
      expect(at(result, 1).lang_meta?.normalized_kind).toBe('controller_action');
      expect(at(result, 2).lang_meta?.normalized_kind).toBe('dto');
    });

    it('unifies structured file adapter types to normalized kinds', () => {
      const candidates = [
        makeCandidate({ candidate_type: 'config_key', extractor: 'json_parser', symbol: 'db_host', source_file: 'config.json' }),
        makeCandidate({ candidate_type: 'openapi_endpoint', extractor: 'openapi_parser', symbol: '/api/orders', source_file: 'openapi.yaml' }),
      ];

      const result = normalizer.normalize(candidates, 'ws-1');

      expect(at(result, 0).lang_meta?.normalized_kind).toBe('config');
      expect(at(result, 1).lang_meta?.normalized_kind).toBe('api_endpoint');
    });

    it('preserves original candidate_type when no mapping exists', () => {
      const candidate = makeCandidate({ candidate_type: 'custom_type' });

      const result = normalizer.normalize([candidate], 'ws-1');

      expect(at(result, 0).lang_meta?.normalized_kind).toBe('custom_type');
      expect(at(result, 0).candidate_type).toBe('custom_type');
    });

    it('unifies extraction method identifiers', () => {
      const candidates = [
        makeCandidate({ extractor: 'ts_tree_sitter_parser', symbol: 'a' }),
        makeCandidate({ extractor: 'csharp_tree_sitter', symbol: 'b', source_file: 'b.cs' }),
        makeCandidate({ extractor: 'regex_extractor', symbol: 'c', source_file: 'c.txt' }),
      ];

      const result = normalizer.normalize(candidates, 'ws-1');

      expect(at(result, 0).lang_meta?.extraction_method).toBe('ast');
      expect(at(result, 1).lang_meta?.extraction_method).toBe('ast');
      expect(at(result, 2).lang_meta?.extraction_method).toBe('regex');
    });
  });

  describe('deduplication', () => {
    it('deduplicates facts with identical stable keys keeping highest confidence', () => {
      // Two candidates that map to the same stable key (same workspace, project, kind, symbol, file)
      const candidate1 = makeCandidate({
        candidate_id: 'dup-1',
        extractor: 'ts_tree_sitter_parser', // confidence 0.95
      });
      const candidate2 = makeCandidate({
        candidate_id: 'dup-2',
        extractor: 'regex_extractor', // confidence 0.60
      });

      const result = normalizer.normalize([candidate1, candidate2], 'ws-1');

      // Should deduplicate to one fact
      expect(result).toHaveLength(1);
      // Should keep the higher confidence one (ast = 0.95)
      expect(at(result, 0).lang_meta?.confidence_score).toBe(0.95);
    });

    it('merges provenance from all duplicates into the surviving fact', () => {
      const candidate1 = makeCandidate({
        candidate_id: 'dup-1',
        evidence: [
          { evidence_id: 'ev-1', source_file: 'src/utils.ts', line_start: 10, line_end: 25, excerpt: 'fn1', role: 'source' },
        ],
      });
      const candidate2 = makeCandidate({
        candidate_id: 'dup-2',
        evidence: [
          { evidence_id: 'ev-2', source_file: 'src/utils.ts', line_start: 10, line_end: 25, excerpt: 'fn2', role: 'call' },
        ],
      });

      const result = normalizer.normalize([candidate1, candidate2], 'ws-1');

      expect(result).toHaveLength(1);
      const provenance = at(result, 0).lang_meta?.provenance_records as unknown[];
      expect(provenance.length).toBe(2);
    });

    it('records duplicate count when deduplication occurs', () => {
      const candidate1 = makeCandidate({ candidate_id: 'dup-1' });
      const candidate2 = makeCandidate({ candidate_id: 'dup-2', extractor: 'regex_extractor' });

      const result = normalizer.normalize([candidate1, candidate2], 'ws-1');

      expect(at(result, 0).lang_meta?.duplicate_count).toBe(2);
    });

    it('does not set duplicate_count when no duplicates exist', () => {
      const candidate = makeCandidate();

      const result = normalizer.normalize([candidate], 'ws-1');

      expect(at(result, 0).lang_meta?.duplicate_count).toBeUndefined();
    });

    it('does not deduplicate facts with different stable keys', () => {
      const candidate1 = makeCandidate({ symbol: 'functionA' });
      const candidate2 = makeCandidate({ symbol: 'functionB' });

      const result = normalizer.normalize([candidate1, candidate2], 'ws-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('provenance preservation', () => {
    it('preserves provenance from evidence spans', () => {
      const candidate = makeCandidate({
        evidence: [
          { evidence_id: 'ev-1', source_file: 'src/utils.ts', line_start: 10, line_end: 15, excerpt: 'code', role: 'source' },
          { evidence_id: 'ev-2', source_file: 'src/utils.ts', line_start: 20, line_end: 25, excerpt: 'more', role: 'call' },
        ],
      });

      const result = normalizer.normalize([candidate], 'ws-1');

      const provenance = at(result, 0).lang_meta?.provenance_records as Array<{ file: string; line_start: number; line_end: number; source: string; producer_stage: string }>;
      expect(provenance).toHaveLength(2);
      expect(at(provenance, 0).file).toBe('src/utils.ts');
      expect(at(provenance, 0).line_start).toBe(10);
      expect(at(provenance, 0).line_end).toBe(15);
      expect(at(provenance, 0).source).toBe('parser');
      expect(at(provenance, 0).producer_stage).toBe('extract');
      expect(at(provenance, 1).line_start).toBe(20);
    });

    it('creates provenance from candidate fields when no evidence spans exist', () => {
      const candidate = makeCandidate({
        evidence: [],
        source_file: 'src/empty.ts',
        line_start: 5,
        line_end: 10,
      });

      const result = normalizer.normalize([candidate], 'ws-1');

      const provenance = at(result, 0).lang_meta?.provenance_records as Array<{ file: string; line_start: number; line_end: number }>;
      expect(provenance).toHaveLength(1);
      expect(at(provenance, 0).file).toBe('src/empty.ts');
      expect(at(provenance, 0).line_start).toBe(5);
      expect(at(provenance, 0).line_end).toBe(10);
    });

    it('maps parser-based extractors to parser provenance source', () => {
      const candidate = makeCandidate({ extractor: 'ts_tree_sitter_parser' });

      const result = normalizer.normalize([candidate], 'ws-1');

      const provenance = at(result, 0).lang_meta?.provenance_records as Array<{ source: string }>;
      expect(at(provenance, 0).source).toBe('parser');
    });

    it('maps analysis-based extractors to analysis provenance source', () => {
      const candidate = makeCandidate({ extractor: 'static_analysis_tool', symbol: 'analyzed' });

      const result = normalizer.normalize([candidate], 'ws-1');

      const provenance = at(result, 0).lang_meta?.provenance_records as Array<{ source: string }>;
      expect(at(provenance, 0).source).toBe('analysis');
    });
  });

  describe('confidence computation', () => {
    it('assigns high confidence for AST-based extractors', () => {
      const candidate = makeCandidate({ extractor: 'ts_tree_sitter_parser' });

      const result = normalizer.normalize([candidate], 'ws-1');

      expect(at(result, 0).lang_meta?.confidence_score).toBe(0.95);
    });

    it('assigns medium confidence for regex extractors', () => {
      const candidate = makeCandidate({ extractor: 'regex_extractor', symbol: 'regexed' });

      const result = normalizer.normalize([candidate], 'ws-1');

      expect(at(result, 0).lang_meta?.confidence_score).toBe(0.60);
    });

    it('uses explicit confidence from lang_meta when available', () => {
      const candidate = makeCandidate({
        lang_meta: { confidence: 0.42 },
        symbol: 'explicit',
      });

      const result = normalizer.normalize([candidate], 'ws-1');

      expect(at(result, 0).lang_meta?.confidence_score).toBe(0.42);
    });
  });

  describe('normalizeFacts pipeline entry point', () => {
    it('returns normalized facts via the async pipeline function', async () => {
      const candidates = [makeCandidate()];

      const result = await normalizeFacts(candidates, 'ws-1');

      expect(result).toHaveLength(1);
      expect(at(result, 0).fact_id).toBeDefined();
      expect(at(result, 0).lang_meta?.stable_key).toBeDefined();
    });

    it('handles empty input gracefully', async () => {
      const result = await normalizeFacts([], 'ws-1');

      expect(result).toHaveLength(0);
    });
  });
});
