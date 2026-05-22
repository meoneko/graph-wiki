/* Blast Radius Visualizer Engine */

(function () {
  const vscode = acquireVsCodeApi();

  // DOM Elements
  const headerToolbar = document.querySelector('.header-toolbar');
  const matchedNodesList = document.getElementById('matched-nodes-list');
  const affectedFlowsList = document.getElementById('affected-flows-list');
  const nodeSearch = document.getElementById('node-search');
  const viewport = document.getElementById('canvas-viewport');
  const canvasContainer = document.getElementById('canvas-container');
  const svgLayer = document.getElementById('svg-layer');
  const htmlLayer = document.getElementById('html-layer');
  const emptyState = document.getElementById('empty-state');
  const canvasLoader = document.getElementById('canvas-loader');
  const detailOverlay = document.getElementById('detail-overlay');

  const btnZoomIn = document.getElementById('zoom-in');
  const btnZoomOut = document.getElementById('zoom-out');
  const btnZoomFit = document.getElementById('zoom-fit');

  const btnRefresh = document.getElementById('refresh');
  const btnRebuild = document.getElementById('rebuild');
  const btnPostprocess = document.getElementById('postprocess');
  const btnSetup = document.getElementById('setup');

  // Interactive Viewport States
  let zoomScale = 1.0;
  let panX = 100;
  let panY = 100;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Data Model States
  let matchedNodes = [];
  let affectedFlows = [];
  let activeFocalId = null;
  let activeLineage = null; // { target, upstream, downstream }

  // 1. Initial State Setup
  updateCanvasTransform();

  // 2. Global Webview Button Listeners
  btnRefresh.addEventListener('click', () => vscode.postMessage({ command: 'refreshBlastRadius' }));
  btnRebuild.addEventListener('click', () => vscode.postMessage({ command: 'rebuildGraph' }));
  btnPostprocess.addEventListener('click', () => vscode.postMessage({ command: 'runPostprocess' }));
  btnSetup.addEventListener('click', () => vscode.postMessage({ command: 'openSetup' }));

  // Zoom Toolbar Click Handlers
  btnZoomIn.addEventListener('click', () => {
    adjustZoom(0.15, viewport.clientWidth / 2, viewport.clientHeight / 2);
  });

  btnZoomOut.addEventListener('click', () => {
    adjustZoom(-0.15, viewport.clientWidth / 2, viewport.clientHeight / 2);
  });

  btnZoomFit.addEventListener('click', () => {
    fitToView();
  });

  // Search Filter Handler
  nodeSearch.addEventListener('input', (e) => {
    const filterText = e.target.value.toLowerCase().trim();
    renderMatchedNodes(filterText);
  });

  // 3. VS Code IPC Message Listener
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
      case 'renderBlastRadius':
        // Populates Left Sidebar lists
        matchedNodes = (message.data && message.data.matchedNodes) || [];
        affectedFlows = (message.data && message.data.flows) || [];
        renderMatchedNodes();
        renderAffectedFlows();

        // Auto-Trace first matched node on initial load if possible
        if (matchedNodes.length > 0 && !activeFocalId) {
          triggerTrace(matchedNodes[0].id);
        }
        break;

      case 'renderTrace':
        // Hides Loader, parses and draws visual graph
        canvasLoader.classList.add('hidden');
        emptyState.classList.add('hidden');
        detailOverlay.classList.add('hidden');

        activeFocalId = message.data && message.data.nodeId;
        activeLineage = message.data;

        renderVisualGraph();
        break;
    }
  });

  // 4. Trace Trigger helper
  function triggerTrace(nodeId) {
    activeFocalId = nodeId;
    // Show beautiful Loading Screen overlay
    canvasLoader.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Highlight corresponding active node in Left Sidebar list
    const items = matchedNodesList.querySelectorAll('.list-item');
    items.forEach(item => {
      if (item.dataset.id === nodeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    vscode.postMessage({ command: 'traceNode', nodeId });
  }

  // 5. Render Left Sidebar Lists
  function renderMatchedNodes(filter = '') {
    matchedNodesList.innerHTML = '';
    const filtered = matchedNodes.filter(n =>
      n.label.toLowerCase().includes(filter) ||
      (n.symbol && n.symbol.toLowerCase().includes(filter)) ||
      (n.source_file && n.source_file.toLowerCase().includes(filter))
    );

    if (filtered.length === 0) {
      matchedNodesList.innerHTML = `<div style="padding: 10px 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">No symbols found</div>`;
      return;
    }

    filtered.forEach(node => {
      const item = document.createElement('div');
      item.className = 'list-item';
      if (node.id === activeFocalId) item.classList.add('active');
      item.dataset.id = node.id;

      const typeBadge = node.type ? `<span class="badge ${node.type.toLowerCase()}" style="font-size: 8px; padding: 1px 4px; width: fit-content; margin-top: 4px;">${node.type}</span>` : '';

      item.innerHTML = `
        <div class="list-item-title">${escapeHtml(node.label)}</div>
        <div class="list-item-sub">${escapeHtml(node.source_file || '')}</div>
        ${typeBadge}
      `;

      item.addEventListener('click', () => triggerTrace(node.id));
      matchedNodesList.appendChild(item);
    });
  }

  function renderAffectedFlows() {
    affectedFlowsList.innerHTML = '';
    if (affectedFlows.length === 0) {
      affectedFlowsList.innerHTML = `<div style="padding: 10px 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">No affected flows mapped</div>`;
      return;
    }

    affectedFlows.forEach(flow => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="list-item-title" style="font-weight: 500;">${escapeHtml(flow.name || flow.id)}</div>
        <div class="list-item-sub">Trigger: ${escapeHtml(flow.trigger || 'N/A')}</div>
      `;
      item.addEventListener('click', () => {
        if (flow.trigger_node_id) {
          triggerTrace(flow.trigger_node_id);
        }
      });
      affectedFlowsList.appendChild(item);
    });
  }

  // 6. Visual Lineage Graph Drawing Engine (Option B BFS Columns)
  function renderVisualGraph() {
    if (!activeLineage) return;

    // Clear previous drawing elements
    htmlLayer.innerHTML = '';
    svgLayer.innerHTML = `
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--vscode-panel-border, #444)"></path>
        </marker>
        <marker id="arrow-glow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--vscode-focusBorder, #007acc)"></path>
        </marker>
      </defs>
    `;

    const targetNode = activeLineage.target;
    const upstream = activeLineage.upstream || { nodes: [], edges: [] };
    const downstream = activeLineage.downstream || { nodes: [], edges: [] };

    // Set of all unique nodes by ID
    const nodesMap = new Map();
    nodesMap.set(targetNode.id, { ...targetNode, isTarget: true });
    upstream.nodes.forEach(n => nodesMap.set(n.id, { ...n, isUpstream: true }));
    downstream.nodes.forEach(n => nodesMap.set(n.id, { ...n, isDownstream: true }));

    // Set of all unique edges by ID/from_id/to_id
    const edgesMap = new Map();
    upstream.edges.forEach(e => edgesMap.set(e.id || `${e.from_id}->${e.to_id}`, e));
    downstream.edges.forEach(e => edgesMap.set(e.id || `${e.from_id}->${e.to_id}`, e));

    const allNodes = Array.from(nodesMap.values());
    const allEdges = Array.from(edgesMap.values());

    // Compute BFS Column Ranks
    const ranks = new Map();
    ranks.set(targetNode.id, 0);

    // Upstream (Negative columns on the left)
    const upQueue = [targetNode.id];
    const visitedUp = new Set([targetNode.id]);
    while (upQueue.length > 0) {
      const currentId = upQueue.shift();
      const currentRank = ranks.get(currentId);
      // Find edges going into currentId
      const parentEdges = allEdges.filter(e => e.to_id === currentId);
      parentEdges.forEach(edge => {
        const parentId = edge.from_id;
        if (!visitedUp.has(parentId)) {
          visitedUp.add(parentId);
          ranks.set(parentId, currentRank - 1);
          upQueue.push(parentId);
        }
      });
    }

    // Downstream (Positive columns on the right)
    const downQueue = [targetNode.id];
    const visitedDown = new Set([targetNode.id]);
    while (downQueue.length > 0) {
      const currentId = downQueue.shift();
      const currentRank = ranks.get(currentId);
      // Find edges coming out of currentId
      const childEdges = allEdges.filter(e => e.from_id === currentId);
      childEdges.forEach(edge => {
        const childId = edge.to_id;
        if (!visitedDown.has(childId)) {
          visitedDown.add(childId);
          ranks.set(childId, currentRank + 1);
          downQueue.push(childId);
        }
      });
    }

    // Set fallback rank for unvisited nodes
    allNodes.forEach(node => {
      if (!ranks.has(node.id)) {
        ranks.set(node.id, node.isUpstream ? -1 : 1);
      }
    });

    // Group Nodes by Ranks
    const columns = new Map();
    allNodes.forEach(node => {
      const r = ranks.get(node.id);
      if (!columns.has(r)) columns.set(r, []);
      columns.get(r).push(node);
    });

    // Sort Ranks to render in correct order
    const sortedRanks = Array.from(columns.keys()).sort((a, b) => a - b);

    // Layout spacing constants
    const colSpacing = 300;
    const rowSpacing = 90;
    const nodeWidth = 220;
    const nodeHeight = 60;

    // Center coordinates inside virtual 5000px canvas
    const centerX = 2500;
    const centerY = 2500;

    // Map Node Positions
    const positions = new Map();
    sortedRanks.forEach(rank => {
      const colNodes = columns.get(rank);
      const x = centerX + rank * colSpacing - nodeWidth / 2;

      // Arrange nodes symmetrically around vertical center
      colNodes.forEach((node, idx) => {
        const totalHeight = (colNodes.length - 1) * rowSpacing;
        const y = centerY + (idx * rowSpacing) - (totalHeight / 2) - nodeHeight / 2;
        positions.set(node.id, { x, y });
      });
    });

    // Render HTML Node Cards
    allNodes.forEach(node => {
      const pos = positions.get(node.id);
      const card = document.createElement('div');
      card.className = 'node-card';
      if (node.isTarget) card.classList.add('focal');
      card.style.left = `${pos.x}px`;
      card.style.top = `${pos.y}px`;
      card.dataset.id = node.id;

      const typeBadge = node.type ? `<span class="badge ${node.type.toLowerCase()}">${node.type}</span>` : `<span class="badge other">Symbol</span>`;

      card.innerHTML = `
        <div class="node-header">
          <div class="node-title" title="${escapeHtml(node.label)}">${escapeHtml(node.label)}</div>
          ${typeBadge}
        </div>
        <div class="node-sub" title="${escapeHtml(node.source_file || '')}">${escapeHtml(node.source_file || '')}</div>
      `;

      // Open detail popup on card click
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetailCard(node);
      });

      // Traces node directly on Double Click!
      card.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        triggerTrace(node.id);
      });

      // Hover glow effects
      card.addEventListener('mouseenter', () => highlightConnectedPaths(node.id));
      card.addEventListener('mouseleave', () => clearPathHighlights());

      htmlLayer.appendChild(card);
    });

    // Draw SVG Connector Lines
    allEdges.forEach(edge => {
      const fromPos = positions.get(edge.from_id);
      const toPos = positions.get(edge.to_id);

      if (!fromPos || !toPos) return;

      // Calculate connection ports (Right edge of source, Left edge of target)
      const x1 = fromPos.x + nodeWidth;
      const y1 = fromPos.y + nodeHeight / 2;
      const x2 = toPos.x;
      const y2 = toPos.y + nodeHeight / 2;

      // Draw beautiful cubic bezier path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'edge-path edge-flow-animated');
      path.setAttribute('id', `edge-${edge.from_id}-${edge.to_id}`);
      path.setAttribute('d', `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`);
      path.setAttribute('marker-end', 'url(#arrow)');
      path.dataset.from = edge.from_id;
      path.dataset.to = edge.to_id;

      svgLayer.appendChild(path);
    });

    // Auto-center canvas on target node
    centerOnNode(targetNode.id);
  }

  // 7. Dynamic Pathway Highlighting
  function highlightConnectedPaths(nodeId) {
    // Dim all paths initially
    const paths = svgLayer.querySelectorAll('.edge-path');
    paths.forEach(p => {
      p.style.stroke = 'var(--vscode-panel-border)';
      p.style.strokeWidth = '1.5';
      p.setAttribute('marker-end', 'url(#arrow)');
    });

    // Dim all html cards except active
    const cards = htmlLayer.querySelectorAll('.node-card');
    cards.forEach(c => {
      if (c.dataset.id !== nodeId && c.dataset.id !== activeFocalId) {
        c.style.opacity = '0.5';
      }
    });

    // Highlight immediate connections
    paths.forEach(p => {
      if (p.dataset.from === nodeId || p.dataset.to === nodeId) {
        p.style.stroke = 'var(--vscode-focusBorder)';
        p.style.strokeWidth = '3px';
        p.setAttribute('marker-end', 'url(#arrow-glow)');

        // Restore connected cards opacity
        const connectedCard = htmlLayer.querySelector(`.node-card[data-id="${p.dataset.from === nodeId ? p.dataset.to : p.dataset.from}"]`);
        if (connectedCard) {
          connectedCard.style.opacity = '1';
        }
      }
    });
  }

  function clearPathHighlights() {
    const paths = svgLayer.querySelectorAll('.edge-path');
    paths.forEach(p => {
      p.style.stroke = '';
      p.style.strokeWidth = '';
      p.setAttribute('marker-end', 'url(#arrow)');
    });

    const cards = htmlLayer.querySelectorAll('.node-card');
    cards.forEach(c => {
      c.style.opacity = '';
    });
  }

  // 8. Visual Detail Overlay Popup
  function showDetailCard(node) {
    detailOverlay.innerHTML = '';
    detailOverlay.classList.remove('hidden');

    const projectRow = node.project ? `
      <div class="detail-row">
        <div class="detail-label">Project</div>
        <div class="detail-val">${escapeHtml(node.project)}</div>
      </div>` : '';

    const symbolRow = node.symbol ? `
      <div class="detail-row">
        <div class="detail-label">Symbol / Class</div>
        <div class="detail-val">${escapeHtml(node.symbol)}</div>
      </div>` : '';

    detailOverlay.innerHTML = `
      <h4>${escapeHtml(node.label)}</h4>
      ${projectRow}
      ${symbolRow}
      <div class="detail-row">
        <div class="detail-label">Source File</div>
        <div class="detail-val" style="font-family: monospace; font-size: 10px;">${escapeHtml(node.source_file || 'N/A')}</div>
      </div>
      <div class="detail-action">
        <button id="detail-btn-trace">Trace Lineage</button>
        <button id="detail-btn-open" class="secondary">Open File</button>
      </div>
    `;

    // Hook click triggers inside popup card
    document.getElementById('detail-btn-trace').addEventListener('click', () => {
      triggerTrace(node.id);
      detailOverlay.classList.add('hidden');
    });

    document.getElementById('detail-btn-open').addEventListener('click', () => {
      if (node.source_file) {
        vscode.postMessage({ command: 'openFile', file: node.source_file });
      }
    });
  }

  // Hide detail popup when clicking outer viewport
  viewport.addEventListener('click', () => {
    detailOverlay.classList.add('hidden');
  });

  // 9. Mathematically Bounded Viewport Zoom & Drag Pan Engine
  viewport.addEventListener('mousedown', (e) => {
    if (e.target !== viewport && e.target !== svgLayer && e.target.id !== 'canvas-container') return;
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateCanvasTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Mouse wheel zoom centered on cursor
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.05;
    const mouseX = e.clientX - viewport.getBoundingClientRect().left;
    const mouseY = e.clientY - viewport.getBoundingClientRect().top;

    const zoomFactor = e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
    adjustZoom(zoomFactor, mouseX, mouseY);
  }, { passive: false });

  function adjustZoom(factor, clientX, clientY) {
    const prevScale = zoomScale;
    zoomScale = Math.min(Math.max(zoomScale + factor, 0.25), 3.0);

    // Zoom relative to center/mouse position
    panX = clientX - (clientX - panX) * (zoomScale / prevScale);
    panY = clientY - (clientY - panY) * (zoomScale / prevScale);

    updateCanvasTransform();
  }

  function updateCanvasTransform() {
    canvasContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  }

  // Centering & fit boundaries
  function centerOnNode(nodeId) {
    const card = htmlLayer.querySelector(`.node-card[data-id="${nodeId}"]`);
    if (!card) return;

    const cardX = parseFloat(card.style.left);
    const cardY = parseFloat(card.style.top);
    const nodeW = 220;
    const nodeH = 60;

    // Viewport midpoints
    const viewW = viewport.clientWidth;
    const viewH = viewport.clientHeight;

    // Position container center aligned
    zoomScale = 1.0;
    panX = viewW / 2 - cardX - nodeW / 2;
    panY = viewH / 2 - cardY - nodeH / 2;

    updateCanvasTransform();
  }

  function fitToView() {
    const cards = htmlLayer.querySelectorAll('.node-card');
    if (cards.length === 0) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    cards.forEach(c => {
      const x = parseFloat(c.style.left);
      const y = parseFloat(c.style.top);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 220);
      maxY = Math.max(maxY, y + 60);
    });

    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const viewW = viewport.clientWidth - 80;
    const viewH = viewport.clientHeight - 80;

    // Standard bounding ratio scale
    const scaleX = viewW / graphW;
    const scaleY = viewH / graphH;
    zoomScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.5);

    // Centered translation coordinates
    panX = (viewport.clientWidth - graphW * zoomScale) / 2 - minX * zoomScale;
    panY = (viewport.clientHeight - graphH * zoomScale) / 2 - minY * zoomScale;

    updateCanvasTransform();
  }

  // Helper sanitization
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
