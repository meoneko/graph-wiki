/**
 * Node and Edge Taxonomy for the Trusted Code Intelligence Platform.
 *
 * Defines the comprehensive taxonomy of node types (by category) and edge types
 * (by category), along with flow_type classification and inference logic.
 *
 * @see Requirements 19.1–19.9
 */

import { EdgeType } from './types.js';
import type { GraphEdge } from './types.js';

// ─── Node Type Taxonomy ──────────────────────────────────────────────────────

/** Structural node types (Requirement 19.1) */
export const StructuralNodeTypes = [
  'file',
  'module',
  'namespace',
  'class',
  'interface',
  'function',
  'method',
] as const;

/** Runtime node types (Requirement 19.2) */
export const RuntimeNodeTypes = [
  'entrypoint',
  'controller_action',
  'api_endpoint',
  'usecase',
  'service',
] as const;

/** Data node types (Requirement 19.3) */
export const DataNodeTypes = [
  'dto',
  'model',
  'entity',
  'request',
  'response',
] as const;

/** Frontend node types (Requirement 19.4) */
export const FrontendNodeTypes = [
  'frontend_route',
  'react_component',
  'hook',
] as const;

/** System node types (Requirement 19.5) */
export const SystemNodeTypes = [
  'external_service',
  'queue',
  'job',
] as const;

/** Conceptual node types (Requirement 19.6) */
export const ConceptualNodeTypes = [
  'flow',
  'domain',
  'cluster',
] as const;

export type NodeTypeCategory = 'structural' | 'runtime' | 'data' | 'frontend' | 'system' | 'conceptual';

/** All standard node types from the taxonomy */
export const StandardNodeTypes = [
  ...StructuralNodeTypes,
  ...RuntimeNodeTypes,
  ...DataNodeTypes,
  ...FrontendNodeTypes,
  ...SystemNodeTypes,
  ...ConceptualNodeTypes,
] as const;

export type StandardNodeType = (typeof StandardNodeTypes)[number];

/** Set for O(1) lookup of standard node types */
export const STANDARD_NODE_TYPE_SET = new Set<string>(StandardNodeTypes);

/**
 * Returns the category of a node type, or undefined if not in the standard taxonomy.
 */
export function getNodeTypeCategory(nodeType: string): NodeTypeCategory | undefined {
  if ((StructuralNodeTypes as readonly string[]).includes(nodeType)) return 'structural';
  if ((RuntimeNodeTypes as readonly string[]).includes(nodeType)) return 'runtime';
  if ((DataNodeTypes as readonly string[]).includes(nodeType)) return 'data';
  if ((FrontendNodeTypes as readonly string[]).includes(nodeType)) return 'frontend';
  if ((SystemNodeTypes as readonly string[]).includes(nodeType)) return 'system';
  if ((ConceptualNodeTypes as readonly string[]).includes(nodeType)) return 'conceptual';
  return undefined;
}

// ─── Edge Category Taxonomy ──────────────────────────────────────────────────

/** Structural edge types (Requirement 19.7) */
export const StructuralEdgeTypes = [
  EdgeType.contains,
  EdgeType.imports,
  EdgeType.inherits,
  EdgeType.implements,
] as const;

/** Runtime edge types (Requirement 19.7) */
export const RuntimeEdgeTypes = [
  EdgeType.calls,
  EdgeType.invokes,
  EdgeType.dispatches_to,
  EdgeType.triggers,
] as const;

/** Entry and flow edge types (Requirement 19.7) */
export const EntryFlowEdgeTypes = [
  EdgeType.entry_of,
  EdgeType.precedes,
  EdgeType.belongs_to_flow,
] as const;

/** Contract edge types (Requirement 19.7) */
export const ContractEdgeTypes = [
  EdgeType.requests,
  EdgeType.returns,
  EdgeType.maps_to,
  EdgeType.binds_to,
] as const;

/** Authority edge types (Requirement 19.7) */
export const AuthorityEdgeTypes = [
  EdgeType.uses_authority,
  EdgeType.node_uses_authority,
  EdgeType.depends_on_authority,
] as const;

/** Data flow edge types (Requirement 19.7) */
export const DataFlowEdgeTypes = [
  EdgeType.reads,
  EdgeType.writes,
  EdgeType.transforms,
] as const;

/** Exploratory edge types (Requirement 19.7) */
export const ExploratoryEdgeTypes = [
  EdgeType.likely_calls,
  EdgeType.semantic_match,
  EdgeType.inferred_contract,
] as const;

