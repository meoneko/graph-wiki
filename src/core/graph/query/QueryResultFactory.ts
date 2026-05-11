import type { GraphEdge, GraphNode, QueryResult, ReasoningPath } from '../../types.js';

type ConfidenceLevel = QueryResult['confidence']['level'];
type DecisionStatus = QueryResult['status'];

export interface QueryResultBuildInput {
  status: DecisionStatus;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  data?: Record<string, unknown>;
  selectedPaths?: ReasoningPath[];
  rejectedPaths?: ReasoningPath[];
  reasons?: string[];
  warnings?: string[];
  codes?: string[];
  metadata?: Record<string, unknown>;
  confidenceLevel?: ConfidenceLevel;
  confidenceReasons?: string[];
  provenanceSources?: QueryResult['provenance']['sources'];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function normalizeConfidence(nodes: GraphNode[], edges: GraphEdge[]): ConfidenceLevel {
  if (nodes.length === 0 && edges.length === 0) return 'LOW';
  const all = [...nodes, ...edges];
  const hasNonAuthoritative = all.some((item) => item.confidence_band !== 'AUTHORITATIVE' || item.trust_level !== 'AUTHORITATIVE');
  return hasNonAuthoritative ? 'MEDIUM' : 'HIGH';
}

function normalizeProvenance(nodes: GraphNode[], explicit?: QueryResult['provenance']['sources']): QueryResult['provenance']['sources'] {
  const sources = explicit ?? nodes.map((node) => node.provenance);
  const keyed = new Map<string, QueryResult['provenance']['sources'][number]>();
  for (const source of sources) {
    const key = JSON.stringify(source);
    keyed.set(key, source);
  }
  return [...keyed.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((entry) => entry[1]);
}

export class QueryResultFactory {
  static create(input: QueryResultBuildInput): QueryResult {
    const nodes = input.nodes ?? [];
    const edges = input.edges ?? [];
    const selectedPaths = input.selectedPaths ?? [];
    const rejectedPaths = input.rejectedPaths;
    const reasons = input.reasons ?? [];
    const warnings = uniqueSorted(input.warnings ?? []);
    const codes = uniqueSorted(input.codes ?? []);
    const confidenceLevel = input.confidenceLevel ?? normalizeConfidence(nodes, edges);
    const confidenceReasons = input.confidenceReasons ?? reasons;

    return {
      status: input.status,
      reasoning: {
        selected_paths: selectedPaths,
        rejected_paths: rejectedPaths,
        selection_explanation: reasons,
      },
      data: { nodes, edges, ...(input.data ?? {}) },
      confidence: {
        level: confidenceLevel,
        reasons: confidenceReasons,
      },
      provenance: {
        sources: normalizeProvenance(nodes, input.provenanceSources),
      },
      warnings,
      codes,
      metadata: input.metadata,
    };
  }

  static withMetadata(result: QueryResult, metadata: Record<string, unknown>): QueryResult {
    return {
      ...result,
      metadata: {
        ...(result.metadata ?? {}),
        ...metadata,
      },
    };
  }
}

