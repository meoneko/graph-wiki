import type * as vscode from 'vscode';

export function renderBlastRadiusWebview(webview: vscode.Webview): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>CRG Blast Radius</title>
  <style>
    :root {
      --panel: var(--vscode-editorWidget-background);
      --border: var(--vscode-panel-border);
      --muted: var(--vscode-descriptionForeground);
      --accent: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --soft: var(--vscode-button-secondaryBackground);
      --orange: var(--vscode-charts-orange);
      --blue: var(--vscode-charts-blue);
      --green: var(--vscode-charts-green);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 18px;
      color: var(--vscode-editor-foreground);
      background: radial-gradient(circle at top left, rgba(60, 130, 220, .16), transparent 34rem), var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
    }
    button, input { font: inherit; }
    button {
      border: 0;
      border-radius: 6px;
      padding: 7px 10px;
      color: var(--accent-fg);
      background: var(--accent);
      cursor: pointer;
    }
    button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--soft); }
    button:disabled { opacity: .5; cursor: not-allowed; }
    input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
    }
    .hidden { display: none !important; }
    .shell { display: grid; gap: 14px; }
    .summary {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: color-mix(in srgb, var(--panel) 88%, transparent);
    }
    .file-name { font-size: 18px; font-weight: 700; }
    .path { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
    .actions { display: flex; align-items: flex-start; gap: 8px; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 999px;
      color: var(--vscode-editor-foreground);
      background: var(--soft);
      white-space: nowrap;
    }
    .pill.warn { color: var(--vscode-inputValidation-warningForeground); background: var(--vscode-inputValidation-warningBackground); }
    .layout {
      display: grid;
      grid-template-columns: minmax(280px, 380px) minmax(420px, 1fr);
      gap: 14px;
      min-height: 640px;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 10px;
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      overflow: hidden;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .card-head h3 { margin: 0; font-size: 14px; letter-spacing: .02em; text-transform: uppercase; }
    .nodes-toolbar { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .list { max-height: 560px; overflow: auto; }
    .item {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
    }
    .item:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }
    .item.selected { outline: 1px solid var(--accent); background: color-mix(in srgb, var(--accent) 20%, transparent); }
    .item:last-child { border-bottom: 0; }
    .label { font-weight: 700; overflow-wrap: anywhere; }
    .meta { margin-top: 4px; color: var(--muted); font-size: 12px; }
    .file-link { color: var(--vscode-textLink-foreground); cursor: pointer; overflow-wrap: anywhere; }
    .node-detail { padding: 12px; border-top: 1px solid var(--border); display: grid; gap: 8px; }
    .main { display: grid; grid-template-rows: auto auto minmax(260px, 1fr); gap: 14px; }
    svg {
      width: 100%;
      height: 300px;
      border-bottom: 1px solid var(--border);
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--border) 32%, transparent) 1px, transparent 1px),
        linear-gradient(0deg, color-mix(in srgb, var(--border) 24%, transparent) 1px, transparent 1px);
      background-size: 42px 42px;
    }
    text { fill: var(--vscode-editor-foreground); font-size: 11px; }
    line { stroke: var(--vscode-editorLineNumber-foreground); stroke-width: 1.5; }
    .flow-circle { fill: var(--orange); }
    .file-circle { fill: var(--blue); }
    .lane-circle { fill: var(--green); }
    .flow-list { max-height: 210px; overflow: auto; }
    .empty {
      padding: 18px;
      color: var(--muted);
      line-height: 1.45;
    }
    .trace {
      display: grid;
      grid-template-columns: 1fr minmax(170px, .75fr) 1fr;
      gap: 12px;
      padding: 12px;
    }
    .lane {
      min-height: 220px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .lane-title {
      padding: 8px 10px;
      font-weight: 700;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--soft) 60%, transparent);
    }
    .lane-body { max-height: 310px; overflow: auto; }
    .target-box {
      align-self: start;
      padding: 12px;
      border: 1px solid var(--accent);
      border-radius: 10px;
      background: color-mix(in srgb, var(--accent) 18%, transparent);
    }
    #loading, #error {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--panel);
    }
    @media (max-width: 900px) {
      .layout, .trace, .summary { grid-template-columns: 1fr; }
      .actions { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div id="loading">Loading graph data...</div>
  <div id="error" class="hidden"></div>
  <main id="content" class="shell hidden">
    <section id="summary" class="summary"></section>
    <section class="layout">
      <aside class="card">
        <div class="card-head"><h3>Matched Nodes</h3><span id="node-count" class="pill"></span></div>
        <div class="nodes-toolbar"><input id="node-filter" placeholder="Filter nodes..." /></div>
        <div id="nodes" class="list"></div>
        <div id="node-detail" class="node-detail hidden"></div>
      </aside>
      <section class="main">
        <section class="card">
          <div class="card-head"><h3>Affected Flows</h3><span id="flow-count" class="pill"></span></div>
          <svg id="flow-graph" role="img" aria-label="Affected flows graph"></svg>
          <div id="flows" class="flow-list"></div>
        </section>
        <section id="no-flow" class="card hidden"></section>
        <section id="trace-card" class="card hidden">
          <div class="card-head"><h3>Node Flow Trace</h3><span id="trace-status" class="pill"></span></div>
          <div id="trace" class="trace"></div>
        </section>
      </section>
    </section>
  </main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const state = {
      targetFile: '',
      matchedNodes: [],
      flows: [],
      selectedNodeId: undefined,
      selectedFlowId: undefined,
      trace: undefined,
      filterText: '',
      warning: undefined,
      status: 'OK',
      codes: [],
      highestCriticality: 0
    };

    const els = {
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      content: document.getElementById('content'),
      summary: document.getElementById('summary'),
      nodes: document.getElementById('nodes'),
      nodeCount: document.getElementById('node-count'),
      nodeFilter: document.getElementById('node-filter'),
      nodeDetail: document.getElementById('node-detail'),
      flowCount: document.getElementById('flow-count'),
      flowGraph: document.getElementById('flow-graph'),
      flows: document.getElementById('flows'),
      noFlow: document.getElementById('no-flow'),
      traceCard: document.getElementById('trace-card'),
      traceStatus: document.getElementById('trace-status'),
      trace: document.getElementById('trace')
    };

    els.nodeFilter.addEventListener('input', () => {
      state.filterText = els.nodeFilter.value;
      renderNodes();
    });

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'setLoading') {
        state.targetFile = message.targetFile || state.targetFile;
        showLoading(message.message);
      }
      if (message.command === 'renderError') showError(message.message);
      if (message.command === 'renderBlastRadius') {
        Object.assign(state, message.data, { trace: undefined });
        state.selectedNodeId = pickInitialNode(state.matchedNodes, state.selectedNodeId);
        showContent();
        renderAll();
      }
      if (message.command === 'renderTrace') {
        state.trace = message.data;
        showContent();
        renderTrace();
      }
    });

    function showLoading(message) {
      els.loading.classList.remove('hidden');
      els.error.classList.add('hidden');
      els.content.classList.add('hidden');
      els.loading.textContent = message || 'Loading graph data...';
    }

    function showError(message) {
      els.loading.classList.add('hidden');
      els.content.classList.add('hidden');
      els.error.classList.remove('hidden');
      els.error.textContent = message || 'Unknown CRG error.';
    }

    function showContent() {
      els.loading.classList.add('hidden');
      els.error.classList.add('hidden');
      els.content.classList.remove('hidden');
    }

    function renderAll() {
      renderSummary();
      renderNodes();
      renderFlows();
      renderNoFlowState();
      renderTrace();
    }

    function renderSummary() {
      const codes = (state.codes || []).join(', ');
      els.summary.innerHTML =
        '<div>' +
          '<div class="file-name">' + escapeHtml(state.targetFileName || basename(state.targetFile)) + '</div>' +
          '<div class="path" title="' + escapeAttr(state.targetFile) + '">' + escapeHtml(state.targetFile) + '</div>' +
          '<div class="pills">' +
            '<span class="pill">status ' + escapeHtml(state.status || 'OK') + '</span>' +
            '<span class="pill">' + state.matchedNodes.length + ' matched nodes</span>' +
            '<span class="pill">' + state.flows.length + ' affected flows</span>' +
            '<span class="pill">highest criticality ' + formatNumber(state.highestCriticality || 0) + '</span>' +
            (codes ? '<span class="pill warn">' + escapeHtml(codes) + '</span>' : '') +
            (state.warning ? '<span class="pill warn">' + escapeHtml(state.warning) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="actions">' +
          '<button class="secondary" id="setup">Setup</button>' +
          '<button class="secondary" id="postprocess">Postprocess</button>' +
          '<button class="secondary" id="rebuild">Re-scan</button>' +
          '<button class="secondary" id="refresh">Refresh</button>' +
        '</div>';
      document.getElementById('setup')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'openSetup' });
      });
      document.getElementById('postprocess')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'runPostprocess' });
      });
      document.getElementById('rebuild')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'rebuildGraph' });
      });
      document.getElementById('refresh')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'refreshBlastRadius', targetFile: state.targetFile });
      });
    }

    function renderNodes() {
      const filter = state.filterText.trim().toLowerCase();
      const nodes = state.matchedNodes
        .slice()
        .sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')))
        .filter(node => !filter || String(node.label || '').toLowerCase().includes(filter) || String(node.source_file || '').toLowerCase().includes(filter));
      const visible = nodes.slice(0, 50);
      els.nodeCount.textContent = visible.length + ' / ' + state.matchedNodes.length;
      els.nodes.innerHTML = visible.map(node =>
        '<div class="item ' + (node.id === state.selectedNodeId ? 'selected' : '') + '" data-node-id="' + escapeAttr(node.id) + '">' +
          '<div class="label">' + escapeHtml(node.label) + '</div>' +
          '<div class="meta">' + escapeHtml([node.type, node.project].filter(Boolean).join(' · ')) + '</div>' +
          (node.source_file ? '<div class="file-link" data-file="' + escapeAttr(node.source_file) + '">' + escapeHtml(trimPath(node.source_file)) + '</div>' : '') +
        '</div>'
      ).join('') || '<div class="empty">No matched nodes.</div>';
      if (nodes.length > visible.length) {
        els.nodes.innerHTML += '<div class="empty">' + (nodes.length - visible.length) + ' more nodes hidden. Refine the filter.</div>';
      }
      els.nodes.querySelectorAll('[data-node-id]').forEach(el => {
        el.addEventListener('click', event => {
          const target = event.currentTarget;
          state.selectedNodeId = target.dataset.nodeId;
          renderNodes();
          renderNodeDetail();
        });
      });
      els.nodes.querySelectorAll('[data-file]').forEach(el => {
        el.addEventListener('click', event => {
          event.stopPropagation();
          vscode.postMessage({ command: 'openFile', file: event.currentTarget.dataset.file });
        });
      });
      renderNodeDetail();
    }

    function renderNodeDetail() {
      const node = state.matchedNodes.find(item => item.id === state.selectedNodeId);
      if (!node) {
        els.nodeDetail.classList.add('hidden');
        els.nodeDetail.innerHTML = '';
        return;
      }
      els.nodeDetail.classList.remove('hidden');
      els.nodeDetail.innerHTML =
        '<div class="label">' + escapeHtml(node.label) + '</div>' +
        '<div class="meta">' + escapeHtml(node.id) + '</div>' +
        (node.source_file ? '<div class="file-link" data-file="' + escapeAttr(node.source_file) + '">' + escapeHtml(node.source_file) + '</div>' : '') +
        '<button id="trace-node">Trace Node Flow</button>';
      document.getElementById('trace-node')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'traceNode', nodeId: node.id });
      });
      els.nodeDetail.querySelectorAll('[data-file]').forEach(el => {
        el.addEventListener('click', event => vscode.postMessage({ command: 'openFile', file: event.currentTarget.dataset.file }));
      });
    }

    function renderFlows() {
      els.flowCount.textContent = String(state.flows.length);
      const flows = state.flows.slice().sort((a, b) => (b.criticality || 0) - (a.criticality || 0));
      els.flows.innerHTML = flows.map(flow =>
        '<div class="item ' + (flow.id === state.selectedFlowId ? 'selected' : '') + '" data-flow-id="' + flow.id + '">' +
          '<div class="label">#' + flow.id + ' ' + escapeHtml(flow.name) + '</div>' +
          '<div class="meta">criticality ' + formatNumber(flow.criticality) + ' · ' + flow.nodeCount + ' nodes · ' + flow.matchedNodeCount + ' matched</div>' +
          (flow.projects?.length ? '<div class="meta">' + escapeHtml(flow.projects.join(', ')) + '</div>' : '') +
        '</div>'
      ).join('') || '<div class="empty">No affected flows for this file.</div>';
      els.flows.querySelectorAll('[data-flow-id]').forEach(el => {
        el.addEventListener('click', event => {
          state.selectedFlowId = Number(event.currentTarget.dataset.flowId);
          renderFlows();
          renderFlowGraph();
        });
      });
      renderFlowGraph();
    }

    function renderFlowGraph() {
      const width = els.flowGraph.clientWidth || 820;
      const height = 300;
      const centerY = height / 2;
      const fileX = 110;
      const flowX = Math.max(420, width - 180);
      const flows = state.flows.slice(0, 10);
      let html = '<circle class="file-circle" cx="' + fileX + '" cy="' + centerY + '" r="34"></circle>' +
        '<text x="' + fileX + '" y="' + (centerY + 4) + '" text-anchor="middle">file</text>';
      if (!flows.length) {
        html += '<text x="' + (width / 2) + '" y="' + centerY + '" text-anchor="middle">No flow memberships. Select a node and trace local call-flow.</text>';
        els.flowGraph.innerHTML = html;
        return;
      }
      const spacing = flows.length > 1 ? Math.min(44, 240 / (flows.length - 1)) : 0;
      const startY = centerY - spacing * (flows.length - 1) / 2;
      flows.forEach((flow, index) => {
        const y = startY + index * spacing;
        const selected = flow.id === state.selectedFlowId;
        html += '<line x1="' + (fileX + 40) + '" y1="' + centerY + '" x2="' + (flowX - 70) + '" y2="' + y + '"></line>' +
          '<circle class="flow-circle" cx="' + flowX + '" cy="' + y + '" r="' + (selected ? 33 : 28) + '"></circle>' +
          '<text x="' + flowX + '" y="' + (y + 4) + '" text-anchor="middle">#' + flow.id + '</text>' +
          '<text x="' + (flowX - 76) + '" y="' + (y + 4) + '" text-anchor="end">' + escapeHtml(shortLabel(flow.name, 36)) + '</text>';
      });
      if (state.flows.length > flows.length) {
        html += '<text x="' + flowX + '" y="' + (height - 18) + '" text-anchor="middle">+' + (state.flows.length - flows.length) + ' more flows</text>';
      }
      els.flowGraph.innerHTML = html;
    }

    function renderNoFlowState() {
      if (state.flows.length || !state.matchedNodes.length) {
        els.noFlow.classList.add('hidden');
        els.noFlow.innerHTML = '';
        return;
      }
      els.noFlow.classList.remove('hidden');
      els.noFlow.innerHTML =
        '<div class="empty">' +
          '<strong>No affected flow membership found.</strong><br />' +
          'The file still has matched graph nodes. Select a node on the left and use Trace Node Flow to inspect local callers/callees without depending on postprocess flow membership.' +
        '</div>';
    }

    function renderTrace() {
      if (!state.trace) {
        els.traceCard.classList.add('hidden');
        els.trace.innerHTML = '';
        return;
      }
      els.traceCard.classList.remove('hidden');
      els.traceStatus.textContent = (state.trace.status || 'OK') + (state.trace.codes?.length ? ' · ' + state.trace.codes.join(', ') : '');
      const target = state.trace.target || state.matchedNodes.find(node => node.id === state.trace.nodeId);
      els.trace.innerHTML =
        renderLane('Upstream callers', state.trace.upstream, 'upstream') +
        '<div class="target-box">' +
          '<div class="label">' + escapeHtml(target?.label || state.trace.nodeId) + '</div>' +
          '<div class="meta">' + escapeHtml([target?.type, target?.project, target?.graph_kind, target?.trust_level].filter(Boolean).join(' · ')) + '</div>' +
          (target?.source_file ? '<div class="file-link" data-file="' + escapeAttr(target.source_file) + '">' + escapeHtml(trimPath(target.source_file)) + '</div>' : '') +
        '</div>' +
        renderLane('Downstream callees', state.trace.downstream, 'downstream');
      els.trace.querySelectorAll('[data-file]').forEach(el => {
        el.addEventListener('click', event => vscode.postMessage({ command: 'openFile', file: event.currentTarget.dataset.file }));
      });
    }

    function renderLane(title, lane, key) {
      const nodes = lane?.nodes || [];
      const items = nodes.slice(0, 50).map(node =>
        '<div class="item">' +
          '<div class="label">' + escapeHtml(node.label) + '</div>' +
          '<div class="meta">' + escapeHtml([node.type, node.project, node.graph_kind, node.trust_level].filter(Boolean).join(' · ')) + '</div>' +
        '</div>'
      ).join('');
      return '<div class="lane">' +
        '<div class="lane-title">' + title + ' · ' + nodes.length + ' nodes</div>' +
        '<div class="lane-body">' +
          (items || '<div class="empty">No ' + key + ' nodes found.</div>') +
          (lane?.truncated ? '<div class="empty">... more nodes not shown (maxNodes reached)</div>' : '') +
        '</div>' +
      '</div>';
    }

    function pickInitialNode(nodes, current) {
      if (current && nodes.some(node => node.id === current)) return current;
      return nodes[0]?.id;
    }
    function basename(value) { return String(value || '').split(/[\\\\/]/).pop() || String(value || ''); }
    function trimPath(value) {
      const text = String(value || '');
      return text.length > 92 ? '...' + text.slice(-89) : text;
    }
    function shortLabel(value, max) {
      const text = String(value || '');
      return text.length > max ? text.slice(0, max - 3) + '...' : text;
    }
    function formatNumber(value) {
      const n = Number(value || 0);
      return Math.round(n * 100) / 100;
    }
    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }
    function escapeAttr(value) { return escapeHtml(value).split(String.fromCharCode(96)).join('&#96;'); }
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
