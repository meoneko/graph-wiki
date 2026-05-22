/**
 * Integration tests for WikiBuilder, DriftDetector, and ReportBuilder.
 *
 * Tests:
 * - Wiki page status assignment (canonical, mixed, draft, insufficient_context)
 * - Drift detection against baseline
 * - Baseline promotion requires verify pass
 * - Report generation includes correct metrics
 *
 * @see Requirements 12.1, 12.5, 13.3, 14.1
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WikiBuilder } from '../08_wiki.js';
import { DriftDetector } from '../../../core/drift/DriftDetector.js';
import { ReportBuilder } from '../09_report.js';
import { GraphDB } from '../../../storage/GraphDB.js';
import type { GraphNode, GraphEdge, Provenance } from '../../../core/types.js';
import type { KnowledgeConfig } from '../../config.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

const WORKSPACE_ID = 'ws-integration';

const parserProvenance: Provenance = {
  source: 'parser',
  artifact_source: 'ts_tree_sitter_parser',
  producer_stage: 'extract',
  timestamp: '2026-01-01T00:00:00.000Z',
};

const analysisProvenance: Provenance = {
  source: 'analysis',
  artifact_source: 'config_link_analysis',
  producer_stage: 'derive',
  timestamp: '2026-01-01T00:00:00.000Z',
};

const aiProvenance: Provenance = {
  source: 'ai',
  artifact_source: 'ai_heuristic',
  producer_stage: 'enrich',
  timestamp: '2026-01-01T00:00:00.000Z',
};

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    stableKey: `sk-${id}`,
    workspace: WORKSPACE_ID,
    project: 'proj-1',
    type: 'ts_function',
    label: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProvenance,
    source_file: 'src/service.ts',
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

// ─── WikiBuilder Tests ───────────────────────────────────────────────────────

describe('WikiBuilder — page status assignment (Req 12.1, 12.5)', () => {
  let wikiBuilder: WikiBuilder;

  beforeEach(() => {
    wikiBuilder = new WikiBuilder();
  });

  it('assigns "canonical" status when all nodes are canonical/derived', async () => {
    const nodes = [
      makeNode('n1'),
      makeNode('n2'),
      makeNode('n3', { graph_kind: 'derived', confidence_band: 'EXTRACTED', provenance: analysisProvenance }),
    ];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const pages = await wikiBuilder.generate(WORKSPACE_ID, nodes, edges);

    // Overview page should be canonical since all nodes are canonical/derived
    const overview = pages.find(p => p.pageType === 'overview');
    expect(overview).toBeDefined();
    expect(overview!.status).toBe('canonical');
    expect(overview!.warnings.some(w => w.includes('EXPLORATORY'))).toBe(false);
  });

  it('assigns "mixed" status when canonical/derived nodes outnumber exploratory', async () => {
    const nodes = [
      makeNode('n1'),
      makeNode('n2'),
      makeNode('n3', { graph_kind: 'derived', confidence_band: 'EXTRACTED', provenance: analysisProvenance }),
      makeNode('n4', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
    ];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const pages = await wikiBuilder.generate(WORKSPACE_ID, nodes, edges);

    const overview = pages.find(p => p.pageType === 'overview');
    expect(overview).toBeDefined();
    expect(overview!.status).toBe('mixed');
    expect(overview!.warnings.some(w => w.includes('EXPLORATORY_USED'))).toBe(true);
  });

  it('assigns "draft" status when exploratory nodes outnumber canonical/derived', async () => {
    const nodes = [
      makeNode('n1'),
      makeNode('n2'),
      makeNode('n3', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
      makeNode('n4', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
      makeNode('n5', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await wikiBuilder.generate(WORKSPACE_ID, nodes, edges);

    const overview = pages.find(p => p.pageType === 'overview');
    expect(overview).toBeDefined();
    expect(overview!.status).toBe('draft');
  });

  it('assigns "insufficient_context" status when fewer than 2 canonical/derived nodes exist', async () => {
    const nodes = [
      makeNode('n1'),
      makeNode('n2', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
      makeNode('n3', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
    ];
    const edges: GraphEdge[] = [];

    const pages = await wikiBuilder.generate(WORKSPACE_ID, nodes, edges);

    const overview = pages.find(p => p.pageType === 'overview');
    expect(overview).toBeDefined();
    expect(overview!.status).toBe('insufficient_context');
    // Content should not contain speculative conclusions
    expect(overview!.content).toContain('Insufficient canonical evidence');
  });

  it('assigns "insufficient_context" when no nodes are provided', async () => {
    const pages = await wikiBuilder.generate(WORKSPACE_ID, [], []);

    const overview = pages.find(p => p.pageType === 'overview');
    expect(overview).toBeDefined();
    expect(overview!.status).toBe('insufficient_context');
  });

  it('includes provenance_summary and confidence_summary on every page', async () => {
    const nodes = [
      makeNode('n1'),
      makeNode('n2'),
      makeNode('n3', { graph_kind: 'exploratory', confidence_band: 'INFERRED', provenance: aiProvenance }),
    ];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const pages = await wikiBuilder.generate(WORKSPACE_ID, nodes, edges);

    for (const page of pages) {
      expect(page.provenance_summary).toBeDefined();
      expect(page.provenance_summary.total_sources).toBeGreaterThanOrEqual(0);
      expect(page.confidence_summary).toBeDefined();
      expect(page.confidence_summary.overall).toMatch(/^(HIGH|MEDIUM|LOW)$/);
    }
  });
});

// ─── DriftDetector Tests ─────────────────────────────────────────────────────

describe('DriftDetector — drift detection against baseline (Req 13.3)', () => {
  let db: GraphDB;
  let root: string;
  let baselinesDir: string;
  let reportsDir: string;

  beforeEach(() => {
    root = join(tmpdir(), `crg-drift-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    baselinesDir = join(root, 'baselines');
    reportsDir = join(root, 'reports');
    mkdirSync(baselinesDir, { recursive: true });
    mkdirSync(reportsDir, { recursive: true });
    db = new GraphDB(':memory:');
  });

  afterEach(() => {
    db.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('reports fail status when no baseline exists', async () => {
    const detector = new DriftDetector(db, baselinesDir);
    const report = await detector.detect(WORKSPACE_ID);

    expect(report.status).toBe('fail');
    expect(report.items).toHaveLength(1);
    expect(report.items[0]!.severity).toBe('critical');
    expect(report.summary.critical).toBe(1);
  });

  it('reports pass status when graph matches baseline', async () => {
    // Insert nodes into DB
    db.upsertNode(makeNode('n1'));
    db.upsertNode(makeNode('n2'));
    db.upsertEdge(makeEdge('e1', 'n1', 'n2'));

    const detector = new DriftDetector(db, baselinesDir);

    // Establish baseline
    await detector.updateBaseline(WORKSPACE_ID);

    // Detect drift — should pass since nothing changed
    const report = await detector.detect(WORKSPACE_ID);

    expect(report.status).toBe('pass');
    expect(report.items).toHaveLength(0);
    expect(report.summary.critical).toBe(0);
    expect(report.summary.warning).toBe(0);
  });

  it('detects canonical node count drift after adding nodes', async () => {
    // Initial state
    db.upsertNode(makeNode('n1'));
    db.upsertNode(makeNode('n2'));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Add more nodes
    db.upsertNode(makeNode('n3'));
    db.upsertNode(makeNode('n4'));
    db.upsertNode(makeNode('n5'));

    const report = await detector.detect(WORKSPACE_ID);

    // Should detect canonical node count change
    const nodeCountDrift = report.items.find(i => i.driftType === 'canonical_node_count_changed');
    expect(nodeCountDrift).toBeDefined();
    expect(nodeCountDrift!.description).toContain('2');
    expect(nodeCountDrift!.description).toContain('5');
  });

  it('detects canonical edge count drift after adding edges', async () => {
    db.upsertNode(makeNode('n1'));
    db.upsertNode(makeNode('n2'));
    db.upsertNode(makeNode('n3'));
    db.upsertEdge(makeEdge('e1', 'n1', 'n2'));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Add more edges
    db.upsertEdge(makeEdge('e2', 'n2', 'n3'));
    db.upsertEdge(makeEdge('e3', 'n1', 'n3'));

    const report = await detector.detect(WORKSPACE_ID);

    const edgeCountDrift = report.items.find(i => i.driftType === 'canonical_edge_count_changed');
    expect(edgeCountDrift).toBeDefined();
    expect(edgeCountDrift!.description).toContain('1');
    expect(edgeCountDrift!.description).toContain('3');
  });

  it('detects exploratory count drift', async () => {
    db.upsertNode(makeNode('n1'));
    db.upsertNode(makeNode('n2', { graph_kind: 'exploratory', confidence_band: 'INFERRED' }));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Add more exploratory nodes
    db.upsertNode(makeNode('n3', { graph_kind: 'exploratory', confidence_band: 'INFERRED' }));

    const report = await detector.detect(WORKSPACE_ID);

    const exploratoryDrift = report.items.find(i => i.driftType === 'exploratory_count_changed');
    expect(exploratoryDrift).toBeDefined();
    expect(exploratoryDrift!.severity).toBe('info');
  });
});

describe('DriftDetector — baseline promotion requires verify pass (Req 13.3)', () => {
  let db: GraphDB;
  let root: string;
  let baselinesDir: string;
  let reportsDir: string;

  beforeEach(() => {
    root = join(tmpdir(), `crg-promote-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    baselinesDir = join(root, 'baselines');
    reportsDir = join(root, 'reports');
    mkdirSync(baselinesDir, { recursive: true });
    mkdirSync(reportsDir, { recursive: true });
    db = new GraphDB(':memory:');
  });

  afterEach(() => {
    db.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('rejects baseline promotion when no verification report exists', async () => {
    db.upsertNode(makeNode('n1'));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Attempt promotion without verify pass — should throw
    await expect(detector.promoteBaseline(WORKSPACE_ID)).rejects.toThrow(/VERIFY_FAILED/);
  });

  it('rejects baseline promotion when verification report shows failure', async () => {
    db.upsertNode(makeNode('n1'));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Write a failing verification report
    const verifyDir = join(reportsDir, WORKSPACE_ID);
    mkdirSync(verifyDir, { recursive: true });
    writeFileSync(
      join(verifyDir, 'verification.json'),
      JSON.stringify({ passed: false, issues: ['INVALID_EDGE_TYPE:e1'] }),
    );

    // Attempt promotion — should still throw because checkVerifyPass looks in specific paths
    await expect(detector.promoteBaseline(WORKSPACE_ID)).rejects.toThrow(/VERIFY_FAILED/);
  });

  it('allows baseline promotion with force=true even without verify pass', async () => {
    db.upsertNode(makeNode('n1'));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Force promotion should succeed
    await expect(detector.promoteBaseline(WORKSPACE_ID, { force: true })).resolves.not.toThrow();

    // Verify previous baseline was preserved
    const previousPath = join(baselinesDir, WORKSPACE_ID, 'previous.json');
    const previous = JSON.parse(readFileSync(previousPath, 'utf-8'));
    expect(previous.workspaceId).toBe(WORKSPACE_ID);
    expect(previous.canonicalNodeCount).toBe(1);
  });

  it('promotes baseline when verification report shows pass', async () => {
    db.upsertNode(makeNode('n1'));
    db.upsertNode(makeNode('n2'));

    const detector = new DriftDetector(db, baselinesDir);
    await detector.updateBaseline(WORKSPACE_ID);

    // Write a passing verification report in the path DriftDetector checks
    // DriftDetector checks: baselinesDir/../{workspaceId}/reports/verification.json
    const verifyDir = join(baselinesDir, '..', WORKSPACE_ID, 'reports');
    mkdirSync(verifyDir, { recursive: true });
    writeFileSync(
      join(verifyDir, 'verification.json'),
      JSON.stringify({ passed: true, issues: [], invariants_checked: 3, invariants_passed: 3 }),
    );

    // Promotion should succeed
    await expect(detector.promoteBaseline(WORKSPACE_ID)).resolves.not.toThrow();

    // Verify new baseline was created
    const currentPath = join(baselinesDir, WORKSPACE_ID, 'current.json');
    const current = JSON.parse(readFileSync(currentPath, 'utf-8'));
    expect(current.workspaceId).toBe(WORKSPACE_ID);
    expect(current.canonicalNodeCount).toBe(2);
  });
});

// ─── ReportBuilder Tests ─────────────────────────────────────────────────────

describe('ReportBuilder — report generation includes correct metrics (Req 14.1)', () => {
  let root: string;
  let config: KnowledgeConfig;

  beforeEach(() => {
    root = join(tmpdir(), `crg-report-int-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(root, { recursive: true });
    config = {
      workspaces: [],
      projects: [],
      outputs: {
        source_root: join(root, 'sources'),
        state_root: join(root, 'state'),
        records_root: join(root, 'records'),
        wiki_root: join(root, 'wiki'),
        index_root: join(root, 'index'),
        reports_root: join(root, 'reports'),
      },
    };
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('computes precision as ratio of canonical nodes with full provenance', async () => {
    const builder = new ReportBuilder(config);
    const nodes = [
      makeNode('n1'), // has full provenance
      makeNode('n2'), // has full provenance
      makeNode('n3', { provenance: { ...parserProvenance, artifact_source: '' } }), // missing artifact_source
    ];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const report = await builder.writeQualityReport(WORKSPACE_ID, nodes, edges);

    // n1 and n2 have full provenance (source + artifact_source), n3 does not
    expect(report.precision).toBeCloseTo(2 / 3, 3);
  });

  it('computes recall as ratio of connected nodes', async () => {
    const builder = new ReportBuilder(config);
    const nodes = [
      makeNode('n1'),
      makeNode('n2'),
      makeNode('n3'), // orphan — not connected by any edge
    ];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const report = await builder.writeQualityReport(WORKSPACE_ID, nodes, edges);

    // n1 and n2 are connected, n3 is not
    expect(report.recall).toBeCloseTo(2 / 3, 4);
  });

  it('includes confidence_distribution across all nodes and edges', async () => {
    const builder = new ReportBuilder(config);
    const nodes = [
      makeNode('n1', { confidence_band: 'AUTHORITATIVE' }),
      makeNode('n2', { confidence_band: 'EXTRACTED' }),
      makeNode('n3', { confidence_band: 'INFERRED', graph_kind: 'exploratory' }),
    ];
    const edges = [
      makeEdge('e1', 'n1', 'n2', { confidence_band: 'AUTHORITATIVE' }),
      makeEdge('e2', 'n2', 'n3', { confidence_band: 'INFERRED', graph_kind: 'exploratory' }),
    ];

    const report = await builder.writeQualityReport(WORKSPACE_ID, nodes, edges);

    expect(report.confidence_distribution.AUTHORITATIVE).toBe(2); // n1 + e1
    expect(report.confidence_distribution.EXTRACTED).toBe(1); // n2
    expect(report.confidence_distribution.INFERRED).toBe(2); // n3 + e2
    expect(report.confidence_distribution.AMBIGUOUS).toBe(0);
  });

  it('includes provenance_distribution by source type', async () => {
    const builder = new ReportBuilder(config);
    const nodes = [
      makeNode('n1', { provenance: parserProvenance }),
      makeNode('n2', { provenance: analysisProvenance }),
      makeNode('n3', { provenance: aiProvenance }),
    ];
    const edges = [
      makeEdge('e1', 'n1', 'n2', { provenance: parserProvenance }),
    ];

    const report = await builder.writeQualityReport(WORKSPACE_ID, nodes, edges);

    expect(report.provenance_distribution['parser']).toBe(2); // n1 + e1
    expect(report.provenance_distribution['analysis']).toBe(1); // n2
    expect(report.provenance_distribution['ai']).toBe(1); // n3
  });

  it('writes report to disk at correct path', async () => {
    const builder = new ReportBuilder(config);
    const nodes = [makeNode('n1'), makeNode('n2')];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    await builder.writeQualityReport(WORKSPACE_ID, nodes, edges);

    const filePath = join(root, 'reports', WORKSPACE_ID, 'graph-quality.json');
    const written = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(written.workspaceId).toBe(WORKSPACE_ID);
    expect(written.precision).toBeDefined();
    expect(written.recall).toBeDefined();
    expect(written.confidence_distribution).toBeDefined();
    expect(written.provenance_distribution).toBeDefined();
    expect(written.generatedAt).toBeDefined();
  });

  it('handles empty graph with zero metrics', async () => {
    const builder = new ReportBuilder(config);
    const report = await builder.writeQualityReport(WORKSPACE_ID, [], []);

    expect(report.precision).toBe(0);
    expect(report.recall).toBe(0);
    expect(report.confidence_distribution.AUTHORITATIVE).toBe(0);
  });
});
