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

export function clearRegisteredToolsForTest(): void {
  if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    throw new Error('clearRegisteredToolsForTest may only be used in tests.');
  }
  tools.length = 0;
}

export async function invokeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool.handler(args);
}
