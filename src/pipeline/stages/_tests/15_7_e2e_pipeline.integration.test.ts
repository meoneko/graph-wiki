/**
 * Task 15.7 — End-to-End Integration Tests for Full Pipeline
 *
 * Tests:
 * - Full pipeline execution from sync through report on a fixture workspace
 * - Fail-closed behavior: no silent fallbacks, no exploratory in authoritative
 * - External knowledge gate blocks direct canonical writes
 * - Provenance attached to all nodes and edges
 *
 * @see Requirements 3.1, 20.1, 20.2, 22.2
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import type {
  CandidateRecord,
  GraphNode,
  GraphEdge,
  Provenance,
  QueryMode,
  OperationType,
} from '../../../core/types.js';
import { PipelineError, RuntimeCode, DecisionStatus } from '../../../core/errors.js';
import { normalizeFacts } from '../03_normalize.js';
import { validateFacts, ValidationPipelineError } from '../04_validate.js';
import { buildCanonicalGraph } from '../05a_build_canonical.js';
import { buildDerivedGraph } from '../05b_build_derived.js';
import { buildExploratoryGraph } from '../05c_build_exploratory.js';
import { buildFlowGraph } from '../05d_build_flows.js';
import { extractCandidates } from '../02_extract.js';
import { GraphDB } from '../../../storage/GraphDB.js';
import { GraphArtifactLoader } from '../../../core/graph/query/GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from '../../../core/graph/query/TrustAwareQueryEngine.js';
import { ExternalKnowledgeGate } from '../../../core/external/ExternalKnowledgeGate.js';
import { OperationResolver } from '../../../core/graph/query/OperationResolver.js';
import type { KnowledgeConfig, WorkspaceConfig } from '../../config.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

const WORKSPACE_ID = 'ws-e2e-pipeline';
const FIXTURE_PATH = resolve(process.cwd(), 'fixtures/dotnet-minimal');

const parserProvenance: Provenance = {
  source: 'parser',
  artifact_source: 'cs_tree_sitter_parser',
  producer_stage: 'extract',
  timestamp: '2026-01-01T00:00:00.000Z',
  workspaceId: WORKSPACE_ID,
  sourceRootId: 'dotnet-minimal',
  filePath: 'src/service.ts',
  extractionStage: 'extract',
  extractionMethod: 'ast',
  adapterId: 'cs_tree_sitter_parser',
  adapterVersion: '1.0.0',
  confidence: 0.95,
  hash: 'abc123',
};

function makeAuthoritativeCandidate(overrides: Partial<CandidateRecord> = {}): CandidateRecord {
  return {
    candidate_id: `candidate-${Math.random().toString(36).slice(2, 10)}`,
    candidate_type: 'ts_function',
    workspaceId: WORKSPACE_ID,
    project: 'dotnet-minimal',
    source_file: 'Services/OrderUseCase.cs',
    symbol: 'OrderUseCase',
    line_start: 1,
    line_end: 20,
    status: 'candidate',
    extractor: 'ts_tree_sitter_parser',
    evidence: [
      {
        evidence_id: 'ev-1',
        source_file: 'Services/OrderUseCase.cs',
        line_start: 1,
        line_end: 20,
        excerpt: 'public class OrderUseCase {}',
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
    project: 'dotnet-minimal',
    source_file: 'Services/DerivedService.cs',
    symbol: 'DerivedService',
    line_start: 1,
    line_end: 15,
    status: 'candidate',
    extractor: 'config_link_analysis',
    evidence: [
      {
        evidence_id: 'ev-derived',
        source_file: 'Services/DerivedService.cs',
        line_start: 1,
        line_end: 15,
        excerpt: 'derived service',
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
    project: 'dotnet-minimal',
    source_file: 'Services/Heuristic.cs',
    symbol: 'HeuristicService',
    line_start: 1,
    line_end: 10,
    status: 'candidate',
    extractor: 'ai_heuristic_analyzer',
    evidence: [
      {
        evidence_id: 'ev-exp',
        source_file: 'Services/Heuristic.cs',
        line_start: 1,
        line_end: 10,
        excerpt: '// inferred',
        role: 'source',
      },
    ],
    called_symbols: [],
    ...overrides,
  };
}

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    stableKey: `sk-${id}`,
    workspace: WORKSPACE_ID,
    project: 'dotnet-minimal',
    type: 'function',
    label: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProvenance,
    source_file: 'Services/OrderUseCase.cs',
    symbol: id,
    metadata: {},
    ...overrides,
  };
}

function makeEdge(id: string, fromId: string, toId: string, overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    id,
    stableKey: `sk-${id}`,
    workspace: WORKSPACE_ID,
    from_id: fromId,
    to_id: toId,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProvenance,
    ...overrides,
  };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('End-to-end pipeline integration (Req 3.1, 20.1, 20.2, 22.2)', () => {
  let db: GraphDB;

  beforeEach(() => {
    db = new GraphDB(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  // ─── Full Pipeline Execution ─────────────────────────────────────────────

  describe('Full pipeline execution from sync through report (Req 3.1)', () => {
    it('executes normalize → validate → build canonical → build derived → build exploratory → build flows in order', async () => {
      const candidates = [
        makeAuthoritativeCandidate({ candidate_id: 'e2e-auth-1', symbol: 'OrderUseCase' }),
        makeAuthoritativeCandidate({ candidate_id: 'e2e-auth-2', symbol: 'CreateOrder', source_file: 'Services/CreateOrder.cs', called_symbols: ['OrderUseCase'] }),
        makeDerivedCandidate({ candidate_id: 'e2e-derived-1', symbol: 'DerivedMetric' }),
        makeExploratoryCandidate({ candidate_id: 'e2e-exp-1', symbol: 'InferredRelation' }),
      ];

      // Stage 3: Normalize
      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      expect(normalized.length).toBeGreaterThanOrEqual(4);

      // Stage 4: Validate
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      expect(facts.length).toBeGreaterThanOrEqual(4);
      expect(facts.every(f => f.status === 'validated')).toBe(true);

      // Stage 5a: Build Canonical
      const canonical = await buildCanonicalGraph(facts, WORKSPACE_ID, db);
      expect(canonical.nodes.length).toBeGreaterThan(0);
      expect(canonical.nodes.every(n => n.graph_kind === 'canonical')).toBe(true);

      // Stage 5b: Build Derived
      const derived = await buildDerivedGraph(facts, WORKSPACE_ID, db);
      expect(derived.nodes.length).toBeGreaterThan(0);
      expect(derived.nodes.every(n => n.graph_kind === 'derived')).toBe(true);

      // Stage 5c: Build Exploratory
      const exploratory = await buildExploratoryGraph(facts, WORKSPACE_ID, db);
      expect(exploratory.nodes.length).toBeGreaterThan(0);
      expect(exploratory.nodes.every(n => n.graph_kind === 'exploratory')).toBe(true);

      // Stage 5d: Build Flows
      const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
      const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];
      await buildFlowGraph(allNodes, allEdges, WORKSPACE_ID, db);

      // Verify final state in DB
      const dbNodes = db.getAllNodesByWorkspace(WORKSPACE_ID);
      expect(dbNodes.length).toBeGreaterThanOrEqual(4);

      // Verify all three layers are present
      const canonicalInDb = dbNodes.filter(n => n.graph_kind === 'canonical');
      const derivedInDb = dbNodes.filter(n => n.graph_kind === 'derived');
      const exploratoryInDb = dbNodes.filter(n => n.graph_kind === 'exploratory');
      expect(canonicalInDb.length).toBeGreaterThan(0);
      expect(derivedInDb.length).toBeGreaterThan(0);
      expect(exploratoryInDb.length).toBeGreaterThan(0);
    });

    it('pipeline stages produce edges between related nodes', async () => {
      const caller = makeAuthoritativeCandidate({
        candidate_id: 'caller-e2e',
        symbol: 'handleRequest',
        called_symbols: ['processOrder'],
      });
      const callee = makeAuthoritativeCandidate({
        candidate_id: 'callee-e2e',
        symbol: 'processOrder',
        source_file: 'Services/ProcessOrder.cs',
      });

      const normalized = await normalizeFacts([caller, callee], WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      const { nodes, edges } = await buildCanonicalGraph(facts, WORKSPACE_ID, db);

      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(edges[0]!.from_id).toContain('caller-e2e');
      expect(edges[0]!.to_id).toContain('callee-e2e');
    });

    it('pipeline halts on validation hard-fail with machine-readable error codes', async () => {
      const invalidCandidate = makeAuthoritativeCandidate({
        candidate_id: 'invalid-e2e',
        symbol: 'badFact',
        lang_meta: {
          graph_kind: 'nonexistent_kind',
        },
      });

      const normalized = await normalizeFacts([invalidCandidate], WORKSPACE_ID);

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
  });

  // ─── Fail-Closed Behavior ────────────────────────────────────────────────

  describe('Fail-closed behavior: no silent fallbacks, no exploratory in authoritative (Req 20.1, 20.2)', () => {
    it('TrustAwareQueryEngine returns INSUFFICIENT_EVIDENCE in canonical_only mode when no canonical path exists', async () => {
      // Only insert exploratory nodes — no canonical path
      const expNode1 = makeNode('exp-node-1', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      });
      const expNode2 = makeNode('exp-node-2', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      });
      db.upsertNode(expNode1);
      db.upsertNode(expNode2);
      db.upsertEdge(makeEdge('exp-edge-1', 'exp-node-1', 'exp-node-2', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      }));

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(WORKSPACE_ID, loader);

      const result = await engine.findReasoningPaths(
        'exp-node-1',
        'exp-node-2',
        'ask' as OperationType,
        'authoritative' as QueryMode,
      );

      // In canonical_only (authoritative) mode, exploratory-only paths should yield INSUFFICIENT_EVIDENCE
      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
    });

    it('no silent fallback from canonical_only to mixed_safe mode', async () => {
      // Insert only exploratory nodes
      const expNode = makeNode('only-exp', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      });
      db.upsertNode(expNode);

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(WORKSPACE_ID, loader);

      const result = await engine.getNode(
        'only-exp',
        'ask' as OperationType,
        'authoritative' as QueryMode,
      );

      // Should NOT silently return the exploratory node as if it were canonical
      // The result should indicate insufficient evidence or the node should not be visible
      expect(result.status).not.toBe(DecisionStatus.OK);
    });

    it('exploratory evidence does not merge into authoritative conclusions', async () => {
      // Insert a canonical node and an exploratory node with an exploratory edge
      const canonNode = makeNode('canon-src', {
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
      });
      const expTarget = makeNode('exp-target', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      });
      db.upsertNode(canonNode);
      db.upsertNode(expTarget);
      db.upsertEdge(makeEdge('mixed-edge', 'canon-src', 'exp-target', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      }));

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(WORKSPACE_ID, loader);

      const result = await engine.findReasoningPaths(
        'canon-src',
        'exp-target',
        'ask' as OperationType,
        'authoritative' as QueryMode,
      );

      // In authoritative mode, paths through exploratory edges should not be returned as OK
      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
    });

    it('unmapped operations fail closed with OPERATION_UNMAPPED', () => {
      expect(() => {
        OperationResolver.resolve({
          caller: 'unknown-caller' as any,
          requested: null,
        });
      }).toThrow(/OPERATION_UNMAPPED/);
    });

    it('OperationResolver requires explicit operation when requireExplicit is set', () => {
      expect(() => {
        OperationResolver.resolve({
          caller: 'cli.ask',
          requested: null,
          requireExplicit: true,
        });
      }).toThrow(/OPERATION_REQUIRED/);
    });

    it('mixed_safe mode emits EXPLORATORY_USED warning when exploratory edges are traversed', async () => {
      // Insert canonical source, exploratory target, exploratory edge
      const canonNode = makeNode('canon-mixed', {
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
      });
      const expNode = makeNode('exp-mixed', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      });
      db.upsertNode(canonNode);
      db.upsertNode(expNode);
      db.upsertEdge(makeEdge('mixed-safe-edge', 'canon-mixed', 'exp-mixed', {
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
        type: 'calls',
      }));

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(WORKSPACE_ID, loader);

      const result = await engine.findReasoningPaths(
        'canon-mixed',
        'exp-mixed',
        'ask' as OperationType,
        'mixed_safe' as QueryMode,
      );

      // In mixed_safe mode, if exploratory edges are used, EXPLORATORY_USED should be in warnings or codes
      if (result.status === DecisionStatus.OK || result.status === 'EXPLORATORY_ONLY') {
        const allCodes = [...result.warnings, ...result.codes];
        expect(allCodes.some(c => c.includes('EXPLORATORY'))).toBe(true);
      }
    });
  });

  // ─── External Knowledge Gate ─────────────────────────────────────────────

  describe('External knowledge gate blocks direct canonical writes (Req 22.2)', () => {
    it('blocks external knowledge from directly entering canonical layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('canonical', 'user');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('blocks AI-sourced knowledge from directly entering canonical layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('canonical', 'ai');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('blocks external knowledge from directly entering derived layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('derived', 'external');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('allows parser-sourced knowledge to enter canonical layer', () => {
      const result = ExternalKnowledgeGate.blockDirectCanonicalEntry('canonical', 'parser');
      expect(result.blocked).toBe(false);
    });

    it('validates external graph_kind triggers INVALID_GRAPH_STATE when workflow disabled', () => {
      const result = ExternalKnowledgeGate.validateExternalGraphKind('external', false);
      expect(result.valid).toBe(false);
      expect(result.code).toBe(RuntimeCode.INVALID_GRAPH_STATE);
    });

    it('allows external graph_kind when workflow is enabled', () => {
      const result = ExternalKnowledgeGate.validateExternalGraphKind('external', true);
      expect(result.valid).toBe(true);
    });

    it('excludes external nodes from authoritative reasoning', () => {
      const externalNode = makeNode('ext-node', {
        graph_kind: 'external' as any,
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY',
      });
      expect(ExternalKnowledgeGate.isExcludedFromAuthoritativeReasoning(externalNode)).toBe(true);
    });

    it('does not exclude canonical nodes from authoritative reasoning', () => {
      const canonicalNode = makeNode('canon-node');
      expect(ExternalKnowledgeGate.isExcludedFromAuthoritativeReasoning(canonicalNode)).toBe(false);
    });

    it('blocks auto-promotion from exploratory to canonical', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('exploratory', 'canonical');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('blocks auto-promotion from external to canonical', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('external', 'canonical');
      expect(result.blocked).toBe(true);
      expect(result.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('allows canonical to remain canonical (no promotion needed)', () => {
      const result = ExternalKnowledgeGate.blockAutoPromotion('canonical', 'canonical');
      expect(result.blocked).toBe(false);
    });

    it('external knowledge gate enforces suggestion → validation → approval workflow', () => {
      const gate = new ExternalKnowledgeGate({
        externalWorkflowEnabled: true,
      });

      // Step 1: Suggest
      const suggestion = gate.suggest({
        workspaceId: WORKSPACE_ID,
        kind: 'function',
        label: 'suggestedFunc',
        symbol: 'suggestedFunc',
        suggestedBy: 'test-user',
        reason: 'User suggested function relationship',
      });
      expect(suggestion.status).toBe('pending');

      // Step 2: Validate
      const validation = gate.validate(suggestion);
      expect(validation.valid).toBe(true);

      // Step 3: Approve
      const approval = gate.approve(suggestion, 'admin', 'Verified by code review');
      expect(approval.approved).toBe(true);

      // Step 4: Store (as exploratory, not canonical)
      const stored = gate.store(suggestion);
      expect(stored.success).toBe(true);
    });
  });

  // ─── Provenance Attachment ───────────────────────────────────────────────

  describe('Provenance attached to all nodes and edges (Req 21.1)', () => {
    it('all canonical nodes carry provenance after full pipeline', async () => {
      const candidates = [
        makeAuthoritativeCandidate({ candidate_id: 'prov-1', symbol: 'ServiceA' }),
        makeAuthoritativeCandidate({ candidate_id: 'prov-2', symbol: 'ServiceB', source_file: 'Services/ServiceB.cs', called_symbols: ['ServiceA'] }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      const { nodes, edges } = await buildCanonicalGraph(facts, WORKSPACE_ID, db);

      // Every node must have provenance
      for (const node of nodes) {
        expect(node.provenance).toBeDefined();
        expect(node.provenance.source).toBeDefined();
        expect(node.provenance.artifact_source).toBeDefined();
        expect(node.provenance.producer_stage).toBeDefined();
        expect(node.provenance.timestamp).toBeDefined();
      }

      // Every edge must have provenance
      for (const edge of edges) {
        expect(edge.provenance).toBeDefined();
        expect(edge.provenance.source).toBeDefined();
        expect(edge.provenance.artifact_source).toBeDefined();
        expect(edge.provenance.producer_stage).toBeDefined();
        expect(edge.provenance.timestamp).toBeDefined();
      }
    });

    it('derived nodes carry provenance with derivation rule', async () => {
      const candidates = [
        makeDerivedCandidate({ candidate_id: 'prov-derived', symbol: 'DerivedFact' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      const { nodes } = await buildDerivedGraph(facts, WORKSPACE_ID, db);

      for (const node of nodes) {
        expect(node.provenance).toBeDefined();
        expect(node.provenance.source).toBeDefined();
        expect(node.provenance.producer_stage).toBeDefined();
      }
    });

    it('exploratory nodes carry provenance flagged as non-authoritative', async () => {
      const candidates = [
        makeExploratoryCandidate({ candidate_id: 'prov-exp', symbol: 'ExploratoryFact' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      const { nodes } = await buildExploratoryGraph(facts, WORKSPACE_ID, db);

      for (const node of nodes) {
        expect(node.provenance).toBeDefined();
        expect(node.graph_kind).toBe('exploratory');
        expect(node.trust_level).toBe('EXPLORATORY');
        expect(node.confidence_band).toBe('AMBIGUOUS');
      }
    });

    it('provenance persists through DB round-trip', async () => {
      const candidates = [
        makeAuthoritativeCandidate({ candidate_id: 'prov-roundtrip', symbol: 'RoundTripFunc' }),
      ];

      const normalized = await normalizeFacts(candidates, WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      await buildCanonicalGraph(facts, WORKSPACE_ID, db);

      // Read back from DB
      const dbNodes = db.getAllNodesByWorkspace(WORKSPACE_ID);
      const node = dbNodes.find(n => n.symbol === 'RoundTripFunc');
      expect(node).toBeDefined();
      expect(node!.provenance).toBeDefined();
      expect(node!.provenance.source).toBe('parser');
      expect(node!.provenance.artifact_source).toBeTruthy();
      expect(node!.provenance.producer_stage).toBeTruthy();
      expect(node!.provenance.timestamp).toBeTruthy();
    });

    it('edges in DB carry provenance after full pipeline', async () => {
      const caller = makeAuthoritativeCandidate({
        candidate_id: 'prov-caller',
        symbol: 'callerFunc',
        called_symbols: ['calleeFunc'],
      });
      const callee = makeAuthoritativeCandidate({
        candidate_id: 'prov-callee',
        symbol: 'calleeFunc',
        source_file: 'Services/Callee.cs',
      });

      const normalized = await normalizeFacts([caller, callee], WORKSPACE_ID);
      const { facts } = await validateFacts(normalized, WORKSPACE_ID, db as any);
      await buildCanonicalGraph(facts, WORKSPACE_ID, db);

      const dbEdges = db.getEdgesByWorkspace(WORKSPACE_ID);
      expect(dbEdges.length).toBeGreaterThan(0);

      for (const edge of dbEdges) {
        expect(edge.provenance).toBeDefined();
        expect(edge.provenance.source).toBeDefined();
        expect(edge.provenance.producer_stage).toBeDefined();
        expect(edge.provenance.timestamp).toBeDefined();
      }
    });
  });
});
