import * as vscode from 'vscode';
import { resultErrorSummary, type CrgMcpService } from '../services/CrgMcpService';

type Community = Record<string, unknown> & { id?: string; name?: string; size?: number; cohesion?: number };
type CommunityNode = Record<string, unknown> & { id?: string; label?: string; type?: string; project?: string; source_file?: string };

export class CommunitiesProvider implements vscode.TreeDataProvider<CommunityItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CommunityItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly service: CrgMcpService) {}

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  getTreeItem(element: CommunityItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CommunityItem): Promise<CommunityItem[]> {
    const context = await this.service.getContext();
    if (!element) {
      const result = await this.service.callTool('list_communities', {
        workspaceId: context.workspaceId,
        projectId: context.projectId,
      });
      if (result.status !== 'OK' && result.status !== 'PARTIAL') return [CommunityItem.message(resultErrorSummary(result))];
      return asArray<Community>(result.data?.communities)
        .slice(0, context.maxItems)
        .map((community) => CommunityItem.community(community));
    }

    if (element.kind !== 'community' || !element.communityId) return [];
    const result = await this.service.callTool('get_community', {
      workspaceId: context.workspaceId,
      communityId: element.communityId,
    });
    if (result.status !== 'OK' && result.status !== 'PARTIAL') return [CommunityItem.message(resultErrorSummary(result))];
    return asArray<CommunityNode>(result.data?.nodes)
      .slice(0, context.maxItems)
      .map((node) => CommunityItem.node(node));
  }
}

export class CommunityItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, readonly kind: 'community' | 'node' | 'message', readonly communityId?: string) {
    super(label, collapsibleState);
  }

  static community(community: Community): CommunityItem {
    const id = String(community.id ?? community.name ?? 'community');
    const item = new CommunityItem(String(community.name ?? id), vscode.TreeItemCollapsibleState.Collapsed, 'community', id);
    item.description = `${community.size ?? 0} nodes | cohesion ${community.cohesion ?? 0}`;
    item.tooltip = `Community #${id}`;
    item.iconPath = new vscode.ThemeIcon('organization');
    return item;
  }

  static node(node: CommunityNode): CommunityItem {
    const item = new CommunityItem(String(node.label ?? node.id ?? 'node'), vscode.TreeItemCollapsibleState.None, 'node');
    item.description = [node.type, node.project].filter(Boolean).join(' | ');
    item.tooltip = String(node.source_file ?? node.id ?? '');
    item.iconPath = new vscode.ThemeIcon('file-code');
    if (typeof node.source_file === 'string') {
      item.command = { command: 'vscode.open', title: 'Open Source', arguments: [vscode.Uri.file(node.source_file)] };
    }
    return item;
  }

  static message(message: string): CommunityItem {
    const item = new CommunityItem(message, vscode.TreeItemCollapsibleState.None, 'message');
    item.iconPath = new vscode.ThemeIcon('warning');
    return item;
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
