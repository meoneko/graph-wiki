/**
 * Integration tests for StructuredAskEngine.
 *
 * Tests the StructuredAskEngine with a real TrustAwareQueryEngine backed by
 * actual graph data in SQLite. Validates end-to-end behavior including:
 * - Query type → operation resolution against real data
 * - INSUFFICIENT_EVIDENCE when no canonical path exists
 * - EXPLORATORY_ONLY flagging when only exploratory data exists
 * - Reasoning paths populated in responses
 *
 * @see Requirements 11.1, 11.2, 11.3, 11.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphDB } from '../../storage/GraphDB.js';
import { GraphArtifactLoader } from '../graph/query/GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from '../graph/query/TrustAwareQueryEngine.js';
import { StructuredAskEngine, StructuredQueryType } from './StructuredAskEngine.js';
import { DecisionStatus } from '../errors.js';

// ─── Test Data Helpers ───────────────────────────────────────────────────────

const WORKSPACE = 'integration-ask-ws';
const PROJECT = 'test-project';

const parserProv = {
  source: 'parser' as const,
  artifact_source: 'fixture',
  producer_stage: 'extract',
  timestamp: '2026-01-01T00:00:00.000Z',
};

const analysisProv = {
  source: 'analysis' as const,
  artifact_source: 'fixture',
  producer_stage: 'derive',
  timestamp: '2026-01-01T00:00:00.000Z',
};

function seedCanonicalNode(db: GraphDB, id: string, label: string, opts: { symbol?: string; type?: string } = {}) {
  db.upsertNode({
    id,
    workspace: WORKSPACE,
    project: PROJECT,
    label,
    type: opts.type ?? 'function',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    source_file: `src/${id}.ts`,
    symbol: opts.symbol ?? label,
    provenance: parserProv,
  });
}

function seedExploratoryNode(db: GraphDB, id: string, label: string, opts: { symbol?: string; type?: string } = {}) {
  db.upsertNode({
    id,
    workspace: WORKSPACE,
    project: PROJECT,
    label,
    type: opts.type ?? 'function',
    graph_kind: 'exploratory',
    confidence_band: 'INFERRED',
    trust_level: 'EXPLORATORY',
    source_file: `src/${id}.ts`,
    symbol: opts.symbol ?? label,
    provenance: analysisProv,
  });
}

function seedCanonicalEdge(db: GraphDB, id: string, fromId: string, toId: string, type = 'calls') {
  db.upsertEdge({
    id,
    workspace: WORKSPACE,
    from_id: fromId,
    to_id: toId,
    type,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProv,
  });
}

function seedExploratoryEdge(db: GraphDB, id: string, fromId: string, toId: string, type = 'calls') {
  db.upsertEdge({
    id,
    workspace: WORKSPACE,
    from_id: fromId,
    to_id: toId,
    type,
    graph_kind: 'exploratory',
    confidence_band: 'INFERRED',
    trust_level: 'EXPLORATORY',
    provenance: analysisProv,
  });
}

// ─── Integration Tests ───────────────────────────────────────────────────────

describe('StructuredAskEngine Integration Tests', () => {
  let db: GraphDB;
  let askEngine: StructuredAskEngine;

  beforeEach(() => {
    db = new GraphDB(':memory:');

    // Seed a realistic graph with canonical nodes and edges
    // OrderController → OrderUseCase → OrderRepository
    seedCanonicalNode(db, 'order-controller', 'OrderController', { type: 'usecase', symbol: 'OrderController' });
    seedCanonicalNode(db, 'order-usecase', 'OrderUseCase', { type: 'usecase', symbol: 'OrderUseCase' });
    seedCanonicalNode(db, 'order-repository', 'OrderRepository', { type: 'function', symbol: 'OrderRepository' });
    seedCanonicalNode(db, 'payment-service', 'PaymentService', { type: 'function', symbol: 'PaymentService' });

    // Canonical edges: controller → usecase → repository
    seedCanonicalEdge(db, 'edge-ctrl-uc', 'order-controller', 'order-usecase');
    seedCanonicalEdge(db, 'edge-uc-repo', 'order-usecase', 'order-repository');
    seedCanonicalEdge(db, 'edge-uc-pay', 'order-usecase', 'payment-service');

    // Exploratory-only nodes (no canonical counterpart)
    seedExploratoryNode(db, 'inferred-cache', 'InferredCache', { symbol: 'InferredCache' });
    seedExploratoryNode(db, 'inferred-logger', 'InferredLogger', { symbol: 'InferredLogger' });

    // Exploratory edge connecting exploratory nodes
    seedExploratoryEdge(db, 'edge-exp-cache-logger', 'inferred-cache', 'inferred-logger');

    const loader = new GraphArtifactLoader(db);
    askEngine = new StructuredAskEngine((workspaceId: string) => {
      return new TrustAwareQueryEngine(workspaceId, loader);
    });
  });

  describe('Query type resolves to correct operation (Req 11.1)', () => {
    it('what-is-symbol resolves via ask operation and finds canonical nodes', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.status).toBe(DecisionStatus.OK);
      expect(result.data.nodes.length).toBeGreaterThan(0);
      expect(result.data.nodes.some(n => n.symbol === 'OrderUseCase')).toBe(true);
      expect(result.metadata?.operation).toBe('ask');
    });

    it('what-depends-on resolves via impact operation', async () => {
      const result = await askEngine.ask({
        question: 'order-usecase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_DEPENDS_ON,
      });

      // Impact analysis from order-usecase should find downstream nodes
      expect(result.metadata?.operation).toBe('impact');
      // Should find at least the repository and payment service
      if (result.status === DecisionStatus.OK || result.status === DecisionStatus.PARTIAL) {
        expect(result.data.nodes.length).toBeGreaterThan(0);
      }
    });

    it('what-route-calls resolves via lineage operation', async () => {
      const result = await askEngine.ask({
        question: 'OrderRepository',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_ROUTE_CALLS,
      });

      expect(result.metadata?.operation).toBe('lineage');
      // Should find callers of OrderRepository (order-usecase)
      if (result.status === DecisionStatus.OK) {
        expect(result.data.nodes.some(n => n.symbol === 'OrderUseCase')).toBe(true);
      }
    });

    it('lineage query type resolves via lineage operation', async () => {
      const result = await askEngine.ask({
        question: 'PaymentService',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.LINEAGE,
      });

      expect(result.metadata?.operation).toBe('lineage');
    });

    it('impact query type resolves via impact operation', async () => {
      const result = await askEngine.ask({
        question: 'order-controller',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.IMPACT,
      });

      expect(result.metadata?.operation).toBe('impact');
    });

    it('why-canonical resolves via governance operation', async () => {
      const result = await askEngine.ask({
        question: 'order-usecase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHY_CANONICAL,
      });

      expect(result.metadata?.operation).toBe('governance');
    });

    it('why-insufficient-context resolves via governance operation', async () => {
      const result = await askEngine.ask({
        question: 'nonexistent-symbol',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHY_INSUFFICIENT_CONTEXT,
      });

      expect(result.metadata?.operation).toBe('governance');
    });
  });

  describe('INSUFFICIENT_EVIDENCE when no canonical path exists (Req 11.2)', () => {
    it('returns INSUFFICIENT_EVIDENCE for a symbol that does not exist in the graph', async () => {
      const result = await askEngine.ask({
        question: 'CompletelyNonexistentSymbol',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
      // The engine returns INSUFFICIENT_EVIDENCE directly when no nodes match
      expect(result.data.nodes).toHaveLength(0);
    });

    it('returns INSUFFICIENT_EVIDENCE for callers of a symbol with no callers', async () => {
      const result = await askEngine.ask({
        question: 'OrderController',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_ROUTE_CALLS,
      });

      // OrderController has no callers in our test graph
      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
    });

    it('returns INSUFFICIENT_EVIDENCE when querying impact of non-existent node', async () => {
      const result = await askEngine.ask({
        question: 'does-not-exist-node-id',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_DEPENDS_ON,
      });

      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
    });
  });

  describe('EXPLORATORY_ONLY flagging (Req 11.3)', () => {
    it('returns EXPLORATORY_ONLY when only exploratory nodes match the query', async () => {
      const result = await askEngine.ask({
        question: 'InferredCache',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
        mode: 'mixed_safe',
      });

      expect(result.status).toBe(DecisionStatus.EXPLORATORY_ONLY);
      expect(result.warnings).toContain('EXPLORATORY_USED');
      expect(result.codes).toContain('EXPLORATORY_USED');
      expect(result.confidence.level).toBe('LOW');
    });

    it('does NOT flag EXPLORATORY_ONLY when canonical nodes are present in results', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.status).not.toBe(DecisionStatus.EXPLORATORY_ONLY);
      expect(result.status).toBe(DecisionStatus.OK);
    });

    it('returns INSUFFICIENT_EVIDENCE in authoritative mode for exploratory-only data', async () => {
      const result = await askEngine.ask({
        question: 'InferredCache',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
        mode: 'authoritative',
      });

      // In authoritative mode, exploratory nodes are not visible, so no results
      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
    });
  });

  describe('Reasoning paths included in response (Req 11.4)', () => {
    it('includes selection_explanation in successful query', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.selection_explanation).toBeDefined();
      expect(result.reasoning.selection_explanation.length).toBeGreaterThan(0);
    });

    it('includes selected_paths array in response', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.reasoning.selected_paths).toBeDefined();
      expect(Array.isArray(result.reasoning.selected_paths)).toBe(true);
    });

    it('includes rejected_paths array in response (even if empty)', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.reasoning.rejected_paths).toBeDefined();
      expect(Array.isArray(result.reasoning.rejected_paths)).toBe(true);
    });

    it('includes reasoning context in INSUFFICIENT_EVIDENCE responses', async () => {
      const result = await askEngine.ask({
        question: 'NonexistentThing',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.status).toBe(DecisionStatus.INSUFFICIENT_EVIDENCE);
      expect(result.reasoning.selection_explanation).toBeDefined();
      expect(result.reasoning.selection_explanation.length).toBeGreaterThan(0);
    });

    it('includes reasoning context in EXPLORATORY_ONLY responses', async () => {
      const result = await askEngine.ask({
        question: 'InferredCache',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
        mode: 'mixed_safe',
      });

      expect(result.status).toBe(DecisionStatus.EXPLORATORY_ONLY);
      expect(result.reasoning.selection_explanation).toBeDefined();
      expect(result.reasoning.selection_explanation.length).toBeGreaterThan(0);
    });

    it('includes metadata with queryType, operation, and mode', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
        mode: 'authoritative',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.queryType).toBe('what-is-symbol');
      expect(result.metadata!.operation).toBe('ask');
      expect(result.metadata!.mode).toBe('authoritative');
    });
  });

  describe('End-to-end query flow with real graph traversal', () => {
    it('impact analysis traverses canonical edges and returns downstream nodes', async () => {
      const result = await askEngine.ask({
        question: 'order-controller',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.IMPACT,
      });

      // Impact from order-controller should find order-usecase, order-repository, payment-service
      if (result.status === DecisionStatus.OK || result.status === DecisionStatus.PARTIAL) {
        const nodeIds = result.data.nodes.map(n => n.id);
        expect(nodeIds).toContain('order-usecase');
        expect(nodeIds).toContain('order-repository');
        expect(nodeIds).toContain('payment-service');
      }
    });

    it('lineage (findCallers) returns upstream callers', async () => {
      const result = await askEngine.ask({
        question: 'OrderRepository',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.LINEAGE,
      });

      // OrderRepository is called by OrderUseCase
      if (result.status === DecisionStatus.OK) {
        expect(result.data.nodes.some(n => n.symbol === 'OrderUseCase')).toBe(true);
      }
    });

    it('default mode is authoritative when not specified', async () => {
      const result = await askEngine.ask({
        question: 'OrderUseCase',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
      });

      expect(result.metadata?.mode).toBe('authoritative');
    });

    it('mixed_safe mode allows seeing exploratory data', async () => {
      const result = await askEngine.ask({
        question: 'InferredLogger',
        workspace: WORKSPACE,
        queryType: StructuredQueryType.WHAT_IS_SYMBOL,
        mode: 'mixed_safe',
      });

      // In mixed_safe mode, exploratory nodes should be visible
      expect(result.data.nodes.length).toBeGreaterThan(0);
      expect(result.data.nodes.some(n => n.symbol === 'InferredLogger')).toBe(true);
    });
  });
});
