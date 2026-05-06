import * as vscode from 'vscode';
import type { CrgMcpService, GraphNode } from '../services/CrgMcpService';
import { resultErrorSummary } from '../services/CrgMcpService';

interface CommunitySummary {
  id: number;
  name: string;
  size: number;
  cohesion: number;
}

export class CommunitiesProvider implements vscode.TreeDataProvider<CommunityItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CommunityItem | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly service: CrgMcpService) {}

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
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
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        return [CommunityItem.message(resultErrorSummary(result))];
      }
      const communities = ((result.data?.communities ?? []) as CommunitySummary[]).slice(0, context.maxItems);
      return communities.map((community) => CommunityItem.community(community));
    }

    if (element.kind !== 'community' || element.communityId === undefined) return [];
    const result = await this.service.callTool('get_community', {
      workspaceId: context.workspaceId,
      communityId: element.communityId,
    });
    if (result.status !== 'OK' && result.status !== 'PARTIAL') {
      return [CommunityItem.message(resultErrorSummary(result))];
    }
    return (result.nodes ?? [])
      .slice(0, context.maxItems)
      .map((node) => CommunityItem.node(node));
  }
}

export class CommunityItem extends vscode.TreeItem {
  readonly kind: 'community' | 'node' | 'message';
  readonly communityId?: number;

  private constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    kind: CommunityItem['kind'],
    communityId?: number,
  ) {
    super(label, collapsibleState);
    this.kind = kind;
    this.communityId = communityId;
  }

  static community(community: CommunitySummary): CommunityItem {
    const item = new CommunityItem(community.name, vscode.TreeItemCollapsibleState.Collapsed, 'community', community.id);
    item.description = `${community.size} nodes | cohesion ${community.cohesion}`;
    item.tooltip = `Community #${community.id}`;
    item.iconPath = new vscode.ThemeIcon('organization');
    return item;
  }

  static node(node: GraphNode): CommunityItem {
    const item = new CommunityItem(node.label, vscode.TreeItemCollapsibleState.None, 'node');
    item.description = [node.type, node.project].filter(Boolean).join(' | ');
    item.tooltip = node.source_file ?? node.id;
    item.iconPath = new vscode.ThemeIcon('file-code');
    if (node.source_file) {
      item.command = {
        command: 'vscode.open',
        title: 'Open Source',
        arguments: [vscode.Uri.file(node.source_file)],
      };
    }
    return item;
  }

  static message(message: string): CommunityItem {
    const item = new CommunityItem(message, vscode.TreeItemCollapsibleState.None, 'message');
    item.iconPath = new vscode.ThemeIcon('warning');
    return item;
  }
}
