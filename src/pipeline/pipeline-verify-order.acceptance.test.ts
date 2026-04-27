import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GraphDB } from '../storage/GraphDB.js';
import { verifyGraph } from './stages/06_verify.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('pipeline verify ordering', () => {
  it('fails verification before generating wiki output', () => {
    const source = readFileSync(join(__dirname, 'run.ts'), 'utf8');
    const verifyIndex = source.indexOf('PipelineStages.verifyGraph');
    const failureIndex = source.indexOf('if (!report.passed)');
    const wikiIndex = source.indexOf('PipelineStages.generateWiki');

    expect(verifyIndex).toBeGreaterThanOrEqual(0);
    expect(failureIndex).toBeGreaterThan(verifyIndex);
    expect(wikiIndex).toBeGreaterThan(failureIndex);
  });

  it('verifyGraph fails invalid graph state with machine-readable codes', async () => {
    const db = new GraphDB(':memory:');
    const aiProv = { source: 'ai', artifact_source: 'fixture', producer_stage: 'test', timestamp: '2026-01-01T00:00:00.000Z' } as const;
    const node: any = {
      id: 'bad',
      workspace: 'verify-invalid-ws',
      project: 'test',
      label: 'Bad',
      type: 'function',
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: aiProv,
    };
    const edge: any = {
      id: 'bad-edge',
      workspace: 'verify-invalid-ws',
      from_id: 'bad',
      to_id: 'missing',
      type: 'not_in_taxonomy',
    };

    const report = await verifyGraph(
      [node],
      [edge],
      { id: 'verify-invalid-ws', projects: [], verification: {} } as any,
      db,
      {} as any,
    );

    expect(report.passed).toBe(false);
    expect(report.issues.some((issue) => issue.startsWith('CANONICAL_PROVENANCE_MISSING:bad'))).toBe(true);
    expect(report.issues.some((issue) => issue.startsWith('INVALID_EDGE_TYPE:bad-edge'))).toBe(true);
    expect(report.issues.some((issue) => issue.startsWith('INVALID_GRAPH_STATE:bad-edge'))).toBe(true);
  });
});