export type EdgeCategory = 'structural' | 'runtime' | 'entry_flow' | 'contract' | 'authority' | 'data_flow' | 'exploratory';

/**
 * Returns the category of an edge type, or undefined if not in the standard taxonomy.
 */
export function getEdgeCategory(edgeType: string): EdgeCategory | undefined {
  if ((StructuralEdgeTypes as readonly string[]).includes(edgeType)) return 'structural';
  if ((RuntimeEdgeTypes as readonly string[]).includes(edgeType)) return 'runtime';
  if ((EntryFlowEdgeTypes as readonly string[]).includes(edgeType)) return 'entry_flow';
  if ((ContractEdgeTypes as readonly string[]).includes(edgeType)) return 'contract';
  if ((AuthorityEdgeTypes as readonly string[]).includes(edgeType)) return 'authority';
  if ((DataFlowEdgeTypes as readonly string[]).includes(edgeType)) return 'data_flow';
  if ((ExploratoryEdgeTypes as readonly string[]).includes(edgeType)) return 'exploratory';
  return undefined;
}

// ─── Flow Type Classification ────────────────────────────────────────────────

export type FlowType = 'control' | 'data' | 'contract' | 'authority' | 'structural';

/**
 * Mapping from edge type to its default flow_type classification (Requirement 19.8).
 * Used when flow_type metadata is missing from an edge.
 */
const EDGE_TYPE_TO_FLOW_TYPE: Record<string, FlowType> = {
  // Structural → structural
  [EdgeType.contains]: 'structural',
  [EdgeType.imports]: 'structural',
  [EdgeType.inherits]: 'structural',
  [EdgeType.implements]: 'structural',
  // Runtime → control
  [EdgeType.calls]: 'control',
  [EdgeType.invokes]: 'control',
  [EdgeType.dispatches_to]: 'control',
  [EdgeType.triggers]: 'control',
  // Entry/flow → control
  [EdgeType.entry_of]: 'control',
  [EdgeType.precedes]: 'control',
  [EdgeType.belongs_to_flow]: 'structural',
  // Contract → contract
  [EdgeType.requests]: 'contract',
  [EdgeType.returns]: 'contract',
  [EdgeType.maps_to]: 'contract',
  [EdgeType.binds_to]: 'contract',
  // Authority → authority
  [EdgeType.uses_authority]: 'authority',
  [EdgeType.node_uses_authority]: 'authority',
  [EdgeType.depends_on_authority]: 'authority',
  // Data flow → data
  [EdgeType.reads]: 'data',
  [EdgeType.writes]: 'data',
  [EdgeType.transforms]: 'data',
  // Exploratory → control (best guess for heuristic edges)
  [EdgeType.likely_calls]: 'control',
  [EdgeType.semantic_match]: 'structural',
  [EdgeType.inferred_contract]: 'contract',
  // Additional operational
  [EdgeType.delegates_to]: 'control',
  [EdgeType.configures]: 'data',
  [EdgeType.defines_schema]: 'contract',
  [EdgeType.documents]: 'structural',
  [EdgeType.deploys]: 'structural',
  // Layer-specific build artifacts
  [EdgeType.canonical_dependency]: 'structural',
  [EdgeType.derived_dependency]: 'structural',
  [EdgeType.exploratory_dependency]: 'structural',
};

export interface FlowTypeResult {
  flowType: FlowType;
  inferred: boolean;
}

/**
 * Resolves the flow_type for an edge. If the edge has explicit flow_type metadata,
 * returns it directly. Otherwise, derives it from the edge type and marks it as inferred.
 *
 * When flow_type is inferred, consumers should emit FLOW_TYPE_INFERRED warning
 * (Requirement 19.9).
 */
export function resolveFlowType(edge: GraphEdge): FlowTypeResult {
  // Check if flow_type is explicitly set in metadata
  if (edge.metadata?.flow_type) {
    return { flowType: edge.metadata.flow_type, inferred: false };
  }

  // Derive from edge type
  const derived = EDGE_TYPE_TO_FLOW_TYPE[edge.type];
  if (derived) {
    return { flowType: derived, inferred: true };
  }

  // Fallback for unknown edge types — default to structural
  return { flowType: 'structural', inferred: true };
}

/**
 * Returns the default flow_type for a given edge type string.
 * Returns undefined if the edge type is not in the taxonomy.
 */
export function getDefaultFlowType(edgeType: string): FlowType | undefined {
  return EDGE_TYPE_TO_FLOW_TYPE[edgeType];
}
