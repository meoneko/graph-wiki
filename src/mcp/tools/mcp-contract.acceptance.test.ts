import { describe, expect, it } from 'vitest';
import { registerAllTools } from './index.js';
import { clearRegisteredToolsForTest, getRegisteredTools, invokeTool, registerTool } from './runtime.js';
import { okResult, toolError } from './results.js';
import { buildImpactReport } from '../../pipeline/impactReport.js';

const extensionRequiredTools = [
  'list_workspaces',
  'build_graph',
  'run_postprocess',
  'get_minimal_context',
  'list_flows',
  'get_flow',
  'list_communities',
  'get_community',
  'get_affected_flows',
  'get_lineage',
  'detect_changes',
];

function assertToolResultShape(result: unknown): void {
  const value = result as Record<string, unknown>;
  for (const key of ['status', 'data', 'reasoning', 'confidence', 'provenance', 'warnings', 'codes']) {
    expect(Object.prototype.hasOwnProperty.call(value, key)).toBe(true);
  }
  expect(typeof value.status).toBe('string');
  expect(typeof value.data).toBe('object');
  expect(Array.isArray(value.warnings)).toBe(true);
  expect(Array.isArray(value.codes)).toBe(true);
}

describe('MCP extension contract', () => {
  it('registers unique tool names and exposes every tool used by the extension', () => {
    clearRegisteredToolsForTest();
    registerAllTools();
    const names = getRegisteredTools().map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of extensionRequiredTools) expect(names).toContain(tool);
  });

  it('fails fast on duplicate tool registration', () => {
    clearRegisteredToolsForTest();
    const tool = {
      name: 'duplicate_test',
      description: 'duplicate test',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => okResult({ ok: true }),
    };
    registerTool(tool);
    expect(() => registerTool(tool)).toThrow(/Duplicate MCP tool registration: duplicate_test/);
  });

  it('shared result helpers always return the required response envelope', () => {
    assertToolResultShape(okResult({ ok: true }, ['done']));
    assertToolResultShape(toolError('failed'));
  });

  it('detect_changes with empty diff returns standard envelope with data.stats', async () => {
    clearRegisteredToolsForTest();
    registerAllTools();
    const result = await invokeTool('detect_changes', { diff: '', workspaceId: 'contract-ws' });
    assertToolResultShape(result);
    const data = (result as { data: Record<string, unknown> }).data;
    expect(data).toHaveProperty('stats');
    const stats = data.stats as Record<string, unknown>;
    for (const key of ['nodes', 'edges', 'flows', 'communities', 'entrypoints']) {
      expect(typeof stats[key]).toBe('number');
    }
    expect(data).toHaveProperty('changedNodes');
    expect(data).toHaveProperty('affectedNodes');
    expect(data).toHaveProperty('affectedFlows');
  });

  it('buildImpactReport returns a valid QueryResult shape', async () => {
    const report = await buildImpactReport([], 'contract-ws');
    assertToolResultShape(report);
    expect(typeof report.status).toBe('string');
    expect(Array.isArray(report.data.nodes)).toBe(true);
    expect(Array.isArray(report.data.edges)).toBe(true);
  });

  it('extension-facing no-target flow query returns a standard insufficient-evidence envelope', async () => {
    clearRegisteredToolsForTest();
    registerAllTools();
    const result = await invokeTool('get_affected_flows', { workspaceId: 'contract-ws' });
    assertToolResultShape(result);
    expect((result as { status: string }).status).toBe('INSUFFICIENT_EVIDENCE');
    expect((result as { data: { flows: unknown[] } }).data.flows).toEqual([]);
    expect((result as { codes: string[] }).codes).toContain('NO_TARGETS');
  });
});
