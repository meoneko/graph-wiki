import { describe, expect, it } from 'vitest';
import { affectedFlows, computeFlows, minimalContext, withDerivedDomains } from './flows.js';
import type { GraphEdge, GraphNode, Provenance } from './types.js';

const provenance: Provenance = {
  source: 'parser',
  artifact_source: 'fixture',
  producer_stage: 'test',
  timestamp: '2026-05-11T00:00:00.000Z',
};

function node(id: string, source_file: string): GraphNode {
  return {
    id,
    stableKey: id,
    workspace: 'w',
    project: 'p',
    type: 'function',
    label: id,
    source_file,
    symbol: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

function edge(id: string, from_id: string, to_id: string): GraphEdge {
  return {
    id,
    stableKey: id,
    workspace: 'w',
    from_id,
    to_id,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

describe('flow domain derivation', () => {
  it('adds derived domain metadata without mutating the original node objects', () => {
    const original = node('n1', 'src/billing/service.ts');
    const [derived] = withDerivedDomains([original]);

    expect(derived).toBeDefined();
    expect(original.metadata).toBeUndefined();
    expect(derived!.metadata?.derived_domain).toBe('billing');
  });
});

describe('minimalContext', () => {
  it('returns bounded canonical context and excludes exploratory edges', () => {
    const nodes = [
      node('a', 'src/auth/a.ts'),
      node('b', 'src/auth/b.ts'),
      node('c', 'src/auth/c.ts'),
      node('d', 'src/auth/d.ts'),
    ];
    const edges: GraphEdge[] = [
      edge('ab', 'a', 'b'),
      edge('bc', 'b', 'c'),
      { ...edge('cd', 'c', 'd'), graph_kind: 'exploratory', confidence_band: 'AMBIGUOUS' },
    ];

    const result = minimalContext(nodes, edges, ['a'], 2, 50);

    expect(result.nodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c']);
    expect(result.edges.map((e) => e.id).sort()).toEqual(['ab', 'bc']);
    expect(result.trust.AUTHORITATIVE).toBe(3);
  });

  it('is bounded by cap and returns a stable contract shape', () => {
    const nodes = Array.from({ length: 20 }, (_, index) => node(`n${index}`, 'src/auth/service.ts'));
    const edges = Array.from({ length: 19 }, (_, index) => edge(`e${index}`, `n${index}`, `n${index + 1}`));

    const result = minimalContext(nodes, edges, ['n0'], 10, 5);

    expect(result.nodes.length).toBeLessThanOrEqual(5);
    expect(Array.isArray(result.edges)).toBe(true);
    expect(typeof result.omitted).toBe('number');
    expect(result.trust).toBeDefined();
  });
});

describe('affectedFlows', () => {
  it('returns touchedNodeCount and sorts descending', () => {
    const nodes = [
      node('auth1', 'src/auth/controller.ts'),
      node('auth2', 'src/auth/service.ts'),
      node('billing1', 'src/billing/service.ts'),
    ];
    const edges = [
      edge('auth-edge', 'auth1', 'auth2'),
      edge('cross-edge', 'auth2', 'billing1'),
    ];
    const flows = computeFlows(withDerivedDomains(nodes), edges);

    const result = affectedFlows(flows, nodes, ['src/auth']);

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((flow) => typeof flow.touchedNodeCount === 'number')).toBe(true);
    expect(result[0]!.touchedNodeCount).toBeGreaterThanOrEqual(result[1]?.touchedNodeCount ?? 0);
  });
});
