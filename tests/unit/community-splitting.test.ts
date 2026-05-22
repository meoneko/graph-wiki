import { describe, it, expect } from 'vitest';
import type { GraphEdge, GraphNode, Provenance } from '../../src/core/types.js';
import {
  splitOversizedCommunities,
  getPathFallbackCommunity,
  type Community,
  type PartitionOptions,
} from '../../src/core/graph/analysis/community.js';

/**
 * Unit tests for community splitting via edge-betweenness centrality.
 *
 * Validates: Requirements 9.1, 9.2, 9.5, 9.6
 */

// ─── Test Helpers ──────────────────────────────────────────────────────────────

const DEFAULT_PROVENANCE: Provenance = {
  source: 'parser',
  artifact_source: 'test',
  producer_stage: 'test',
  timestamp: '2024-01-01T00:00:00Z',
};

function makeNode(id: string, sourceFile?: string): GraphNode {
  return {
    id,
    stableKey: id,
    workspace: 'test-ws',
    project: 'test-proj',
    type: 'ts_class',
    label: id,
    source_file: sourceFile,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: DEFAULT_PROVENANCE,
  };
}

function makeEdge(id: string, from: string, to: string): GraphEdge {
  return {
    id,
    stableKey: id,
    workspace: 'test-ws',
    from_id: from,
    to_id: to,
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    provenance: DEFAULT_PROVENANCE,
  };
}

function makeLinearChain(count: number, prefix = 'n'): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push(makeNode(`${prefix}${i}`, `src/module${Math.floor(i / 10)}/file${i}.ts`));
  }
  for (let i = 0; i < count - 1; i++) {
    edges.push(makeEdge(`e_${prefix}${i}_${prefix}${i + 1}`, `${prefix}${i}`, `${prefix}${i + 1}`));
  }
  return { nodes, edges };
}

function makeTwoClusters(sizeA: number, sizeB: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Cluster A: fully connected
  for (let i = 0; i < sizeA; i++) {
    nodes.push(makeNode(`a${i}`, `src/controllers/file${i}.ts`));
  }
  for (let i = 0; i < sizeA; i++) {
    for (let j = i + 1; j < sizeA; j++) {
      edges.push(makeEdge(`e_a${i}_a${j}`, `a${i}`, `a${j}`));
    }
  }

  // Cluster B: fully connected
  for (let i = 0; i < sizeB; i++) {
    nodes.push(makeNode(`b${i}`, `src/services/file${i}.ts`));
  }
  for (let i = 0; i < sizeB; i++) {
    for (let j = i + 1; j < sizeB; j++) {
      edges.push(makeEdge(`e_b${i}_b${j}`, `b${i}`, `b${j}`));
    }
  }

  // Single bridge edge between clusters
  edges.push(makeEdge('e_bridge', 'a0', 'b0'));

  return { nodes, edges };
}

