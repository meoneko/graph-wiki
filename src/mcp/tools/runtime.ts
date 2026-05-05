import { z } from 'zod';

// inputSchema accepts either:
//   - a Zod object (preferred — preserves enums, defaults, bounds in MCP metadata)
//   - a legacy string-map { field: 'string' | 'number?' | ... } (for existing tools)
export type McpInputSchema =
  | z.ZodObject<Record<string, z.ZodTypeAny>>
  | Record<string, string>;

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: McpInputSchema;
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
