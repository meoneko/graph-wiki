import type { GraphEdge, GraphNode } from '../../types.js';
import { EdgeType } from '../../types.js';

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  detail: string;
}

export interface GraphValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
}

export interface GraphValidatorOptions {
  externalWorkflowEnabled?: boolean;
}

const VALID_EDGE_TYPES = new Set<string>(Object.values(EdgeType));
const VALID_GRAPH_KINDS = new Set(['canonical', 'derived', 'exploratory', 'external']);
const VALID_CONFIDENCE_BANDS = new Set(['AUTHORITATIVE', 'EXTRACTED', 'INFERRED', 'AMBIGUOUS']);

const CANONICAL_AUTHORITATIVE_SOURCES = new Set(['parser']);

const FE_ROLES = new Set(['ui_component', 'frontend', 'page', 'view', 'component']);
const DB_ROLES = new Set(['repository', 'database', 'db_table', 'db_service']);
const SERVICE_ROLES = new Set(['service', 'usecase', 'domain']);
const AUTHORITY_EDGE_TYPES = new Set(['uses_authority', 'node_uses_authority', 'depends_on_authority']);

function semanticRole(node: GraphNode): string {
  return String(
    node.lang_meta?.semantic_role
      ?? node.metadata?.semantic_role
      ?? node.metadata?.role
      ?? '',
  ).toLowerCase();
}

function hasSemanticRole(node: GraphNode, roles: Set<string>): boolean {
  const role = semanticRole(node);
  return roles.has(role) || [...roles].some((fragment) => role.includes(fragment));
}

function isFrontendNode(node: GraphNode): boolean {
  return hasSemanticRole(node, FE_ROLES);
}

function isDatabaseNode(node: GraphNode): boolean {
  return hasSemanticRole(node, DB_ROLES);
}

function isRouteNode(node: GraphNode): boolean {
  return (node.roles ?? []).includes('http_handler') || (node.roles ?? []).includes('entrypoint');
}

function isServiceNode(node: GraphNode): boolean {
  return hasSemanticRole(node, SERVICE_ROLES);
}

