export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

const tools: McpToolDefinition[] = [];

export function registerTool(tool: McpToolDefinition): void {
  tools.push(tool);
}

export function getRegisteredTools(): McpToolDefinition[] {
  return [...tools];
}

export async function invokeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool.handler(args);
}
