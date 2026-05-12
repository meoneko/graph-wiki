import { createHash } from 'node:crypto';
import type { GraphEdge, GraphNode, NormalizedFact, Provenance } from '../../core/types.js';
import { EdgeType } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { canonicalizePath } from '../../storage/pathUtils.js';
import type { ImportMapArtifact } from '../importMap.js';

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
        workspace: f.workspaceId,
        project: f.project,
        label: f.symbol,
        type: f.candidate_type,
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
            is_entrypoint: f.is_entrypoint,
        },
        updated_at: new Date().toISOString(),
    }));

    const nodeBySymbol = new Map(nodes.map((n) => [n.symbol ?? n.label, n]));
    const edges: GraphEdge[] = [];

    for (const f of derivedFacts) {
        const from = nodeBySymbol.get(f.symbol);
        if (!from) continue;
        for (const called of f.called_symbols ?? []) {
            const to = nodeBySymbol.get(called);
            if (!to) continue;
            edges.push({
                id: `edge:${sid(from.id, to.id, 'derived_dependency')}`,
                workspace: workspaceId,
                from_id: from.id,
                to_id: to.id,
                type: 'derived_dependency',
                graph_kind: 'derived',
                confidence_band: 'EXTRACTED',
                trust_level: 'DERIVED',
                metadata: {
                    fromSymbol: from.symbol,
                    toSymbol: to.symbol,
                    flow_type: 'data', // Derived often relates to data flow/composition
                },
                provenance: mapProvenance(f, 'buildDerivedGraph'),
                updated_at: new Date().toISOString(),
            });
        }
    }

    // Build module-level `imports` edges from ImportMap data.
    // The importMap records which files import which other files (resolved to absolute
    // canonical paths). We pick one representative node per file (first entrypoint, else
    // first node) and create a single `imports` edge per file-pair so that graph traversal
    // tools can follow module dependencies.
    if (options.importMaps && options.importMaps.length > 0) {
        const allNodes = [...(options.canonicalNodes ?? []), ...nodes];

        // Index nodes by normalised source_file — both with and without extension
        // so we can match regardless of how the importMap stored the path.
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
        };

        // Deduplicate edges — importMaps from multiple projects may overlap.
        const seenImportEdges = new Set<string>();

        for (const importMap of options.importMaps) {
            for (const [fromFile, toFiles] of Object.entries(importMap.imports)) {
                if (toFiles.length === 0) continue;

                // fromFile has extension; try with and without
                const fromNodes = nodesByFile.get(fromFile)
                    ?? nodesByFile.get(fromFile.replace(/\.(ts|tsx|js|jsx)$/i, ''))
                    ?? [];
                if (fromNodes.length === 0) continue;

                // Pick first entrypoint as representative, fall back to first node
                const fromNode = fromNodes.find((n) => n.metadata?.is_entrypoint) ?? fromNodes[0]!;

                for (const toFile of toFiles) {
                    // toFile has no extension (stripped by normalizeImportSource)
                    const toNodes = nodesByFile.get(toFile) ?? [];
                    if (toNodes.length === 0) continue;
                    const toNode = toNodes[0]!;
                    if (fromNode.id === toNode.id) continue;

                    const edgeKey = `${fromNode.id}|${toNode.id}`;
                    if (seenImportEdges.has(edgeKey)) continue;
                    seenImportEdges.add(edgeKey);

                    edges.push({
                        id: `edge:${sid(fromNode.id, toNode.id, EdgeType.imports)}`,
                        workspace: workspaceId,
                        from_id: fromNode.id,
                        to_id: toNode.id,
                        type: EdgeType.imports,
                        graph_kind: 'derived',
                        confidence_band: 'INFERRED',
                        trust_level: 'DERIVED',
                        provenance: importProvenance,
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
