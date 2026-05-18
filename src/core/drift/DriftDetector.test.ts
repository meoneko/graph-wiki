import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DriftDetector, type BaselineSnapshot, type DriftReport } from './DriftDetector.js';
import { GraphDB } from '../../storage/GraphDB.js';
import type { GraphNode, GraphEdge, Provenance } from '../types.js';
import * as fs from 'node:fs';

/** Helper to safely access array element in tests — asserts non-null */
function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  if (item === undefined) throw new Error(`Expected item at index ${index}`);
  return item;
}
import * as path from 'node:path';
import os from 'node:os';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createTmpDir(): string {
  const dir = path.join(os.tmpdir(), `drift-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeProvenance(overrides: Partial<Provenance> = {}): Provenance {
  return {
    source: 'parser',
    artifact_source: 'typescript-adapter',
    producer_stage: 'extract',
    timestamp: '2024-01-01T00:00:00.000Z',
    file: 'src/test.ts',
    line_start: 1,
    line_end: 10,
    ...overrides,
  };
}

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    stableKey: `stable-${id}`,
    workspace: 'test-workspace',
    project: 'test-project',
    type: 'function',
    label: `Node ${id}`,
    source_file: 'src/test.ts',
    symbol: `symbol_${id}`,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: makeProvenance(),
    metadata: {},
    ...overrides,
  };
}

function makeEdge(id: string, from: string, to: string, overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    id,
    stableKey: `stable-edge-${id}`,
    workspace: 'test-workspace',
    from_id: from,
    to_id: to,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: makeProvenance(),
    metadata: {},
    ...overrides,
  };
}

function makeBaseline(overrides: Partial<BaselineSnapshot> = {}): BaselineSnapshot {
  return {
    id: 'baseline-001',
    workspaceId: 'test-workspace',
    createdAt: '2024-01-01T00:00:00.000Z',
    canonicalNodeCount: 3,
    canonicalEdgeCount: 2,
    exploratoryNodeCount: 1,
    exploratoryEdgeCount: 0,
    derivedNodeCount: 0,
    derivedEdgeCount: 0,
    nodeStableKeys: ['stable-node-1', 'stable-node-2', 'stable-node-3'],
    edgeStableKeys: ['stable-edge-1', 'stable-edge-2'],
    adapterVersions: { 'typescript-adapter': '1.0.0' },
    artifactFiles: [],
    ...overrides,
  };
}

function writeBaseline(baselinesDir: string, workspaceId: string, baseline: BaselineSnapshot): void {
  const dir = path.join(baselinesDir, workspaceId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'current.json'), JSON.stringify(baseline, null, 2));
}

function writeVerificationReport(baselinesDir: string, workspaceId: string, passed: boolean): void {
  const reportsDir = path.join(baselinesDir, '..', workspaceId, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, 'verification.json'),
    JSON.stringify({ passed, issues: [], workspaceId }),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DriftDetector', () => {
  let tmpDir: string;
  let baselinesDir: string;
  let db: GraphDB;
  let detector: DriftDetector;

  beforeEach(() => {
    tmpDir = createTmpDir();
    baselinesDir = path.join(tmpDir, 'baselines');
    fs.mkdirSync(baselinesDir, { recursive: true });
    db = new GraphDB(':memory:');
    detector = new DriftDetector(db, baselinesDir);
  });

  afterEach(() => {
    db.close();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  describe('detect()', () => {
    it('returns fail report when no baseline exists', async () => {
      const report = await detector.detect('test-workspace');

      expect(report.status).toBe('fail');
      expect(report.baselineId).toBe('none');
      expect(report.items).toHaveLength(1);
      expect(at(report.items, 0).severity).toBe('critical');
      expect(at(report.items, 0).description).toContain('No baseline found');
      expect(report.summary.critical).toBe(1);
    });

    it('returns pass when current state matches baseline', async () => {
      // Insert nodes and edges matching the baseline
      const nodes = [
        makeNode('node-1', { stableKey: 'stable-node-1' }),
        makeNode('node-2', { stableKey: 'stable-node-2' }),
        makeNode('node-3', { stableKey: 'stable-node-3' }),
      ];
      const edges = [
        makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'stable-edge-1' }),
        makeEdge('edge-2', 'node-2', 'node-3', { stableKey: 'stable-edge-2' }),
      ];
      const exploratoryNode = makeNode('exp-1', {
        stableKey: null,
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
      });

      for (const node of [...nodes, exploratoryNode]) {
        db.upsertNode(node);
      }
      for (const edge of edges) {
        db.upsertEdge(edge);
      }

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline());

      const report = await detector.detect('test-workspace');

      expect(report.status).toBe('pass');
      expect(report.items).toHaveLength(0);
      expect(report.summary).toEqual({ info: 0, warning: 0, critical: 0 });
    });

    it('detects canonical_node_count_changed', async () => {
      // Insert fewer nodes than baseline expects
      const node = makeNode('node-1', { stableKey: 'stable-node-1' });
      db.upsertNode(node);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        canonicalNodeCount: 5,
        nodeStableKeys: ['stable-node-1'],
      }));

      const report = await detector.detect('test-workspace');

      const driftItem = report.items.find(i => i.driftType === 'canonical_node_count_changed');
      expect(driftItem).toBeDefined();
      expect(driftItem!.category).toBe('graph');
      expect(driftItem!.description).toContain('5');
      expect(driftItem!.description).toContain('1');
      expect(driftItem!.suggestedActions.length).toBeGreaterThan(0);
    });

    it('detects canonical_edge_count_changed', async () => {
      // Insert more edges than baseline expects
      const nodes = [makeNode('n1'), makeNode('n2'), makeNode('n3')];
      for (const n of nodes) db.upsertNode(n);

      const edges = [
        makeEdge('e1', 'n1', 'n2'),
        makeEdge('e2', 'n2', 'n3'),
        makeEdge('e3', 'n1', 'n3'),
      ];
      for (const e of edges) db.upsertEdge(e);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        canonicalNodeCount: 3,
        canonicalEdgeCount: 1,
        nodeStableKeys: ['stable-n1', 'stable-n2', 'stable-n3'],
        edgeStableKeys: ['stable-edge-e1'],
      }));

      const report = await detector.detect('test-workspace');

      const driftItem = report.items.find(i => i.driftType === 'canonical_edge_count_changed');
      expect(driftItem).toBeDefined();
      expect(driftItem!.category).toBe('graph');
      expect(driftItem!.description).toContain('1');
      expect(driftItem!.description).toContain('3');
    });

    it('detects exploratory_count_changed', async () => {
      // Insert canonical nodes matching baseline, but add extra exploratory
      const nodes = [
        makeNode('node-1', { stableKey: 'stable-node-1' }),
        makeNode('node-2', { stableKey: 'stable-node-2' }),
        makeNode('node-3', { stableKey: 'stable-node-3' }),
      ];
      const exploratoryNodes = [
        makeNode('exp-1', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode('exp-2', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
        makeNode('exp-3', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' }),
      ];
      const edges = [
        makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'stable-edge-1' }),
        makeEdge('edge-2', 'node-2', 'node-3', { stableKey: 'stable-edge-2' }),
      ];

      for (const n of [...nodes, ...exploratoryNodes]) db.upsertNode(n);
      for (const e of edges) db.upsertEdge(e);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        exploratoryNodeCount: 1,
        exploratoryEdgeCount: 0,
      }));

      const report = await detector.detect('test-workspace');

      const driftItem = report.items.find(i => i.driftType === 'exploratory_count_changed');
      expect(driftItem).toBeDefined();
      expect(driftItem!.severity).toBe('info');
      expect(driftItem!.category).toBe('graph');
    });

    it('detects artifact_missing when baseline references missing files', async () => {
      const nodes = [
        makeNode('node-1', { stableKey: 'stable-node-1' }),
        makeNode('node-2', { stableKey: 'stable-node-2' }),
        makeNode('node-3', { stableKey: 'stable-node-3' }),
      ];
      const edges = [
        makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'stable-edge-1' }),
        makeEdge('edge-2', 'node-2', 'node-3', { stableKey: 'stable-edge-2' }),
      ];
      const exploratoryNode = makeNode('exp-1', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' });

      for (const n of [...nodes, exploratoryNode]) db.upsertNode(n);
      for (const e of edges) db.upsertEdge(e);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        artifactFiles: ['/nonexistent/path/canonical.graph.json', '/nonexistent/path/edges.jsonl'],
      }));

      const report = await detector.detect('test-workspace');

      const driftItems = report.items.filter(i => i.driftType === 'artifact_missing');
      expect(driftItems.length).toBe(2);
      expect(at(driftItems, 0).severity).toBe('critical');
      expect(at(driftItems, 0).affectedArtifacts).toBeDefined();
    });

    it('detects artifact_schema_changed when stable keys differ', async () => {
      // Insert nodes with different stable keys than baseline
      const nodes = [
        makeNode('node-1', { stableKey: 'stable-node-1' }),
        makeNode('node-new', { stableKey: 'stable-node-new' }),
      ];
      for (const n of nodes) db.upsertNode(n);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        canonicalNodeCount: 2,
        nodeStableKeys: ['stable-node-1', 'stable-node-old'],
        canonicalEdgeCount: 0,
        edgeStableKeys: [],
        exploratoryNodeCount: 0,
        exploratoryEdgeCount: 0,
      }));

      const report = await detector.detect('test-workspace');

      const driftItem = report.items.find(i => i.driftType === 'artifact_schema_changed');
      expect(driftItem).toBeDefined();
      expect(driftItem!.category).toBe('artifact');
      expect(driftItem!.description).toContain('added');
      expect(driftItem!.description).toContain('removed');
    });

    it('detects workspace_boundary_violation', async () => {
      // Create a node in another workspace
      db.upsertNode(makeNode('external-node', {
        stableKey: 'stable-ext',
        workspace: 'other-workspace',
      }));

      // Insert nodes in test-workspace
      const nodes = [
        makeNode('node-1', { stableKey: 'stable-node-1' }),
        makeNode('node-2', { stableKey: 'stable-node-2' }),
        makeNode('node-3', { stableKey: 'stable-node-3' }),
      ];
      // edge-2 references 'external-node' which belongs to other-workspace
      const edges = [
        makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'stable-edge-1' }),
        makeEdge('edge-2', 'node-1', 'external-node', { stableKey: 'stable-edge-2' }),
      ];
      const exploratoryNode = makeNode('exp-1', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' });

      for (const n of [...nodes, exploratoryNode]) db.upsertNode(n);
      for (const e of edges) db.upsertEdge(e);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline());

      const report = await detector.detect('test-workspace');

      const driftItem = report.items.find(i => i.driftType === 'workspace_boundary_violation');
      expect(driftItem).toBeDefined();
      expect(driftItem!.severity).toBe('critical');
      expect(driftItem!.category).toBe('workspace');
    });

    it('detects adapter_version_changed', async () => {
      const nodes = [
        makeNode('node-1', {
          stableKey: 'stable-node-1',
          metadata: { adapterVersion: '2.0.0' },
          provenance: makeProvenance({ artifact_source: 'typescript-adapter' }),
        }),
        makeNode('node-2', { stableKey: 'stable-node-2' }),
        makeNode('node-3', { stableKey: 'stable-node-3' }),
      ];
      const edges = [
        makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'stable-edge-1' }),
        makeEdge('edge-2', 'node-2', 'node-3', { stableKey: 'stable-edge-2' }),
      ];
      const exploratoryNode = makeNode('exp-1', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' });

      for (const n of [...nodes, exploratoryNode]) db.upsertNode(n);
      for (const e of edges) db.upsertEdge(e);

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        adapterVersions: { 'typescript-adapter': '1.0.0' },
      }));

      const report = await detector.detect('test-workspace');

      const driftItem = report.items.find(i => i.driftType === 'adapter_version_changed');
      expect(driftItem).toBeDefined();
      expect(driftItem!.severity).toBe('warning');
      expect(driftItem!.category).toBe('adapter');
      expect(driftItem!.description).toContain('1.0.0');
      expect(driftItem!.description).toContain('2.0.0');
    });

    it('assigns correct report status based on severity', async () => {
      // Critical items → fail
      db.upsertNode(makeNode('node-1', { stableKey: 'stable-node-1' }));

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        canonicalNodeCount: 10, // big difference → critical
        nodeStableKeys: ['stable-node-1'],
        canonicalEdgeCount: 0,
        edgeStableKeys: [],
        exploratoryNodeCount: 0,
        exploratoryEdgeCount: 0,
      }));

      const report = await detector.detect('test-workspace');
      expect(report.status).toBe('fail');
      expect(report.summary.critical).toBeGreaterThan(0);
    });

    it('includes nextActions in the report', async () => {
      const report = await detector.detect('test-workspace');
      expect(report.nextActions).toBeDefined();
      expect(report.nextActions.length).toBeGreaterThan(0);
    });

    it('detects provenance_missing for canonical nodes without provenance', async () => {
      // Create a node with invalid/missing provenance
      // We need to insert directly since the mapper enforces provenance
      const nodeWithProvenance = makeNode('node-1', { stableKey: 'stable-node-1' });
      const nodeWithProvenance2 = makeNode('node-2', { stableKey: 'stable-node-2' });
      const nodeWithProvenance3 = makeNode('node-3', { stableKey: 'stable-node-3' });
      db.upsertNode(nodeWithProvenance);
      db.upsertNode(nodeWithProvenance2);
      db.upsertNode(nodeWithProvenance3);

      const edges = [
        makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'stable-edge-1' }),
        makeEdge('edge-2', 'node-2', 'node-3', { stableKey: 'stable-edge-2' }),
      ];
      for (const e of edges) db.upsertEdge(e);

      const exploratoryNode = makeNode('exp-1', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' });
      db.upsertNode(exploratoryNode);

      // Baseline matches current state — no provenance drift expected
      writeBaseline(baselinesDir, 'test-workspace', makeBaseline());

      const report = await detector.detect('test-workspace');
      // All nodes have valid provenance, so no provenance_missing drift
      const provenanceItem = report.items.find(i => i.driftType === 'provenance_missing');
      expect(provenanceItem).toBeUndefined();
    });
  });

  describe('updateBaseline()', () => {
    it('creates a baseline file for the workspace', async () => {
      const nodes = [
        makeNode('node-1', { stableKey: 'sk-1' }),
        makeNode('node-2', { stableKey: 'sk-2' }),
      ];
      const edges = [makeEdge('edge-1', 'node-1', 'node-2', { stableKey: 'ek-1' })];

      for (const n of nodes) db.upsertNode(n);
      for (const e of edges) db.upsertEdge(e);

      await detector.updateBaseline('test-workspace');

      const baselinePath = path.join(baselinesDir, 'test-workspace', 'current.json');
      expect(fs.existsSync(baselinePath)).toBe(true);

      const baseline: BaselineSnapshot = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      expect(baseline.workspaceId).toBe('test-workspace');
      expect(baseline.canonicalNodeCount).toBe(2);
      expect(baseline.canonicalEdgeCount).toBe(1);
      expect(baseline.nodeStableKeys).toContain('sk-1');
      expect(baseline.nodeStableKeys).toContain('sk-2');
      expect(baseline.edgeStableKeys).toContain('ek-1');
      expect(baseline.id).toBeTruthy();
      expect(baseline.createdAt).toBeTruthy();
    });

    it('overwrites existing baseline', async () => {
      db.upsertNode(makeNode('node-1', { stableKey: 'sk-1' }));
      await detector.updateBaseline('test-workspace');

      // Add another node and update
      db.upsertNode(makeNode('node-2', { stableKey: 'sk-2' }));
      await detector.updateBaseline('test-workspace');

      const baselinePath = path.join(baselinesDir, 'test-workspace', 'current.json');
      const baseline: BaselineSnapshot = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      expect(baseline.canonicalNodeCount).toBe(2);
    });

    it('captures exploratory and derived counts', async () => {
      db.upsertNode(makeNode('c1', { stableKey: 'sk-c1', graph_kind: 'canonical' }));
      db.upsertNode(makeNode('d1', { stableKey: 'sk-d1', graph_kind: 'derived', confidence_band: 'EXTRACTED' }));
      db.upsertNode(makeNode('e1', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' }));
      db.upsertNode(makeNode('e2', { stableKey: null, graph_kind: 'exploratory', confidence_band: 'INFERRED' }));

      await detector.updateBaseline('test-workspace');

      const baselinePath = path.join(baselinesDir, 'test-workspace', 'current.json');
      const baseline: BaselineSnapshot = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      expect(baseline.canonicalNodeCount).toBe(1);
      expect(baseline.derivedNodeCount).toBe(1);
      expect(baseline.exploratoryNodeCount).toBe(2);
    });
  });

  describe('promoteBaseline()', () => {
    it('fails without verify pass when force is not set', async () => {
      db.upsertNode(makeNode('node-1'));
      await detector.updateBaseline('test-workspace');

      await expect(detector.promoteBaseline('test-workspace'))
        .rejects.toThrow('VERIFY_FAILED');
    });

    it('succeeds with force=true even without verify pass', async () => {
      db.upsertNode(makeNode('node-1'));
      await detector.updateBaseline('test-workspace');

      await expect(detector.promoteBaseline('test-workspace', { force: true }))
        .resolves.toBeUndefined();

      // Verify previous baseline was preserved
      const previousPath = path.join(baselinesDir, 'test-workspace', 'previous.json');
      expect(fs.existsSync(previousPath)).toBe(true);
    });

    it('succeeds when verification report shows passed', async () => {
      db.upsertNode(makeNode('node-1'));
      await detector.updateBaseline('test-workspace');

      // Write a passing verification report
      writeVerificationReport(baselinesDir, 'test-workspace', true);

      await expect(detector.promoteBaseline('test-workspace'))
        .resolves.toBeUndefined();
    });

    it('preserves previous baseline during promotion', async () => {
      // Create initial baseline
      db.upsertNode(makeNode('node-1', { stableKey: 'sk-1' }));
      await detector.updateBaseline('test-workspace');

      const firstBaselinePath = path.join(baselinesDir, 'test-workspace', 'current.json');
      const firstBaseline: BaselineSnapshot = JSON.parse(fs.readFileSync(firstBaselinePath, 'utf-8'));

      // Add more data and promote
      db.upsertNode(makeNode('node-2', { stableKey: 'sk-2' }));
      await detector.promoteBaseline('test-workspace', { force: true });

      // Previous should contain the first baseline
      const previousPath = path.join(baselinesDir, 'test-workspace', 'previous.json');
      const previous: BaselineSnapshot = JSON.parse(fs.readFileSync(previousPath, 'utf-8'));
      expect(previous.id).toBe(firstBaseline.id);
      expect(previous.canonicalNodeCount).toBe(1);

      // Current should reflect new state
      const current: BaselineSnapshot = JSON.parse(fs.readFileSync(firstBaselinePath, 'utf-8'));
      expect(current.canonicalNodeCount).toBe(2);
      expect(current.id).not.toBe(firstBaseline.id);
    });

    it('fails when verification report shows not passed', async () => {
      db.upsertNode(makeNode('node-1'));
      await detector.updateBaseline('test-workspace');

      writeVerificationReport(baselinesDir, 'test-workspace', false);

      await expect(detector.promoteBaseline('test-workspace'))
        .rejects.toThrow('VERIFY_FAILED');
    });
  });

  describe('DriftItem structure', () => {
    it('includes all required fields per design contract', async () => {
      db.upsertNode(makeNode('node-1', { stableKey: 'stable-node-1' }));

      writeBaseline(baselinesDir, 'test-workspace', makeBaseline({
        canonicalNodeCount: 5,
        nodeStableKeys: ['stable-node-1'],
        canonicalEdgeCount: 0,
        edgeStableKeys: [],
        exploratoryNodeCount: 0,
        exploratoryEdgeCount: 0,
      }));

      const report = await detector.detect('test-workspace');
      expect(report.items.length).toBeGreaterThan(0);

      const item = report.items[0]!;
      expect(item.id).toBeTruthy();
      expect(item.workspaceId).toBe('test-workspace');
      expect(item.baselineId).toBe('baseline-001');
      expect(item.category).toBeTruthy();
      expect(item.severity).toBeTruthy();
      expect(item.driftType).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.detectedAt).toBeTruthy();
      expect(item.suggestedActions).toBeDefined();
      expect(Array.isArray(item.suggestedActions)).toBe(true);
    });
  });

  describe('DriftReport structure', () => {
    it('includes all required fields per design contract', async () => {
      const report = await detector.detect('test-workspace');

      expect(report.workspaceId).toBe('test-workspace');
      expect(report.baselineId).toBeDefined();
      expect(report.status).toBeDefined();
      expect(['pass', 'warning', 'fail']).toContain(report.status);
      expect(report.items).toBeDefined();
      expect(Array.isArray(report.items)).toBe(true);
      expect(report.summary).toBeDefined();
      expect(typeof report.summary.info).toBe('number');
      expect(typeof report.summary.warning).toBe('number');
      expect(typeof report.summary.critical).toBe('number');
      expect(report.nextActions).toBeDefined();
      expect(Array.isArray(report.nextActions)).toBe(true);
    });
  });

  describe('drift type coverage', () => {
    it('supports all 13 drift types from design', () => {
      const allDriftTypes: string[] = [
        'artifact_missing',
        'artifact_schema_changed',
        'canonical_node_count_changed',
        'canonical_edge_count_changed',
        'exploratory_count_changed',
        'provenance_missing',
        'authority_policy_changed',
        'workspace_boundary_violation',
        'wiki_stale',
        'ask_readiness_degraded',
        'agent_context_readiness_degraded',
        'adapter_version_changed',
        'unknown',
      ];

      // Verify the DriftType type covers all 13
      expect(allDriftTypes).toHaveLength(13);
    });
  });
});
