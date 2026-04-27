import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';

function sid(...parts: string[]): string {
    return createHash('sha1').update(parts.join('|')).digest('hex');
}

function mapProvenance(fact: NormalizedFact, stage: string): Provenance {
    return {
        source: 'ai',
        artifact_source: fact.source_file,
        producer_stage: stage,
        timestamp: new Date().toISOString(),
        file: fact.source_file,
        line_start: fact.line_start,
        line_end: fact.line_end,
    };
}

export async function buildExploratoryGraph(facts: NormalizedFact[], workspaceId: string, db: GraphDB): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    // Only process explicitly classified EXPLORATORY facts. Missing trust is a validation bug.
    const exploratoryFacts = facts.filter(f => f.trust_level === 'EXPLORATORY');

    const nodes: GraphNode[] = exploratoryFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY',
        source_file: f.source_file,
        symbol: f.symbol,
        provenance: mapProvenance(f, 'buildExploratoryGraph'),
        metadata: {
            http_method: f.http_method,
            http_path: f.http_path,
            domain: f.domain,
            lang_meta: f.lang_meta,
            is_entrypoint: f.is_entrypoint,
        },
        updated_at: new Date().toISOString(),
    }));

    const nodeBySymbol = new Map(nodes.map((n) => [n.symbol ?? n.label, n]));
    const edges: GraphEdge[] = [];

    for (const f of exploratoryFacts) {
        const from = nodeBySymbol.get(f.symbol);
        if (!from) continue;
        for (const called of f.called_symbols ?? []) {
            const to = nodeBySymbol.get(called);
            if (!to) continue;
            edges.push({
                id: `edge:${sid(from.id, to.id, 'exploratory_dependency')}`,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'exploratory_dependency',
                graph_kind: 'exploratory',
                confidence_band: 'AMBIGUOUS',
                trust_level: 'EXPLORATORY',
                metadata: {
                    fromSymbol: from.symbol,
                    toSymbol: to.symbol,
                    flow_type: 'control'
                },
                provenance: mapProvenance(f, 'buildExploratoryGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    db.transaction(() => {
        nodes.forEach((n) => db.upsertNode(n));
        edges.forEach((e) => db.upsertEdge(e));
    });

    return { nodes, edges };
}
