/**
 * Property-based tests for FlowAssessor.
 *
 * Property 10: Flow assessment threshold flagging
 * For any flow, the assessor SHALL flag it as "high complexity" if and only if
 * it contains more than 10 nodes, SHALL flag it as "missing entrypoint" if and
 * only if it has no entrypoint node, AND SHALL report "cross module flow" if
 * and only if it spans more than 3 modules.
 *
 * **Validates: Requirements 4.2, 4.3, 4.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FlowAssessor } from '../analyzers/FlowAssessor.js';
import type { GraphNode, GraphEdge } from '../../../../types.js';
import type { FlowSummary } from '../../../../flows.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  sourceFile: string,
  opts?: { type?: string; metadata?: Record<string, unknown> },
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
  };
}

const MODULE_SOURCE_FILES = [
  'src/core/a.ts',
  'src/pipeline/b.ts',
  'src/storage/c.ts',
  'src/mcp/d.ts',
  'src/scanner/e.ts',
];

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Generates a flow scenario with:
 * - A random number of nodes (1-20) distributed across modules
 * - Optional entrypoint nodes
 * - A FlowSummary referencing those node IDs
 */
const arbFlowScenario = fc
  .record({
    nodeCount: fc.integer({ min: 1, max: 20 }),
    moduleCount: fc.integer({ min: 1, max: 5 }),
    hasEntrypoint: fc.boolean(),
  })
  .chain(({ nodeCount, moduleCount, hasEntrypoint }) => {
    // Generate module indices for each node (distribute across moduleCount modules)
    return fc
      .array(fc.integer({ min: 0, max: moduleCount - 1 }), {
        minLength: nodeCount,
        maxLength: nodeCount,
      })
      .map((moduleIndices) => {
        const nodes: GraphNode[] = [];

        for (let i = 0; i < nodeCount; i++) {
          const moduleIdx = moduleIndices[i]!;
          const sourceFile = MODULE_SOURCE_FILES[moduleIdx]!;

          // Make the first node an entrypoint if hasEntrypoint is true
          if (hasEntrypoint && i === 0) {
            nodes.push(
              makeNode(`node-${i}`, sourceFile, {
                type: 'api_handler',
                metadata: { is_entrypoint: true },
              }),
            );
          } else {
            nodes.push(makeNode(`node-${i}`, sourceFile));
          }
        }

        const nodeIds = nodes.map((n) => n.id);

        const flow: FlowSummary = {
          id: 'flow-1',
          name: 'test-flow',
          domain: 'test',
          nodeIds,
          edgeIds: [],
          trust: {},
        };

        // Compute expected module span
        const moduleSet = new Set<string>();
        for (const idx of moduleIndices) {
          // Derive module from source file path (same logic as FlowAssessor)
          const sourceFile = MODULE_SOURCE_FILES[idx]!;
          const parts = sourceFile.replace(/\\/g, '/').toLowerCase().split('/').filter(Boolean);
          const srcIndex = parts.lastIndexOf('src');
          if (srcIndex >= 0 && parts[srcIndex + 1]) {
            moduleSet.add(parts[srcIndex + 1]!);
          }
        }

        return {
          nodes,
          flow,
          nodeCount,
          hasEntrypoint,
          moduleSpanCount: moduleSet.size,
        };
      });
  });

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('FlowAssessor — Property 10: Flow assessment threshold flagging', () => {
  const assessor = new FlowAssessor();

  /**
   * **Validates: Requirements 4.2**
   *
   * A flow SHALL be flagged as "high complexity" if and only if it contains
   * more than 10 nodes.
   */
  it('high_complexity_flow finding exists iff nodeCount > 10', () => {
    fc.assert(
      fc.property(arbFlowScenario, ({ nodes, flow, nodeCount }) => {
        const result = assessor.assess(nodes, [], [flow]);

        const highComplexityFindings = result.findings.filter(
          (f) => f.type === 'high_complexity_flow',
        );

        if (nodeCount > 10) {
          expect(highComplexityFindings.length).toBeGreaterThanOrEqual(1);
          // Verify the finding references the correct flow
          expect(highComplexityFindings[0]!.description).toContain(flow.name);
        } else {
          expect(highComplexityFindings.length).toBe(0);
        }
      }),
      { numRuns: 300 },
    );
  });

  /**
   * **Validates: Requirements 4.3**
   *
   * A flow SHALL be flagged as "missing entrypoint" if and only if it has
   * no entrypoint node.
   */
  it('missing_entrypoint finding exists iff no node in the flow is an entrypoint', () => {
    fc.assert(
      fc.property(arbFlowScenario, ({ nodes, flow, hasEntrypoint }) => {
        const result = assessor.assess(nodes, [], [flow]);

        const missingEntrypointFindings = result.findings.filter(
          (f) => f.type === 'missing_entrypoint',
        );

        if (!hasEntrypoint) {
          expect(missingEntrypointFindings.length).toBeGreaterThanOrEqual(1);
          expect(missingEntrypointFindings[0]!.description).toContain(flow.name);
        } else {
          expect(missingEntrypointFindings.length).toBe(0);
        }
      }),
      { numRuns: 300 },
    );
  });

  /**
   * **Validates: Requirements 4.4**
   *
   * A flow SHALL report "cross module flow" if and only if it spans more
   * than 3 modules.
   */
  it('cross_module_flow finding exists iff moduleSpan > 3', () => {
    fc.assert(
      fc.property(arbFlowScenario, ({ nodes, flow, moduleSpanCount }) => {
        const result = assessor.assess(nodes, [], [flow]);

        const crossModuleFindings = result.findings.filter(
          (f) => f.type === 'cross_module_flow',
        );

        if (moduleSpanCount > 3) {
          expect(crossModuleFindings.length).toBeGreaterThanOrEqual(1);
          expect(crossModuleFindings[0]!.description).toContain(flow.name);
        } else {
          expect(crossModuleFindings.length).toBe(0);
        }
      }),
      { numRuns: 300 },
    );
  });

  /**
   * Combined property: all three threshold conditions hold simultaneously.
   */
  it('all threshold conditions hold simultaneously for any flow', () => {
    fc.assert(
      fc.property(arbFlowScenario, ({ nodes, flow, nodeCount, hasEntrypoint, moduleSpanCount }) => {
        const result = assessor.assess(nodes, [], [flow]);

        const hasHighComplexity = result.findings.some((f) => f.type === 'high_complexity_flow');
        const hasMissingEntrypoint = result.findings.some((f) => f.type === 'missing_entrypoint');
        const hasCrossModule = result.findings.some((f) => f.type === 'cross_module_flow');

        // high_complexity_flow iff nodeCount > 10
        expect(hasHighComplexity).toBe(nodeCount > 10);

        // missing_entrypoint iff no entrypoint
        expect(hasMissingEntrypoint).toBe(!hasEntrypoint);

        // cross_module_flow iff moduleSpan > 3
        expect(hasCrossModule).toBe(moduleSpanCount > 3);
      }),
      { numRuns: 300 },
    );
  });
});
