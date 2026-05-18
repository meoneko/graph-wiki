import { describe, expect, it } from 'vitest';
import {
    mapConfidenceToBand,
    mapBandToConfidence,
    mapProvenance,
    mapNodeFromDB,
    mapEdgeFromDB,
    mapNodeToDB,
    mapEdgeToDB,
} from './mappers.js';
import type { GraphNode, GraphEdge, Provenance } from '../core/types.js';

const validProvenance: Provenance = {
    source: 'parser',
    artifact_source: 'test.ts',
    producer_stage: 'extract',
    timestamp: '2026-01-01T00:00:00.000Z',
};

describe('mapConfidenceToBand', () => {
    it('maps valid confidence strings to ConfidenceBand', () => {
        expect(mapConfidenceToBand('AUTHORITATIVE')).toBe('AUTHORITATIVE');
        expect(mapConfidenceToBand('EXTRACTED')).toBe('EXTRACTED');
        expect(mapConfidenceToBand('INFERRED')).toBe('INFERRED');
        expect(mapConfidenceToBand('AMBIGUOUS')).toBe('AMBIGUOUS');
    });

    it('throws INVALID_GRAPH_STATE for undefined confidence', () => {
        expect(() => mapConfidenceToBand(undefined)).toThrow(/INVALID_GRAPH_STATE/);
    });

    it('throws INVALID_GRAPH_STATE for unknown confidence value', () => {
        expect(() => mapConfidenceToBand('UNKNOWN')).toThrow(/INVALID_GRAPH_STATE/);
    });
});

describe('mapBandToConfidence', () => {
    it('returns the band string directly', () => {
        expect(mapBandToConfidence('AUTHORITATIVE')).toBe('AUTHORITATIVE');
        expect(mapBandToConfidence('EXTRACTED')).toBe('EXTRACTED');
        expect(mapBandToConfidence('INFERRED')).toBe('INFERRED');
        expect(mapBandToConfidence('AMBIGUOUS')).toBe('AMBIGUOUS');
    });
});

describe('mapProvenance', () => {
    it('returns valid provenance object', () => {
        const result = mapProvenance(validProvenance);
        expect(result.source).toBe('parser');
    });

    it('throws INVALID_GRAPH_STATE for null provenance', () => {
        expect(() => mapProvenance(null)).toThrow(/INVALID_GRAPH_STATE/);
    });

    it('throws INVALID_GRAPH_STATE for object without source', () => {
        expect(() => mapProvenance({ artifact_source: 'x' })).toThrow(/INVALID_GRAPH_STATE/);
    });
});

describe('mapNodeFromDB — stableKey handling', () => {
    const baseRow = {
        id: 'node:1',
        workspace: 'ws',
        project: 'p',
        type: 'function',
        label: 'myFunc',
        graph_kind: 'canonical',
        confidence: 'AUTHORITATIVE',
        provenance: JSON.stringify(validProvenance),
        metadata: null,
        source_file: 'src/a.ts',
        symbol: 'myFunc',
        trust_level: 'AUTHORITATIVE',
        created_at: 1700000000,
        updated_at: null,
        http_method: null,
        http_path: null,
        domain: null,
        lang_meta: null,
        confidence_score: null,
    };

    it('maps stable_key from DB for canonical node', () => {
        const row = { ...baseRow, stable_key: 'stable:node:1' };
        const node = mapNodeFromDB(row);
        expect(node.stableKey).toBe('stable:node:1');
    });

    it('returns null stableKey for exploratory node without stable_key', () => {
        const row = { ...baseRow, graph_kind: 'exploratory', confidence: 'AMBIGUOUS', stable_key: null };
        const node = mapNodeFromDB(row);
        expect(node.stableKey).toBeNull();
    });

    it('returns null stableKey for external node without stable_key', () => {
        const row = { ...baseRow, graph_kind: 'external', confidence: 'AMBIGUOUS', stable_key: null };
        const node = mapNodeFromDB(row);
        expect(node.stableKey).toBeNull();
    });

    it('returns null stableKey for canonical node without stable_key in DB', () => {
        const row = { ...baseRow, stable_key: null };
        const node = mapNodeFromDB(row);
        expect(node.stableKey).toBeNull();
    });

    it('maps confidence_score from DB', () => {
        const row = { ...baseRow, stable_key: 'sk', confidence_score: 0.95 };
        const node = mapNodeFromDB(row);
        expect(node.confidence_score).toBe(0.95);
    });

    it('returns undefined confidence_score when null in DB', () => {
        const row = { ...baseRow, stable_key: 'sk', confidence_score: null };
        const node = mapNodeFromDB(row);
        expect(node.confidence_score).toBeUndefined();
    });
});

describe('mapEdgeFromDB — stableKey handling', () => {
    const baseRow = {
        id: 'edge:1',
        workspace: 'ws',
        from_id: 'node:a',
        to_id: 'node:b',
        type: 'calls',
        graph_kind: 'canonical',
        confidence: 'AUTHORITATIVE',
        provenance: JSON.stringify(validProvenance),
        metadata: null,
        trust_level: 'AUTHORITATIVE',
        created_at: 1700000000,
        updated_at: null,
        confidence_score: null,
    };

    it('maps stable_key from DB for canonical edge', () => {
        const row = { ...baseRow, stable_key: 'stable:edge:1' };
        const edge = mapEdgeFromDB(row);
        expect(edge.stableKey).toBe('stable:edge:1');
    });

    it('returns null stableKey for exploratory edge', () => {
        const row = { ...baseRow, graph_kind: 'exploratory', confidence: 'AMBIGUOUS', stable_key: null };
        const edge = mapEdgeFromDB(row);
        expect(edge.stableKey).toBeNull();
    });
});

