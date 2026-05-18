/**
 * Task 15.1 — Full Provenance Attachment Tests
 *
 * Validates Requirements 21.1, 21.2, 21.4, 21.5:
 * - Every node and edge carries full provenance fields
 * - Provenance is included in every QueryResult response
 * - WikiBuilder renders provenance and confidence information on generated pages
 */
import { describe, it, expect } from 'vitest';
import { WikiBuilder } from '../08_wiki.js';
import { QueryResultFactory } from '../../../core/graph/query/QueryResultFactory.js';
import type { GraphNode, GraphEdge, Provenance } from '../../../core/types.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeFullProvenance(overrides: Partial<Provenance> = {}): Provenance {
  return {
    source: 'parser',
    artifact_source: 'test-adapter',
    producer_stage: 'buildCanonicalGraph',
    timestamp: '2024-01-01T00:00:00Z',
    file: 'src/test.ts',
    line_start: 1,
    line_end: 10,
    workspaceId: 'test-ws',
    sourceRootId: 'test-project',
    filePath: 'src/test.ts',
    extractionStage: 'buildCanonicalGraph',
    extractionMethod: 'ast',
    adapterId: 'ts_tree_sitter_parser',
    adapterVersion: '1.0.0',
    confidence: 0.95,
    hash: 'abc123def456',
    ...overrides,
  };
}

function makeNode(overrides: Partial<GraphNode> = {}): GraphNode {
  const id = overrides.id ?? `node-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    stableKey: `stable-${id}`,
    workspace: 'test-ws',
    project: 'test-project',
    type: 'function',
    label: `TestFunction_${id}`,
    source_file: 'src/test.ts',
    symbol: 'testFn',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: makeFullProvenance(),
    domain: 'core',
    ...overrides,
  };
}

function makeEdge(overrides: Partial<GraphEdge> = {}): GraphEdge {
  const id = overrides.id ?? `edge-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    stableKey: `stable-${id}`,
    workspace: 'test-ws',
    from_id: 'node-a',
    to_id: 'node-b',
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: makeFullProvenance({ file: 'src/caller.ts', filePath: 'src/caller.ts' }),
    ...overrides,
  };
}

// ─── Requirement 21.1: Full Provenance on Nodes and Edges ────────────────────

describe('Requirement 21.1: Full provenance on every node and edge', () => {
  const REQUIRED_PROVENANCE_FIELDS = [
    'source',
    'artifact_source',
    'producer_stage',
    'timestamp',
    'workspaceId',
    'sourceRootId',
    'filePath',
    'extractionStage',
    'extractionMethod',
    'adapterId',
    'adapterVersion',
    'confidence',
    'hash',
  ] as const;

  it('Provenance interface supports all required fields', () => {
    const prov = makeFullProvenance();

    for (const field of REQUIRED_PROVENANCE_FIELDS) {
      expect(prov[field]).toBeDefined();
    }
  });

  it('node provenance carries workspaceId and sourceRootId', () => {
    const node = makeNode();
    expect(node.provenance.workspaceId).toBe('test-ws');
    expect(node.provenance.sourceRootId).toBe('test-project');
  });

  it('node provenance carries filePath, lineStart, lineEnd', () => {
    const node = makeNode();
    expect(node.provenance.filePath).toBe('src/test.ts');
    expect(node.provenance.line_start).toBe(1);
    expect(node.provenance.line_end).toBe(10);
  });

  it('node provenance carries extractionStage and extractionMethod', () => {
    const node = makeNode();
    expect(node.provenance.extractionStage).toBe('buildCanonicalGraph');
    expect(node.provenance.extractionMethod).toBe('ast');
  });

  it('node provenance carries adapterId and adapterVersion', () => {
    const node = makeNode();
    expect(node.provenance.adapterId).toBe('ts_tree_sitter_parser');
    expect(node.provenance.adapterVersion).toBe('1.0.0');
  });

  it('node provenance carries confidence and hash', () => {
    const node = makeNode();
    expect(node.provenance.confidence).toBe(0.95);
    expect(node.provenance.hash).toBe('abc123def456');
  });

  it('edge provenance carries all required fields', () => {
    const edge = makeEdge();

    for (const field of REQUIRED_PROVENANCE_FIELDS) {
      expect(edge.provenance[field]).toBeDefined();
    }
  });

  it('provenance optionally carries rule field', () => {
    const prov = makeFullProvenance({ rule: 'derived-from-canonical' });
    expect(prov.rule).toBe('derived-from-canonical');
  });
});

// ─── Requirement 21.2: Provenance in Every QueryResult ───────────────────────

describe('Requirement 21.2: Provenance included in every QueryResult response', () => {
  it('QueryResult includes provenance.sources from nodes', () => {
    const nodes = [makeNode({ id: 'n1' }), makeNode({ id: 'n2' })];
    const result = QueryResultFactory.create({
      status: 'OK',
      nodes,
      edges: [],
    });

    expect(result.provenance).toBeDefined();
    expect(result.provenance.sources).toBeDefined();
    expect(result.provenance.sources.length).toBeGreaterThan(0);
  });

  it('QueryResult includes provenance.sources from edges', () => {
    const nodes = [makeNode({ id: 'n1' }), makeNode({ id: 'n2' })];
    const edges = [makeEdge({ from_id: 'n1', to_id: 'n2' })];
    const result = QueryResultFactory.create({
      status: 'OK',
      nodes,
      edges,
    });

    expect(result.provenance.sources.length).toBeGreaterThan(0);
    // Should include edge provenance (different file)
    const hasEdgeProvenance = result.provenance.sources.some(
      (s) => s.file === 'src/caller.ts' || s.filePath === 'src/caller.ts',
    );
    expect(hasEdgeProvenance).toBe(true);
  });

  it('QueryResult deduplicates provenance sources', () => {
    const sharedProv = makeFullProvenance();
    const nodes = [
      makeNode({ id: 'n1', provenance: sharedProv }),
      makeNode({ id: 'n2', provenance: sharedProv }),
    ];
    const result = QueryResultFactory.create({
      status: 'OK',
      nodes,
      edges: [],
    });

    // Should deduplicate identical provenance
    expect(result.provenance.sources.length).toBe(1);
  });

  it('empty QueryResult still has provenance structure', () => {
    const result = QueryResultFactory.create({
      status: 'INSUFFICIENT_EVIDENCE',
      nodes: [],
      edges: [],
    });

    expect(result.provenance).toBeDefined();
    expect(result.provenance.sources).toBeDefined();
    expect(Array.isArray(result.provenance.sources)).toBe(true);
  });
});

