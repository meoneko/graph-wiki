import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join, dirname } from 'node:path';
import { ArchitectureReportWriter } from '../ArchitectureReportWriter.js';
import type { ArchitectureReport } from '../types.js';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

import { writeFileSync, mkdirSync } from 'node:fs';

function makeReport(workspaceId = 'test-ws'): ArchitectureReport {
  return {
    workspaceId,
    generatedAt: '2025-01-01T00:00:00.000Z',
    summary: { totalFindings: 0, critical: 0, warning: 0, info: 0 },
    metrics: {
      moduleCount: 2,
      averageCoupling: 0.1,
      averageCohesion: 0.8,
      cycleCount: 0,
      deadCodeCount: 0,
      flowCount: 1,
    },
    findings: [],
    recommendations: [],
  };
}

describe('ArchitectureReportWriter', () => {
  let writer: ArchitectureReportWriter;

  beforeEach(() => {
    vi.resetAllMocks();
    writer = new ArchitectureReportWriter();
  });

  it('writes report to default path based on workspaceId', () => {
    const report = makeReport('my-workspace');
    const result = writer.write('my-workspace', report);

    const expectedPath = join('knowledge', 'reports', 'my-workspace', 'architecture.json');
    const expectedDir = dirname(expectedPath);

    expect(result).toBe(expectedPath);
    expect(mkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedPath,
      JSON.stringify(report, null, 2),
    );
  });

  it('writes report to custom output path when provided', () => {
    const report = makeReport();
    const customPath = '/tmp/custom/output/report.json';
    const result = writer.write('test-ws', report, customPath);

    expect(result).toBe(customPath);
    expect(mkdirSync).toHaveBeenCalledWith(dirname(customPath), { recursive: true });
    expect(writeFileSync).toHaveBeenCalledWith(
      customPath,
      JSON.stringify(report, null, 2),
    );
  });

  it('throws with path context when writeFileSync fails', () => {
    const report = makeReport();
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const expectedPath = join('knowledge', 'reports', 'test-ws', 'architecture.json');
    expect(() => writer.write('test-ws', report)).toThrow(
      `Failed to write architecture report to ${expectedPath}: EACCES: permission denied`,
    );
  });

  it('throws with path context when mkdirSync fails', () => {
    const report = makeReport();
    vi.mocked(mkdirSync).mockImplementation(() => {
      throw new Error('ENOSPC: no space left on device');
    });

    const expectedPath = join('knowledge', 'reports', 'test-ws', 'architecture.json');
    expect(() => writer.write('test-ws', report)).toThrow(
      `Failed to write architecture report to ${expectedPath}: ENOSPC: no space left on device`,
    );
  });

  it('handles non-Error thrown values gracefully', () => {
    const report = makeReport();
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw 'unexpected string error';
    });

    const expectedPath = join('knowledge', 'reports', 'test-ws', 'architecture.json');
    expect(() => writer.write('test-ws', report)).toThrow(
      `Failed to write architecture report to ${expectedPath}: unexpected string error`,
    );
  });
});
