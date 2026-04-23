import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';
import { getRegisteredTools, invokeTool } from './tools/runtime.js';
import { registerAllPrompts } from './prompts/index.js';
import { getRegisteredPrompts } from './prompts/runtime.js';

registerAllTools();
registerAllPrompts();

const server = new Server({ name: 'code-review-graph', version: '1.0.0' }, { capabilities: { tools: {}, prompts: {} } });

server.setRequestHandler('tools/list' as never, async () => ({ tools: getRegisteredTools().map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }));
server.setRequestHandler('tools/call' as never, async (req: any) => ({ content: [{ type: 'text', text: JSON.stringify(await invokeTool(req.params.name, req.params.arguments ?? {}), null, 2) }] }));
server.setRequestHandler('prompts/list' as never, async () => ({ prompts: getRegisteredPrompts().map((p) => ({ name: p.name, description: p.description })) }));
server.setRequestHandler('prompts/get' as never, async (req: any) => {
  const prompt = getRegisteredPrompts().find((p) => p.name === req.params.name);
  if (!prompt) throw new Error(`Prompt not found: ${req.params.name}`);
  return { description: prompt.description, messages: [{ role: 'user', content: { type: 'text', text: prompt.template } }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
