import { describe, expect, it } from 'vitest';
import { mapConfidenceToBand, mapEdgeFromDB, mapProvenance } from './mappers.js';
import { GraphDB } from './GraphDB.js';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../core/types.js';

const provenance: Provenance = {
  source: 'parser',
  artifact_source: 'test',
  producer_stage: 'test',
  timestamp: '2026-05-12T00:00:00.000Z',
};

function node(id: string, sourceFile: string): GraphNode {
  return {
    id,
    workspace: 'ws',
    project: 'p',
    label: id,
    type: 'ts_function',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    source_file: sourceFile,
    symbol: id,
    provenance,
  };
}

function edge(id: string, fromId: string, toId: string, workspace = 'ws'): GraphEdge {
  return {
    id,
    workspace,
    from_id: fromId,
    to_id: toId,
    type: 'canonical_dependency',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

function fact(id: string, sourceFile: string): NormalizedFact {
  return {
    fact_id: id,
    candidate_id: id,
    candidate_type: 'ts_function',
    workspaceId: 'ws',
    project: 'p',
    source_file: sourceFile,
    symbol: id,
    line_start: 1,
    line_end: 1,
    status: 'validated',
    extractor: 'ts_tree_sitter_parser',
    evidence: [{ evidence_id: `${id}:ev`, source_file: sourceFile, line_start: 1, line_end: 1, excerpt: id, role: 'source' }],
    trust_level: 'AUTHORITATIVE',
    decision_status: 'OK',
  };
}

describe('storage mapper trust safety', () => {
  it('fails closed instead of defaulting missing provenance', () => {
    expect(() => mapProvenance(null)).toThrow(/INVALID_GRAPH_STATE/);
  });

  it('fails closed instead of defaulting invalid confidence', () => {
    expect(() => mapConfidenceToBand(undefined)).toThrow(/INVALID_GRAPH_STATE/);
  });

  it('fails closed instead of defaulting missing graph_kind', () => {
    expect(() => mapEdgeFromDB({
      id: 'e1',
      workspace: 'w1',
      from_id: 'a',
      to_id: 'b',
      type: 'calls',
      confidence: 'AUTHORITATIVE',
      provenance: JSON.stringify({ source: 'parser', artifact_source: 'f', producer_stage: 'test', timestamp: 't' }),
    })).toThrow(/INVALID_GRAPH_STATE/);
  });

  it('deletes stale facts, nodes, embeddings, and connected edges for one changed source file', () => {
    const db = new GraphDB(':memory:');
    try {
      db.upsertNode(node('node:a', 'src/a.ts'));
      db.upsertNode(node('node:b', 'src/b.ts'));
      db.upsertEdge(edge('edge:ab', 'node:a', 'node:b'));
      db.upsertFact(fact('fact:a', 'src/a.ts'));
      db.upsertFact(fact('fact:b', 'src/b.ts'));
      db.upsertEmbedding('node:a', 'test', new Float32Array([1, 0]));

      db.deleteDataForSourceFile('ws', 'p', 'src/a.ts');

      expect(db.getNode('node:a')).toBeUndefined();
      expect(db.getNode('node:b')).toBeDefined();
      expect(db.getEdgesByWorkspace('ws')).toHaveLength(0);
      expect(db.getFactsByWorkspace('ws').map((f) => f.fact_id)).toEqual(['fact:b']);
      expect(db.getEmbedding('node:a')).toBeUndefined();
    } finally {
      db.close();
    }
  });

  it('clears workspace nodes even when connected edge rows have mismatched workspace metadata', () => {
    const db = new GraphDB(':memory:');
    try {
      db.upsertNode(node('node:a', 'src/a.ts'));
      db.upsertNode(node('node:b', 'src/b.ts'));
      db.upsertEdge(edge('edge:ab', 'node:a', 'node:b', 'other-ws'));

      expect(() => db.clearWorkspaceData('ws', [])).not.toThrow();
      expect(db.getNode('node:a')).toBeUndefined();
      expect(db.getNode('node:b')).toBeUndefined();
      expect(db.getEdgesByWorkspace('other-ws')).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it('deletes workspace nodes when deleteNodesByWorkspace sees mismatched edge workspace metadata', () => {
    const db = new GraphDB(':memory:');
    try {
      db.upsertNode(node('node:a', 'src/a.ts'));
      db.upsertNode(node('node:b', 'src/b.ts'));
      db.upsertEdge(edge('edge:ab', 'node:a', 'node:b', 'other-ws'));

      expect(() => db.deleteNodesByWorkspace('ws')).not.toThrow();
      expect(db.getNode('node:a')).toBeUndefined();
      expect(db.getNode('node:b')).toBeUndefined();
      expect(db.getEdgesByWorkspace('other-ws')).toHaveLength(0);
    } finally {
      db.close();
    }
  });
});
