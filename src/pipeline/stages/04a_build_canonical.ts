import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { buildNodeBySymbol, callMetadata, GraphNodeIndex, resolveCalledSymbol } from './graphResolution.js';

function sid(...parts: string[]): string {
    return createHash('sha1').update(parts.join('|')).digest('hex');
}

function mapProvenance(fact: NormalizedFact, stage: string): Provenance {
    return {
        source: fact.trust_level === 'AUTHORITATIVE' ? 'parser' : 'analysis',
        artifact_source: fact.source_file,
        producer_stage: stage,
        timestamp: new Date().toISOString(),
        file: fact.source_file,
        line_start: fact.line_start,
        line_end: fact.line_end,
    };
}

function isSupportedCodeFile(file: string): boolean {
    return /\.(cs|ts|tsx|js|jsx)$/i.test(file) && !/\.md$/i.test(file);
}

function isAuthoritativeCanonicalFact(fact: NormalizedFact): boolean {
    return fact.trust_level === 'AUTHORITATIVE'
        && isSupportedCodeFile(fact.source_file);
}

export async function buildCanonicalGraph(facts: NormalizedFact[], workspaceId: string, db: GraphDB): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const canonicalFacts = facts.filter(isAuthoritativeCanonicalFact);

    const nodes: GraphNode[] = canonicalFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        roles: f.roles,
        language: f.language,
        framework: f.framework,
        graph_kind: 'canonical',
        confidence_band: f.trust_level === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'EXTRACTED',
        trust_level: 'AUTHORITATIVE',
        source_file: f.source_file,
        symbol: f.symbol,
        provenance: mapProvenance(f, 'buildCanonicalGraph'),
        metadata: {
            http_method:  f.http_method,
            http_path:    f.http_path,
            domain:       f.domain,
            lang_meta:    f.lang_meta,
            annotations:  f.annotations,
        },
        updated_at: new Date().toISOString(),
    }));

    const nodeBySymbol = buildNodeBySymbol(nodes);
    const nodeIndex = new GraphNodeIndex(nodes);
    const edges: GraphEdge[] = [];

    for (const f of canonicalFacts) {
        const from = nodeBySymbol.get(f.symbol);
        if (!from) continue;
        for (const called of f.called_symbols ?? []) {
            const to = resolveCalledSymbol(called, nodes, nodeBySymbol, nodeIndex);
            if (!to) continue;
            edges.push({
                id: `edge:${sid(from.id, to.id, 'calls', 'canonical')}`,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'calls',
                graph_kind: 'canonical',
                confidence_band: f.trust_level === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'EXTRACTED',
                trust_level: 'AUTHORITATIVE',
                metadata: {
                    ...callMetadata(called, from, to, 'control')
                },
                provenance: mapProvenance(f, 'buildCanonicalGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    db.upsertNodes(nodes);
    db.upsertEdges(edges);

    return { nodes, edges };
}
