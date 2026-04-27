import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { GraphDB } from '../../storage/GraphDB.js';
import type { GraphNode, GraphEdge } from '../../core/types.js';

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

export function getGraphArtifactDir(workspaceId: string): string {
    return path.join(process.cwd(), 'knowledge', 'artifacts', 'workspaces', workspaceId, 'graph');
}

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

        // Write atomic files function
        const writeAtomic = async (filename: string, content: string | Buffer) => {
            const finalPath = path.join(artifactDir, filename);
            const tmpPath = finalPath + '.tmp';
            const fileHandle = await fs.promises.open(tmpPath, 'w');
            await fileHandle.writeFile(content);
            await fileHandle.sync();
            await fileHandle.close();
            await fs.promises.rename(tmpPath, finalPath);
            return finalPath;
        };

        const canonicalStrHash = JSON.stringify(canonicalPayload, null, 2) + '\n';
        contentHashAlgo.update(canonicalStrHash);
        const canonicalStr = JSON.stringify({ generatedAt, ...canonicalPayload }, null, 2) + '\n';
        await writeAtomic('canonical.graph.json', canonicalStr);

        const exploratoryStrHash = JSON.stringify(exploratoryPayload, null, 2) + '\n';
        contentHashAlgo.update(exploratoryStrHash);
        const exploratoryStr = JSON.stringify({ generatedAt, ...exploratoryPayload }, null, 2) + '\n';
        await writeAtomic('exploratory.graph.json', exploratoryStr);

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
        await writeAtomic('edges.jsonl', edgesJsonlStr);

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
        await writeAtomic('graph.meta.json', metaStr);

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
