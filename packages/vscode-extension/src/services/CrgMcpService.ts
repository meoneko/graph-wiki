import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ResourceUpdatedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { resolveCrgContext, resolveServerCwdSetting, type CrgContext, type WorkspaceCandidate } from './CrgConfig';

export interface QueryResult {
  status: string;
  data?: Record<string, unknown>;
  codes?: string[];
  warnings?: string[];
  reasoning?: { selection_explanation?: string[] };
  confidence?: { level?: string; reasons?: string[] };
  provenance?: { sources?: unknown[] };
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

type McpClient = {
  connect(transport: unknown): Promise<void>;
  close(): Promise<void>;
  callTool(request: { name: string; arguments: Record<string, unknown> }): Promise<{ content?: Array<{ type?: string; text?: string }> }>;
  request(request: Record<string, unknown>, schema: Record<string, unknown>): Promise<unknown>;
  setNotificationHandler(schema: unknown, handler: (notification: { params: { uri?: string } }) => void): void;
};

export class CrgMcpService implements vscode.Disposable {
  private client?: McpClient;
  private contextCache?: CrgContext;
  private readonly graphUpdatedEmitter = new vscode.EventEmitter<void>();
  readonly onGraphUpdated = this.graphUpdatedEmitter.event;

  constructor(private readonly extensionPath: string) {}

  async getContext(refresh = false): Promise<CrgContext> {
    if (!this.contextCache || refresh) this.contextCache = await resolveCrgContext(this.extensionPath);
    return this.contextCache;
  }

  async connect(refreshContext = false): Promise<void> {
    if (this.client && !refreshContext) return;
    await this.closeClient();
    const context = await this.getContext(refreshContext);
    this.client = await this.createClient(context.serverPath, context.serverCwd);
  }

  async disconnect(): Promise<void> {
    await this.closeClient();
  }

  async reconnect(): Promise<void> {
    this.contextCache = undefined;
    await this.connect(true);
  }

  async testConnection(serverPath: string, serverCwd?: string): Promise<void> {
    const client = await this.createClient(serverPath, serverCwd);
    await client.close();
  }

  async listServerWorkspaces(serverPath: string, serverCwd?: string): Promise<WorkspaceCandidate[]> {
    const client = await this.createClient(serverPath, serverCwd);
    try {
      const result = await this.callClientTool(client, 'list_workspaces', {});
      if (result.status !== 'OK' && result.status !== 'PARTIAL') throw new Error(resultErrorSummary(result));
      return Array.isArray(result.data?.workspaces) ? result.data.workspaces as WorkspaceCandidate[] : [];
    } finally {
      await client.close();
    }
  }

  async loadGraphState(): Promise<QueryResult> {
    const context = await this.getContext();
    return this.callTool('get_minimal_context', { workspaceId: context.workspaceId, projectId: context.projectId });
  }

  async buildGraph(incremental = false): Promise<QueryResult> {
    const context = await this.getContext();
    return this.callTool('build_graph', { workspaceId: context.workspaceId, incremental });
  }

  async runPostprocess(): Promise<QueryResult> {
    const context = await this.getContext();
    return this.callTool('run_postprocess', { workspaceId: context.workspaceId });
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<QueryResult> {
    await this.connect();
    try {
      return await this.callConnectedTool(name, args);
    } catch (error) {
      await this.connect(true);
      try {
        return await this.callConnectedTool(name, args);
      } catch {
        throw error;
      }
    }
  }

  async refreshContext(): Promise<CrgContext> {
    this.contextCache = undefined;
    await this.connect(true);
    return this.getContext();
  }

  dispose(): void {
    void this.closeClient();
    this.graphUpdatedEmitter.dispose();
  }

  private async createClient(serverPath: string, serverCwd?: string): Promise<McpClient> {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath, 'serve-mcp'],
      cwd: resolveServerCwd(serverPath, serverCwd ?? resolveServerCwdSetting()),
    });
    const client = new Client({ name: 'crg-vscode-extension', version: '0.1.0' }, { capabilities: {} }) as McpClient;
    try {
      await withTimeout(client.connect(transport), 10000, 'CRG MCP connection_timeout');
    } catch (error) {
      await client.close().catch(() => undefined);
      throw error;
    }
    client.setNotificationHandler(ResourceUpdatedNotificationSchema, (notification) => {
      if (notification.params.uri === 'crg://graph/data') this.graphUpdatedEmitter.fire();
    });
    try {
      await client.request({ method: 'resources/subscribe', params: { uri: 'crg://graph/data' } }, {});
    } catch {
      // Resource subscription is useful but command execution must not depend on it.
    }
    return client;
  }

  private async callConnectedTool(name: string, args: Record<string, unknown>): Promise<QueryResult> {
    if (!this.client) throw new Error('CRG MCP client is not connected.');
    return this.callClientTool(this.client, name, args);
  }

  private async callClientTool(client: McpClient, name: string, args: Record<string, unknown>): Promise<QueryResult> {
    const raw = await withTimeout(client.callTool({ name, arguments: args }), 600000, `CRG tool ${name} connection_timeout`);
    const text = raw?.content?.find((item) => item?.type === 'text')?.text;
    if (typeof text !== 'string') throw new Error(`CRG tool ${name} returned no JSON text content.`);
    try {
      return JSON.parse(text) as QueryResult;
    } catch (error) {
      throw new Error(`CRG tool ${name} returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async closeClient(): Promise<void> {
    if (!this.client) return;
    const client = this.client;
    this.client = undefined;
    await client.close();
  }
}

export function resultErrorSummary(result: QueryResult): string {
  const code = result.warnings?.find(Boolean) ?? result.reasoning?.selection_explanation?.find(Boolean) ?? result.codes?.find(Boolean);
  return code ? `${result.status}: ${code}` : result.status;
}

function resolveServerCwd(serverPath: string, explicit?: string): string {
  if (explicit && fs.existsSync(explicit) && fs.statSync(explicit).isDirectory()) return explicit;
  let current = path.dirname(serverPath);
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, 'knowledge.config.yaml'))) return current;
    if (fs.existsSync(path.join(current, 'package.json')) && fs.existsSync(path.join(current, 'dist', 'cli', 'index.js'))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(path.dirname(serverPath), '..', '..');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
