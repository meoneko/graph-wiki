import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { type CrgMcpService, resultErrorSummary } from '../services/CrgMcpService';
import { BlastRadiusService } from './BlastRadiusService';
import { renderBlastRadiusWebview } from './blastRadiusWebview';

export class BlastRadiusPanel {
  private static currentPanel?: BlastRadiusPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly blastRadiusService: BlastRadiusService;

  static render(extensionUri: vscode.Uri, targetFile: string, service: CrgMcpService): void {
    if (BlastRadiusPanel.currentPanel) {
      BlastRadiusPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      void BlastRadiusPanel.currentPanel.updateTarget(targetFile);
      return;
    }
    const panel = vscode.window.createWebviewPanel('crgBlastRadius', 'Blast Radius', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [extensionUri],
    });
    BlastRadiusPanel.currentPanel = new BlastRadiusPanel(panel, service, targetFile, extensionUri);
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    service: CrgMcpService,
    private targetFile: string,
    private readonly extensionUri: vscode.Uri
  ) {
    this.blastRadiusService = new BlastRadiusService(service);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = renderBlastRadiusWebview(this.panel.webview, this.extensionUri);
    this.panel.webview.onDidReceiveMessage((message) => void this.handleMessage(message), null, this.disposables);
    void this.updateTarget(targetFile);
  }

  private async updateTarget(targetFile: string): Promise<void> {
    this.targetFile = targetFile;
    this.panel.title = `Blast Radius: ${path.basename(targetFile)}`;
    await this.panel.webview.postMessage({ command: 'setLoading', targetFile });
    try {
      await this.panel.webview.postMessage({ command: 'renderBlastRadius', data: await this.blastRadiusService.getBlastRadius(targetFile) });
    } catch (error) {
      await this.panel.webview.postMessage({ command: 'renderError', message: errorMessage(error) });
    }
  }

  private dispose(): void {
    BlastRadiusPanel.currentPanel = undefined;
    while (this.disposables.length) this.disposables.pop()?.dispose();
  }

  private async handleMessage(message: Record<string, unknown>): Promise<void> {
    if (message.command === 'openFile' && typeof message.file === 'string') return this.openFile(message.file);
    if (message.command === 'refreshBlastRadius') return this.updateTarget(typeof message.targetFile === 'string' ? message.targetFile : this.targetFile);
    if (message.command === 'traceNode' && typeof message.nodeId === 'string') return this.traceNode(message.nodeId);
    if (message.command === 'openSetup') return vscode.commands.executeCommand('crg.openSetup');
    if (message.command === 'rebuildGraph') return this.rebuildGraph();
    if (message.command === 'runPostprocess') return this.runPostprocess();
  }

  private async traceNode(nodeId: string): Promise<void> {
    try {
      await this.panel.webview.postMessage({ command: 'renderTrace', data: await this.blastRadiusService.traceNode(nodeId) });
    } catch (error) {
      await this.panel.webview.postMessage({ command: 'renderError', message: errorMessage(error) });
    }
  }

  private async rebuildGraph(): Promise<void> {
    await this.panel.webview.postMessage({ command: 'setLoading', targetFile: this.targetFile, message: 'Rebuilding graph...' });
    try {
      const result = await this.blastRadiusService.rebuildGraph();
      if (result.status !== 'OK' && result.status !== 'PARTIAL') throw new Error(`Build graph failed: ${resultErrorSummary(result)}`);
      const postprocess = await this.blastRadiusService.runPostprocess();
      if (postprocess.status !== 'OK' && postprocess.status !== 'PARTIAL') throw new Error(`Postprocess failed: ${resultErrorSummary(postprocess)}`);
      await this.updateTarget(this.targetFile);
    } catch (error) {
      await this.panel.webview.postMessage({ command: 'renderError', message: errorMessage(error) });
    }
  }

  private async runPostprocess(): Promise<void> {
    await this.panel.webview.postMessage({ command: 'setLoading', targetFile: this.targetFile, message: 'Running postprocess...' });
    try {
      const result = await this.blastRadiusService.runPostprocess();
      if (result.status !== 'OK' && result.status !== 'PARTIAL') throw new Error(`Postprocess failed: ${resultErrorSummary(result)}`);
      await this.updateTarget(this.targetFile);
    } catch (error) {
      await this.panel.webview.postMessage({ command: 'renderError', message: errorMessage(error) });
    }
  }

  private async openFile(filePath: string): Promise<void> {
    const normalized = path.resolve(filePath);
    const inWorkspace = (vscode.workspace.workspaceFolders ?? []).some((folder) => {
      const root = path.resolve(folder.uri.fsPath);
      return normalized === root || normalized.startsWith(`${root}${path.sep}`);
    });
    if (!inWorkspace && vscode.workspace.workspaceFolders?.length) {
      void vscode.window.showWarningMessage('CRG refused to open a file outside the current workspace.');
      return;
    }
    if (!fs.existsSync(normalized)) {
      void vscode.window.showWarningMessage(`CRG file not found: ${normalized}`);
      return;
    }
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(normalized));
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
