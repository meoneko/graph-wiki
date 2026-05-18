/**
 * Property-based tests for DeadCodeClassifier.
 *
 * Property 11: Dead code classification by node type and connectivity
 * For any orphan node (no incoming cross-module edges), the classifier SHALL
 * assign "potentially_dead_code" if the node type is function, method, or usecase,
 * AND SHALL assign "unused_component" if the node type is class or service with no
 * incoming calls, invokes, or dispatches_to edges, AND SHALL assign "test_only_reachable"
 * if all incoming edges originate from test files.
 *
 * Property 12: Dead code exclusion for externally-invoked nodes
 * For any node of type entrypoint or controller_action (or matching isEntrypoint() logic),
 * the dead code detector SHALL NOT include it in findings regardless of its incoming edge count.
 *
 * Property 13: Dead code ratio threshold flagging
 * For any module where more than 20% of its nodes are classified as dead code,
 * the detector SHALL produce a "high_dead_code_ratio" finding with "warning" severity.
 *
 * **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DeadCodeClassifier } from '../analyzers/DeadCodeClassifier.js';
import type { GraphNode, GraphEdge } from '../../../../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  sourceFile: string,
  opts?: { type?: string; metadata?: Record<string, unknown>; http_method?: string },
): GraphNode {
  return {
    id,
    stableKey: id,
    workspace: 'ws-1',
    project: 'proj-1',
    type: opts?.type ?? 'function',
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
    metadata: opts?.metadata,
    http_method: opts?.http_method,
  };
}

function makeEdge(fromId: string, toId: string, type = 'calls'): GraphEdge {
  return {
    id: `edge-${fromId}-${toId}-${type}`,
    stableKey: `edge-${fromId}-${toId}-${type}`,
    workspace: 'ws-1',
    from_id: fromId,
    to_id: toId,
    type,
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

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Node types that should be classified as 'potentially_dead_code' when orphaned */
const arbDeadCodeType = fc.constantFrom('function', 'method', 'usecase');

/** Node types that should be classified as 'unused_component' when orphaned */
const arbUnusedComponentType = fc.constantFrom('class', 'service');

/** Entrypoint-like types that should be excluded from dead code */
const arbEntrypointType = fc.constantFrom(
  'api_handler',
  'route_handler',
  'controller_action',
  'api_endpoint',
  'route',
  'controller',
);

/** Test file paths */
const arbTestSourceFile = fc.constantFrom(
  'src/core/test/helper.ts',
  'src/core/foo.test.ts',
  'src/pipeline/bar.spec.ts',
);

/** Normal (non-test) source file paths */
const arbNormalSourceFile = fc.constantFrom(
  'src/core/service.ts',
  'src/pipeline/handler.ts',
  'src/storage/repo.ts',
  'src/mcp/tool.ts',
);

// ---------------------------------------------------------------------------
// Property 11: Dead code classification by node type and connectivity
// ---------------------------------------------------------------------------

