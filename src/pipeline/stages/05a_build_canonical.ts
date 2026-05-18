/**
 * Stage 05a — Canonical graph build with trust enforcement.
 *
 * Materializes parser-backed facts into the canonical graph layer.
 * Enforces:
 * - Node ID uniqueness across workspace (Req 6.2)
 * - Canonical nodes require parser provenance (Req 6.3)
 * - No AI writing directly into canonical layer (Req 4.8)
 * - No exploratory-to-canonical silent upgrade (Req 4.7)
 * - Canonical facts only when backed by deterministic parser extraction (Req 4.2)
 *
 * @see Requirements 4.1, 4.2, 4.7, 4.8, 6.1, 6.2, 6.3
 */
import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import {
    enforceNodeIdUniqueness,
    enforceCanonicalProvenance,
    enforceCanonicalFactProvenance,
    enforceNoExploratoryUpgrade,
    collectViolations,
    throwOnViolations,
    type EnforcementResult,
} from './graph_build_enforcement.js';

function sid(...parts: string[]): string {
    return createHash('sha1').update(parts.join('|')).digest('hex');
}

function mapProvenance(fact: NormalizedFact, stage: string): Provenance {
    const extractionMethod = String(fact.lang_meta?.extraction_method ?? 'ast');
    const adapterId = String(fact.lang_meta?.extractor ?? fact.extractor ?? 'unknown');
    const adapterVersion = String(fact.lang_meta?.adapter_version ?? '1.0.0');
    const confidence = typeof fact.lang_meta?.confidence_score === 'number'
        ? fact.lang_meta.confidence_score as number
        : 0.95;
    const hash = fact.lang_meta?.stable_key
        ? String(fact.lang_meta.stable_key)
        : sid(fact.workspaceId, fact.project, fact.source_file, fact.symbol);

    return {
        source: fact.trust_level === 'AUTHORITATIVE' ? 'parser' : 'analysis',
        artifact_source: fact.source_file,
        producer_stage: stage,
        timestamp: new Date().toISOString(),
        file: fact.source_file,
        line_start: fact.line_start,
        line_end: fact.line_end,
        workspaceId: fact.workspaceId,
        sourceRootId: fact.project,
        filePath: fact.source_file,
        extractionStage: stage,
        extractionMethod,
        adapterId,
        adapterVersion,
        confidence,
        hash,
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

    // ── Trust Enforcement: Validate facts before building ────────────────────
    const factViolations: EnforcementResult[] = [];
    for (const fact of canonicalFacts) {
        factViolations.push(enforceCanonicalFactProvenance(fact));
    }
    throwOnViolations(collectViolations(...factViolations), 'buildCanonicalGraph (fact validation)');

    const nodes: GraphNode[] = canonicalFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        stableKey: `node:${f.candidate_id}`,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        graph_kind: 'canonical' as const,
        confidence_band: f.trust_level === 'AUTHORITATIVE' ? 'AUTHORITATIVE' as const : 'EXTRACTED' as const,
        trust_level: 'AUTHORITATIVE' as const,
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

    // ── Trust Enforcement: Node ID uniqueness (Req 6.2) ─────────────────────
    throwOnViolations(enforceNodeIdUniqueness(nodes), 'buildCanonicalGraph (node uniqueness)');

    // ── Trust Enforcement: Canonical provenance (Req 6.3, 4.8) ──────────────
    const provenanceResults: EnforcementResult[] = [];
    for (const node of nodes) {
        provenanceResults.push(enforceCanonicalProvenance(node));
    }
    throwOnViolations(collectViolations(...provenanceResults), 'buildCanonicalGraph (provenance)');

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
                stableKey: `edge:${sid(from.id, to.id, 'canonical_dependency')}`,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'canonical_dependency',
                graph_kind: 'canonical',
                confidence_band: f.trust_level === 'AUTHORITATIVE' ? 'AUTHORITATIVE' as const : 'EXTRACTED' as const,
                trust_level: 'AUTHORITATIVE' as const,
                metadata: {
                    fromSymbol: from.symbol,
                    toSymbol: to.symbol,
                    flow_type: 'control' as const,
                },
                provenance: mapProvenance(f, 'buildCanonicalGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    // ── Trust Enforcement: Block exploratory-to-canonical upgrade (Req 4.7) ──
    // Check existing nodes in DB to prevent silent upgrades
    const upgradeResults: EnforcementResult[] = [];
    if (typeof db.getNode === 'function') {
        for (const node of nodes) {
            const existing = db.getNode(node.id);
            upgradeResults.push(enforceNoExploratoryUpgrade(existing, node));
        }
        throwOnViolations(collectViolations(...upgradeResults), 'buildCanonicalGraph (upgrade check)');
    }

    // Persist within transaction
    db.transaction(() => {
        nodes.forEach((n) => db.upsertNode(n));
        edges.forEach((e) => db.upsertEdge(e));
    });

    return { nodes, edges };
}
