import { describe, it, expect } from 'vitest';
import {
  StructuralNodeTypes,
  RuntimeNodeTypes,
  DataNodeTypes,
  FrontendNodeTypes,
  SystemNodeTypes,
  ConceptualNodeTypes,
  StandardNodeTypes,
  STANDARD_NODE_TYPE_SET,
  getNodeTypeCategory,
  StructuralEdgeTypes,
  RuntimeEdgeTypes,
  EntryFlowEdgeTypes,
  ContractEdgeTypes,
  AuthorityEdgeTypes,
  DataFlowEdgeTypes,
  ExploratoryEdgeTypes,
  getEdgeCategory,
  resolveFlowType,
  getDefaultFlowType,
} from './taxonomy.js';
import { EdgeType } from './types.js';
import type { GraphEdge } from './types.js';

const baseProv = { source: 'parser' as const, artifact_source: 'f', producer_stage: 'extract', timestamp: '2026-01-01' };

function makeEdge(overrides: Partial<GraphEdge> & Pick<GraphEdge, 'type'>): GraphEdge {
  return {
    id: 'e1',
    stableKey: 'e1',
    workspace: 'w1',
    from_id: 'n1',
    to_id: 'n2',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: baseProv,
    ...overrides,
  };
}

describe('Node Type Taxonomy', () => {
  describe('Requirement 19.1 — Structural node types', () => {
    it('supports file, module, namespace, class, interface, function, method', () => {
      const expected = ['file', 'module', 'namespace', 'class', 'interface', 'function', 'method'];
      for (const t of expected) {
        expect(StructuralNodeTypes).toContain(t);
        expect(STANDARD_NODE_TYPE_SET.has(t)).toBe(true);
        expect(getNodeTypeCategory(t)).toBe('structural');
      }
    });
  });

  describe('Requirement 19.2 — Runtime node types', () => {
    it('supports entrypoint, controller_action, api_endpoint, usecase, service', () => {
      const expected = ['entrypoint', 'controller_action', 'api_endpoint', 'usecase', 'service'];
      for (const t of expected) {
        expect(RuntimeNodeTypes).toContain(t);
        expect(STANDARD_NODE_TYPE_SET.has(t)).toBe(true);
        expect(getNodeTypeCategory(t)).toBe('runtime');
      }
    });
  });

  describe('Requirement 19.3 — Data node types', () => {
    it('supports dto, model, entity, request, response', () => {
      const expected = ['dto', 'model', 'entity', 'request', 'response'];
      for (const t of expected) {
        expect(DataNodeTypes).toContain(t);
        expect(STANDARD_NODE_TYPE_SET.has(t)).toBe(true);
        expect(getNodeTypeCategory(t)).toBe('data');
      }
    });
  });

  describe('Requirement 19.4 — Frontend node types', () => {
    it('supports frontend_route, react_component, hook', () => {
      const expected = ['frontend_route', 'react_component', 'hook'];
      for (const t of expected) {
        expect(FrontendNodeTypes).toContain(t);
        expect(STANDARD_NODE_TYPE_SET.has(t)).toBe(true);
        expect(getNodeTypeCategory(t)).toBe('frontend');
      }
    });
  });

  describe('Requirement 19.5 — System node types', () => {
    it('supports external_service, queue, job', () => {
      const expected = ['external_service', 'queue', 'job'];
      for (const t of expected) {
        expect(SystemNodeTypes).toContain(t);
        expect(STANDARD_NODE_TYPE_SET.has(t)).toBe(true);
        expect(getNodeTypeCategory(t)).toBe('system');
      }
    });
  });

  describe('Requirement 19.6 — Conceptual node types', () => {
    it('supports flow, domain, cluster', () => {
      const expected = ['flow', 'domain', 'cluster'];
      for (const t of expected) {
        expect(ConceptualNodeTypes).toContain(t);
        expect(STANDARD_NODE_TYPE_SET.has(t)).toBe(true);
        expect(getNodeTypeCategory(t)).toBe('conceptual');
      }
    });
  });

  it('returns undefined for unknown node types', () => {
    expect(getNodeTypeCategory('unknown_type')).toBeUndefined();
    expect(getNodeTypeCategory('custom_widget')).toBeUndefined();
  });

  it('StandardNodeTypes contains all categories', () => {
    const allExpected = [
      ...StructuralNodeTypes,
      ...RuntimeNodeTypes,
      ...DataNodeTypes,
      ...FrontendNodeTypes,
      ...SystemNodeTypes,
      ...ConceptualNodeTypes,
    ];
    expect(StandardNodeTypes.length).toBe(allExpected.length);
    for (const t of allExpected) {
      expect(StandardNodeTypes).toContain(t);
    }
  });
});

