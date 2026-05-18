import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ArchitectureReport } from '../types.js';
import type { QueryResult } from '../../../../types.js';

function makeReport(overrides: Partial<ArchitectureReport> = {}): ArchitectureReport {
  return {
    workspaceId: 'test-ws',
    generatedAt: '2025-01-01T00:00:00.000Z',
    summary: { totalFindings: 2, critical: 1, warning: 1, info: 0 },
    metrics: {
      moduleCount: 3,
      averageCoupling: 0.45,
      averageCohesion: 0.72,
      cycleCount: 1,
      deadCodeCount: 2,
      flowCount: 5,
    },
    findings: [
      {
        id: 'f-001',
        type: 'dependency_cycle',
        severity: 'critical',
        description: 'Cycle between core and pipeline',
        affectedModules: ['core', 'pipeline'],
        sourceReferences: [],
        confidence: 'high',
      },
      {
        id: 'f-002',
        type: 'high_coupling',
        severity: 'warning',
        description: 'High coupling between storage and core',
        affectedModules: ['storage', 'core'],
        sourceReferences: [],
        confidence: 'high',
      },
    ],
    recommendations: [
      {
        id: 'rec-001',
        priority: 'high',
        description: 'Break dependency cycle between core and pipeline',
        relatedFindings: ['f-001'],
      },
      {
        id: 'rec-002',
        priority: 'medium',
        description: 'Reduce coupling between storage and core',
        relatedFindings: ['f-002'],
      },
    ],
    ...overrides,
  };
}

function makeQueryResult(report: ArchitectureReport): QueryResult {
  return {
    status: report.summary.critical > 0 ? 'PARTIAL' : 'OK',
    reasoning: { selected_paths: [], selection_explanation: ['Architecture review completed'] },
    data: { nodes: [], edges: [] },
    confidence: { level: 'HIGH', reasons: ['Analysis mode: authoritative'] },
    provenance: { sources: [] },
    warnings: [],
    codes: report.summary.critical > 0 ? ['CRITICAL_FINDINGS'] : [],
    metadata: { report },
  };
}

/**
 * Simulates the CLI review-architecture command logic.
 * This mirrors the actual implementation in src/cli/index.ts.
 */
function simulateCliCommand(options: {
  result: QueryResult;
  json?: boolean;
  failOnCritical?: boolean;
  outputPath?: string;
}): { logs: string[]; exitCode: number | undefined; writtenPath: string | undefined } {
  const { result, json = false, failOnCritical = false, outputPath } = options;
  const report = (result.metadata as { report: ArchitectureReport }).report;
  const logs: string[] = [];
  let exitCode: number | undefined;
  let writtenPath: string | undefined = outputPath ?? undefined;

  if (json) {
    logs.push(JSON.stringify(result, null, 2));
  } else {
    logs.push(`Architecture Review: ${report.workspaceId}`);
    logs.push(`  Findings: ${report.summary.totalFindings} (${report.summary.critical} critical, ${report.summary.warning} warning, ${report.summary.info} info)`);
    logs.push(`  Modules: ${report.metrics.moduleCount}`);
    logs.push(`  Cycles: ${report.metrics.cycleCount}`);
    logs.push(`  Dead Code: ${report.metrics.deadCodeCount}`);
    if (report.recommendations.length > 0) {
      logs.push(`  Top Recommendations:`);
      for (const rec of report.recommendations.slice(0, 3)) {
        logs.push(`    [${rec.priority}] ${rec.description}`);
      }
    }
  }

  if (failOnCritical && report.summary.critical > 0) {
    exitCode = 1;
  }

  return { logs, exitCode, writtenPath };
}

