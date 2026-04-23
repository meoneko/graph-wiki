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
  facts: NormalizedFact[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  workspaceId: string,
  _db: GraphDB,
  config: KnowledgeConfig,
): Promise<EnrichmentResult> {
  const ai = config.ai;
  const reportsRoot = resolveOutputPath(config, 'reports_root');
  const wsRoot = path.join(reportsRoot, workspaceId);
  await mkdir(wsRoot, { recursive: true });

  if (!ai?.provider || !ai.api_key_env) {
    const result: EnrichmentResult = { provider: 'none', model: 'none', status: 'skipped', reason: 'AI_CONFIG_MISSING' };
    await writeFile(path.join(wsRoot, 'ai-enrichment.json'), JSON.stringify(result, null, 2), 'utf-8');
    return result;
  }

  const apiKey = process.env[ai.api_key_env];
  if (!apiKey) {
    const result: EnrichmentResult = { provider: ai.provider, model: ai.model_extract ?? 'unknown', status: 'skipped', reason: 'API_KEY_NOT_SET' };
    await writeFile(path.join(wsRoot, 'ai-enrichment.json'), JSON.stringify(result, null, 2), 'utf-8');
    return result;
  }

  const payload = {
    workspaceId,
    factCount: facts.length,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    sampleFacts: facts.slice(0, 20),
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ai.model_extract ?? 'google/gemini-2.5-flash',
        temperature: ai.temperature ?? 0.1,
        messages: [
          { role: 'system', content: 'Summarize architecture signals and integration risks from extracted code graph data.' },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const result: EnrichmentResult = { provider: ai.provider, model: ai.model_extract ?? 'unknown', status: 'failed', reason: `HTTP_${response.status}:${text.slice(0, 300)}` };
      await writeFile(path.join(wsRoot, 'ai-enrichment.json'), JSON.stringify(result, null, 2), 'utf-8');
      return result;
    }

    const data = await response.json();
    const result: EnrichmentResult = { provider: ai.provider, model: ai.model_extract ?? 'unknown', status: 'completed' };
    await writeFile(path.join(wsRoot, 'ai-enrichment.json'), JSON.stringify({ result, response: data }, null, 2), 'utf-8');
    return result;
  } catch (error) {
    const result: EnrichmentResult = { provider: ai.provider, model: ai.model_extract ?? 'unknown', status: 'failed', reason: error instanceof Error ? error.message : String(error) };
    await writeFile(path.join(wsRoot, 'ai-enrichment.json'), JSON.stringify(result, null, 2), 'utf-8');
    return result;
  }
}
