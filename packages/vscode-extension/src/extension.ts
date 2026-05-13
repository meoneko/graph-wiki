import * as vscode from 'vscode';

import { BlastRadiusPanel } from './panels/BlastRadiusPanel';
import { SetupPanel } from './panels/SetupPanel';
import { CommunitiesProvider } from './providers/CommunitiesProvider';
import { FlowsProvider } from './providers/FlowsProvider';
import { CrgMcpService } from './services/CrgMcpService';
import { getUnifiedDiff } from './services/GitDiff';

interface QueryResult {
  status: string;
  data?: Record<string, unknown>;
  codes?: string[];
  warnings?: string[];
  reasoning?: { selection_explanation?: string[] };
}

function targetFileFromCommand(resource?: vscode.Uri): string | undefined {
  if (resource?.scheme === 'file') return resource.fsPath;
  return vscode.window.activeTextEditor?.document.uri.fsPath;
}

function formatStats(result: QueryResult): string {
  const stats = result.data?.stats as Record<string, unknown> | undefined;
  if (!stats) return result.status;
  return [
    `nodes: ${stats.nodes ?? 0}`,
    `edges: ${stats.edges ?? 0}`,
    `flows: ${stats.flows ?? 0}`,
    `communities: ${stats.communities ?? 0}`,
    `entrypoints: ${stats.entrypoints ?? 0}`,
  ].join(' | ');
}

function resultSummary(result: QueryResult): string {
  const message =
    result.warnings?.find(Boolean)
    ?? result.reasoning?.selection_explanation?.find(Boolean)
    ?? result.codes?.find(Boolean);
  return message ? `${result.status}: ${message}` : result.status;
}

type StatusState = 'ready' | 'building' | 'updated' | 'error';

function setStatusBarState(item: vscode.StatusBarItem, state: StatusState, detail?: string): void {
  if (state === 'ready') {
    item.text = '$(graph) CRG: Ready';
    item.tooltip = 'Code Review Graph is ready. Click to open setup.';
    return;
  }
  if (state === 'building') {
    item.text = '$(sync~spin) CRG: Building';
    item.tooltip = 'Code Review Graph is building.';
    return;
  }
  if (state === 'updated') {
    item.text = '$(graph) CRG: Updated';
    item.tooltip = 'Code Review Graph was updated. Click to open setup.';
    return;
  }
  item.text = '$(warning) CRG: Error';
  item.tooltip = detail ?? 'Code Review Graph reported an error. Click to open setup.';
}

async function showResult(label: string, result: QueryResult): Promise<void> {
  if (result.status === 'OK' || result.status === 'PARTIAL') {
    await vscode.window.showInformationMessage(`${label}: ${formatStats(result)}`);
    return;
  }
  await vscode.window.showWarningMessage(`${label}: ${resultSummary(result)}`);
}

export function activate(context: vscode.ExtensionContext): void {
  const service = new CrgMcpService(context.extensionPath);
  const flowsProvider = new FlowsProvider(service);
  const communitiesProvider = new CommunitiesProvider(service);

  const statusBarItem = vscode.window.createStatusBarItem('crg.status', vscode.StatusBarAlignment.Left, 10000);
  statusBarItem.name = 'Code Review Graph';
  statusBarItem.command = 'crg.openSetup';
  setStatusBarState(statusBarItem, 'ready');
  statusBarItem.accessibilityInformation = {
    label: 'Code Review Graph setup',
    role: 'button',
  };
  statusBarItem.show();

  context.subscriptions.push(
    service,
    statusBarItem,
    vscode.window.registerTreeDataProvider('crg.views.flows', flowsProvider),
    vscode.window.registerTreeDataProvider('crg.views.communities', communitiesProvider),
    vscode.commands.registerCommand('crg.openSetup', () => {
      SetupPanel.render(context.extensionUri, service);
    }),
    vscode.commands.registerCommand('crg.showBlastRadius', async (resource?: vscode.Uri) => {
      const targetFile = targetFileFromCommand(resource);
      if (!targetFile) {
        await vscode.window.showWarningMessage('Open or select a file before showing blast radius.');
        return;
      }
      BlastRadiusPanel.render(context.extensionUri, targetFile, service);
    }),
    vscode.commands.registerCommand('crg.rebuildGraph', async () => {
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Building Code Review Graph' },
        async () => {
          setStatusBarState(statusBarItem, 'building');
          try {
            const result = await service.buildGraph(false);
            flowsProvider.refresh();
            communitiesProvider.refresh();
            setStatusBarState(statusBarItem, result.status === 'OK' || result.status === 'PARTIAL' ? 'updated' : 'error', resultSummary(result));
            await showResult('CRG build', result);
          } catch (error) {
            setStatusBarState(statusBarItem, 'error', error instanceof Error ? error.message : String(error));
            throw error;
          }
        },
      );
    }),
    vscode.commands.registerCommand('crg.showStats', async () => {
      const result = await service.loadGraphState();
      await showResult('CRG graph state', result);
    }),
    vscode.commands.registerCommand('crg.analyzeChanges', async () => {
      const diff = await getUnifiedDiff();
      if (!diff.trim()) {
        await vscode.window.showInformationMessage('CRG: no git diff to analyze.');
        return;
      }
      const contextInfo = await service.getContext();
      const result = await service.callTool('detect_changes', {
        workspaceId: contextInfo.workspaceId,
        projectId: contextInfo.projectId,
        diff,
      });
      if (result.status !== 'OK' && result.status !== 'PARTIAL') setStatusBarState(statusBarItem, 'error', resultSummary(result));
      await showResult('CRG change risk', result);
    }),
    vscode.commands.registerCommand('crg.generateAgentContext', async () => {
      const contextInfo = await service.getContext();
      const result = await service.callTool('get_minimal_context', {
        workspaceId: contextInfo.workspaceId,
        projectId: contextInfo.projectId,
      });
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        await vscode.window.showWarningMessage(`CRG agent context: ${resultSummary(result)}`);
        return;
      }
      const document = await vscode.workspace.openTextDocument({
        language: 'json',
        content: JSON.stringify(result.data ?? result, null, 2),
      });
      await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    }),
    vscode.commands.registerCommand('crg.openSettings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'crg');
    }),
    service.onGraphUpdated(() => {
      flowsProvider.refresh();
      communitiesProvider.refresh();
      setStatusBarState(statusBarItem, 'updated');
    }),
  );
}

export function deactivate(): void {
  return;
}
