import { describe, expect, it } from 'vitest';
import { computeFlowCriticality, getAffectedFlows } from '../flows.js';
import type { GraphEdge, GraphNode } from '../../../types.js';
import type { FlowSummary } from '../../../flows.js';

const provenance = {
  source: 'parser' as const,
  artifact_source: 'fixture',
  producer_stage: 'test',
  timestamp: '2026-01-01T00:00:00.000Z',
};

function makeNode(id: string, type: string): GraphNode {
  return {
    id,
    stableKey: id,
    workspace: 'w',
    project: 'p',
    type,
    label: id,
    source_file: `src/${id}.ts`,
    symbol: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

function makeFlow(id: string, nodeIds: string[]): FlowSummary {
  return {
    id,
    name: `${id} flow`,
    domain: 'test',
    nodeIds,
    edgeIds: [],
    trust: {},
  };
}

describe('computeFlowCriticality', () => {
  describe('node weight matrix', () => {
    it('assigns weight 10 to controller_action nodes', () => {
      const nodes = [makeNode('ctrl', 'controller_action')];
      const flow = makeFlow('f1', ['ctrl']);
      const result = computeFlowCriticality(flow, nodes);
      // Single node: normalization factor = (1 + log2(1)) / 1 = 1
      expect(result.score).toBe(10);
    });

    it('assigns weight 10 to webhook nodes', () => {
      const nodes = [makeNode('wh', 'webhook')];
      const flow = makeFlow('f1', ['wh']);
      const result = computeFlowCriticality(flow, nodes);
      expect(result.score).toBe(10);
    });

    it('assigns weight 8 to db_entity nodes', () => {
      const nodes = [makeNode('db', 'db_entity')];
      const flow = makeFlow('f1', ['db']);
      const result = computeFlowCriticality(flow, nodes);
      expect(result.score).toBe(8);
    });

    it('assigns weight 8 to external_service nodes', () => {
      const nodes = [makeNode('ext', 'external_service')];
      const flow = makeFlow('f1', ['ext']);
      const result = computeFlowCriticality(flow, nodes);
      expect(result.score).toBe(8);
    });

    it('assigns weight 2 to service/helper/utility nodes', () => {
      const nodes = [makeNode('svc', 'service')];
      const flow = makeFlow('f1', ['svc']);
      const result = computeFlowCriticality(flow, nodes);
      expect(result.score).toBe(2);
    });

    it('assigns weight 0 to unknown node types', () => {
      const nodes = [makeNode('unknown', 'some_random_type')];
      const flow = makeFlow('f1', ['unknown']);
      const result = computeFlowCriticality(flow, nodes);
      expect(result.score).toBe(0);
    });
  });

  describe('rating thresholds', () => {
    it('returns critical for score >= 40', () => {
      // 5 controller_action nodes: raw = 50, normalized = 50 * (1 + log2(5)) / 5 = 50 * 3.322 / 5 = 33.22
      // Need more weight. 4 controllers + 1 webhook + 1 db = 10+10+10+10+10+8 = 58
      // 6 nodes: normalized = 58 * (1 + log2(6)) / 6 = 58 * 3.585 / 6 = 34.65
      // Let's use 5 controllers + 5 webhooks = 100 raw, 10 nodes
      // normalized = 100 * (1 + log2(10)) / 10 = 100 * 4.322 / 10 = 43.22
      const nodes = Array.from({ length: 10 }, (_, i) =>
        makeNode(`n${i}`, i < 5 ? 'controller_action' : 'webhook'),
      );
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.rating).toBe('critical');
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    it('returns high for score >= 25 and < 40', () => {
      // 3 controllers + 2 db_entity = 30 + 16 = 46 raw, 5 nodes
      // normalized = 46 * (1 + log2(5)) / 5 = 46 * 3.322 / 5 = 30.56
      const nodes = [
        makeNode('c1', 'controller_action'),
        makeNode('c2', 'controller_action'),
        makeNode('c3', 'controller_action'),
        makeNode('d1', 'db_entity'),
        makeNode('d2', 'db_entity'),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.rating).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.score).toBeLessThan(40);
    });

    it('returns medium for score >= 10 and < 25', () => {
      // 1 controller + 1 service = 10 + 2 = 12 raw, 2 nodes
      // normalized = 12 * (1 + log2(2)) / 2 = 12 * 2 / 2 = 12
      const nodes = [
        makeNode('c1', 'controller_action'),
        makeNode('s1', 'service'),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.rating).toBe('medium');
      expect(result.score).toBeGreaterThanOrEqual(10);
      expect(result.score).toBeLessThan(25);
    });

    it('returns low for score < 10', () => {
      // 3 services = 6 raw, 3 nodes
      // normalized = 6 * (1 + log2(3)) / 3 = 6 * 2.585 / 3 = 5.17
      const nodes = [
        makeNode('s1', 'service'),
        makeNode('s2', 'helper'),
        makeNode('s3', 'utility'),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.rating).toBe('low');
      expect(result.score).toBeLessThan(10);
    });
  });

  describe('log-scale normalization', () => {
    it('prevents score bloat on long flows with many low-weight nodes', () => {
      // 50 service nodes: raw = 100, 50 nodes
      // normalized = 100 * (1 + log2(50)) / 50 = 100 * 6.644 / 50 = 13.29
      // Without normalization, raw score would be 100 (critical)
      // With normalization, it's medium — preventing bloat
      const nodes = Array.from({ length: 50 }, (_, i) => makeNode(`s${i}`, 'service'));
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.score).toBeLessThan(100); // Much less than raw
      expect(result.rating).toBe('medium');
    });

    it('normalization factor is 1 for single-node flows', () => {
      const nodes = [makeNode('c1', 'controller_action')];
      const flow = makeFlow('f1', ['c1']);
      const result = computeFlowCriticality(flow, nodes);
      // (1 + log2(1)) / 1 = 1, so score = raw weight
      expect(result.score).toBe(10);
    });

    it('normalization factor increases sub-linearly with node count', () => {
      // Compare 2 nodes vs 4 nodes of same type
      const nodes2 = [makeNode('c1', 'controller_action'), makeNode('c2', 'controller_action')];
      const flow2 = makeFlow('f2', nodes2.map((n) => n.id));
      const result2 = computeFlowCriticality(flow2, nodes2);

      const nodes4 = Array.from({ length: 4 }, (_, i) => makeNode(`c${i}`, 'controller_action'));
      const flow4 = makeFlow('f4', nodes4.map((n) => n.id));
      const result4 = computeFlowCriticality(flow4, nodes4);

      // 2 nodes: 20 * (1 + 1) / 2 = 20
      // 4 nodes: 40 * (1 + 2) / 4 = 30
      // Score increases but not linearly with node count
      expect(result4.score).toBeGreaterThan(result2.score);
      expect(result4.score).toBeLessThan(result2.score * 2);
    });
  });

  describe('external endpoints collection', () => {
    it('collects external_service nodes as external endpoints', () => {
      const nodes = [
        makeNode('ext1', 'external_service'),
        makeNode('svc1', 'service'),
        makeNode('ext2', 'external_service'),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.externalEndpoints).toContain('ext1');
      expect(result.externalEndpoints).toContain('ext2');
      expect(result.externalEndpoints).not.toContain('svc1');
    });

    it('collects webhook nodes as external endpoints', () => {
      const nodes = [
        makeNode('wh1', 'webhook'),
        makeNode('ctrl1', 'controller_action'),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.externalEndpoints).toContain('wh1');
      expect(result.externalEndpoints).not.toContain('ctrl1');
    });

    it('returns empty array when no external endpoints exist', () => {
      const nodes = [makeNode('s1', 'service'), makeNode('h1', 'helper')];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.externalEndpoints).toEqual([]);
    });
  });

  describe('critical rating with DB + external services', () => {
    it('returns critical for flow with DB updates + external services', () => {
      // Scenario: a flow with multiple DB mutators and external services
      // 4 db_entity (4*8=32) + 4 external_service (4*8=32) + 2 controller_action (2*10=20) = 84 raw
      // 10 nodes: normalized = 84 * (1 + log2(10)) / 10 = 84 * 4.322 / 10 = 36.3
      // Need more weight for critical (>=40)
      // 5 db_entity (5*8=40) + 5 external_service (5*8=40) = 80 raw
      // 10 nodes: normalized = 80 * (1 + log2(10)) / 10 = 80 * 4.322 / 10 = 34.58
      // Try: 5 db_entity + 5 external_service + 2 controller_action = 40+40+20 = 100 raw
      // 12 nodes: normalized = 100 * (1 + log2(12)) / 12 = 100 * 4.585 / 12 = 38.2
      // Try: 6 db_entity + 6 external_service + 2 controller_action = 48+48+20 = 116 raw
      // 14 nodes: normalized = 116 * (1 + log2(14)) / 14 = 116 * 4.807 / 14 = 39.8
      // Try: 6 db_entity + 6 external_service + 3 controller_action = 48+48+30 = 126 raw
      // 15 nodes: normalized = 126 * (1 + log2(15)) / 15 = 126 * 4.907 / 15 = 41.2 ✓
      const nodes = [
        ...Array.from({ length: 6 }, (_, i) => makeNode(`db${i}`, 'db_entity')),
        ...Array.from({ length: 6 }, (_, i) => makeNode(`ext${i}`, 'external_service')),
        ...Array.from({ length: 3 }, (_, i) => makeNode(`ctrl${i}`, 'controller_action')),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));
      const result = computeFlowCriticality(flow, nodes);
      expect(result.rating).toBe('critical');
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.externalEndpoints.length).toBeGreaterThan(0);
    });
  });

  describe('authoritative mode (exploratory edge exclusion)', () => {
    it('excludes exploratory nodes from scoring when pre-filtered', () => {
      // In authoritative mode, the caller filters out exploratory nodes/edges
      // before passing to computeFlowCriticality. This test verifies that
      // excluding exploratory nodes changes the score.
      const canonicalNodes = [
        makeNode('ctrl1', 'controller_action'),
        makeNode('svc1', 'service'),
      ];
      const exploratoryNodes: GraphNode[] = [
        {
          ...makeNode('ext1', 'external_service'),
          graph_kind: 'exploratory',
          confidence_band: 'INFERRED',
          trust_level: 'EXPLORATORY',
        },
        {
          ...makeNode('db1', 'db_entity'),
          graph_kind: 'exploratory',
          confidence_band: 'INFERRED',
          trust_level: 'EXPLORATORY',
        },
      ];

      const allNodes = [...canonicalNodes, ...exploratoryNodes];
      const flow = makeFlow('f1', allNodes.map((n) => n.id));

      // Full scoring (mixed mode) — includes all nodes
      const fullResult = computeFlowCriticality(flow, allNodes);

      // Authoritative mode — only canonical/derived nodes (exploratory excluded)
      const authoritativeNodes = allNodes.filter((n) => n.graph_kind !== 'exploratory');
      const authResult = computeFlowCriticality(flow, authoritativeNodes);

      // Authoritative mode should produce a lower score since high-weight
      // exploratory nodes (external_service=8, db_entity=8) are excluded
      expect(authResult.score).toBeLessThan(fullResult.score);
      // Authoritative mode only sees ctrl1(10) + svc1(2) = 12 raw, 2 nodes
      // normalized = 12 * (1 + log2(2)) / 2 = 12 * 2 / 2 = 12 → medium
      expect(authResult.rating).toBe('medium');
    });

    it('exploratory edges do not contribute to flow node resolution', () => {
      // When edges are filtered for authoritative mode, flows built from
      // only canonical/derived edges will not include nodes reachable only
      // via exploratory edges. This tests the pattern used in the MCP layer.
      const canonicalNodes = [
        makeNode('ctrl1', 'controller_action'),
        makeNode('svc1', 'service'),
      ];
      const exploratoryOnlyNode: GraphNode = {
        ...makeNode('ext1', 'external_service'),
        graph_kind: 'exploratory',
        confidence_band: 'INFERRED',
        trust_level: 'EXPLORATORY',
      };

      // In authoritative mode, the flow would only contain canonical nodes
      const authoritativeFlow = makeFlow('f1', ['ctrl1', 'svc1']);
      const authResult = computeFlowCriticality(authoritativeFlow, canonicalNodes);

      // In mixed mode, the flow includes the exploratory node too
      const mixedFlow = makeFlow('f1', ['ctrl1', 'svc1', 'ext1']);
      const mixedResult = computeFlowCriticality(mixedFlow, [...canonicalNodes, exploratoryOnlyNode]);

      expect(authResult.score).toBeLessThan(mixedResult.score);
      expect(authResult.externalEndpoints).toEqual([]);
      expect(mixedResult.externalEndpoints).toContain('ext1');
    });
  });

  describe('edge cases', () => {
    it('handles empty flow (no nodes)', () => {
      const flow = makeFlow('f1', []);
      const result = computeFlowCriticality(flow, []);
      expect(result.score).toBe(0);
      expect(result.rating).toBe('low');
      expect(result.externalEndpoints).toEqual([]);
    });

    it('handles flow with node IDs not present in nodes array', () => {
      const nodes = [makeNode('n1', 'service')];
      const flow = makeFlow('f1', ['n1', 'n2', 'n3']); // n2, n3 don't exist
      const result = computeFlowCriticality(flow, nodes);
      // Only n1 is found, so score = 2 * (1 + log2(1)) / 1 = 2
      expect(result.score).toBe(2);
    });

    it('is deterministic — same input produces same output', () => {
      const nodes = [
        makeNode('c1', 'controller_action'),
        makeNode('ext1', 'external_service'),
        makeNode('s1', 'service'),
        makeNode('db1', 'db_entity'),
      ];
      const flow = makeFlow('f1', nodes.map((n) => n.id));

      const result1 = computeFlowCriticality(flow, nodes);
      const result2 = computeFlowCriticality(flow, nodes);
      const result3 = computeFlowCriticality(flow, nodes);

      expect(result1.score).toBe(result2.score);
      expect(result2.score).toBe(result3.score);
      expect(result1.rating).toBe(result2.rating);
      expect(result2.rating).toBe(result3.rating);
    });
  });
});


