import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { CrgMcpService } from '../services/CrgMcpService';
import { BlastRadiusService } from './BlastRadiusService';
import { renderBlastRadiusWebview } from './blastRadiusWebview';

type WebviewMessage =
  | { command: 'openFile'; file?: string }
  | { command: 'traceNode'; nodeId?: string }
  | { command: 'refreshBlastRadius'; targetFile?: string }
  | { command: 'openSetup' }
  | { command: 'rebuildGraph' }
  | { command: 'runPostprocess' };

export class BlastRadiusPanel {
  public static currentPanel: BlastRadiusPanel | undefined;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly blastRadiusService: BlastRadiusService;
  private targetFile: string;

  static render(extensionUri: vscode.Uri, targetFile: string, service: CrgMcpService): void {
    if (BlastRadiusPanel.currentPanel) {
      BlastRadiusPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      void BlastRadiusPanel.currentPanel.updateTarget(targetFile);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'crgBlastRadius',
      'Blast Radius',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );
    BlastRadiusPanel.currentPanel = new BlastRadiusPanel(panel, service, targetFile);
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    service: CrgMcpService,
    targetFile: string,
  ) {
    this.targetFile = targetFile;
    this.blastRadiusService = new BlastRadiusService(service);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = renderBlastRadiusWebview(this.panel.webview);
    this.panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      void this.handleMessage(message);
    }, null, this.disposables);
    void this.updateTarget(targetFile);
  }

  async updateTarget(targetFile: string): Promise<void> {
    this.targetFile = targetFile;
    this.panel.title = `Blast Radius: ${path.basename(targetFile)}`;
    await this.panel.webview.postMessage({ command: 'setLoading', targetFile });

    try {
      const viewModel = await this.blastRadiusService.getBlastRadius(targetFile);
      await this.panel.webview.postMessage({
        command: 'renderBlastRadius',
        data: viewModel,
      });
    } catch (error) {
      await this.panel.webview.postMessage({
        command: 'renderError',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  dispose(): void {
    BlastRadiusPanel.currentPanel = undefined;
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    if (message.command === 'openFile' && typeof message.file === 'string') {
      await this.openFile(message.file);
      return;
    }
    if (message.command === 'refreshBlastRadius') {
      await this.updateTarget(message.targetFile || this.targetFile);
      return;
    }
    if (message.command === 'traceNode' && typeof message.nodeId === 'string') {
      await this.traceNode(message.nodeId);
      return;
    }
    if (message.command === 'openSetup') {
      await vscode.commands.executeCommand('crg.openSetup');
      return;
    }
    if (message.command === 'rebuildGraph') {
      await this.rebuildGraph();
      return;
    }
    if (message.command === 'runPostprocess') {
      await this.runPostprocess();
    }
  }

  private async traceNode(nodeId: string): Promise<void> {
    try {
      const trace = await this.blastRadiusService.traceNode(nodeId);
      await this.panel.webview.postMessage({
        command: 'renderTrace',
        data: trace,
      });
    } catch (error) {
      await this.panel.webview.postMessage({
        command: 'renderError',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async rebuildGraph(): Promise<void> {
    await this.panel.webview.postMessage({
      command: 'setLoading',
      targetFile: this.targetFile,
      message: 'Rebuilding graph...',
    });
    try {
      const result = await this.blastRadiusService.rebuildGraph();
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        throw new Error(`Build graph failed: ${result.codes?.[0] ?? result.status}`);
      }
      const postprocess = await this.blastRadiusService.runPostprocess();
      if (postprocess.status !== 'OK' && postprocess.status !== 'PARTIAL') {
        throw new Error(`Postprocess failed: ${postprocess.codes?.[0] ?? postprocess.status}`);
      }
      await this.updateTarget(this.targetFile);
    } catch (error) {
      await this.panel.webview.postMessage({
        command: 'renderError',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async runPostprocess(): Promise<void> {
    await this.panel.webview.postMessage({
      command: 'setLoading',
      targetFile: this.targetFile,
      message: 'Running postprocess...',
    });
    try {
      const result = await this.blastRadiusService.runPostprocess();
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        throw new Error(`Postprocess failed: ${result.codes?.[0] ?? result.status}`);
      }
      await this.updateTarget(this.targetFile);
    } catch (error) {
      await this.panel.webview.postMessage({
        command: 'renderError',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async openFile(filePath: string): Promise<void> {
    const normalized = path.resolve(filePath);
    const inWorkspace = (vscode.workspace.workspaceFolders ?? []).some((folder) => {
      const root = path.resolve(folder.uri.fsPath);
      return normalized === root || normalized.startsWith(`${root}${path.sep}`);
    });
    if (!inWorkspace && vscode.workspace.workspaceFolders?.length) {
      vscode.window.showWarningMessage('CRG refused to open a file outside the current workspace.');
      return;
    }
    if (!fs.existsSync(normalized)) {
      vscode.window.showWarningMessage(`CRG file not found: ${normalized}`);
      return;
    }
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(normalized));
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  }
}
