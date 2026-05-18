/**
 * Property-based tests for LayerViolationDetector.
 *
 * Property 6: Layer violation detection by direction and distance
 * For any `calls` or `invokes` edge between nodes in different layers, the
 * detector SHALL report a "skip_layer" violation if the edge crosses more than
 * one layer downward, AND SHALL report a "reverse_dependency" violation with
 * "critical" severity if the edge goes upward in the hierarchy, AND SHALL NOT
 * report a violation for single-layer downward crossings.
 *
 * **Validates: Requirements 3.3, 3.4**
 *
 * Property 7: Layer violation source reference preservation
 * For any layer violation detected on a canonical edge that has `source_file`
 * and `metadata.line`, the resulting finding SHALL include those source
 * references.
 *
 * **Validates: Requirements 3.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LayerViolationDetector } from '../analyzers/LayerViolationDetector.js';
import type { GraphNode, GraphEdge } from '../../../../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(id: string, sourceFile: string): GraphNode {
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
  };
}

function makeEdge(
  fromId: string,
  toId: string,
  opts?: { type?: string; graphKind?: string; line?: number },
): GraphEdge {
  return {
    id: `edge-${fromId}-${toId}`,
    stableKey: `edge-${fromId}-${toId}`,
    workspace: 'ws-1',
    from_id: fromId,
    to_id: toId,
    type: opts?.type ?? 'calls',
    graph_kind: (opts?.graphKind ?? 'canonical') as any,
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test',
      producer_stage: 'test',
      timestamp: '2024-01-01T00:00:00Z',
    },
    metadata: opts?.line !== undefined ? { line: opts.line } : undefined,
  };
}

// Layer modules and their indices in the default hierarchy
const LAYER_MODULES = ['mcp', 'core', 'pipeline', 'storage', 'scanner'] as const;
const LAYER_INDICES: Record<string, number> = {
  mcp: 0,
  cli: 0,
  core: 1,
  pipeline: 2,
  storage: 3,
  scanner: 4,
};

function moduleSourceFile(moduleName: string): string {
  return `src/${moduleName}/index.ts`;
}

// ---------------------------------------------------------------------------
// Property 6: Layer violation detection by direction and distance
// ---------------------------------------------------------------------------

describe('LayerViolationDetector — Property 6: Layer violation detection by direction and distance', () => {
  const detector = new LayerViolationDetector();

  /**
   * **Validates: Requirements 3.3, 3.4**
   *
   * Generate edges between nodes in different layers and verify:
   * - skip_layer for >1 layer downward
   * - reverse_dependency for upward
   * - no violation for single-layer down or same layer
   */
  it('classifies violations correctly based on layer direction and distance', () => {
    // Generate pairs of layer indices
    const arbLayerPair = fc
      .record({
        fromIdx: fc.integer({ min: 0, max: 4 }),
        toIdx: fc.integer({ min: 0, max: 4 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .filter(({ fromIdx, toIdx }) => fromIdx !== toIdx) // different layers only
      .map(({ fromIdx, toIdx, edgeType }) => {
        const fromModule = LAYER_MODULES[fromIdx]!;
        const toModule = LAYER_MODULES[toIdx]!;

        const fromNodeId = `node-${fromModule}`;
        const toNodeId = `node-${toModule}`;

        const nodes = [
          makeNode(fromNodeId, moduleSourceFile(fromModule)),
          makeNode(toNodeId, moduleSourceFile(toModule)),
        ];

        const edges = [makeEdge(fromNodeId, toNodeId, { type: edgeType })];

        const fromLayer = LAYER_INDICES[fromModule]!;
        const toLayer = LAYER_INDICES[toModule]!;

        // Determine expected outcome
        let expectedViolationType: 'skip_layer' | 'reverse_dependency' | 'none';
        let expectedSeverity: 'critical' | 'warning' | undefined;

        if (fromLayer > toLayer) {
          // Upward: reverse dependency
          expectedViolationType = 'reverse_dependency';
          expectedSeverity = 'critical';
        } else if (toLayer - fromLayer > 1) {
          // Skip layer: >1 layer downward
          expectedViolationType = 'skip_layer';
          expectedSeverity = 'warning';
        } else {
          // Single-layer downward (toLayer - fromLayer === 1): no violation
          expectedViolationType = 'none';
          expectedSeverity = undefined;
        }

        return { nodes, edges, expectedViolationType, expectedSeverity, fromLayer, toLayer };
      });

    fc.assert(
      fc.property(arbLayerPair, ({ nodes, edges, expectedViolationType, expectedSeverity }) => {
        const result = detector.detect(nodes, edges);

        if (expectedViolationType === 'none') {
          // No violation expected
          expect(result.violations.length).toBe(0);
          expect(result.findings.length).toBe(0);
        } else {
          // Exactly one violation expected
          expect(result.violations.length).toBe(1);
          expect(result.violations[0]!.violationType).toBe(expectedViolationType);
          expect(result.violations[0]!.severity).toBe(expectedSeverity);

          // Findings should also reflect the violation
          expect(result.findings.length).toBe(1);
          expect(result.findings[0]!.severity).toBe(expectedSeverity);
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.3, 3.4**
   *
   * Same-layer edges should never produce violations.
   */
  it('same-layer edges produce no violations', () => {
    // mcp and cli are both layer 0
    const arbSameLayer = fc
      .constantFrom('calls' as const, 'invokes' as const)
      .map((edgeType) => {
        const nodes = [
          makeNode('node-mcp', moduleSourceFile('mcp')),
          makeNode('node-cli', moduleSourceFile('cli')),
        ];
        const edges = [makeEdge('node-mcp', 'node-cli', { type: edgeType })];
        return { nodes, edges };
      });

    fc.assert(
      fc.property(arbSameLayer, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.violations.length).toBe(0);
        expect(result.findings.length).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * **Validates: Requirements 3.3**
   *
   * Single-layer downward crossings should never produce violations.
   */
  it('single-layer downward crossings produce no violations', () => {
    // Adjacent layer pairs: (0→1), (1→2), (2→3), (3→4)
    const adjacentPairs: Array<[string, string]> = [
      ['mcp', 'core'],
      ['core', 'pipeline'],
      ['pipeline', 'storage'],
      ['storage', 'scanner'],
    ];

    const arbAdjacentDown = fc
      .record({
        pairIdx: fc.integer({ min: 0, max: adjacentPairs.length - 1 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .map(({ pairIdx, edgeType }) => {
        const [fromMod, toMod] = adjacentPairs[pairIdx]!;
        const nodes = [
          makeNode(`node-${fromMod}`, moduleSourceFile(fromMod)),
          makeNode(`node-${toMod}`, moduleSourceFile(toMod)),
        ];
        const edges = [makeEdge(`node-${fromMod}`, `node-${toMod}`, { type: edgeType })];
        return { nodes, edges };
      });

    fc.assert(
      fc.property(arbAdjacentDown, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.violations.length).toBe(0);
        expect(result.findings.length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 3.4**
   *
   * All upward crossings should produce reverse_dependency with critical severity.
   */
  it('all upward crossings produce reverse_dependency with critical severity', () => {
    const arbUpward = fc
      .record({
        fromIdx: fc.integer({ min: 1, max: 4 }),
        toIdx: fc.integer({ min: 0, max: 3 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .filter(({ fromIdx, toIdx }) => fromIdx > toIdx)
      .map(({ fromIdx, toIdx, edgeType }) => {
        const fromModule = LAYER_MODULES[fromIdx]!;
        const toModule = LAYER_MODULES[toIdx]!;
        const nodes = [
          makeNode(`node-${fromModule}`, moduleSourceFile(fromModule)),
          makeNode(`node-${toModule}`, moduleSourceFile(toModule)),
        ];
        const edges = [makeEdge(`node-${fromModule}`, `node-${toModule}`, { type: edgeType })];
        return { nodes, edges };
      });

    fc.assert(
      fc.property(arbUpward, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.violations.length).toBe(1);
        expect(result.violations[0]!.violationType).toBe('reverse_dependency');
        expect(result.violations[0]!.severity).toBe('critical');
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.3**
   *
   * All skip-layer downward crossings (>1 layer) produce skip_layer with warning severity.
   */
  it('skip-layer downward crossings produce skip_layer with warning severity', () => {
    const arbSkipLayer = fc
      .record({
        fromIdx: fc.integer({ min: 0, max: 2 }),
        toIdx: fc.integer({ min: 2, max: 4 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .filter(({ fromIdx, toIdx }) => toIdx - fromIdx > 1)
      .map(({ fromIdx, toIdx, edgeType }) => {
        const fromModule = LAYER_MODULES[fromIdx]!;
        const toModule = LAYER_MODULES[toIdx]!;
        const nodes = [
          makeNode(`node-${fromModule}`, moduleSourceFile(fromModule)),
          makeNode(`node-${toModule}`, moduleSourceFile(toModule)),
        ];
        const edges = [makeEdge(`node-${fromModule}`, `node-${toModule}`, { type: edgeType })];
        return { nodes, edges };
      });

    fc.assert(
      fc.property(arbSkipLayer, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.violations.length).toBe(1);
        expect(result.violations[0]!.violationType).toBe('skip_layer');
        expect(result.violations[0]!.severity).toBe('warning');
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Layer violation source reference preservation
// ---------------------------------------------------------------------------

describe('LayerViolationDetector — Property 7: Layer violation source reference preservation', () => {
  const detector = new LayerViolationDetector();

  /**
   * **Validates: Requirements 3.5**
   *
   * Generate canonical edges with source_file and metadata.line set.
   * Assert resulting findings include those source references.
   */
  it('findings preserve source_file and line from the source node and edge metadata', () => {
    // Generate violations (upward or skip-layer) with random line numbers
    const arbViolationWithSource = fc
      .record({
        fromIdx: fc.integer({ min: 1, max: 4 }),
        toIdx: fc.integer({ min: 0, max: 3 }),
        line: fc.integer({ min: 1, max: 10000 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .filter(({ fromIdx, toIdx }) => fromIdx > toIdx) // reverse dependency
      .map(({ fromIdx, toIdx, line, edgeType }) => {
        const fromModule = LAYER_MODULES[fromIdx]!;
        const toModule = LAYER_MODULES[toIdx]!;
        const sourceFile = `src/${fromModule}/service.ts`;

        const nodes = [
          makeNode(`node-${fromModule}`, sourceFile),
          makeNode(`node-${toModule}`, moduleSourceFile(toModule)),
        ];

        const edges = [
          makeEdge(`node-${fromModule}`, `node-${toModule}`, {
            type: edgeType,
            graphKind: 'canonical',
            line,
          }),
        ];

        return { nodes, edges, expectedFile: sourceFile, expectedLine: line };
      });

    fc.assert(
      fc.property(
        arbViolationWithSource,
        ({ nodes, edges, expectedFile, expectedLine }) => {
          const result = detector.detect(nodes, edges);

          // Should detect exactly one violation
          expect(result.violations.length).toBe(1);
          expect(result.findings.length).toBe(1);

          const finding = result.findings[0]!;

          // Source references should include the file and line
          expect(finding.sourceReferences.length).toBeGreaterThanOrEqual(1);
          expect(finding.sourceReferences[0]!.file).toBe(expectedFile);
          expect(finding.sourceReferences[0]!.line).toBe(expectedLine);
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.5**
   *
   * Generate skip-layer violations with source references and verify preservation.
   */
  it('skip-layer findings also preserve source references', () => {
    const arbSkipWithSource = fc
      .record({
        fromIdx: fc.integer({ min: 0, max: 2 }),
        toIdx: fc.integer({ min: 2, max: 4 }),
        line: fc.integer({ min: 1, max: 10000 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .filter(({ fromIdx, toIdx }) => toIdx - fromIdx > 1) // skip-layer
      .map(({ fromIdx, toIdx, line, edgeType }) => {
        const fromModule = LAYER_MODULES[fromIdx]!;
        const toModule = LAYER_MODULES[toIdx]!;
        const sourceFile = `src/${fromModule}/handler.ts`;

        const nodes = [
          makeNode(`node-${fromModule}`, sourceFile),
          makeNode(`node-${toModule}`, moduleSourceFile(toModule)),
        ];

        const edges = [
          makeEdge(`node-${fromModule}`, `node-${toModule}`, {
            type: edgeType,
            graphKind: 'canonical',
            line,
          }),
        ];

        return { nodes, edges, expectedFile: sourceFile, expectedLine: line };
      });

    fc.assert(
      fc.property(
        arbSkipWithSource,
        ({ nodes, edges, expectedFile, expectedLine }) => {
          const result = detector.detect(nodes, edges);

          expect(result.violations.length).toBe(1);
          expect(result.findings.length).toBe(1);

          const finding = result.findings[0]!;
          expect(finding.sourceReferences.length).toBeGreaterThanOrEqual(1);
          expect(finding.sourceReferences[0]!.file).toBe(expectedFile);
          expect(finding.sourceReferences[0]!.line).toBe(expectedLine);
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.5**
   *
   * When metadata.line is undefined, the finding should still have the source_file
   * but line should be undefined.
   */
  it('findings preserve source_file even when line is undefined', () => {
    const arbNoLine = fc
      .record({
        fromIdx: fc.integer({ min: 1, max: 4 }),
        toIdx: fc.integer({ min: 0, max: 3 }),
        edgeType: fc.constantFrom('calls', 'invokes'),
      })
      .filter(({ fromIdx, toIdx }) => fromIdx > toIdx)
      .map(({ fromIdx, toIdx, edgeType }) => {
        const fromModule = LAYER_MODULES[fromIdx]!;
        const toModule = LAYER_MODULES[toIdx]!;
        const sourceFile = `src/${fromModule}/controller.ts`;

        const nodes = [
          makeNode(`node-${fromModule}`, sourceFile),
          makeNode(`node-${toModule}`, moduleSourceFile(toModule)),
        ];

        // No line in metadata
        const edges = [
          makeEdge(`node-${fromModule}`, `node-${toModule}`, {
            type: edgeType,
            graphKind: 'canonical',
          }),
        ];

        return { nodes, edges, expectedFile: sourceFile };
      });

    fc.assert(
      fc.property(arbNoLine, ({ nodes, edges, expectedFile }) => {
        const result = detector.detect(nodes, edges);

        expect(result.violations.length).toBe(1);
        expect(result.findings.length).toBe(1);

        const finding = result.findings[0]!;
        expect(finding.sourceReferences.length).toBeGreaterThanOrEqual(1);
        expect(finding.sourceReferences[0]!.file).toBe(expectedFile);
        expect(finding.sourceReferences[0]!.line).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });
});