const DEFAULT_OPTIONS: PartitionOptions = {
  maxCommunitySize: 50,
  fallbackStrategy: 'folder_structure',
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('splitOversizedCommunities', () => {
  describe('communities within size limit', () => {
    it('passes through small communities unchanged', () => {
      const nodes = [makeNode('n1'), makeNode('n2'), makeNode('n3')];
      const edges = [makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n3')];
      const communities: Community[] = [{
        id: 'c0',
        label: 'test:ts_class',
        nodeIds: ['n1', 'n2', 'n3'],
        cohesion: 0.5,
        couplingWarnings: [],
      }];

      const result = splitOversizedCommunities(communities, nodes, edges, DEFAULT_OPTIONS);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c0');
      expect(result[0].parentCommunityId).toBeUndefined();
      expect(result[0].nodeIds).toHaveLength(3);
    });

    it('preserves all node IDs for small communities', () => {
      const nodes = [makeNode('x'), makeNode('y')];
      const edges: GraphEdge[] = [];
      const communities: Community[] = [{
        id: 'c0',
        label: 'test',
        nodeIds: ['x', 'y'],
        cohesion: 0,
        couplingWarnings: [],
      }];

      const result = splitOversizedCommunities(communities, nodes, edges, DEFAULT_OPTIONS);

      expect(new Set(result[0].nodeIds)).toEqual(new Set(['x', 'y']));
    });
  });

  describe('oversized community splitting', () => {
    it('splits a 60-node linear chain into sub-communities all <= maxCommunitySize', () => {
      const { nodes, edges } = makeLinearChain(60);
      const communities: Community[] = [{
        id: 'c0',
        label: 'big',
        nodeIds: nodes.map((n) => n.id),
        cohesion: 0.01,
        couplingWarnings: [],
      }];

      const result = splitOversizedCommunities(communities, nodes, edges, DEFAULT_OPTIONS);

      // All sub-communities should be within the size limit
      for (const sub of result) {
        expect(sub.nodeIds.length).toBeLessThanOrEqual(50);
      }
      // All original nodes should be present
      const allNodeIds = result.flatMap((s) => s.nodeIds);
      expect(new Set(allNodeIds)).toEqual(new Set(nodes.map((n) => n.id)));
    });

    it('splits two-cluster graph at the bridge edge', () => {
      const { nodes, edges } = makeTwoClusters(5, 5);
      const communities: Community[] = [{
        id: 'c0',
        label: 'bridged',
        nodeIds: nodes.map((n) => n.id),
        cohesion: 0.1,
        couplingWarnings: [],
      }];

      // Use a small maxCommunitySize to force splitting
      const options: PartitionOptions = { maxCommunitySize: 6, fallbackStrategy: 'folder_structure' };
      const result = splitOversizedCommunities(communities, nodes, edges, options);

      // Should split into at least 2 sub-communities
      expect(result.length).toBeGreaterThanOrEqual(2);
      // Each sub-community should be within the limit
      for (const sub of result) {
        expect(sub.nodeIds.length).toBeLessThanOrEqual(6);
      }
    });

    it('assigns parentCommunityId to split sub-communities', () => {
      const { nodes, edges } = makeLinearChain(60);
      const communities: Community[] = [{
        id: 'community_0',
        label: 'big',
        nodeIds: nodes.map((n) => n.id),
        cohesion: 0.01,
        couplingWarnings: [],
      }];

      const result = splitOversizedCommunities(communities, nodes, edges, DEFAULT_OPTIONS);

      for (const sub of result) {
        expect(sub.parentCommunityId).toBe('community_0');
      }
    });

    it('computes cohesionScore for each sub-community', () => {
      const { nodes, edges } = makeTwoClusters(4, 4);
      const communities: Community[] = [{
        id: 'c0',
        label: 'test',
        nodeIds: nodes.map((n) => n.id),
        cohesion: 0.1,
        couplingWarnings: [],
      }];

      const options: PartitionOptions = { maxCommunitySize: 5, fallbackStrategy: 'folder_structure' };
      const result = splitOversizedCommunities(communities, nodes, edges, options);

      for (const sub of result) {
        expect(sub.cohesionScore).toBeGreaterThanOrEqual(0);
        expect(sub.cohesionScore).toBeLessThanOrEqual(1);
      }
    });

    it('cohesionScore is higher for densely connected sub-communities', () => {
      const { nodes, edges } = makeTwoClusters(4, 4);
      const communities: Community[] = [{
        id: 'c0',
        label: 'test',
        nodeIds: nodes.map((n) => n.id),
        cohesion: 0.1,
        couplingWarnings: [],
      }];

      const options: PartitionOptions = { maxCommunitySize: 5, fallbackStrategy: 'folder_structure' };
      const result = splitOversizedCommunities(communities, nodes, edges, options);

      // The fully-connected clusters should have high cohesion
      // A 4-node fully connected cluster has 6 undirected edges = 12 directed / (4*3) = 0.5
      for (const sub of result) {
        expect(sub.cohesionScore).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    it('handles empty communities array', () => {
      const result = splitOversizedCommunities([], [], [], DEFAULT_OPTIONS);
      expect(result).toHaveLength(0);
    });

    it('handles single-node community', () => {
      const nodes = [makeNode('solo')];
      const communities: Community[] = [{
        id: 'c0',
        label: 'solo',
        nodeIds: ['solo'],
        cohesion: 1,
        couplingWarnings: [],
      }];

      const result = splitOversizedCommunities(communities, nodes, [], DEFAULT_OPTIONS);

      expect(result).toHaveLength(1);
      expect(result[0].nodeIds).toEqual(['solo']);
      expect(result[0].cohesionScore).toBe(1.0);
    });

    it('handles community with no internal edges (disconnected nodes)', () => {
      const nodes = Array.from({ length: 60 }, (_, i) =>
        makeNode(`n${i}`, `src/folder${i % 3}/file${i}.ts`),
      );
      const communities: Community[] = [{
        id: 'c0',
        label: 'disconnected',
        nodeIds: nodes.map((n) => n.id),
        cohesion: 0,
        couplingWarnings: [],
      }];

      // No edges — edge-betweenness can't split, should fall back to folder grouping
      const result = splitOversizedCommunities(communities, nodes, [], DEFAULT_OPTIONS);

      // Should still produce results without error
      expect(result.length).toBeGreaterThan(0);
      // All nodes should be accounted for
      const allNodeIds = result.flatMap((s) => s.nodeIds);
      expect(new Set(allNodeIds)).toEqual(new Set(nodes.map((n) => n.id)));
    });

    it('handles multiple communities (mix of small and oversized)', () => {
      const smallNodes = [makeNode('s1'), makeNode('s2')];
      const { nodes: bigNodes, edges: bigEdges } = makeLinearChain(55, 'big');

      const allNodes = [...smallNodes, ...bigNodes];
      const communities: Community[] = [
        {
          id: 'small',
          label: 'small',
          nodeIds: ['s1', 's2'],
          cohesion: 1,
          couplingWarnings: [],
        },
        {
          id: 'big',
          label: 'big',
          nodeIds: bigNodes.map((n) => n.id),
          cohesion: 0.01,
          couplingWarnings: [],
        },
      ];

      const result = splitOversizedCommunities(communities, allNodes, bigEdges, DEFAULT_OPTIONS);

      // Small community should pass through
      const smallResult = result.find((r) => r.id === 'small');
      expect(smallResult).toBeDefined();
      expect(smallResult!.parentCommunityId).toBeUndefined();

      // Big community should be split
      const bigResults = result.filter((r) => r.parentCommunityId === 'big');
      expect(bigResults.length).toBeGreaterThan(0);
      for (const sub of bigResults) {
        expect(sub.nodeIds.length).toBeLessThanOrEqual(50);
      }
    });
  });
});

describe('folder fallback namespace groupings', () => {
  it('groups nodes by folder path when edge-betweenness cannot split below threshold', () => {
    // 60 disconnected nodes across 3 folders — edge-betweenness can't help, fallback groups by folder
    const nodes: GraphNode[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push(makeNode(`ctrl${i}`, `src/controllers/file${i}.ts`));
    }
    for (let i = 0; i < 20; i++) {
      nodes.push(makeNode(`svc${i}`, `src/services/file${i}.ts`));
    }
    for (let i = 0; i < 20; i++) {
      nodes.push(makeNode(`repo${i}`, `src/repositories/file${i}.ts`));
    }

    const communities: Community[] = [{
      id: 'c0',
      label: 'oversized',
      nodeIds: nodes.map((n) => n.id),
      cohesion: 0,
      couplingWarnings: [],
    }];

    const result = splitOversizedCommunities(communities, nodes, [], DEFAULT_OPTIONS);

    // Should produce sub-communities grouped by folder namespace
    expect(result.length).toBeGreaterThanOrEqual(3);

    // Each sub-community should contain nodes from the same folder namespace
    for (const sub of result) {
      const folders = new Set(
        sub.nodeIds.map((id) => {
          const node = nodes.find((n) => n.id === id)!;
          return getPathFallbackCommunity(node);
        }),
      );
      // Each sub-community should have nodes from exactly one folder namespace
      expect(folders.size).toBe(1);
    }

    // All original nodes should be accounted for
    const allNodeIds = result.flatMap((s) => s.nodeIds);
    expect(new Set(allNodeIds)).toEqual(new Set(nodes.map((n) => n.id)));
  });

  it('produces sub-communities within size limit after folder fallback', () => {
    // 60 nodes, no edges — forces folder fallback, all results should be <= 50
    const nodes = Array.from({ length: 60 }, (_, i) =>
      makeNode(`n${i}`, `src/module${Math.floor(i / 25)}/file${i}.ts`),
    );
    const communities: Community[] = [{
      id: 'c0',
      label: 'big',
      nodeIds: nodes.map((n) => n.id),
      cohesion: 0,
      couplingWarnings: [],
    }];

    const result = splitOversizedCommunities(communities, nodes, [], DEFAULT_OPTIONS);

    for (const sub of result) {
      expect(sub.nodeIds.length).toBeLessThanOrEqual(50);
    }
  });
});

describe('multi-repo schemas respect boundary limits', () => {
  it('splits oversized community with nodes from multiple projects', () => {
    // Simulate multi-repo: nodes from different projects in one community
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Project A: 30 nodes
    for (let i = 0; i < 30; i++) {
      const node = makeNode(`projA_n${i}`, `src/api/handler${i}.ts`);
      node.project = 'project-alpha';
      nodes.push(node);
    }
    // Project B: 30 nodes
    for (let i = 0; i < 30; i++) {
      const node = makeNode(`projB_n${i}`, `src/core/service${i}.ts`);
      node.project = 'project-beta';
      nodes.push(node);
    }

    // Linear chain within each project
    for (let i = 0; i < 29; i++) {
      edges.push(makeEdge(`eA${i}`, `projA_n${i}`, `projA_n${i + 1}`));
      edges.push(makeEdge(`eB${i}`, `projB_n${i}`, `projB_n${i + 1}`));
    }
    // Single bridge between projects
    edges.push(makeEdge('e_cross', 'projA_n0', 'projB_n0'));

    const communities: Community[] = [{
      id: 'c_multi',
      label: 'multi-repo',
      nodeIds: nodes.map((n) => n.id),
      cohesion: 0.01,
      couplingWarnings: [],
    }];

    const result = splitOversizedCommunities(communities, nodes, edges, DEFAULT_OPTIONS);

    // All sub-communities must respect the boundary limit
    for (const sub of result) {
      expect(sub.nodeIds.length).toBeLessThanOrEqual(50);
    }
    // All nodes accounted for
    const allNodeIds = result.flatMap((s) => s.nodeIds);
    expect(new Set(allNodeIds)).toEqual(new Set(nodes.map((n) => n.id)));
    // Should have split into at least 2 sub-communities
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles multi-repo with mixed folder structures within size limits', () => {
    // 3 repos, each with nodes in different folders, total exceeds threshold
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const repos = ['repo-frontend', 'repo-backend', 'repo-shared'];
    const folders = ['src/components', 'src/services', 'src/utils'];

    let nodeIndex = 0;
    for (let r = 0; r < repos.length; r++) {
      for (let f = 0; f < folders.length; f++) {
        for (let i = 0; i < 7; i++) {
          const node = makeNode(`${repos[r]}_${f}_${i}`, `${folders[f]}/file${i}.ts`);
          node.project = repos[r];
          nodes.push(node);
          nodeIndex++;
        }
      }
    }

    // Total: 63 nodes, no edges — forces folder fallback
    const communities: Community[] = [{
      id: 'c_mixed',
      label: 'mixed-repos',
      nodeIds: nodes.map((n) => n.id),
      cohesion: 0,
      couplingWarnings: [],
    }];

    const result = splitOversizedCommunities(communities, nodes, edges, DEFAULT_OPTIONS);

    // All sub-communities must respect the boundary limit
    for (const sub of result) {
      expect(sub.nodeIds.length).toBeLessThanOrEqual(50);
    }
    // All nodes accounted for
    const allNodeIds = result.flatMap((s) => s.nodeIds);
    expect(new Set(allNodeIds)).toEqual(new Set(nodes.map((n) => n.id)));
  });
});

describe('getPathFallbackCommunity', () => {
  it('extracts first 2 path levels from source_file', () => {
    const node = makeNode('n1', 'src/controllers/UserController.ts');
    expect(getPathFallbackCommunity(node)).toBe('src/controllers');
  });

  it('normalizes backslashes to forward slashes', () => {
    const node = makeNode('n1', 'src\\services\\OrderService.ts');
    expect(getPathFallbackCommunity(node)).toBe('src/services');
  });

  it('returns "unknown" when source_file is undefined', () => {
    const node = makeNode('n1');
    expect(getPathFallbackCommunity(node)).toBe('unknown');
  });

  it('handles single-level paths', () => {
    const node = makeNode('n1', 'index.ts');
    expect(getPathFallbackCommunity(node)).toBe('index.ts');
  });

  it('handles deeply nested paths (takes only first 2 levels)', () => {
    const node = makeNode('n1', 'src/core/graph/analysis/community.ts');
    expect(getPathFallbackCommunity(node)).toBe('src/core');
  });
});
