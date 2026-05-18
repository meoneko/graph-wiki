/**
 * Stage 05b — Derived graph build with trust enforcement.
 *
 * Computes derived facts from canonical inputs with explicit derivation rules.
 * Enforces:
 * - Node ID uniqueness across workspace (Req 6.2)
 * - Derived nodes/edges require derivation rule (Req 6.4)
 * - No derived-from-derived unless rule is versioned, deterministic, and auditable (Req 4.6)
 * - Trust level preserved from validation stage (Req 6.1)
 *
 * @see Requirements 4.4, 4.5, 4.6, 6.1, 6.2, 6.4
 */
import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { EdgeType } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { canonicalizePath } from '../../storage/pathUtils.js';
import type { ImportMapArtifact } from '../importMap.js';
import {
    enforceNodeIdUniqueness,
    enforceDerivedNodeRule,
    enforceDerivedRule,
    enforceDerivedFromDerived,
    collectViolations,
    throwOnViolations,
    type EnforcementResult,
} from './graph_build_enforcement.js';

function sid(...parts: string[]): string {
    return createHash('sha1').update(parts.join('|')).digest('hex');
}

function mapProvenance(fact: NormalizedFact, stage: string): Provenance {
    const extractionMethod = String(fact.lang_meta?.extraction_method ?? 'static-analysis');
    const adapterId = String(fact.lang_meta?.extractor ?? fact.extractor ?? 'unknown');
    const adapterVersion = String(fact.lang_meta?.adapter_version ?? '1.0.0');
    const confidence = typeof fact.lang_meta?.confidence_score === 'number'
        ? fact.lang_meta.confidence_score as number
        : 0.85;
    const hash = fact.lang_meta?.stable_key
        ? String(fact.lang_meta.stable_key)
        : sid(fact.workspaceId, fact.project, fact.source_file, fact.symbol);

    return {
        source: 'analysis',
        artifact_source: fact.source_file || 'cross-file-analysis',
        producer_stage: stage,
        timestamp: new Date().toISOString(),
        file: fact.source_file,
        line_start: fact.line_start,
        line_end: fact.line_end,
        rule: 'derived-from-canonical',
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

function addToMap<V>(map: Map<string, V[]>, key: string, value: V): void {
    const existing = map.get(key);
    if (existing) {
        existing.push(value);
    } else {
        map.set(key, [value]);
    }
}

export interface DerivedGraphOptions {
    /** Per-project ImportMap artifacts — used to create module-level `imports` edges. */
    importMaps?: ImportMapArtifact[];
    /** Canonical nodes already built — needed to resolve cross-file import targets. */
    canonicalNodes?: GraphNode[];
}

export async function buildDerivedGraph(
    facts: NormalizedFact[],
    workspaceId: string,
    db: GraphDB,
    options: DerivedGraphOptions = {},
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    // Only process facts that are DERIVED
    const derivedFacts = facts.filter((f) => f.trust_level === 'DERIVED');

    const nodes: GraphNode[] = derivedFacts.map((f) => ({
        id: `node:${f.candidate_id}`,
        stableKey: `node:${f.candidate_id}`,
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
        graph_kind: 'derived' as const,
        confidence_band: 'EXTRACTED' as const, // Derived usually means semi-authoritative
        trust_level: 'DERIVED' as const,
        source_file: f.source_file,
        symbol: f.symbol,
        provenance: mapProvenance(f, 'buildDerivedGraph'),
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
    throwOnViolations(enforceNodeIdUniqueness(nodes), 'buildDerivedGraph (node uniqueness)');

    // ── Trust Enforcement: Derived nodes require derivation rule (Req 6.4) ──
    const nodeRuleResults: EnforcementResult[] = [];
    for (const node of nodes) {
        nodeRuleResults.push(enforceDerivedNodeRule(node));
    }
    throwOnViolations(collectViolations(...nodeRuleResults), 'buildDerivedGraph (node derivation rule)');

    const nodeBySymbol = new Map(nodes.map((n) => [n.symbol ?? n.label, n]));
    const edges: GraphEdge[] = [];

    for (const f of derivedFacts) {
        const from = nodeBySymbol.get(f.symbol);
        if (!from) continue;
        for (const called of f.called_symbols ?? []) {
            const to = nodeBySymbol.get(called);
            if (!to) continue;
            const edge: GraphEdge = {
                id: `edge:${sid(from.id, to.id, 'derived_dependency')}`,
                stableKey: `edge:${sid(from.id, to.id, 'derived_dependency')}`,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'derived_dependency',
                graph_kind: 'derived',
                confidence_band: 'EXTRACTED' as const,
                trust_level: 'DERIVED' as const,
                metadata: {
                    fromSymbol: from.symbol,
                    toSymbol: to.symbol,
                    flow_type: 'data' as const,
                    derivation_rule: 'derived-from-canonical',
                },
                provenance: mapProvenance(f, 'buildDerivedGraph'),
                updated_at: new Date().toISOString(),
            };

            // ── Trust Enforcement: Derived-from-derived check (Req 4.6) ─────
            // Check if source node is itself derived (from DB)
            if (typeof db.getNode === 'function') {
                const existingFrom = db.getNode(from.id);
                if (existingFrom && existingFrom.graph_kind === 'derived') {
                    // Derived-from-derived: must be versioned, deterministic, and auditable
                    const result = enforceDerivedFromDerived(existingFrom, edge, {
                        ruleVersion: '1.0',
                        isDeterministic: true,
                        isAuditable: true,
                    });
                    if (!result.passed) {
                        throwOnViolations(result, 'buildDerivedGraph (derived-from-derived)');
                    }
                }
            }

            edges.push(edge);
        }
    }

    // ── Trust Enforcement: Derived edges require derivation rule (Req 6.4) ──
    const edgeRuleResults: EnforcementResult[] = [];
    for (const edge of edges) {
        edgeRuleResults.push(enforceDerivedRule(edge));
    }
    throwOnViolations(collectViolations(...edgeRuleResults), 'buildDerivedGraph (edge derivation rule)');

    // Build module-level `imports` edges from ImportMap data.
    if (options.importMaps && options.importMaps.length > 0) {
        const allNodes = [...(options.canonicalNodes ?? []), ...nodes];

        // Index nodes by normalised source_file
        const nodesByFile = new Map<string, GraphNode[]>();
        for (const node of allNodes) {
            if (!node.source_file) continue;
            const raw = canonicalizePath(node.source_file);
            addToMap(nodesByFile, raw, node);
            const noExt = raw.replace(/\.(ts|tsx|js|jsx|cs)$/i, '');
            if (noExt !== raw) addToMap(nodesByFile, noExt, node);
        }

        const importProvenance: Provenance = {
            source: 'analysis',
            artifact_source: 'import-map',
            producer_stage: 'buildDerivedGraph',
            timestamp: new Date().toISOString(),
            rule: 'import-resolution',
            workspaceId,
            sourceRootId: workspaceId,
            extractionStage: 'buildDerivedGraph',
            extractionMethod: 'static-analysis',
            adapterId: 'import-map-resolver',
            adapterVersion: '1.0.0',
            confidence: 0.90,
        };

        // Deduplicate edges
        const seenImportEdges = new Set<string>();

        for (const importMap of options.importMaps) {
            for (const [fromFile, toFiles] of Object.entries(importMap.imports)) {
                if (toFiles.length === 0) continue;

                const fromNodes = nodesByFile.get(fromFile)
                    ?? nodesByFile.get(fromFile.replace(/\.(ts|tsx|js|jsx)$/i, ''))
                    ?? [];
                if (fromNodes.length === 0) continue;

                const fromNode = fromNodes.find((n) => n.metadata?.is_entrypoint) ?? fromNodes[0]!;

                for (const toFile of toFiles) {
                    const toNodes = nodesByFile.get(toFile) ?? [];
                    if (toNodes.length === 0) continue;
                    const toNode = toNodes[0]!;
                    if (fromNode.id === toNode.id) continue;

                    const edgeKey = `${fromNode.id}|${toNode.id}`;
                    if (seenImportEdges.has(edgeKey)) continue;
                    seenImportEdges.add(edgeKey);

                    edges.push({
                        id: `edge:${sid(fromNode.id, toNode.id, EdgeType.imports)}`,
                        stableKey: `edge:${sid(fromNode.id, toNode.id, EdgeType.imports)}`,
                        workspace: workspaceId,
                        from_id: fromNode.id,
                        to_id: toNode.id,
                        type: EdgeType.imports,
                        graph_kind: 'derived',
                        confidence_band: 'INFERRED' as const,
                        trust_level: 'DERIVED' as const,
                        provenance: importProvenance,
                        metadata: {
                            derivation_rule: 'import-resolution',
                        },
                        updated_at: new Date().toISOString(),
                    });
                }
            }
        }
    }

    db.transaction(() => {
        nodes.forEach((n) => db.upsertNode(n));
        edges.forEach((e) => db.upsertEdge(e));
    });

    return { nodes, edges };
}