export class GraphValidator {
  static validate(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options: GraphValidatorOptions = {},
  ): GraphValidationResult {
    const issues: ValidationIssue[] = [];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    // Pre-build: which node IDs have at least one outgoing authority edge (canonical/derived)
    const hasCanonicalAuthorityEdge = new Set<string>();
    for (const edge of edges) {
      if (AUTHORITY_EDGE_TYPES.has(edge.type) && edge.graph_kind !== 'exploratory') {
        hasCanonicalAuthorityEdge.add(edge.from_id);
      }
    }

    // --- Node checks ---
    for (const node of nodes) {
      if (!node.id) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: 'Node is missing required field id',
        });
      }
      if (!node.workspace) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} is missing required field workspace`,
        });
      }
      if (!node.project) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} is missing required field project`,
        });
      }
      if (!node.type) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} is missing required field type`,
        });
      }
      if (!Array.isArray(node.roles)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} has invalid or missing roles`,
        });
      }
      if (!node.language) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} is missing required field language`,
        });
      }
      if (!node.label) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} is missing required field label`,
        });
      }
      if (!node.graph_kind || !VALID_GRAPH_KINDS.has(node.graph_kind)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} has invalid or missing graph_kind`,
        });
      }
      if (!node.confidence_band || !VALID_CONFIDENCE_BANDS.has(node.confidence_band)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} has invalid or missing confidence_band`,
        });
      }
      if (!node.provenance) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id ?? 'unknown'} is missing required field provenance`,
        });
      }

      // 1. Canonical provenance — must be parser-backed (SYSTEM_CONTRACT INV-02)
      if (node.graph_kind === 'canonical') {
        if (!node.provenance?.source || !CANONICAL_AUTHORITATIVE_SOURCES.has(node.provenance.source)) {
          issues.push({
            code: 'CANONICAL_PROVENANCE_MISSING',
            severity: 'error',
            nodeId: node.id,
            detail: `Node graph_kind=canonical but provenance.source=${node.provenance?.source ?? 'missing'} (expected parser)`,
          });
        }
      }

      // 2. Derived provenance — must be analysis-backed (SYSTEM_CONTRACT Section 3.1)
      if (node.graph_kind === 'derived') {
        if (!node.provenance?.source || node.provenance.source !== 'analysis') {
          issues.push({
            code: 'DERIVED_PROVENANCE_INVALID',
            severity: 'error',
            nodeId: node.id,
            detail: `Node graph_kind=derived but provenance.source=${node.provenance?.source ?? 'missing'} (expected analysis)`,
          });
        }
      }

      // 3. External layer gate
      if (node.graph_kind === 'external' && !options.externalWorkflowEnabled) {
        issues.push({
          code: 'EXTERNAL_WORKFLOW_DISABLED',
          severity: 'error',
          nodeId: node.id,
          detail: `Node ${node.id} has graph_kind=external but external workflow is not enabled`,
        });
      }
    }

    // --- Edge checks ---
    for (const edge of edges) {
      if (!edge.id) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: 'Edge is missing required field id',
        });
      }
      if (!edge.workspace) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id ?? 'unknown'} is missing required field workspace`,
        });
      }
      if (!edge.from_id) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id ?? 'unknown'} is missing required field from_id`,
        });
      }
      if (!edge.to_id) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id ?? 'unknown'} is missing required field to_id`,
        });
      }
      if (!edge.type) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id ?? 'unknown'} is missing required field type`,
        });
      }

      // 1. Canonical provenance — must be parser-backed (SYSTEM_CONTRACT INV-02)
      if (edge.graph_kind === 'canonical') {
        if (!edge.provenance?.source || !CANONICAL_AUTHORITATIVE_SOURCES.has(edge.provenance.source)) {
          issues.push({
            code: 'CANONICAL_PROVENANCE_MISSING',
            severity: 'error',
            edgeId: edge.id,
            detail: `Edge graph_kind=canonical but provenance.source=${edge.provenance?.source ?? 'missing'} (expected parser)`,
          });
        }
      }

      // 1b. Provenance field required on all edges (SYSTEM_CONTRACT Section 3.2)
      if (!edge.provenance) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id} is missing required field provenance`,
        });
        issues.push({
          code: 'MISSING_PROVENANCE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id} is missing required field provenance`,
        });
      }

      // 2. Edge type taxonomy
      if (!VALID_EDGE_TYPES.has(edge.type)) {
        issues.push({
          code: 'INVALID_EDGE_TYPE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge type '${edge.type}' is not in the standard taxonomy`,
        });
      }

      if (!nodeById.has(edge.from_id)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id} references missing from_id ${edge.from_id}`,
        });
      }
      if (!nodeById.has(edge.to_id)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id} references missing to_id ${edge.to_id}`,
        });
      }

      // 2. Missing required structural fields
      if (!edge.graph_kind || !VALID_GRAPH_KINDS.has(edge.graph_kind)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id ?? 'unknown'} has invalid or missing graph_kind`,
        });
      }
      if (!edge.confidence_band || !VALID_CONFIDENCE_BANDS.has(edge.confidence_band)) {
        issues.push({
          code: 'INVALID_GRAPH_STATE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id ?? 'unknown'} has invalid or missing confidence_band`,
        });
      }

      // 3. External layer gate
      if (edge.graph_kind === 'external' && !options.externalWorkflowEnabled) {
        issues.push({
          code: 'EXTERNAL_WORKFLOW_DISABLED',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge ${edge.id} has graph_kind=external but external workflow is not enabled`,
        });
      }

      // 5. Forbidden patterns — only canonical/derived edges are structural contracts
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;

      const from = nodeById.get(edge.from_id);
      const to = nodeById.get(edge.to_id);
      if (!from || !to) continue;

      // FE → DB direct call
      if (isFrontendNode(from) && isDatabaseNode(to)) {
        issues.push({
          code: 'FORBIDDEN_FE_DB_DIRECT',
          severity: 'error',
          edgeId: edge.id,
          detail: `Frontend node '${from.id}' directly calls DB node '${to.id}'`,
        });
      }

      // Route/controller → DB direct (bypasses usecase)
      if (isRouteNode(from) && isDatabaseNode(to)) {
        issues.push({
          code: 'FORBIDDEN_ROUTE_BYPASS_USECASE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Route/controller '${from.id}' calls DB node '${to.id}' without usecase layer`,
        });
      }

      // Service writes state without authority edge
      if (
        isServiceNode(from) &&
        isDatabaseNode(to) &&
        !hasCanonicalAuthorityEdge.has(from.id)
      ) {
        issues.push({
          code: 'SERVICE_WRITE_WITHOUT_AUTHORITY',
          severity: 'error',
          edgeId: edge.id,
          detail: `Service '${from.id}' writes to '${to.id}' without any authority edge`,
        });
      }
    }

    return {
      passed: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }
}
