import { describe, it, expect } from 'vitest';
import { WikiBuilder } from '../08_wiki.js';
import type { GraphNode, GraphEdge, Provenance, GraphKind, ConfidenceBand } from '../../../core/types.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeProvenance(overrides: Partial<Provenance> = {}): Provenance {
  return {
    source: 'parser',
    artifact_source: 'test-adapter',
    producer_stage: 'extract',
    timestamp: '2024-01-01T00:00:00Z',
    file: 'src/test.ts',
    line_start: 1,
    line_end: 10,
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
    provenance: makeProvenance(),
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
    provenance: makeProvenance(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('WikiBuilder', () => {
  const builder = new WikiBuilder();

  describe('generate', () => {
    it('returns an array of WikiPage objects', async () => {
      const nodes = [
        makeNode({ id: 'n1' }),
        makeNode({ id: 'n2' }),
        makeNode({ id: 'n3' }),
      ];
      const edges = [makeEdge({ from_id: 'n1', to_id: 'n2' })];

      const pages = await builder.generate('test-ws', nodes, edges);

      expect(pages.length).toBeGreaterThan(0);
      for (const page of pages) {
        expect(page.workspaceId).toBe('test-ws');
        expect(page.id).toBeTruthy();
        expect(page.title).toBeTruthy();
        expect(page.pageType).toBeTruthy();
        expect(page.generatedAt).toBeTruthy();
        expect(page.provenance_summary).toBeDefined();
        expect(page.confidence_summary).toBeDefined();
        expect(Array.isArray(page.annotations)).toBe(true);
        expect(Array.isArray(page.warnings)).toBe(true);
        expect(Array.isArray(page.sources)).toBe(true);
      }
    });

    it('generates an overview page', async () => {
      const nodes = [makeNode({ id: 'n1' }), makeNode({ id: 'n2' })];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const overview = pages.find((p) => p.pageType === 'overview');

      expect(overview).toBeDefined();
      expect(overview!.title).toContain('test-ws');
      expect(overview!.id).toContain('overview');
    });

    it('generates domain pages grouped by node domain', async () => {
      const nodes = [
        makeNode({ id: 'n1', domain: 'auth' }),
        makeNode({ id: 'n2', domain: 'auth' }),
        makeNode({ id: 'n3', domain: 'payments' }),
        makeNode({ id: 'n4', domain: 'payments' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const domainPages = pages.filter((p) => p.pageType === 'domain');

      expect(domainPages.length).toBe(2);
      const titles = domainPages.map((p) => p.title);
      expect(titles).toContain('Domain: auth');
      expect(titles).toContain('Domain: payments');
    });

    it('generates module pages grouped by project', async () => {
      const nodes = [
        makeNode({ id: 'n1', project: 'backend' }),
        makeNode({ id: 'n2', project: 'backend' }),
        makeNode({ id: 'n3', project: 'frontend' }),
        makeNode({ id: 'n4', project: 'frontend' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const modulePages = pages.filter((p) => p.pageType === 'module');

      expect(modulePages.length).toBe(2);
      const titles = modulePages.map((p) => p.title);
      expect(titles).toContain('Module: backend');
      expect(titles).toContain('Module: frontend');
    });

    it('generates entrypoint page when API/controller nodes exist', async () => {
      const nodes = [
        makeNode({ id: 'n1', type: 'api_endpoint' }),
        makeNode({ id: 'n2', type: 'controller_action' }),
        makeNode({ id: 'n3', type: 'function' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const entrypointPage = pages.find((p) => p.pageType === 'entrypoints');

      expect(entrypointPage).toBeDefined();
      expect(entrypointPage!.title).toBe('API Entrypoints');
    });

    it('does not generate entrypoint page when no API/controller nodes exist', async () => {
      const nodes = [
        makeNode({ id: 'n1', type: 'function' }),
        makeNode({ id: 'n2', type: 'class' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const entrypointPage = pages.find((p) => p.pageType === 'entrypoints');

      expect(entrypointPage).toBeUndefined();
    });
  });

  describe('determinePageStatus', () => {
    it('returns insufficient_context when no nodes provided', () => {
      expect(builder.determinePageStatus([])).toBe('insufficient_context');
    });

    it('returns insufficient_context when fewer than 2 canonical/derived nodes', () => {
      const nodes = [makeNode({ graph_kind: 'canonical' })];
      expect(builder.determinePageStatus(nodes)).toBe('insufficient_context');
    });

    it('returns insufficient_context when only exploratory nodes exist', () => {
      const nodes = [
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      expect(builder.determinePageStatus(nodes)).toBe('insufficient_context');
    });

    it('returns canonical when all nodes are canonical/derived', () => {
      const nodes = [
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'derived' }),
      ];
      expect(builder.determinePageStatus(nodes)).toBe('canonical');
    });

    it('returns mixed when canonical/derived nodes outnumber exploratory', () => {
      const nodes = [
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'derived' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      expect(builder.determinePageStatus(nodes)).toBe('mixed');
    });

    it('returns draft when exploratory nodes outnumber canonical/derived', () => {
      const nodes = [
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      expect(builder.determinePageStatus(nodes)).toBe('draft');
    });
  });

  describe('trust rules', () => {
    it('canonical-status pages use only canonical/derived facts for conclusions', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical', label: 'CanonicalFn' }),
        makeNode({ id: 'n2', graph_kind: 'canonical', label: 'AnotherCanonical' }),
        makeNode({ id: 'n3', graph_kind: 'derived', label: 'DerivedFn' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const overview = pages.find((p) => p.pageType === 'overview')!;

      expect(overview.status).toBe('canonical');
      // Content should mention canonical/derived nodes
      expect(overview.content).toContain('canonical nodes');
      // No exploratory annotations on canonical pages
      expect(overview.annotations).toHaveLength(0);
    });

    it('exploratory facts appear only as clearly marked annotations', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical', label: 'CanonicalFn' }),
        makeNode({ id: 'n2', graph_kind: 'canonical', label: 'AnotherCanonical' }),
        makeNode({ id: 'n3', graph_kind: 'exploratory', confidence_band: 'INFERRED', label: 'ExploratoryFn' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const overview = pages.find((p) => p.pageType === 'overview')!;

      expect(overview.status).toBe('mixed');
      // Exploratory nodes should appear as annotations
      expect(overview.annotations.length).toBeGreaterThan(0);
      expect(overview.annotations[0]!.type).toBe('exploratory');
      expect(overview.annotations[0]!.content).toContain('[Exploratory]');
      expect(overview.annotations[0]!.trust_level).toBe('EXPLORATORY');
    });

    it('insufficient_context pages do not contain speculative content', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const overview = pages.find((p) => p.pageType === 'overview')!;

      expect(overview.status).toBe('insufficient_context');
      expect(overview.content).toContain('Insufficient canonical evidence');
      // Should not contain any speculative conclusions
      expect(overview.content).not.toContain('## System Overview');
    });

    it('mixed pages include EXPLORATORY_USED warning', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical' }),
        makeNode({ id: 'n2', graph_kind: 'canonical' }),
        makeNode({ id: 'n3', graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const overview = pages.find((p) => p.pageType === 'overview')!;

      expect(overview.status).toBe('mixed');
      expect(overview.warnings.some((w) => w.includes('EXPLORATORY_USED'))).toBe(true);
    });
  });

  describe('provenance and confidence summaries', () => {
    it('includes provenance_summary on every page', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical' }),
        makeNode({ id: 'n2', graph_kind: 'canonical' }),
        makeNode({ id: 'n3', graph_kind: 'derived' }),
        makeNode({ id: 'n4', graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);

      for (const page of pages) {
        expect(page.provenance_summary).toBeDefined();
        expect(typeof page.provenance_summary.total_sources).toBe('number');
        expect(typeof page.provenance_summary.parser_backed).toBe('number');
        expect(typeof page.provenance_summary.derived).toBe('number');
        expect(typeof page.provenance_summary.exploratory).toBe('number');
        expect(typeof page.provenance_summary.external).toBe('number');
      }
    });

    it('includes confidence_summary on every page', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' }),
        makeNode({ id: 'n2', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' }),
        makeNode({ id: 'n3', graph_kind: 'derived', confidence_band: 'EXTRACTED' }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);

      for (const page of pages) {
        expect(page.confidence_summary).toBeDefined();
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(page.confidence_summary.overall);
        expect(typeof page.confidence_summary.authoritative_count).toBe('number');
        expect(typeof page.confidence_summary.extracted_count).toBe('number');
        expect(typeof page.confidence_summary.inferred_count).toBe('number');
        expect(typeof page.confidence_summary.ambiguous_count).toBe('number');
      }
    });

    it('buildProvenanceSummary correctly counts by graph_kind', () => {
      const nodes = [
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'canonical' }),
        makeNode({ graph_kind: 'derived' }),
        makeNode({ graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode({ graph_kind: 'external', confidence_band: 'AMBIGUOUS' }),
      ];

      const summary = builder.buildProvenanceSummary(nodes);

      expect(summary.total_sources).toBe(5);
      expect(summary.parser_backed).toBe(2);
      expect(summary.derived).toBe(1);
      expect(summary.exploratory).toBe(1);
      expect(summary.external).toBe(1);
    });

    it('buildConfidenceSummary correctly counts by confidence_band', () => {
      const nodes = [
        makeNode({ confidence_band: 'AUTHORITATIVE' }),
        makeNode({ confidence_band: 'AUTHORITATIVE' }),
        makeNode({ confidence_band: 'EXTRACTED' }),
        makeNode({ confidence_band: 'INFERRED', graph_kind: 'exploratory' }),
        makeNode({ confidence_band: 'AMBIGUOUS', graph_kind: 'exploratory' }),
      ];

      const summary = builder.buildConfidenceSummary(nodes);

      expect(summary.authoritative_count).toBe(2);
      expect(summary.extracted_count).toBe(1);
      expect(summary.inferred_count).toBe(1);
      expect(summary.ambiguous_count).toBe(1);
      expect(summary.overall).toBe('HIGH'); // 3 authoritative+extracted > 2 inferred+ambiguous
    });

    it('buildConfidenceSummary returns LOW when ambiguous dominates', () => {
      const nodes = [
        makeNode({ confidence_band: 'AMBIGUOUS', graph_kind: 'exploratory' }),
        makeNode({ confidence_band: 'AMBIGUOUS', graph_kind: 'exploratory' }),
        makeNode({ confidence_band: 'AMBIGUOUS', graph_kind: 'exploratory' }),
        makeNode({ confidence_band: 'AUTHORITATIVE' }),
      ];

      const summary = builder.buildConfidenceSummary(nodes);

      expect(summary.overall).toBe('LOW');
    });
  });

  describe('WikiPage interface completeness', () => {
    it('every generated page has all required fields', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical' }),
        makeNode({ id: 'n2', graph_kind: 'canonical' }),
      ];
      const edges = [makeEdge({ from_id: 'n1', to_id: 'n2' })];

      const pages = await builder.generate('test-ws', nodes, edges);

      for (const page of pages) {
        // All required WikiPage fields
        expect(typeof page.id).toBe('string');
        expect(typeof page.workspaceId).toBe('string');
        expect(typeof page.title).toBe('string');
        expect(typeof page.pageType).toBe('string');
        expect(['canonical', 'mixed', 'draft', 'insufficient_context']).toContain(page.status);
        expect(typeof page.content).toBe('string');
        expect(Array.isArray(page.sources)).toBe(true);
        expect(page.provenance_summary).toBeDefined();
        expect(page.confidence_summary).toBeDefined();
        expect(Array.isArray(page.annotations)).toBe(true);
        expect(Array.isArray(page.warnings)).toBe(true);
        expect(typeof page.generatedAt).toBe('string');
      }
    });
  });

  describe('sources collection', () => {
    it('collects unique provenance sources from nodes', async () => {
      const prov1 = makeProvenance({ file: 'src/a.ts', artifact_source: 'adapter-a' });
      const prov2 = makeProvenance({ file: 'src/b.ts', artifact_source: 'adapter-b' });
      const nodes = [
        makeNode({ id: 'n1', provenance: prov1 }),
        makeNode({ id: 'n2', provenance: prov1 }), // duplicate
        makeNode({ id: 'n3', provenance: prov2 }),
      ];
      const edges: GraphEdge[] = [];

      const pages = await builder.generate('test-ws', nodes, edges);
      const overview = pages.find((p) => p.pageType === 'overview')!;

      // Should deduplicate sources
      expect(overview.sources.length).toBe(2);
    });
  });
});
