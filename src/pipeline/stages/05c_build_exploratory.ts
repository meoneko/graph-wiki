/**
 * Stage 05c — Exploratory graph build with trust enforcement.
 *
 * Stores heuristic/AI-assisted relations flagged as non-authoritative.
 * Enforces:
 * - Node ID uniqueness across workspace (Req 6.2)
 * - Exploratory nodes/edges flagged as non-authoritative (Req 6.5)
 * - No exploratory-to-canonical silent upgrade (Req 4.7)
 * - Trust level preserved from validation stage (Req 6.1)
 *
 * @see Requirements 4.3, 4.7, 6.1, 6.2, 6.5
 */
import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import {
    enforceNodeIdUniqueness,
    enforceExploratoryNonAuthoritative,
    enforceExploratoryEdgeNonAuthoritative,
    enforceNoExploratoryUpgrade,
    collectViolations,
    throwOnViolations,
    type EnforcementResult,
} from './graph_build_enforcement.js';

function sid(...parts: string[]): string {
    return createHash('sha1').update(parts.join('|')).digest('hex');
}

function mapProvenance(fact: NormalizedFact, stage: string): Provenance {
    const extractionMethod = String(fact.lang_meta?.extraction_method ?? 'regex');
    const adapterId = String(fact.lang_meta?.extractor ?? fact.extractor ?? 'unknown');
    const adapterVersion = String(fact.lang_meta?.adapter_version ?? '1.0.0');
    const confidence = typeof fact.lang_meta?.confidence_score === 'number'
        ? fact.lang_meta.confidence_score as number
        : 0.50;
    const hash = fact.lang_meta?.stable_key
        ? String(fact.lang_meta.stable_key)
        : sid(fact.workspaceId, fact.project, fact.source_file, fact.symbol);

    return {
        source: 'ai',
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

export async function buildExploratoryGraph(facts: NormalizedFact[], workspaceId: string, db: GraphDB): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    // Only process explicitly classified EXPLORATORY facts. Missing trust is a validation bug.
    const exploratoryFacts = facts.filter(f => f.trust_level === 'EXPLORATORY');

    const nodes: GraphNode[] = exploratoryFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        stableKey: null,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        graph_kind: 'exploratory' as const,
        confidence_band: 'AMBIGUOUS' as const,
        trust_level: 'EXPLORATORY' as const,
        source_file: f.source_file,
        symbol: f.symbol,
        provenance: mapProvenance(f, 'buildExploratoryGraph'),
        metadata: {
            http_method: f.http_method,
            http_path: f.http_path,
            domain: f.domain,
            lang_meta: f.lang_meta,
            is_entrypoint: f.is_entrypoint,
            non_authoritative: true,
        },
        updated_at: new Date().toISOString(),
    }));

    // ── Trust Enforcement: Node ID uniqueness (Req 6.2) ─────────────────────
    throwOnViolations(enforceNodeIdUniqueness(nodes), 'buildExploratoryGraph (node uniqueness)');

    // ── Trust Enforcement: Exploratory non-authoritative (Req 6.5) ──────────
    const nonAuthResults: EnforcementResult[] = [];
    for (const node of nodes) {
        nonAuthResults.push(enforceExploratoryNonAuthoritative(node));
    }
    throwOnViolations(collectViolations(...nonAuthResults), 'buildExploratoryGraph (non-authoritative)');

    // ── Trust Enforcement: Block exploratory-to-canonical upgrade (Req 4.7) ──
    // Filter out nodes that would overwrite canonical nodes.
    let safeNodes: GraphNode[];
    if (typeof db.getNode === 'function') {
        safeNodes = nodes.filter((node) => {
            const existing = db.getNode(node.id);
            // Don't overwrite canonical nodes with exploratory
            return !(existing && existing.graph_kind === 'canonical');
        });
    } else {
        safeNodes = nodes;
    }

    const nodeBySymbol = new Map(safeNodes.map((n) => [n.symbol ?? n.label, n]));
    const edges: GraphEdge[] = [];

    for (const f of exploratoryFacts) {
        const from = nodeBySymbol.get(f.symbol);
        if (!from) continue;
        for (const called of f.called_symbols ?? []) {
            const to = nodeBySymbol.get(called);
            if (!to) continue;
            edges.push({
                id: `edge:${sid(from.id, to.id, 'exploratory_dependency')}`,
                stableKey: null,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'exploratory_dependency',
                graph_kind: 'exploratory',
                confidence_band: 'AMBIGUOUS' as const,
                trust_level: 'EXPLORATORY' as const,
                metadata: {
                    fromSymbol: from.symbol,
                    toSymbol: to.symbol,
                    flow_type: 'control' as const,
                    non_authoritative: true,
                },
                provenance: mapProvenance(f, 'buildExploratoryGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    // ── Trust Enforcement: Exploratory edges non-authoritative (Req 6.5) ────
    const edgeNonAuthResults: EnforcementResult[] = [];
    for (const edge of edges) {
        edgeNonAuthResults.push(enforceExploratoryEdgeNonAuthoritative(edge));
    }
    throwOnViolations(collectViolations(...edgeNonAuthResults), 'buildExploratoryGraph (edge non-authoritative)');

    db.transaction(() => {
        safeNodes.forEach((n) => db.upsertNode(n));
        edges.forEach((e) => db.upsertEdge(e));
    });

    return { nodes: safeNodes, edges };
}
