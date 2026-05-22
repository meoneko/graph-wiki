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

// ── Partial Class Merge ─────────────────────────────────────────────────────

export interface PartialClassMergeResult {
    nodes: GraphNode[];
    edges: GraphEdge[];
    warnings: string[];
}

/**
 * Merges partial class fragments into virtual_class nodes in the derived layer.
 *
 * Algorithm:
 * 1. Filter canonical nodes where type === 'csharp_class' and lang_meta?.isPartial === true
 * 2. Group by project + label (class name)
 * 3. For groups with ≥2 fragments: check first-level subdirectory ambiguity
 * 4. If ambiguous (≥2 distinct dirs): emit PARTIAL_CLASS_NAMESPACE_AMBIGUOUS warning, skip
 * 5. Otherwise: create virtual_class node + is_partial_of edges
 */
export function mergePartialClasses(
    workspaceId: string,
    db: GraphDB,
): PartialClassMergeResult {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const warnings: string[] = [];

    // Step 1: Filter partial class fragments
    const allNodes = db.getAllNodesByWorkspace(workspaceId);
    const fragments = allNodes.filter(
        (n) => n.type === 'csharp_class' && n.lang_meta?.isPartial === true,
    );

    // Step 2: Group by project + label (class name)
    const groups = new Map<string, GraphNode[]>();
    for (const fragment of fragments) {
        const key = `${fragment.project}|${fragment.label}`;
        const existing = groups.get(key);
        if (existing) {
            existing.push(fragment);
        } else {
            groups.set(key, [fragment]);
        }
    }

    const timestamp = new Date().toISOString();

    for (const [_groupKey, groupFragments] of groups) {
        // Step 3: Skip groups with fewer than 2 fragments
        if (groupFragments.length < 2) continue;

        const project = groupFragments[0]!.project;
        const className = groupFragments[0]!.label;

        // Step 4: Check first-level subdirectory ambiguity
        const firstLevelDirs = new Set<string>();
        for (const frag of groupFragments) {
            if (frag.source_file) {
                // Extract first-level subdirectory from source_file path
                const normalized = frag.source_file.replace(/\\/g, '/');
                const parts = normalized.split('/');
                // First-level subdir is the first path segment (if file is in a subdir)
                const firstDir = parts.length > 1 ? parts[0]! : '';
                firstLevelDirs.add(firstDir);
            }
        }

        if (firstLevelDirs.size >= 2) {
            // Ambiguous: fragments in different first-level subdirectories
            const dirs = [...firstLevelDirs].sort();
            warnings.push(
                `PARTIAL_CLASS_NAMESPACE_AMBIGUOUS: ${className} (project: ${project}, dirs: [${dirs.join(', ')}])`,
            );
            continue;
        }

        // Step 5: Resolve common namespace
        const namespaces = new Set<string>();
        for (const frag of groupFragments) {
            if (frag.lang_meta?.namespace && typeof frag.lang_meta.namespace === 'string') {
                namespaces.add(frag.lang_meta.namespace);
            }
        }
        const commonNamespace = namespaces.size === 1 ? [...namespaces][0] : undefined;

        // Sort fragments alphabetically by node id for mergedFrom
        const sortedFragments = [...groupFragments].sort((a, b) => a.id.localeCompare(b.id));

        // Step 6: Create virtual_class node
        const virtualId = `virtual_class:${sid(workspaceId, project, className)}`;

        const virtualNode: GraphNode = {
            id: virtualId,
            stableKey: virtualId,
            type: 'virtual_class',
            workspace: workspaceId,
            project,
            graph_kind: 'derived',
            confidence_band: 'INFERRED',
            trust_level: 'DERIVED',
            label: className,
            symbol: className,
            source_file: undefined,
            provenance: {
                source: 'analysis',
                artifact_source: 'cross-file-analysis',
                producer_stage: 'buildDerivedGraph',
                rule: 'partial-class-merge',
                timestamp,
            },
            lang_meta: {
                fragmentCount: groupFragments.length,
                mergedFrom: sortedFragments.map((f) => f.id),
                ...(commonNamespace !== undefined ? { namespace: commonNamespace } : {}),
            },
            updated_at: timestamp,
        };

        nodes.push(virtualNode);

        // Step 7: Create is_partial_of edges from each fragment to the virtual_class
        for (const fragment of groupFragments) {
            const edgeId = `edge:${sid(fragment.id, virtualId, 'is_partial_of')}`;

            const edge: GraphEdge = {
                id: edgeId,
                stableKey: edgeId,
                workspace: workspaceId,
                from_id: fragment.id,
                to_id: virtualId,
                type: 'is_partial_of',
                graph_kind: 'derived',
                confidence_band: 'INFERRED',
                trust_level: 'DERIVED',
                provenance: {
                    source: 'analysis',
                    artifact_source: 'cross-file-analysis',
                    producer_stage: 'buildDerivedGraph',
                    rule: 'partial-class-merge',
                    timestamp,
                },
                metadata: {
                    derivation_rule: 'partial-class-merge',
                },
                updated_at: timestamp,
            };

            edges.push(edge);
        }
    }

    return { nodes, edges, warnings };
}

