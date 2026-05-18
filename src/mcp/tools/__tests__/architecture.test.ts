import { describe, it, expect, beforeEach } from 'vitest';
import { clearRegisteredToolsForTest, getRegisteredTools, invokeTool } from '../runtime.js';
import { registerArchitectureTools } from '../architecture.js';

describe('architecture MCP tools', () => {
  beforeEach(() => {
    clearRegisteredToolsForTest();
  });

  describe('tool registration', () => {
    it('registers architecture_review tool', () => {
      registerArchitectureTools();
      const tools = getRegisteredTools();
      const names = tools.map((t) => t.name);
      expect(names).toContain('architecture_review');
    });

    it('registers get_architecture_findings tool', () => {
      registerArchitectureTools();
      const tools = getRegisteredTools();
      const names = tools.map((t) => t.name);
      expect(names).toContain('get_architecture_findings');
    });

    it('architecture_review has correct input schema with required workspaceId', () => {
      registerArchitectureTools();
      const tool = getRegisteredTools().find((t) => t.name === 'architecture_review');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema).toMatchObject({
        type: 'object',
        properties: {
          workspaceId: { type: 'string' },
          mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
          config: { type: 'object' },
        },
        required: ['workspaceId'],
      });
    });

    it('get_architecture_findings has correct input schema with required workspaceId', () => {
      registerArchitectureTools();
      const tool = getRegisteredTools().find((t) => t.name === 'get_architecture_findings');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema).toMatchObject({
        type: 'object',
        properties: {
          workspaceId: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
          mode: { type: 'string', enum: ['authoritative', 'mixed_safe', 'exploratory'] },
        },
        required: ['workspaceId'],
      });
    });
  });

  describe('architecture_review invocation', () => {
    it('returns valid QueryResult envelope for empty workspace', async () => {
      registerArchitectureTools();
      const result = await invokeTool('architecture_review', { workspaceId: 'test-ws' });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('status');
      expect(value).toHaveProperty('data');
      expect(value).toHaveProperty('reasoning');
      expect(value).toHaveProperty('confidence');
      expect(value).toHaveProperty('provenance');
      expect(value).toHaveProperty('warnings');
      expect(value).toHaveProperty('codes');
    });

    it('returns report metadata in result', async () => {
      registerArchitectureTools();
      const result = await invokeTool('architecture_review', { workspaceId: 'test-ws' });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('metadata');
      const metadata = value.metadata as Record<string, unknown>;
      expect(metadata).toHaveProperty('report');
      const report = metadata.report as Record<string, unknown>;
      expect(report).toHaveProperty('workspaceId', 'test-ws');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('findings');
      expect(report).toHaveProperty('recommendations');
    });

    it('accepts optional mode parameter', async () => {
      registerArchitectureTools();
      const result = await invokeTool('architecture_review', {
        workspaceId: 'test-ws',
        mode: 'exploratory',
      });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('status');
    });

    it('accepts optional config parameter', async () => {
      registerArchitectureTools();
      const result = await invokeTool('architecture_review', {
        workspaceId: 'test-ws',
        config: { highCoupling: 0.8, lowCohesion: 0.2 },
      });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('status');
    });
  });

  describe('get_architecture_findings invocation', () => {
    it('returns valid QueryResult envelope', async () => {
      registerArchitectureTools();
      const result = await invokeTool('get_architecture_findings', { workspaceId: 'test-ws' });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('status');
      expect(value).toHaveProperty('data');
      expect(value).toHaveProperty('reasoning');
      expect(value).toHaveProperty('confidence');
      expect(value).toHaveProperty('provenance');
      expect(value).toHaveProperty('warnings');
      expect(value).toHaveProperty('codes');
    });

    it('accepts severity filter parameter', async () => {
      registerArchitectureTools();
      const result = await invokeTool('get_architecture_findings', {
        workspaceId: 'test-ws',
        severity: 'critical',
      });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('status');
      const metadata = value.metadata as Record<string, unknown>;
      expect(metadata).toHaveProperty('report');
      const report = metadata.report as Record<string, unknown>;
      const findings = report.findings as Array<{ severity: string }>;
      // With an empty workspace, there should be no critical findings
      for (const finding of findings) {
        expect(finding.severity).toBe('critical');
      }
    });

    it('accepts mode parameter', async () => {
      registerArchitectureTools();
      const result = await invokeTool('get_architecture_findings', {
        workspaceId: 'test-ws',
        mode: 'mixed_safe',
      });
      const value = result as Record<string, unknown>;
      expect(value).toHaveProperty('status');
    });
  });

  describe('error handling', () => {
    it('rejects missing workspaceId for architecture_review', async () => {
      registerArchitectureTools();
      await expect(invokeTool('architecture_review', {})).rejects.toThrow();
    });

    it('rejects missing workspaceId for get_architecture_findings', async () => {
      registerArchitectureTools();
      await expect(invokeTool('get_architecture_findings', {})).rejects.toThrow();
    });

    it('rejects invalid mode value for architecture_review', async () => {
      registerArchitectureTools();
      await expect(
        invokeTool('architecture_review', { workspaceId: 'test-ws', mode: 'invalid_mode' }),
      ).rejects.toThrow();
    });

    it('rejects invalid severity value for get_architecture_findings', async () => {
      registerArchitectureTools();
      await expect(
        invokeTool('get_architecture_findings', { workspaceId: 'test-ws', severity: 'invalid' }),
      ).rejects.toThrow();
    });
  });
});
