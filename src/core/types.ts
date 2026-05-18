import type { DecisionStatus as _DecisionStatus } from './errors.js';
export { DecisionStatus, RuntimeCode, PipelineError } from './errors.js';
export type { DecisionStatus as DecisionStatusType, RuntimeCode as RuntimeCodeType, PipelineError as PipelineErrorType } from './errors.js';

// Local alias for use within this file
type DecisionStatus = _DecisionStatus;

export type NodeType = string;

export type GraphKind = 'canonical' | 'derived' | 'exploratory' | 'external';

export type ConfidenceBand = 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export type OperationType =
  | 'ask'
  | 'impact'
  | 'lineage'
  | 'wiki'
  | 'governance';

export type QueryMode = 'authoritative' | 'mixed_safe' | 'exploratory';

export type TrustLevel = 'AUTHORITATIVE' | 'DERIVED' | 'EXPLORATORY' | 'MIXED';

export type ResponseConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type NodeRole = 'entrypoint' | 'http_handler' | 'event_handler' | 'domain' | 'contract' | 'config' | 'infra';

export interface Provenance {
  source: 'parser' | 'analysis' | 'ai' | 'user';
  artifact_source: string;
  producer_stage: string;
  timestamp: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  rule?: string;
  /** Workspace that owns this fact */
  workspaceId?: string;
  /** Source root (project) within the workspace */
  sourceRootId?: string;
  /** Canonical file path (alias for file, always populated when file is) */
  filePath?: string;
  /** Pipeline stage that produced this provenance (alias for producer_stage) */
  extractionStage?: string;
  /** Method used for extraction: ast, static-analysis, regex, doc-parse, manual */
  extractionMethod?: string;
  /** Identifier of the adapter that produced this fact */
  adapterId?: string;
  /** Version of the adapter that produced this fact */
  adapterVersion?: string;
  /** Confidence score 0-1 for this fact */
  confidence?: number;
  /** Content hash for change detection */
  hash?: string;
}

export const EdgeType = {
  // Structural
  contains: 'contains',
  imports: 'imports',
  inherits: 'inherits',
  implements: 'implements',
  // Runtime
  calls: 'calls',
  invokes: 'invokes',
  dispatches_to: 'dispatches_to',
  triggers: 'triggers',
  // Entry and flow
  entry_of: 'entry_of',
  precedes: 'precedes',
  belongs_to_flow: 'belongs_to_flow',
  // Contract
  requests: 'requests',
  returns: 'returns',
  maps_to: 'maps_to',
  binds_to: 'binds_to',
  // Authority
  uses_authority: 'uses_authority',
  node_uses_authority: 'node_uses_authority',
  depends_on_authority: 'depends_on_authority',
  // Data flow
  reads: 'reads',
  writes: 'writes',
  transforms: 'transforms',
  // Exploratory
  likely_calls: 'likely_calls',
  semantic_match: 'semantic_match',
  inferred_contract: 'inferred_contract',
  // Additional structural/operational
  delegates_to: 'delegates_to',
  configures: 'configures',
  defines_schema: 'defines_schema',
  documents: 'documents',
  deploys: 'deploys',
  // Layer-specific build artifacts
  canonical_dependency: 'canonical_dependency',
  derived_dependency: 'derived_dependency',
  exploratory_dependency: 'exploratory_dependency',
} as const;

export type EdgeType = (typeof EdgeType)[keyof typeof EdgeType];

export interface EvidenceSpan {
  evidence_id: string;
  source_file: string;
  line_start: number;
  line_end: number;
  excerpt: string;
  role:
    | 'source'
    | 'route'
    | 'call'
    | 'controller'
    | 'usecase'
    | 'authority'
    | 'dto'
    | 'config_key'
    | 'config_section'
    | 'schema_field'
    | 'infra_resource'
    | 'contract_endpoint'
    | 'doc_section';
}

export interface AdapterContext {
  workspaceId: string;
  projectId: string;
  projectRoot: string;
}

export interface CandidateRecord {
  candidate_id: string;
  candidate_type: NodeType;
  workspaceId: string;
  project: string;
  source_file: string;
  symbol: string;
  line_start: number;
  line_end: number;
  status: 'candidate' | 'validated' | 'rejected';
  extractor: string;
  evidence: EvidenceSpan[];
  called_symbols?: string[];
  is_entrypoint?: boolean;
  entrypoint_class?: 'api' | 'command' | 'event' | 'unknown';
  execution_role?: string;
  http_method?: string;
  http_path?: string;
  annotations?: string[];
  roles?: NodeRole[];
  framework?: string;
  language?: string;
  lang_meta?: Record<string, unknown>;
  domain?: string;
}

export interface NormalizedFact extends CandidateRecord {
  fact_id: string;
  trust_level?: TrustLevel;
  decision_status?: DecisionStatus;
}

export interface RejectedRecord {
  id: string;
  workspace?: string;
  project?: string;
  stage: string;
  reason_code: string;
  details: string;
  source_file?: string;
  symbol?: string;
}

export interface GraphNode {
  id: string;
  /** Required for canonical/derived; null for exploratory/external. Used by DriftDetector for cross-build comparison. */
  stableKey: string | null;
  workspace: string;
  project: string;
  type: NodeType;
  label: string;
  source_file?: string;
  symbol?: string;
  graph_kind: GraphKind;
  confidence_band: ConfidenceBand;
  /** @deprecated use confidence_band */
  confidence?: string;
  confidence_score?: number;
  provenance: Provenance;
  metadata?: Record<string, unknown>;
  trust_level?: TrustLevel;
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compat
  http_method?: string;
  http_path?: string;
  domain?: string;
  lang_meta?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  /** Required for canonical/derived; null for exploratory/external. Used by DriftDetector for cross-build comparison. */
  stableKey: string | null;
  workspace: string;
  from_id: string;
  to_id: string;
  type: string;
  graph_kind: GraphKind;
  confidence_band: ConfidenceBand;
  /** @deprecated use confidence_band */
  confidence?: string;
  confidence_score?: number;
  provenance: Provenance;
  created_at?: string;
  metadata?: {
    line?: number;
    column?: number;
    derivation_rule?: string;
    flow_type?: 'control' | 'data' | 'contract' | 'authority' | 'structural';
    fromSymbol?: string;
    toSymbol?: string;
    [key: string]: unknown;
  };
  trust_level?: TrustLevel;
  updated_at?: string;
}

export interface ReasoningPath {
  path_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  trust_level: TrustLevel;
  status: DecisionStatus;
  summary: string;
}

export interface QueryResult {
  status: DecisionStatus;
  reasoning: {
    selected_paths: ReasoningPath[];
    rejected_paths?: ReasoningPath[];
    selection_explanation: string[];
  };
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    [key: string]: unknown;
  };
  confidence: {
    level: ResponseConfidence;
    reasons: string[];
  };
  provenance: {
    sources: Provenance[];
  };
  warnings: string[];
  codes: string[];
  metadata?: {
    policy?: {
      operation: OperationType | null;
      mode: QueryMode | null;
      traversedEdgeCount: number;
      blockedEdgeCount: number;
      blockedCodes: string[];
    };
    tool?: {
      name: string;
      workspace?: string;
      project?: string;
    };
    [key: string]: unknown;
  };
}

export interface IProjectAdapter {
  parse(paths: string[], context: AdapterContext): Promise<unknown>;
  extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]>;
  enrich(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  classify(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  identify_entrypoints(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
}
