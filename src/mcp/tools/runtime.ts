export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

const tools: McpToolDefinition[] = [];

export function registerTool(tool: McpToolDefinition): void {
  const existing = tools.findIndex((entry) => entry.name === tool.name);
  if (existing >= 0) {
    throw new Error(`Duplicate MCP tool registration: ${tool.name}`);
  }
  tools.push(tool);
}

export function getRegisteredTools(): McpToolDefinition[] {
  return [...tools];
}

/**
 * Applies allow/deny filtering to the registered tool set in-place.
 *
 * Filter semantics (set algebra):
 * - If `allow` is non-empty: keep only tools whose names are in `allow` (intersection with T).
 * - Then remove any tools whose names are in `deny` (set difference).
 * - If both `allow` and `deny` are empty/undefined: no-op (all tools remain).
 *
 * Resulting filtered set = (A ∩ T) \ D when A is non-empty, OR T \ D when A is empty.
 */
export function applyToolFilter(filter: { allow?: string[]; deny?: string[] }): void {
  const { allow, deny } = filter;

  // Step 1: Apply allow list (if non-empty, keep only listed tools)
  if (allow && allow.length > 0) {
    const allowSet = new Set(allow);
    for (let i = tools.length - 1; i >= 0; i--) {
      const tool = tools[i];
      if (tool && !allowSet.has(tool.name)) {
        tools.splice(i, 1);
      }
    }
  }

  // Step 2: Apply deny list (remove any tools in deny)
  if (deny && deny.length > 0) {
    const denySet = new Set(deny);
    for (let i = tools.length - 1; i >= 0; i--) {
      const tool = tools[i];
      if (tool && denySet.has(tool.name)) {
        tools.splice(i, 1);
      }
    }
  }
}

export function clearRegisteredToolsForTest(): void {
  if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    throw new Error('clearRegisteredToolsForTest may only be used in tests.');
  }
  tools.length = 0;
}

export async function invokeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  const { enforceQueryResultContract } = await import('../../core/graph/query/QueryResultValidator.js');
  const result = await tool.handler(args);
  // Enforce QueryResult contract at the MCP boundary — raw graph data is never
  // returned without status and provenance to reasoning consumers (Req 9.3)
  return enforceQueryResultContract(result, { tool: name });
}
