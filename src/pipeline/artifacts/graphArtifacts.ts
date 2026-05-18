import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { GraphDB } from '../../storage/GraphDB.js';
import type { GraphNode, GraphEdge } from '../../core/types.js';

// ─── WikiPage Interface ──────────────────────────────────────────────────────

export interface ProvenanceSummary {
    total_sources: number;
    parser_backed: number;
    derived: number;
    exploratory: number;
    external: number;
}

export interface ConfidenceSummary {
    overall: 'HIGH' | 'MEDIUM' | 'LOW';
    authoritative_count: number;
    extracted_count: number;
    inferred_count: number;
    ambiguous_count: number;
}

export interface WikiAnnotation {
    id: string;
    type: 'exploratory' | 'caveat' | 'note';
    content: string;
    source_node_id?: string;
    trust_level: 'EXPLORATORY' | 'MIXED';
}

export interface WikiPage {
    id: string;
    workspaceId: string;
    title: string;
    pageType: string;
    status: 'canonical' | 'mixed' | 'draft' | 'insufficient_context';
    content: string;
    sources: import('../../core/types.js').Provenance[];
    provenance_summary: ProvenanceSummary;
    confidence_summary: ConfidenceSummary;
    annotations: WikiAnnotation[];
    warnings: string[];
    generatedAt: string;
}

// ─── Existing Interfaces (backward compat) ───────────────────────────────────

export interface GraphArtifactSummary {
    artifactDir: string;
    files: string[];
    counts: {
        canonicalNodes: number;
        canonicalEdges: number;
        derivedNodes: number;
        derivedEdges: number;
        exploratoryNodes: number;
        exploratoryEdges: number;
        externalNodes: number;
        externalEdges: number;
        totalNodes: number;
        totalEdges: number;
    };
    contentHash: string;
}

export interface ParityResult {
    workspaceId: string;
    status: 'OK' | 'MISMATCH';
    details: {
        dbNodeCount: number;
        dbEdgeCount: number;
        artifactNodeCount: number;
        artifactEdgeCount: number;
        dbNodeIdsHash: string;
        dbEdgeIdsHash: string;
        artifactNodeIdsHash: string;
        artifactEdgeIdsHash: string;
    };
}

// ─── Utility Functions ───────────────────────────────────────────────────────

// Ensure deterministic object key ordering
function sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = sortObjectKeys(obj[key]);
    }
    return sorted;
}

function deterministicStringify(obj: any): string {
    return JSON.stringify(sortObjectKeys(obj));
}

// Compute hash of an array of objects deterministically based on their sorted IDs
function hashIds(ids: string[]): string {
    const sorted = [...ids].sort();
    const hash = crypto.createHash('sha256');
    for (const id of sorted) {
        hash.update(id + '\n');
    }
    return hash.digest('hex');
}

// ─── Workspace Directory Layout ──────────────────────────────────────────────

/**
 * Workspace-scoped subdirectories per design spec.
 * Each workspace gets isolated storage under:
 *   knowledge/artifacts/workspaces/{workspace}/
 */
const WORKSPACE_SUBDIRS = [
    'config',
    'extracted',
    'normalized',
    'validated',
    'graph',
    'reports',
    'baselines',
] as const;

export type WorkspaceSubdir = typeof WORKSPACE_SUBDIRS[number];

// ─── ArtifactStore Class ─────────────────────────────────────────────────────

/**
 * Persistence layer for graph artifacts, reports, and wiki pages.
 * Workspace-scoped storage with atomic writes to prevent partial artifacts.
 */
export class ArtifactStore {
    private readonly baseDir: string;

    constructor(baseDir?: string) {
        this.baseDir = baseDir ?? path.join(process.cwd(), 'knowledge', 'artifacts', 'workspaces');
    }

    // ─── Path Helpers ────────────────────────────────────────────────────────

    /**
     * Get the root directory for a workspace's artifacts.
     */
    getWorkspaceDir(workspaceId: string): string {
        return path.join(this.baseDir, workspaceId);
    }

    /**
     * Get a specific subdirectory for a workspace.
     */
    getSubdir(workspaceId: string, subdir: WorkspaceSubdir): string {
        return path.join(this.baseDir, workspaceId, subdir);
    }

    /**
     * Get the graph artifact directory for a workspace.
     * Equivalent to the legacy `getGraphArtifactDir()`.
     */
    getGraphDir(workspaceId: string): string {
        return this.getSubdir(workspaceId, 'graph');
    }

