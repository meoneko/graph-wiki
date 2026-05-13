import * as vscode from 'vscode';
import { resultErrorSummary, type CrgMcpService, type QueryResult } from '../services/CrgMcpService';
import {
  getSetupSettings,
  loadWorkspaceCandidates,
  pathExists,
  saveSetupSettings,
  type CrgSetupSettings,
  type WorkspaceCandidate,
} from '../services/CrgConfig';

export class SetupPanel {
  private static currentPanel?: SetupPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private serverWorkspaces?: WorkspaceCandidate[];

  static render(extensionUri: vscode.Uri, service: CrgMcpService, reason?: string): void {
    if (SetupPanel.currentPanel) {
      SetupPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      void SetupPanel.currentPanel.sendInitialState(reason);
      return;
    }
    const panel = vscode.window.createWebviewPanel('crgSetup', 'Code Review Graph Setup', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [extensionUri],
    });
    SetupPanel.currentPanel = new SetupPanel(panel, service, reason);
  }

  private constructor(private readonly panel: vscode.WebviewPanel, private readonly service: CrgMcpService, reason?: string) {
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.webviewHtml(this.panel.webview);
    this.panel.webview.onDidReceiveMessage((message) => void this.handleMessage(message), null, this.disposables);
    void this.sendInitialState(reason);
  }

  private dispose(): void {
    SetupPanel.currentPanel = undefined;
    while (this.disposables.length) this.disposables.pop()?.dispose();
  }

  private async handleMessage(message: Record<string, unknown>): Promise<void> {
    try {
      switch (message?.command) {
        case 'browseServerPath':
          return this.browseServerPath();
        case 'testConnection':
          return this.testConnection(String(message.serverPath ?? ''), String(message.serverCwd ?? ''));
        case 'saveSettings':
          return this.saveSettings((message.settings ?? {}) as Partial<CrgSetupSettings>);
        case 'loadWorkspaces':
          return this.sendWorkspaces();
        case 'loadGraphState':
          return this.loadGraphState();
        case 'buildGraph':
          return this.runOperation('buildGraph', () => this.service.buildGraph());
        case 'runPostprocess':
          return this.runOperation('runPostprocess', () => this.service.runPostprocess());
        case 'generateAgentContext':
          return vscode.commands.executeCommand('crg.generateAgentContext');
        case 'openSettings':
          return vscode.commands.executeCommand('crg.openSettings');
      }
    } catch (error) {
      await this.post('error', { message: errorMessage(error) });
    }
  }

  private async sendInitialState(reason?: string): Promise<void> {
    const state = await this.computeState(reason);
    await this.post('initialState', state);
    if (state.settings.serverPath && await pathExists(state.settings.serverPath)) {
      await this.sendServerWorkspaces(state.settings.serverPath, state.settings.serverCwd, Boolean(state.settings.workspaceId))
        .then(async () => this.post('connectionResult', { status: 'connected', connected: true }))
        .catch((error) => void this.post('error', { message: errorMessage(error) }));
    }
  }

  private async computeState(reason?: string): Promise<Record<string, unknown> & { settings: CrgSetupSettings; workspaces: WorkspaceCandidate[] }> {
    const settings = getSetupSettings();
    const workspaces = this.serverWorkspaces ?? await loadWorkspaceCandidates();
    if (!settings.serverPath) return { settings, workspaces, status: 'missing_server_path', connected: false, error: reason };
    if (!(await pathExists(settings.serverPath))) return { settings, workspaces, status: 'server_path_not_found', connected: false, error: reason ?? settings.serverPath };
    if (!settings.workspaceId && workspaces.length !== 1) return { settings, workspaces, status: 'workspace_required', connected: false, error: reason };
    return { settings, workspaces, status: 'ready', connected: false, error: reason };
  }

  private async browseServerPath(): Promise<void> {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      title: 'Select CRG dist/cli/index.js',
      filters: { JavaScript: ['js'] },
    });
    if (picked?.[0]) await this.post('serverPathSelected', { serverPath: picked[0].fsPath });
  }

  private async testConnection(serverPath: string, serverCwd: string): Promise<void> {
    if (!serverPath.trim()) return this.post('connectionResult', { status: 'missing_server_path', connected: false });
    if (!(await pathExists(serverPath))) return this.post('connectionResult', { status: 'server_path_not_found', connected: false, error: serverPath });
    try {
      await this.service.testConnection(serverPath, serverCwd);
      await this.post('connectionResult', { status: 'connected', connected: true });
      await this.sendServerWorkspaces(serverPath, serverCwd);
    } catch (error) {
      await this.post('connectionResult', { status: 'connection_failed', connected: false, error: errorMessage(error) });
    }
  }

  private async saveSettings(raw: Partial<CrgSetupSettings>): Promise<void> {
    const serverPath = raw.serverPath ?? '';
    const serverCwd = raw.serverCwd ?? '';
    await this.service.testConnection(serverPath, serverCwd);
    const workspaces = await this.service.listServerWorkspaces(serverPath, serverCwd);
    const workspaceId = raw.workspaceId ?? '';
    if (!workspaceId) throw new Error('Workspace ID is required before saving CRG settings.');
    if (!workspaces.some((workspace) => workspace.id === workspaceId)) throw new Error(`Workspace ${workspaceId} was not returned by the MCP server.`);

    await saveSetupSettings({
      serverPath,
      serverCwd,
      workspaceId,
      projectId: raw.projectId ?? '',
      maxItems: Number(raw.maxItems ?? 50),
    });
    await this.service.reconnect();
    this.serverWorkspaces = workspaces;
    await this.post('connectionResult', { status: 'connected', connected: true });
    await this.post('workspaceList', { workspaces, source: 'server', saved: true });
    await this.loadGraphState();
  }

  private async sendWorkspaces(): Promise<void> {
    await this.post('workspaceList', { workspaces: await loadWorkspaceCandidates() });
  }

  private async sendServerWorkspaces(serverPath: string, serverCwd: string, saved = false): Promise<void> {
    const workspaces = await this.service.listServerWorkspaces(serverPath, serverCwd);
    this.serverWorkspaces = workspaces;
    await this.post('workspaceList', { workspaces, source: 'server', saved });
  }

  private async loadGraphState(): Promise<void> {
    const result = await this.service.loadGraphState();
    if (result.status !== 'OK' && result.status !== 'PARTIAL') {
      await this.post('graphState', { status: result.status, error: resultErrorSummary(result) });
      return;
    }
    await this.post('graphState', { status: result.status, stats: result.data?.stats, dimensions: result.data?.dimensions });
  }

  private async runOperation(name: string, operation: () => Promise<QueryResult>): Promise<void> {
    await this.post('operationStarted', { operation: name });
    try {
      const result = await operation();
      await this.post('operationFinished', {
        operation: name,
        status: result.status,
        error: result.status === 'OK' || result.status === 'PARTIAL' ? undefined : resultErrorSummary(result),
        metadata: result.metadata,
      });
      if (result.status === 'OK' || result.status === 'PARTIAL') await this.loadGraphState();
    } catch (error) {
      await this.post('operationFinished', { operation: name, status: 'FAILED', error: errorMessage(error) });
    }
  }

  private async post(command: string, payload: Record<string, unknown>): Promise<void> {
    await this.panel.webview.postMessage({ command, ...payload });
  }

  private webviewHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>CRG Setup</title>
  <style>
    body { padding: 20px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 14px; background: var(--vscode-editorWidget-background); }
    label { display: block; margin: 10px 0 4px; }
    input, select { width: 100%; box-sizing: border-box; padding: 6px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); }
    button { margin: 10px 8px 0 0; padding: 6px 10px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; border-radius: 3px; cursor: pointer; }
    button:disabled { opacity: .45; cursor: not-allowed; }
    .secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .status { margin-top: 8px; padding: 8px; border-radius: 5px; background: var(--vscode-textBlockQuote-background); }
    .error { color: var(--vscode-errorForeground); }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(100px,1fr)); gap: 8px; }
    .stat { padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 5px; }
    pre { white-space: pre-wrap; max-height: 220px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Code Review Graph Setup</h1>
  <div class="grid">
    <section class="card">
      <h2>MCP Server</h2>
      <label for="serverPath">crg.serverPath</label><input id="serverPath" />
      <label for="serverCwd">crg.serverCwd (optional)</label><input id="serverCwd" />
      <button id="browse" class="secondary">Browse...</button><button id="test">Test Connection</button><button id="openSettings" class="secondary">Open VS Code Settings</button>
      <div id="connection" class="status">Not tested</div>
    </section>
    <section class="card">
      <h2>Workspace</h2>
      <label for="workspaceId">Workspace ID</label><select id="workspaceId"></select>
      <label for="projectId">Project ID (optional)</label><input id="projectId" />
      <label for="maxItems">Max Items</label><input id="maxItems" type="number" min="1" max="500" />
      <button id="save">Save Settings</button>
    </section>
  </div>
  <section class="card" style="margin-top:16px">
    <h2>Graph State</h2>
    <button id="loadGraph">Load Graph State</button><button id="build">Build Graph</button><button id="postprocess">Run Postprocess</button><button id="generateAgentContext">Generate Agent Context</button>
    <div id="graphState" class="status">No graph state loaded</div>
  </section>
  <section class="card" style="margin-top:16px"><h2>Diagnostics</h2><pre id="diagnostics"></pre></section>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const state = { connected: false, operationRunning: false, saved: false, dirty: true };
    const el = id => document.getElementById(id);
    const commands = { browse:'browseServerPath', openSettings:'openSettings', loadGraph:'loadGraphState', build:'buildGraph', postprocess:'runPostprocess', generateAgentContext:'generateAgentContext' };
    function handlers(){}
    handlers.browse = () => vscode.postMessage({ command: commands.browse });
    handlers.openSettings = () => vscode.postMessage({ command: commands.openSettings });
    handlers.loadGraph = () => vscode.postMessage({ command: commands.loadGraph });
    handlers.build = () => vscode.postMessage({ command: commands.build });
    handlers.postprocess = () => vscode.postMessage({ command: commands.postprocess });
    handlers.generateAgentContext = () => vscode.postMessage({ command: commands.generateAgentContext });
    handlers.test = () => vscode.postMessage({ command: 'testConnection', serverPath: el('serverPath').value, serverCwd: el('serverCwd').value });
    handlers.save = () => vscode.postMessage({ command: 'saveSettings', settings: readSettings() });
    ['browse','test','openSettings','save','loadGraph','build','postprocess','generateAgentContext'].forEach(id => el(id).addEventListener('click', handlers[id]));
    ['serverPath','serverCwd'].forEach(id => el(id).addEventListener('input', markDirtyAndDisconnect));
    ['workspaceId','projectId','maxItems'].forEach(id => el(id).addEventListener(id === 'workspaceId' ? 'change' : 'input', markDirty));
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'initialState') { applySettings(msg.settings); renderWorkspaces(msg.workspaces || []); writeDiagnostics(msg); setConnection(msg.connected, msg.status, msg.error); }
      if (msg.command === 'serverPathSelected') { el('serverPath').value = msg.serverPath; markDirtyAndDisconnect(); }
      if (msg.command === 'workspaceList') { renderWorkspaces(msg.workspaces || []); if (msg.saved) markSaved(); }
      if (msg.command === 'connectionResult') setConnection(Boolean(msg.connected), msg.status, msg.error);
      if (msg.command === 'graphState') renderGraphState(msg);
      if (msg.command === 'operationStarted') { state.operationRunning = true; updateButtons(); writeDiagnostics(msg); }
      if (msg.command === 'operationFinished') { state.operationRunning = false; updateButtons(); writeDiagnostics(msg); }
      if (msg.command === 'error') writeDiagnostics(msg);
    });
    function readSettings() { return { serverPath: el('serverPath').value, serverCwd: el('serverCwd').value, workspaceId: el('workspaceId').value, projectId: el('projectId').value, maxItems: Number(el('maxItems').value || 50) }; }
    function applySettings(settings) { el('serverPath').value = settings.serverPath || ''; el('serverCwd').value = settings.serverCwd || ''; el('projectId').value = settings.projectId || ''; el('maxItems').value = settings.maxItems || 50; el('workspaceId').dataset.selected = settings.workspaceId || ''; }
    function renderWorkspaces(workspaces) {
      let selected = el('workspaceId').dataset.selected || el('workspaceId').value; if (!selected && workspaces.length === 1) selected = workspaces[0].id;
      const knownIds = new Set(workspaces.map(ws => ws.id));
      const options = ['<option value="">Select workspace...</option>'].concat(workspaces.map(ws => '<option value="' + escapeHtml(ws.id) + '">' + escapeHtml(ws.label || ws.id) + '</option>'));
      if (selected && !knownIds.has(selected)) options.push('<option value="' + escapeHtml(selected) + '">' + escapeHtml(selected) + '</option>');
      el('workspaceId').innerHTML = options.join(''); if (selected) el('workspaceId').value = selected; updateButtons();
    }
    function setConnection(connected, status, error) { state.connected = connected; el('connection').innerHTML = connected ? '<strong>connected</strong>' : '<span class="error">' + escapeHtml(status || 'disconnected') + (error ? ': ' + escapeHtml(error) : '') + '</span>'; updateButtons(); }
    function markDirty() { state.dirty = true; state.saved = false; updateButtons(); }
    function markDirtyAndDisconnect() { state.connected = false; markDirty(); }
    function markSaved() { state.saved = true; state.dirty = false; updateButtons(); }
    function updateButtons() {
      const hasPath = Boolean(el('serverPath').value.trim()), hasWorkspace = Boolean(el('workspaceId').value.trim());
      el('test').disabled = !hasPath || state.operationRunning; el('save').disabled = !hasPath || !hasWorkspace || state.operationRunning;
      ['loadGraph','build','postprocess','generateAgentContext'].forEach(id => el(id).disabled = !state.connected || !state.saved || state.dirty || !hasWorkspace || state.operationRunning);
    }
    function renderGraphState(msg) {
      if (msg.error) { el('graphState').innerHTML = '<span class="error">' + escapeHtml(msg.error) + '</span>'; return; }
      const s = msg.stats || {}; el('graphState').innerHTML = '<div class="stats">' + stat('nodes', s.nodes) + stat('edges', s.edges) + stat('flows', s.flows) + stat('communities', s.communities) + stat('entrypoints', s.entrypoints) + '</div>'; writeDiagnostics({ graphState: msg });
    }
    function stat(name, value) { return '<div class="stat"><strong>' + escapeHtml(name) + '</strong><br>' + escapeHtml(value ?? 0) + '</div>'; }
    function writeDiagnostics(value) { el('diagnostics').textContent = JSON.stringify(value, null, 2); }
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
