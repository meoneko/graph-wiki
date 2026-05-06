import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type { CrgMcpService } from '../services/CrgMcpService';
import { resultErrorSummary } from '../services/CrgMcpService';

interface AffectedFlow {
  id: number;
  name: string;
  criticality: number;
  nodeCount: number;
  matchedNodeCount: number;
  projects?: string[];
}

interface MatchedNode {
  id: string;
  label: string;
  project: string;
  source_file?: string;
}

export class BlastRadiusPanel {
  public static currentPanel: BlastRadiusPanel | undefined;
  private readonly disposables: vscode.Disposable[] = [];

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
    private readonly service: CrgMcpService,
    targetFile: string,
  ) {
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getWebviewContent(this.panel.webview);
    this.panel.webview.onDidReceiveMessage((message) => {
      if (message?.command === 'openFile' && typeof message.file === 'string') {
        void this.openFile(message.file);
      }
    }, null, this.disposables);
    void this.updateTarget(targetFile);
  }

  async updateTarget(targetFile: string): Promise<void> {
    this.panel.title = `Blast Radius: ${path.basename(targetFile)}`;
    await this.panel.webview.postMessage({ command: 'setLoading', isLoading: true, targetFile });

    try {
      const context = await this.service.getContext();
      const result = await this.service.callTool('get_affected_flows', {
        workspaceId: context.workspaceId,
        projectId: context.projectId,
        changedFiles: [targetFile],
      });
      if (result.status !== 'OK' && result.status !== 'PARTIAL') {
        await this.panel.webview.postMessage({
          command: 'renderError',
          message: resultErrorSummary(result),
        });
        return;
      }

      await this.panel.webview.postMessage({
        command: 'renderGraph',
        data: {
          targetFile,
          matchedNodes: (result.data?.matchedNodes ?? []) as MatchedNode[],
          flows: (result.data?.flows ?? []) as AffectedFlow[],
          unmatchedInputs: result.data?.unmatchedInputs ?? [],
        },
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

  private getWebviewContent(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>CRG Blast Radius</title>
  <style>
    body { margin: 0; padding: 18px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); }
    #loading, #error { display: none; padding: 16px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; }
    #summary { margin-bottom: 14px; display: grid; gap: 8px; }
    .pill { display: inline-block; margin-right: 8px; padding: 3px 8px; border-radius: 999px; background: var(--vscode-button-secondaryBackground); }
    .grid { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(320px, 2fr); gap: 16px; min-height: 420px; }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 10px; background: var(--vscode-editorWidget-background); }
    .item { padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); cursor: default; }
    .item:last-child { border-bottom: 0; }
    .file { color: var(--vscode-textLink-foreground); cursor: pointer; }
    svg { width: 100%; height: 520px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; background: var(--vscode-sideBar-background); }
    text { fill: var(--vscode-editor-foreground); font-size: 12px; }
    .target { fill: var(--vscode-button-background); }
    .flow { fill: var(--vscode-charts-orange); }
    .node { fill: var(--vscode-charts-blue); }
    line { stroke: var(--vscode-editorLineNumber-foreground); stroke-width: 1.5; }
  </style>
</head>
<body>
  <div id="loading">Calculating affected flows...</div>
  <div id="error"></div>
  <div id="content" style="display:none">
    <div id="summary"></div>
    <div class="grid">
      <div class="card">
        <h3>Matched Nodes</h3>
        <div id="nodes"></div>
      </div>
      <div>
        <h3>Affected Flows</h3>
        <svg id="graph" role="img" aria-label="Affected flows graph"></svg>
        <div id="flows" class="card" style="margin-top:12px"></div>
      </div>
    </div>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const content = document.getElementById('content');

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'setLoading') {
        loading.style.display = 'block';
        error.style.display = 'none';
        content.style.display = 'none';
      }
      if (message.command === 'renderError') {
        loading.style.display = 'none';
        content.style.display = 'none';
        error.style.display = 'block';
        error.textContent = message.message;
      }
      if (message.command === 'renderGraph') {
        loading.style.display = 'none';
        error.style.display = 'none';
        content.style.display = 'block';
        render(message.data);
      }
    });

    function render(data) {
      document.getElementById('summary').innerHTML =
        '<div><strong>Target:</strong> ' + escapeHtml(data.targetFile) + '</div>' +
        '<div><span class="pill">' + data.matchedNodes.length + ' matched nodes</span>' +
        '<span class="pill">' + data.flows.length + ' affected flows</span></div>';

      document.getElementById('nodes').innerHTML = data.matchedNodes.map(node =>
        '<div class="item">' +
        '<div><strong>' + escapeHtml(node.label) + '</strong></div>' +
        '<div>' + escapeHtml(node.project || '') + '</div>' +
        (node.source_file ? '<div class="file" data-file="' + encodeURIComponent(node.source_file) + '">' + escapeHtml(node.source_file) + '</div>' : '') +
        '</div>'
      ).join('') || '<div class="item">No matched nodes.</div>';

      document.getElementById('flows').innerHTML = data.flows.map(flow =>
        '<div class="item">' +
        '<strong>#' + flow.id + ' ' + escapeHtml(flow.name) + '</strong>' +
        '<div>criticality ' + flow.criticality + ' | ' + flow.nodeCount + ' nodes | ' + flow.matchedNodeCount + ' matched</div>' +
        '</div>'
      ).join('') || '<div class="item">No affected flows.</div>';

      document.querySelectorAll('.file').forEach(el => {
        el.addEventListener('click', () => vscode.postMessage({ command: 'openFile', file: decodeURIComponent(el.dataset.file) }));
      });
      renderSvg(data);
    }

    function renderSvg(data) {
      const svg = document.getElementById('graph');
      const width = svg.clientWidth || 800;
      const height = 520;
      const cx = width * 0.24;
      const cy = height / 2;
      const flowX = width * 0.68;
      const flows = data.flows.slice(0, 12);
      const spacing = flows.length > 1 ? Math.min(44, 420 / (flows.length - 1)) : 0;
      const startY = cy - spacing * (flows.length - 1) / 2;
      let html = '<circle class="target" cx="' + cx + '" cy="' + cy + '" r="34"></circle>' +
        '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">file</text>';
      flows.forEach((flow, index) => {
        const y = startY + index * spacing;
        html += '<line x1="' + (cx + 38) + '" y1="' + cy + '" x2="' + (flowX - 48) + '" y2="' + y + '"></line>' +
          '<circle class="flow" cx="' + flowX + '" cy="' + y + '" r="28"></circle>' +
          '<text x="' + flowX + '" y="' + (y + 4) + '" text-anchor="middle">#' + flow.id + '</text>';
      });
      svg.innerHTML = html;
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let i = 0; i < 32; i++) value += chars.charAt(Math.floor(Math.random() * chars.length));
  return value;
}
