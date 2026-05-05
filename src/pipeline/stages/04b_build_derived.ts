import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { buildNodeBySymbol, callMetadata, GraphNodeIndex, resolveCalledSymbol } from './graphResolution.js';

function sid(...parts: string[]): string {
    return createHash('sha1').update(parts.join('|')).digest('hex');
}

function mapProvenance(fact: NormalizedFact, stage: string): Provenance {
    return {
        source: 'analysis',
        artifact_source: fact.source_file || 'cross-file-analysis',
        producer_stage: stage,
        timestamp: new Date().toISOString(),
        file: fact.source_file,
        line_start: fact.line_start,
        line_end: fact.line_end,
    };
}

export async function buildDerivedGraph(facts: NormalizedFact[], workspaceId: string, db: GraphDB): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    // Only process facts that are DERIVED
    const derivedFacts = facts.filter(f => f.trust_level === 'DERIVED');

    const nodes: GraphNode[] = derivedFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        roles: f.roles,
        language: f.language,
        framework: f.framework,
        graph_kind: 'derived',
        confidence_band: 'EXTRACTED', // Derived usually means semi-authoritative
        trust_level: 'DERIVED',
        source_file: f.source_file,
        symbol: f.symbol,
        provenance: mapProvenance(f, 'buildDerivedGraph'),
        metadata: {
            http_method: f.http_method,
            http_path: f.http_path,
            domain: f.domain,
            lang_meta: f.lang_meta,
        },
        updated_at: new Date().toISOString(),
    }));

    const nodeBySymbol = buildNodeBySymbol(nodes);
    const nodeIndex = new GraphNodeIndex(nodes);
    const edges: GraphEdge[] = [];

    for (const f of derivedFacts) {
        const from = nodeBySymbol.get(f.symbol);
        if (!from) continue;
        for (const called of f.called_symbols ?? []) {
            const to = resolveCalledSymbol(called, nodes, nodeBySymbol, nodeIndex);
            if (!to) continue;
            edges.push({
                id: `edge:${sid(from.id, to.id, 'calls', 'derived')}`,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'calls',
                graph_kind: 'derived',
                confidence_band: 'EXTRACTED',
                trust_level: 'DERIVED',
                metadata: {
                    ...callMetadata(called, from, to, 'data') // Derived often relates to data flow/composition
                },
                provenance: mapProvenance(f, 'buildDerivedGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    db.upsertNodes(nodes);
    db.upsertEdges(edges);

    return { nodes, edges };
}
