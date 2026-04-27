import type { GraphNode, OperationType, QueryMode, QueryResult } from '../../types.js';
import { GraphDB } from '../../../storage/GraphDB.js';
import { GraphArtifactLoader } from './GraphArtifactLoader.js';
import { TrustAwareQueryEngine } from './TrustAwareQueryEngine.js';
import { OperationResolver } from './OperationResolver.js';
import { QueryResultFactory } from './QueryResultFactory.js';

export class TrustedQueryService {
  private readonly loader: GraphArtifactLoader;
  private readonly engines = new Map<string, TrustAwareQueryEngine>();

  constructor(private readonly db: GraphDB) {
    this.loader = new GraphArtifactLoader(db);
  }

  engine(workspaceId: string): TrustAwareQueryEngine {
    let engine = this.engines.get(workspaceId);
    if (!engine) {
      engine = new TrustAwareQueryEngine(workspaceId, this.loader);
      this.engines.set(workspaceId, engine);
    }
    return engine;
  }

  clearCache(workspaceId?: string): void {
    this.loader.clearCache(workspaceId);
    if (workspaceId) this.engines.delete(workspaceId);
    else this.engines.clear();
  }

  async ask(question: string, workspaceId: string, mode: QueryMode, exactOnly = false): Promise<QueryResult> {
    const engine = this.engine(workspaceId);
    const operation = OperationResolver.resolve({ caller: 'service.ask' });
    const graph = await engine.getVisibleGraph(operation, mode);
    const exactMatches = graph.nodes
      .filter((node) => node.id === question || node.symbol === question || node.label === question)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (exactMatches.length === 1) {
      return this.nodesResult(exactMatches, 'OK', [`exact match for ${question}`], [], operation, mode);
    }

    if (exactMatches.length > 1) {
      return this.nodesResult(exactMatches, 'AMBIGUOUS', [`multiple exact matches for ${question}`], ['AMBIGUOUS_EXACT_MATCH'], operation, mode);
    }

    if (exactOnly) {
      return this.nodesResult([], 'INSUFFICIENT_EVIDENCE', [`no exact match for ${question}`], ['NO_EXACT_MATCH'], operation, mode);
    }

    try {
      const visibleIds = new Set(graph.nodes.map((node) => node.id));
      const ftsMatches = this.db.searchNodesFTS(question, workspaceId, 20).filter((node) => visibleIds.has(node.id));
      return this.nodesResult(
        ftsMatches,
        ftsMatches.length > 0 ? 'PARTIAL' : 'INSUFFICIENT_EVIDENCE',
        [`fallback FTS search for ${question}`],
        ftsMatches.length > 0 ? ['FTS_FALLBACK'] : ['NO_MATCH'],
        operation,
        mode,
      );
    } catch (error) {
      return this.nodesResult([], 'INSUFFICIENT_EVIDENCE', [`fallback FTS failed for ${question}`], [
        'FTS_FALLBACK_FAILED',
        error instanceof Error ? error.message : String(error),
      ], operation, mode);
    }
  }

  private nodesResult(nodes: GraphNode[], status: QueryResult['status'], reasons: string[], warnings: string[], operation?: OperationType, mode?: QueryMode): QueryResult {
    const usesNonAuthoritative = nodes.some((node) => node.trust_level !== 'AUTHORITATIVE' || node.confidence_band !== 'AUTHORITATIVE');
    return QueryResultFactory.create({
      status,
      nodes,
      edges: [],
      reasons,
      warnings: usesNonAuthoritative ? [...new Set([...warnings, 'NON_AUTHORITATIVE_EVIDENCE_PRESENT'])] : warnings,
      codes: warnings,
      confidenceLevel: nodes.length === 0 ? 'LOW' : usesNonAuthoritative ? 'MEDIUM' : 'HIGH',
      confidenceReasons: reasons,
      provenanceSources: nodes.map((node) => node.provenance),
      metadata: {
        matchCount: nodes.length,
        policy: {
          operation: operation ?? null,
          mode: mode ?? null,
          traversedEdgeCount: 0,
          blockedEdgeCount: 0,
          blockedCodes: [],
        },
      },
    });
  }
}

const services = new WeakMap<GraphDB, TrustedQueryService>();

export function getTrustedQueryService(db: GraphDB): TrustedQueryService {
  let service = services.get(db);
  if (!service) {
    service = new TrustedQueryService(db);
    services.set(db, service);
  }
  return service;
}
