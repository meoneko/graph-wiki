import type { GraphEdge, GraphNode } from '../../types.js';
import { EdgeType } from '../../types.js';
import { STANDARD_NODE_TYPE_SET, resolveFlowType, getEdgeCategory } from '../../taxonomy.js';

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  detail: string;
  suggestion?: string;
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

const FE_FRAGMENTS = ['ui_component', 'frontend', 'page', 'view', 'component'];
const DB_FRAGMENTS = ['repository', 'database', 'db_table', 'db_service'];
const ROUTE_FRAGMENTS = ['route', 'api_route', 'controller', 'api_controller'];
const AUTHORITY_EDGE_TYPES = new Set(['uses_authority', 'node_uses_authority', 'depends_on_authority']);

function matchesAny(nodeType: string, fragments: string[]): boolean {
  return fragments.some((f) => nodeType.includes(f));
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
            suggestion: 'Move this node to derived/exploratory or attach parser-backed provenance before canonical promotion.',
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
            suggestion: "Set provenance.source='analysis' for derived nodes, or promote to canonical with a parser-backed source.",
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
          suggestion: 'Enable external workflow in knowledge.config.yaml or demote this node to exploratory.',
        });
      }

      // 4. Node type taxonomy check — warn if not in standard taxonomy
      if (node.type && !STANDARD_NODE_TYPE_SET.has(node.type)) {
        issues.push({
          code: 'NODE_TYPE_NOT_IN_TAXONOMY',
          severity: 'warning',
          nodeId: node.id,
          detail: `Node ${node.id} has type '${node.type}' which is not in the standard taxonomy`,
          suggestion: 'Consider using a standard node type from the taxonomy (structural, runtime, data, frontend, system, or conceptual categories).',
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
          suggestion: 'Attach provenance with source, artifact_source, and producer_stage before emitting this edge.',
        });
      }

      // 2. Edge type taxonomy
      if (!VALID_EDGE_TYPES.has(edge.type)) {
        issues.push({
          code: 'INVALID_EDGE_TYPE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Edge type '${edge.type}' is not in the standard taxonomy`,
          suggestion: 'Register the edge type in EdgeType before emitting this edge.',
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

      // 4. Edge category taxonomy check — warn if edge type has no recognized category
      if (edge.type && VALID_EDGE_TYPES.has(edge.type) && !getEdgeCategory(edge.type)) {
        issues.push({
          code: 'EDGE_CATEGORY_UNKNOWN',
          severity: 'warning',
          edgeId: edge.id,
          detail: `Edge ${edge.id} has type '${edge.type}' which does not belong to a recognized edge category`,
          suggestion: 'Consider using an edge type from a standard category: structural, runtime, entry/flow, contract, authority, data flow, or exploratory.',
        });
      }

      // 5. Flow type inference — emit FLOW_TYPE_INFERRED when flow_type metadata is missing
      if (edge.type && VALID_EDGE_TYPES.has(edge.type)) {
        const flowResult = resolveFlowType(edge);
        if (flowResult.inferred) {
          issues.push({
            code: 'FLOW_TYPE_INFERRED',
            severity: 'warning',
            edgeId: edge.id,
            detail: `Edge ${edge.id} (type='${edge.type}') is missing flow_type metadata; inferred as '${flowResult.flowType}'`,
            suggestion: 'Set metadata.flow_type explicitly to avoid inference warnings.',
          });
        }
      }

      // 6. Forbidden patterns — only canonical/derived edges are structural contracts
      if (edge.graph_kind !== 'canonical' && edge.graph_kind !== 'derived') continue;

      const from = nodeById.get(edge.from_id);
      const to = nodeById.get(edge.to_id);
      if (!from || !to) continue;

      // FE → DB direct call
      if (matchesAny(from.type, FE_FRAGMENTS) && matchesAny(to.type, DB_FRAGMENTS)) {
        issues.push({
          code: 'FORBIDDEN_FE_DB_DIRECT',
          severity: 'error',
          edgeId: edge.id,
          detail: `Frontend node '${from.id}' (${from.type}) directly calls DB node '${to.id}' (${to.type})`,
          suggestion: 'Add a service or API layer between the frontend and database nodes.',
        });
      }

      // Route/controller → DB direct (bypasses usecase)
      if (matchesAny(from.type, ROUTE_FRAGMENTS) && matchesAny(to.type, DB_FRAGMENTS)) {
        issues.push({
          code: 'FORBIDDEN_ROUTE_BYPASS_USECASE',
          severity: 'error',
          edgeId: edge.id,
          detail: `Route/controller '${from.id}' (${from.type}) calls DB node '${to.id}' (${to.type}) without usecase layer`,
          suggestion: 'Route should call a usecase/service, which in turn calls the repository.',
        });
      }

      // Service writes state without authority edge
      if (
        from.type.includes('service') &&
        matchesAny(to.type, DB_FRAGMENTS) &&
        !hasCanonicalAuthorityEdge.has(from.id)
      ) {
        issues.push({
          code: 'SERVICE_WRITE_WITHOUT_AUTHORITY',
          severity: 'error',
          edgeId: edge.id,
          detail: `Service '${from.id}' (${from.type}) writes to '${to.id}' (${to.type}) without any authority edge`,
          suggestion: "Add a 'uses_authority' or 'node_uses_authority' edge from this service to prove write authorisation.",
        });
      }
    }

    return {
      passed: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }
}
