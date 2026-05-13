import * as vscode from 'vscode';
import { resultErrorSummary, type CrgMcpService } from '../services/CrgMcpService';

type Flow = Record<string, unknown> & { id?: string; name?: string; nodeCount?: number; criticality?: number; depth?: number };
type NodeRecord = Record<string, unknown> & { id?: string; label?: string; type?: string; source_file?: string; roles?: string[] };

export class FlowsProvider implements vscode.TreeDataProvider<FlowItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<FlowItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly service: CrgMcpService) {}

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  getTreeItem(element: FlowItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FlowItem): Promise<FlowItem[]> {
    const context = await this.service.getContext();
    if (!element) {
      const result = await this.service.callTool('list_flows', {
        workspaceId: context.workspaceId,
        projectId: context.projectId,
        limit: context.maxItems,
      });
      if (result.status !== 'OK' && result.status !== 'PARTIAL') return [FlowItem.message(resultErrorSummary(result))];
      return asArray<Flow>(result.data?.flows).map((flow) => FlowItem.flow(flow));
    }

    if (element.kind !== 'flow' || !element.flowId) return [];
    const result = await this.service.callTool('get_flow', { workspaceId: context.workspaceId, flowId: element.flowId });
    if (result.status !== 'OK' && result.status !== 'PARTIAL') return [FlowItem.message(resultErrorSummary(result))];
    return asArray<NodeRecord>(result.data?.nodes)
      .slice(0, context.maxItems)
      .map((node, index) => FlowItem.node(node, index + 1));
  }
}

export class FlowItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, readonly kind: 'flow' | 'node' | 'message', readonly flowId?: string) {
    super(label, collapsibleState);
  }

  static flow(flow: Flow): FlowItem {
    const id = String(flow.id ?? flow.name ?? 'flow');
    const item = new FlowItem(String(flow.name ?? id), vscode.TreeItemCollapsibleState.Collapsed, 'flow', id);
    item.description = `criticality ${flow.criticality ?? 0} | ${flow.nodeCount ?? 0} nodes | depth ${flow.depth ?? 0}`;
    item.tooltip = `Flow #${id}`;
    item.iconPath = new vscode.ThemeIcon('zap');
    return item;
  }

  static node(node: NodeRecord, position: number): FlowItem {
    const item = new FlowItem(`${position}. ${String(node.label ?? node.id ?? 'node')}`, vscode.TreeItemCollapsibleState.None, 'node');
    item.description = [node.type, node.framework].filter(Boolean).join(' | ');
    item.tooltip = String(node.source_file ?? node.id ?? '');
    item.iconPath = new vscode.ThemeIcon(node.roles?.includes('entrypoint') ? 'symbol-interface' : 'symbol-method');
    if (typeof node.source_file === 'string') {
      item.command = { command: 'vscode.open', title: 'Open Source', arguments: [vscode.Uri.file(node.source_file)] };
    }
    return item;
  }

  static message(message: string): FlowItem {
    const item = new FlowItem(message, vscode.TreeItemCollapsibleState.None, 'message');
    item.iconPath = new vscode.ThemeIcon('warning');
    return item;
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