// ─── Requirement 21.4: WikiBuilder Renders Provenance ────────────────────────

describe('Requirement 21.4: WikiBuilder renders provenance and confidence on pages', () => {
  const builder = new WikiBuilder();

  it('wiki page content includes Provenance section', async () => {
    const nodes = [
      makeNode({ id: 'n1', graph_kind: 'canonical' }),
      makeNode({ id: 'n2', graph_kind: 'canonical' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const overview = pages.find((p) => p.pageType === 'overview')!;

    expect(overview.content).toContain('## Provenance');
    expect(overview.content).toContain('Overall confidence:');
    expect(overview.content).toContain('Total sources:');
    expect(overview.content).toContain('Parser-backed:');
  });

  it('wiki page content includes Confidence Distribution section', async () => {
    const nodes = [
      makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' }),
      makeNode({ id: 'n2', graph_kind: 'canonical', confidence_band: 'EXTRACTED' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const overview = pages.find((p) => p.pageType === 'overview')!;

    expect(overview.content).toContain('### Confidence Distribution');
    expect(overview.content).toContain('Authoritative:');
    expect(overview.content).toContain('Extracted:');
  });

  it('wiki page content includes Source Files section', async () => {
    const nodes = [
      makeNode({ id: 'n1', provenance: makeFullProvenance({ file: 'src/auth.ts', filePath: 'src/auth.ts' }) }),
      makeNode({ id: 'n2', provenance: makeFullProvenance({ file: 'src/users.ts', filePath: 'src/users.ts' }) }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const overview = pages.find((p) => p.pageType === 'overview')!;

    expect(overview.content).toContain('### Source Files');
    expect(overview.content).toContain('src/auth.ts');
    expect(overview.content).toContain('src/users.ts');
  });

  it('domain pages render provenance section', async () => {
    const nodes = [
      makeNode({ id: 'n1', domain: 'auth', graph_kind: 'canonical' }),
      makeNode({ id: 'n2', domain: 'auth', graph_kind: 'canonical' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const domainPage = pages.find((p) => p.pageType === 'domain')!;

    expect(domainPage.content).toContain('## Provenance');
    expect(domainPage.content).toContain('Overall confidence:');
  });

  it('module pages render provenance section', async () => {
    const nodes = [
      makeNode({ id: 'n1', project: 'backend', graph_kind: 'canonical' }),
      makeNode({ id: 'n2', project: 'backend', graph_kind: 'canonical' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const modulePage = pages.find((p) => p.pageType === 'module')!;

    expect(modulePage.content).toContain('## Provenance');
  });

  it('entrypoint pages render provenance section', async () => {
    const nodes = [
      makeNode({ id: 'n1', type: 'api_endpoint', graph_kind: 'canonical' }),
      makeNode({ id: 'n2', type: 'controller_action', graph_kind: 'canonical' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const entrypointPage = pages.find((p) => p.pageType === 'entrypoints')!;

    expect(entrypointPage.content).toContain('## Provenance');
  });

  it('insufficient_context pages still render provenance section', async () => {
    const nodes = [
      makeNode({ id: 'n1', graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const overview = pages.find((p) => p.pageType === 'overview')!;

    expect(overview.status).toBe('insufficient_context');
    expect(overview.content).toContain('## Provenance');
  });
});

// ─── Requirement 21.5: Distinguish Authoritative from Exploratory ────────────

describe('Requirement 21.5: Distinguish authoritative from exploratory in output', () => {
  const builder = new WikiBuilder();

  it('provenance summary distinguishes parser-backed from exploratory', async () => {
    const nodes = [
      makeNode({ id: 'n1', graph_kind: 'canonical' }),
      makeNode({ id: 'n2', graph_kind: 'canonical' }),
      makeNode({ id: 'n3', graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await builder.generate('test-ws', nodes, edges);
    const overview = pages.find((p) => p.pageType === 'overview')!;

    expect(overview.provenance_summary.parser_backed).toBe(2);
    expect(overview.provenance_summary.exploratory).toBe(1);
  });

  it('QueryResult confidence distinguishes authoritative from non-authoritative', () => {
    const authNodes = [makeNode({ trust_level: 'AUTHORITATIVE', confidence_band: 'AUTHORITATIVE' })];
    const authResult = QueryResultFactory.create({ status: 'OK', nodes: authNodes, edges: [] });
    expect(authResult.confidence.level).toBe('HIGH');

    const mixedNodes = [makeNode({ trust_level: 'EXPLORATORY', confidence_band: 'INFERRED', graph_kind: 'exploratory' })];
    const mixedResult = QueryResultFactory.create({ status: 'OK', nodes: mixedNodes, edges: [] });
    expect(mixedResult.confidence.level).toBe('MEDIUM');
  });
});