describe('Edge Category Taxonomy', () => {
  describe('Requirement 19.7 — Edge categories', () => {
    it('structural edges: contains, imports, inherits, implements', () => {
      const expected = ['contains', 'imports', 'inherits', 'implements'];
      for (const t of expected) {
        expect(StructuralEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('structural');
      }
    });

    it('runtime edges: calls, invokes, dispatches_to, triggers', () => {
      const expected = ['calls', 'invokes', 'dispatches_to', 'triggers'];
      for (const t of expected) {
        expect(RuntimeEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('runtime');
      }
    });

    it('entry/flow edges: entry_of, precedes, belongs_to_flow', () => {
      const expected = ['entry_of', 'precedes', 'belongs_to_flow'];
      for (const t of expected) {
        expect(EntryFlowEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('entry_flow');
      }
    });

    it('contract edges: requests, returns, maps_to, binds_to', () => {
      const expected = ['requests', 'returns', 'maps_to', 'binds_to'];
      for (const t of expected) {
        expect(ContractEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('contract');
      }
    });

    it('authority edges: uses_authority, node_uses_authority, depends_on_authority', () => {
      const expected = ['uses_authority', 'node_uses_authority', 'depends_on_authority'];
      for (const t of expected) {
        expect(AuthorityEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('authority');
      }
    });

    it('data flow edges: reads, writes, transforms', () => {
      const expected = ['reads', 'writes', 'transforms'];
      for (const t of expected) {
        expect(DataFlowEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('data_flow');
      }
    });

    it('exploratory edges: likely_calls, semantic_match, inferred_contract', () => {
      const expected = ['likely_calls', 'semantic_match', 'inferred_contract'];
      for (const t of expected) {
        expect(ExploratoryEdgeTypes).toContain(t);
        expect(getEdgeCategory(t)).toBe('exploratory');
      }
    });
  });

  it('returns undefined for unknown edge types', () => {
    expect(getEdgeCategory('unknown_edge')).toBeUndefined();
    expect(getEdgeCategory('custom_link')).toBeUndefined();
  });
});

describe('Flow Type Classification', () => {
  describe('Requirement 19.8 — edges classified by flow_type', () => {
    it('runtime edges have flow_type=control', () => {
      expect(getDefaultFlowType('calls')).toBe('control');
      expect(getDefaultFlowType('invokes')).toBe('control');
      expect(getDefaultFlowType('dispatches_to')).toBe('control');
      expect(getDefaultFlowType('triggers')).toBe('control');
    });

    it('data flow edges have flow_type=data', () => {
      expect(getDefaultFlowType('reads')).toBe('data');
      expect(getDefaultFlowType('writes')).toBe('data');
      expect(getDefaultFlowType('transforms')).toBe('data');
    });

    it('contract edges have flow_type=contract', () => {
      expect(getDefaultFlowType('requests')).toBe('contract');
      expect(getDefaultFlowType('returns')).toBe('contract');
      expect(getDefaultFlowType('maps_to')).toBe('contract');
      expect(getDefaultFlowType('binds_to')).toBe('contract');
    });

    it('authority edges have flow_type=authority', () => {
      expect(getDefaultFlowType('uses_authority')).toBe('authority');
      expect(getDefaultFlowType('node_uses_authority')).toBe('authority');
      expect(getDefaultFlowType('depends_on_authority')).toBe('authority');
    });

    it('structural edges have flow_type=structural', () => {
      expect(getDefaultFlowType('contains')).toBe('structural');
      expect(getDefaultFlowType('imports')).toBe('structural');
      expect(getDefaultFlowType('inherits')).toBe('structural');
      expect(getDefaultFlowType('implements')).toBe('structural');
    });
  });

  describe('Requirement 19.9 — FLOW_TYPE_INFERRED when metadata missing', () => {
    it('returns inferred=false when flow_type is explicitly set', () => {
      const edge = makeEdge({ type: 'calls', metadata: { flow_type: 'control' } });
      const result = resolveFlowType(edge);
      expect(result.flowType).toBe('control');
      expect(result.inferred).toBe(false);
    });

    it('returns inferred=true when flow_type metadata is missing', () => {
      const edge = makeEdge({ type: 'calls' });
      const result = resolveFlowType(edge);
      expect(result.flowType).toBe('control');
      expect(result.inferred).toBe(true);
    });

    it('returns inferred=true when metadata is undefined', () => {
      const edge = makeEdge({ type: 'reads', metadata: undefined });
      const result = resolveFlowType(edge);
      expect(result.flowType).toBe('data');
      expect(result.inferred).toBe(true);
    });

    it('returns inferred=true when metadata exists but flow_type is not set', () => {
      const edge = makeEdge({ type: 'uses_authority', metadata: { fromSymbol: 'x' } });
      const result = resolveFlowType(edge);
      expect(result.flowType).toBe('authority');
      expect(result.inferred).toBe(true);
    });

    it('respects explicit flow_type even if it differs from default', () => {
      const edge = makeEdge({ type: 'calls', metadata: { flow_type: 'data' } });
      const result = resolveFlowType(edge);
      expect(result.flowType).toBe('data');
      expect(result.inferred).toBe(false);
    });

    it('handles unknown edge types with structural fallback', () => {
      const edge = makeEdge({ type: 'unknown_edge' as any });
      const result = resolveFlowType(edge);
      expect(result.flowType).toBe('structural');
      expect(result.inferred).toBe(true);
    });
  });
});