describe('DeadCodeClassifier — Property 11: Dead code classification by node type and connectivity', () => {
  const classifier = new DeadCodeClassifier();

  /**
   * **Validates: Requirements 8.2**
   *
   * Orphan nodes of type function/method/usecase SHALL be classified as
   * 'potentially_dead_code'.
   */
  it('orphan function/method/usecase nodes are classified as potentially_dead_code', () => {
    fc.assert(
      fc.property(
        arbDeadCodeType,
        arbNormalSourceFile,
        fc.integer({ min: 1, max: 10 }),
        (nodeType, sourceFile, count) => {
          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];

          for (let i = 0; i < count; i++) {
            const id = `node-${i}`;
            nodes.push(makeNode(id, sourceFile, { type: nodeType }));
            orphanIds.push(id);
          }

          const result = classifier.classify(nodes, [], orphanIds);

          // Every orphan of this type should be classified as potentially_dead_code
          const deadCodeEntries = result.entries.filter(
            (e) => e.classification === 'potentially_dead_code',
          );
          expect(deadCodeEntries.length).toBe(count);

          for (const entry of deadCodeEntries) {
            expect(entry.type).toBe(nodeType);
            expect(entry.severity).toBe('warning');
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Orphan nodes of type class/service with no incoming calls/invokes/dispatches_to
   * SHALL be classified as 'unused_component'.
   */
  it('orphan class/service nodes with no relevant incoming edges are classified as unused_component', () => {
    fc.assert(
      fc.property(
        arbUnusedComponentType,
        arbNormalSourceFile,
        fc.integer({ min: 1, max: 10 }),
        (nodeType, sourceFile, count) => {
          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];

          for (let i = 0; i < count; i++) {
            const id = `node-${i}`;
            nodes.push(makeNode(id, sourceFile, { type: nodeType }));
            orphanIds.push(id);
          }

          const result = classifier.classify(nodes, [], orphanIds);

          const unusedEntries = result.entries.filter(
            (e) => e.classification === 'unused_component',
          );
          expect(unusedEntries.length).toBe(count);

          for (const entry of unusedEntries) {
            expect(entry.type).toBe(nodeType);
            expect(entry.severity).toBe('warning');
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 8.4**
   *
   * Nodes where ALL incoming edges come from test files SHALL be classified
   * as 'test_only_reachable' with 'info' severity.
   */
  it('nodes with all incoming edges from test files are classified as test_only_reachable', () => {
    fc.assert(
      fc.property(
        arbNormalSourceFile,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 4 }),
        (targetSourceFile, targetCount, testEdgeCount) => {
          const nodes: GraphNode[] = [];
          const edges: GraphEdge[] = [];
          const orphanIds: string[] = [];

          // Create target nodes (in one module)
          for (let i = 0; i < targetCount; i++) {
            const id = `target-${i}`;
            nodes.push(makeNode(id, targetSourceFile, { type: 'function' }));
            // These are orphans (no cross-module incoming from non-test)
            orphanIds.push(id);
          }

          // Create test source nodes (in test files) and edges to targets
          for (let i = 0; i < targetCount; i++) {
            for (let j = 0; j < testEdgeCount; j++) {
              const testNodeId = `test-node-${i}-${j}`;
              nodes.push(makeNode(testNodeId, `src/core/test/helper-${j}.ts`, { type: 'function' }));
              edges.push(makeEdge(testNodeId, `target-${i}`, 'calls'));
            }
          }

          const result = classifier.classify(nodes, edges, orphanIds);

          const testOnlyEntries = result.entries.filter(
            (e) => e.classification === 'test_only_reachable',
          );
          expect(testOnlyEntries.length).toBe(targetCount);

          for (const entry of testOnlyEntries) {
            expect(entry.severity).toBe('info');
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Dead code exclusion for externally-invoked nodes
// ---------------------------------------------------------------------------

describe('DeadCodeClassifier — Property 12: Dead code exclusion for externally-invoked nodes', () => {
  const classifier = new DeadCodeClassifier();

  /**
   * **Validates: Requirements 8.5**
   *
   * Entrypoint nodes (type containing 'api'/'route'/'controller', or
   * metadata.is_entrypoint=true, or http_method/http_path set) SHALL NOT
   * appear in dead code entries or findings, even when they are orphans.
   */
  it('entrypoint-type nodes are never included in dead code entries', () => {
    fc.assert(
      fc.property(
        arbEntrypointType,
        arbNormalSourceFile,
        fc.integer({ min: 1, max: 10 }),
        (nodeType, sourceFile, count) => {
          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];

          for (let i = 0; i < count; i++) {
            const id = `entry-${i}`;
            nodes.push(makeNode(id, sourceFile, { type: nodeType }));
            orphanIds.push(id);
          }

          const result = classifier.classify(nodes, [], orphanIds);

          // No entrypoint node should appear in entries
          for (const entry of result.entries) {
            expect(orphanIds).not.toContain(entry.nodeId);
          }

          // No dead_code/unused_component/test_only_reachable findings for these nodes
          const entryNodeIds = new Set(orphanIds);
          for (const finding of result.findings) {
            for (const ref of finding.sourceReferences) {
              if (ref.nodeId) {
                expect(entryNodeIds.has(ref.nodeId)).toBe(false);
              }
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 8.5**
   *
   * Nodes with metadata.is_entrypoint=true SHALL NOT appear in dead code,
   * regardless of their type.
   */
  it('nodes with metadata.is_entrypoint=true are excluded from dead code', () => {
    fc.assert(
      fc.property(
        arbDeadCodeType,
        arbNormalSourceFile,
        fc.integer({ min: 1, max: 10 }),
        (nodeType, sourceFile, count) => {
          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];

          for (let i = 0; i < count; i++) {
            const id = `meta-entry-${i}`;
            nodes.push(
              makeNode(id, sourceFile, {
                type: nodeType,
                metadata: { is_entrypoint: true },
              }),
            );
            orphanIds.push(id);
          }

          const result = classifier.classify(nodes, [], orphanIds);

          // None should appear in entries
          const entryNodeIds = new Set(orphanIds);
          for (const entry of result.entries) {
            expect(entryNodeIds.has(entry.nodeId)).toBe(false);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 8.5**
   *
   * Nodes with http_method set SHALL NOT appear in dead code.
   */
  it('nodes with http_method are excluded from dead code', () => {
    fc.assert(
      fc.property(
        arbDeadCodeType,
        arbNormalSourceFile,
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        fc.integer({ min: 1, max: 5 }),
        (nodeType, sourceFile, httpMethod, count) => {
          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];

          for (let i = 0; i < count; i++) {
            const id = `http-node-${i}`;
            nodes.push(
              makeNode(id, sourceFile, {
                type: nodeType,
                http_method: httpMethod,
              }),
            );
            orphanIds.push(id);
          }

          const result = classifier.classify(nodes, [], orphanIds);

          const entryNodeIds = new Set(orphanIds);
          for (const entry of result.entries) {
            expect(entryNodeIds.has(entry.nodeId)).toBe(false);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Dead code ratio threshold flagging
// ---------------------------------------------------------------------------

describe('DeadCodeClassifier — Property 13: Dead code ratio threshold flagging', () => {
  const classifier = new DeadCodeClassifier();

  /**
   * **Validates: Requirements 8.7**
   *
   * A module SHALL have a "high_dead_code_ratio" finding iff more than 20%
   * of its nodes are classified as dead code.
   */
  it('high_dead_code_ratio finding exists iff dead code ratio > 0.2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (totalNodes, deadNodes) => {
          // Clamp deadNodes to not exceed totalNodes
          const actualDeadNodes = Math.min(deadNodes, totalNodes);

          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];
          const moduleSourceFile = 'src/mymodule/code.ts';

          // Create dead nodes (orphan functions → will be classified as dead code)
          for (let i = 0; i < actualDeadNodes; i++) {
            const id = `dead-${i}`;
            nodes.push(makeNode(id, moduleSourceFile, { type: 'function' }));
            orphanIds.push(id);
          }

          // Create alive nodes (not orphans, have cross-module incoming edges)
          const otherModuleSourceFile = 'src/othermodule/caller.ts';
          const edges: GraphEdge[] = [];
          for (let i = 0; i < totalNodes - actualDeadNodes; i++) {
            const id = `alive-${i}`;
            nodes.push(makeNode(id, moduleSourceFile, { type: 'function' }));

            // Add a cross-module caller so this node is NOT dead
            const callerId = `caller-${i}`;
            nodes.push(makeNode(callerId, otherModuleSourceFile, { type: 'function' }));
            edges.push(makeEdge(callerId, id, 'calls'));
          }

          const result = classifier.classify(nodes, edges, orphanIds);

          // Compute expected ratio for the target module
          const expectedRatio = actualDeadNodes / totalNodes;

          // Check for high_dead_code_ratio finding
          const ratioFindings = result.findings.filter(
            (f) => f.type === 'high_dead_code_ratio',
          );

          // Find the module ratio for our target module
          const moduleRatio = result.moduleRatios.find(
            (r) => r.moduleId === 'mymodule',
          );

          if (expectedRatio > 0.2) {
            expect(ratioFindings.some((f) => f.affectedModules.includes('mymodule'))).toBe(true);
            expect(moduleRatio?.flagged).toBe(true);
            // Verify severity is warning
            const moduleFinding = ratioFindings.find((f) =>
              f.affectedModules.includes('mymodule'),
            );
            expect(moduleFinding?.severity).toBe('warning');
          } else {
            expect(ratioFindings.some((f) => f.affectedModules.includes('mymodule'))).toBe(false);
            if (moduleRatio) {
              expect(moduleRatio.flagged).toBe(false);
            }
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  /**
   * **Validates: Requirements 8.7**
   *
   * The moduleRatios array SHALL contain the correct ratio value for each module.
   */
  it('moduleRatios correctly reflects dead code proportion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        fc.integer({ min: 0, max: 15 }),
        (totalNodes, deadNodes) => {
          const actualDeadNodes = Math.min(deadNodes, totalNodes);

          const nodes: GraphNode[] = [];
          const orphanIds: string[] = [];
          const moduleSourceFile = 'src/targetmod/code.ts';

          // Dead nodes
          for (let i = 0; i < actualDeadNodes; i++) {
            const id = `dead-${i}`;
            nodes.push(makeNode(id, moduleSourceFile, { type: 'function' }));
            orphanIds.push(id);
          }

          // Alive nodes with cross-module incoming edges
          const otherModuleSourceFile = 'src/othermod/caller.ts';
          const edges: GraphEdge[] = [];
          for (let i = 0; i < totalNodes - actualDeadNodes; i++) {
            const id = `alive-${i}`;
            nodes.push(makeNode(id, moduleSourceFile, { type: 'function' }));

            const callerId = `caller-${i}`;
            nodes.push(makeNode(callerId, otherModuleSourceFile, { type: 'function' }));
            edges.push(makeEdge(callerId, id, 'calls'));
          }

          const result = classifier.classify(nodes, edges, orphanIds);

          const moduleRatio = result.moduleRatios.find(
            (r) => r.moduleId === 'targetmod',
          );

          expect(moduleRatio).toBeDefined();
          // The ratio should match dead/total for the target module
          const expectedRatio = actualDeadNodes / totalNodes;
          expect(moduleRatio!.ratio).toBeCloseTo(expectedRatio, 5);
          expect(moduleRatio!.flagged).toBe(expectedRatio > 0.2);
        },
      ),
      { numRuns: 300 },
    );
  });
});
