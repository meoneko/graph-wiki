export type NodeType = string;

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
  label: string;
  type: NodeType;
  graph_kind: 'canonical' | 'exploratory';
  confidence: 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  source_file?: string;
  symbol?: string;
  http_method?: string;
  http_path?: string;
  domain?: string;
  lang_meta?: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  workspace: string;
  from_id: string;
  to_id: string;
  type: string;
  graph_kind: 'canonical' | 'exploratory';
  confidence: 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  metadata?: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface IProjectAdapter {
  parse(paths: string[], context: AdapterContext): Promise<unknown>;
  extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]>;
  enrich(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  classify(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
  identify_entrypoints(candidates: CandidateRecord[], context: AdapterContext): Promise<CandidateRecord[]>;
}
