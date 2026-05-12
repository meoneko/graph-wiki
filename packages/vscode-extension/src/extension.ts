import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';

interface GraphNode {
  id: string;
  label?: string;
  type?: string;
  project?: string;
  domain?: string;
  source_file?: string;
  metadata?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  from_id: string;
  to_id: string;
  type?: string;
}

interface GraphArtifact {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface FlowNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: string;
}

const INITIAL_NODE_LIMIT = 150;

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

async function readGraph(root: string): Promise<GraphArtifact> {
  const graphRoot = path.join(root, 'knowledge', 'artifacts', 'workspaces');
  const workspaces = await fs.readdir(graphRoot);
  for (const workspace of workspaces) {
    const graphPath = path.join(graphRoot, workspace, 'graph', 'canonical.graph.json');
    try {
      const raw = await fs.readFile(graphPath, 'utf-8');
      const parsed = JSON.parse(raw) as GraphArtifact;
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed;
    } catch {
      // Try next workspace.
    }
  }
  throw new Error(`No canonical graph artifact found under ${graphRoot}`);
}

function containerKey(node: GraphNode): string {
  const derived = node.metadata?.derived_domain;
  if (typeof derived === 'string' && derived) return derived;
  if (node.domain) return node.domain;
  if (node.project) return node.project;
  const source = String(node.metadata?.source_file ?? '');
  const parts = source.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2]! : '~';
}

function selectInitialNodes(graph: GraphArtifact): GraphNode[] {
  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.from_id, (degree.get(edge.from_id) ?? 0) + 1);
    degree.set(edge.to_id, (degree.get(edge.to_id) ?? 0) + 1);
  }
  return [...graph.nodes]
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .slice(0, INITIAL_NODE_LIMIT);
}

async function layoutNodes(nodes: GraphNode[], edges: GraphEdge[]): Promise<FlowNode[]> {
  const fallback = (): FlowNode[] => nodes.map((node, index) => ({
    id: node.id,
    x: (index % 10) * 220 + 40,
    y: Math.floor(index / 10) * 120 + 40,
    width: 180,
    height: 64,
    label: node.label ?? node.id,
    type: node.type ?? 'node',
  }));

  try {
    const elkModule = await import('elkjs/lib/elk.bundled.js');
    const ELK = (elkModule as any).default ?? elkModule;
    const elk = new ELK();
    const visibleIds = new Set(nodes.map((node) => node.id));
    const result = await elk.layout({
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '40',
      },
      children: nodes.map((node) => ({
        id: node.id,
        width: 180,
        height: 64,
        labels: [{ text: node.label ?? node.id }],
      })),
      edges: edges
        .filter((edge) => visibleIds.has(edge.from_id) && visibleIds.has(edge.to_id))
        .map((edge) => ({ id: edge.id, sources: [edge.from_id], targets: [edge.to_id] })),
    });
    return (result.children ?? []).map((child: any) => {
      const node = nodes.find((item) => item.id === child.id)!;
      return {
        id: child.id,
        x: child.x ?? 0,
        y: child.y ?? 0,
        width: child.width ?? 180,
        height: child.height ?? 64,
        label: node.label ?? node.id,
        type: node.type ?? 'node',
      };
    });
  } catch {
    return fallback();
  }
}