// ── Contains Edge Materialization ────────────────────────────────────────────

export interface ContainsEdgeResult {
    edges: GraphEdge[];
    warnings: string[];
}

/**
 * Materializes `contains` edges from class nodes to their method nodes.
 *
 * Resolution priority for the parent class node:
 * 1. virtual_class node for that class name in same project
 * 2. csharp_class fragment matching by source_file
 * 3. Any csharp_class fragment with same label in same project
 *
 * If no match is found, a warning is emitted and edge creation is skipped.
 * Exactly one contains edge is created per method node.
 */
export function materializeContainsEdges(
    workspaceId: string,
    db: GraphDB,
): ContainsEdgeResult {
    const edges: GraphEdge[] = [];
    const warnings: string[] = [];

    const timestamp = new Date().toISOString();

    // Get ALL nodes in the workspace (both canonical and derived)
    const allNodes = db.getAllNodesByWorkspace(workspaceId);

    // Find all csharp_method nodes
    const methodNodes = allNodes.filter((n) => n.type === 'csharp_method');

    // Index class nodes by project for efficient lookup
    const virtualClassesByProject = new Map<string, GraphNode[]>();
    const classFragmentsByProject = new Map<string, GraphNode[]>();

    for (const node of allNodes) {
        if (node.type === 'virtual_class') {
            const existing = virtualClassesByProject.get(node.project);
            if (existing) {
                existing.push(node);
            } else {
                virtualClassesByProject.set(node.project, [node]);
            }
        } else if (node.type === 'csharp_class') {
            const existing = classFragmentsByProject.get(node.project);
            if (existing) {
                existing.push(node);
            } else {
                classFragmentsByProject.set(node.project, [node]);
            }
        }
    }

    for (const method of methodNodes) {
        const containingClass = method.lang_meta?.containingClass as string | undefined;
        if (!containingClass) continue;

        const project = method.project;
        const methodSourceFile = method.lang_meta?.sourceFile as string | undefined;

        let classNode: GraphNode | undefined;

        // Tier 1: virtual_class node for that class name in same project
        const virtualClasses = virtualClassesByProject.get(project) ?? [];
        classNode = virtualClasses.find((n) => n.label === containingClass);

        // Tier 2: csharp_class fragment matching by source_file
        if (!classNode && methodSourceFile) {
            const fragments = classFragmentsByProject.get(project) ?? [];
            classNode = fragments.find(
                (n) => n.label === containingClass && n.source_file === methodSourceFile,
            );
        }

        // Tier 3: Any csharp_class fragment with same label in same project
        if (!classNode) {
            const fragments = classFragmentsByProject.get(project) ?? [];
            classNode = fragments.find((n) => n.label === containingClass);
        }

        // No match found — emit warning and skip
        if (!classNode) {
            warnings.push(
                `CONTAINS_EDGE_UNRESOLVED: method ${method.symbol} references class ${containingClass} which has no matching node in project ${project}`,
            );
            continue;
        }

        // Create contains edge
        const edgeId = `edge:${sid(classNode.id, method.id, 'contains')}`;

        const edge: GraphEdge = {
            id: edgeId,
            stableKey: edgeId,
            workspace: workspaceId,
            from_id: classNode.id,
            to_id: method.id,
            type: 'contains',
            graph_kind: 'derived',
            confidence_band: 'INFERRED',
            trust_level: 'DERIVED',
            provenance: {
                source: 'analysis',
                artifact_source: 'cross-file-analysis',
                producer_stage: 'buildDerivedGraph',
                rule: 'contains-edge-materialization',
                timestamp,
            },
            metadata: {
                derivation_rule: 'contains-edge-materialization',
            },
            updated_at: timestamp,
        };

        edges.push(edge);
    }

    return { edges, warnings };
}

// ── Derived Graph Options ───────────────────────────────────────────────────

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

    // ── Partial Class Support ─────────────────────────────────────────────────
    // Step 1: Delete stale edges first (before nodes, to satisfy foreign key constraints)
    db.deleteEdgesByType(workspaceId, 'is_partial_of');
    // Scope contains edge deletion to only those produced by this feature
    db.deleteEdgesByMetadataRule(workspaceId, 'contains', 'contains-edge-materialization');
    // Now safe to delete virtual_class nodes (no edges reference them)
    db.deleteNodesByType(workspaceId, 'virtual_class');

    // Step 2: Merge partial class fragments into virtual_class nodes
    const mergeResult = mergePartialClasses(workspaceId, db);
    nodes.push(...mergeResult.nodes);
    edges.push(...mergeResult.edges);

    // Step 3: Materialize contains edges (after merge, so virtual_class nodes are available)
    // First persist merge results so materializeContainsEdges can find virtual_class nodes in DB
    db.transaction(() => {
        mergeResult.nodes.forEach((n) => db.upsertNode(n));
        mergeResult.edges.forEach((e) => db.upsertEdge(e));
    });

    const containsResult = materializeContainsEdges(workspaceId, db);
    edges.push(...containsResult.edges);

    db.transaction(() => {
        nodes.forEach((n) => db.upsertNode(n));
        edges.forEach((e) => db.upsertEdge(e));
    });

    return { nodes, edges };
}
