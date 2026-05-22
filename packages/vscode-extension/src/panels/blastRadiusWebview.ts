import * as vscode from 'vscode';

// Define gorgeous, high-fidelity custom SVGs
const SVG_REFRESH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
const SVG_REBUILD = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
const SVG_POSTPROCESS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;
const SVG_SETTINGS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

const SVG_ZOOM_IN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
const SVG_ZOOM_OUT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
const SVG_ZOOM_FIT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
const SVG_GRAPH_MUTED = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--vscode-descriptionForeground)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;

export function renderBlastRadiusWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'blastRadius.css'));
  const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'blastRadius.js'));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
  <title>Blast Radius</title>
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <!-- Header Action Bar -->
  <div class="header-toolbar">
    <div class="breadcrumb">Code Review Graph &rsaquo; Blast Radius</div>
    <div class="actions">
      <button id="refresh" title="Refresh file data">${SVG_REFRESH} Refresh</button>
      <button id="rebuild" class="secondary" title="Rebuild and refresh database">${SVG_REBUILD} Rebuild Graph</button>
      <button id="postprocess" class="secondary" title="Re-run wiki postprocess">${SVG_POSTPROCESS} Postprocess</button>
      <button id="setup" class="secondary" title="Configure CRG">${SVG_SETTINGS} Setup</button>
    </div>
  </div>

  <div class="dashboard">
    <!-- Left Panel: Sidebar (Nodes & Flows) -->
    <aside class="sidebar">
      <div class="panel-section">
        <h3>Matched Nodes</h3>
        <div class="search-box">
          <input type="text" id="node-search" placeholder="Filter symbols..." />
        </div>
        <div id="matched-nodes-list" class="list-container"></div>
      </div>
      <div class="panel-section border-top">
        <h3>Affected Flows</h3>
        <div id="affected-flows-list" class="list-container"></div>
      </div>
    </aside>

    <!-- Right Panel: Canvas Visualizer -->
    <main class="canvas-panel">
      <!-- Floating Toolbar Controls -->
      <div class="canvas-controls">
        <button id="zoom-in" title="Zoom In">${SVG_ZOOM_IN}</button>
        <button id="zoom-out" title="Zoom Out">${SVG_ZOOM_OUT}</button>
        <button id="zoom-fit" title="Fit to View">${SVG_ZOOM_FIT}</button>
      </div>
      <!-- Large Pannable Drawing Board -->
      <div id="canvas-viewport" class="viewport">
        <div id="canvas-container" class="canvas-container">
          <svg id="svg-layer"></svg>
          <div id="html-layer"></div>
        </div>
      </div>
      <!-- Center Empty State / Welcome Screen -->
      <div id="empty-state" class="empty-state">
        <div class="empty-icon">${SVG_GRAPH_MUTED}</div>
        <h2>Blast Radius Explorer</h2>
        <p>Select a matched symbol from the list on the left to explore its dependency lineage.</p>
      </div>
      <!-- Canvas Loading Indicator State -->
      <div id="canvas-loader" class="canvas-loader hidden">
        <div class="spinner"></div>
        <p>Loading dependency lineage...</p>
      </div>
      <!-- Selection Detail Card overlay -->
      <div id="detail-overlay" class="detail-overlay hidden"></div>
    </main>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let i = 0; i < 32; i++) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
}
