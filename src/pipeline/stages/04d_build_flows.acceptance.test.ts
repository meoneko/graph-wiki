import { describe, expect, it } from 'vitest';
import { buildFlowGraph } from './04d_build_flows.js';
import type { GraphEdge, GraphNode, Provenance } from '../../core/types.js';

const provenance: Provenance = {
  source: 'parser',
  artifact_source: 'fixture',
  producer_stage: 'test',
  timestamp: '2026-05-12T00:00:00.000Z',
};

function node(id: string, sourceFile: string): GraphNode {
  return {
    id,
    workspace: 'ws',
    project: 'p',
    type: 'ts_function',
    label: id,
    source_file: sourceFile,
    symbol: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

function edge(id: string, fromId: string, toId: string): GraphEdge {
  return {
    id,
    workspace: 'ws',
    from_id: fromId,
    to_id: toId,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

// Minimal stub DB that records upserts
function makeStubDb() {
  const upsertedNodes: GraphNode[] = [];
  const upsertedEdges: GraphEdge[] = [];
  return {
    upsertedNodes,
    upsertedEdges,
    upsertNode(n: GraphNode) { upsertedNodes.push(n); },
    upsertEdge(e: GraphEdge) { upsertedEdges.push(e); },
    transaction(fn: () => void) { fn(); },
  };
}

describe('buildFlowGraph', () => {
  it('creates flow_domain nodes and belongs_to_flow edges before returning', async () => {
    const nodes = [
      node('a', 'src/auth/service.ts'),
      node('b', 'src/auth/repo.ts'),
      node('c', 'src/billing/invoice.ts'),
    ];
    const edges = [edge('ab', 'a', 'b')];
    const db = makeStubDb();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await buildFlowGraph(nodes, edges, 'ws', db as any);

    // Flow nodes created
    expect(result.flowNodes.length).toBeGreaterThan(0);
    expect(result.flowNodes.every((n) => n.type === 'flow_domain')).toBe(true);

    // Membership edges created
    expect(result.flowEdges.length).toBeGreaterThan(0);
    expect(result.flowEdges.every((e) => e.type === 'belongs_to_flow')).toBe(true);

    // Flow nodes written to DB
    const flowNodeIds = new Set(result.flowNodes.map((n) => n.id));
    const persistedFlowNodes = db.upsertedNodes.filter((n) => flowNodeIds.has(n.id));
    expect(persistedFlowNodes.length).toBe(result.flowNodes.length);

    // Membership edges written to DB
    const flowEdgeIds = new Set(result.flowEdges.map((e) => e.id));
    const persistedFlowEdges = db.upsertedEdges.filter((e) => flowEdgeIds.has(e.id));
    expect(persistedFlowEdges.length).toBe(result.flowEdges.length);
  });

  it('writes derived_domain back to nodes that did not already have one', async () => {
    const nodes = [node('n1', 'src/payments/gateway.ts')];
    const db = makeStubDb();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await buildFlowGraph(nodes, [], 'ws', db as any);

    // enrichedNodes should carry derived_domain
    expect(result.enrichedNodes[0]?.metadata?.derived_domain).toBeDefined();

    // Upserted back to DB since original had no derived_domain
    const writtenBack = db.upsertedNodes.find((n) => n.id === 'n1');
    expect(writtenBack?.metadata?.derived_domain).toBeDefined();
  });

  it('does not re-upsert nodes that already have derived_domain', async () => {
    const existing = { ...node('n1', 'src/auth/service.ts'), metadata: { derived_domain: 'auth' } };
    const db = makeStubDb();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await buildFlowGraph([existing], [], 'ws', db as any);

    // Should NOT upsert n1 again since it already has derived_domain
    expect(db.upsertedNodes.some((n) => n.id === 'n1')).toBe(false);
  });
});
