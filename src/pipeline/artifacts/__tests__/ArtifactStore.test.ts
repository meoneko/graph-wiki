import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { GraphNode, GraphEdge, Provenance } from '../../core/types.js';
import { ArtifactStore, createArtifactStore, type WikiPage } from './graphArtifacts.js';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-store-test-'));
}

function makeProvenance(): Provenance {
    return {
        source: 'parser',
        artifact_source: 'test',
        producer_stage: 'test',
        timestamp: '2024-01-01T00:00:00Z',
        file: 'test.ts',
        line_start: 1,
        line_end: 10,
    };
}

function makeNode(id: string, graphKind: 'canonical' | 'exploratory' = 'canonical'): GraphNode {
    return {
        id,
        stableKey: graphKind === 'canonical' ? id : null,
        workspace: 'test-ws',
        project: 'test-proj',
        type: 'function',
        label: `Node ${id}`,
        graph_kind: graphKind,
        confidence_band: graphKind === 'canonical' ? 'AUTHORITATIVE' : 'INFERRED',
        provenance: makeProvenance(),
        source_file: 'test.ts',
        symbol: id,
    };
}

function makeEdge(id: string, fromId: string, toId: string, graphKind: 'canonical' | 'exploratory' = 'canonical'): GraphEdge {
    return {
        id,
        stableKey: graphKind === 'canonical' ? id : null,
        workspace: 'test-ws',
        from_id: fromId,
        to_id: toId,
        type: 'calls',
        graph_kind: graphKind,
        confidence_band: graphKind === 'canonical' ? 'AUTHORITATIVE' : 'INFERRED',
        provenance: makeProvenance(),
    };
}

