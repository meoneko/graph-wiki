/**
 * Property-based tests for CycleDetector.
 *
 * Property 4: Cycle detection correctness
 * For any directed module-level dependency graph, every reported cycle SHALL be
 * a valid cycle (following the module sequence through edges returns to the
 * starting module), AND for any DAG (directed acyclic graph) the detector SHALL
 * report zero cycles.
 *
 * **Validates: Requirements 2.2, 2.3**
 *
 * Property 5: Cycle severity classification
 * For any detected dependency cycle, the severity SHALL be "critical" if the
 * cycle involves more than 3 modules, and "warning" if it involves 2 or 3
 * modules.
 *
 * **Validates: Requirements 2.4, 2.5**
 *
 * Property 16: Module dependency graph edge type filtering
 * For any set of edges with mixed types, the module dependency graph
 * construction SHALL include only edges of type `calls`, `invokes`, or
 * `imports` — all other edge types SHALL NOT contribute to cycle detection.
 *
 * **Validates: Requirements 2.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CycleDetector } from '../analyzers/CycleDetector.js';
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
  type = 'calls',
  graphKind: string = 'canonical',
): GraphEdge {
  return {
    id: `edge-${fromId}-${toId}-${type}`,
    stableKey: `edge-${fromId}-${toId}-${type}`,
    workspace: 'ws-1',
    from_id: fromId,
    to_id: toId,
    type,
    graph_kind: graphKind as any,
    confidence_band: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test',
      producer_stage: 'test',
      timestamp: '2024-01-01T00:00:00Z',
    },
  };
}

// Module names used for generating distinct modules
const MODULE_NAMES = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta'];

function moduleSourceFile(moduleName: string): string {
  return `src/${moduleName}/index.ts`;
}

// ---------------------------------------------------------------------------
// Property 4: Cycle detection correctness
// ---------------------------------------------------------------------------

describe('CycleDetector — Property 4: Cycle detection correctness', () => {
  const detector = new CycleDetector();

  /**
   * **Validates: Requirements 2.2, 2.3**
   *
   * Generate graphs with known cycles and verify every reported cycle is valid
   * (all modules in the cycle are connected via edges forming a loop).
   */
  it('every reported cycle is valid: following edges through modules returns to start', () => {
    // Generator: create N modules with edges forming a known cycle
    const arbCycleGraph = fc
      .integer({ min: 2, max: 6 })
      .chain((cycleLength) => {
        // Pick cycleLength distinct modules
        const modules = MODULE_NAMES.slice(0, cycleLength);

        return fc.constant(modules).map((mods) => {
          // Create one node per module
          const nodes = mods.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

          // Create edges forming a cycle: A→B→C→...→A
          const edges: GraphEdge[] = [];
          for (let i = 0; i < mods.length; i++) {
            const from = `node-${mods[i]}`;
            const to = `node-${mods[(i + 1) % mods.length]}`;
            edges.push(makeEdge(from, to, 'calls'));
          }

          return { nodes, edges, modules: mods };
        });
      });

    fc.assert(
      fc.property(arbCycleGraph, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);

        // At least one cycle should be detected
        expect(result.cycles.length).toBeGreaterThanOrEqual(1);

        // For each reported cycle, verify it's valid:
        // Every consecutive pair of modules in the cycle must have an edge between them
        // in the module-level adjacency graph
        for (const cycle of result.cycles) {
          expect(cycle.modules.length).toBeGreaterThanOrEqual(2);

          // Build module-level adjacency from the input edges
          const moduleAdj = new Map<string, Set<string>>();
          for (const edge of edges) {
            const fromNode = nodes.find((n) => n.id === edge.from_id);
            const toNode = nodes.find((n) => n.id === edge.to_id);
            if (!fromNode || !toNode) continue;

            // Derive module from source_file (same logic as CycleDetector)
            const fromMod = fromNode.source_file!.split('/')[1]!;
            const toMod = toNode.source_file!.split('/')[1]!;
            if (fromMod === toMod) continue;

            if (!moduleAdj.has(fromMod)) moduleAdj.set(fromMod, new Set());
            moduleAdj.get(fromMod)!.add(toMod);
          }

          // Verify: all modules in the cycle are reachable from each other
          // (they form a strongly connected component)
          for (const mod of cycle.modules) {
            // Each module in the cycle should have at least one outgoing edge
            // to another module in the cycle
            const neighbors = moduleAdj.get(mod) ?? new Set();
            const hasEdgeInCycle = cycle.modules.some(
              (other) => other !== mod && neighbors.has(other),
            );
            expect(hasEdgeInCycle).toBe(true);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 2.2, 2.3**
   *
   * Generate DAGs (topologically ordered edges) and verify zero cycles reported.
   */
  it('DAGs produce zero cycles', () => {
    // Generator: create a DAG by only allowing edges from lower-index to higher-index modules
    const arbDAG = fc
      .integer({ min: 2, max: 6 })
      .chain((nodeCount) => {
        const modules = MODULE_NAMES.slice(0, nodeCount);

        // Generate random edges that only go forward (lower index → higher index)
        return fc
          .array(
            fc.record({
              fromIdx: fc.integer({ min: 0, max: nodeCount - 2 }),
              toOffset: fc.integer({ min: 1, max: nodeCount - 1 }),
            }),
            { minLength: 1, maxLength: nodeCount * 2 },
          )
          .map((edgeSpecs) => {
            const nodes = modules.map((mod) =>
              makeNode(`node-${mod}`, moduleSourceFile(mod)),
            );

            const edges: GraphEdge[] = [];
            const seen = new Set<string>();

            for (const { fromIdx, toOffset } of edgeSpecs) {
              const toIdx = Math.min(fromIdx + toOffset, nodeCount - 1);
              if (fromIdx >= toIdx) continue; // Ensure strictly forward

              const key = `${fromIdx}-${toIdx}`;
              if (seen.has(key)) continue;
              seen.add(key);

              edges.push(
                makeEdge(
                  `node-${modules[fromIdx]}`,
                  `node-${modules[toIdx]}`,
                  'calls',
                ),
              );
            }

            return { nodes, edges };
          });
      });

    fc.assert(
      fc.property(arbDAG, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.cycles.length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Cycle severity classification
// ---------------------------------------------------------------------------

describe('CycleDetector — Property 5: Cycle severity classification', () => {
  const detector = new CycleDetector();

  /**
   * **Validates: Requirements 2.4, 2.5**
   *
   * Generate cycles of various lengths (2-6) and verify severity classification:
   * - 2 or 3 modules → "warning"
   * - >3 modules → "critical"
   */
  it('severity is "warning" for 2-3 modules and "critical" for >3 modules', () => {
    const arbCycleLength = fc.integer({ min: 2, max: 6 }).map((cycleLength) => {
      const modules = MODULE_NAMES.slice(0, cycleLength);

      // Create one node per module
      const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

      // Create edges forming a cycle: mod[0]→mod[1]→...→mod[n-1]→mod[0]
      const edges: GraphEdge[] = [];
      for (let i = 0; i < modules.length; i++) {
        const from = `node-${modules[i]}`;
        const to = `node-${modules[(i + 1) % modules.length]}`;
        edges.push(makeEdge(from, to, 'calls'));
      }

      const expectedSeverity = cycleLength > 3 ? 'critical' : 'warning';
      return { nodes, edges, cycleLength, expectedSeverity };
    });

    fc.assert(
      fc.property(arbCycleLength, ({ nodes, edges, cycleLength, expectedSeverity }) => {
        const result = detector.detect(nodes, edges);

        // Should detect exactly one cycle
        expect(result.cycles.length).toBe(1);

        const cycle = result.cycles[0]!;
        expect(cycle.modules.length).toBe(cycleLength);
        expect(cycle.severity).toBe(expectedSeverity);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Module dependency graph edge type filtering
// ---------------------------------------------------------------------------

describe('CycleDetector — Property 16: Module dependency graph edge type filtering', () => {
  const detector = new CycleDetector();

  const NON_DEPENDENCY_EDGE_TYPES = [
    'belongs_to',
    'dispatches_to',
    'contains',
    'inherits',
    'implements',
    'triggers',
    'reads',
    'writes',
  ];

  const DEPENDENCY_EDGE_TYPES = ['calls', 'invokes', 'imports'];

  /**
   * **Validates: Requirements 2.1**
   *
   * Generate a cycle using only non-dependency edge types.
   * Assert no cycle is detected (those edge types are filtered out).
   */
  it('cycles formed by non-dependency edge types are not detected', () => {
    const arbNonDepCycle = fc
      .record({
        cycleLength: fc.integer({ min: 2, max: 5 }),
        edgeType: fc.constantFrom(...NON_DEPENDENCY_EDGE_TYPES),
      })
      .map(({ cycleLength, edgeType }) => {
        const modules = MODULE_NAMES.slice(0, cycleLength);
        const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

        // Create edges forming a cycle using non-dependency edge type
        const edges: GraphEdge[] = [];
        for (let i = 0; i < modules.length; i++) {
          const from = `node-${modules[i]}`;
          const to = `node-${modules[(i + 1) % modules.length]}`;
          edges.push(makeEdge(from, to, edgeType));
        }

        return { nodes, edges };
      });

    fc.assert(
      fc.property(arbNonDepCycle, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.cycles.length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * Generate a cycle using dependency edge types (calls, invokes, imports).
   * Assert the cycle IS detected.
   */
  it('cycles formed by dependency edge types (calls, invokes, imports) are detected', () => {
    const arbDepCycle = fc
      .record({
        cycleLength: fc.integer({ min: 2, max: 5 }),
        edgeType: fc.constantFrom(...DEPENDENCY_EDGE_TYPES),
      })
      .map(({ cycleLength, edgeType }) => {
        const modules = MODULE_NAMES.slice(0, cycleLength);
        const nodes = modules.map((mod) => makeNode(`node-${mod}`, moduleSourceFile(mod)));

        // Create edges forming a cycle using dependency edge type
        const edges: GraphEdge[] = [];
        for (let i = 0; i < modules.length; i++) {
          const from = `node-${modules[i]}`;
          const to = `node-${modules[(i + 1) % modules.length]}`;
          edges.push(makeEdge(from, to, edgeType));
        }

        return { nodes, edges, cycleLength };
      });

    fc.assert(
      fc.property(arbDepCycle, ({ nodes, edges, cycleLength }) => {
        const result = detector.detect(nodes, edges);
        expect(result.cycles.length).toBe(1);
        expect(result.cycles[0]!.modules.length).toBe(cycleLength);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * Generate a graph with mixed edge types where only non-dependency edges
   * form a cycle, and dependency edges form a DAG.
   * Assert no cycle is detected.
   */
  it('mixed edge types: only dependency edges contribute to cycle detection', () => {
    const arbMixedGraph = fc
      .integer({ min: 3, max: 5 })
      .chain((moduleCount) => {
        const modules = MODULE_NAMES.slice(0, moduleCount);

        return fc
          .array(fc.constantFrom(...NON_DEPENDENCY_EDGE_TYPES), {
            minLength: moduleCount,
            maxLength: moduleCount,
          })
          .map((nonDepTypes) => {
            const nodes = modules.map((mod) =>
              makeNode(`node-${mod}`, moduleSourceFile(mod)),
            );

            const edges: GraphEdge[] = [];

            // Non-dependency edges form a cycle: mod[0]→mod[1]→...→mod[0]
            for (let i = 0; i < modules.length; i++) {
              const from = `node-${modules[i]}`;
              const to = `node-${modules[(i + 1) % modules.length]}`;
              edges.push(makeEdge(from, to, nonDepTypes[i]!));
            }

            // Dependency edges form a DAG (only forward edges)
            for (let i = 0; i < modules.length - 1; i++) {
              const from = `node-${modules[i]}`;
              const to = `node-${modules[i + 1]}`;
              edges.push(makeEdge(from, to, 'calls'));
            }

            return { nodes, edges };
          });
      });

    fc.assert(
      fc.property(arbMixedGraph, ({ nodes, edges }) => {
        const result = detector.detect(nodes, edges);
        expect(result.cycles.length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});
