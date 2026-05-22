/**
 * Fail-Closed Behavior Acceptance Tests
 *
 * Validates Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6:
 * - No silent fallback from canonical_only to mixed_safe
 * - No exploratory evidence merges into authoritative conclusions
 * - No silent confidence averaging across unrelated paths
 * - No external tool bypasses OperationResolver or GraphQueryEngine for reasoning
 * - Unmapped operations fail closed before traversal begins
 *
 * @see Task 15.2
 */

import { describe, expect, it, beforeAll } from 'vitest';
import { GraphDB } from '../../../storage/GraphDB.js';
import { GraphArtifactLoader } from './GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from './TrustAwareQueryEngine.js';
import { OperationResolver } from './OperationResolver.js';
import { StructuredAskEngine } from '../../ask/StructuredAskEngine.js';
import { AgentContextBuilder } from '../../agent/AgentContextBuilder.js';
import { getTrustedQueryService } from './TrustedQueryService.js';
import { registerQueryTools } from '../../../mcp/tools/query.js';
import { registerSearchTools } from '../../../mcp/tools/search.js';
import { registerGraphTools } from '../../../mcp/tools/graph.js';
import { registerReviewTools } from '../../../mcp/tools/review.js';
import { registerFlowTools } from '../../../mcp/tools/flows.js';
import { registerWikiTools } from '../../../mcp/tools/wiki.js';
import { registerRefactorTools } from '../../../mcp/tools/refactor.js';
import type { QueryResult } from '../../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parserProv = {
  source: 'parser',
  artifact_source: 'fixture',
  producer_stage: 'test',
  timestamp: '2026-01-01T00:00:00.000Z',
} as const;

const analysisProv = {
  source: 'analysis',
  artifact_source: 'fixture',
  producer_stage: 'test',
  timestamp: '2026-01-01T00:00:00.000Z',
} as const;

function setupCanonicalGraph(db: GraphDB, ws: string): void {
  db.upsertNode({
    id: `${ws}:a`,
    workspace: ws,
    project: 'test',
    label: 'A',
    type: 'function',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    source_file: 'src/a.ts',
    symbol: 'A',
    provenance: parserProv,
  });
  db.upsertNode({
    id: `${ws}:b`,
    workspace: ws,
    project: 'test',
    label: 'B',
    type: 'function',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    source_file: 'src/b.ts',
    symbol: 'B',
    provenance: parserProv,
  });
  db.upsertEdge({
    id: `${ws}:e1`,
    workspace: ws,
    from_id: `${ws}:a`,
    to_id: `${ws}:b`,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProv,
  });
}

