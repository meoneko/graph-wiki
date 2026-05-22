import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ReportBuilder, writeReport } from '../09_report.js';
import type { KnowledgeConfig } from '../../config.js';
import type { GraphEdge, GraphNode, Provenance } from '../../../core/types.js';

const provenance: Provenance = {
  source: 'parser',
  artifact_source: 'test',
  producer_stage: 'test',
  timestamp: '2026-05-12T00:00:00.000Z',
};

function node(id: string, domain?: string, overrides?: Partial<GraphNode>): GraphNode {
  return {
    id,
    stableKey: id,
    workspace: 'ws',
    project: 'p',
    type: 'ts_function',
    label: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
    metadata: domain ? { derived_domain: domain } : {},
    ...overrides,
  };
}

function edge(id: string, fromId: string, toId: string, overrides?: Partial<GraphEdge>): GraphEdge {
  return {
    id,
    stableKey: id,
    workspace: 'ws',
    from_id: fromId,
    to_id: toId,
    type: 'canonical_dependency',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
    ...overrides,
  };
}

describe('ReportBuilder', () => {
  let root: string;
  let config: KnowledgeConfig;

  beforeEach(() => {
    root = join(tmpdir(), `crg-report-${Date.now()}-${Math.random().toString(16).slice(2)}`);
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

  describe('writeQualityReport', () => {
    it('computes precision, recall, confidence and provenance distributions', async () => {
      const builder = new ReportBuilder(config);
      const nodes = [
        node('n1', 'auth'),
        node('n2', 'billing'),
        node('n3', 'auth'),
      ];
      const edges = [edge('e1', 'n1', 'n2')];

      const report = await builder.writeQualityReport('ws', nodes, edges);

      expect(report.precision).toBe(1); // all canonical nodes have provenance
      expect(report.recall).toBeCloseTo(2 / 3, 4); // n1, n2 connected; n3 not
      expect(report.confidence_distribution.AUTHORITATIVE).toBe(4); // 3 nodes + 1 edge
      expect(report.provenance_distribution['parser']).toBe(4);

      // Verify file was written
      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'graph-quality.json'), 'utf-8'));
      expect(written.workspaceId).toBe('ws');
      expect(written.precision).toBe(1);
    });

    it('handles empty graph gracefully', async () => {
      const builder = new ReportBuilder(config);
      const report = await builder.writeQualityReport('ws', [], []);

      expect(report.precision).toBe(0);
      expect(report.recall).toBe(0);
    });
  });

  describe('writeVerificationReport', () => {
    it('writes verification report with pass/fail and invariants', async () => {
      const builder = new ReportBuilder(config);
      await builder.writeVerificationReport('ws', {
        passed: true,
        issues: [],
        invariants_checked: 5,
        invariants_passed: 5,
      });

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'verification.json'), 'utf-8'));
      expect(written.passed).toBe(true);
      expect(written.invariants_checked).toBe(5);
      expect(written.invariants_passed).toBe(5);
      expect(written.issues).toEqual([]);
    });

    it('writes failing verification report with issues', async () => {
      const builder = new ReportBuilder(config);
      await builder.writeVerificationReport('ws', {
        passed: false,
        issues: ['CANONICAL_PROVENANCE_MISSING:n1', 'INVALID_EDGE_TYPE:e2'],
        invariants_checked: 5,
        invariants_passed: 3,
      });

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'verification.json'), 'utf-8'));
      expect(written.passed).toBe(false);
      expect(written.issues).toHaveLength(2);
      expect(written.invariants_passed).toBe(3);
    });
  });

  describe('writeLintReport', () => {
    it('writes lint report with severity counts', async () => {
      const builder = new ReportBuilder(config);
      await builder.writeLintReport('ws', [
        { id: 'lint-1', severity: 'error', message: 'Missing provenance', nodeId: 'n1' },
        { id: 'lint-2', severity: 'warning', message: 'Low confidence edge', edgeId: 'e1' },
        { id: 'lint-3', severity: 'info', message: 'Orphan node detected', nodeId: 'n3' },
      ]);

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'lint.json'), 'utf-8'));
      expect(written.counts.error).toBe(1);
      expect(written.counts.warning).toBe(1);
      expect(written.counts.info).toBe(1);
      expect(written.issues).toHaveLength(3);
    });
  });

  describe('writeDigest', () => {
    it('writes digest with node/edge counts by graph_kind', async () => {
      const builder = new ReportBuilder(config);
      const nodes = [
        node('n1', 'auth'),
        node('n2', 'billing', { graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      const edges = [edge('e1', 'n1', 'n2')];

      await builder.writeDigest('ws', nodes, edges, true);

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'digest.json'), 'utf-8'));
      expect(written.summary).toBe('PASS');
      expect(written.nodeCount).toBe(2);
      expect(written.edgeCount).toBe(1);
      expect(written.canonicalNodeCount).toBe(1);
      expect(written.exploratoryNodeCount).toBe(1);
      expect(written.canonicalEdgeCount).toBe(1);
    });

    it('writes FAIL summary when passed is false', async () => {
      const builder = new ReportBuilder(config);
      await builder.writeDigest('ws', [], [], false);

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'digest.json'), 'utf-8'));
      expect(written.summary).toBe('FAIL');
    });
  });

  describe('writeMetrics', () => {
    it('writes analytical metrics (hotspots, bridges, orphans, weakZones)', async () => {
      const builder = new ReportBuilder(config);
      const nodes = [
        node('n1', 'auth'),
        node('n2', 'billing'),
        node('n3', 'auth'),
      ];
      const edges = [edge('e1', 'n1', 'n2')];

      await builder.writeMetrics('ws', nodes, edges);

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'metrics.json'), 'utf-8'));
      expect(written.hotspots).toBeDefined();
      expect(written.bridges).toBeDefined();
      expect(written.orphans).toContain('n3');
      expect(written.hotspots[0]?.nodeId).toBe('n1');
      expect(written.bridges[0]?.fromDomain).toBe('auth');
      expect(written.bridges[0]?.toDomain).toBe('billing');
    });
  });

  describe('writeEdgeHealth', () => {
    it('writes edge health with type/kind/confidence distributions', async () => {
      const builder = new ReportBuilder(config);
      const nodes = [node('n1'), node('n2')];
      const edges = [
        edge('e1', 'n1', 'n2'),
        edge('e2', 'n1', 'n2', { type: 'calls', graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];

      await builder.writeEdgeHealth('ws', edges, nodes);

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'edge-health.json'), 'utf-8'));
      expect(written.totalEdges).toBe(2);
      expect(written.edgesByType['canonical_dependency']).toBe(1);
      expect(written.edgesByType['calls']).toBe(1);
      expect(written.edgesByGraphKind['canonical']).toBe(1);
      expect(written.edgesByGraphKind['exploratory']).toBe(1);
      expect(written.edgesByConfidenceBand['AUTHORITATIVE']).toBe(1);
      expect(written.edgesByConfidenceBand['INFERRED']).toBe(1);
      expect(written.orphanedEdges).toBe(0);
    });

    it('detects orphaned edges (missing source/target nodes)', async () => {
      const builder = new ReportBuilder(config);
      const nodes = [node('n1')]; // n2 is missing
      const edges = [edge('e1', 'n1', 'n2')];

      await builder.writeEdgeHealth('ws', edges, nodes);

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'edge-health.json'), 'utf-8'));
      expect(written.missingTargetNode).toBe(1);
      expect(written.orphanedEdges).toBe(1);
    });
  });

  describe('writeAskReadiness', () => {
    it('reports unavailable when no engine is configured', async () => {
      const builder = new ReportBuilder(config);
      await builder.writeAskReadiness('ws');

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'ask-readiness-report.json'), 'utf-8'));
      expect(written.ready).toBe(false);
      expect(written.overallStatus).toBe('unavailable');
      expect(written.queryTypes).toHaveLength(7);
      expect(written.queryTypes.every((qt: { status: string }) => qt.status === 'unavailable')).toBe(true);
    });
  });

  describe('writeAgentContextReadiness', () => {
    it('reports unavailable when no engine factory is configured', async () => {
      const builder = new ReportBuilder(config);
      await builder.writeAgentContextReadiness('ws');

      const written = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'agent-context-readiness-report.json'), 'utf-8'));
      expect(written.ready).toBe(false);
      expect(written.overallStatus).toBe('unavailable');
      expect(written.capabilities.nodeSearch).toBe(false);
      expect(written.capabilities.impactAnalysis).toBe(false);
      expect(written.capabilities.callerLookup).toBe(false);
      expect(written.capabilities.graphStats).toBe(false);
    });
  });

  describe('legacy writeReport function', () => {
    it('writes verification, quality, lint, digest, and metrics reports', async () => {
      const nodes = [
        node('n1', 'auth'),
        node('n2', 'billing'),
        node('n3', 'auth'),
      ];
      const edges = [edge('e1', 'n1', 'n2')];

      await writeReport('ws', {
        passed: false,
        issues: ['CANONICAL_PROVENANCE_MISSING:n1'],
        invariants_checked: 3,
        invariants_passed: 2,
        graphQualityIssues: [
          { id: 'gq-1', severity: 'error', message: 'Missing provenance' },
          { id: 'gq-2', severity: 'warning', message: 'Low confidence' },
        ],
      }, config, { nodes, edges });

      // Verification report
      const verification = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'verification.json'), 'utf-8'));
      expect(verification.passed).toBe(false);
      expect(verification.issues).toContain('CANONICAL_PROVENANCE_MISSING:n1');

      // Quality report
      const quality = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'graph-quality.json'), 'utf-8'));
      expect(quality.precision).toBeDefined();
      expect(quality.recall).toBeDefined();
      expect(quality.confidence_distribution).toBeDefined();

      // Lint report
      const lint = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'lint.json'), 'utf-8'));
      expect(lint.counts.error).toBe(1);
      expect(lint.counts.warning).toBe(1);
      expect(lint.issues).toHaveLength(2);

      // Digest report
      const digest = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'digest.json'), 'utf-8'));
      expect(digest.summary).toBe('FAIL');
      expect(digest.nodeCount).toBe(3);
      expect(digest.edgeCount).toBe(1);

      // Metrics report
      const metrics = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'metrics.json'), 'utf-8'));
      expect(metrics.hotspots).toBeDefined();
      expect(metrics.bridges).toBeDefined();
      expect(metrics.orphans).toContain('n3');
    });
  });
});