describe('mapNodeToDB — stableKey handling', () => {
    const canonicalNode: GraphNode = {
        id: 'node:1',
        stableKey: 'stable:node:1',
        workspace: 'ws',
        project: 'p',
        type: 'function',
        label: 'myFunc',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        provenance: validProvenance,
        source_file: 'src/a.ts',
        symbol: 'myFunc',
    };

    it('maps stableKey to stable_key column for canonical node', () => {
        const row = mapNodeToDB(canonicalNode);
        expect(row.stable_key).toBe('stable:node:1');
    });

    it('maps null stableKey to null stable_key column', () => {
        const exploratoryNode: GraphNode = {
            ...canonicalNode,
            stableKey: null,
            graph_kind: 'exploratory',
            confidence_band: 'AMBIGUOUS',
        };
        const row = mapNodeToDB(exploratoryNode);
        expect(row.stable_key).toBeNull();
    });

    it('maps confidence_band to confidence column', () => {
        const row = mapNodeToDB(canonicalNode);
        expect(row.confidence).toBe('AUTHORITATIVE');
    });

    it('serializes provenance to JSON', () => {
        const row = mapNodeToDB(canonicalNode);
        expect(typeof row.provenance).toBe('string');
        expect(JSON.parse(row.provenance).source).toBe('parser');
    });

    it('maps confidence_score to column', () => {
        const nodeWithScore: GraphNode = { ...canonicalNode, confidence_score: 0.85 };
        const row = mapNodeToDB(nodeWithScore);
        expect(row.confidence_score).toBe(0.85);
    });

    it('maps undefined confidence_score to null', () => {
        const row = mapNodeToDB(canonicalNode);
        expect(row.confidence_score).toBeNull();
    });
});

describe('mapEdgeToDB — stableKey handling', () => {
    const canonicalEdge: GraphEdge = {
        id: 'edge:1',
        stableKey: 'stable:edge:1',
        workspace: 'ws',
        from_id: 'node:a',
        to_id: 'node:b',
        type: 'calls',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        provenance: validProvenance,
    };

    it('maps stableKey to stable_key column for canonical edge', () => {
        const row = mapEdgeToDB(canonicalEdge);
        expect(row.stable_key).toBe('stable:edge:1');
    });

    it('maps null stableKey to null stable_key column', () => {
        const exploratoryEdge: GraphEdge = {
            ...canonicalEdge,
            stableKey: null,
            graph_kind: 'exploratory',
            confidence_band: 'AMBIGUOUS',
        };
        const row = mapEdgeToDB(exploratoryEdge);
        expect(row.stable_key).toBeNull();
    });

    it('maps confidence_score to column', () => {
        const edgeWithScore: GraphEdge = { ...canonicalEdge, confidence_score: 0.9 };
        const row = mapEdgeToDB(edgeWithScore);
        expect(row.confidence_score).toBe(0.9);
    });
});

describe('roundtrip: mapNodeToDB → mapNodeFromDB', () => {
    it('preserves stableKey through roundtrip for canonical node', () => {
        const original: GraphNode = {
            id: 'node:rt',
            stableKey: 'stable:node:rt',
            workspace: 'ws',
            project: 'p',
            type: 'function',
            label: 'roundtrip',
            graph_kind: 'canonical',
            confidence_band: 'AUTHORITATIVE',
            confidence_score: 0.99,
            provenance: validProvenance,
            source_file: 'src/rt.ts',
            symbol: 'roundtrip',
            trust_level: 'AUTHORITATIVE',
        };

        const dbRow = mapNodeToDB(original);
        const restored = mapNodeFromDB({
            ...dbRow,
            provenance: dbRow.provenance,
            metadata: dbRow.metadata,
            created_at: 1700000000,
        });

        expect(restored.stableKey).toBe('stable:node:rt');
        expect(restored.confidence_band).toBe('AUTHORITATIVE');
        expect(restored.confidence_score).toBe(0.99);
        expect(restored.graph_kind).toBe('canonical');
    });

    it('preserves null stableKey through roundtrip for exploratory node', () => {
        const original: GraphNode = {
            id: 'node:exp',
            stableKey: null,
            workspace: 'ws',
            project: 'p',
            type: 'function',
            label: 'exploratory',
            graph_kind: 'exploratory',
            confidence_band: 'AMBIGUOUS',
            provenance: validProvenance,
        };

        const dbRow = mapNodeToDB(original);
        const restored = mapNodeFromDB({
            ...dbRow,
            provenance: dbRow.provenance,
            metadata: dbRow.metadata,
            created_at: 1700000000,
        });

        expect(restored.stableKey).toBeNull();
        expect(restored.graph_kind).toBe('exploratory');
    });
});

describe('roundtrip: mapEdgeToDB → mapEdgeFromDB', () => {
    it('preserves stableKey through roundtrip for derived edge', () => {
        const original: GraphEdge = {
            id: 'edge:rt',
            stableKey: 'stable:edge:rt',
            workspace: 'ws',
            from_id: 'node:a',
            to_id: 'node:b',
            type: 'derived_dependency',
            graph_kind: 'derived',
            confidence_band: 'EXTRACTED',
            confidence_score: 0.8,
            provenance: validProvenance,
            metadata: { flow_type: 'data' },
        };

        const dbRow = mapEdgeToDB(original);
        const restored = mapEdgeFromDB({
            ...dbRow,
            provenance: dbRow.provenance,
            metadata: dbRow.metadata,
            created_at: 1700000000,
        });

        expect(restored.stableKey).toBe('stable:edge:rt');
        expect(restored.confidence_band).toBe('EXTRACTED');
        expect(restored.confidence_score).toBe(0.8);
        expect(restored.metadata?.flow_type).toBe('data');
    });
});
