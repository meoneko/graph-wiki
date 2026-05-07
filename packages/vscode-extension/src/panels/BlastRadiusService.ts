import * as path from 'path';
import type { CrgMcpService, QueryResult } from '../services/CrgMcpService';
import { resultErrorSummary } from '../services/CrgMcpService';

export interface AffectedFlowView {
  id: number;
  name: string;
  criticality: number;
  nodeCount: number;
  matchedNodeCount: number;
  projects: string[];
}

export interface MatchedNodeView {
  id: string;
  label: string;
  type?: string;
  project: string;
  source_file?: string;
}

export interface BlastRadiusViewModel {
  targetFile: string;
  targetFileName: string;
  status: string;
  codes: string[];
  warning?: string;
  matchedNodes: MatchedNodeView[];
  flows: AffectedFlowView[];
  highestCriticality: number;
  unmatchedInputs: string[];
}

export interface TraceNodeView {
  id: string;
  label: string;
  type?: string;
  project?: string;
  source_file?: string;
  graph_kind?: string;
  trust_level?: string;
}

export interface TraceEdgeView {
  id: string;
  from_id: string;
  to_id: string;
  type: string;
  graph_kind?: string;
  trust_level?: string;
}

export interface TraceLaneView {
  nodes: TraceNodeView[];
  edges: TraceEdgeView[];
  depthReached: number;
  truncated: boolean;
}

export interface TraceViewModel {
  nodeId: string;
  status: string;
  codes: string[];
  warning?: string;
  target?: TraceNodeView;
  upstream?: TraceLaneView;
  downstream?: TraceLaneView;
  factorCodes: Array<{ code: string; value?: number | string }>;
}

export class BlastRadiusService {
  constructor(private readonly mcp: CrgMcpService) {}

  async getBlastRadius(targetFile: string): Promise<BlastRadiusViewModel> {
    const context = await this.mcp.getContext();
    const result = await this.mcp.callTool('get_affected_flows', {
      workspaceId: context.workspaceId,
      projectId: context.projectId,
      changedFiles: [targetFile],
    });

    const matchedNodes = asArray<MatchedNodeView>(result.data?.matchedNodes);
    const flows = asArray<AffectedFlowView>(result.data?.flows).map((flow) => ({
      ...flow,
      projects: Array.isArray(flow.projects) ? flow.projects : [],
    }));
    const isUsefulNoFlowState = result.status === 'INSUFFICIENT_EVIDENCE' && matchedNodes.length > 0;
    if (result.status !== 'OK' && result.status !== 'PARTIAL' && !isUsefulNoFlowState) {
      throw new Error(resultErrorSummary(result));
    }

    return {
      targetFile,
      targetFileName: path.basename(targetFile),
      status: result.status,
      codes: result.codes ?? [],
      warning: result.status === 'OK' ? undefined : resultErrorSummary(result),
      matchedNodes,
      flows,
      highestCriticality: flows.reduce((max, flow) => Math.max(max, Number(flow.criticality) || 0), 0),
      unmatchedInputs: asArray<string>(result.data?.unmatchedInputs),
    };
  }

  async traceNode(nodeId: string): Promise<TraceViewModel> {
    const context = await this.mcp.getContext();
    const result = await this.mcp.callTool('get_lineage', {
      workspaceId: context.workspaceId,
      nodeId,
      direction: 'both',
      maxDepth: 5,
      maxNodes: 100,
    });
    if (result.status !== 'OK' && result.status !== 'PARTIAL') {
      throw new Error(resultErrorSummary(result));
    }

    return {
      nodeId,
      status: result.status,
      codes: result.codes ?? [],
      warning: result.status === 'OK' ? undefined : resultErrorSummary(result),
      target: asTraceNode(result.data?.target),
      upstream: asTraceLane(result.data?.upstream),
      downstream: asTraceLane(result.data?.downstream),
      factorCodes: asArray<{ code: string; value?: number | string }>(result.data?.factorCodes),
    };
  }

  async rebuildGraph(): Promise<QueryResult> {
    return this.mcp.buildGraph();
  }

  async runPostprocess(): Promise<QueryResult> {
    return this.mcp.runPostprocess();
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function asTraceNode(value: unknown): TraceNodeView | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return value as TraceNodeView;
}

function asTraceLane(value: unknown): TraceLaneView | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const lane = value as Partial<TraceLaneView>;
  return {
    nodes: asArray<TraceNodeView>(lane.nodes),
    edges: asArray<TraceEdgeView>(lane.edges),
    depthReached: typeof lane.depthReached === 'number' ? lane.depthReached : 0,
    truncated: Boolean(lane.truncated),
  };
}
