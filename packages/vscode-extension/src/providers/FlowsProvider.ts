import * as vscode from 'vscode';
import type { CrgMcpService, GraphNode } from '../services/CrgMcpService';
import { resultErrorSummary } from '../services/CrgMcpService';

interface FlowSummary {
  id: number;
  name: string;
  criticality: number;
  nodeCount: number;
  depth: number;
}

export class FlowsProvider implements vscode.TreeDataProvider<FlowItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<FlowItem | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly service: CrgMcpService) {}

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
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
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        return [FlowItem.message(resultErrorSummary(result))];
      }
      const flows = (result.data?.flows ?? []) as FlowSummary[];
      return flows.map((flow) => FlowItem.flow(flow));
    }

    if (element.kind !== 'flow' || element.flowId === undefined) return [];
    const result = await this.service.callTool('get_flow', {
      workspaceId: context.workspaceId,
      flowId: element.flowId,
    });
    if (result.status !== 'OK' && result.status !== 'PARTIAL') {
      return [FlowItem.message(resultErrorSummary(result))];
    }
    return (result.nodes ?? [])
      .slice(0, context.maxItems)
      .map((node, index) => FlowItem.node(node, index + 1));
  }
}

export class FlowItem extends vscode.TreeItem {
  readonly kind: 'flow' | 'node' | 'message';
  readonly flowId?: number;

  private constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, kind: FlowItem['kind'], flowId?: number) {
    super(label, collapsibleState);
    this.kind = kind;
    this.flowId = flowId;
  }

  static flow(flow: FlowSummary): FlowItem {
    const item = new FlowItem(flow.name, vscode.TreeItemCollapsibleState.Collapsed, 'flow', flow.id);
    item.description = `criticality ${flow.criticality} | ${flow.nodeCount} nodes | depth ${flow.depth}`;
    item.tooltip = `Flow #${flow.id}`;
    item.iconPath = new vscode.ThemeIcon('zap');
    return item;
  }

  static node(node: GraphNode, position: number): FlowItem {
    const item = new FlowItem(`${position}. ${node.label}`, vscode.TreeItemCollapsibleState.None, 'node');
    item.description = [node.type, node.framework].filter(Boolean).join(' | ');
    item.tooltip = node.source_file ?? node.id;
    item.iconPath = new vscode.ThemeIcon((node.roles ?? []).includes('entrypoint') ? 'symbol-interface' : 'symbol-method');
    if (node.source_file) {
      item.command = {
        command: 'vscode.open',
        title: 'Open Source',
        arguments: [vscode.Uri.file(node.source_file)],
      };
    }
    return item;
  }

  static message(message: string): FlowItem {
    const item = new FlowItem(message, vscode.TreeItemCollapsibleState.None, 'message');
    item.iconPath = new vscode.ThemeIcon('warning');
    return item;
  }
}
