/**
 * Property-based tests for ArchitectureReviewEngine.
 *
 * Property 8: Trust filtering excludes exploratory edges
 * For any graph containing edges with mixed `graph_kind` values, when
 * `includeExploratory` is false, the cycle detection and layer violation
 * detection SHALL produce findings based only on canonical and derived edges —
 * exploratory edges SHALL NOT contribute to any finding.
 *
 * **Validates: Requirements 6.1, 6.2**
 *
 * Property 9: Confidence annotation reflects trust level
 * For any finding, the confidence level SHALL be "high" if the mode is
 * authoritative, "medium" if the mode is mixed_safe, and "low" if the mode is
 * exploratory with includeExploratory enabled.
 *
 * **Validates: Requirements 6.3, 6.4, 6.5**
 *
 * Property 14: Severity filter correctness
 * For any set of findings and any severity filter value, the `getFindings`
 * method SHALL return only findings whose severity matches the filter, AND the
 * count of returned findings SHALL equal the count of findings with that
 * severity in the full set.
 *
 * **Validates: Requirements 7.4**
 *
 * Property 15: Report summary aggregation correctness
 * For any set of findings, the report summary SHALL have `totalFindings` equal
 * to the length of the findings array, AND `critical` + `warning` + `info`
 * SHALL equal `totalFindings`, AND each severity count SHALL equal the number
 * of findings with that severity.
 *
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ArchitectureReviewEngine } from '../ArchitectureReviewEngine.js';
import type { TrustedQueryService } from '../../../query/TrustedQueryService.js';
import type { GraphNode, GraphEdge, QueryMode } from '../../../../types.js';
import type { ArchitectureReport, ArchitectureReviewConfig } from '../types.js';

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

const MODULE_NAMES = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'];

function moduleSourceFile(moduleName: string): string {
  return `src/${moduleName}/index.ts`;
}

// ---------------------------------------------------------------------------
// Property 8: Trust filtering excludes exploratory edges
// ---------------------------------------------------------------------------

describe('ArchitectureReviewEngine — Property 8: Trust filtering excludes exploratory edges', () => {
  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * Generate graphs where a cycle exists ONLY via exploratory edges.
   * With includeExploratory=false, no cycle findings should be produced from
   * those exploratory edges.
   */
  it('exploratory-only cycles produce no findings when includeExploratory is false', () => {
    // Generate a cycle formed only by exploratory edges, plus a DAG of canonical edges
    const arbGraph = fc
      .integer({ min: 2, max: 4 })
      .map((cycleLength) => {
        const modules = MODULE_NAMES.slice(0, cycleLength);
        const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

        // Exploratory edges forming a cycle
        const exploratoryEdges: GraphEdge[] = [];
        for (let i = 0; i < modules.length; i++) {
          const from = `node-${modules[i]}`;
          const to = `node-${modules[(i + 1) % modules.length]}`;
          exploratoryEdges.push(makeEdge(from, to, 'calls', 'exploratory'));
        }

        // Canonical edges forming a DAG (forward only)
        const canonicalEdges: GraphEdge[] = [];
        for (let i = 0; i < modules.length - 1; i++) {
          const from = `node-${modules[i]}`;
          const to = `node-${modules[i + 1]}`;
          canonicalEdges.push(makeEdge(from, to, 'calls', 'canonical'));
        }

        return { nodes, edges: [...exploratoryEdges, ...canonicalEdges] };
      });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // No cycle findings should exist because the cycle is only via exploratory edges
        const cycleFindings = report.findings.filter(
          (f) => f.type === 'dependency_cycle',
        );
        expect(cycleFindings.length).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * Generate graphs where a layer violation exists ONLY via exploratory edges.
   * With includeExploratory=false, no layer violation findings should be produced
   * from those exploratory edges.
   */
  it('exploratory-only layer violations produce no findings when includeExploratory is false', () => {
    // Create a reverse dependency (storage → core) using only exploratory edges.
    // The canonical edge goes from core → pipeline (adjacent layers, no violation).
    const arbGraph = fc.constant(null).map(() => {
      const nodes = [
        makeNode('node-storage', 'src/storage/db.ts'),
        makeNode('node-core', 'src/core/logic.ts'),
        makeNode('node-pipeline', 'src/pipeline/stage.ts'),
      ];

      // Exploratory edge: storage calls core (reverse dependency — lower calling higher)
      const exploratoryEdges: GraphEdge[] = [
        makeEdge('node-storage', 'node-core', 'calls', 'exploratory'),
      ];

      // Canonical edge: core calls pipeline (single layer down, no violation)
      const canonicalEdges: GraphEdge[] = [
        makeEdge('node-core', 'node-pipeline', 'calls', 'canonical'),
      ];

      return { nodes, edges: [...exploratoryEdges, ...canonicalEdges] };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, {
          includeExploratory: false,
          layers: {
            hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'],
          },
        });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // No reverse_dependency or layer_violation findings from exploratory edges
        const layerFindings = report.findings.filter(
          (f) => f.type === 'layer_violation' || f.type === 'reverse_dependency',
        );
        expect(layerFindings.length).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * Generate graphs where canonical/derived edges form a cycle.
   * With includeExploratory=false, the cycle SHOULD still be detected.
   */
  it('canonical/derived cycles are still detected when includeExploratory is false', () => {
    const arbGraphKind = fc.constantFrom('canonical' as const, 'derived' as const);

    const arbGraph = arbGraphKind.map((kind) => {
      const modules = MODULE_NAMES.slice(0, 3);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

      // Canonical/derived edges forming a cycle
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', kind));
      }

      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // Cycle findings SHOULD exist because edges are canonical/derived
        const cycleFindings = report.findings.filter(
          (f) => f.type === 'dependency_cycle',
        );
        expect(cycleFindings.length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Confidence annotation reflects trust level
// ---------------------------------------------------------------------------

describe('ArchitectureReviewEngine — Property 9: Confidence annotation reflects trust level', () => {
  /**
   * **Validates: Requirements 6.3, 6.4, 6.5**
   *
   * Generate a graph that produces at least one finding, then verify that
   * confidence annotation matches the query mode:
   * - authoritative → "high"
   * - mixed_safe → "medium"
   * - exploratory with includeExploratory → "low"
   */
  it('confidence is "high" for authoritative mode', () => {
    // Create a cycle to guarantee findings
    const arbGraph = fc.constant(null).map(() => {
      const modules = MODULE_NAMES.slice(0, 3);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', 'canonical'));
      }
      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // All findings should have confidence "high" in authoritative mode
        for (const finding of report.findings) {
          expect(finding.confidence).toBe('high');
        }
      }),
      { numRuns: 30 },
    );
  });

  it('confidence is "medium" for mixed_safe mode', () => {
    const arbGraph = fc.constant(null).map(() => {
      const modules = MODULE_NAMES.slice(0, 3);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', 'canonical'));
      }
      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'mixed_safe');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // All findings should have confidence "medium" in mixed_safe mode
        for (const finding of report.findings) {
          expect(finding.confidence).toBe('medium');
        }
      }),
      { numRuns: 30 },
    );
  });

  it('confidence is "low" for exploratory mode with includeExploratory=true', () => {
    const arbGraph = fc.constant(null).map(() => {
      const modules = MODULE_NAMES.slice(0, 3);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', 'canonical'));
      }
      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: true });

        const result = await engine.review('ws-1', 'exploratory');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // All findings should have confidence "low" in exploratory mode with includeExploratory
        for (const finding of report.findings) {
          expect(finding.confidence).toBe('low');
        }
      }),
      { numRuns: 30 },
    );
  });

  it('confidence is "medium" for exploratory mode with includeExploratory=false', () => {
    const arbGraph = fc.constant(null).map(() => {
      const modules = MODULE_NAMES.slice(0, 3);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', 'canonical'));
      }
      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'exploratory');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // With includeExploratory=false in exploratory mode, confidence should be "medium"
        for (const finding of report.findings) {
          expect(finding.confidence).toBe('medium');
        }
      }),
      { numRuns: 30 },
    );
  });

  /**
   * **Validates: Requirements 6.3, 6.4, 6.5**
   *
   * Generate findings across all three modes and verify the confidence
   * annotation is consistent with the mode.
   */
  it('confidence annotation is consistent across modes for the same graph', () => {
    const arbMode = fc.constantFrom(
      { mode: 'authoritative' as QueryMode, includeExploratory: false, expected: 'high' },
      { mode: 'mixed_safe' as QueryMode, includeExploratory: false, expected: 'medium' },
      { mode: 'exploratory' as QueryMode, includeExploratory: true, expected: 'low' },
      { mode: 'exploratory' as QueryMode, includeExploratory: false, expected: 'medium' },
    );

    return fc.assert(
      fc.asyncProperty(arbMode, async ({ mode, includeExploratory, expected }) => {
        // Create a graph that always produces findings (a cycle)
        const modules = MODULE_NAMES.slice(0, 3);
        const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));
        const edges: GraphEdge[] = [];
        for (let i = 0; i < modules.length; i++) {
          const from = `node-${modules[i]}`;
          const to = `node-${modules[(i + 1) % modules.length]}`;
          edges.push(makeEdge(from, to, 'calls', 'canonical'));
        }

        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory });

        const result = await engine.review('ws-1', mode);
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // If there are findings, they should all have the expected confidence
        if (report.findings.length > 0) {
          for (const finding of report.findings) {
            expect(finding.confidence).toBe(expected);
          }
        }
      }),
      { numRuns: 30 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Severity filter correctness
// ---------------------------------------------------------------------------

describe('ArchitectureReviewEngine — Property 14: Severity filter correctness', () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * Generate a graph that produces findings of mixed severities, then verify
   * that getFindings with a severity filter returns only matching findings.
   */
  it('getFindings with severity filter returns only findings of that severity', () => {
    const arbSeverity = fc.constantFrom('critical' as const, 'warning' as const, 'info' as const);

    return fc.assert(
      fc.asyncProperty(arbSeverity, async (severityFilter) => {
        // Create a graph that produces findings of multiple severities:
        // - A cycle (3 modules) → warning severity cycle finding
        // - A reverse dependency (storage→mcp) → critical severity layer violation
        // - An orphan function node → info severity (test_only_reachable) or warning (dead_code)
        const nodes = [
          makeNode('node-alpha', 'src/alpha/index.ts'),
          makeNode('node-beta', 'src/beta/index.ts'),
          makeNode('node-gamma', 'src/gamma/index.ts'),
          makeNode('node-storage', 'src/storage/db.ts'),
          makeNode('node-mcp', 'src/mcp/tool.ts'),
        ];

        const edges: GraphEdge[] = [
          // Cycle: alpha → beta → gamma → alpha (warning severity)
          makeEdge('node-alpha', 'node-beta', 'calls', 'canonical'),
          makeEdge('node-beta', 'node-gamma', 'calls', 'canonical'),
          makeEdge('node-gamma', 'node-alpha', 'calls', 'canonical'),
          // Reverse dependency: storage → mcp (critical severity)
          makeEdge('node-storage', 'node-mcp', 'calls', 'canonical'),
        ];

        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, {
          includeExploratory: false,
          layers: {
            hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'],
          },
        });

        // Get all findings first
        const fullResult = await engine.getFindings('ws-1', 'authoritative');
        const fullReport = (fullResult.metadata as { report: ArchitectureReport }).report;

        // Get filtered findings
        const filteredResult = await engine.getFindings(
          'ws-1',
          'authoritative',
          severityFilter,
        );
        const filteredReport = (filteredResult.metadata as { report: ArchitectureReport }).report;

        // All filtered findings should match the severity filter
        for (const finding of filteredReport.findings) {
          expect(finding.severity).toBe(severityFilter);
        }

        // Count of filtered findings should match count in full report
        const expectedCount = fullReport.findings.filter(
          (f) => f.severity === severityFilter,
        ).length;
        expect(filteredReport.findings.length).toBe(expectedCount);

        // Summary should reflect filtered findings
        expect(filteredReport.summary.totalFindings).toBe(filteredReport.findings.length);
      }),
      { numRuns: 30 },
    );
  });

  /**
   * **Validates: Requirements 7.4**
   *
   * When no severity filter is provided, all findings should be returned.
   */
  it('getFindings without filter returns all findings', () => {
    return fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const nodes = [
          makeNode('node-alpha', 'src/alpha/index.ts'),
          makeNode('node-beta', 'src/beta/index.ts'),
          makeNode('node-gamma', 'src/gamma/index.ts'),
        ];

        const edges: GraphEdge[] = [
          makeEdge('node-alpha', 'node-beta', 'calls', 'canonical'),
          makeEdge('node-beta', 'node-gamma', 'calls', 'canonical'),
          makeEdge('node-gamma', 'node-alpha', 'calls', 'canonical'),
        ];

        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const reviewResult = await engine.review('ws-1', 'authoritative');
        const reviewReport = (reviewResult.metadata as { report: ArchitectureReport }).report;

        const findingsResult = await engine.getFindings('ws-1', 'authoritative');
        const findingsReport = (findingsResult.metadata as { report: ArchitectureReport }).report;

        // Without filter, getFindings should return same findings as review
        expect(findingsReport.findings.length).toBe(reviewReport.findings.length);
      }),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Report summary aggregation correctness
// ---------------------------------------------------------------------------

describe('ArchitectureReviewEngine — Property 15: Report summary aggregation correctness', () => {
  /**
   * **Validates: Requirements 5.2**
   *
   * Generate graphs that produce findings and verify the summary aggregation:
   * - totalFindings equals findings array length
   * - critical + warning + info equals totalFindings
   * - Each severity count equals the number of findings with that severity
   */
  it('totalFindings equals findings array length', () => {
    // Generate graphs of varying complexity to produce different finding counts
    const arbModuleCount = fc.integer({ min: 2, max: 5 }).map((count) => {
      const modules = MODULE_NAMES.slice(0, count);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

      // Create a cycle to guarantee at least one finding
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', 'canonical'));
      }

      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbModuleCount, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // totalFindings must equal findings array length
        expect(report.summary.totalFindings).toBe(report.findings.length);
      }),
      { numRuns: 50 },
    );
  });

  it('critical + warning + info equals totalFindings', () => {
    const arbModuleCount = fc.integer({ min: 2, max: 5 }).map((count) => {
      const modules = MODULE_NAMES.slice(0, count);
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls', 'canonical'));
      }

      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbModuleCount, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // Sum of severity counts must equal totalFindings
        const sum = report.summary.critical + report.summary.warning + report.summary.info;
        expect(sum).toBe(report.summary.totalFindings);
      }),
      { numRuns: 50 },
    );
  });

  it('each severity count equals the number of findings with that severity', () => {
    // Create a graph with layer violations (critical) and cycles (warning)
    const arbGraph = fc.constant(null).map(() => {
      const nodes = [
        makeNode('node-alpha', 'src/alpha/index.ts'),
        makeNode('node-beta', 'src/beta/index.ts'),
        makeNode('node-gamma', 'src/gamma/index.ts'),
        makeNode('node-storage', 'src/storage/db.ts'),
        makeNode('node-mcp', 'src/mcp/tool.ts'),
      ];

      const edges: GraphEdge[] = [
        // Cycle (warning)
        makeEdge('node-alpha', 'node-beta', 'calls', 'canonical'),
        makeEdge('node-beta', 'node-gamma', 'calls', 'canonical'),
        makeEdge('node-gamma', 'node-alpha', 'calls', 'canonical'),
        // Reverse dependency (critical)
        makeEdge('node-storage', 'node-mcp', 'calls', 'canonical'),
      ];

      return { nodes, edges };
    });

    return fc.assert(
      fc.asyncProperty(arbGraph, async ({ nodes, edges }) => {
        const service = createMockService(nodes, edges);
        const engine = new ArchitectureReviewEngine(service, {
          includeExploratory: false,
          layers: {
            hierarchy: ['mcp', 'cli', 'core', 'pipeline', 'storage', 'scanner'],
          },
        });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        // Verify each severity count matches actual findings
        const actualCritical = report.findings.filter((f) => f.severity === 'critical').length;
        const actualWarning = report.findings.filter((f) => f.severity === 'warning').length;
        const actualInfo = report.findings.filter((f) => f.severity === 'info').length;

        expect(report.summary.critical).toBe(actualCritical);
        expect(report.summary.warning).toBe(actualWarning);
        expect(report.summary.info).toBe(actualInfo);
      }),
      { numRuns: 30 },
    );
  });

  /**
   * **Validates: Requirements 5.2**
   *
   * Even with an empty graph (no findings), the summary should be consistent.
   */
  it('empty graph produces consistent zero summary', () => {
    return fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const service = createMockService([], []);
        const engine = new ArchitectureReviewEngine(service, { includeExploratory: false });

        const result = await engine.review('ws-1', 'authoritative');
        const report = (result.metadata as { report: ArchitectureReport }).report;

        expect(report.summary.totalFindings).toBe(report.findings.length);
        expect(report.summary.critical + report.summary.warning + report.summary.info).toBe(
          report.summary.totalFindings,
        );
      }),
      { numRuns: 10 },
    );
  });
});
