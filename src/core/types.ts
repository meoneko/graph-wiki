export type NodeType = string;

export type GraphKind = 'canonical' | 'derived' | 'exploratory' | 'external';

export type ConfidenceBand = 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export type DecisionStatus =
  | 'OK'
  | 'AMBIGUOUS'
  | 'INSUFFICIENT_EVIDENCE'
  | 'EXPLORATORY_ONLY'
  | 'PARTIAL'
  | 'POLICY_VIOLATION';

export type QueryMode = 'authoritative' | 'mixed_safe' | 'exploratory';

export type TrustLevel = 'AUTHORITATIVE' | 'DERIVED' | 'EXPLORATORY' | 'MIXED';

export type ResponseConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Provenance {
  source: 'parser' | 'analysis' | 'ai' | 'user';
  artifact_source: string;
  producer_stage: string;
  timestamp: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  rule?: string;
}

export const EdgeType = {
  calls: 'calls',
  imports: 'imports',
  inherits: 'inherits',
  implements: 'implements',
  uses_authority: 'uses_authority',
  precedes: 'precedes',
  delegates_to: 'delegates_to',
  canonical_dependency: 'canonical_dependency',
  node_uses_authority: 'node_uses_authority',
} as const;

export type EdgeType = (typeof EdgeType)[keyof typeof EdgeType];

export interface EvidenceSpan {
  evidence_id: string;
  source_file: string;
  line_start: number;
  line_end: number;
  excerpt: string;
  role: 'source' | 'route' | 'call' | 'controller' | 'usecase' | 'authority' | 'dto';
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
  metadata?: Record<string, unknown>;
}

export interface IProjectAdapter {
  parse(paths: string[], context: AdapterContext): Promise<unknown>;
  extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]>;
  enrich(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  classify(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  identify_entrypoints(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
}
