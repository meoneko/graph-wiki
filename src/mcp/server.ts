import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerAllTools } from './tools/index.js';
import { getRegisteredTools, invokeTool } from './tools/runtime.js';
import { registerAllPrompts } from './prompts/index.js';
import { getRegisteredPrompts } from './prompts/runtime.js';

registerAllTools();
registerAllPrompts();

const server = new Server({ name: 'code-review-graph', version: '1.0.0' }, { capabilities: { tools: {}, prompts: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: getRegisteredTools().map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }));
server.setRequestHandler(CallToolRequestSchema, async (req) => ({ content: [{ type: 'text', text: JSON.stringify(await invokeTool(req.params.name, req.params.arguments ?? {}), null, 2) }] }));
server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: getRegisteredPrompts().map((p) => ({ name: p.name, description: p.description })) }));
server.setRequestHandler(GetPromptRequestSchema, async (req) => {
  const prompt = getRegisteredPrompts().find((p) => p.name === req.params.name);
  if (!prompt) throw new Error(`Prompt not found: ${req.params.name}`);
  return { description: prompt.description, messages: [{ role: 'user', content: { type: 'text', text: prompt.template } }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