function renderHtml(graph: GraphArtifact, flowNodes: FlowNode[]): string {
  const containers = new Map<string, number>();
  for (const node of graph.nodes) {
    const key = containerKey(node);
    containers.set(key, (containers.get(key) ?? 0) + 1);
  }
  const width = Math.max(1200, ...flowNodes.map((node) => node.x + node.width + 80));
  const height = Math.max(800, ...flowNodes.map((node) => node.y + node.height + 80));
  const initialFlowNodesJson = safeScriptJson(flowNodes);
  const graphJson = safeScriptJson(graph);
  const containerList = [...containers.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `<button class="container-button" data-container="${escapeHtml(name)}">${escapeHtml(name)} <span>${count}</span></button>`)
    .join('');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #0f1419; color: #d8e2ec; font-family: ui-sans-serif, system-ui; }
    header { padding: 12px 16px; border-bottom: 1px solid #26313c; display: flex; gap: 16px; align-items: center; }
    .shell { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 50px); }
    aside { border-right: 1px solid #26313c; padding: 12px; overflow: auto; background: #111922; }
    button { width: 100%; margin: 4px 0; padding: 8px; text-align: left; background: #182434; color: #d8e2ec; border: 1px solid #2b3a4d; border-radius: 8px; }
    button:hover { border-color: #5ca0d3; }
    button span { float: right; color: #8fb3d9; }
    main { overflow: auto; }
    svg { background: radial-gradient(circle at 30% 20%, #172536, #0f1419 55%); }
    .node rect { fill: #16283a; stroke: #5ca0d3; stroke-width: 1.2; }
    .node text { fill: #eff6ff; font-size: 12px; pointer-events: none; }
    .node .type { fill: #9fb4c8; font-size: 10px; }
  </style>
</head>
<body>
  <header>
    <strong>Code Review Graph</strong>
    <span id="node-count">${flowNodes.length}/${graph.nodes.length} nodes rendered. Initial cap: ${INITIAL_NODE_LIMIT}.</span>
    <span id="edge-count">0/${graph.edges.length} visible edges.</span>
  </header>
  <div class="shell">
    <aside><h3>Lazy Containers</h3><button id="reset-view">Top ${INITIAL_NODE_LIMIT}</button>${containerList}</aside>
    <main><svg id="graph" width="${width}" height="${height}"></svg></main>
  </div>
  <script>
    const graph = ${graphJson};
    const initialFlowNodes = ${initialFlowNodesJson};
    const initialLimit = ${INITIAL_NODE_LIMIT};
    const layoutCache = new Map([['__initial__', initialFlowNodes]]);

    function esc(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[char]));
    }

    function containerKey(node) {
      const derived = node.metadata && node.metadata.derived_domain;
      if (typeof derived === 'string' && derived) return derived;
      if (node.domain) return node.domain;
      if (node.project) return node.project;
      const source = String(node.source_file || (node.metadata && node.metadata.source_file) || '');
      const parts = source.replace(/\\\\/g, '/').split('/').filter(Boolean);
      return parts.length > 1 ? parts[parts.length - 2] : '~';
    }

    function gridLayout(nodes) {
      return nodes.slice(0, initialLimit).map((node, index) => ({
        id: node.id,
        x: (index % 10) * 220 + 40,
        y: Math.floor(index / 10) * 120 + 40,
        width: 180,
        height: 64,
        label: node.label || node.id,
        type: node.type || 'node',
      }));
    }

    function render(flowNodes) {
      const visibleIds = new Set(flowNodes.map((node) => node.id));
      const visibleEdges = graph.edges.filter((edge) => visibleIds.has(edge.from_id) && visibleIds.has(edge.to_id));
      const byId = new Map(flowNodes.map((node) => [node.id, node]));
      const width = Math.max(1200, ...flowNodes.map((node) => node.x + node.width + 80));
      const height = Math.max(800, ...flowNodes.map((node) => node.y + node.height + 80));
      const svg = document.getElementById('graph');
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      const edgeLines = visibleEdges.map((edge) => {
        const from = byId.get(edge.from_id);
        const to = byId.get(edge.to_id);
        if (!from || !to) return '';
        return '<line x1="' + (from.x + from.width) + '" y1="' + (from.y + from.height / 2) + '" x2="' + to.x + '" y2="' + (to.y + to.height / 2) + '" stroke="#8aa" stroke-width="1" opacity="0.45" />';
      }).join('');
      const nodeRects = flowNodes.map((node) => '<g class="node" data-id="' + esc(node.id) + '"><rect x="' + node.x + '" y="' + node.y + '" width="' + node.width + '" height="' + node.height + '" rx="10"></rect><text x="' + (node.x + 12) + '" y="' + (node.y + 24) + '">' + esc(String(node.label).slice(0, 28)) + '</text><text class="type" x="' + (node.x + 12) + '" y="' + (node.y + 46) + '">' + esc(node.type) + '</text></g>').join('');
      svg.innerHTML = edgeLines + nodeRects;
      document.getElementById('node-count').textContent = flowNodes.length + '/' + graph.nodes.length + ' nodes rendered. Initial cap: ' + initialLimit + '.';
      document.getElementById('edge-count').textContent = visibleEdges.length + '/' + graph.edges.length + ' visible edges.';
    }

    function showContainer(name) {
      if (!layoutCache.has(name)) {
        layoutCache.set(name, gridLayout(graph.nodes.filter((node) => containerKey(node) === name)));
      }
      render(layoutCache.get(name));
    }

    document.getElementById('reset-view').addEventListener('click', () => render(layoutCache.get('__initial__')));
    for (const button of document.querySelectorAll('.container-button')) {
      button.addEventListener('click', () => showContainer(button.dataset.container));
    }
    render(initialFlowNodes);
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]!));
}

function safeScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function showGraphWebview(context: vscode.ExtensionContext): Promise<void> {
  const root = workspaceRoot();
  if (!root) {
    vscode.window.showWarningMessage('Open a workspace before showing the CRG graph.');
    return;
  }
  const graph = await readGraph(root);
  const initialNodes = selectInitialNodes(graph);
  const flowNodes = await layoutNodes(initialNodes, graph.edges);
  const panel = vscode.window.createWebviewPanel('crgGraph', 'Code Review Graph', vscode.ViewColumn.Beside, {
    enableScripts: true,
    retainContextWhenHidden: true,
  });
  panel.webview.html = renderHtml(graph, flowNodes);
}

export function activate(context: vscode.ExtensionContext): void {
  const blast = vscode.commands.registerCommand('crg.showBlastRadius', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }
    const root = workspaceRoot();
    if (!root) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    try {
      const graph = await readGraph(root);
      const filePath = editor.document.uri.fsPath.replace(/\\/g, '/');
      const fileName = filePath.split('/').pop() ?? '';

      // Find all nodes that originate from this file
      const fileNodes = graph.nodes.filter((n) => {
        const src = String(n.source_file ?? '').replace(/\\/g, '/');
        return src === filePath || src.endsWith('/' + fileName);
      });
      if (fileNodes.length === 0) {
        vscode.window.showInformationMessage(`No graph nodes found for: ${path.basename(editor.document.uri.fsPath)}`);
        return;
      }

      // BFS through outbound edges to compute blast radius
      const edgesByFrom = new Map<string, GraphEdge[]>();
      for (const edge of graph.edges) {
        const list = edgesByFrom.get(edge.from_id) ?? [];
        list.push(edge);
        edgesByFrom.set(edge.from_id, list);
      }
      const blastIds = new Set<string>(fileNodes.map((n) => n.id));
      const queue = [...blastIds];
      while (queue.length > 0) {
        const id = queue.shift()!;
        for (const edge of edgesByFrom.get(id) ?? []) {
          if (!blastIds.has(edge.to_id)) {
            blastIds.add(edge.to_id);
            queue.push(edge.to_id);
          }
        }
      }

      const blastGraph: GraphArtifact = {
        nodes: graph.nodes.filter((n) => blastIds.has(n.id)),
        edges: graph.edges.filter((e) => blastIds.has(e.from_id) && blastIds.has(e.to_id)),
      };
      const initialNodes = selectInitialNodes(blastGraph);
      const flowNodes = await layoutNodes(initialNodes, blastGraph.edges);
      const panel = vscode.window.createWebviewPanel(
        'crgBlastRadius',
        `Blast Radius: ${path.basename(editor.document.uri.fsPath)}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true },
      );
      panel.webview.html = renderHtml(blastGraph, flowNodes);
    } catch (error) {
      vscode.window.showErrorMessage(`Blast radius error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  const graph = vscode.commands.registerCommand('crg.showGraph', async () => {
    try {
      await showGraphWebview(context);
    } catch (error) {
      vscode.window.showErrorMessage(`Unable to show CRG graph: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(blast, graph);
}

export function deactivate(): void {
  return;
}