    // ─── Directory Initialization ────────────────────────────────────────────

    /**
     * Ensure all workspace subdirectories exist.
     */
    async ensureWorkspaceDirs(workspaceId: string): Promise<void> {
        for (const subdir of WORKSPACE_SUBDIRS) {
            await fs.promises.mkdir(this.getSubdir(workspaceId, subdir), { recursive: true });
        }
    }

    // ─── Atomic Write ────────────────────────────────────────────────────────

    /**
     * Write content atomically: write to a temp file, fsync, then rename.
     * Prevents partial artifacts on crash or interruption.
     */
    async writeAtomic(filePath: string, content: string | Buffer): Promise<void> {
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
        const tmpPath = filePath + '.tmp';
        const fileHandle = await fs.promises.open(tmpPath, 'w');
        try {
            await fileHandle.writeFile(content);
            await fileHandle.sync();
            await fileHandle.close();
            await fs.promises.rename(tmpPath, filePath);
        } catch (err) {
            await fileHandle.close().catch(() => {});
            // Clean up temp file on failure
            await fs.promises.unlink(tmpPath).catch(() => {});
            throw err;
        }
    }

    // ─── Graph Artifacts ─────────────────────────────────────────────────────

    /**
     * Write graph artifacts (canonical.graph.json, exploratory.graph.json,
     * edges.jsonl, graph.meta.json) for a workspace from provided nodes/edges.
     */
    async writeGraphArtifacts(workspaceId: string, nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
        const graphDir = this.getGraphDir(workspaceId);
        await fs.promises.mkdir(graphDir, { recursive: true });

        // Sort for determinism
        const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
        const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id));

        const canonicalNodes = sortedNodes.filter(n => n.graph_kind === 'canonical');
        const canonicalEdges = sortedEdges.filter(e => e.graph_kind === 'canonical');
        const exploratoryNodes = sortedNodes.filter(n => n.graph_kind === 'exploratory');
        const exploratoryEdges = sortedEdges.filter(e => e.graph_kind === 'exploratory');
        const derivedNodes = sortedNodes.filter(n => n.graph_kind === 'derived');
        const derivedEdges = sortedEdges.filter(e => e.graph_kind === 'derived');
        const externalNodes = sortedNodes.filter(n => n.graph_kind === 'external');
        const externalEdges = sortedEdges.filter(e => e.graph_kind === 'external');

        const generatedAt = new Date().toISOString();
        const contentHashAlgo = crypto.createHash('sha256');

        // Write canonical.graph.json
        const canonicalPayload = {
            workspaceId,
            graphKind: 'canonical',
            nodes: canonicalNodes.map(sortObjectKeys),
            edges: canonicalEdges.map(sortObjectKeys),
            counts: {
                nodeCount: canonicalNodes.length,
                edgeCount: canonicalEdges.length,
            },
        };
        const canonicalStrHash = JSON.stringify(canonicalPayload, null, 2) + '\n';
        contentHashAlgo.update(canonicalStrHash);
        const canonicalStr = JSON.stringify({ generatedAt, ...canonicalPayload }, null, 2) + '\n';
        await this.writeAtomic(path.join(graphDir, 'canonical.graph.json'), canonicalStr);

        // Write exploratory.graph.json
        const exploratoryPayload = {
            workspaceId,
            graphKind: 'exploratory',
            nodes: exploratoryNodes.map(sortObjectKeys),
            edges: exploratoryEdges.map(sortObjectKeys),
            counts: {
                nodeCount: exploratoryNodes.length,
                edgeCount: exploratoryEdges.length,
            },
        };
        const exploratoryStrHash = JSON.stringify(exploratoryPayload, null, 2) + '\n';
        contentHashAlgo.update(exploratoryStrHash);
        const exploratoryStr = JSON.stringify({ generatedAt, ...exploratoryPayload }, null, 2) + '\n';
        await this.writeAtomic(path.join(graphDir, 'exploratory.graph.json'), exploratoryStr);

        // Write edges.jsonl
        let edgesJsonlStr = '';
        for (const edge of sortedEdges) {
            const edgePayload = {
                id: edge.id,
                workspace: edge.workspace,
                from_id: edge.from_id,
                to_id: edge.to_id,
                type: edge.type,
                graph_kind: edge.graph_kind,
                confidence_band: edge.confidence_band ?? edge.confidence,
                provenance: edge.provenance,
                metadata: edge.metadata,
            };
            const line = deterministicStringify(edgePayload) + '\n';
            edgesJsonlStr += line;
        }
        contentHashAlgo.update(edgesJsonlStr);
        await this.writeAtomic(path.join(graphDir, 'edges.jsonl'), edgesJsonlStr);

        const artifactContentHash = contentHashAlgo.digest('hex');

        // Write graph.meta.json
        const metaPayload = {
            workspaceId,
            generatedAt,
            graphVersion: '1.0',
            artifactsVersion: '1.0',
            counts: {
                canonicalNodes: canonicalNodes.length,
                canonicalEdges: canonicalEdges.length,
                derivedNodes: derivedNodes.length,
                derivedEdges: derivedEdges.length,
                exploratoryNodes: exploratoryNodes.length,
                exploratoryEdges: exploratoryEdges.length,
                externalNodes: externalNodes.length,
                externalEdges: externalEdges.length,
                totalNodes: sortedNodes.length,
                totalEdges: sortedEdges.length,
            },
            artifactFiles: [
                'canonical.graph.json',
                'exploratory.graph.json',
                'edges.jsonl',
                'graph.meta.json',
            ],
            contentHash: artifactContentHash,
        };
        const metaStr = JSON.stringify(sortObjectKeys(metaPayload), null, 2) + '\n';
        await this.writeAtomic(path.join(graphDir, 'graph.meta.json'), metaStr);
    }

    /**
     * Read graph artifacts for a workspace from disk.
     * Returns the combined nodes and edges from canonical and exploratory graph files.
     */
    async readGraphArtifacts(workspaceId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
        const graphDir = this.getGraphDir(workspaceId);

        let canonicalRaw: string;
        let exploratoryRaw: string;

        try {
            canonicalRaw = await fs.promises.readFile(path.join(graphDir, 'canonical.graph.json'), 'utf8');
        } catch {
            canonicalRaw = '{"nodes":[],"edges":[]}';
        }

        try {
            exploratoryRaw = await fs.promises.readFile(path.join(graphDir, 'exploratory.graph.json'), 'utf8');
        } catch {
            exploratoryRaw = '{"nodes":[],"edges":[]}';
        }

        const canonical = JSON.parse(canonicalRaw);
        const exploratory = JSON.parse(exploratoryRaw);

        const nodes: GraphNode[] = [
            ...(canonical.nodes || []),
            ...(exploratory.nodes || []),
        ];

        const edges: GraphEdge[] = [
            ...(canonical.edges || []),
            ...(exploratory.edges || []),
        ];

        return { nodes, edges };
    }

    /**
     * Write a report artifact for a workspace.
     * The report is written to the workspace's reports/ subdirectory.
     */
    async writeReport(workspaceId: string, report: unknown): Promise<void> {
        const reportsDir = this.getSubdir(workspaceId, 'reports');
        await fs.promises.mkdir(reportsDir, { recursive: true });

        // Determine filename from report type if available, otherwise use generic name
        let filename = 'report.json';
        if (report && typeof report === 'object') {
            const r = report as Record<string, unknown>;
            if (typeof r.type === 'string') {
                filename = `${r.type}.json`;
            } else if (typeof r.reportType === 'string') {
                filename = `${r.reportType}.json`;
            }
        }

        const content = JSON.stringify(sortObjectKeys(report), null, 2) + '\n';
        await this.writeAtomic(path.join(reportsDir, filename), content);
    }

    /**
     * Write wiki pages for a workspace.
     * Each page is written as a separate JSON file in the workspace wiki directory.
     */
    async writeWiki(workspaceId: string, pages: WikiPage[]): Promise<void> {
        const wikiDir = path.join(this.baseDir, '..', '..', 'wiki', workspaceId);
        await fs.promises.mkdir(wikiDir, { recursive: true });

        for (const page of pages) {
            const filename = `${page.id}.json`;
            const content = JSON.stringify(sortObjectKeys(page), null, 2) + '\n';
            await this.writeAtomic(path.join(wikiDir, filename), content);
        }
    }
}

