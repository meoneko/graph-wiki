/**
 * LayerViolationDetector — enforces layer hierarchy rules on module dependencies.
 *
 * Module identification reuses the `deriveDomain()` pattern from `src/core/flows.ts`.
 * Only `calls` and `invokes` edges are considered. Exploratory edges are excluded.
 *
 * Default layer hierarchy (index 0 = top/presentation, higher index = lower layer):
 *   0: mcp, cli    (presentation)
 *   1: core        (domain logic)
 *   2: pipeline    (orchestration)
 *   3: storage     (persistence)
 *   4: scanner     (parsing)
 *
 * Violations:
 *   - reverse_dependency: lower layer calling higher layer (source layer > target layer) → critical
 *   - skip_layer: crossing >1 layer downward (target layer - source layer > 1) → warning
 */

import type {
  GraphNode,
  GraphEdge,
  LayerConfig,
  LayerViolation,
  LayerViolationResult,
  Finding,
} from '../types.js';

// ---------------------------------------------------------------------------
// Default layer hierarchy
// ---------------------------------------------------------------------------

const DEFAULT_LAYER_MAP: ReadonlyMap<string, number> = new Map([
  ['mcp', 0],
  ['cli', 0],
  ['core', 1],
  ['pipeline', 2],
  ['storage', 3],
  ['scanner', 4],
]);

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
// Layer map construction from LayerConfig
// ---------------------------------------------------------------------------

function buildLayerMap(config?: LayerConfig): Map<string, number> {
  if (!config) return new Map(DEFAULT_LAYER_MAP);

  const layerMap = new Map<string, number>();
  // The hierarchy array lists layers from top (index 0) to bottom.
  // Multiple modules at the same layer are comma-separated in the same entry,
  // or listed as separate entries at the same conceptual level.
  // We assign layer index based on position in the array.
  for (let i = 0; i < config.hierarchy.length; i++) {
    const entry = config.hierarchy[i]!;
    // Support comma-separated entries for multiple modules at same layer
    const modules = entry.split(',').map((m) => m.trim().toLowerCase());
    for (const mod of modules) {
      if (mod.length > 0) {
        layerMap.set(mod, i);
      }
    }
  }

  // Apply aliases: map alias → canonical layer index
  if (config.aliases) {
    for (const [alias, canonical] of Object.entries(config.aliases)) {
      const canonicalLayer = layerMap.get(canonical.toLowerCase());
      if (canonicalLayer !== undefined) {
        layerMap.set(alias.toLowerCase(), canonicalLayer);
      }
    }
  }

  return layerMap;
}

// ---------------------------------------------------------------------------
// Edge types included in layer violation analysis
// ---------------------------------------------------------------------------

const LAYER_EDGE_TYPES = new Set(['calls', 'invokes']);

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

export class LayerViolationDetector {
  private readonly layerMap: Map<string, number>;

  constructor(layerConfig?: LayerConfig) {
    this.layerMap = buildLayerMap(layerConfig);
  }

  detect(nodes: GraphNode[], edges: GraphEdge[]): LayerViolationResult {
    // 1. Build node-to-module mapping
    const nodeToModule = new Map<string, string>();
    const nodeMap = new Map<string, GraphNode>();
    for (const node of nodes) {
      const mod = deriveDomain(node);
      nodeToModule.set(node.id, mod);
      nodeMap.set(node.id, node);
    }

    // 2. Filter edges: only calls/invokes, exclude exploratory
    const relevantEdges = edges.filter(
      (edge) =>
        LAYER_EDGE_TYPES.has(edge.type) && edge.graph_kind !== 'exploratory',
    );

    // 3. Detect violations
    const violations: LayerViolation[] = [];

    for (const edge of relevantEdges) {
      const fromModule = nodeToModule.get(edge.from_id);
      const toModule = nodeToModule.get(edge.to_id);

      // Skip edges where either endpoint is not in our node set
      if (!fromModule || !toModule) continue;

      // Skip same-module edges
      if (fromModule === toModule) continue;

      // Resolve layer indices
      const fromLayer = this.layerMap.get(fromModule.toLowerCase());
      const toLayer = this.layerMap.get(toModule.toLowerCase());

      // Skip if either module is not in the layer hierarchy (unknown layers)
      if (fromLayer === undefined || toLayer === undefined) continue;

      // Same layer: no violation
      if (fromLayer === toLayer) continue;

      // Get source reference info
      const sourceNode = nodeMap.get(edge.from_id);
      const sourceFile = sourceNode?.source_file;
      const line = edge.metadata?.line;

      if (fromLayer > toLayer) {
        // Reverse dependency: lower layer calling higher layer → critical
        violations.push({
          fromModule,
          toModule,
          fromLayer,
          toLayer,
          edgeType: edge.type,
          sourceFile,
          line,
          violationType: 'reverse_dependency',
          severity: 'critical',
        });
      } else if (toLayer - fromLayer > 1) {
        // Skip-layer: crossing >1 layer downward → warning
        violations.push({
          fromModule,
          toModule,
          fromLayer,
          toLayer,
          edgeType: edge.type,
          sourceFile,
          line,
          violationType: 'skip_layer',
          severity: 'warning',
        });
      }
      // else: single-layer downward crossing (toLayer - fromLayer === 1) → no violation
    }

    // 4. Generate findings
    const findings: Finding[] = violations.map((v, idx) => ({
      id: `arch-layer-${String(idx + 1).padStart(3, '0')}`,
      type: v.violationType === 'reverse_dependency' ? 'reverse_dependency' as const : 'layer_violation' as const,
      severity: v.severity,
      description:
        v.violationType === 'reverse_dependency'
          ? `Reverse dependency: "${v.fromModule}" (layer ${v.fromLayer}) calls "${v.toModule}" (layer ${v.toLayer}) via ${v.edgeType}`
          : `Skip-layer violation: "${v.fromModule}" (layer ${v.fromLayer}) calls "${v.toModule}" (layer ${v.toLayer}) via ${v.edgeType}, skipping ${v.toLayer - v.fromLayer - 1} layer(s)`,
      affectedModules: [v.fromModule, v.toModule],
      sourceReferences: [
        {
          file: v.sourceFile,
          line: v.line,
          nodeId: undefined,
          label: undefined,
        },
      ],
      confidence: 'high' as const,
    }));

    return { violations, findings };
  }
}
