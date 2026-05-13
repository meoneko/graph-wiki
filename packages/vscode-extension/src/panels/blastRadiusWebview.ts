import * as vscode from 'vscode';

export function renderBlastRadiusWebview(webview: vscode.Webview): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Blast Radius</title>
  <style>
    body { padding: 16px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); }
    button { margin: 0 8px 10px 0; padding: 6px 10px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; border-radius: 3px; cursor: pointer; }
    .secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .banner { padding: 10px; margin-bottom: 14px; border-radius: 6px; background: var(--vscode-editorWidget-background); }
    .error { color: var(--vscode-errorForeground); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 12px; background: var(--vscode-editorWidget-background); }
    .item { padding: 6px 0; border-top: 1px solid var(--vscode-panel-border); }
    .item:first-child { border-top: 0; }
    code { color: var(--vscode-textPreformat-foreground); }
    pre { white-space: pre-wrap; overflow: auto; max-height: 360px; }
  </style>
</head>
<body>
  <div>
    <button id="refresh">Refresh</button>
    <button id="rebuild" class="secondary">Rebuild Graph</button>
    <button id="postprocess" class="secondary">Run Postprocess</button>
    <button id="setup" class="secondary">Open Setup</button>
  </div>
  <div id="root" class="banner">Loading...</div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let targetFile = '';
    const root = document.getElementById('root');

    document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ command: 'refreshBlastRadius', targetFile }));
    document.getElementById('rebuild').addEventListener('click', () => vscode.postMessage({ command: 'rebuildGraph' }));
    document.getElementById('postprocess').addEventListener('click', () => vscode.postMessage({ command: 'runPostprocess' }));
    document.getElementById('setup').addEventListener('click', () => vscode.postMessage({ command: 'openSetup' }));

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'setLoading') {
        targetFile = msg.targetFile || targetFile;
        root.innerHTML = '<div class="banner">' + escapeHtml(msg.message || 'Loading blast radius...') + '</div>';
      }
      if (msg.command === 'renderError') {
        root.innerHTML = '<div class="banner error">' + escapeHtml(msg.message) + '</div>';
      }
      if (msg.command === 'renderBlastRadius') {
        renderBlastRadius(msg.data || {});
      }
      if (msg.command === 'renderTrace') {
        renderTrace(msg.data || {});
      }
    });

    function renderBlastRadius(data) {
      targetFile = data.targetFile || targetFile;
      const flows = Array.isArray(data.flows) ? data.flows : [];
      const nodes = Array.isArray(data.matchedNodes) ? data.matchedNodes : [];
      const warning = data.warning ? '<div class="banner error">' + escapeHtml(data.warning) + '</div>' : '';
      root.innerHTML = warning +
        '<h2>' + escapeHtml(data.targetFileName || targetFile || 'Blast radius') + '</h2>' +
        '<p>Status: <code>' + escapeHtml(data.status || 'UNKNOWN') + '</code> | matched nodes: ' + nodes.length + ' | flows: ' + flows.length + '</p>' +
        '<div class="grid"><section class="card"><h3>Matched Nodes</h3>' + renderNodes(nodes) + '</section>' +
        '<section class="card"><h3>Affected Flows</h3>' + renderFlows(flows) + '</section></div>';
    }

    function renderNodes(nodes) {
      if (!nodes.length) return '<p>No matched graph nodes.</p>';
      return nodes.map(node => '<div class="item"><button class="secondary trace-button" data-node-id="' + escapeHtml(node.id || '') + '">Trace</button><strong>' +
        escapeHtml(node.label || node.id) + '</strong><br><code>' + escapeHtml(node.type || '') + '</code><br>' +
        escapeHtml(node.source_file || '') + '</div>').join('');
    }

    function renderFlows(flows) {
      if (!flows.length) return '<p>No affected flows.</p>';
      return flows.map(flow => '<div class="item"><strong>' + escapeHtml(flow.name || flow.id) + '</strong><br>criticality ' +
        escapeHtml(flow.criticality || 0) + ' | nodes ' + escapeHtml(flow.nodeCount || flow.nodeIds?.length || 0) + '</div>').join('');
    }

    function renderTrace(data) {
      root.innerHTML += '<section class="card" style="margin-top:12px"><h3>Lineage: ' + escapeHtml(data.nodeId) +
        '</h3><pre>' + escapeHtml(JSON.stringify({ upstream: data.upstream, downstream: data.downstream, codes: data.factorCodes }, null, 2)) + '</pre></section>';
    }

    root.addEventListener('click', event => {
      const button = event.target && event.target.closest ? event.target.closest('.trace-button') : undefined;
      if (button && button.dataset.nodeId) vscode.postMessage({ command: 'traceNode', nodeId: button.dataset.nodeId });
    });
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  </script>
</body>
</html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let i = 0; i < 32; i++) value += chars.charAt(Math.floor(Math.random() * chars.length));
  return value;
}