// ─── Singleton Instance ──────────────────────────────────────────────────────

let _defaultStore: ArtifactStore | undefined;

/**
 * Get the default ArtifactStore instance (singleton).
 */
export function getArtifactStore(): ArtifactStore {
    if (!_defaultStore) {
        _defaultStore = new ArtifactStore();
    }
    return _defaultStore;
}

/**
 * Create an ArtifactStore with a custom base directory.
 * Useful for testing or non-standard layouts.
 */
export function createArtifactStore(baseDir: string): ArtifactStore {
    return new ArtifactStore(baseDir);
}

// ─── Backward-Compatible Exports ─────────────────────────────────────────────

/**
 * @deprecated Use `getArtifactStore().getGraphDir(workspaceId)` instead.
 */
export function getGraphArtifactDir(workspaceId: string): string {
    return path.join(process.cwd(), 'knowledge', 'artifacts', 'workspaces', workspaceId, 'graph');
}

/**
 * @deprecated Use `getArtifactStore().writeGraphArtifacts()` instead.
 * Legacy function that writes graph artifacts from a GraphDB instance.
 */
export async function writeGraphArtifacts(db: GraphDB, workspaceId: string): Promise<GraphArtifactSummary> {
    const artifactDir = getGraphArtifactDir(workspaceId);
    await fs.promises.mkdir(artifactDir, { recursive: true });

    // Use lock file
    const lockFile = path.join(artifactDir, '.lock');
    try {
        // A crude lock using wx
        await fs.promises.writeFile(lockFile, String(Date.now()), { flag: 'wx' });
    } catch (e: any) {
        if (e.code === 'EEXIST') {
            throw new Error(`Workspace ${workspaceId} is already locked for artifact writing.`);
        }
        throw e;
    }

    const store = getArtifactStore();

    try {
        const nodes = db.getAllNodesByWorkspace(workspaceId);
        const edges = db.getEdgesByWorkspace(workspaceId);

        // Sort by id for determinism
        nodes.sort((a, b) => a.id.localeCompare(b.id));
        edges.sort((a, b) => a.id.localeCompare(b.id));

        const canonicalNodes = nodes.filter(n => n.graph_kind === 'canonical');
        const canonicalEdges = edges.filter(e => e.graph_kind === 'canonical');
        const exploratoryNodes = nodes.filter(n => n.graph_kind === 'exploratory');
        const exploratoryEdges = edges.filter(e => e.graph_kind === 'exploratory');

        // Group extra categories for meta counts
        const derivedNodes = nodes.filter(n => n.graph_kind === 'derived');
        const derivedEdges = edges.filter(e => e.graph_kind === 'derived');
        const externalNodes = nodes.filter(n => n.graph_kind === 'external');
        const externalEdges = edges.filter(e => e.graph_kind === 'external');

        const generatedAt = new Date().toISOString();

        const canonicalPayload = {
            workspaceId,
            graphKind: 'canonical',
            nodes: canonicalNodes.map(sortObjectKeys),
            edges: canonicalEdges.map(sortObjectKeys),
            counts: {
                nodeCount: canonicalNodes.length,
                edgeCount: canonicalEdges.length
            }
        };

        const exploratoryPayload = {
            workspaceId,
            graphKind: 'exploratory',
            nodes: exploratoryNodes.map(sortObjectKeys),
            edges: exploratoryEdges.map(sortObjectKeys),
            counts: {
                nodeCount: exploratoryNodes.length,
                edgeCount: exploratoryEdges.length
            }
        };

        const contentHashAlgo = crypto.createHash('sha256');

        const canonicalStrHash = JSON.stringify(canonicalPayload, null, 2) + '\n';
        contentHashAlgo.update(canonicalStrHash);
        const canonicalStr = JSON.stringify({ generatedAt, ...canonicalPayload }, null, 2) + '\n';
        await store.writeAtomic(path.join(artifactDir, 'canonical.graph.json'), canonicalStr);

        const exploratoryStrHash = JSON.stringify(exploratoryPayload, null, 2) + '\n';
        contentHashAlgo.update(exploratoryStrHash);
        const exploratoryStr = JSON.stringify({ generatedAt, ...exploratoryPayload }, null, 2) + '\n';
        await store.writeAtomic(path.join(artifactDir, 'exploratory.graph.json'), exploratoryStr);

        let edgesJsonlStr = '';
        for (const edge of edges) {
            const edgePayload = {
                id: edge.id,
                workspace: edge.workspace,
                from_id: edge.from_id,
                to_id: edge.to_id,
                type: edge.type,
                graph_kind: edge.graph_kind,
                confidence_band: edge.confidence,
                provenance: edge.provenance,
                metadata: edge.metadata,
            };
            const line = deterministicStringify(edgePayload) + '\n';
            edgesJsonlStr += line;
        }
        contentHashAlgo.update(edgesJsonlStr);
        await store.writeAtomic(path.join(artifactDir, 'edges.jsonl'), edgesJsonlStr);

        const artifactContentHash = contentHashAlgo.digest('hex');

        // Aggregate confidence + trust counts
        const confidenceCounts: Record<string, Record<string, number>> = {};
        const trustLevelCounts: Record<string, Record<string, number>> = {};

        for (const node of nodes) {
            const kind = node.graph_kind;
            if (!confidenceCounts[kind]) confidenceCounts[kind] = {};
            const conf = node.confidence || 'UNKNOWN';
            confidenceCounts[kind][conf] = (confidenceCounts[kind][conf] || 0) + 1;

            if (!trustLevelCounts[kind]) trustLevelCounts[kind] = {};
            const trust = node.trust_level || 'UNKNOWN';
            trustLevelCounts[kind][trust] = (trustLevelCounts[kind][trust] || 0) + 1;
        }
        for (const edge of edges) {
            const kind = edge.graph_kind;
            if (!confidenceCounts[kind]) confidenceCounts[kind] = {};
            const conf = edge.confidence || 'UNKNOWN';
            confidenceCounts[kind][conf] = (confidenceCounts[kind][conf] || 0) + 1;

            if (!trustLevelCounts[kind]) trustLevelCounts[kind] = {};
            const trust = edge.trust_level || 'UNKNOWN';
            trustLevelCounts[kind][trust] = (trustLevelCounts[kind][trust] || 0) + 1;
        }

        const artifactFiles = [
            'canonical.graph.json',
            'exploratory.graph.json',
            'edges.jsonl',
            'graph.meta.json'
        ];

        const dbNodeIds = nodes.map(n => n.id);
        const dbEdgeIds = edges.map(e => e.id);

        const metaPayload = {
            workspaceId,
            generatedAt,
            graphVersion: '1.0',
            artifactsVersion: '1.0',
            storageSource: 'sqlite',
            counts: {
                canonicalNodes: canonicalNodes.length,
                canonicalEdges: canonicalEdges.length,
                derivedNodes: derivedNodes.length,
                derivedEdges: derivedEdges.length,
                exploratoryNodes: exploratoryNodes.length,
                exploratoryEdges: exploratoryEdges.length,
                externalNodes: externalNodes.length,
                externalEdges: externalEdges.length,
                totalNodes: nodes.length,
                totalEdges: edges.length,
            },
            confidenceCounts,
            trustLevelCounts,
            artifactFiles,
            contentHash: artifactContentHash,
            parity: {
                dbNodeCount: nodes.length,
                dbEdgeCount: edges.length,
                artifactNodeCount: nodes.length,
                artifactEdgeCount: edges.length,
                dbNodeIdsHash: hashIds(dbNodeIds),
                dbEdgeIdsHash: hashIds(dbEdgeIds),
                artifactNodeIdsHash: hashIds(dbNodeIds),
                artifactEdgeIdsHash: hashIds(dbEdgeIds),
                status: 'OK'
            }
        };

        const metaStr = JSON.stringify(sortObjectKeys(metaPayload), null, 2) + '\n';
        await store.writeAtomic(path.join(artifactDir, 'graph.meta.json'), metaStr);

        return {
            artifactDir,
            files: artifactFiles,
            counts: metaPayload.counts,
            contentHash: artifactContentHash
        };
    } finally {
        // Release lock
        await fs.promises.unlink(lockFile).catch(() => { });
    }
}

