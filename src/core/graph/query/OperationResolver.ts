import type { OperationType } from '../../types.js';

type CallerId =
  | 'cli.ask'
  | 'cli.impact'
  | 'cli.stats'
  | 'cli.search'
  | 'cli.export'
  | 'service.ask'
  | 'pipeline.impact'
  | 'mcp.query.get_node'
  | 'mcp.query.get_neighbors'
  | 'mcp.query.get_path'
  | 'mcp.query.get_callers'
  | 'mcp.review.review_diff'
  | 'mcp.review.review_pr'
  | 'mcp.review.blast_radius'
  | 'mcp.review.get_risk_score'
  | 'mcp.graph.graph_stats'
  | 'mcp.graph.architecture_overview'
  | 'mcp.graph.find_hubs'
  | 'mcp.graph.find_bridges'
  | 'mcp.graph.find_gaps'
  | 'mcp.wiki.get_wiki_page'
  | 'mcp.wiki.generate_wiki'
  | 'mcp.search.search'
  | 'mcp.refactor.rename_preview'
  | 'mcp.refactor.find_dead_code';

const IMPLICIT_OPERATION_BY_CALLER: Record<CallerId, OperationType> = {
  'cli.ask': 'ask',
  'cli.impact': 'impact',
  'cli.stats': 'wiki',
  'cli.search': 'ask',
  'cli.export': 'wiki',
  'service.ask': 'ask',
  'pipeline.impact': 'impact',
  'mcp.query.get_node': 'ask',
  'mcp.query.get_neighbors': 'impact',
  'mcp.query.get_path': 'lineage',
  'mcp.query.get_callers': 'lineage',
  'mcp.review.review_diff': 'impact',
  'mcp.review.review_pr': 'impact',
  'mcp.review.blast_radius': 'impact',
  'mcp.review.get_risk_score': 'impact',
  'mcp.graph.graph_stats': 'wiki',
  'mcp.graph.architecture_overview': 'wiki',
  'mcp.graph.find_hubs': 'wiki',
  'mcp.graph.find_bridges': 'wiki',
  'mcp.graph.find_gaps': 'wiki',
  'mcp.wiki.get_wiki_page': 'wiki',
  'mcp.wiki.generate_wiki': 'wiki',
  'mcp.search.search': 'ask',
  'mcp.refactor.rename_preview': 'impact',
  'mcp.refactor.find_dead_code': 'impact',
};

export interface ResolveOperationInput {
  caller: CallerId;
  requested?: OperationType | null;
  requireExplicit?: boolean;
}

export class OperationResolver {
  static resolve(input: ResolveOperationInput): OperationType {
    if (input.requested) return input.requested;
    if (input.requireExplicit) {
      throw new Error(`OPERATION_REQUIRED:${input.caller}`);
    }
    const implicit = IMPLICIT_OPERATION_BY_CALLER[input.caller];
    if (!implicit) {
      throw new Error(`OPERATION_UNMAPPED:${input.caller}`);
    }
    return implicit;
  }
}
