/**
 * Unit tests for architecture data model validation.
 *
 * Since Finding and ArchitectureReport are TypeScript interfaces (compile-time only),
 * these tests validate a runtime helper function `buildReport` that constructs
 * a valid ArchitectureReport from a findings array, computing summary counts.
 *
 * Validates: Requirements 5.2, 5.4
 */

import { describe, it, expect } from 'vitest';
import type { Finding, ArchitectureReport, Severity, FindingType } from '../types.js';

// ---------------------------------------------------------------------------
// Helper: buildReport
// Constructs an ArchitectureReport with summary counts derived from findings.
// ---------------------------------------------------------------------------

function buildReport(findings: Finding[]): ArchitectureReport {
  const critical = findings.filter(f => f.severity === 'critical').length;
  const warning = findings.filter(f => f.severity === 'warning').length;
  const info = findings.filter(f => f.severity === 'info').length;

  return {
    workspaceId: 'test-workspace',
    generatedAt: new Date().toISOString(),
    summary: {
      totalFindings: findings.length,
      critical,
      warning,
      info,
    },
    metrics: {
      moduleCount: 0,
      averageCoupling: 0,
      averageCohesion: 0,
      cycleCount: 0,
      deadCodeCount: 0,
      flowCount: 0,
    },
    findings,
    recommendations: [],
  };
}

// ---------------------------------------------------------------------------
// Helper: createFinding
// Creates a valid Finding object with all required fields.
// ---------------------------------------------------------------------------

function createFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: overrides.id ?? 'arch-001',
    type: overrides.type ?? 'high_coupling',
    severity: overrides.severity ?? 'warning',
    description: overrides.description ?? 'Test finding description',
    affectedModules: overrides.affectedModules ?? ['moduleA'],
    sourceReferences: overrides.sourceReferences ?? [],
    confidence: overrides.confidence ?? 'high',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildReport', () => {
  it('produces summary with totalFindings equal to findings array length', () => {
    const findings = [
      createFinding({ id: 'f-1', severity: 'critical' }),
      createFinding({ id: 'f-2', severity: 'warning' }),
      createFinding({ id: 'f-3', severity: 'info' }),
    ];

    const report = buildReport(findings);

    expect(report.summary.totalFindings).toBe(findings.length);
  });

  it('produces summary where critical + warning + info equals totalFindings', () => {
    const findings = [
      createFinding({ id: 'f-1', severity: 'critical' }),
      createFinding({ id: 'f-2', severity: 'critical' }),
      createFinding({ id: 'f-3', severity: 'warning' }),
      createFinding({ id: 'f-4', severity: 'info' }),
      createFinding({ id: 'f-5', severity: 'info' }),
    ];

    const report = buildReport(findings);

    expect(report.summary.critical + report.summary.warning + report.summary.info)
      .toBe(report.summary.totalFindings);
  });

  it('counts each severity correctly', () => {
    const findings = [
      createFinding({ id: 'f-1', severity: 'critical' }),
      createFinding({ id: 'f-2', severity: 'critical' }),
      createFinding({ id: 'f-3', severity: 'warning' }),
      createFinding({ id: 'f-4', severity: 'info' }),
      createFinding({ id: 'f-5', severity: 'info' }),
      createFinding({ id: 'f-6', severity: 'info' }),
    ];

    const report = buildReport(findings);

    expect(report.summary.critical).toBe(2);
    expect(report.summary.warning).toBe(1);
    expect(report.summary.info).toBe(3);
  });

  it('handles empty findings array', () => {
    const report = buildReport([]);

    expect(report.summary.totalFindings).toBe(0);
    expect(report.summary.critical).toBe(0);
    expect(report.summary.warning).toBe(0);
    expect(report.summary.info).toBe(0);
    expect(report.findings).toEqual([]);
  });

  it('handles all-critical findings', () => {
    const findings = [
      createFinding({ id: 'f-1', severity: 'critical' }),
      createFinding({ id: 'f-2', severity: 'critical' }),
    ];

    const report = buildReport(findings);

    expect(report.summary.critical).toBe(2);
    expect(report.summary.warning).toBe(0);
    expect(report.summary.info).toBe(0);
    expect(report.summary.totalFindings).toBe(2);
  });
});

describe('Finding interface shape validation', () => {
  it('createFinding produces an object with all required fields', () => {
    const finding = createFinding();

    expect(finding).toHaveProperty('id');
    expect(finding).toHaveProperty('type');
    expect(finding).toHaveProperty('severity');
    expect(finding).toHaveProperty('description');
    expect(finding).toHaveProperty('affectedModules');
    expect(finding).toHaveProperty('sourceReferences');
    expect(finding).toHaveProperty('confidence');
  });

  it('id is a non-empty string', () => {
    const finding = createFinding({ id: 'arch-042' });
    expect(typeof finding.id).toBe('string');
    expect(finding.id.length).toBeGreaterThan(0);
  });

  it('type is a valid FindingType', () => {
    const validTypes: FindingType[] = [
      'high_coupling', 'low_cohesion', 'dependency_cycle',
      'layer_violation', 'reverse_dependency', 'high_complexity_flow',
      'missing_entrypoint', 'cross_module_flow', 'dead_branch',
      'dead_code', 'unused_component', 'test_only_reachable',
      'high_dead_code_ratio',
    ];

    for (const type of validTypes) {
      const finding = createFinding({ type });
      expect(validTypes).toContain(finding.type);
    }
  });

  it('severity is one of critical, warning, or info', () => {
    const validSeverities: Severity[] = ['critical', 'warning', 'info'];

    for (const severity of validSeverities) {
      const finding = createFinding({ severity });
      expect(validSeverities).toContain(finding.severity);
    }
  });

  it('affectedModules is an array of strings', () => {
    const finding = createFinding({ affectedModules: ['core', 'pipeline', 'storage'] });

    expect(Array.isArray(finding.affectedModules)).toBe(true);
    for (const mod of finding.affectedModules) {
      expect(typeof mod).toBe('string');
    }
  });

  it('sourceReferences is an array with optional fields', () => {
    const finding = createFinding({
      sourceReferences: [
        { file: 'src/core/index.ts', line: 42, nodeId: 'n-1', label: 'processOrder' },
        { file: 'src/pipeline/stage.ts' },
        { nodeId: 'n-2' },
      ],
    });

    expect(Array.isArray(finding.sourceReferences)).toBe(true);
    expect(finding.sourceReferences).toHaveLength(3);
    expect(finding.sourceReferences[0]).toEqual({
      file: 'src/core/index.ts',
      line: 42,
      nodeId: 'n-1',
      label: 'processOrder',
    });
  });

  it('confidence is one of high, medium, or low', () => {
    const validConfidences: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

    for (const confidence of validConfidences) {
      const finding = createFinding({ confidence });
      expect(validConfidences).toContain(finding.confidence);
    }
  });
});
