import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ResourceUpdatedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { resolveCrgContext, resolveServerCwdSetting, type CrgContext } from './CrgConfig';

export interface QueryResult {
  status: string;
  nodes?: GraphNode[];
  edges?: unknown[];
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  warnings?: string[];
  codes?: string[];
  reasoning?: { selection_explanation?: string[] };
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  roles?: string[];
  language?: string;
  framework?: string;
  project?: string;
  source_file?: string;
  symbol?: string;
}

export class CrgMcpService implements vscode.Disposable {
  private client: Client | undefined;
  private contextCache: CrgContext | undefined;
  private readonly graphUpdatedEmitter = new vscode.EventEmitter<void>();
  readonly onGraphUpdated = this.graphUpdatedEmitter.event;

  constructor(private readonly extensionPath: string) {}

  async getContext(refresh = false): Promise<CrgContext> {
    if (!this.contextCache || refresh) {
      this.contextCache = await resolveCrgContext(this.extensionPath);
    }
    return this.contextCache;
  }

  async connect(refreshContext = false): Promise<void> {
    if (this.client && !refreshContext) return;
    await this.closeClient();

    const context = await this.getContext(refreshContext);
    this.client = await this.createClient(context.serverPath);
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

  async listServerWorkspaces(serverPath: string, serverCwd?: string): Promise<any[]> {
    const client = await this.createClient(serverPath, serverCwd);
    try {
      const result = await this.callClientTool(client, 'list_workspaces', {});
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        throw new Error(resultErrorSummary(result));
      }
      return Array.isArray(result.data?.workspaces) ? result.data.workspaces : [];
    } finally {
      await client.close();
    }
  }

  async loadGraphState(): Promise<QueryResult> {
    const context = await this.getContext();
    return this.callTool('get_minimal_context', {
      workspaceId: context.workspaceId,
      projectId: context.projectId,
    });
  }

  async buildGraph(): Promise<QueryResult> {
    const context = await this.getContext();
    return this.callTool('build_graph', {
      workspaceId: context.workspaceId,
      incremental: false,
    });
  }

  async runPostprocess(): Promise<QueryResult> {
    const context = await this.getContext();
    return this.callTool('run_postprocess', {
      workspaceId: context.workspaceId,
    });
  }

  private async createClient(serverPath: string, serverCwd?: string): Promise<Client> {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath, 'serve-mcp'],
      cwd: resolveServerCwd(serverPath, serverCwd ?? resolveServerCwdSetting()),
    });

    const client = new Client(
      { name: 'crg-vscode-extension', version: '0.1.0' },
      { capabilities: {} },
    );
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
      await client.request({
        method: 'resources/subscribe',
        params: { uri: 'crg://graph/data' },
      } as any, {} as any);
    } catch {
      // Resource subscription is useful but not required for command execution.
    }
    return client;
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

  private async callConnectedTool(name: string, args: Record<string, unknown>): Promise<QueryResult> {
    if (!this.client) throw new Error('CRG MCP client is not connected.');
    return this.callClientTool(this.client, name, args);
  }

  private async callClientTool(client: Client, name: string, args: Record<string, unknown>): Promise<QueryResult> {
    const raw: any = await withTimeout(
      client.callTool({ name, arguments: args }),
      120000,
      `CRG tool ${name} connection_timeout`,
    );
    const text = raw?.content?.find((item: any) => item?.type === 'text')?.text;
    if (typeof text !== 'string') {
      throw new Error(`CRG tool ${name} returned no JSON text content.`);
    }
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
  const code = result.codes?.[0] ?? result.warnings?.[0] ?? result.reasoning?.selection_explanation?.[0];
  return code ? `${result.status}: ${code}` : result.status;
}

function resolveServerCwd(serverPath: string, explicit?: string): string {
  if (explicit && fs.existsSync(explicit) && fs.statSync(explicit).isDirectory()) return explicit;

  let current = path.dirname(serverPath);
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, 'knowledge.config.yaml'))) return current;
    const packageJson = path.join(current, 'package.json');
    if (fs.existsSync(packageJson) && fs.existsSync(path.join(current, 'dist', 'cli', 'index.js'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // Fallback for the standard <root>/dist/cli/index.js layout.
  return path.resolve(path.dirname(serverPath), '..', '..');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
