/**
 * Integration tests for the end-to-end architecture review pipeline.
 *
 * Tests the full flow: load graph → run review → verify report structure.
 * Also tests graceful degradation scenarios and error handling paths.
 *
 * **Validates: Requirements 5.1, 5.2, 7.5**
 */

import { describe, it, expect } from 'vitest';
import { ArchitectureReviewEngine } from '../ArchitectureReviewEngine.js';
import type { TrustedQueryService } from '../../../query/TrustedQueryService.js';
import type { GraphNode, GraphEdge, QueryResult } from '../../../../types.js';
import type { ArchitectureReport } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(id: string, sourceFile: string, opts: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    stableKey: id,
    workspace: 'ws-1',
    project: 'proj-1',
    type: 'function',
    label: `fn_${id}`,
    source_file: sourceFile,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test',
      producer_stage: 'test',
      timestamp: '2024-01-01T00:00:00Z',
    },
    ...opts,
  };
}

function makeEdge(
  fromId: string,
  toId: string,
  type = 'calls',
  graphKind: GraphNode['graph_kind'] = 'canonical',
  metadata?: GraphEdge['metadata'],
): GraphEdge {
  return {
    id: `edge-${fromId}-${toId}-${type}-${graphKind}`,
    stableKey: `edge-${fromId}-${toId}-${type}-${graphKind}`,
    workspace: 'ws-1',
    from_id: fromId,
    to_id: toId,
    type,
    graph_kind: graphKind,
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test',
      producer_stage: 'test',
      timestamp: '2024-01-01T00:00:00Z',
    },
    metadata,
  };
}

/**
 * Creates a mock TrustedQueryService that returns the given nodes and edges
 * from engine(workspaceId).getVisibleGraph().
 */
function createMockService(nodes: GraphNode[], edges: GraphEdge[]): TrustedQueryService {
  return {
    engine: () => ({
      getVisibleGraph: async () => ({ nodes, edges }),
    }),
  } as unknown as TrustedQueryService;
}

/**
 * Creates a mock TrustedQueryService that throws an error when getVisibleGraph is called.
 */
function createFailingService(error: Error): TrustedQueryService {
  return {
    engine: () => ({
      getVisibleGraph: async () => { throw error; },
    }),
  } as unknown as TrustedQueryService;
}

// ---------------------------------------------------------------------------
// Test: Full pipeline with findings
// ---------------------------------------------------------------------------

