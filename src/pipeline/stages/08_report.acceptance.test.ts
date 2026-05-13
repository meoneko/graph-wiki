import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeReport } from './08_report.js';
import type { KnowledgeConfig } from '../config.js';
import type { ValidationIssue } from '../../core/graph/validation/GraphValidator.js';
import type { GraphEdge, GraphNode, Provenance } from '../../core/types.js';

const provenance: Provenance = {
  source: 'parser',
  artifact_source: 'test',
  producer_stage: 'test',
  timestamp: '2026-05-12T00:00:00.000Z',
};

function node(id: string, domain?: string): GraphNode {
  return {
    id,
    workspace: 'ws',
    project: 'p',
    type: 'ts_function',
    label: id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
    metadata: domain ? { derived_domain: domain } : {},
  };
}

function edge(id: string, fromId: string, toId: string): GraphEdge {
  return {
    id,
    workspace: 'ws',
    from_id: fromId,
    to_id: toId,
    type: 'canonical_dependency',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance,
  };
}

describe('writeReport graph quality output', () => {
  let root: string;
  let config: KnowledgeConfig;

  beforeEach(() => {
    root = join(tmpdir(), `crg-report-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(root, { recursive: true });
    config = {
      workspaces: [],
      projects: [],
      outputs: {
        source_root: join(root, 'sources'),
        state_root: join(root, 'state'),
        records_root: join(root, 'records'),
        wiki_root: join(root, 'wiki'),
        index_root: join(root, 'index'),
        reports_root: join(root, 'reports'),
      },
    };
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes graph-quality.json and digest severity counts', async () => {
    const graphQualityIssues: ValidationIssue[] = [
      {
        code: 'CANONICAL_PROVENANCE_MISSING',
        severity: 'error',
        nodeId: 'n1',
        detail: 'missing provenance',
        suggestion: 'Add parser provenance.',
      },
      {
        code: 'INVALID_EDGE_TYPE',
        severity: 'warning',
        edgeId: 'e1',
        detail: 'invalid edge type',
      },
    ];

    await writeReport('ws', {
      passed: false,
      nodeCount: 2,
      edgeCount: 1,
      issues: ['CANONICAL_PROVENANCE_MISSING:n1'],
      graphQualityIssues,
    }, config, {
      nodes: [node('n1', 'auth'), node('n2', 'billing'), node('n3', 'auth')],
      edges: [edge('e1', 'n1', 'n2')],
    });

    const quality = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'graph-quality.json'), 'utf-8')) as {
      issues: ValidationIssue[];
      counts: Record<'error' | 'warning', number>;
    };
    const digest = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'digest.json'), 'utf-8')) as {
      graphQualityIssueCounts: Record<'error' | 'warning', number>;
      graphMetrics: { hotspotCount: number; bridgeCount: number; orphanCount: number; weakZoneCount: number };
    };
    const metrics = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'metrics.json'), 'utf-8')) as {
      hotspots: Array<{ nodeId: string; degree: number }>;
      bridges: Array<{ edgeId: string; fromDomain: string; toDomain: string }>;
      orphans: string[];
    };

    expect(quality.counts.error).toBe(1);
    expect(quality.counts.warning).toBe(1);
    expect(quality.issues).toHaveLength(2);
    expect(quality.issues[0]?.suggestion).toBe('Add parser provenance.');
    expect(digest.graphQualityIssueCounts.error).toBe(1);
    expect(digest.graphQualityIssueCounts.warning).toBe(1);
    expect(digest.graphMetrics.bridgeCount).toBe(1);
    expect(metrics.hotspots[0]?.nodeId).toBe('n1');
    expect(metrics.bridges[0]?.fromDomain).toBe('auth');
    expect(metrics.bridges[0]?.toDomain).toBe('billing');
    expect(metrics.orphans).toContain('n3');
  });
});