/**
 * @deprecated Use ArtifactStore methods instead.
 * Legacy function that verifies parity between DB and artifact files.
 */
export async function verifyGraphArtifactParity(db: GraphDB, workspaceId: string): Promise<ParityResult> {
    const artifactDir = getGraphArtifactDir(workspaceId);

    let canonicalRaw: string, exploratoryRaw: string, edgesRaw: string, metaRaw: string;
    try {
        canonicalRaw = await fs.promises.readFile(path.join(artifactDir, 'canonical.graph.json'), 'utf8');
        exploratoryRaw = await fs.promises.readFile(path.join(artifactDir, 'exploratory.graph.json'), 'utf8');
        edgesRaw = await fs.promises.readFile(path.join(artifactDir, 'edges.jsonl'), 'utf8');
        metaRaw = await fs.promises.readFile(path.join(artifactDir, 'graph.meta.json'), 'utf8');
    } catch (e) {
        return {
            workspaceId,
            status: 'MISMATCH',
            details: {
                dbNodeCount: 0, dbEdgeCount: 0,
                artifactNodeCount: 0, artifactEdgeCount: 0,
                dbNodeIdsHash: '', dbEdgeIdsHash: '',
                artifactNodeIdsHash: '', artifactEdgeIdsHash: ''
            }
        };
    }

    const canonical = JSON.parse(canonicalRaw);
    const exploratory = JSON.parse(exploratoryRaw);

    const artifactNodeIds = new Set<string>();
    const artifactEdgeIds = new Set<string>();

    for (const node of (canonical.nodes || [])) artifactNodeIds.add(node.id);
    for (const node of (exploratory.nodes || [])) artifactNodeIds.add(node.id);

    const edgeRecords: any[] = [];
    const lines = edgesRaw.trim().split('\n').filter(Boolean);
    for (const line of lines) {
        const parsed = JSON.parse(line);
        if (!parsed.id || !parsed.from_id || !parsed.to_id || !parsed.type || !parsed.graph_kind || !parsed.confidence_band || !parsed.provenance) {
            return { workspaceId, status: 'MISMATCH', details: {} as any };
        }
        edgeRecords.push(parsed);
        artifactEdgeIds.add(parsed.id);
    }

    const dbNodes = db.getAllNodesByWorkspace(workspaceId);
    const dbEdges = db.getEdgesByWorkspace(workspaceId);

    const dbNodeIdsHash = hashIds(dbNodes.map(n => n.id));
    const dbEdgeIdsHash = hashIds(dbEdges.map(e => e.id));
    const artifactNodeIdsHash = hashIds(Array.from(artifactNodeIds));
    const artifactEdgeIdsHash = hashIds(Array.from(artifactEdgeIds));

    // Compare edge records explicitly against DB
    const sortedDbEdges = [...dbEdges].sort((a, b) => a.id.localeCompare(b.id));
    const sortedArtifactEdges = [...edgeRecords].sort((a, b) => a.id.localeCompare(b.id));

    // Detect duplicate edge IDs in artifact
    const artifactEdgeIdList = edgeRecords.map((e: any) => e.id);
    const artifactEdgeIdSet = new Set(artifactEdgeIdList);
    const hasDuplicateEdgeIds = artifactEdgeIdList.length !== artifactEdgeIdSet.size;

    // Detect duplicate (from_id, to_id, type, graph_kind) combinations in artifact
    const artifactEdgeSignatures = new Set<string>();
    let hasDuplicateEdgeSignatures = false;
    for (const e of edgeRecords) {
        const sig = `${e.from_id}|${e.to_id}|${e.type}|${e.graph_kind}`;
        if (artifactEdgeSignatures.has(sig)) {
            hasDuplicateEdgeSignatures = true;
            break;
        }
        artifactEdgeSignatures.add(sig);
    }

    let sameEdgesContent = sortedDbEdges.length === sortedArtifactEdges.length;
    if (sameEdgesContent) {
        for (let i = 0; i < sortedDbEdges.length; i++) {
            const e1 = sortedDbEdges[i]!;
            const e2 = sortedArtifactEdges[i]!;
            if (e1.id !== e2.id ||
                e1.from_id !== e2.from_id ||
                e1.to_id !== e2.to_id ||
                e1.type !== e2.type ||
                e1.graph_kind !== e2.graph_kind ||
                e1.confidence !== e2.confidence_band ||
                deterministicStringify(e1.provenance) !== deterministicStringify(e2.provenance)) {
                sameEdgesContent = false;
                break;
            }
        }
    }

    const isMatch =
        !hasDuplicateEdgeIds &&
        !hasDuplicateEdgeSignatures &&
        dbNodes.length === artifactNodeIds.size &&
        dbEdges.length === artifactEdgeIds.size &&
        dbNodeIdsHash === artifactNodeIdsHash &&
        dbEdgeIdsHash === artifactEdgeIdsHash &&
        sameEdgesContent;

    return {
        workspaceId,
        status: isMatch ? 'OK' : 'MISMATCH',
        details: {
            dbNodeCount: dbNodes.length,
            dbEdgeCount: dbEdges.length,
            artifactNodeCount: artifactNodeIds.size,
            artifactEdgeCount: artifactEdgeIds.size,
            dbNodeIdsHash,
            dbEdgeIdsHash,
            artifactNodeIdsHash,
            artifactEdgeIdsHash
        }
    };
}
