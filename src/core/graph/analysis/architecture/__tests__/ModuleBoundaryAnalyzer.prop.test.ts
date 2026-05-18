/**
 * Property-based tests for ModuleBoundaryAnalyzer.
 *
 * Property 1: Module identification partitions all nodes
 * For any set of GraphNodes with non-empty source_file fields, the module
 * identification function SHALL assign every node to exactly one module,
 * and the union of all module node sets SHALL equal the input node set.
 *
 * **Validates: Requirements 1.1**
 *
 * Property 2: Coupling score bounds and threshold flagging
 * For any pair of modules with at least one node each and any set of edges
 * between them, the computed coupling score SHALL be in the range [0, 1],
 * AND a pair SHALL be flagged as "high coupling" if and only if its coupling
 * score exceeds 0.7.
 *
 * **Validates: Requirements 1.2, 1.4**
 *
 * Property 3: Cohesion score bounds and threshold flagging
 * For any module with at least 2 nodes and any set of internal edges, the
 * computed cohesion score SHALL be in the range [0, 1], AND a module SHALL
 * be flagged as "low cohesion" if and only if its cohesion score falls below 0.3.
 *
 * **Validates: Requirements 1.3, 1.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ModuleBoundaryAnalyzer } from '../analyzers/ModuleBoundaryAnalyzer.js';
import type { GraphNode, GraphEdge } from '../../../../types.js';
import type { Community } from '../../community.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const arbProvenance = fc.record({
  source: fc.constant('parser' as const),
  artifact_source: fc.constant('test'),
  producer_stage: fc.constant('test'),
  timestamp: fc.constant('2024-01-01T00:00:00Z'),
});

const arbGraphNode = fc.record({
  id: fc.uuid(),
  stableKey: fc.uuid(),
  workspace: fc.constant('ws-1'),
  project: fc.constant('proj-1'),
  type: fc.constantFrom('function', 'class', 'method', 'service'),
  label: fc.string({ minLength: 1, maxLength: 20 }),
  source_file: fc.constantFrom(
    'src/core/index.ts',
    'src/pipeline/stages/validate.ts',
    'src/storage/GraphDB.ts',
    'src/mcp/tools/review.ts',
    'src/scanner/core/parser.ts',
  ),
  graph_kind: fc.constant('canonical' as const),
  confidence_band: fc.constant('AUTHORITATIVE' as const),
  provenance: arbProvenance,
});

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('ModuleBoundaryAnalyzer — Property 1: Module identification partitions all nodes', () => {
  const analyzer = new ModuleBoundaryAnalyzer();

  it('every node is assigned to exactly one module (union of module nodeIds equals input node set)', () => {
    fc.assert(
      fc.property(
        fc.array(arbGraphNode, { minLength: 1, maxLength: 50 }),
        (nodes: GraphNode[]) => {
          const result = analyzer.analyze(nodes, [], []);

          // Collect all node IDs from all modules
          const allAssignedIds: string[] = [];
          for (const mod of result.modules) {
            allAssignedIds.push(...mod.nodeIds);
          }

          const inputIds = new Set(nodes.map(n => n.id));
          const assignedSet = new Set(allAssignedIds);

          // Assert: union of all module node sets equals input node set
          expect(assignedSet.size).toBe(inputIds.size);
          for (const id of inputIds) {
            expect(assignedSet.has(id)).toBe(true);
          }

          // Assert: no node appears in more than one module (no duplicates)
          expect(allAssignedIds.length).toBe(assignedSet.size);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('no node appears in more than one module', () => {
    fc.assert(
      fc.property(
        fc.array(arbGraphNode, { minLength: 1, maxLength: 50 }),
        (nodes: GraphNode[]) => {
          const result = analyzer.analyze(nodes, [], []);

          // Track which module each node is assigned to
          const nodeToModule = new Map<string, string>();
          for (const mod of result.modules) {
            for (const nodeId of mod.nodeIds) {
              // If a node already appears in another module, this will fail
              expect(nodeToModule.has(nodeId)).toBe(false);
              nodeToModule.set(nodeId, mod.id);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('every input node appears in exactly one module', () => {
    fc.assert(
      fc.property(
        fc.array(arbGraphNode, { minLength: 1, maxLength: 50 }),
        (nodes: GraphNode[]) => {
          const result = analyzer.analyze(nodes, [], []);

          // Build a count of how many modules each node appears in
          const nodeModuleCount = new Map<string, number>();
          for (const mod of result.modules) {
            for (const nodeId of mod.nodeIds) {
              nodeModuleCount.set(nodeId, (nodeModuleCount.get(nodeId) ?? 0) + 1);
            }
          }

          // Every input node must appear exactly once
          for (const node of nodes) {
            expect(nodeModuleCount.get(node.id)).toBe(1);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Shared Generators for Property 2 & 3
// ---------------------------------------------------------------------------

function makeEdge(fromId: string, toId: string): GraphEdge {
  return {
    id: `edge-${fromId}-${toId}`,
    stableKey: `edge-${fromId}-${toId}`,
    workspace: 'ws-1',
    from_id: fromId,
    to_id: toId,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: { source: 'parser', artifact_source: 'test', producer_stage: 'test', timestamp: '2024-01-01T00:00:00Z' },
  };
}

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
    provenance: { source: 'parser', artifact_source: 'test', producer_stage: 'test', timestamp: '2024-01-01T00:00:00Z' },
  };
}

// ---------------------------------------------------------------------------
// Property 2: Coupling score bounds and threshold flagging
// ---------------------------------------------------------------------------

describe('ModuleBoundaryAnalyzer — Property 2: Coupling score bounds and threshold flagging', () => {
  const analyzer = new ModuleBoundaryAnalyzer();

  /**
   * **Validates: Requirements 1.2, 1.4**
   *
   * Generate nodes in 2 modules with cross-module and internal edges.
   * Assert coupling scores are in [0, 1] and flagging is correct.
   */
  it('coupling score is in [0, 1] and flagging occurs iff score > 0.7', () => {
    // Generator: produce nodes in two modules with a mix of cross-module and internal edges
    const arbCouplingScenario = fc
      .record({
        moduleACount: fc.integer({ min: 1, max: 10 }),
        moduleBCount: fc.integer({ min: 1, max: 10 }),
        crossEdgeCount: fc.integer({ min: 0, max: 15 }),
        internalAEdgeCount: fc.integer({ min: 0, max: 10 }),
        internalBEdgeCount: fc.integer({ min: 0, max: 10 }),
      })
      .map(({ moduleACount, moduleBCount, crossEdgeCount, internalAEdgeCount, internalBEdgeCount }) => {
        // Create nodes in module A (src/core/) and module B (src/pipeline/)
        const nodesA = Array.from({ length: moduleACount }, (_, i) =>
          makeNode(`a-${i}`, 'src/core/a.ts'),
        );
        const nodesB = Array.from({ length: moduleBCount }, (_, i) =>
          makeNode(`b-${i}`, 'src/pipeline/b.ts'),
        );
        const allNodes = [...nodesA, ...nodesB];

        const edges: GraphEdge[] = [];

        // Cross-module edges (A → B)
        const maxCross = Math.min(crossEdgeCount, moduleACount * moduleBCount);
        for (let i = 0; i < maxCross; i++) {
          const fromIdx = i % moduleACount;
          const toIdx = i % moduleBCount;
          edges.push(makeEdge(`a-${fromIdx}`, `b-${toIdx}`));
        }

        // Internal edges within module A
        const maxInternalA = Math.min(internalAEdgeCount, moduleACount * (moduleACount - 1));
        for (let i = 0; i < maxInternalA; i++) {
          const fromIdx = i % moduleACount;
          const toIdx = (i + 1) % moduleACount;
          if (fromIdx !== toIdx) {
            edges.push(makeEdge(`a-${fromIdx}`, `a-${toIdx}`));
          }
        }

        // Internal edges within module B
        const maxInternalB = Math.min(internalBEdgeCount, moduleBCount * (moduleBCount - 1));
        for (let i = 0; i < maxInternalB; i++) {
          const fromIdx = i % moduleBCount;
          const toIdx = (i + 1) % moduleBCount;
          if (fromIdx !== toIdx) {
            edges.push(makeEdge(`b-${fromIdx}`, `b-${toIdx}`));
          }
        }

        return { nodes: allNodes, edges };
      });

    fc.assert(
      fc.property(arbCouplingScenario, ({ nodes, edges }) => {
        const result = analyzer.analyze(nodes, edges, []);

        // Assert all coupling scores are in [0, 1]
        for (const pair of result.couplingPairs) {
          expect(pair.score).toBeGreaterThanOrEqual(0);
          expect(pair.score).toBeLessThanOrEqual(1);
        }

        // Assert flagging: a pair is flagged iff score > 0.7
        const highCouplingFindings = result.findings.filter(f => f.type === 'high_coupling');
        const flaggedPairKeys = new Set(
          highCouplingFindings.map(f => [...f.affectedModules].sort().join('|')),
        );

        for (const pair of result.couplingPairs) {
          const key = [pair.moduleA, pair.moduleB].sort().join('|');
          if (pair.score > 0.7) {
            expect(flaggedPairKeys.has(key)).toBe(true);
          } else {
            expect(flaggedPairKeys.has(key)).toBe(false);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Cohesion score bounds and threshold flagging
// ---------------------------------------------------------------------------

describe('ModuleBoundaryAnalyzer — Property 3: Cohesion score bounds and threshold flagging', () => {
  const analyzer = new ModuleBoundaryAnalyzer();

  /**
   * **Validates: Requirements 1.3, 1.5**
   *
   * Generate modules with ≥2 nodes and communities with random cohesion values.
   * Assert cohesion scores are in [0, 1] and flagging is correct.
   */
  it('cohesion score is in [0, 1] and flagging occurs iff score < 0.3', () => {
    // Generator: produce nodes in a module with a community that has a random cohesion value
    const arbCohesionScenario = fc
      .record({
        nodeCount: fc.integer({ min: 2, max: 15 }),
        cohesionValue: fc.double({ min: 0, max: 1, noNaN: true }),
        internalEdgeCount: fc.integer({ min: 0, max: 10 }),
      })
      .map(({ nodeCount, cohesionValue, internalEdgeCount }) => {
        // Create nodes in a single module (src/core/)
        const nodes = Array.from({ length: nodeCount }, (_, i) =>
          makeNode(`c-${i}`, 'src/core/module.ts'),
        );

        // Create internal edges
        const edges: GraphEdge[] = [];
        const maxInternal = Math.min(internalEdgeCount, nodeCount * (nodeCount - 1));
        for (let i = 0; i < maxInternal; i++) {
          const fromIdx = i % nodeCount;
          const toIdx = (i + 1) % nodeCount;
          if (fromIdx !== toIdx) {
            edges.push(makeEdge(`c-${fromIdx}`, `c-${toIdx}`));
          }
        }

        // Create a community that overlaps with this module
        const community: Community = {
          id: 'community-0',
          label: 'core:function',
          nodeIds: nodes.map(n => n.id),
          cohesion: Number(cohesionValue.toFixed(3)),
          couplingWarnings: [],
        };

        return { nodes, edges, communities: [community], expectedCohesion: community.cohesion };
      });

    fc.assert(
      fc.property(arbCohesionScenario, ({ nodes, edges, communities, expectedCohesion }) => {
        const result = analyzer.analyze(nodes, edges, communities);

        // Assert all cohesion scores are in [0, 1]
        for (const entry of result.cohesionScores) {
          expect(entry.score).toBeGreaterThanOrEqual(0);
          expect(entry.score).toBeLessThanOrEqual(1);
        }

        // Assert flagging: a module is flagged iff score < 0.3
        const lowCohesionFindings = result.findings.filter(f => f.type === 'low_cohesion');
        const flaggedModuleIds = new Set(
          lowCohesionFindings.flatMap(f => f.affectedModules),
        );

        for (const entry of result.cohesionScores) {
          if (entry.score < 0.3) {
            expect(flaggedModuleIds.has(entry.moduleId)).toBe(true);
          } else {
            expect(flaggedModuleIds.has(entry.moduleId)).toBe(false);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});