describe('getAffectedFlows', () => {
  function makeNodeWithFile(id: string, type: string, sourceFile: string, symbol?: string): GraphNode {
    return {
      id,
      stableKey: id,
      workspace: 'w',
      project: 'p',
      type,
      label: id,
      source_file: sourceFile,
      symbol: symbol ?? id,
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance,
    };
  }

  function makeEdge(id: string, fromId: string, toId: string): GraphEdge {
    return {
      id,
      stableKey: id,
      workspace: 'w',
      from_id: fromId,
      to_id: toId,
      type: 'calls',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance,
    };
  }

  describe('inverse index and matching', () => {
    it('matches nodes by symbol field', () => {
      const nodes = [
        makeNodeWithFile('n1', 'controller_action', 'src/controllers/OrderController.ts', 'OrderController'),
        makeNodeWithFile('n2', 'service', 'src/services/OrderService.ts', 'OrderService'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1', 'n2'])];
      const edges: GraphEdge[] = [makeEdge('e1', 'n1', 'n2')];

      const result = getAffectedFlows(['OrderController'], flows, nodes, edges);
      expect(result).toHaveLength(1);
      expect(result[0]!.flowId).toBe('f1');
      expect(result[0]!.affectedReason).toContain('OrderController');
    });

    it('matches nodes by source_file field', () => {
      const nodes = [
        makeNodeWithFile('n1', 'controller_action', 'src/controllers/Payment.cs', 'PaymentController'),
        makeNodeWithFile('n2', 'db_entity', 'src/models/Order.cs', 'OrderModel'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1', 'n2'])];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['src/controllers/Payment.cs'], flows, nodes, edges);
      expect(result).toHaveLength(1);
      expect(result[0]!.flowId).toBe('f1');
      expect(result[0]!.affectedReason).toContain('src/controllers/Payment.cs');
    });

    it('performs case-insensitive matching', () => {
      const nodes = [
        makeNodeWithFile('n1', 'service', 'src/Service.ts', 'MyService'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1'])];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['myservice'], flows, nodes, edges);
      expect(result).toHaveLength(1);
    });

    it('returns empty when no symbols match any node', () => {
      const nodes = [
        makeNodeWithFile('n1', 'service', 'src/Service.ts', 'MyService'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1'])];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['NonExistentSymbol'], flows, nodes, edges);
      expect(result).toHaveLength(0);
    });

    it('returns empty when changedSymbols is empty', () => {
      const nodes = [makeNodeWithFile('n1', 'service', 'src/a.ts', 'A')];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1'])];
      const result = getAffectedFlows([], flows, nodes, []);
      expect(result).toHaveLength(0);
    });

    it('returns empty when flows is empty', () => {
      const nodes = [makeNodeWithFile('n1', 'service', 'src/a.ts', 'A')];
      const result = getAffectedFlows(['A'], [], nodes, []);
      expect(result).toHaveLength(0);
    });
  });

  describe('flow completeness (Property 11)', () => {
    it('every flow containing at least one affected node appears in results', () => {
      const nodes = [
        makeNodeWithFile('n1', 'controller_action', 'src/ctrl.ts', 'Ctrl'),
        makeNodeWithFile('n2', 'service', 'src/svc.ts', 'Svc'),
        makeNodeWithFile('n3', 'helper', 'src/helper.ts', 'Helper'),
        makeNodeWithFile('n4', 'db_entity', 'src/db.ts', 'DB'),
      ];
      const flows: FlowSummary[] = [
        makeFlow('f1', ['n1', 'n2']),       // contains n2 (Svc)
        makeFlow('f2', ['n3', 'n4']),       // does NOT contain Svc
        makeFlow('f3', ['n2', 'n3', 'n4']), // contains n2 (Svc)
      ];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['Svc'], flows, nodes, edges);
      const flowIds = result.map((r) => r.flowId);
      expect(flowIds).toContain('f1');
      expect(flowIds).toContain('f3');
      expect(flowIds).not.toContain('f2');
    });

    it('includes flow when matched by source_file of any node in the flow', () => {
      const nodes = [
        makeNodeWithFile('n1', 'service', 'src/shared/utils.ts', 'Utils'),
        makeNodeWithFile('n2', 'controller_action', 'src/api/handler.ts', 'Handler'),
        makeNodeWithFile('n3', 'helper', 'src/shared/utils.ts', 'UtilHelper'),
      ];
      const flows: FlowSummary[] = [
        makeFlow('f1', ['n1', 'n2']),
        makeFlow('f2', ['n3']),
      ];
      const edges: GraphEdge[] = [];

      // Both n1 and n3 share the same source_file
      const result = getAffectedFlows(['src/shared/utils.ts'], flows, nodes, edges);
      const flowIds = result.map((r) => r.flowId);
      expect(flowIds).toContain('f1');
      expect(flowIds).toContain('f2');
    });
  });

  describe('criticality sorting', () => {
    it('sorts results by criticality rating (critical > high > medium > low)', () => {
      const nodes = [
        // Critical flow nodes
        ...Array.from({ length: 10 }, (_, i) =>
          makeNodeWithFile(`crit${i}`, i < 5 ? 'controller_action' : 'webhook', `src/crit${i}.ts`, `Crit${i}`),
        ),
        // Low flow nodes
        makeNodeWithFile('low1', 'helper', 'src/low.ts', 'LowHelper'),
        // Medium flow nodes
        makeNodeWithFile('med1', 'controller_action', 'src/med.ts', 'MedCtrl'),
        makeNodeWithFile('med2', 'service', 'src/med2.ts', 'MedSvc'),
      ];

      const flows: FlowSummary[] = [
        makeFlow('f-low', ['low1']),
        makeFlow('f-critical', nodes.slice(0, 10).map((n) => n.id)),
        makeFlow('f-medium', ['med1', 'med2']),
      ];
      const edges: GraphEdge[] = [];

      // Change symbols that affect all three flows
      const result = getAffectedFlows(['LowHelper', 'Crit0', 'MedCtrl'], flows, nodes, edges);

      expect(result).toHaveLength(3);
      expect(result[0]!.flowId).toBe('f-critical');
      expect(result[0]!.criticality.rating).toBe('critical');
      expect(result[1]!.flowId).toBe('f-medium');
      expect(result[1]!.criticality.rating).toBe('medium');
      expect(result[2]!.flowId).toBe('f-low');
      expect(result[2]!.criticality.rating).toBe('low');
    });

    it('sorts by score descending within same rating', () => {
      const nodes = [
        makeNodeWithFile('n1', 'controller_action', 'src/a.ts', 'A'),
        makeNodeWithFile('n2', 'service', 'src/b.ts', 'B'),
        makeNodeWithFile('n3', 'controller_action', 'src/c.ts', 'C'),
        makeNodeWithFile('n4', 'controller_action', 'src/d.ts', 'D'),
        makeNodeWithFile('n5', 'service', 'src/e.ts', 'E'),
      ];

      // f1: 1 controller (score=10, medium)
      // f2: 2 controllers + 1 service (higher score, still medium range)
      const flows: FlowSummary[] = [
        makeFlow('f1', ['n1', 'n2']),
        makeFlow('f2', ['n3', 'n4', 'n5']),
      ];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['A', 'C'], flows, nodes, edges);
      expect(result).toHaveLength(2);
      // Both should be medium, but f2 has higher score
      expect(result[0]!.criticality.score).toBeGreaterThanOrEqual(result[1]!.criticality.score);
    });
  });

  describe('affectedReason', () => {
    it('includes the modified symbol in the reason string', () => {
      const nodes = [
        makeNodeWithFile('n1', 'service', 'src/PaymentService.ts', 'PaymentService'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1'])];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['PaymentService'], flows, nodes, edges);
      expect(result[0]!.affectedReason).toBe('Direct dependency on modified symbol PaymentService');
    });

    it('includes the file path in the reason when matched by source_file', () => {
      const nodes = [
        makeNodeWithFile('n1', 'service', 'src/Payment.cs', 'PaymentSvc'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1'])];
      const edges: GraphEdge[] = [];

      const result = getAffectedFlows(['src/Payment.cs'], flows, nodes, edges);
      expect(result[0]!.affectedReason).toBe('Direct dependency on modified symbol src/Payment.cs');
    });
  });

  describe('edge cases', () => {
    it('handles multiple changed symbols affecting the same flow', () => {
      const nodes = [
        makeNodeWithFile('n1', 'controller_action', 'src/ctrl.ts', 'Ctrl'),
        makeNodeWithFile('n2', 'service', 'src/svc.ts', 'Svc'),
      ];
      const flows: FlowSummary[] = [makeFlow('f1', ['n1', 'n2'])];
      const edges: GraphEdge[] = [];

      // Both symbols are in the same flow — should only appear once
      const result = getAffectedFlows(['Ctrl', 'Svc'], flows, nodes, edges);
      expect(result).toHaveLength(1);
      expect(result[0]!.flowId).toBe('f1');
    });

    it('handles nodes with no symbol or source_file', () => {
      const node: GraphNode = {
        id: 'n1',
        stableKey: 'n1',
        workspace: 'w',
        project: 'p',
        type: 'service',
        label: 'n1',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance,
      };
      const flows: FlowSummary[] = [makeFlow('f1', ['n1'])];
      const result = getAffectedFlows(['n1'], flows, [node], []);
      // No symbol or source_file to match against
      expect(result).toHaveLength(0);
    });

    it('handles flow with node IDs not present in nodes array', () => {
      const nodes = [
        makeNodeWithFile('n1', 'service', 'src/a.ts', 'A'),
      ];
      // Flow references n1 and n2, but n2 doesn't exist in nodes
      const flows: FlowSummary[] = [makeFlow('f1', ['n1', 'n2'])];
      const result = getAffectedFlows(['A'], flows, nodes, []);
      expect(result).toHaveLength(1);
      expect(result[0]!.flowId).toBe('f1');
    });
  });
});
