/**
 * Integration tests for the normalize → validate → build pipeline.
 *
 * Tests the full pipeline flow from normalization through validation to graph building,
 * verifying:
 * - Normalization produces stable keys and deduplicates (Req 3.2)
 * - Hard-fail conditions halt the pipeline with correct error codes (Req 3.3)
 * - Canonical/derived/exploratory separation in graph output (Req 4.7, 4.8)
 * - Exploratory facts cannot overwrite canonical (Req 4.7)
 *
 * @see Requirements 3.2, 3.3, 4.7, 4.8
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CandidateRecord } from '../../../core/types.js';
import { RuntimeCode } from '../../../core/errors.js';
import { normalizeFacts } from '../03_normalize.js';
import { validateFacts, ValidationPipelineError } from '../04_validate.js';
import { buildCanonicalGraph } from '../05a_build_canonical.js';
import { buildDerivedGraph } from '../05b_build_derived.js';
import { buildExploratoryGraph } from '../05c_build_exploratory.js';

/** Helper to safely access array element in tests — asserts non-null */
function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  if (item === undefined) throw new Error(`Expected item at index ${index}`);
  return item;
}
import { GraphDB } from '../../../storage/GraphDB.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

const WORKSPACE_ID = 'ws-integration-test';

function makeAuthoritativeCandidate(overrides: Partial<CandidateRecord> = {}): CandidateRecord {
  return {
    candidate_id: `candidate-${Math.random().toString(36).slice(2, 10)}`,
    candidate_type: 'ts_function',
    workspaceId: WORKSPACE_ID,
    project: 'proj-1',
    source_file: 'src/service.ts',
    symbol: 'processOrder',
    line_start: 10,
    line_end: 30,
    status: 'candidate',
    extractor: 'ts_tree_sitter_parser',
    evidence: [
      {
        evidence_id: 'ev-1',
        source_file: 'src/service.ts',
        line_start: 10,
        line_end: 30,
        excerpt: 'function processOrder() {}',
        role: 'source',
      },
    ],
    called_symbols: [],
    ...overrides,
  };
}

function makeDerivedCandidate(overrides: Partial<CandidateRecord> = {}): CandidateRecord {
  return {
    candidate_id: `candidate-${Math.random().toString(36).slice(2, 10)}`,
    candidate_type: 'ts_function',
    workspaceId: WORKSPACE_ID,
    project: 'proj-1',
    source_file: 'src/derived.ts',
    symbol: 'computedMetric',
    line_start: 5,
    line_end: 15,
    status: 'candidate',
    extractor: 'config_link_analysis',
    evidence: [
      {
        evidence_id: 'ev-derived-1',
        source_file: 'src/derived.ts',
        line_start: 5,
        line_end: 15,
        excerpt: 'const computedMetric = derive()',
        role: 'source',
      },
    ],
    called_symbols: [],
    ...overrides,
  };
}

