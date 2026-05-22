import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GraphDB } from '../../../storage/GraphDB.js';
import type { GraphNode, GraphEdge } from '../../../core/types.js';
import { buildDerivedGraph, mergePartialClasses, materializeContainsEdges } from '../05b_build_derived.js';

describe('E03 — Partial Class Support (buildDerivedGraph)', () => {
  let db: GraphDB;
  const WORKSPACE_ID = 'ws-partial-class-test';

  beforeEach(() => {
    db = new GraphDB(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('merges partial class fragments into a virtual_class node and creates is_partial_of edges', () => {
    // 1. Insert partial class fragments
    const fragment1: GraphNode = {
      id: 'node:frag1',
      stableKey: 'node:frag1',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'csharp_class',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      label: 'Student',
      symbol: 'Student',
      source_file: 'src/Student.cs',
      provenance: { source: 'parser', producer_stage: 'extract', artifact_source: 'src/Student.cs', timestamp: new Date().toISOString() },
      lang_meta: { isPartial: true, namespace: 'School' },
      updated_at: new Date().toISOString(),
    };

    const fragment2: GraphNode = {
      id: 'node:frag2',
      stableKey: 'node:frag2',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'csharp_class',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      label: 'Student',
      symbol: 'Student',
      source_file: 'src/Student.Extra.cs',
      provenance: { source: 'parser', producer_stage: 'extract', artifact_source: 'src/Student.Extra.cs', timestamp: new Date().toISOString() },
      lang_meta: { isPartial: true, namespace: 'School' },
      updated_at: new Date().toISOString(),
    };

    db.upsertNode(fragment1);
    db.upsertNode(fragment2);

    // Run merge
    const result = mergePartialClasses(WORKSPACE_ID, db);

    expect(result.warnings).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(2);

    const virtualNode = result.nodes[0]!;
    expect(virtualNode.type).toBe('virtual_class');
    expect(virtualNode.label).toBe('Student');
    expect(virtualNode.graph_kind).toBe('derived');
    expect(virtualNode.lang_meta?.fragmentCount).toBe(2);
    expect(virtualNode.lang_meta?.namespace).toBe('School');
    expect(virtualNode.lang_meta?.mergedFrom).toContain('node:frag1');
    expect(virtualNode.lang_meta?.mergedFrom).toContain('node:frag2');

    const edges = result.edges;
    expect(edges.every(e => e.type === 'is_partial_of')).toBe(true);
    expect(edges.every(e => e.to_id === virtualNode.id)).toBe(true);
  });

  it('skips merging and warns when partial fragments reside in different first-level subdirectories (ambiguity)', () => {
    const fragment1: GraphNode = {
      id: 'node:frag1',
      stableKey: 'node:frag1',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'csharp_class',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      label: 'Student',
      symbol: 'Student',
      source_file: 'folderA/Student.cs', // first dir: folderA
      provenance: { source: 'parser', producer_stage: 'extract', artifact_source: 'folderA/Student.cs', timestamp: new Date().toISOString() },
      lang_meta: { isPartial: true },
      updated_at: new Date().toISOString(),
    };

    const fragment2: GraphNode = {
      id: 'node:frag2',
      stableKey: 'node:frag2',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'csharp_class',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      label: 'Student',
      symbol: 'Student',
      source_file: 'folderB/Student.Extra.cs', // first dir: folderB
      provenance: { source: 'parser', producer_stage: 'extract', artifact_source: 'folderB/Student.Extra.cs', timestamp: new Date().toISOString() },
      lang_meta: { isPartial: true },
      updated_at: new Date().toISOString(),
    };

    db.upsertNode(fragment1);
    db.upsertNode(fragment2);

    const result = mergePartialClasses(WORKSPACE_ID, db);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('PARTIAL_CLASS_NAMESPACE_AMBIGUOUS');
  });

  it('materializes contains edges from the merged virtual_class node to its methods', () => {
    // 1. Insert fragments + virtual_class node
    const fragment1: GraphNode = {
      id: 'node:frag1',
      stableKey: 'node:frag1',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'csharp_class',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      label: 'Student',
      symbol: 'Student',
      source_file: 'src/Student.cs',
      provenance: { source: 'parser', producer_stage: 'extract', artifact_source: 'src/Student.cs', timestamp: new Date().toISOString() },
      lang_meta: { isPartial: true },
      updated_at: new Date().toISOString(),
    };

    const virtualNode: GraphNode = {
      id: 'virtual_class:student-id',
      stableKey: 'virtual_class:student-id',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'virtual_class',
      graph_kind: 'derived',
      confidence_band: 'INFERRED',
      trust_level: 'DERIVED',
      label: 'Student',
      symbol: 'Student',
      provenance: { source: 'analysis', producer_stage: 'buildDerivedGraph', artifact_source: 'cross-file-analysis', timestamp: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    };

    // 2. Insert method node referencing Student as containingClass
    const methodNode: GraphNode = {
      id: 'node:method1',
      stableKey: 'node:method1',
      workspace: WORKSPACE_ID,
      project: 'proj-1',
      type: 'csharp_method',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      label: 'GetId',
      symbol: 'GetId',
      provenance: { source: 'parser', producer_stage: 'extract', artifact_source: 'src/Student.cs', timestamp: new Date().toISOString() },
      lang_meta: { containingClass: 'Student', sourceFile: 'src/Student.cs' },
      updated_at: new Date().toISOString(),
    };

    db.upsertNode(fragment1);
    db.upsertNode(virtualNode);
    db.upsertNode(methodNode);

    const result = materializeContainsEdges(WORKSPACE_ID, db);

    expect(result.warnings).toHaveLength(0);
    expect(result.edges).toHaveLength(1);

    const edge = result.edges[0]!;
    expect(edge.type).toBe('contains');
    expect(edge.from_id).toBe(virtualNode.id); // virtual_class resolved as parent
    expect(edge.to_id).toBe(methodNode.id);
  });
});
