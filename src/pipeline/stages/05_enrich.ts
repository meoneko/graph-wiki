import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import type { NormalizedFact, GraphNode, GraphEdge } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';

export interface EnrichmentResult {
  provider: string;
  model: string;
  status: 'skipped' | 'completed' | 'failed';
  reason?: string;
}

export async function enrichFacts(
  _facts: NormalizedFact[],
  _nodes: GraphNode[],
  _edges: GraphEdge[],
  workspaceId: string,
  _db: GraphDB,
  config: KnowledgeConfig,
): Promise<EnrichmentResult> {
  const ai = config.ai;
  const reportsRoot = resolveOutputPath(config, 'reports_root');
  const wsRoot = path.join(reportsRoot, workspaceId);
  await mkdir(wsRoot, { recursive: true });

  const result: EnrichmentResult = {
    provider: ai?.provider ?? 'none',
    model: ai?.model_extract ?? 'none',
    status: 'skipped',
    reason: 'EXTERNAL_AI_ENRICHMENT_DISABLED_BY_DEFAULT',
  };
  await writeFile(path.join(wsRoot, 'ai-enrichment.json'), JSON.stringify(result, null, 2), 'utf-8');
  return result;
}