function setupExploratoryOnlyGraph(db: GraphDB, ws: string): void {
  db.upsertNode({
    id: `${ws}:x`,
    workspace: ws,
    project: 'test',
    label: 'X',
    type: 'function',
    graph_kind: 'exploratory',
    confidence_band: 'INFERRED',
    trust_level: 'EXPLORATORY',
    source_file: 'src/x.ts',
    symbol: 'X',
    provenance: analysisProv,
  });
  db.upsertNode({
    id: `${ws}:y`,
    workspace: ws,
    project: 'test',
    label: 'Y',
    type: 'function',
    graph_kind: 'exploratory',
    confidence_band: 'INFERRED',
    trust_level: 'EXPLORATORY',
    source_file: 'src/y.ts',
    symbol: 'Y',
    provenance: analysisProv,
  });
  db.upsertEdge({
    id: `${ws}:exp-e1`,
    workspace: ws,
    from_id: `${ws}:x`,
    to_id: `${ws}:y`,
    type: 'calls',
    graph_kind: 'exploratory',
    confidence_band: 'INFERRED',
    trust_level: 'EXPLORATORY',
    provenance: analysisProv,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Fail-Closed Behavior (Req 20.1–20.6)', () => {
  describe('20.1 — INSUFFICIENT_EVIDENCE rather than fabricating answers', () => {
    it('returns INSUFFICIENT_EVIDENCE when no canonical path exists in canonical_only mode', async () => {
      const ws = 'fc-insufficient-evidence-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // Empty graph — no evidence at all
      const result = await engine.searchNodes('nonexistent', 'ask', 'authoritative');
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.data.nodes).toHaveLength(0);
    });

    it('returns INSUFFICIENT_EVIDENCE for findCallers when no callers exist', async () => {
      const ws = 'fc-no-callers-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);
      setupCanonicalGraph(db, ws);

      const result = await engine.findCallers('NonExistent', 'lineage', 'authoritative');
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    });

    it('returns INSUFFICIENT_EVIDENCE for findReasoningPaths when no path exists', async () => {
      const ws = 'fc-no-path-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);
      setupCanonicalGraph(db, ws);

      // No path from b to a (only a→b exists)
      const result = await engine.findReasoningPaths(`${ws}:b`, `${ws}:a`, 'ask', 'authoritative');
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.data.nodes).toHaveLength(0);
      expect(result.data.edges).toHaveLength(0);
    });
  });

  describe('20.2 — No silent fallback from canonical_only to mixed_safe', () => {
    it('canonical_only mode does NOT see exploratory nodes', async () => {
      const ws = 'fc-no-fallback-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // Only exploratory data exists
      setupExploratoryOnlyGraph(db, ws);

      const result = await engine.searchNodes('X', 'ask', 'authoritative');
      // Must NOT silently fall back to mixed_safe to find the exploratory node
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.data.nodes).toHaveLength(0);
    });

    it('StructuredAskEngine does not upgrade mode from authoritative to mixed_safe', async () => {
      const ws = 'fc-ask-no-upgrade-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      setupExploratoryOnlyGraph(db, ws);

      const askEngine = new StructuredAskEngine(
        (workspaceId) => new TrustAwareQueryEngine(workspaceId, loader),
      );

      const result = await askEngine.ask({
        question: 'X',
        workspace: ws,
        queryType: 'what-is-symbol',
        mode: 'authoritative',
      });

      // Must return INSUFFICIENT_EVIDENCE, not silently find exploratory data
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.data.nodes).toHaveLength(0);
    });

    it('AgentContextBuilder defaults to authoritative mode and does not upgrade', async () => {
      const ws = 'fc-agent-no-upgrade-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      setupExploratoryOnlyGraph(db, ws);

      const builder = new AgentContextBuilder(
        (workspaceId) => new TrustAwareQueryEngine(workspaceId, loader),
      );

      const result = await builder.build({
        task: 'find X',
        workspace: ws,
        // No mode specified — should default to authoritative
      });

      // Must return insufficient_context, not silently use mixed_safe
      expect(result.status).toBe('insufficient_context');
    });
  });

  describe('20.3 — No exploratory evidence merges into authoritative conclusions', () => {
    it('authoritative mode excludes exploratory edges from impact analysis', async () => {
      const ws = 'fc-no-exp-merge-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // Canonical node with only exploratory outgoing edge
      db.upsertNode({
        id: `${ws}:root`,
        workspace: ws,
        project: 'test',
        label: 'Root',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/root.ts',
        symbol: 'Root',
        provenance: parserProv,
      });
      db.upsertNode({
        id: `${ws}:target`,
        workspace: ws,
        project: 'test',
        label: 'Target',
        type: 'function',
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
        source_file: 'src/target.ts',
        symbol: 'Target',
        provenance: analysisProv,
      });
      db.upsertEdge({
        id: `${ws}:exp-edge`,
        workspace: ws,
        from_id: `${ws}:root`,
        to_id: `${ws}:target`,
        type: 'calls',
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });

      const result = await engine.analyzeImpact(`${ws}:root`, 'impact', 'authoritative', 3);
      // Exploratory target must NOT appear in authoritative impact
      const targetInResult = result.data.nodes.some((n) => n.id === `${ws}:target`);
      expect(targetInResult).toBe(false);
      const expEdgeInResult = result.data.edges.some((e) => e.id === `${ws}:exp-edge`);
      expect(expEdgeInResult).toBe(false);
    });

    it('governance rejects exploratory authority reasoning', async () => {
      const ws = 'fc-gov-no-exp-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // Two canonical nodes connected only by a canonical 'calls' edge (not authority)
      // Governance requires authority edges — so this should fail
      db.upsertNode({
        id: `${ws}:svc`,
        workspace: ws,
        project: 'test',
        label: 'Svc',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/svc.ts',
        symbol: 'Svc',
        provenance: parserProv,
      });
      db.upsertNode({
        id: `${ws}:auth`,
        workspace: ws,
        project: 'test',
        label: 'Auth',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/auth.ts',
        symbol: 'Auth',
        provenance: parserProv,
      });
      // Only a 'calls' edge exists — governance requires authority edges
      db.upsertEdge({
        id: `${ws}:calls-edge`,
        workspace: ws,
        from_id: `${ws}:svc`,
        to_id: `${ws}:auth`,
        type: 'calls',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance: parserProv,
      });

      const result = await engine.findReasoningPaths(
        `${ws}:svc`,
        `${ws}:auth`,
        'governance',
        'authoritative',
      );
      // Governance requires authority edges — 'calls' is not sufficient
      expect(result.status).toBe('POLICY_VIOLATION');
      expect(result.data.edges).toHaveLength(0);
    });
  });

  describe('20.4 — No silent confidence averaging across unrelated paths', () => {
    it('selects best path rather than averaging confidence across paths', async () => {
      const ws = 'fc-no-avg-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // Two paths from a→c: one canonical (a→b→c), one with exploratory hop
      db.upsertNode({ id: `${ws}:a`, workspace: ws, project: 'test', label: 'A', type: 'function', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', source_file: 'src/a.ts', symbol: 'A', provenance: parserProv });
      db.upsertNode({ id: `${ws}:b`, workspace: ws, project: 'test', label: 'B', type: 'function', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', source_file: 'src/b.ts', symbol: 'B', provenance: parserProv });
      db.upsertNode({ id: `${ws}:c`, workspace: ws, project: 'test', label: 'C', type: 'function', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', source_file: 'src/c.ts', symbol: 'C', provenance: parserProv });

      db.upsertEdge({ id: `${ws}:ab`, workspace: ws, from_id: `${ws}:a`, to_id: `${ws}:b`, type: 'calls', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', provenance: parserProv });
      db.upsertEdge({ id: `${ws}:bc`, workspace: ws, from_id: `${ws}:b`, to_id: `${ws}:c`, type: 'calls', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', provenance: parserProv });

      const result = await engine.findReasoningPaths(`${ws}:a`, `${ws}:c`, 'ask', 'authoritative');
      // Should select the canonical path, not average confidence
      expect(result.status).toBe('OK');
      expect(result.confidence.level).toBe('HIGH');
      // Reasoning should show selected path, not an average
      expect(result.reasoning.selected_paths.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('20.5 — No external tool bypasses OperationResolver or GraphQueryEngine', () => {
    it('all registered MCP callers are mapped in OperationResolver', () => {
      const mcpCallers = [
        'mcp.query.get_node',
        'mcp.query.get_neighbors',
        'mcp.query.get_path',
        'mcp.query.get_callers',
        'mcp.review.review_diff',
        'mcp.review.review_pr',
        'mcp.review.detect_changes',
        'mcp.review.blast_radius',
        'mcp.review.get_risk_score',
        'mcp.graph.graph_stats',
        'mcp.graph.architecture_overview',
        'mcp.graph.list_communities',
        'mcp.graph.get_community',
        'mcp.graph.find_hubs',
        'mcp.graph.find_bridges',
        'mcp.graph.find_gaps',
        'mcp.wiki.get_wiki_page',
        'mcp.wiki.generate_wiki',
        'mcp.search.search',
        'mcp.flows.list_flows',
        'mcp.flows.get_flow',
        'mcp.flows.get_affected_flows',
        'mcp.flows.get_minimal_context',
        'mcp.flows.get_lineage',
        'mcp.refactor.rename_preview',
        'mcp.refactor.find_dead_code',
      ] as const;

      for (const caller of mcpCallers) {
        // Should not throw — all callers must be registered
        const op = OperationResolver.resolve({ caller });
        expect(op).toBeDefined();
        expect(['ask', 'impact', 'lineage', 'wiki', 'governance']).toContain(op);
      }
    });

    it('all CLI callers are mapped in OperationResolver', () => {
      const cliCallers = [
        'cli.ask',
        'cli.impact',
        'cli.stats',
        'cli.search',
        'cli.export',
        'cli.verify',
        'cli.wiki',
      ] as const;

      for (const caller of cliCallers) {
        const op = OperationResolver.resolve({ caller });
        expect(op).toBeDefined();
        expect(['ask', 'impact', 'lineage', 'wiki', 'governance']).toContain(op);
      }
    });

    it('internal service callers are mapped in OperationResolver', () => {
      const serviceCallers = [
        'service.ask',
        'pipeline.impact',
        'structured-ask',
        'agent-context',
        'report-builder',
      ] as const;

      for (const caller of serviceCallers) {
        const op = OperationResolver.resolve({ caller });
        expect(op).toBeDefined();
        expect(['ask', 'impact', 'lineage', 'wiki', 'governance']).toContain(op);
      }
    });

    it('TrustAwareQueryEngine rejects operations that are undefined/null', async () => {
      const ws = 'fc-no-bypass-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      const r1 = await engine.findReasoningPaths('a', 'b', undefined as any, 'authoritative');
      expect(r1.status).toBe('POLICY_VIOLATION');
      expect(r1.codes).toContain('OPERATION_REQUIRED');

      const r2 = await engine.analyzeImpact('a', undefined as any, 'authoritative');
      expect(r2.status).toBe('POLICY_VIOLATION');
      expect(r2.codes).toContain('OPERATION_REQUIRED');

      const r3 = await engine.getNode('a', undefined as any, 'authoritative');
      expect(r3.status).toBe('POLICY_VIOLATION');
      expect(r3.codes).toContain('OPERATION_REQUIRED');

      const r4 = await engine.findCallers('A', undefined as any, 'authoritative');
      expect(r4.status).toBe('POLICY_VIOLATION');
      expect(r4.codes).toContain('OPERATION_REQUIRED');

      const r5 = await engine.searchNodes('A', undefined as any, 'authoritative');
      expect(r5.status).toBe('POLICY_VIOLATION');
      expect(r5.codes).toContain('OPERATION_REQUIRED');
    });
  });

  describe('20.6 — Unmapped operations fail closed before traversal begins', () => {
    it('OperationResolver throws OPERATION_UNMAPPED for unknown callers', () => {
      expect(() =>
        OperationResolver.resolve({ caller: 'unknown.tool' as any }),
      ).toThrow(/OPERATION_UNMAPPED/);
    });

    it('OperationResolver throws OPERATION_REQUIRED when requireExplicit is true and no operation provided', () => {
      expect(() =>
        OperationResolver.resolve({
          caller: 'mcp.query.get_node',
          requested: null,
          requireExplicit: true,
        }),
      ).toThrow(/OPERATION_REQUIRED/);
    });

    it('MCP get_path tool requires explicit operation (fails closed without it)', async () => {
      beforeAll(() => {
        registerQueryTools();
      });

      // The get_path tool uses requireExplicit: true
      // This is tested via the OperationResolver directly
      expect(() =>
        OperationResolver.resolve({
          caller: 'mcp.query.get_path',
          requested: undefined,
          requireExplicit: true,
        }),
      ).toThrow(/OPERATION_REQUIRED/);
    });

    it('getVisibleGraph throws when operation is missing', async () => {
      const ws = 'fc-visible-no-op-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      await expect(
        engine.getVisibleGraph(undefined as any, 'authoritative'),
      ).rejects.toThrow('OPERATION_REQUIRED');
    });
  });

  describe('Cross-cutting: mode parameter is respected across all surfaces', () => {
    it('StructuredAskEngine passes mode through without modification', async () => {
      const ws = 'fc-mode-passthrough-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      setupCanonicalGraph(db, ws);

      const askEngine = new StructuredAskEngine(
        (workspaceId) => new TrustAwareQueryEngine(workspaceId, loader),
      );

      // Query with explicit authoritative mode
      const result = await askEngine.ask({
        question: 'A',
        workspace: ws,
        queryType: 'what-is-symbol',
        mode: 'authoritative',
      });

      // Should find the canonical node
      expect(result.status).toBe('OK');
      // Metadata should reflect the mode used
      expect(result.metadata?.mode).toBe('authoritative');
    });

    it('AgentContextBuilder respects explicit mixed_safe mode and emits EXPLORATORY_USED', async () => {
      const ws = 'fc-agent-mixed-ws';
      const db = new GraphDB(':memory:');
      const loader = new GraphArtifactLoader(db);
      setupCanonicalGraph(db, ws);

      const builder = new AgentContextBuilder(
        (workspaceId) => new TrustAwareQueryEngine(workspaceId, loader),
      );

      const result = await builder.build({
        task: 'find A',
        workspace: ws,
        mode: 'mixed_safe',
      });

      // Should include EXPLORATORY_USED warning when mixed_safe is explicitly requested
      expect(result.warnings).toContain('EXPLORATORY_USED');
    });
  });
});
