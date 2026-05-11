import { describe, it, expect } from 'vitest';
import { GraphValidator } from './GraphValidator.js';
import { GovernanceValidator } from './GovernanceValidator.js';
import type { GraphNode, GraphEdge } from '../../types.js';

const parserProv = { source: 'parser', artifact_source: 'f', producer_stage: 'extract', timestamp: '2026-01-01' } as const;
const analysisProv = { source: 'analysis', artifact_source: 'f', producer_stage: 'enrich', timestamp: '2026-01-01' } as const;
const aiProv = { source: 'ai', artifact_source: 'f', producer_stage: 'enrich', timestamp: '2026-01-01' } as const;

function makeNode(overrides: Partial<GraphNode> & Pick<GraphNode, 'id' | 'graph_kind' | 'confidence_band'>): GraphNode {
  return {
    workspace: 'w1', project: 'p1', label: overrides.id, type: 'function',
    roles: [], language: 'typescript',
    trust_level: 'AUTHORITATIVE', provenance: parserProv,
    ...overrides,
  };
}

function makeEdge(overrides: Partial<GraphEdge> & Pick<GraphEdge, 'id' | 'graph_kind' | 'confidence_band' | 'type'>): GraphEdge {
  return {
    workspace: 'w1', from_id: 'n1', to_id: 'n2',
    trust_level: 'AUTHORITATIVE', provenance: parserProv,
    ...overrides,
  };
}

