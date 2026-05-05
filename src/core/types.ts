export const CORE_NODE_KINDS = [
  'file',
  'class',
  'function',
  'method',
  'interface',
  'type',
  'dto',
  'external',
] as const;

export type CoreNodeKind = (typeof CORE_NODE_KINDS)[number];

export const NODE_ROLES = [
  'entrypoint',
  'http_handler',
  'event_handler',
  'job_entrypoint',
  'test',
  'domain',
  'contract',
  'framework',
  'external',
] as const;

export type NodeRole = (typeof NODE_ROLES)[number];

export type NodeType = CoreNodeKind;
export type GraphKind = 'canonical' | 'derived' | 'exploratory' | 'external';

export type ConfidenceBand = 'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export type DecisionStatus =
  | 'OK'
  | 'AMBIGUOUS'
  | 'INSUFFICIENT_EVIDENCE'
  | 'EXPLORATORY_ONLY'
  | 'PARTIAL'
  | 'POLICY_VIOLATION';

export type OperationType =
  | 'ask'
  | 'impact'
  | 'lineage'
  | 'wiki'
  | 'governance';

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
  // Structural / control flow
  calls: 'calls',
  imports: 'imports',
  inherits: 'inherits',
  implements: 'implements',
  invokes: 'invokes',
  dispatches_to: 'dispatches_to',
  triggers: 'triggers',
  precedes: 'precedes',
  delegates_to: 'delegates_to',
  contains: 'contains',
  entry_of: 'entry_of',
  belongs_to_flow: 'belongs_to_flow',
  // Data / contract
  requests: 'requests',
  returns: 'returns',
  maps_to: 'maps_to',
  binds_to: 'binds_to',
  // Authority
  uses_authority: 'uses_authority',
  node_uses_authority: 'node_uses_authority',
  depends_on_authority: 'depends_on_authority',
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
  roles: NodeRole[];
  language: string;
  framework?: string;
  workspaceId: string;
  project: string;
  source_file: string;
  symbol: string;
  line_start: number;
  line_end: number;
  status: 'candidate' | 'validated' | 'rejected';
  extractor: string;
  evidence: EvidenceSpan[];
  called_symbols?: CalledSymbolRef[];
  is_entrypoint?: boolean;
  entrypoint_class?: 'api' | 'command' | 'event' | 'unknown';
  execution_role?: string;
  http_method?: string;
  http_path?: string;
  annotations?: string[];
  lang_meta?: Record<string, unknown>;
  domain?: string;
}

export interface CalledSymbolRef {
  name: string;
  qualifiedName?: string;
  line: number;
  column: number;
  source_file: string;
  containingClass?: string;
  receiver?: string;
  receiverType?: string;
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
  roles: NodeRole[];
  language: string;
  framework?: string;
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
}

// -- queryResultZodSchema -------------------------------------------------------
// Authoritative Zod representation of QueryResult — derived from the type above.
// Maintained alongside the TypeScript interface; any shape change here must match.
// P0-1 FIX: This is the ONLY place the QueryResult shape is expressed as Zod.
// Do NOT write a parallel schema in mcp/schemas/index.ts or anywhere else.
// Import this and use it directly in McpServer.registerTool() output validation.
import { z } from 'zod';

const provenanceSchema = z.object({
  source: z.enum(['parser', 'analysis', 'ai', 'user']),
  artifact_source: z.string(),
  producer_stage: z.string(),
  timestamp: z.string(),
  file: z.string().optional(),
  line_start: z.number().optional(),
  line_end: z.number().optional(),
  rule: z.string().optional(),
});

const graphNodeSchema: z.ZodType<GraphNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    workspace: z.string(),
    project: z.string(),
    type: z.enum(CORE_NODE_KINDS),
    roles: z.array(z.enum(NODE_ROLES)),
    language: z.string(),
    framework: z.string().optional(),
    label: z.string(),
    source_file: z.string().optional(),
    symbol: z.string().optional(),
    graph_kind: z.enum(['canonical', 'derived', 'exploratory', 'external']),
    confidence_band: z.enum(['AUTHORITATIVE', 'EXTRACTED', 'INFERRED', 'AMBIGUOUS']),
    confidence: z.string().optional(),
    confidence_score: z.number().optional(),
    provenance: provenanceSchema,
    metadata: z.record(z.unknown()).optional(),
    trust_level: z.enum(['AUTHORITATIVE', 'DERIVED', 'EXPLORATORY', 'MIXED']).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    http_method: z.string().optional(),
    http_path: z.string().optional(),
    domain: z.string().optional(),
    lang_meta: z.record(z.unknown()).optional(),
  }),
);

const graphEdgeSchema: z.ZodType<GraphEdge> = z.lazy(() =>
  z.object({
    id: z.string(),
    workspace: z.string(),
    from_id: z.string(),
    to_id: z.string(),
    type: z.string(),
    graph_kind: z.enum(['canonical', 'derived', 'exploratory', 'external']),
    confidence_band: z.enum(['AUTHORITATIVE', 'EXTRACTED', 'INFERRED', 'AMBIGUOUS']),
    confidence: z.string().optional(),
    confidence_score: z.number().optional(),
    provenance: provenanceSchema,
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    metadata: z.object({
      line: z.number().optional(),
      column: z.number().optional(),
      derivation_rule: z.string().optional(),
      flow_type: z.enum(['control', 'data', 'contract', 'authority', 'structural']).optional(),
      fromSymbol: z.string().optional(),
      toSymbol: z.string().optional(),
    }).passthrough().optional(),
    trust_level: z.enum(['AUTHORITATIVE', 'DERIVED', 'EXPLORATORY', 'MIXED']).optional(),
  }),
);

const reasoningPathSchema = z.object({
  path_id: z.string(),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  trust_level: z.enum(['AUTHORITATIVE', 'DERIVED', 'EXPLORATORY', 'MIXED']),
  status: z.enum(['OK', 'AMBIGUOUS', 'INSUFFICIENT_EVIDENCE', 'EXPLORATORY_ONLY', 'PARTIAL', 'POLICY_VIOLATION']),
  summary: z.string(),
});

export const queryResultZodSchema = z.object({
  status: z.enum(['OK', 'AMBIGUOUS', 'INSUFFICIENT_EVIDENCE', 'EXPLORATORY_ONLY', 'PARTIAL', 'POLICY_VIOLATION']),
  reasoning: z.object({
    selected_paths: z.array(reasoningPathSchema),
    rejected_paths: z.array(reasoningPathSchema).optional(),
    selection_explanation: z.array(z.string()),
  }),
  data: z.object({
    nodes: z.array(graphNodeSchema),
    edges: z.array(graphEdgeSchema),
  }).passthrough(),
  confidence: z.object({
    level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    reasons: z.array(z.string()),
  }),
  provenance: z.object({
    sources: z.array(provenanceSchema),
  }),
  warnings: z.array(z.string()),
  codes: z.array(z.string()),
  metadata: z.object({
    policy: z.object({
      operation: z.string().nullable(),
      mode: z.string().nullable(),
      traversedEdgeCount: z.number(),
      blockedEdgeCount: z.number(),
      blockedCodes: z.array(z.string()),
    }).optional(),
    tool: z.object({
      name: z.string(),
      workspace: z.string().optional(),
      project: z.string().optional(),
    }).optional(),
  }).passthrough().optional(),
});
