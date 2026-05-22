import { describe, expect, it } from 'vitest';
import { GraphDB } from '../../../storage/GraphDB.js';
import { GraphArtifactLoader } from './GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from './TrustAwareQueryEngine.js';
import { OperationResolver } from './OperationResolver.js';

const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;
const analysisProv = { source: 'analysis', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

describe('Trust Enforcement Integration Tests', () => {
  describe('1. canonical_only mode returns INSUFFICIENT_EVIDENCE when no canonical path exists', () => {
    it('returns INSUFFICIENT_EVIDENCE when two canonical nodes are connected only by an exploratory edge', async () => {
      const ws = 'canonical-only-no-path-ws';
      const db = new GraphDB(':memory:');

      // Two canonical nodes
      db.upsertNode({
        id: 'a',
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
        id: 'b',
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

      // Only an exploratory edge connects them
      db.upsertEdge({
        id: 'exp-edge',
        workspace: ws,
        from_id: 'a',
        to_id: 'b',
        type: 'calls',
        graph_kind: 'exploratory',
        confidence_band: 'EXTRACTED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // authoritative mode maps to canonical_only
      const result = await engine.findReasoningPaths('a', 'b', 'ask', 'authoritative');
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    });
  });

  describe('2. mixed_safe mode emits EXPLORATORY_USED warning', () => {
    it('emits EXPLORATORY_USED when path traverses an exploratory edge', async () => {
      const ws = 'mixed-safe-exploratory-warn-ws';
      const db = new GraphDB(':memory:');

      db.upsertNode({
        id: 'a',
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
        id: 'b',
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

      // Exploratory edge with EXTRACTED confidence (allowed in mixed_safe)
      db.upsertEdge({
        id: 'exp-edge',
        workspace: ws,
        from_id: 'a',
        to_id: 'b',
        type: 'calls',
        graph_kind: 'exploratory',
        confidence_band: 'EXTRACTED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      const result = await engine.findReasoningPaths('a', 'b', 'ask', 'mixed_safe');
      expect(result.status).not.toBe('INSUFFICIENT_EVIDENCE');
      expect(result.warnings).toContain('EXPLORATORY_USED');
      expect(result.codes).toContain('EXPLORATORY_USED');
    });
  });

  describe('3. mixed_safe mode returns INSUFFICIENT_EVIDENCE beyond 2-hop exploratory bound', () => {
    it('returns INSUFFICIENT_EVIDENCE when path requires 3 exploratory hops', async () => {
      const ws = 'mixed-safe-hop-limit-ws';
      const db = new GraphDB(':memory:');

      // Chain: A → B → C → D (all exploratory edges)
      const nodes = ['a', 'b', 'c', 'd'];
      for (const id of nodes) {
        db.upsertNode({
          id,
          workspace: ws,
          project: 'test',
          label: id.toUpperCase(),
          type: 'function',
          graph_kind: 'canonical',
          confidence_band: 'AUTHORITATIVE',
          trust_level: 'AUTHORITATIVE',
          source_file: `src/${id}.ts`,
          symbol: id.toUpperCase(),
          provenance: parserProv,
        });
      }

      // 3 exploratory edges: a→b, b→c, c→d
      db.upsertEdge({
        id: 'e1',
        workspace: ws,
        from_id: 'a',
        to_id: 'b',
        type: 'calls',
        graph_kind: 'exploratory',
        confidence_band: 'EXTRACTED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });
      db.upsertEdge({
        id: 'e2',
        workspace: ws,
        from_id: 'b',
        to_id: 'c',
        type: 'calls',
        graph_kind: 'exploratory',
        confidence_band: 'EXTRACTED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });
      db.upsertEdge({
        id: 'e3',
        workspace: ws,
        from_id: 'c',
        to_id: 'd',
        type: 'calls',
        graph_kind: 'exploratory',
        confidence_band: 'EXTRACTED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      // Path from a to d requires 3 exploratory hops, exceeding the 2-hop limit
      const result = await engine.findReasoningPaths('a', 'd', 'ask', 'mixed_safe');
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    });
  });

  describe('4. governance rejects exploratory authority reasoning', () => {
    it('returns POLICY_VIOLATION with AUTHORITY_CHAIN_BROKEN for exploratory authority edges', async () => {
      const ws = 'governance-reject-exploratory-ws';
      const db = new GraphDB(':memory:');

      db.upsertNode({
        id: 'svc',
        workspace: ws,
        project: 'test',
        label: 'Service',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/svc.ts',
        symbol: 'Service',
        provenance: parserProv,
      });
      db.upsertNode({
        id: 'policy',
        workspace: ws,
        project: 'test',
        label: 'Policy',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/policy.ts',
        symbol: 'Policy',
        provenance: parserProv,
      });

      // An exploratory uses_authority edge — governance should reject this
      db.upsertEdge({
        id: 'exp-authority',
        workspace: ws,
        from_id: 'svc',
        to_id: 'policy',
        type: 'uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'EXTRACTED',
        trust_level: 'EXPLORATORY',
        provenance: analysisProv,
      });

      const loader = new GraphArtifactLoader(db);
      const engine = new TrustAwareQueryEngine(ws, loader);

      const result = await engine.findReasoningPaths('svc', 'policy', 'governance', 'mixed_safe');
      expect(result.status).toBe('POLICY_VIOLATION');
      expect(result.codes).toContain('AUTHORITY_CHAIN_BROKEN');
    });
  });

  describe('5. workspace isolation prevents cross-workspace queries', () => {
    it('engine scoped to workspace A cannot find paths to workspace B nodes', async () => {
      const db = new GraphDB(':memory:');
      const wsA = 'isolation-ws-a';
      const wsB = 'isolation-ws-b';

      // Seed workspace A
      db.upsertNode({
        id: `${wsA}:src`,
        workspace: wsA,
        project: 'test',
        label: 'Source',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/source.ts',
        symbol: 'Source',
        provenance: parserProv,
      });
      db.upsertNode({
        id: `${wsA}:dst`,
        workspace: wsA,
        project: 'test',
        label: 'Dest',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/dest.ts',
        symbol: 'Dest',
        provenance: parserProv,
      });
      db.upsertEdge({
        id: `${wsA}:e1`,
        workspace: wsA,
        from_id: `${wsA}:src`,
        to_id: `${wsA}:dst`,
        type: 'calls',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance: parserProv,
      });

      // Seed workspace B
      db.upsertNode({
        id: `${wsB}:target`,
        workspace: wsB,
        project: 'test',
        label: 'Target',
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        source_file: 'src/target.ts',
        symbol: 'Target',
        provenance: parserProv,
      });

      const loader = new GraphArtifactLoader(db);
      const engineA = new TrustAwareQueryEngine(wsA, loader);

      // Engine scoped to workspace A cannot access workspace B nodes
      const result = await engineA.findReasoningPaths(`${wsA}:src`, `${wsB}:target`, 'ask', 'mixed_safe');
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');

      // Verify workspace A internal queries still work
      const internalResult = await engineA.findReasoningPaths(`${wsA}:src`, `${wsA}:dst`, 'ask', 'authoritative');
      expect(internalResult.status).toBe('OK');
    });
  });

  describe('6. unmapped operations fail with OPERATION_UNMAPPED', () => {
    it('OperationResolver.resolve throws OPERATION_UNMAPPED for unregistered callers', () => {
      expect(() =>
        OperationResolver.resolve({ caller: 'unknown.unregistered.caller' as any })
      ).toThrow(/OPERATION_UNMAPPED/);
    });

    it('error message includes the caller identifier', () => {
      try {
        OperationResolver.resolve({ caller: 'bogus.tool.name' as any });
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('OPERATION_UNMAPPED');
        expect(e.message).toContain('bogus.tool.name');
      }
    });
  });
});
