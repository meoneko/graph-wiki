import * as path from 'path';
import { resultErrorSummary, type CrgMcpService, type QueryResult } from '../services/CrgMcpService';

export class BlastRadiusService {
  constructor(private readonly mcp: CrgMcpService) {}

  async getBlastRadius(targetFile: string): Promise<Record<string, unknown>> {
    const context = await this.mcp.getContext();
    const result = await this.mcp.callTool('get_affected_flows', {
      workspaceId: context.workspaceId,
      projectId: context.projectId,
      changedFiles: [targetFile],
    });
    const matchedNodes = asArray(result.data?.matchedNodes);
    const flows: Array<Record<string, unknown>> = asArray<Record<string, unknown>>(result.data?.flows).map((flow) => ({
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
      highestCriticality: flows.reduce((max, flow) => Math.max(max, Number(flow['criticality']) || 0), 0),
      unmatchedInputs: asArray(result.data?.unmatchedInputs),
    };
  }

  async traceNode(nodeId: string): Promise<Record<string, unknown>> {
    const context = await this.mcp.getContext();
    const result = await this.mcp.callTool('get_lineage', {
      workspaceId: context.workspaceId,
      nodeId,
      direction: 'both',
      maxDepth: 5,
      maxNodes: 100,
    });
    if (result.status !== 'OK' && result.status !== 'PARTIAL') throw new Error(resultErrorSummary(result));
    return {
      nodeId,
      status: result.status,
      codes: result.codes ?? [],
      warning: result.status === 'OK' ? undefined : resultErrorSummary(result),
      target: result.data?.target,
      upstream: result.data?.upstream,
      downstream: result.data?.downstream,
      factorCodes: asArray(result.data?.factorCodes),
    };
  }

  async rebuildGraph(): Promise<QueryResult> {
    return this.mcp.buildGraph();
  }

  async runPostprocess(): Promise<QueryResult> {
    return this.mcp.runPostprocess();
  }
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