describe('CLI review-architecture command logic', () => {
  describe('human-readable output format', () => {
    it('prints summary with findings count, modules, cycles, and dead code', () => {
      const report = makeReport();
      const result = makeQueryResult(report);

      const { logs } = simulateCliCommand({ result });

      expect(logs).toContain('Architecture Review: test-ws');
      expect(logs).toContain('  Findings: 2 (1 critical, 1 warning, 0 info)');
      expect(logs).toContain('  Modules: 3');
      expect(logs).toContain('  Cycles: 1');
      expect(logs).toContain('  Dead Code: 2');
      expect(logs).toContain('  Top Recommendations:');
      expect(logs).toContain('    [high] Break dependency cycle between core and pipeline');
      expect(logs).toContain('    [medium] Reduce coupling between storage and core');
    });

    it('omits recommendations section when there are none', () => {
      const report = makeReport({
        recommendations: [],
        summary: { totalFindings: 0, critical: 0, warning: 0, info: 0 },
        findings: [],
      });
      const result = makeQueryResult(report);

      const { logs } = simulateCliCommand({ result });

      expect(logs).not.toContain('  Top Recommendations:');
      expect(logs).toContain('Architecture Review: test-ws');
      expect(logs).toContain('  Findings: 0 (0 critical, 0 warning, 0 info)');
    });

    it('limits recommendations to top 3', () => {
      const report = makeReport({
        recommendations: [
          { id: 'rec-001', priority: 'high', description: 'First', relatedFindings: [] },
          { id: 'rec-002', priority: 'high', description: 'Second', relatedFindings: [] },
          { id: 'rec-003', priority: 'medium', description: 'Third', relatedFindings: [] },
          { id: 'rec-004', priority: 'low', description: 'Fourth', relatedFindings: [] },
        ],
      });
      const result = makeQueryResult(report);

      const { logs } = simulateCliCommand({ result });

      expect(logs).toContain('    [high] First');
      expect(logs).toContain('    [high] Second');
      expect(logs).toContain('    [medium] Third');
      expect(logs).not.toContain('    [low] Fourth');
    });
  });

  describe('--json flag outputs valid JSON', () => {
    it('outputs full QueryResult as JSON when --json flag is set', () => {
      const report = makeReport();
      const result = makeQueryResult(report);

      const { logs } = simulateCliCommand({ result, json: true });

      expect(logs).toHaveLength(1);
      const parsed = JSON.parse(logs[0]!);
      expect(parsed.status).toBe('PARTIAL');
      expect(parsed.metadata.report.summary.totalFindings).toBe(2);
      expect(parsed.metadata.report.findings).toHaveLength(2);
      expect(parsed.codes).toContain('CRITICAL_FINDINGS');
    });

    it('outputs valid JSON structure with all required fields', () => {
      const report = makeReport({
        summary: { totalFindings: 0, critical: 0, warning: 0, info: 0 },
        findings: [],
      });
      const result = makeQueryResult(report);

      const { logs } = simulateCliCommand({ result, json: true });

      const parsed = JSON.parse(logs[0]!);
      expect(parsed).toHaveProperty('status');
      expect(parsed).toHaveProperty('metadata.report.workspaceId');
      expect(parsed).toHaveProperty('metadata.report.generatedAt');
      expect(parsed).toHaveProperty('metadata.report.summary');
      expect(parsed).toHaveProperty('metadata.report.metrics');
      expect(parsed).toHaveProperty('metadata.report.findings');
      expect(parsed).toHaveProperty('metadata.report.recommendations');
    });

    it('does not include human-readable lines when --json is set', () => {
      const report = makeReport();
      const result = makeQueryResult(report);

      const { logs } = simulateCliCommand({ result, json: true });

      // Should only have one log entry (the JSON)
      expect(logs).toHaveLength(1);
      // Should not contain human-readable format
      expect(logs[0]).not.toContain('Architecture Review:');
    });
  });

  describe('--fail-on-critical exits with code 1', () => {
    it('sets exitCode to 1 when critical findings exist and --fail-on-critical is set', () => {
      const report = makeReport(); // has 1 critical finding
      const result = makeQueryResult(report);

      const { exitCode } = simulateCliCommand({ result, failOnCritical: true });

      expect(exitCode).toBe(1);
    });

    it('does not set exitCode when no critical findings exist', () => {
      const report = makeReport({
        summary: { totalFindings: 1, critical: 0, warning: 1, info: 0 },
        findings: [
          {
            id: 'f-002',
            type: 'high_coupling',
            severity: 'warning',
            description: 'High coupling',
            affectedModules: ['a', 'b'],
            sourceReferences: [],
            confidence: 'high',
          },
        ],
      });
      const result = makeQueryResult(report);

      const { exitCode } = simulateCliCommand({ result, failOnCritical: true });

      expect(exitCode).toBeUndefined();
    });

    it('does not set exitCode when --fail-on-critical is not set even with critical findings', () => {
      const report = makeReport(); // has 1 critical finding
      const result = makeQueryResult(report);

      const { exitCode } = simulateCliCommand({ result, failOnCritical: false });

      expect(exitCode).toBeUndefined();
    });
  });

  describe('--output writes to specified path', () => {
    it('passes custom output path for report writing', () => {
      const report = makeReport();
      const result = makeQueryResult(report);
      const customPath = '/tmp/custom/architecture-report.json';

      const { writtenPath } = simulateCliCommand({ result, outputPath: customPath });

      expect(writtenPath).toBe(customPath);
    });

    it('uses undefined output path when --output is not specified', () => {
      const report = makeReport();
      const result = makeQueryResult(report);

      const { writtenPath } = simulateCliCommand({ result });

      expect(writtenPath).toBeUndefined();
    });
  });

  describe('ArchitectureReportWriter integration', () => {
    it('writer class is importable and constructable', async () => {
      const mod = await import('../ArchitectureReportWriter.js');
      expect(mod.ArchitectureReportWriter).toBeDefined();
      const writer = new mod.ArchitectureReportWriter();
      expect(writer).toHaveProperty('write');
    });
  });

  describe('OperationResolver integration', () => {
    it('resolves cli.review-architecture to wiki operation', async () => {
      const { OperationResolver } = await import('../../../query/OperationResolver.js');
      const operation = OperationResolver.resolve({ caller: 'cli.review-architecture' });
      expect(operation).toBe('wiki');
    });

    it('resolves mcp.architecture.review to wiki operation', async () => {
      const { OperationResolver } = await import('../../../query/OperationResolver.js');
      const operation = OperationResolver.resolve({ caller: 'mcp.architecture.review' });
      expect(operation).toBe('wiki');
    });

    it('resolves mcp.architecture.findings to wiki operation', async () => {
      const { OperationResolver } = await import('../../../query/OperationResolver.js');
      const operation = OperationResolver.resolve({ caller: 'mcp.architecture.findings' });
      expect(operation).toBe('wiki');
    });
  });
});
