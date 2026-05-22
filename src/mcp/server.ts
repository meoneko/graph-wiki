import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { registerAllTools } from './tools/index.js';
import { getRegisteredTools, applyToolFilter, invokeTool } from './tools/runtime.js';
import { registerAllPrompts } from './prompts/index.js';
import { getRegisteredPrompts } from './prompts/runtime.js';
import { toolError } from './tools/results.js';

export interface ServeMcpOptions {
  allowTools?: string[];
  denyTools?: string[];
}

export async function startMcpServer(options?: ServeMcpOptions): Promise<void> {
  registerAllTools();
  registerAllPrompts();

  const totalTools = getRegisteredTools().length;

  // Warn about unknown tool names in allowTools before filtering
  if (options?.allowTools?.length) {
    const knownNames = new Set(getRegisteredTools().map((t) => t.name));
    for (const name of options.allowTools) {
      if (!knownNames.has(name)) {
        console.error(`Warning: unknown tool name in --tools: "${name}"`);
      }
    }
  }

  // Apply tool filter BEFORE creating transport (no-op when options are absent)
  if (options?.allowTools?.length || options?.denyTools?.length) {
    applyToolFilter({ allow: options.allowTools, deny: options.denyTools });
  }

  const exposedTools = getRegisteredTools().length;
  console.error(`MCP: exposing ${exposedTools} of ${totalTools} tools`);

  const server = new Server({ name: 'code-review-graph', version: '1.0.0' }, { capabilities: { tools: {}, prompts: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: getRegisteredTools().map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
      const result = await invokeTool(req.params.name, req.params.arguments ?? {});
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // When a tool is not found (e.g. excluded by filter), return JSON-RPC -32601
      if (message.startsWith('Tool not found:')) {
        throw new McpError(ErrorCode.MethodNotFound, 'Method not found');
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(toolError(message), null, 2),
        }],
        isError: true,
      };
    }
  });
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: getRegisteredPrompts().map((p) => ({ name: p.name, description: p.description })) }));
  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    const prompt = getRegisteredPrompts().find((p) => p.name === req.params.name);
    if (!prompt) throw new Error(`Prompt not found: ${req.params.name}`);
    return { description: prompt.description, messages: [{ role: 'user', content: { type: 'text', text: prompt.template } }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Preserve current behavior: when run directly, start with no filter
const isDirectExecution = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('/mcp/server.js');

if (isDirectExecution) {
  startMcpServer();
}
