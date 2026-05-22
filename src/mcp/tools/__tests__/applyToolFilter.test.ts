import { describe, expect, it, beforeEach } from 'vitest';
import {
  applyToolFilter,
  clearRegisteredToolsForTest,
  getRegisteredTools,
  registerTool,
  type McpToolDefinition,
} from '../runtime.js';

function makeTool(name: string): McpToolDefinition {
  return {
    name,
    description: `Tool ${name}`,
    inputSchema: { type: 'object', properties: {} },
    handler: async () => ({ ok: true }),
  };
}

function registeredNames(): string[] {
  return getRegisteredTools().map((t) => t.name);
}

describe('applyToolFilter', () => {
  beforeEach(() => {
    clearRegisteredToolsForTest();
    // Register a standard set of tools: a, b, c, d, e
    for (const name of ['a', 'b', 'c', 'd', 'e']) {
      registerTool(makeTool(name));
    }
  });

  it('empty filter = no-op (all tools remain)', () => {
    applyToolFilter({});
    expect(registeredNames()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('allow with empty array = no-op (all tools remain)', () => {
    applyToolFilter({ allow: [] });
    expect(registeredNames()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('deny with empty array = no-op (all tools remain)', () => {
    applyToolFilter({ deny: [] });
    expect(registeredNames()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('allow non-empty keeps only listed tools', () => {
    applyToolFilter({ allow: ['b', 'd'] });
    expect(registeredNames()).toEqual(['b', 'd']);
  });

  it('deny non-empty removes listed tools', () => {
    applyToolFilter({ deny: ['b', 'd'] });
    expect(registeredNames()).toEqual(['a', 'c', 'e']);
  });

  it('allow + deny: deny is applied after allow', () => {
    // allow keeps a, b, c; then deny removes b
    applyToolFilter({ allow: ['a', 'b', 'c'], deny: ['b'] });
    expect(registeredNames()).toEqual(['a', 'c']);
  });

  it('allow with nonexistent tool names results in zero tools (no error)', () => {
    applyToolFilter({ allow: ['nonexistent'] });
    expect(registeredNames()).toEqual([]);
  });

  it('deny with nonexistent tool names is a no-op', () => {
    applyToolFilter({ deny: ['nonexistent'] });
    expect(registeredNames()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('set algebra: result equals (A ∩ T) \\ D when A is non-empty', () => {
    // T = {a, b, c, d, e}, A = {a, b, x}, D = {b, y}
    // (A ∩ T) = {a, b}, then \\ D = {a}
    applyToolFilter({ allow: ['a', 'b', 'x'], deny: ['b', 'y'] });
    expect(registeredNames()).toEqual(['a']);
  });

  it('set algebra: result equals T \\ D when A is empty', () => {
    // T = {a, b, c, d, e}, D = {c, e}
    // T \\ D = {a, b, d}
    applyToolFilter({ allow: [], deny: ['c', 'e'] });
    expect(registeredNames()).toEqual(['a', 'b', 'd']);
  });

  // Sub-task specific cases using realistic tool names (Req 3.1, 3.2, 3.3)
  describe('with realistic tool names', () => {
    beforeEach(() => {
      clearRegisteredToolsForTest();
      for (const name of ['query_graph', 'build_knowledge_graph', 'search_nodes', 'get_affected_flows']) {
        registerTool(makeTool(name));
      }
    });

    it('allow: ["query_graph"] — only query_graph remains', () => {
      applyToolFilter({ allow: ['query_graph'] });
      expect(registeredNames()).toEqual(['query_graph']);
    });

    it('deny: ["build_knowledge_graph"] — all except denied remain', () => {
      applyToolFilter({ deny: ['build_knowledge_graph'] });
      expect(registeredNames()).toEqual(['query_graph', 'search_nodes', 'get_affected_flows']);
    });
  });
});
