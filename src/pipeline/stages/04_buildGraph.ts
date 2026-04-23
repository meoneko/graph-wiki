import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';

function sid(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

export async function buildGraph(facts: NormalizedFact[], workspaceId: string, db: GraphDB): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const nodes: GraphNode[] = facts.map((f) => ({
    id: `node:${f.candidate_id}`,
    workspace: f.workspaceId,
    project: f.project,
    label: f.symbol,
    type: f.candidate_type,
    graph_kind: 'canonical',
    confidence: 'EXTRACTED',
    source_file: f.source_file,
    symbol: f.symbol,
    http_method: f.http_method,
    http_path: f.http_path,
    domain: f.domain,
    lang_meta: f.lang_meta,
    provenance: { source: f.extractor, workspaceId: f.workspaceId },
  }));

  const nodeBySymbol = new Map(nodes.map((n) => [n.symbol ?? n.label, n]));
  const edges: GraphEdge[] = [];

  for (const f of facts) {
    const from = nodeBySymbol.get(f.symbol);
    if (!from) continue;
    for (const called of f.called_symbols ?? []) {
      const to = nodeBySymbol.get(called);
      if (!to) continue;
      edges.push({
        id: `edge:${sid(from.id, to.id, 'canonical_dependency')}`,
        workspace: workspaceId,
        from_id: from.id,
        to_id: to.id,
        type: 'canonical_dependency',
        graph_kind: 'canonical',
        confidence: 'INFERRED',
        metadata: { fromSymbol: from.symbol, toSymbol: to.symbol },
        provenance: { stage: 'buildGraph', workspaceId },
      });
    }
  }

  db.transaction(() => {
    db.deleteEdgesByWorkspace(workspaceId);
    db.deleteNodesByWorkspace(workspaceId);
    nodes.forEach((n) => db.upsertNode(n));
    edges.forEach((e) => db.upsertEdge(e));
  });

  return { nodes, edges };
}