describe('GraphValidator acceptance', () => {

  describe('1. Canonical purity — INV-02', () => {
    it('flags node with missing graph_kind', () => {
      const node = { ...makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' }), graph_kind: undefined } as any;
      const { issues, passed } = GraphValidator.validate([node], []);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.nodeId === 'n1')).toBe(true);
    });

    it('flags non-canonical node with missing provenance', () => {
      const node = { ...makeNode({ id: 'n1', graph_kind: 'derived', confidence_band: 'EXTRACTED' }), provenance: undefined } as any;
      const { issues, passed } = GraphValidator.validate([node], []);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.nodeId === 'n1')).toBe(true);
      expect(issues.some((i) => i.code === 'DERIVED_PROVENANCE_INVALID' && i.nodeId === 'n1')).toBe(true);
    });

    it('flags canonical+AUTHORITATIVE node with analysis provenance', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', provenance: analysisProv });
      const { issues } = GraphValidator.validate([node], []);
      expect(issues.some((i) => i.code === 'CANONICAL_PROVENANCE_MISSING' && i.nodeId === 'n1')).toBe(true);
    });

    it('flags canonical node with non-parser provenance regardless of confidence band', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'EXTRACTED', provenance: aiProv });
      const { issues, passed } = GraphValidator.validate([node], []);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'CANONICAL_PROVENANCE_MISSING' && i.nodeId === 'n1')).toBe(true);
    });

    it('passes canonical+AUTHORITATIVE node with parser provenance', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', provenance: parserProv });
      const { issues } = GraphValidator.validate([node], []);
      expect(issues.filter((i) => i.code === 'CANONICAL_PROVENANCE_MISSING')).toHaveLength(0);
    });

    it('flags canonical+AUTHORITATIVE edge with analysis provenance', () => {
      const edge = makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls', provenance: analysisProv });
      const { issues } = GraphValidator.validate([], [edge]);
      expect(issues.some((i) => i.code === 'CANONICAL_PROVENANCE_MISSING' && i.edgeId === 'e1')).toBe(true);
    });

    it('passes canonical+AUTHORITATIVE edge with parser provenance', () => {
      const edge = makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls', provenance: parserProv });
      const { issues } = GraphValidator.validate([], [edge]);
      expect(issues.filter((i) => i.code === 'CANONICAL_PROVENANCE_MISSING')).toHaveLength(0);
    });
  });

  describe('2. Derived provenance — Section 3.1', () => {
    it('flags derived node with parser provenance', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'derived', confidence_band: 'EXTRACTED', provenance: parserProv });
      const { issues } = GraphValidator.validate([node], []);
      expect(issues.some((i) => i.code === 'DERIVED_PROVENANCE_INVALID' && i.nodeId === 'n1')).toBe(true);
    });

    it('passes derived node with analysis provenance', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'derived', confidence_band: 'EXTRACTED', provenance: analysisProv });
      const { issues } = GraphValidator.validate([node], []);
      expect(issues.filter((i) => i.code === 'DERIVED_PROVENANCE_INVALID')).toHaveLength(0);
    });
  });

  describe('3. Edge provenance presence — Section 3.2', () => {
    it('flags edge with missing provenance field', () => {
      const edge = { ...makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' }), provenance: undefined } as any;
      const { issues } = GraphValidator.validate([], [edge]);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.edgeId === 'e1')).toBe(true);
      expect(issues.some((i) => i.code === 'MISSING_PROVENANCE' && i.edgeId === 'e1')).toBe(true);
    });

    it('passes edge with provenance present', () => {
      const edge = makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls', provenance: parserProv });
      const { issues } = GraphValidator.validate([], [edge]);
      expect(issues.filter((i) => i.code === 'MISSING_PROVENANCE')).toHaveLength(0);
    });
  });

  describe('4. Edge type taxonomy', () => {
    it('flags edge with invalid graph_kind and confidence_band enum values', () => {
      const node1 = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const node2 = makeNode({ id: 'n2', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'n1',
        to_id: 'n2',
        graph_kind: 'bad_kind' as any,
        confidence_band: 'BAD' as any,
        type: 'calls',
      });
      const { issues, passed } = GraphValidator.validate([node1, node2], [edge]);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.edgeId === 'e1' && i.detail.includes('graph_kind'))).toBe(true);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.edgeId === 'e1' && i.detail.includes('confidence_band'))).toBe(true);
    });

    it('flags edge with missing required identity fields', () => {
      const edge = {
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        provenance: parserProv,
      } as any;
      const { issues, passed } = GraphValidator.validate([], [edge]);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.detail.includes('id'))).toBe(true);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.detail.includes('workspace'))).toBe(true);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.detail.includes('from_id'))).toBe(true);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.detail.includes('to_id'))).toBe(true);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.detail.includes('type'))).toBe(true);
    });

    it('flags edge whose endpoints do not exist', () => {
      const edge = makeEdge({ id: 'e1', from_id: 'missing-a', to_id: 'missing-b', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' });
      const { issues, passed } = GraphValidator.validate([], [edge]);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.edgeId === 'e1' && i.detail.includes('from_id'))).toBe(true);
      expect(issues.some((i) => i.code === 'INVALID_GRAPH_STATE' && i.edgeId === 'e1' && i.detail.includes('to_id'))).toBe(true);
    });

    it('flags edge with unknown type semantic_match', () => {
      const edge = makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'semantic_match' as any });
      const { issues } = GraphValidator.validate([], [edge]);
      expect(issues.some((i) => i.code === 'INVALID_EDGE_TYPE' && i.edgeId === 'e1')).toBe(true);
    });

    it('passes edge with known type calls', () => {
      const edge = makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' });
      const { issues } = GraphValidator.validate([], [edge]);
      expect(issues.filter((i) => i.code === 'INVALID_EDGE_TYPE')).toHaveLength(0);
    });
  });

  describe('5. External layer gate', () => {
    it('flags external node when external workflow disabled', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'external', confidence_band: 'AMBIGUOUS' });
      const { issues } = GraphValidator.validate([node], [], { externalWorkflowEnabled: false });
      expect(issues.some((i) => i.code === 'EXTERNAL_WORKFLOW_DISABLED' && i.nodeId === 'n1')).toBe(true);
    });

    it('flags external edge when external workflow disabled', () => {
      const edge = makeEdge({ id: 'e1', graph_kind: 'external', confidence_band: 'AMBIGUOUS', type: 'calls' });
      const { issues } = GraphValidator.validate([], [edge], { externalWorkflowEnabled: false });
      expect(issues.some((i) => i.code === 'EXTERNAL_WORKFLOW_DISABLED' && i.edgeId === 'e1')).toBe(true);
    });

    it('allows external node when external workflow enabled', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'external', confidence_band: 'AMBIGUOUS' });
      const { issues } = GraphValidator.validate([node], [], { externalWorkflowEnabled: true });
      expect(issues.filter((i) => i.code === 'EXTERNAL_WORKFLOW_DISABLED')).toHaveLength(0);
    });
  });

  describe('6. Forbidden structural patterns', () => {
    const feNode = makeNode({ id: 'fe', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'function', roles: ['framework'], lang_meta: { semantic_role: 'ui_component' } });
    const dbNode = makeNode({ id: 'db', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'class', roles: ['domain'], lang_meta: { semantic_role: 'repository' } });
    const routeNode = makeNode({ id: 'route', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'method', roles: ['entrypoint', 'http_handler'], framework: 'aspnet-mvc' });
    const serviceNode = makeNode({ id: 'svc', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'class', roles: ['domain'], lang_meta: { semantic_role: 'service' } });

    it('flags FE → DB direct call', () => {
      const edge = makeEdge({ id: 'e1', from_id: 'fe', to_id: 'db', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' });
      const { issues } = GraphValidator.validate([feNode, dbNode], [edge]);
      expect(issues.some((i) => i.code === 'FORBIDDEN_FE_DB_DIRECT')).toBe(true);
    });

    it('flags route → DB direct call (bypasses usecase)', () => {
      const edge = makeEdge({ id: 'e1', from_id: 'route', to_id: 'db', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' });
      const { issues } = GraphValidator.validate([routeNode, dbNode], [edge]);
      expect(issues.some((i) => i.code === 'FORBIDDEN_ROUTE_BYPASS_USECASE')).toBe(true);
    });

    it('flags service → DB write without authority edge', () => {
      const edge = makeEdge({ id: 'e1', from_id: 'svc', to_id: 'db', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' });
      const { issues } = GraphValidator.validate([serviceNode, dbNode], [edge]);
      expect(issues.some((i) => i.code === 'SERVICE_WRITE_WITHOUT_AUTHORITY')).toBe(true);
    });

    it('passes service → DB write when canonical authority edge exists', () => {
      const authEdge = makeEdge({ id: 'auth', from_id: 'svc', to_id: 'auth-node', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'uses_authority' });
      const writeEdge = makeEdge({ id: 'write', from_id: 'svc', to_id: 'db', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'calls' });
      const authNode = makeNode({ id: 'auth-node', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const { issues } = GraphValidator.validate([serviceNode, dbNode, authNode], [authEdge, writeEdge]);
      expect(issues.filter((i) => i.code === 'SERVICE_WRITE_WITHOUT_AUTHORITY')).toHaveLength(0);
    });
  });

  describe('7. Machine-readable codes', () => {
    it('all issue codes are non-empty uppercase strings', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', provenance: analysisProv });
      const edge = makeEdge({ id: 'e1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE', type: 'semantic_match' as any, provenance: analysisProv });
      const { issues } = GraphValidator.validate([node], [edge]);
      for (const issue of issues) {
        expect(typeof issue.code).toBe('string');
        expect(issue.code.length).toBeGreaterThan(0);
        expect(issue.code).toMatch(/^[A-Z_]+$/);
        expect(['error', 'warning']).toContain(issue.severity);
      }
    });
  });
});

describe('GovernanceValidator acceptance', () => {

  describe('1. Exploratory authority edges cannot prove governance chain', () => {
    it('flags exploratory authority edge with AUTHORITY_CHAIN_BROKEN', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const edge: GraphEdge = {
        id: 'auth-edge', workspace: 'w1', from_id: 'n1', to_id: 'n2',
        type: 'uses_authority', graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS', trust_level: 'EXPLORATORY', provenance: aiProv,
      };
      const { issues, passed } = GovernanceValidator.validate([node], [edge]);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'AUTHORITY_CHAIN_BROKEN' && i.edgeId === 'auth-edge')).toBe(true);
    });

    it('flags canonical node whose only authority edges are exploratory', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const authorityNode = makeNode({ id: 'n2', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const exploratoryAuth: GraphEdge = {
        id: 'auth-exp', workspace: 'w1', from_id: 'n1', to_id: 'n2',
        type: 'node_uses_authority', graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS', trust_level: 'EXPLORATORY', provenance: aiProv,
      };
      const { issues } = GovernanceValidator.validate([node, authorityNode], [exploratoryAuth]);
      const nodeIssue = issues.find((i) => i.code === 'AUTHORITY_CHAIN_BROKEN' && i.nodeId === 'n1');
      expect(nodeIssue).toBeDefined();
    });

    it('passes canonical node with at least one canonical authority edge', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const authorityNode = makeNode({ id: 'n2', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const canonicalAuth: GraphEdge = {
        id: 'auth-can', workspace: 'w1', from_id: 'n1', to_id: 'n2',
        type: 'uses_authority', graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', provenance: parserProv,
      };
      const { issues } = GovernanceValidator.validate([node, authorityNode], [canonicalAuth]);
      expect(issues.filter((i) => i.nodeId === 'n1')).toHaveLength(0);
    });

    it('flags authority edge with a missing endpoint', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const danglingAuth: GraphEdge = {
        id: 'auth-dangling', workspace: 'w1', from_id: 'n1', to_id: 'missing-node',
        type: 'uses_authority', graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE', provenance: parserProv,
      };

      const { issues, passed } = GovernanceValidator.validate([node], [danglingAuth]);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'AUTHORITY_CHAIN_BROKEN' && i.edgeId === 'auth-dangling')).toBe(true);
    });

    it('flags governance-required structural edge without canonical authority proof', () => {
      const source = makeNode({ id: 'svc', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const target = makeNode({ id: 'policy', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const governanceEdge = makeEdge({
        id: 'requires-auth',
        from_id: 'svc',
        to_id: 'policy',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        type: 'calls',
        metadata: { requires_authority: true },
      } as any);

      const { issues, passed } = GovernanceValidator.validate([source, target], [governanceEdge]);
      expect(passed).toBe(false);
      expect(issues.some((i) => i.code === 'AUTHORITY_CHAIN_BROKEN' && i.edgeId === 'requires-auth')).toBe(true);
    });

    it('passes governance-required structural edge with canonical authority proof', () => {
      const source = makeNode({ id: 'svc', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const target = makeNode({ id: 'policy', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const authority = makeNode({ id: 'authority', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const governanceEdge = makeEdge({
        id: 'requires-auth',
        from_id: 'svc',
        to_id: 'policy',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        type: 'calls',
        metadata: { requires_authority: true },
      } as any);
      const authorityEdge = makeEdge({
        id: 'auth-proof',
        from_id: 'svc',
        to_id: 'authority',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        type: 'uses_authority',
      });

      const { issues } = GovernanceValidator.validate([source, target, authority], [governanceEdge, authorityEdge]);
      expect(issues.filter((i) => i.code === 'AUTHORITY_CHAIN_BROKEN')).toHaveLength(0);
    });

    it('non-authority edge types are ignored by governance validator', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical', confidence_band: 'AUTHORITATIVE' });
      const callEdge: GraphEdge = {
        id: 'call', workspace: 'w1', from_id: 'n1', to_id: 'n2',
        type: 'calls', graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS', trust_level: 'EXPLORATORY', provenance: aiProv,
      };
      const { passed } = GovernanceValidator.validate([node], [callEdge]);
      expect(passed).toBe(true);
    });
  });
});
