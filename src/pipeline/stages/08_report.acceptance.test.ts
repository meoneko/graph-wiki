import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeReport } from './08_report.js';
import type { KnowledgeConfig } from '../config.js';
import type { ValidationIssue } from '../../core/graph/validation/GraphValidator.js';

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
    }, config);

    const quality = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'graph-quality.json'), 'utf-8')) as {
      issues: ValidationIssue[];
      counts: Record<'error' | 'warning', number>;
    };
    const digest = JSON.parse(readFileSync(join(root, 'reports', 'ws', 'digest.json'), 'utf-8')) as {
      graphQualityIssueCounts: Record<'error' | 'warning', number>;
    };

    expect(quality.counts.error).toBe(1);
    expect(quality.counts.warning).toBe(1);
    expect(quality.issues).toHaveLength(2);
    expect(quality.issues[0]?.suggestion).toBe('Add parser provenance.');
    expect(digest.graphQualityIssueCounts.error).toBe(1);
    expect(digest.graphQualityIssueCounts.warning).toBe(1);
  });
});
