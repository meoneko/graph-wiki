import { describe, expect, it, beforeEach } from 'vitest';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  applyToolFilter,
  clearRegisteredToolsForTest,
  getRegisteredTools,
  invokeTool,
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

describe('excluded tool error response (Req 3.5, 3.6)', () => {
  beforeEach(() => {
    clearRegisteredToolsForTest();
    for (const name of ['allowed_tool', 'excluded_tool', 'another_tool']) {
      registerTool(makeTool(name));
    }
  });

  it('invokeTool throws "Tool not found" for excluded tools', async () => {
    applyToolFilter({ allow: ['allowed_tool'] });

    await expect(invokeTool('excluded_tool', {})).rejects.toThrow('Tool not found: excluded_tool');
  });

  it('excluded tool error message matches pattern that triggers JSON-RPC -32601', async () => {
    applyToolFilter({ allow: ['allowed_tool'] });

    // The server.ts handler catches errors starting with "Tool not found:" and
    // converts them to McpError(ErrorCode.MethodNotFound) which is code -32601.
    // Verify the error message format matches the expected pattern.
    try {
      await invokeTool('excluded_tool', {});
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message.startsWith('Tool not found:')).toBe(true);
      // Confirm ErrorCode.MethodNotFound equals -32601
      expect(ErrorCode.MethodNotFound).toBe(-32601);
    }
  });

  it('tools/list (getRegisteredTools) contains only filtered set after allow filter', () => {
    applyToolFilter({ allow: ['allowed_tool'] });

    const names = getRegisteredTools().map((t) => t.name);
    expect(names).toEqual(['allowed_tool']);
    expect(names).not.toContain('excluded_tool');
    expect(names).not.toContain('another_tool');
  });

  it('tools/list count matches filtered count', () => {
    // Before filtering: 3 tools
    expect(getRegisteredTools()).toHaveLength(3);

    applyToolFilter({ allow: ['allowed_tool', 'another_tool'] });

    // After filtering: exactly 2 tools remain
    const filtered = getRegisteredTools();
    expect(filtered).toHaveLength(2);
    expect(filtered.map((t) => t.name)).toEqual(['allowed_tool', 'another_tool']);
  });

  it('tools/list (getRegisteredTools) contains only filtered set after deny filter', () => {
    applyToolFilter({ deny: ['excluded_tool'] });

    const names = getRegisteredTools().map((t) => t.name);
    expect(names).toEqual(['allowed_tool', 'another_tool']);
    expect(names).not.toContain('excluded_tool');
  });

  it('invokeTool works for tools that remain after filtering', async () => {
    applyToolFilter({ allow: ['allowed_tool'] });

    // allowed_tool should still be callable (handler returns { ok: true })
    // Note: invokeTool also calls enforceQueryResultContract, so we just verify no "Tool not found" error
    await expect(invokeTool('allowed_tool', {})).resolves.toBeDefined();
  });
});
