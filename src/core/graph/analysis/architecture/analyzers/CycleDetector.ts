/**
 * CycleDetector — detects circular dependencies at the module level using Tarjan's SCC algorithm.
 *
 * Module identification reuses the `deriveDomain()` pattern from `src/core/flows.ts`.
 * Only `calls`, `invokes`, and `imports` edges are considered (same edge types used by
 * `computeGraphMetrics` for bridge detection). Exploratory edges are excluded.
 *
 * Each strongly connected component with >1 module is reported as a dependency cycle.
 * Severity: >3 modules = critical, 2–3 modules = warning.
 */

import type {
  GraphNode,
  GraphEdge,
  DependencyCycle,
  CycleDetectionResult,
  Finding,
} from '../types.js';

// ---------------------------------------------------------------------------
// Module identification — replicates deriveDomain() logic from src/core/flows.ts
// ---------------------------------------------------------------------------

function deriveDomain(node: GraphNode): string {
  if (node.domain) return node.domain;
  const fromMetadata = node.metadata?.derived_domain ?? node.metadata?.domain;
  if (typeof fromMetadata === 'string' && fromMetadata.length > 0) return fromMetadata;
  const source = (node.source_file ?? '').replace(/\\/g, '/').toLowerCase();
  const parts = source.split('/').filter(Boolean);
  const srcIndex = Math.max(parts.lastIndexOf('src'), parts.lastIndexOf('source'));
  if (srcIndex >= 0 && parts[srcIndex + 1]) return parts[srcIndex + 1]!;
  if (parts.length >= 2) return parts[parts.length - 2]!;
  const symbol = (node.symbol ?? node.label).toLowerCase();
  const match = symbol.match(
    /(auth|user|course|lesson|order|payment|admin|student|teacher|report|notification)/,
  );
  return match?.[1] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Edge types included in the module dependency graph
// ---------------------------------------------------------------------------

const DEPENDENCY_EDGE_TYPES = new Set(['calls', 'invokes', 'imports']);

// ---------------------------------------------------------------------------
// Tarjan's SCC Algorithm
// ---------------------------------------------------------------------------

interface TarjanState {
  index: number;
  stack: string[];
  onStack: Set<string>;
  indices: Map<string, number>;
  lowlinks: Map<string, number>;
  sccs: string[][];
}

function tarjanSCC(adjacency: Map<string, Set<string>>): string[][] {
  const state: TarjanState = {
    index: 0,
    stack: [],
    onStack: new Set(),
    indices: new Map(),
    lowlinks: new Map(),
    sccs: [],
  };

  for (const node of adjacency.keys()) {
    if (!state.indices.has(node)) {
      strongConnect(node, adjacency, state);
    }
  }

  return state.sccs;
}

function strongConnect(
  v: string,
  adjacency: Map<string, Set<string>>,
  state: TarjanState,
): void {
  state.indices.set(v, state.index);
  state.lowlinks.set(v, state.index);
  state.index++;
  state.stack.push(v);
  state.onStack.add(v);

  const neighbors = adjacency.get(v) ?? new Set();
  for (const w of neighbors) {
    if (!state.indices.has(w)) {
      // w has not been visited; recurse
      strongConnect(w, adjacency, state);
      state.lowlinks.set(v, Math.min(state.lowlinks.get(v)!, state.lowlinks.get(w)!));
    } else if (state.onStack.has(w)) {
      // w is on the stack → part of current SCC
      state.lowlinks.set(v, Math.min(state.lowlinks.get(v)!, state.indices.get(w)!));
    }
  }

  // If v is a root node, pop the SCC
  if (state.lowlinks.get(v) === state.indices.get(v)) {
    const scc: string[] = [];
    let w: string;
    do {
      w = state.stack.pop()!;
      state.onStack.delete(w);
      scc.push(w);
    } while (w !== v);
    state.sccs.push(scc);
  }
}

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

export class CycleDetector {
  detect(nodes: GraphNode[], edges: GraphEdge[]): CycleDetectionResult {
    // 1. Build node-to-module mapping
    const nodeToModule = new Map<string, string>();
    for (const node of nodes) {
      nodeToModule.set(node.id, deriveDomain(node));
    }

    // 2. Filter edges: only calls/invokes/imports, exclude exploratory
    const relevantEdges = edges.filter(
      (edge) =>
        DEPENDENCY_EDGE_TYPES.has(edge.type) && edge.graph_kind !== 'exploratory',
    );

    // 3. Build module-level adjacency graph and track edge types between modules
    const adjacency = new Map<string, Set<string>>();
    const edgeTypesMap = new Map<string, Set<string>>(); // "modA→modB" → edge types

    for (const edge of relevantEdges) {
      const fromModule = nodeToModule.get(edge.from_id);
      const toModule = nodeToModule.get(edge.to_id);

      // Skip edges where either endpoint is not in our node set, or same module
      if (!fromModule || !toModule || fromModule === toModule) continue;

      // Add to adjacency
      if (!adjacency.has(fromModule)) adjacency.set(fromModule, new Set());
      adjacency.get(fromModule)!.add(toModule);

      // Ensure target module exists in adjacency (even if it has no outgoing edges)
      if (!adjacency.has(toModule)) adjacency.set(toModule, new Set());

      // Track edge types
      const key = `${fromModule}→${toModule}`;
      if (!edgeTypesMap.has(key)) edgeTypesMap.set(key, new Set());
      edgeTypesMap.get(key)!.add(edge.type);
    }

    // 4. Run Tarjan's SCC algorithm
    const sccs = tarjanSCC(adjacency);

    // 5. Filter SCCs with >1 module (these are cycles)
    const cycles: DependencyCycle[] = [];
    for (const scc of sccs) {
      if (scc.length <= 1) continue;

      // Collect all edge types involved in this cycle
      const cycleEdgeTypes = new Set<string>();
      for (const fromMod of scc) {
        for (const toMod of scc) {
          if (fromMod === toMod) continue;
          const key = `${fromMod}→${toMod}`;
          const types = edgeTypesMap.get(key);
          if (types) {
            for (const t of types) cycleEdgeTypes.add(t);
          }
        }
      }

      // Classify severity: >3 modules = critical, 2–3 modules = warning
      const severity = scc.length > 3 ? 'critical' : 'warning';

      cycles.push({
        modules: scc.sort(),
        edgeTypes: [...cycleEdgeTypes].sort(),
        severity,
      });
    }

    // 6. Generate findings
    const findings: Finding[] = cycles.map((cycle, idx) => ({
      id: `arch-cycle-${String(idx + 1).padStart(3, '0')}`,
      type: 'dependency_cycle' as const,
      severity: cycle.severity,
      description: `Dependency cycle detected among modules: ${cycle.modules.join(' → ')} (edge types: ${cycle.edgeTypes.join(', ')})`,
      affectedModules: cycle.modules,
      sourceReferences: [],
      confidence: 'high' as const,
    }));

    return { cycles, findings };
  }
}
