import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { QueryResult } from '../../types.js';
import { GraphDB, getDB } from '../../../storage/GraphDB.js';
import { GraphArtifactLoader } from './GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from './TrustAwareQueryEngine.js';
import { OperationResolver } from './OperationResolver.js';
import { QueryResultFactory } from './QueryResultFactory.js';
import { getTrustedQueryService } from './TrustedQueryService.js';
import { registerQueryTools } from '../../../mcp/tools/query.js';
import { registerGraphTools } from '../../../mcp/tools/graph.js';
import { registerWikiTools } from '../../../mcp/tools/wiki.js';
import { invokeTool } from '../../../mcp/tools/runtime.js';
import { resolveDbPath } from '../../../pipeline/config.js';
import { semanticSearch } from '../../query/semantic.js';

function assertQueryResultShape(result: unknown): asserts result is QueryResult {
  const required = ['status', 'reasoning', 'data', 'confidence', 'provenance', 'warnings', 'codes'];
  const objectResult = result as Record<string, unknown>;
  for (const key of required) {
    expect(Object.prototype.hasOwnProperty.call(objectResult, key)).toBe(true);
  }
}

describe('OperationResolver + QueryResultFactory acceptance', () => {
  beforeAll(() => {
    registerQueryTools();
    registerGraphTools();
    registerWikiTools();
  });

  it('fails when operation is missing for explicit-operation tools', async () => {
    await expect(
      invokeTool('get_path', {
        fromId: 'a',
        toId: 'b',
        workspaceId: 'missing-op-ws',
        mode: 'mixed_safe',
      }),
    ).rejects.toThrow(/OPERATION_REQUIRED/);
  });

  it('get_neighbors returns QueryResult', async () => {
    const db = getDB(resolveDbPath());
    const workspaceId = 'neighbors-queryresult-ws';
    db.clearWorkspaceData(workspaceId, []);
    const provenance = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: `${workspaceId}:a`,
      workspace: workspaceId,
      project: 'test',
      label: 'A',
      type: 'method', roles: ['entrypoint', 'http_handler'], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/A.ts',
      symbol: 'A',
      provenance,
    });
    db.upsertNode({
      id: `${workspaceId}:b`,
      workspace: workspaceId,
      project: 'test',
      label: 'B',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/B.ts',
      symbol: 'B',
      provenance,
    });
    db.upsertEdge({
      id: `${workspaceId}:e1`,
      workspace: workspaceId,
      from_id: `${workspaceId}:a`,
      to_id: `${workspaceId}:b`,
      type: 'calls',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance,
    });

    const result = await invokeTool('get_neighbors', {
      nodeId: `${workspaceId}:a`,
      workspaceId,
      operation: 'impact',
      mode: 'authoritative',
      depth: 2,
    });
    assertQueryResultShape(result);
  });

  it('impact propagates denied policy codes', async () => {
    const ws = 'impact-denied-codes-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: 'root',
      workspace: ws,
      project: 'test',
      label: 'Root',
      type: 'method', roles: ['entrypoint', 'http_handler'], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/root.ts',
      symbol: 'Root',
      provenance: parserProv,
    });
    db.upsertNode({
      id: 'next',
      workspace: ws,
      project: 'test',
      label: 'Next',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/next.ts',
      symbol: 'Next',
      provenance: parserProv,
    });
    db.upsertNode({
      id: 'imported',
      workspace: ws,
      project: 'test',
      label: 'Imported',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/imported.ts',
      symbol: 'Imported',
      provenance: parserProv,
    });

    db.upsertEdge({
      id: 'allowed-call',
      workspace: ws,
      from_id: 'root',
      to_id: 'next',
      type: 'calls',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: parserProv,
    });
    db.upsertEdge({
      id: 'blocked-import',
      workspace: ws,
      from_id: 'root',
      to_id: 'imported',
      type: 'imports',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: parserProv,
    });

    const result = await engine.analyzeImpact('root', 'impact', 'authoritative', 2);
    expect(result.codes).toContain('IMPACT_REQUIRES_CONTROL_FLOW');
    expect(result.data.edges.map((edge) => edge.id)).toContain('allowed-call');
    expect(result.data.edges.map((edge) => edge.id)).not.toContain('blocked-import');
  });

  it('authoritative reasoning rejects canonical edges without parser provenance', async () => {
    const ws = 'authoritative-edge-provenance-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;
    const aiProv = { source: 'ai', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: 'a',
      workspace: ws,
      project: 'test',
      label: 'A',
      type: 'function', roles: [], language: 'typescript',
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
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/b.ts',
      symbol: 'B',
      provenance: parserProv,
    });
    db.upsertEdge({
      id: 'ai-canonical-edge',
      workspace: ws,
      from_id: 'a',
      to_id: 'b',
      type: 'calls',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: aiProv,
    });

    const result = await engine.findReasoningPaths('a', 'b', 'ask', 'authoritative');
    expect(result.status).toBe('POLICY_VIOLATION');
    expect(result.codes).toContain('CANONICAL_PROVENANCE_MISSING');
    expect(result.data.edges.map((edge) => edge.id)).not.toContain('ai-canonical-edge');
  });

  it('fails closed before returning invalid canonical nodes in mixed_safe reasoning', async () => {
    const ws = 'invalid-canonical-node-runtime-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const aiProv = { source: 'ai', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: 'bad',
      workspace: ws,
      project: 'test',
      label: 'Bad',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/bad.ts',
      symbol: 'Bad',
      provenance: aiProv,
    });

    const result = await engine.getNode('bad', 'ask', 'mixed_safe');
    expect(result.status).toBe('POLICY_VIOLATION');
    expect(result.codes).toContain('CANONICAL_PROVENANCE_MISSING');
    expect(result.data.nodes).toHaveLength(0);
    expect(result.metadata?.policy).toBeDefined();
  });

  it('semantic search validates graph before returning embedding hits', async () => {
    const workspaceId = 'semantic-validation-gate-ws';
    const db = getDB(resolveDbPath());
    db.clearWorkspaceData(workspaceId, []);
    getTrustedQueryService(db).clearCache(workspaceId);
    const aiProv = { source: 'ai', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: `${workspaceId}:bad`,
      workspace: workspaceId,
      project: 'test',
      label: 'Bad',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/bad.ts',
      symbol: 'Bad',
      provenance: aiProv,
    });
    db.upsertEmbedding(`${workspaceId}:bad`, 'test', new Float32Array([1, 0]));

    await expect(semanticSearch(new Float32Array([1, 0]), workspaceId, 1)).rejects.toThrow(/CANONICAL_PROVENANCE_MISSING|INVALID_GRAPH_STATE/);
    db.clearWorkspaceData(workspaceId, []);
    getTrustedQueryService(db).clearCache(workspaceId);
  });

  it('governance queries fail closed when an authority chain cannot be proven', async () => {
    const ws = 'governance-broken-chain-runtime-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: 'svc',
      workspace: ws,
      project: 'test',
      label: 'Svc',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/svc.ts',
      symbol: 'Svc',
      provenance: parserProv,
    });
    db.upsertNode({
      id: 'policy',
      workspace: ws,
      project: 'test',
      label: 'Policy',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/policy.ts',
      symbol: 'Policy',
      provenance: parserProv,
    });
    db.upsertEdge({
      id: 'semantic-proof',
      workspace: ws,
      from_id: 'svc',
      to_id: 'policy',
      type: 'calls',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: parserProv,
    });

    const result = await engine.findReasoningPaths('svc', 'policy', 'governance', 'authoritative');
    expect(result.status).toBe('POLICY_VIOLATION');
    expect(result.codes).toContain('AUTHORITY_CHAIN_BROKEN');
    expect(result.codes).toContain('POLICY_VIOLATION');
    expect(result.metadata?.policy).toBeDefined();
    expect(result.data.edges).toHaveLength(0);
  });

  it('graph/wiki callers resolve operation=wiki centrally', async () => {
    expect(OperationResolver.resolve({ caller: 'mcp.graph.graph_stats' })).toBe('wiki');
    expect(OperationResolver.resolve({ caller: 'mcp.wiki.generate_wiki' })).toBe('wiki');

    const resultStub = QueryResultFactory.create({
      status: 'OK',
      reasons: ['stub'],
      nodes: [],
      edges: [],
    });

    const graphSpy = vi.spyOn(TrustAwareQueryEngine.prototype, 'getGraphStats').mockResolvedValue(resultStub);
    const visibleSpy = vi.spyOn(TrustAwareQueryEngine.prototype, 'getVisibleGraph').mockResolvedValue({ nodes: [], edges: [] });

    await invokeTool('graph_stats', { workspaceId: 'wiki-op-ws', mode: 'mixed_safe' });
    await invokeTool('generate_wiki', { workspaceId: 'wiki-op-ws', mode: 'mixed_safe' });

    expect(graphSpy).toHaveBeenCalled();
    expect(visibleSpy).toHaveBeenCalled();
    expect(graphSpy.mock.calls.some((call) => call[0] === 'wiki')).toBe(true);
    expect(visibleSpy.mock.calls.some((call) => call[0] === 'wiki')).toBe(true);

    graphSpy.mockRestore();
    visibleSpy.mockRestore();
  });

  it('architecture_overview returns QueryResult validation failure instead of throwing', async () => {
    const workspaceId = 'architecture-invalid-queryresult-ws';
    const db = getDB(resolveDbPath());
    db.clearWorkspaceData(workspaceId, []);
    getTrustedQueryService(db).clearCache(workspaceId);
    const aiProv = { source: 'ai', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: `${workspaceId}:bad`,
      workspace: workspaceId,
      project: 'test',
      label: 'Bad',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/bad.ts',
      symbol: 'Bad',
      provenance: aiProv,
    });

    const result = await invokeTool('architecture_overview', { workspaceId, mode: 'mixed_safe' });
    assertQueryResultShape(result);
    expect(result.status).toBe('POLICY_VIOLATION');
    expect(result.codes).toContain('CANONICAL_PROVENANCE_MISSING');
    expect(result.metadata?.policy).toBeDefined();
    db.clearWorkspaceData(workspaceId, []);
    getTrustedQueryService(db).clearCache(workspaceId);
  });

  it('generate_wiki returns QueryResult validation failure instead of throwing', async () => {
    const workspaceId = 'wiki-invalid-queryresult-ws';
    const db = getDB(resolveDbPath());
    db.clearWorkspaceData(workspaceId, []);
    getTrustedQueryService(db).clearCache(workspaceId);
    const aiProv = { source: 'ai', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: `${workspaceId}:bad`,
      workspace: workspaceId,
      project: 'test',
      label: 'Bad',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/bad.ts',
      symbol: 'Bad',
      provenance: aiProv,
    });

    const result = await invokeTool('generate_wiki', { workspaceId, mode: 'mixed_safe' });
    assertQueryResultShape(result);
    expect(result.status).toBe('POLICY_VIOLATION');
    expect(result.codes).toContain('CANONICAL_PROVENANCE_MISSING');
    expect(result.metadata?.policy).toBeDefined();
    db.clearWorkspaceData(workspaceId, []);
    getTrustedQueryService(db).clearCache(workspaceId);
  });

  it('analyzeImpact and findCallers with undefined operation return POLICY_VIOLATION with OPERATION_REQUIRED in codes', async () => {
    const ws = 'missing-op-guards-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);

    const r1 = await engine.analyzeImpact('x', undefined as any, 'mixed_safe');
    expect(r1.status).toBe('POLICY_VIOLATION');
    expect(r1.codes).toContain('OPERATION_REQUIRED');

    const r2 = await engine.findCallers('X', undefined as any, 'mixed_safe');
    expect(r2.status).toBe('POLICY_VIOLATION');
    expect(r2.codes).toContain('OPERATION_REQUIRED');
  });

  it('findReasoningPaths with undefined operation returns POLICY_VIOLATION + OPERATION_REQUIRED', async () => {
    const ws = 'find-paths-no-op-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);

    const result = await engine.findReasoningPaths('a', 'b', undefined as any, 'mixed_safe');
    expect(result.status).toBe('POLICY_VIOLATION');
    expect(result.codes).toContain('OPERATION_REQUIRED');
    expect(result.metadata?.policy).toBeDefined();
  });

  it('OperationResolver maps mcp.query.get_path to lineage (not ask)', () => {
    const op = OperationResolver.resolve({ caller: 'mcp.query.get_path' });
    expect(op).toBe('lineage');
    // Ensure no silent fallback to ask
    expect(op).not.toBe('ask');
  });

  it('analyzeImpact, getGraphStats, and getNode outputs include metadata.policy with all required fields', async () => {
    const ws = 'policy-envelope-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: `${ws}:n1`,
      workspace: ws,
      project: 'test',
      label: 'N1',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/n1.ts',
      symbol: 'N1',
      provenance: parserProv,
    });

    function assertPolicyEnvelope(result: QueryResult, expectedOp: string, expectedMode: string): void {
      expect(result.metadata).toBeDefined();
      const policy = result.metadata!.policy as Record<string, unknown>;
      expect(policy).toBeDefined();
      expect(policy.operation).toBe(expectedOp);
      expect(policy.mode).toBe(expectedMode);
      expect(typeof policy.traversedEdgeCount).toBe('number');
      expect(typeof policy.blockedEdgeCount).toBe('number');
      expect(Array.isArray(policy.blockedCodes)).toBe(true);
    }

    const impact = await engine.analyzeImpact(`${ws}:n1`, 'impact', 'authoritative', 1);
    assertPolicyEnvelope(impact, 'impact', 'authoritative');

    const stats = await engine.getGraphStats('wiki', 'mixed_safe');
    assertPolicyEnvelope(stats, 'wiki', 'mixed_safe');

    const node = await engine.getNode(`${ws}:n1`, 'ask', 'authoritative');
    assertPolicyEnvelope(node, 'ask', 'authoritative');
  });

  it('findCallers over blocked import edges propagates LINEAGE_REQUIRES_AUTHORITY_CHAIN to top-level codes and metadata.policy', async () => {
    const ws = 'callers-blocked-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: 'target',
      workspace: ws,
      project: 'test',
      label: 'Target',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/target.ts',
      symbol: 'Target',
      provenance: parserProv,
    });
    db.upsertNode({
      id: 'importer',
      workspace: ws,
      project: 'test',
      label: 'Importer',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/importer.ts',
      symbol: 'Importer',
      provenance: parserProv,
    });
    db.upsertEdge({
      id: 'import-edge',
      workspace: ws,
      from_id: 'importer',
      to_id: 'target',
      type: 'imports',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: parserProv,
    });

    const result = await engine.findCallers('Target', 'lineage', 'authoritative');
    expect(result.codes).toContain('LINEAGE_REQUIRES_AUTHORITY_CHAIN');
    const policy = result.metadata?.policy as Record<string, unknown> | undefined;
    expect(policy).toBeDefined();
    expect((policy!.blockedCodes as string[])).toContain('LINEAGE_REQUIRES_AUTHORITY_CHAIN');
  });

  it('returns deterministic QueryResult for same query', async () => {
    const ws = 'deterministic-query-ws';
    const db = new GraphDB(':memory:');
    const loader = new GraphArtifactLoader(db);
    const engine = new TrustAwareQueryEngine(ws, loader);
    const parserProv = { source: 'parser', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;
    const analysisProv = { source: 'analysis', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;

    db.upsertNode({
      id: 's',
      workspace: ws,
      project: 'test',
      label: 'S',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/s.ts',
      symbol: 'S',
      provenance: parserProv,
    });
    db.upsertNode({
      id: 't',
      workspace: ws,
      project: 'test',
      label: 'T',
      type: 'function', roles: [], language: 'typescript',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      source_file: 'src/t.ts',
      symbol: 'T',
      provenance: parserProv,
    });
    db.upsertEdge({
      id: 'exp-edge',
      workspace: ws,
      from_id: 's',
      to_id: 't',
      type: 'calls',
      graph_kind: 'exploratory',
      confidence_band: 'EXTRACTED',
      trust_level: 'EXPLORATORY',
      provenance: analysisProv,
    });

    const first = await engine.findReasoningPaths('s', 't', 'ask', 'mixed_safe');
    const second = await engine.findReasoningPaths('s', 't', 'ask', 'mixed_safe');
    expect(second).toEqual(first);
  });
});

