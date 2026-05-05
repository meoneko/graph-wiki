import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerAllTools } from './tools/index.js';
import { getRegisteredTools, invokeTool } from './tools/runtime.js';
import { registerAllPrompts } from './prompts/index.js';
import { getRegisteredPrompts } from './prompts/runtime.js';

registerAllTools();
registerAllPrompts();

export const mcpServer = new McpServer(
  { name: 'code-review-graph', version: '1.0.0' },
  { capabilities: { tools: {}, prompts: {}, resources: { subscribe: true } } },
);

export function notifyGraphUpdated(): void {
  try {
    mcpServer.server.notification({
      method: 'notifications/resources/updated',
      params: { uri: 'crg://graph/data' },
    });
  } catch (err) {
    // Ignore if no clients connected or transport not ready
  }
}

const passthroughArgsSchema = z.object({}).passthrough();

function zodFromLegacySchema(schema: Record<string, string>): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, value] of Object.entries(schema)) {
    switch (value) {
      case 'string':   shape[key] = z.string(); break;
      case 'string?':  shape[key] = z.string().optional(); break;
      case 'number':   shape[key] = z.number(); break;
      case 'number?':  shape[key] = z.number().optional(); break;
      case 'boolean':  shape[key] = z.boolean(); break;
      case 'boolean?': shape[key] = z.boolean().optional(); break;
      case 'string[]':  shape[key] = z.array(z.string()); break;
      case 'string[]?': shape[key] = z.array(z.string()).optional(); break;
      default: return passthroughArgsSchema;
    }
  }
  return z.object(shape);
}

// P1 FIX: use Zod schema directly when provided; fall back to legacy string-map conversion.
// New tools registered with a ZodObject get full enum/default/bounds in MCP metadata.
function resolveInputSchema(
  schema: z.ZodObject<Record<string, z.ZodTypeAny>> | Record<string, string>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  if (schema instanceof z.ZodObject) return schema;
  return zodFromLegacySchema(schema as Record<string, string>);
}

for (const tool of getRegisteredTools()) {
  mcpServer.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: resolveInputSchema(tool.inputSchema as z.ZodObject<Record<string, z.ZodTypeAny>> | Record<string, string>),
    },
    async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(await invokeTool(tool.name, args as Record<string, unknown>), null, 2),
        },
      ],
    }),
  );
}

for (const prompt of getRegisteredPrompts()) {
  mcpServer.registerPrompt(prompt.name, { description: prompt.description }, async () => ({
    description: prompt.description,
    messages: [{ role: 'user', content: { type: 'text', text: prompt.template } }],
  }));
}

const transport = new StdioServerTransport();
await mcpServer.connect(transport);