function makeExploratoryCandidate(overrides: Partial<CandidateRecord> = {}): CandidateRecord {
  return {
    candidate_id: `candidate-${Math.random().toString(36).slice(2, 10)}`,
    candidate_type: 'ts_function',
    workspaceId: WORKSPACE_ID,
    project: 'proj-1',
    source_file: 'src/heuristic.ts',
    symbol: 'inferredRelation',
    line_start: 1,
    line_end: 10,
    status: 'candidate',
    extractor: 'ai_heuristic_analyzer',
    evidence: [
      {
        evidence_id: 'ev-exp-1',
        source_file: 'src/heuristic.ts',
        line_start: 1,
        line_end: 10,
        excerpt: '// inferred relation',
        role: 'source',
      },
    ],
    called_symbols: [],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('normalize → validate → build pipeline integration', () => {
  let db: GraphDB;

  beforeEach(() => {
    db = new GraphDB(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('normalization produces stable keys and deduplicates (Req 3.2)', () => {
    it('assigns stable keys that are deterministic across runs', async () => {
      const candidate = makeAuthoritativeCandidate({ symbol: 'stableFunc' });

      const normalized1 = await normalizeFacts([candidate], WORKSPACE_ID);
      const normalized2 = await normalizeFacts([candidate], WORKSPACE_ID);

      expect(normalized1).toHaveLength(1);
      expect(normalized2).toHaveLength(1);
      expect(at(normalized1, 0).fact_id).toBe(at(normalized2, 0).fact_id);
      expect(at(normalized1, 0).lang_meta?.stable_key).toBe(at(normalized2, 0).lang_meta?.stable_key);
    });

    it('deduplicates candidates with identical stable keys, keeping highest confidence', async () => {
      const candidate1 = makeAuthoritativeCandidate({
        candidate_id: 'dup-a',
        symbol: 'sharedSymbol',
        extractor: 'ts_tree_sitter_parser', // confidence 0.95
      });
      const candidate2 = makeAuthoritativeCandidate({
        candidate_id: 'dup-b',
        symbol: 'sharedSymbol',
        extractor: 'regex_extractor', // confidence 0.60
      });

      const normalized = await normalizeFacts([candidate1, candidate2], WORKSPACE_ID);

      expect(normalized).toHaveLength(1);
      expect(at(normalized, 0).lang_meta?.confidence_score).toBe(0.95);
    });

    it('normalized facts flow through validation and build successfully', async () => {
      const candidates = [
        makeAuthoritativeCandidate({ symbol: 'funcA', candidate_id: 'c-a' }),
        makeAuthoritativeCandidate({ symbol: 'funcB', candidate_id: 'c-b', source_file: 'src/other.ts' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      expect(normalized).toHaveLength(2);

      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      expect(facts).toHaveLength(2);
      expect(at(facts, 0).status).toBe('validated');
      expect(at(facts, 1).status).toBe('validated');

      const { nodes } = await buildCanonicalGraph(facts, WORKSPACE_ID, db);
      expect(nodes).toHaveLength(2);
      expect(nodes.every(n => n.graph_kind === 'canonical')).toBe(true);
    });
  });

  describe('hard-fail conditions halt the pipeline with correct error codes (Req 3.3)', () => {
    it('halts on edge without type (INVALID_EDGE_TYPE)', async () => {
      const edgeFact = makeAuthoritativeCandidate({
        candidate_id: 'edge-no-type',
        candidate_type: '',
        symbol: 'badEdge',
        lang_meta: {
          record_type: 'edge',
          from_id: 'node:a',
          to_id: 'node:b',
          edge_type: '', // empty type triggers hard-fail
        },
      });

      const normalized = await normalizeFacts([edgeFact], WORKSPACE_ID);

      await expect(
        validateFacts(normalized, WORKSPACE_ID, db as any),
      ).rejects.toThrow(ValidationPipelineError);

      try {
        await validateFacts(normalized, WORKSPACE_ID, db as any);
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationPipelineError);
        expect((err as ValidationPipelineError).codes).toContain(RuntimeCode.INVALID_EDGE_TYPE);
      }
    });

    it('halts on canonical node without authoritative provenance (CANONICAL_PROVENANCE_MISSING)', async () => {
      const factWithoutProvenance = makeAuthoritativeCandidate({
        candidate_id: 'no-provenance',
        symbol: 'noProvenanceFunc',
        evidence: [], // no evidence
        source_file: '', // no source file
        line_start: 0,
        line_end: 0,
      });

      // Remove source_file to trigger missing provenance
      (factWithoutProvenance as any).source_file = '';
      (factWithoutProvenance as any).line_start = undefined;

      const normalized = await normalizeFacts([factWithoutProvenance], WORKSPACE_ID);

      await expect(
        validateFacts(normalized, WORKSPACE_ID, db as any),
      ).rejects.toThrow(ValidationPipelineError);

      try {
        await validateFacts(normalized, WORKSPACE_ID, db as any);
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationPipelineError);
        expect((err as ValidationPipelineError).codes).toContain(RuntimeCode.CANONICAL_PROVENANCE_MISSING);
      }
    });

    it('halts on invalid graph_kind value (INVALID_GRAPH_STATE)', async () => {
      const factWithInvalidGraphKind = makeAuthoritativeCandidate({
        candidate_id: 'invalid-gk',
        symbol: 'invalidGraphKind',
        lang_meta: {
          graph_kind: 'nonexistent_kind', // invalid graph_kind
        },
      });

      const normalized = await normalizeFacts([factWithInvalidGraphKind], WORKSPACE_ID);

      await expect(
        validateFacts(normalized, WORKSPACE_ID, db as any),
      ).rejects.toThrow(ValidationPipelineError);

      try {
        await validateFacts(normalized, WORKSPACE_ID, db as any);
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationPipelineError);
        expect((err as ValidationPipelineError).codes).toContain(RuntimeCode.INVALID_GRAPH_STATE);
      }
    });

    it('halts on persisted external graph_kind when external workflow disabled', async () => {
      const externalFact = makeAuthoritativeCandidate({
        candidate_id: 'external-disabled',
        symbol: 'externalFact',
        lang_meta: {
          graph_kind: 'external', // external when workflow disabled
        },
      });

      const normalized = await normalizeFacts([externalFact], WORKSPACE_ID);

      // Default: externalWorkflowEnabled = false
      await expect(
        validateFacts(normalized, WORKSPACE_ID, db as any, { externalWorkflowEnabled: false }),
      ).rejects.toThrow(ValidationPipelineError);

      try {
        await validateFacts(normalized, WORKSPACE_ID, db as any, { externalWorkflowEnabled: false });
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationPipelineError);
        expect((err as ValidationPipelineError).codes).toContain(RuntimeCode.INVALID_GRAPH_STATE);
      }
    });
  });

  describe('canonical/derived/exploratory separation in graph output (Req 4.7, 4.8)', () => {
    it('separates authoritative facts into canonical graph layer', async () => {
      const candidates = [
        makeAuthoritativeCandidate({ symbol: 'canonicalFunc', candidate_id: 'c-canon' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);

      const canonicalResult = await buildCanonicalGraph(facts, WORKSPACE_ID, db);

      expect(canonicalResult.nodes.length).toBeGreaterThan(0);
      expect(canonicalResult.nodes.every(n => n.graph_kind === 'canonical')).toBe(true);
      expect(canonicalResult.nodes.every(n => n.trust_level === 'AUTHORITATIVE')).toBe(true);
      expect(canonicalResult.nodes.every(n => n.confidence_band === 'AUTHORITATIVE')).toBe(true);
    });

    it('separates derived facts into derived graph layer', async () => {
      const candidates = [
        makeDerivedCandidate({ symbol: 'derivedFunc', candidate_id: 'c-derived' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);

      const derivedResult = await buildDerivedGraph(facts, WORKSPACE_ID, db);

      expect(derivedResult.nodes.length).toBeGreaterThan(0);
      expect(derivedResult.nodes.every(n => n.graph_kind === 'derived')).toBe(true);
      expect(derivedResult.nodes.every(n => n.trust_level === 'DERIVED')).toBe(true);
    });

    it('separates exploratory facts into exploratory graph layer', async () => {
      const candidates = [
        makeExploratoryCandidate({ symbol: 'exploratoryFunc', candidate_id: 'c-exp' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);

      const exploratoryResult = await buildExploratoryGraph(facts, WORKSPACE_ID, db);

      expect(exploratoryResult.nodes.length).toBeGreaterThan(0);
      expect(exploratoryResult.nodes.every(n => n.graph_kind === 'exploratory')).toBe(true);
      expect(exploratoryResult.nodes.every(n => n.trust_level === 'EXPLORATORY')).toBe(true);
      expect(exploratoryResult.nodes.every(n => n.confidence_band === 'AMBIGUOUS')).toBe(true);
    });

    it('builds all three layers from mixed input without cross-contamination', async () => {
      const candidates = [
        makeAuthoritativeCandidate({ symbol: 'authFunc', candidate_id: 'c-auth' }),
        makeDerivedCandidate({ symbol: 'derFunc', candidate_id: 'c-der' }),
        makeExploratoryCandidate({ symbol: 'expFunc', candidate_id: 'c-exp' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);

      // Build in order: canonical → derived → exploratory
      const canonicalResult = await buildCanonicalGraph(facts, WORKSPACE_ID, db);
      const derivedResult = await buildDerivedGraph(facts, WORKSPACE_ID, db);
      const exploratoryResult = await buildExploratoryGraph(facts, WORKSPACE_ID, db);

      // Canonical layer only has authoritative facts
      expect(canonicalResult.nodes.every(n => n.graph_kind === 'canonical')).toBe(true);
      expect(canonicalResult.nodes.every(n => n.trust_level === 'AUTHORITATIVE')).toBe(true);

      // Derived layer only has derived facts
      expect(derivedResult.nodes.every(n => n.graph_kind === 'derived')).toBe(true);
      expect(derivedResult.nodes.every(n => n.trust_level === 'DERIVED')).toBe(true);

      // Exploratory layer only has exploratory facts
      expect(exploratoryResult.nodes.every(n => n.graph_kind === 'exploratory')).toBe(true);
      expect(exploratoryResult.nodes.every(n => n.trust_level === 'EXPLORATORY')).toBe(true);

      // Verify DB has all nodes with correct graph_kind
      const allNodes = db.getAllNodesByWorkspace(WORKSPACE_ID);
      const canonicalNodes = allNodes.filter(n => n.graph_kind === 'canonical');
      const derivedNodes = allNodes.filter(n => n.graph_kind === 'derived');
      const exploratoryNodes = allNodes.filter(n => n.graph_kind === 'exploratory');

      expect(canonicalNodes.length).toBeGreaterThan(0);
      expect(derivedNodes.length).toBeGreaterThan(0);
      expect(exploratoryNodes.length).toBeGreaterThan(0);
    });

    it('blocks AI from writing directly into canonical layer (Req 4.8)', async () => {
      // An AI-sourced fact should not end up in canonical
      const aiCandidate = makeAuthoritativeCandidate({
        candidate_id: 'ai-fact',
        symbol: 'aiGeneratedFunc',
        extractor: 'ai_llm_generator', // AI extractor
      });

      const normalized = await normalizeFacts([aiCandidate], WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);

      // AI facts should be classified as EXPLORATORY by TrustClassifier
      const canonicalResult = await buildCanonicalGraph(facts, WORKSPACE_ID, db);
      expect(canonicalResult.nodes).toHaveLength(0); // AI facts filtered out of canonical
    });
  });

  describe('exploratory facts cannot overwrite canonical (Req 4.7)', () => {
    it('prevents exploratory nodes from overwriting existing canonical nodes', async () => {
      // First, build a canonical node
      const canonicalCandidate = makeAuthoritativeCandidate({
        candidate_id: 'shared-id',
        symbol: 'sharedFunc',
      });

      const normalizedCanonical = await normalizeFacts([canonicalCandidate], WORKSPACE_ID);
      const { facts: canonicalFacts } = await validateFacts(normalizedCanonical, WORKSPACE_ID, db as any);
      await buildCanonicalGraph(canonicalFacts, WORKSPACE_ID, db);

      // Verify canonical node exists
      const canonicalNode = db.getNode(`node:shared-id`);
      expect(canonicalNode).toBeDefined();
      expect(canonicalNode!.graph_kind).toBe('canonical');

      // Now try to build an exploratory node with the same ID
      const exploratoryCandidate = makeExploratoryCandidate({
        candidate_id: 'shared-id', // same ID as canonical
        symbol: 'sharedFunc',
      });

      const normalizedExploratory = await normalizeFacts([exploratoryCandidate], WORKSPACE_ID);
      const { facts: exploratoryFacts } = await validateFacts(normalizedExploratory, WORKSPACE_ID, db as any);
      await buildExploratoryGraph(exploratoryFacts, WORKSPACE_ID, db);

      // The canonical node should still be canonical — not overwritten
      const nodeAfter = db.getNode(`node:shared-id`);
      expect(nodeAfter).toBeDefined();
      expect(nodeAfter!.graph_kind).toBe('canonical');
      expect(nodeAfter!.trust_level).toBe('AUTHORITATIVE');
    });

    it('exploratory build filters out nodes that would overwrite canonical', async () => {
      // Build canonical first
      const canonicalCandidate = makeAuthoritativeCandidate({
        candidate_id: 'protected-id',
        symbol: 'protectedFunc',
      });

      const normalizedCanonical = await normalizeFacts([canonicalCandidate], WORKSPACE_ID);
      const { facts: canonicalFacts } = await validateFacts(normalizedCanonical, WORKSPACE_ID, db as any);
      await buildCanonicalGraph(canonicalFacts, WORKSPACE_ID, db);

      // Build exploratory with same ID + a new unique one
      const exploratoryOverlap = makeExploratoryCandidate({
        candidate_id: 'protected-id', // overlaps with canonical
        symbol: 'protectedFunc',
      });
      const exploratoryNew = makeExploratoryCandidate({
        candidate_id: 'new-exp-id',
        symbol: 'newExploratoryFunc',
        source_file: 'src/new-heuristic.ts',
      });

      const normalizedExp = await normalizeFacts([exploratoryOverlap, exploratoryNew], WORKSPACE_ID);
      const { facts: expFacts } = await validateFacts(normalizedExp, WORKSPACE_ID, db as any);
      const exploratoryResult = await buildExploratoryGraph(expFacts, WORKSPACE_ID, db);

      // The overlapping node should be filtered out, only the new one persisted
      const exploratoryNodes = exploratoryResult.nodes.filter(n => n.graph_kind === 'exploratory');
      const overlapNode = exploratoryNodes.find(n => n.id === 'node:protected-id');
      expect(overlapNode).toBeUndefined();

      // The new exploratory node should exist
      const newNode = db.getNode('node:new-exp-id');
      expect(newNode).toBeDefined();
      expect(newNode!.graph_kind).toBe('exploratory');
    });

    it('canonical build rejects silent upgrade from exploratory to canonical', async () => {
      // First, build an exploratory node
      const exploratoryCandidate = makeExploratoryCandidate({
        candidate_id: 'upgrade-target',
        symbol: 'upgradeFunc',
      });

      const normalizedExp = await normalizeFacts([exploratoryCandidate], WORKSPACE_ID);
      const { facts: expFacts } = await validateFacts(normalizedExp, WORKSPACE_ID, db as any);
      await buildExploratoryGraph(expFacts, WORKSPACE_ID, db);

      // Verify exploratory node exists
      const expNode = db.getNode('node:upgrade-target');
      expect(expNode).toBeDefined();
      expect(expNode!.graph_kind).toBe('exploratory');

      // Now try to build a canonical node with the same ID — should throw
      const canonicalCandidate = makeAuthoritativeCandidate({
        candidate_id: 'upgrade-target', // same ID as exploratory
        symbol: 'upgradeFunc',
      });

      const normalizedCanonical = await normalizeFacts([canonicalCandidate], WORKSPACE_ID);
      const { facts: canonicalFacts } = await validateFacts(normalizedCanonical, WORKSPACE_ID, db as any);

      await expect(
        buildCanonicalGraph(canonicalFacts, WORKSPACE_ID, db),
      ).rejects.toThrow(/CANONICAL_PROMOTION_DENIED|trust enforcement/i);
    });
  });

  describe('end-to-end pipeline with edges', () => {
    it('builds canonical edges between canonical nodes', async () => {
      const callerCandidate = makeAuthoritativeCandidate({
        candidate_id: 'caller-1',
        symbol: 'handleRequest',
        called_symbols: ['processOrder'],
      });
      const calleeCandidate = makeAuthoritativeCandidate({
        candidate_id: 'callee-1',
        symbol: 'processOrder',
        source_file: 'src/order.ts',
      });

      const normalized = await normalizeFacts([callerCandidate, calleeCandidate], WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      const { nodes, edges } = await buildCanonicalGraph(facts, WORKSPACE_ID, db);

      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(edges[0]!.graph_kind).toBe('canonical');
      expect(edges[0]!.type).toBe('canonical_dependency');
      expect(edges[0]!.trust_level).toBe('AUTHORITATIVE');
    });

    it('builds exploratory edges between exploratory nodes', async () => {
      const callerCandidate = makeExploratoryCandidate({
        candidate_id: 'exp-caller',
        symbol: 'inferredCaller',
        called_symbols: ['inferredCallee'],
      });
      const calleeCandidate = makeExploratoryCandidate({
        candidate_id: 'exp-callee',
        symbol: 'inferredCallee',
        source_file: 'src/inferred.ts',
      });

      const normalized = await normalizeFacts([callerCandidate, calleeCandidate], WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      const { nodes, edges } = await buildExploratoryGraph(facts, WORKSPACE_ID, db);

      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(edges[0]!.graph_kind).toBe('exploratory');
      expect(edges[0]!.type).toBe('exploratory_dependency');
      expect(edges[0]!.trust_level).toBe('EXPLORATORY');
      expect(edges[0]!.confidence_band).toBe('AMBIGUOUS');
    });
  });
});