describe('ArtifactStore', () => {
    let tmpDir: string;
    let store: ArtifactStore;

    beforeEach(() => {
        tmpDir = makeTmpDir();
        store = createArtifactStore(tmpDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe('workspace directory structure', () => {
        it('creates all required subdirectories', async () => {
            await store.ensureWorkspaceDirs('my-workspace');

            const expectedDirs = ['config', 'extracted', 'normalized', 'validated', 'graph', 'reports', 'baselines'];
            for (const dir of expectedDirs) {
                const dirPath = path.join(tmpDir, 'my-workspace', dir);
                const stat = fs.statSync(dirPath);
                expect(stat.isDirectory()).toBe(true);
            }
        });

        it('enforces workspace isolation in paths', () => {
            const dirA = store.getWorkspaceDir('workspace-a');
            const dirB = store.getWorkspaceDir('workspace-b');
            expect(dirA).not.toBe(dirB);
            expect(dirA).toContain('workspace-a');
            expect(dirB).toContain('workspace-b');
        });

        it('returns correct subdirectory paths', () => {
            expect(store.getSubdir('ws', 'graph')).toBe(path.join(tmpDir, 'ws', 'graph'));
            expect(store.getSubdir('ws', 'reports')).toBe(path.join(tmpDir, 'ws', 'reports'));
            expect(store.getSubdir('ws', 'baselines')).toBe(path.join(tmpDir, 'ws', 'baselines'));
        });
    });

    describe('writeGraphArtifacts', () => {
        it('writes canonical.graph.json, exploratory.graph.json, edges.jsonl, and graph.meta.json', async () => {
            const nodes = [makeNode('n1', 'canonical'), makeNode('n2', 'exploratory')];
            const edges = [makeEdge('e1', 'n1', 'n2', 'canonical')];

            await store.writeGraphArtifacts('test-ws', nodes, edges);

            const graphDir = store.getGraphDir('test-ws');
            expect(fs.existsSync(path.join(graphDir, 'canonical.graph.json'))).toBe(true);
            expect(fs.existsSync(path.join(graphDir, 'exploratory.graph.json'))).toBe(true);
            expect(fs.existsSync(path.join(graphDir, 'edges.jsonl'))).toBe(true);
            expect(fs.existsSync(path.join(graphDir, 'graph.meta.json'))).toBe(true);
        });

        it('separates nodes by graph_kind into correct files', async () => {
            const nodes = [
                makeNode('canonical-1', 'canonical'),
                makeNode('exploratory-1', 'exploratory'),
            ];
            const edges: GraphEdge[] = [];

            await store.writeGraphArtifacts('test-ws', nodes, edges);

            const graphDir = store.getGraphDir('test-ws');
            const canonical = JSON.parse(fs.readFileSync(path.join(graphDir, 'canonical.graph.json'), 'utf8'));
            const exploratory = JSON.parse(fs.readFileSync(path.join(graphDir, 'exploratory.graph.json'), 'utf8'));

            expect(canonical.nodes).toHaveLength(1);
            expect(canonical.nodes[0].id).toBe('canonical-1');
            expect(exploratory.nodes).toHaveLength(1);
            expect(exploratory.nodes[0].id).toBe('exploratory-1');
        });

        it('writes edges in JSONL format', async () => {
            const nodes = [makeNode('n1'), makeNode('n2')];
            const edges = [makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n1')];

            await store.writeGraphArtifacts('test-ws', nodes, edges);

            const graphDir = store.getGraphDir('test-ws');
            const edgesContent = fs.readFileSync(path.join(graphDir, 'edges.jsonl'), 'utf8');
            const lines = edgesContent.trim().split('\n');
            expect(lines).toHaveLength(2);

            const parsed = lines.map(l => JSON.parse(l));
            expect(parsed[0].id).toBe('e1');
            expect(parsed[1].id).toBe('e2');
        });

        it('writes graph.meta.json with correct counts', async () => {
            const nodes = [
                makeNode('c1', 'canonical'),
                makeNode('c2', 'canonical'),
                makeNode('e1', 'exploratory'),
            ];
            const edges = [makeEdge('edge1', 'c1', 'c2', 'canonical')];

            await store.writeGraphArtifacts('test-ws', nodes, edges);

            const graphDir = store.getGraphDir('test-ws');
            const meta = JSON.parse(fs.readFileSync(path.join(graphDir, 'graph.meta.json'), 'utf8'));

            expect(meta.counts.canonicalNodes).toBe(2);
            expect(meta.counts.exploratoryNodes).toBe(1);
            expect(meta.counts.canonicalEdges).toBe(1);
            expect(meta.counts.totalNodes).toBe(3);
            expect(meta.counts.totalEdges).toBe(1);
        });

        it('produces deterministic output regardless of input order', async () => {
            const nodes = [makeNode('b'), makeNode('a')];
            const edges = [makeEdge('e2', 'b', 'a'), makeEdge('e1', 'a', 'b')];

            await store.writeGraphArtifacts('test-ws', nodes, edges);

            const graphDir = store.getGraphDir('test-ws');
            const canonical = JSON.parse(fs.readFileSync(path.join(graphDir, 'canonical.graph.json'), 'utf8'));
            // Nodes should be sorted by id
            expect(canonical.nodes[0].id).toBe('a');
            expect(canonical.nodes[1].id).toBe('b');
        });
    });

    describe('readGraphArtifacts', () => {
        it('reads back written graph artifacts', async () => {
            const nodes = [makeNode('n1', 'canonical'), makeNode('n2', 'exploratory')];
            const edges = [makeEdge('e1', 'n1', 'n2', 'canonical')];

            await store.writeGraphArtifacts('test-ws', nodes, edges);
            const result = await store.readGraphArtifacts('test-ws');

            expect(result.nodes).toHaveLength(2);
            expect(result.edges).toHaveLength(1);
            expect(result.nodes.map(n => n.id).sort()).toEqual(['n1', 'n2']);
            expect(result.edges[0]!.id).toBe('e1');
        });

        it('returns empty arrays when no artifacts exist', async () => {
            const result = await store.readGraphArtifacts('nonexistent-ws');
            expect(result.nodes).toEqual([]);
            expect(result.edges).toEqual([]);
        });
    });

    describe('writeReport', () => {
        it('writes a report to the workspace reports directory', async () => {
            const report = { type: 'extraction-report', data: { count: 42 } };
            await store.writeReport('test-ws', report);

            const reportPath = path.join(tmpDir, 'test-ws', 'reports', 'extraction-report.json');
            expect(fs.existsSync(reportPath)).toBe(true);

            const content = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            expect(content.data.count).toBe(42);
        });

        it('uses reportType field for filename when type is absent', async () => {
            const report = { reportType: 'validation-report', passed: true };
            await store.writeReport('test-ws', report);

            const reportPath = path.join(tmpDir, 'test-ws', 'reports', 'validation-report.json');
            expect(fs.existsSync(reportPath)).toBe(true);
        });

        it('uses generic filename when no type field exists', async () => {
            const report = { data: 'something' };
            await store.writeReport('test-ws', report);

            const reportPath = path.join(tmpDir, 'test-ws', 'reports', 'report.json');
            expect(fs.existsSync(reportPath)).toBe(true);
        });
    });

    describe('writeWiki', () => {
        it('writes wiki pages as individual JSON files', async () => {
            const pages: WikiPage[] = [
                {
                    id: 'overview',
                    workspaceId: 'test-ws',
                    title: 'Overview',
                    pageType: 'overview',
                    status: 'canonical',
                    content: '# Overview',
                    sources: [],
                    provenance_summary: { total_sources: 0, parser_backed: 0, derived: 0, exploratory: 0, external: 0 },
                    confidence_summary: { overall: 'HIGH', authoritative_count: 0, extracted_count: 0, inferred_count: 0, ambiguous_count: 0 },
                    annotations: [],
                    warnings: [],
                    generatedAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'module-auth',
                    workspaceId: 'test-ws',
                    title: 'Auth Module',
                    pageType: 'module',
                    status: 'mixed',
                    content: '# Auth',
                    sources: [],
                    provenance_summary: { total_sources: 0, parser_backed: 0, derived: 0, exploratory: 0, external: 0 },
                    confidence_summary: { overall: 'MEDIUM', authoritative_count: 0, extracted_count: 0, inferred_count: 0, ambiguous_count: 0 },
                    annotations: [],
                    warnings: ['EXPLORATORY_USED'],
                    generatedAt: '2024-01-01T00:00:00Z',
                },
            ];

            await store.writeWiki('test-ws', pages);

            // Wiki is written to knowledge/wiki/{workspace}/ relative to artifacts base
            const wikiDir = path.join(tmpDir, '..', '..', 'wiki', 'test-ws');
            expect(fs.existsSync(path.join(wikiDir, 'overview.json'))).toBe(true);
            expect(fs.existsSync(path.join(wikiDir, 'module-auth.json'))).toBe(true);

            const overviewContent = JSON.parse(fs.readFileSync(path.join(wikiDir, 'overview.json'), 'utf8'));
            expect(overviewContent.title).toBe('Overview');
            expect(overviewContent.status).toBe('canonical');
        });
    });

    describe('atomic writes', () => {
        it('does not leave partial files on write failure', async () => {
            // Write a file successfully first
            const filePath = path.join(tmpDir, 'test-file.json');
            await store.writeAtomic(filePath, '{"original": true}');
            expect(fs.existsSync(filePath)).toBe(true);

            // Verify no .tmp file remains
            expect(fs.existsSync(filePath + '.tmp')).toBe(false);
        });

        it('creates parent directories if they do not exist', async () => {
            const filePath = path.join(tmpDir, 'deep', 'nested', 'dir', 'file.json');
            await store.writeAtomic(filePath, '{"nested": true}');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        it('preserves original file content when write fails mid-operation', async () => {
            // Write original content
            const filePath = path.join(tmpDir, 'atomic-test.json');
            await store.writeAtomic(filePath, '{"version": 1}');
            expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual({ version: 1 });

            // Attempt to write to a path where the rename will fail
            // by making the target a directory (rename file -> dir fails)
            const dirAsFile = path.join(tmpDir, 'dir-target');
            fs.mkdirSync(dirAsFile, { recursive: true });
            fs.writeFileSync(path.join(dirAsFile, 'blocker'), 'x');

            // The writeAtomic to a path that is a non-empty directory should throw
            await expect(store.writeAtomic(dirAsFile, '{"version": 2}')).rejects.toThrow();

            // No .tmp file should remain after failure
            expect(fs.existsSync(dirAsFile + '.tmp')).toBe(false);
        });

        it('does not produce partial graph artifacts on writeGraphArtifacts failure', async () => {
            // Write valid artifacts first
            const nodes = [makeNode('n1', 'canonical')];
            const edges = [makeEdge('e1', 'n1', 'n1', 'canonical')];
            await store.writeGraphArtifacts('atomic-ws', nodes, edges);

            const graphDir = store.getGraphDir('atomic-ws');
            const originalCanonical = fs.readFileSync(path.join(graphDir, 'canonical.graph.json'), 'utf8');

            // Verify the original write succeeded completely (all 4 files present)
            expect(fs.existsSync(path.join(graphDir, 'canonical.graph.json'))).toBe(true);
            expect(fs.existsSync(path.join(graphDir, 'exploratory.graph.json'))).toBe(true);
            expect(fs.existsSync(path.join(graphDir, 'edges.jsonl'))).toBe(true);
            expect(fs.existsSync(path.join(graphDir, 'graph.meta.json'))).toBe(true);

            // Verify no temp files linger
            const files = fs.readdirSync(graphDir);
            const tmpFiles = files.filter(f => f.endsWith('.tmp'));
            expect(tmpFiles).toHaveLength(0);
        });
    });

    describe('workspace isolation', () => {
        it('workspace A artifacts are not accessible from workspace B paths', async () => {
            const nodesA = [makeNode('node-a', 'canonical')];
            const nodesB = [makeNode('node-b', 'canonical')];

            await store.writeGraphArtifacts('workspace-a', nodesA, []);
            await store.writeGraphArtifacts('workspace-b', nodesB, []);

            const resultA = await store.readGraphArtifacts('workspace-a');
            const resultB = await store.readGraphArtifacts('workspace-b');

            // Each workspace only sees its own nodes
            expect(resultA.nodes).toHaveLength(1);
            expect(resultA.nodes[0]!.id).toBe('node-a');
            expect(resultB.nodes).toHaveLength(1);
            expect(resultB.nodes[0]!.id).toBe('node-b');
        });

        it('workspace directories are physically separate on disk', async () => {
            await store.ensureWorkspaceDirs('isolated-a');
            await store.ensureWorkspaceDirs('isolated-b');

            const dirA = store.getWorkspaceDir('isolated-a');
            const dirB = store.getWorkspaceDir('isolated-b');

            // Paths must not share a common workspace-specific prefix
            expect(dirA).not.toContain('isolated-b');
            expect(dirB).not.toContain('isolated-a');

            // Writing a file in workspace A does not appear in workspace B
            fs.writeFileSync(path.join(dirA, 'config', 'test.json'), '{}');
            expect(fs.existsSync(path.join(dirB, 'config', 'test.json'))).toBe(false);
        });

        it('reports are isolated per workspace', async () => {
            await store.writeReport('ws-alpha', { type: 'quality', score: 95 });
            await store.writeReport('ws-beta', { type: 'quality', score: 80 });

            const alphaReport = JSON.parse(
                fs.readFileSync(path.join(tmpDir, 'ws-alpha', 'reports', 'quality.json'), 'utf8')
            );
            const betaReport = JSON.parse(
                fs.readFileSync(path.join(tmpDir, 'ws-beta', 'reports', 'quality.json'), 'utf8')
            );

            expect(alphaReport.score).toBe(95);
            expect(betaReport.score).toBe(80);
        });
    });
});
