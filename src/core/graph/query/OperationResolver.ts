import type { OperationType } from '../../types.js';

type CallerId =
  | 'cli.ask'
  | 'cli.impact'
  | 'cli.stats'
  | 'cli.search'
  | 'cli.export'
  | 'cli.verify'
  | 'cli.wiki'
  | 'service.ask'
  | 'pipeline.impact'
  | 'structured-ask'
  | 'agent-context'
  | 'report-builder'
  | 'mcp.query.get_node'
  | 'mcp.query.get_neighbors'
  | 'mcp.query.get_path'
  | 'mcp.query.get_callers'
  | 'mcp.review.review_diff'
  | 'mcp.review.review_pr'
  | 'mcp.review.detect_changes'
  | 'mcp.review.blast_radius'
  | 'mcp.review.get_risk_score'
  | 'mcp.graph.graph_stats'
  | 'mcp.graph.architecture_overview'
  | 'mcp.graph.list_communities'
  | 'mcp.graph.get_community'
  | 'mcp.graph.find_hubs'
  | 'mcp.graph.find_bridges'
  | 'mcp.graph.find_gaps'
  | 'mcp.wiki.get_wiki_page'
  | 'mcp.wiki.generate_wiki'
  | 'mcp.search.search'
  | 'mcp.flows.list_flows'
  | 'mcp.flows.get_flow'
  | 'mcp.flows.get_affected_flows'
  | 'mcp.flows.get_minimal_context'
  | 'mcp.flows.get_lineage'
  | 'mcp.refactor.rename_preview'
  | 'mcp.refactor.find_dead_code'
  | 'cli.review-architecture'
  | 'mcp.architecture.review'
  | 'mcp.architecture.findings';

const IMPLICIT_OPERATION_BY_CALLER: Record<CallerId, OperationType> = {
  'cli.ask': 'ask',
  'cli.impact': 'impact',
  'cli.stats': 'wiki',
  'cli.search': 'ask',
  'cli.export': 'wiki',
  'cli.verify': 'governance',
  'cli.wiki': 'wiki',
  'service.ask': 'ask',
  'pipeline.impact': 'impact',
  'structured-ask': 'ask',
  'agent-context': 'ask',
  'report-builder': 'wiki',
  'mcp.query.get_node': 'ask',
  'mcp.query.get_neighbors': 'impact',
  'mcp.query.get_path': 'lineage',
  'mcp.query.get_callers': 'lineage',
  'mcp.review.review_diff': 'impact',
  'mcp.review.review_pr': 'impact',
  'mcp.review.detect_changes': 'impact',
  'mcp.review.blast_radius': 'impact',
  'mcp.review.get_risk_score': 'impact',
  'mcp.graph.graph_stats': 'wiki',
  'mcp.graph.architecture_overview': 'wiki',
  'mcp.graph.list_communities': 'wiki',
  'mcp.graph.get_community': 'wiki',
  'mcp.graph.find_hubs': 'wiki',
  'mcp.graph.find_bridges': 'wiki',
  'mcp.graph.find_gaps': 'wiki',
  'mcp.wiki.get_wiki_page': 'wiki',
  'mcp.wiki.generate_wiki': 'wiki',
  'mcp.search.search': 'ask',
  'mcp.flows.list_flows': 'wiki',
  'mcp.flows.get_flow': 'wiki',
  'mcp.flows.get_affected_flows': 'impact',
  'mcp.flows.get_minimal_context': 'ask',
  'mcp.flows.get_lineage': 'lineage',
  'mcp.refactor.rename_preview': 'impact',
  'mcp.refactor.find_dead_code': 'impact',
  'cli.review-architecture': 'wiki',
  'mcp.architecture.review': 'wiki',
  'mcp.architecture.findings': 'wiki',
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
