import { describe, it, expect } from 'vitest';
import { PathSelector } from './pathSelector.js';
import type { ReasoningPath, GraphNode, GraphEdge } from '../../types.js';

function makeNode(overrides: Partial<GraphNode> & { id: string }): GraphNode {
    return {
        stableKey: overrides.id,
        workspace: 'w1',
        project: 'p1',
        label: overrides.id,
        type: 'function',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance: { source: 'parser', artifact_source: 's1', producer_stage: 'extract', timestamp: '2026-01-01' },
        ...overrides,
    };
}

function makeEdge(overrides: Partial<GraphEdge> & { id: string; from_id: string; to_id: string }): GraphEdge {
    return {
        stableKey: overrides.id,
        workspace: 'w1',
        type: 'calls',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance: { source: 'parser', artifact_source: 's1', producer_stage: 'extract', timestamp: '2026-01-01' },
        ...overrides,
    };
}

function makePath(overrides: Partial<ReasoningPath> & { path_id: string }): ReasoningPath {
    return {
        nodes: [],
        edges: [],
        trust_level: 'AUTHORITATIVE',
        status: 'OK',
        summary: 'test path',
        ...overrides,
    };
}

describe('PathSelector', () => {
    describe('selectBestPath', () => {
        it('returns undefined for empty paths', () => {
            expect(PathSelector.selectBestPath([])).toBeUndefined();
        });

        it('returns the single path when only one exists', () => {
            const path = makePath({ path_id: 'p1' });
            expect(PathSelector.selectBestPath([path])).toBe(path);
        });

        it('prefers canonical-plus-derived-only paths over paths with exploratory', () => {
            const canonicalPath = makePath({
                path_id: 'canonical',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e1', from_id: 'a', to_id: 'b' })],
            });
            const exploratoryPath = makePath({
                path_id: 'exploratory',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b', graph_kind: 'exploratory', confidence_band: 'AMBIGUOUS' })],
                edges: [makeEdge({ id: 'e2', from_id: 'a', to_id: 'b' })],
            });

            expect(PathSelector.selectBestPath([exploratoryPath, canonicalPath])).toBe(canonicalPath);
        });

        it('prefers shorter paths when both are canonical-only', () => {
            const shortPath = makePath({
                path_id: 'short',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'c' })],
                edges: [makeEdge({ id: 'e1', from_id: 'a', to_id: 'c' })],
            });
            const longPath = makePath({
                path_id: 'long',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })],
                edges: [
                    makeEdge({ id: 'e1', from_id: 'a', to_id: 'b' }),
                    makeEdge({ id: 'e2', from_id: 'b', to_id: 'c' }),
                ],
            });

            expect(PathSelector.selectBestPath([longPath, shortPath])).toBe(shortPath);
        });

        it('prefers higher-confidence paths (lower weight) when length is equal', () => {
            const highConfPath = makePath({
                path_id: 'high',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e1', from_id: 'a', to_id: 'b', confidence_band: 'AUTHORITATIVE' })],
            });
            const lowConfPath = makePath({
                path_id: 'low',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e2', from_id: 'a', to_id: 'b', confidence_band: 'INFERRED' })],
            });

            expect(PathSelector.selectBestPath([lowConfPath, highConfPath])).toBe(highConfPath);
        });

        it('uses lexicographic ordering by node IDs as final tie-breaker', () => {
            const pathAlpha = makePath({
                path_id: 'alpha',
                nodes: [makeNode({ id: 'alpha' }), makeNode({ id: 'beta' })],
                edges: [makeEdge({ id: 'e1', from_id: 'alpha', to_id: 'beta' })],
            });
            const pathZeta = makePath({
                path_id: 'zeta',
                nodes: [makeNode({ id: 'zeta' }), makeNode({ id: 'omega' })],
                edges: [makeEdge({ id: 'e2', from_id: 'zeta', to_id: 'omega' })],
            });

            expect(PathSelector.selectBestPath([pathZeta, pathAlpha])).toBe(pathAlpha);
        });
    });

    describe('selectPaths', () => {
        it('returns INSUFFICIENT_EVIDENCE for empty paths', () => {
            const result = PathSelector.selectPaths([]);
            expect(result.selected).toHaveLength(0);
            expect(result.rejected).toHaveLength(0);
            expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
        });

        it('selects best path and rejects others when no conflict', () => {
            const best = makePath({
                path_id: 'best',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e1', from_id: 'a', to_id: 'b' })],
            });
            const worse = makePath({
                path_id: 'worse',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'mid' }), makeNode({ id: 'b' })],
                edges: [
                    makeEdge({ id: 'e2', from_id: 'a', to_id: 'mid' }),
                    makeEdge({ id: 'e3', from_id: 'mid', to_id: 'b' }),
                ],
            });

            const result = PathSelector.selectPaths([worse, best]);
            expect(result.selected).toHaveLength(1);
            expect(result.selected[0]!.path_id).toBe('best');
            expect(result.rejected).toHaveLength(1);
            expect(result.rejected[0]!.path_id).toBe('worse');
            expect(result.status).toBe('OK');
        });

        it('returns AMBIGUOUS when paths have conflicting trust levels', () => {
            const authPath = makePath({
                path_id: 'auth',
                trust_level: 'AUTHORITATIVE',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e1', from_id: 'a', to_id: 'b' })],
            });
            const exploPath = makePath({
                path_id: 'explo',
                trust_level: 'EXPLORATORY',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e2', from_id: 'a', to_id: 'b', graph_kind: 'exploratory', confidence_band: 'AMBIGUOUS' })],
            });

            const result = PathSelector.selectPaths([authPath, exploPath]);
            expect(result.status).toBe('AMBIGUOUS');
            expect(result.selected.length).toBeGreaterThan(1);
        });

        it('returns AMBIGUOUS when paths lead to different terminal nodes', () => {
            const pathToB = makePath({
                path_id: 'to-b',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                edges: [makeEdge({ id: 'e1', from_id: 'a', to_id: 'b' })],
            });
            const pathToC = makePath({
                path_id: 'to-c',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'c' })],
                edges: [makeEdge({ id: 'e2', from_id: 'a', to_id: 'c' })],
            });

            const result = PathSelector.selectPaths([pathToB, pathToC]);
            expect(result.status).toBe('AMBIGUOUS');
            expect(result.selected).toHaveLength(2);
            expect(result.rejected).toHaveLength(0);
        });
    });

    describe('aggregateStatus', () => {
        it('returns INSUFFICIENT_EVIDENCE for empty paths', () => {
            expect(PathSelector.aggregateStatus([])).toBe('INSUFFICIENT_EVIDENCE');
        });

        it('returns OK when all paths are OK', () => {
            const paths = [
                makePath({ path_id: 'p1', status: 'OK' }),
                makePath({ path_id: 'p2', status: 'OK' }),
            ];
            expect(PathSelector.aggregateStatus(paths)).toBe('OK');
        });

        it('returns POLICY_VIOLATION when any path has it (highest precedence)', () => {
            const paths = [
                makePath({ path_id: 'p1', status: 'OK' }),
                makePath({ path_id: 'p2', status: 'POLICY_VIOLATION' }),
            ];
            expect(PathSelector.aggregateStatus(paths)).toBe('POLICY_VIOLATION');
        });

        it('returns INSUFFICIENT_EVIDENCE over AMBIGUOUS', () => {
            const paths = [
                makePath({ path_id: 'p1', status: 'AMBIGUOUS' }),
                makePath({ path_id: 'p2', status: 'INSUFFICIENT_EVIDENCE' }),
            ];
            expect(PathSelector.aggregateStatus(paths)).toBe('INSUFFICIENT_EVIDENCE');
        });

        it('returns AMBIGUOUS over EXPLORATORY_ONLY', () => {
            const paths = [
                makePath({ path_id: 'p1', status: 'EXPLORATORY_ONLY' }),
                makePath({ path_id: 'p2', status: 'AMBIGUOUS' }),
            ];
            expect(PathSelector.aggregateStatus(paths)).toBe('AMBIGUOUS');
        });

        it('returns EXPLORATORY_ONLY over PARTIAL', () => {
            const paths = [
                makePath({ path_id: 'p1', status: 'PARTIAL' }),
                makePath({ path_id: 'p2', status: 'EXPLORATORY_ONLY' }),
            ];
            expect(PathSelector.aggregateStatus(paths)).toBe('EXPLORATORY_ONLY');
        });

        it('returns PARTIAL over OK', () => {
            const paths = [
                makePath({ path_id: 'p1', status: 'OK' }),
                makePath({ path_id: 'p2', status: 'PARTIAL' }),
            ];
            expect(PathSelector.aggregateStatus(paths)).toBe('PARTIAL');
        });

        it('follows full precedence chain correctly', () => {
            // POLICY_VIOLATION > INSUFFICIENT_EVIDENCE > AMBIGUOUS > EXPLORATORY_ONLY > PARTIAL > OK
            expect(PathSelector.aggregateStatus([
                makePath({ path_id: 'p1', status: 'OK' }),
                makePath({ path_id: 'p2', status: 'PARTIAL' }),
                makePath({ path_id: 'p3', status: 'EXPLORATORY_ONLY' }),
            ])).toBe('EXPLORATORY_ONLY');
        });
    });

    describe('detectConflict', () => {
        it('returns false for empty paths', () => {
            expect(PathSelector.detectConflict([])).toBe(false);
        });

        it('returns false for a single path', () => {
            const path = makePath({
                path_id: 'p1',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            expect(PathSelector.detectConflict([path])).toBe(false);
        });

        it('returns false when paths have same terminal node and compatible trust', () => {
            const path1 = makePath({
                path_id: 'p1',
                trust_level: 'AUTHORITATIVE',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            const path2 = makePath({
                path_id: 'p2',
                trust_level: 'DERIVED',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'c' }), makeNode({ id: 'b' })],
            });
            expect(PathSelector.detectConflict([path1, path2])).toBe(false);
        });

        it('returns true when paths lead to different terminal nodes', () => {
            const path1 = makePath({
                path_id: 'p1',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            const path2 = makePath({
                path_id: 'p2',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'c' })],
            });
            expect(PathSelector.detectConflict([path1, path2])).toBe(true);
        });

        it('returns true when paths have contradictory trust levels (AUTHORITATIVE vs EXPLORATORY)', () => {
            const path1 = makePath({
                path_id: 'p1',
                trust_level: 'AUTHORITATIVE',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            const path2 = makePath({
                path_id: 'p2',
                trust_level: 'EXPLORATORY',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            expect(PathSelector.detectConflict([path1, path2])).toBe(true);
        });

        it('returns false when trust levels are AUTHORITATIVE and DERIVED (not contradictory)', () => {
            const path1 = makePath({
                path_id: 'p1',
                trust_level: 'AUTHORITATIVE',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            const path2 = makePath({
                path_id: 'p2',
                trust_level: 'DERIVED',
                nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
            });
            expect(PathSelector.detectConflict([path1, path2])).toBe(false);
        });
    });

    describe('deterministic ordering', () => {
        it('produces same result regardless of input order', () => {
            const paths = [
                makePath({
                    path_id: 'p1',
                    nodes: [makeNode({ id: 'x' }), makeNode({ id: 'y' })],
                    edges: [makeEdge({ id: 'e1', from_id: 'x', to_id: 'y' })],
                }),
                makePath({
                    path_id: 'p2',
                    nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
                    edges: [makeEdge({ id: 'e2', from_id: 'a', to_id: 'b' })],
                }),
                makePath({
                    path_id: 'p3',
                    nodes: [makeNode({ id: 'm' }), makeNode({ id: 'n' })],
                    edges: [makeEdge({ id: 'e3', from_id: 'm', to_id: 'n' })],
                }),
            ];

            const result1 = PathSelector.selectBestPath(paths);
            const result2 = PathSelector.selectBestPath([paths[2]!, paths[0]!, paths[1]!]);
            const result3 = PathSelector.selectBestPath([paths[1]!, paths[2]!, paths[0]!]);

            expect(result1?.path_id).toBe(result2?.path_id);
            expect(result2?.path_id).toBe(result3?.path_id);
            // 'a|b' < 'm|n' < 'x|y' lexicographically
            expect(result1?.path_id).toBe('p2');
        });
    });
});
