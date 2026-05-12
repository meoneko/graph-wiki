import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';

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

// All extractor IDs whose facts are promoted to canonical graph.
// Trust classification (TrustClassifier) already gates which extractors earn AUTHORITATIVE,
// but this set makes the canonical promotion explicit and auditable.
const AUTHORITATIVE_EXTRACTOR_IDS = new Set([
    'csharp_tree_sitter',
    'ts_tree_sitter_parser',
    'json_config_parser',
    'yaml_config_parser',
    'toml_config_parser',
    'env_parser',
    'sql_schema_parser',
    'proto_parser',
    'openapi_parser',
]);

function isAuthoritativeCanonicalFact(fact: NormalizedFact): boolean {
    if (fact.trust_level !== 'AUTHORITATIVE') return false;
    const extractor = String(fact.lang_meta?.extractor ?? fact.extractor ?? '').toLowerCase();
    return AUTHORITATIVE_EXTRACTOR_IDS.has(extractor)
        || extractor.includes('parser-static')
        || extractor.includes('parser-verified');
}

export async function buildCanonicalGraph(facts: NormalizedFact[], workspaceId: string, db: GraphDB): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const canonicalFacts = facts.filter(isAuthoritativeCanonicalFact);

    const nodes: GraphNode[] = canonicalFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        graph_kind: 'canonical',
        confidence_band: f.trust_level === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'EXTRACTED',
        trust_level: 'AUTHORITATIVE',
        source_file: f.source_file,
        symbol: f.symbol,
        provenance: mapProvenance(f, 'buildCanonicalGraph'),
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

    for (const f of canonicalFacts) {
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
                confidence_band: f.trust_level === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'EXTRACTED',
                trust_level: 'AUTHORITATIVE',
                metadata: {
                    fromSymbol: from.symbol,
                    toSymbol: to.symbol,
                    flow_type: 'control'
                },
                provenance: mapProvenance(f, 'buildCanonicalGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    // Persist within transaction - caller should handle transaction if possible, 
    // but here we do it for safety if called standalone.
    db.transaction(() => {
        // Note: We don't delete everything here anymore, we upsert.
        // Cleanup of old nodes for a project should be handled by sync logic.
        nodes.forEach((n) => db.upsertNode(n));
        edges.forEach((e) => db.upsertEdge(e));
    });

    return { nodes, edges };
}