describe('Integration: Full pipeline with findings', () => {
  it('produces a complete report with cycle, layer violation, and dead code findings', async () => {
    // Build a graph with:
    // - A cycle: alpha → beta → gamma → alpha (warning)
    // - A reverse dependency: storage → mcp (critical layer violation)
    // - An orphan node (dead code)
    const nodes = [
      makeNode('node-alpha', 'src/alpha/index.ts'),
      makeNode('node-beta', 'src/beta/index.ts'),
      makeNode('node-gamma', 'src/gamma/index.ts'),
      makeNode('node-storage', 'src/storage/db.ts'),
      makeNode('node-mcp', 'src/mcp/tool.ts'),
      makeNode('node-orphan', 'src/orphan/unused.ts', { type: 'function' }),
    ];

    const edges: GraphEdge[] = [
      // Cycle: alpha → beta → gamma → alpha
      makeEdge('node-alpha', 'node-beta', 'calls'),
      makeEdge('node-beta', 'node-gamma', 'calls'),
      makeEdge('node-gamma', 'node-alpha', 'calls'),
      // Reverse dependency: storage → mcp
      makeEdge('node-storage', 'node-mcp', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service, {
      includeExploratory: false,
      layers: {
        hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'],
      },
    });

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // Verify report has findings from multiple analyzers
    expect(report.findings.length).toBeGreaterThan(0);

    // Should have cycle findings
    const cycleFindings = report.findings.filter((f) => f.type === 'dependency_cycle');
    expect(cycleFindings.length).toBeGreaterThanOrEqual(1);

    // Should have layer violation findings (reverse dependency)
    const layerFindings = report.findings.filter(
      (f) => f.type === 'layer_violation' || f.type === 'reverse_dependency',
    );
    expect(layerFindings.length).toBeGreaterThanOrEqual(1);

    // Should have dead code findings for the orphan node
    const deadCodeFindings = report.findings.filter(
      (f) => f.type === 'dead_code' || f.type === 'unused_component',
    );
    expect(deadCodeFindings.length).toBeGreaterThanOrEqual(1);

    // Verify recommendations are generated
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('findings have all required fields', async () => {
    const nodes = [
      makeNode('node-alpha', 'src/alpha/index.ts'),
      makeNode('node-beta', 'src/beta/index.ts'),
      makeNode('node-gamma', 'src/gamma/index.ts'),
    ];

    const edges: GraphEdge[] = [
      makeEdge('node-alpha', 'node-beta', 'calls'),
      makeEdge('node-beta', 'node-gamma', 'calls'),
      makeEdge('node-gamma', 'node-alpha', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    for (const finding of report.findings) {
      expect(finding).toHaveProperty('id');
      expect(finding).toHaveProperty('type');
      expect(finding).toHaveProperty('severity');
      expect(finding).toHaveProperty('description');
      expect(finding).toHaveProperty('affectedModules');
      expect(finding).toHaveProperty('sourceReferences');
      expect(finding).toHaveProperty('confidence');
      expect(typeof finding.id).toBe('string');
      expect(finding.id.length).toBeGreaterThan(0);
      expect(['critical', 'warning', 'info']).toContain(finding.severity);
      expect(['high', 'medium', 'low']).toContain(finding.confidence);
      expect(Array.isArray(finding.affectedModules)).toBe(true);
      expect(Array.isArray(finding.sourceReferences)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Test: Empty graph — graceful degradation
// ---------------------------------------------------------------------------

describe('Integration: Empty graph graceful degradation', () => {
  it('returns a valid empty report with zero findings for empty graph', async () => {
    const service = createMockService([], []);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // Report should be valid with zero findings
    expect(report.workspaceId).toBe('ws-1');
    expect(report.generatedAt).toBeDefined();
    expect(report.summary.totalFindings).toBe(0);
    expect(report.summary.critical).toBe(0);
    expect(report.summary.warning).toBe(0);
    expect(report.summary.info).toBe(0);
    expect(report.findings).toEqual([]);
    expect(report.recommendations).toEqual([]);

    // Metrics should be zero/empty
    expect(report.metrics.moduleCount).toBe(0);
    expect(report.metrics.cycleCount).toBe(0);
    expect(report.metrics.deadCodeCount).toBe(0);
    expect(report.metrics.flowCount).toBe(0);
  });

  it('QueryResult envelope is valid for empty graph', async () => {
    const service = createMockService([], []);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');

    // Verify QueryResult structure
    expect(result.status).toBe('OK');
    expect(result.confidence.level).toBe('HIGH');
    expect(result.data).toHaveProperty('nodes');
    expect(result.data).toHaveProperty('edges');
    expect(result.reasoning).toHaveProperty('selected_paths');
    expect(result.reasoning).toHaveProperty('selection_explanation');
    expect(result.provenance).toHaveProperty('sources');
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.codes)).toBe(true);
    expect(result.metadata).toHaveProperty('report');
    expect(result.metadata).toHaveProperty('policy');
  });
});

// ---------------------------------------------------------------------------
// Test: Graph with no flows — graceful degradation
// ---------------------------------------------------------------------------

describe('Integration: Graph with no flows graceful degradation', () => {
  it('produces a valid report when graph has nodes but no flow-forming edges', async () => {
    // Nodes in different modules but no edges connecting them into flows
    const nodes = [
      makeNode('node-a', 'src/alpha/a.ts'),
      makeNode('node-b', 'src/beta/b.ts'),
      makeNode('node-c', 'src/gamma/c.ts'),
    ];

    // No edges — no multi-node flows can be computed
    const service = createMockService(nodes, []);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // Report should still be valid
    expect(report.workspaceId).toBe('ws-1');
    expect(report.generatedAt).toBeDefined();
    // flowCount may be non-zero since computeFlows can create single-node flows
    expect(report.metrics.flowCount).toBeGreaterThanOrEqual(0);

    // No cycle or layer violation findings (no edges)
    const cycleFindings = report.findings.filter((f) => f.type === 'dependency_cycle');
    expect(cycleFindings.length).toBe(0);

    const layerFindings = report.findings.filter(
      (f) => f.type === 'layer_violation' || f.type === 'reverse_dependency',
    );
    expect(layerFindings.length).toBe(0);
  });

  it('produces dead code findings for isolated nodes', async () => {
    // Nodes with no edges are orphans → dead code
    const nodes = [
      makeNode('node-a', 'src/alpha/a.ts', { type: 'function' }),
      makeNode('node-b', 'src/beta/b.ts', { type: 'class' }),
    ];

    const service = createMockService(nodes, []);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // Orphan nodes should produce dead code findings
    const deadCodeFindings = report.findings.filter(
      (f) =>
        f.type === 'dead_code' ||
        f.type === 'unused_component' ||
        f.type === 'test_only_reachable',
    );
    expect(deadCodeFindings.length).toBeGreaterThanOrEqual(1);
  });

  it('handles graph with only exploratory edges gracefully', async () => {
    const nodes = [
      makeNode('node-a', 'src/alpha/a.ts'),
      makeNode('node-b', 'src/beta/b.ts'),
    ];

    // Only exploratory edges — should be filtered out when includeExploratory=false
    const edges: GraphEdge[] = [
      makeEdge('node-a', 'node-b', 'calls', 'exploratory'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // No cycle or layer violation findings from exploratory edges
    const cycleFindings = report.findings.filter((f) => f.type === 'dependency_cycle');
    expect(cycleFindings.length).toBe(0);

    // Report should still be valid
    expect(report.workspaceId).toBe('ws-1');
    expect(report.summary.totalFindings).toBe(report.findings.length);
  });
});

// ---------------------------------------------------------------------------
// Test: Report structure validation
// ---------------------------------------------------------------------------

describe('Integration: Report structure validation', () => {
  it('report has all required top-level fields', async () => {
    const nodes = [
      makeNode('node-alpha', 'src/alpha/index.ts'),
      makeNode('node-beta', 'src/beta/index.ts'),
    ];
    const edges: GraphEdge[] = [
      makeEdge('node-alpha', 'node-beta', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // Required top-level fields
    expect(report).toHaveProperty('workspaceId');
    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('findings');
    expect(report).toHaveProperty('recommendations');

    // Summary structure
    expect(report.summary).toHaveProperty('totalFindings');
    expect(report.summary).toHaveProperty('critical');
    expect(report.summary).toHaveProperty('warning');
    expect(report.summary).toHaveProperty('info');

    // Metrics structure
    expect(report.metrics).toHaveProperty('moduleCount');
    expect(report.metrics).toHaveProperty('averageCoupling');
    expect(report.metrics).toHaveProperty('averageCohesion');
    expect(report.metrics).toHaveProperty('cycleCount');
    expect(report.metrics).toHaveProperty('deadCodeCount');
    expect(report.metrics).toHaveProperty('flowCount');
  });

  it('summary counts are consistent with findings array', async () => {
    const nodes = [
      makeNode('node-alpha', 'src/alpha/index.ts'),
      makeNode('node-beta', 'src/beta/index.ts'),
      makeNode('node-gamma', 'src/gamma/index.ts'),
      makeNode('node-storage', 'src/storage/db.ts'),
      makeNode('node-mcp', 'src/mcp/tool.ts'),
    ];

    const edges: GraphEdge[] = [
      makeEdge('node-alpha', 'node-beta', 'calls'),
      makeEdge('node-beta', 'node-gamma', 'calls'),
      makeEdge('node-gamma', 'node-alpha', 'calls'),
      makeEdge('node-storage', 'node-mcp', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service, {
      layers: { hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'] },
    });

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // totalFindings must equal findings array length
    expect(report.summary.totalFindings).toBe(report.findings.length);

    // Sum of severity counts must equal totalFindings
    const sum = report.summary.critical + report.summary.warning + report.summary.info;
    expect(sum).toBe(report.summary.totalFindings);

    // Each severity count must match actual findings
    expect(report.summary.critical).toBe(
      report.findings.filter((f) => f.severity === 'critical').length,
    );
    expect(report.summary.warning).toBe(
      report.findings.filter((f) => f.severity === 'warning').length,
    );
    expect(report.summary.info).toBe(
      report.findings.filter((f) => f.severity === 'info').length,
    );
  });

  it('recommendations reference valid finding IDs', async () => {
    const nodes = [
      makeNode('node-alpha', 'src/alpha/index.ts'),
      makeNode('node-beta', 'src/beta/index.ts'),
      makeNode('node-gamma', 'src/gamma/index.ts'),
    ];

    const edges: GraphEdge[] = [
      makeEdge('node-alpha', 'node-beta', 'calls'),
      makeEdge('node-beta', 'node-gamma', 'calls'),
      makeEdge('node-gamma', 'node-alpha', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    const findingIds = new Set(report.findings.map((f) => f.id));

    for (const rec of report.recommendations) {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('relatedFindings');
      expect(['high', 'medium', 'low']).toContain(rec.priority);

      // All referenced finding IDs should exist in the findings array
      for (const findingId of rec.relatedFindings) {
        expect(findingIds.has(findingId)).toBe(true);
      }
    }
  });

  it('metrics values are non-negative numbers', async () => {
    const nodes = [
      makeNode('node-alpha', 'src/alpha/index.ts'),
      makeNode('node-beta', 'src/beta/index.ts'),
    ];
    const edges: GraphEdge[] = [
      makeEdge('node-alpha', 'node-beta', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    expect(report.metrics.moduleCount).toBeGreaterThanOrEqual(0);
    expect(report.metrics.averageCoupling).toBeGreaterThanOrEqual(0);
    expect(report.metrics.averageCoupling).toBeLessThanOrEqual(1);
    expect(report.metrics.averageCohesion).toBeGreaterThanOrEqual(0);
    expect(report.metrics.averageCohesion).toBeLessThanOrEqual(1);
    expect(report.metrics.cycleCount).toBeGreaterThanOrEqual(0);
    expect(report.metrics.deadCodeCount).toBeGreaterThanOrEqual(0);
    expect(report.metrics.flowCount).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Test: QueryResult envelope validation
// ---------------------------------------------------------------------------

describe('Integration: QueryResult envelope conforms to interface', () => {
  it('result has correct status based on findings severity', async () => {
    // Graph with critical findings (reverse dependency)
    const nodes = [
      makeNode('node-storage', 'src/storage/db.ts'),
      makeNode('node-mcp', 'src/mcp/tool.ts'),
    ];
    const edges: GraphEdge[] = [
      makeEdge('node-storage', 'node-mcp', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service, {
      layers: { hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'] },
    });

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    if (report.summary.critical > 0) {
      expect(result.status).toBe('PARTIAL');
      expect(result.codes).toContain('CRITICAL_FINDINGS');
    } else {
      expect(result.status).toBe('OK');
    }
  });

  it('result has OK status when no critical findings', async () => {
    // Simple graph with no violations
    const nodes = [
      makeNode('node-core', 'src/core/logic.ts'),
      makeNode('node-pipeline', 'src/pipeline/stage.ts'),
    ];
    // core → pipeline is a valid single-layer-down dependency
    const edges: GraphEdge[] = [
      makeEdge('node-core', 'node-pipeline', 'calls'),
    ];

    const service = createMockService(nodes, edges);
    const engine = new ArchitectureReviewEngine(service, {
      layers: { hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'] },
    });

    const result = await engine.review('ws-1', 'authoritative');
    const report = (result.metadata as { report: ArchitectureReport }).report;

    // If no critical findings, status should be OK
    if (report.summary.critical === 0) {
      expect(result.status).toBe('OK');
    }
  });

  it('result metadata contains policy information', async () => {
    const nodes = [makeNode('node-a', 'src/alpha/a.ts')];
    const service = createMockService(nodes, []);
    const engine = new ArchitectureReviewEngine(service);

    const result = await engine.review('ws-1', 'authoritative');

    expect(result.metadata).toHaveProperty('policy');
    const policy = (result.metadata as Record<string, unknown>).policy as Record<string, unknown>;
    expect(policy).toHaveProperty('operation');
    expect(policy).toHaveProperty('mode');
    expect(policy).toHaveProperty('traversedEdgeCount');
    expect(policy).toHaveProperty('blockedEdgeCount');
    expect(policy).toHaveProperty('blockedCodes');
  });

  it('confidence level reflects query mode', async () => {
    const nodes = [makeNode('node-a', 'src/alpha/a.ts')];
    const service = createMockService(nodes, []);

    // Authoritative mode → HIGH confidence
    const engine1 = new ArchitectureReviewEngine(service);
    const result1 = await engine1.review('ws-1', 'authoritative');
    expect(result1.confidence.level).toBe('HIGH');

    // Mixed safe mode → MEDIUM confidence
    const engine2 = new ArchitectureReviewEngine(service);
    const result2 = await engine2.review('ws-1', 'mixed_safe');
    expect(result2.confidence.level).toBe('MEDIUM');

    // Exploratory mode → MEDIUM confidence
    const engine3 = new ArchitectureReviewEngine(service);
    const result3 = await engine3.review('ws-1', 'exploratory');
    expect(result3.confidence.level).toBe('MEDIUM');
  });
});

// ---------------------------------------------------------------------------
// Test: Error handling paths
// ---------------------------------------------------------------------------

describe('Integration: Error handling paths', () => {
  it('propagates errors from getVisibleGraph', async () => {
    const service = createFailingService(new Error('DB read failure'));
    const engine = new ArchitectureReviewEngine(service);

    await expect(engine.review('ws-1', 'authoritative')).rejects.toThrow('DB read failure');
  });

  it('propagates workspace not found errors', async () => {
    const service = createFailingService(new Error('Workspace ws-unknown not found'));
    const engine = new ArchitectureReviewEngine(service);

    await expect(engine.review('ws-unknown', 'authoritative')).rejects.toThrow('not found');
  });

  it('getFindings propagates errors from review', async () => {
    const service = createFailingService(new Error('Connection refused'));
    const engine = new ArchitectureReviewEngine(service);

    await expect(engine.getFindings('ws-1', 'authoritative')).rejects.toThrow(
      'Connection refused',
    );
  });
});

// ---------------------------------------------------------------------------
// Test: getVisibleGraph trust filtering integration
// ---------------------------------------------------------------------------

describe('Integration: Trust filtering via getVisibleGraph', () => {
  it('engine uses getVisibleGraph which applies trust filtering', async () => {
    let capturedOperation: string | undefined;
    let capturedMode: string | undefined;

    const mockService = {
      engine: () => ({
        getVisibleGraph: async (operation: string, mode: string) => {
          capturedOperation = operation;
          capturedMode = mode;
          return { nodes: [], edges: [] };
        },
      }),
    } as unknown as TrustedQueryService;

    const engine = new ArchitectureReviewEngine(mockService);
    await engine.review('ws-1', 'mixed_safe');

    // Verify the engine passes the correct operation and mode
    expect(capturedOperation).toBe('wiki');
    expect(capturedMode).toBe('mixed_safe');
  });

  it('engine passes authoritative mode by default', async () => {
    let capturedMode: string | undefined;

    const mockService = {
      engine: () => ({
        getVisibleGraph: async (_operation: string, mode: string) => {
          capturedMode = mode;
          return { nodes: [], edges: [] };
        },
      }),
    } as unknown as TrustedQueryService;

    const engine = new ArchitectureReviewEngine(mockService);
    await engine.review('ws-1');

    expect(capturedMode).toBe('authoritative');
  });
});
