/**
 * Tests for GraphBuilder trust enforcement rules.
 *
 * Validates Requirements 4.1–4.8, 6.1–6.7:
 * - Node ID uniqueness across workspace
 * - Canonical nodes require parser provenance
 * - Derived nodes/edges require derivation rule
 * - Exploratory nodes/edges flagged as non-authoritative
 * - External nodes/edges gated and auditable
 * - No derived-from-derived unless rule is versioned, deterministic, and auditable
 * - No exploratory-to-canonical silent upgrade
 * - No AI writing directly into canonical layer
 */
import { describe, expect, it } from 'vitest';
import type { GraphNode, GraphEdge, NormalizedFact, Provenance } from '../../../core/types.js';
import {
    enforceNodeIdUniqueness,
    enforceCanonicalProvenance,
    enforceCanonicalFactProvenance,
    enforceDerivedRule,
    enforceDerivedNodeRule,
    enforceDerivedFromDerived,
    enforceExploratoryNonAuthoritative,
    enforceExploratoryEdgeNonAuthoritative,
    enforceNoExploratoryUpgrade,
    enforceExternalGated,
    enforceExternalEdgeGated,
    collectViolations,
    throwOnViolations,
} from '../graph_build_enforcement.js';
import { PipelineError, RuntimeCode } from '../../../core/errors.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const parserProvenance: Provenance = {
    source: 'parser',
    artifact_source: 'test.ts',
    producer_stage: 'buildCanonicalGraph',
    timestamp: '2026-01-01T00:00:00.000Z',
    file: 'test.ts',
};

const analysisProvenance: Provenance = {
    source: 'analysis',
    artifact_source: 'cross-file',
    producer_stage: 'buildDerivedGraph',
    timestamp: '2026-01-01T00:00:00.000Z',
    rule: 'derived-from-canonical',
};

const aiProvenance: Provenance = {
    source: 'ai',
    artifact_source: 'heuristic',
    producer_stage: 'buildExploratoryGraph',
    timestamp: '2026-01-01T00:00:00.000Z',
};

function makeNode(overrides: Partial<GraphNode> = {}): GraphNode {
    return {
        id: 'node:test-1',
        stableKey: 'node:test-1',
        workspace: 'ws',
        project: 'proj',
        type: 'function',
        label: 'testFn',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance: parserProvenance,
        ...overrides,
    };
}

function makeEdge(overrides: Partial<GraphEdge> = {}): GraphEdge {
    return {
        id: 'edge:test-1',
        stableKey: 'edge:test-1',
        workspace: 'ws',
        from_id: 'node:a',
        to_id: 'node:b',
        type: 'calls',
        graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE',
        trust_level: 'AUTHORITATIVE',
        provenance: parserProvenance,
        ...overrides,
    };
}

function makeFact(overrides: Partial<NormalizedFact> = {}): NormalizedFact {
    return {
        candidate_id: 'fact-1',
        fact_id: 'fact-1',
        candidate_type: 'function',
        workspaceId: 'ws',
        project: 'proj',
        source_file: 'test.ts',
        symbol: 'testFn',
        line_start: 1,
        line_end: 10,
        status: 'validated',
        extractor: 'ts_tree_sitter_parser',
        evidence: [],
        trust_level: 'AUTHORITATIVE',
        ...overrides,
    };
}

// ── Node ID Uniqueness (Req 6.2) ────────────────────────────────────────────

describe('enforceNodeIdUniqueness', () => {
    it('passes when all node IDs are unique', () => {
        const nodes = [
            makeNode({ id: 'node:1' }),
            makeNode({ id: 'node:2' }),
            makeNode({ id: 'node:3' }),
        ];
        const result = enforceNodeIdUniqueness(nodes);
        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('fails when duplicate node IDs exist', () => {
        const nodes = [
            makeNode({ id: 'node:1' }),
            makeNode({ id: 'node:1' }),
        ];
        const result = enforceNodeIdUniqueness(nodes);
        expect(result.passed).toBe(false);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0]!.code).toBe(PipelineError.GRAPH_BUILD_FAILED);
        expect(result.violations[0]!.message).toContain('Duplicate node ID');
    });

    it('passes for empty node list', () => {
        const result = enforceNodeIdUniqueness([]);
        expect(result.passed).toBe(true);
    });
});

// ── Canonical Provenance (Req 6.3, 4.8) ─────────────────────────────────────

describe('enforceCanonicalProvenance', () => {
    it('passes for canonical node with parser provenance', () => {
        const node = makeNode({ graph_kind: 'canonical', provenance: parserProvenance });
        const result = enforceCanonicalProvenance(node);
        expect(result.passed).toBe(true);
    });

    it('fails for canonical node with AI provenance', () => {
        const node = makeNode({ graph_kind: 'canonical', provenance: aiProvenance });
        const result = enforceCanonicalProvenance(node);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.code).toBe(RuntimeCode.CANONICAL_PROVENANCE_MISSING);
        expect(result.violations[0]!.message).toContain('AI');
    });

    it('fails for canonical node with analysis provenance', () => {
        const node = makeNode({ graph_kind: 'canonical', provenance: analysisProvenance });
        const result = enforceCanonicalProvenance(node);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.code).toBe(RuntimeCode.CANONICAL_PROVENANCE_MISSING);
    });

    it('skips non-canonical nodes', () => {
        const node = makeNode({ graph_kind: 'derived', provenance: analysisProvenance });
        const result = enforceCanonicalProvenance(node);
        expect(result.passed).toBe(true);
    });
});

describe('enforceCanonicalFactProvenance', () => {
    it('passes for fact with parser extractor', () => {
        const fact = makeFact({ extractor: 'ts_tree_sitter_parser' });
        const result = enforceCanonicalFactProvenance(fact);
        expect(result.passed).toBe(true);
    });

    it('fails for fact with AI extractor', () => {
        const fact = makeFact({ extractor: 'ai_inference_engine' });
        const result = enforceCanonicalFactProvenance(fact);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.code).toBe(RuntimeCode.CANONICAL_PROVENANCE_MISSING);
    });

    it('fails for fact with heuristic extractor', () => {
        const fact = makeFact({ extractor: 'heuristic_matcher' });
        const result = enforceCanonicalFactProvenance(fact);
        expect(result.passed).toBe(false);
    });

    it('fails for fact with LLM extractor', () => {
        const fact = makeFact({ extractor: 'llm_code_analyzer' });
        const result = enforceCanonicalFactProvenance(fact);
        expect(result.passed).toBe(false);
    });
});

// ── Derived Rule Enforcement (Req 6.4) ──────────────────────────────────────

describe('enforceDerivedRule', () => {
    it('passes for derived edge with derivation_rule in metadata', () => {
        const edge = makeEdge({
            graph_kind: 'derived',
            provenance: analysisProvenance,
            metadata: { derivation_rule: 'import-resolution' },
        });
        const result = enforceDerivedRule(edge);
        expect(result.passed).toBe(true);
    });

    it('passes for derived edge with rule in provenance', () => {
        const edge = makeEdge({
            graph_kind: 'derived',
            provenance: { ...analysisProvenance, rule: 'cross-file-call' },
        });
        const result = enforceDerivedRule(edge);
        expect(result.passed).toBe(true);
    });

    it('passes for derived edge with producer_stage in provenance', () => {
        const edge = makeEdge({
            graph_kind: 'derived',
            provenance: { ...analysisProvenance, rule: undefined },
        });
        const result = enforceDerivedRule(edge);
        expect(result.passed).toBe(true);
    });

    it('fails for derived edge without any rule', () => {
        const edge = makeEdge({
            graph_kind: 'derived',
            provenance: { source: 'analysis', artifact_source: '', producer_stage: '', timestamp: '' },
            metadata: {},
        });
        const result = enforceDerivedRule(edge);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.code).toBe(PipelineError.GRAPH_BUILD_FAILED);
    });

    it('skips non-derived edges', () => {
        const edge = makeEdge({ graph_kind: 'canonical' });
        const result = enforceDerivedRule(edge);
        expect(result.passed).toBe(true);
    });
});

describe('enforceDerivedNodeRule', () => {
    it('passes for derived node with producer_stage', () => {
        const node = makeNode({
            graph_kind: 'derived',
            provenance: analysisProvenance,
        });
        const result = enforceDerivedNodeRule(node);
        expect(result.passed).toBe(true);
    });

    it('fails for derived node without any rule', () => {
        const node = makeNode({
            graph_kind: 'derived',
            provenance: { source: 'analysis', artifact_source: '', producer_stage: '', timestamp: '' },
        });
        const result = enforceDerivedNodeRule(node);
        expect(result.passed).toBe(false);
    });
});

// ── Derived-from-Derived (Req 4.6) ─────────────────────────────────────────

describe('enforceDerivedFromDerived', () => {
    it('passes when rule is versioned, deterministic, and auditable', () => {
        const sourceNode = makeNode({ graph_kind: 'derived' });
        const edge = makeEdge({ graph_kind: 'derived' });
        const result = enforceDerivedFromDerived(sourceNode, edge, {
            ruleVersion: '1.0',
            isDeterministic: true,
            isAuditable: true,
        });
        expect(result.passed).toBe(true);
    });

    it('fails when rule is not versioned', () => {
        const sourceNode = makeNode({ graph_kind: 'derived' });
        const edge = makeEdge({ graph_kind: 'derived' });
        const result = enforceDerivedFromDerived(sourceNode, edge, {
            isDeterministic: true,
            isAuditable: true,
        });
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.message).toContain('versioned');
    });

    it('fails when rule is not deterministic', () => {
        const sourceNode = makeNode({ graph_kind: 'derived' });
        const edge = makeEdge({ graph_kind: 'derived' });
        const result = enforceDerivedFromDerived(sourceNode, edge, {
            ruleVersion: '1.0',
            isDeterministic: false,
            isAuditable: true,
        });
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.message).toContain('deterministic');
    });

    it('fails when rule is not auditable', () => {
        const sourceNode = makeNode({ graph_kind: 'derived' });
        const edge = makeEdge({ graph_kind: 'derived' });
        const result = enforceDerivedFromDerived(sourceNode, edge, {
            ruleVersion: '1.0',
            isDeterministic: true,
            isAuditable: false,
        });
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.message).toContain('auditable');
    });

    it('fails when no context provided', () => {
        const sourceNode = makeNode({ graph_kind: 'derived' });
        const edge = makeEdge({ graph_kind: 'derived' });
        const result = enforceDerivedFromDerived(sourceNode, edge);
        expect(result.passed).toBe(false);
    });

    it('skips when source is not derived', () => {
        const sourceNode = makeNode({ graph_kind: 'canonical' });
        const edge = makeEdge({ graph_kind: 'derived' });
        const result = enforceDerivedFromDerived(sourceNode, edge);
        expect(result.passed).toBe(true);
    });
});

// ── Exploratory Non-Authoritative (Req 6.5) ────────────────────────────────

describe('enforceExploratoryNonAuthoritative', () => {
    it('passes for exploratory node with EXPLORATORY trust', () => {
        const node = makeNode({
            graph_kind: 'exploratory',
            trust_level: 'EXPLORATORY',
            confidence_band: 'AMBIGUOUS',
            provenance: aiProvenance,
        });
        const result = enforceExploratoryNonAuthoritative(node);
        expect(result.passed).toBe(true);
    });

    it('fails for exploratory node with AUTHORITATIVE trust level', () => {
        const node = makeNode({
            graph_kind: 'exploratory',
            trust_level: 'AUTHORITATIVE',
            confidence_band: 'AMBIGUOUS',
            provenance: aiProvenance,
        });
        const result = enforceExploratoryNonAuthoritative(node);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.message).toContain('AUTHORITATIVE trust level');
    });

    it('fails for exploratory node with AUTHORITATIVE confidence band', () => {
        const node = makeNode({
            graph_kind: 'exploratory',
            trust_level: 'EXPLORATORY',
            confidence_band: 'AUTHORITATIVE',
            provenance: aiProvenance,
        });
        const result = enforceExploratoryNonAuthoritative(node);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.message).toContain('AUTHORITATIVE confidence band');
    });

    it('skips non-exploratory nodes', () => {
        const node = makeNode({ graph_kind: 'canonical' });
        const result = enforceExploratoryNonAuthoritative(node);
        expect(result.passed).toBe(true);
    });
});

describe('enforceExploratoryEdgeNonAuthoritative', () => {
    it('passes for exploratory edge with EXPLORATORY trust', () => {
        const edge = makeEdge({
            graph_kind: 'exploratory',
            trust_level: 'EXPLORATORY',
            confidence_band: 'AMBIGUOUS',
        });
        const result = enforceExploratoryEdgeNonAuthoritative(edge);
        expect(result.passed).toBe(true);
    });

    it('fails for exploratory edge with AUTHORITATIVE trust level', () => {
        const edge = makeEdge({
            graph_kind: 'exploratory',
            trust_level: 'AUTHORITATIVE',
            confidence_band: 'AMBIGUOUS',
        });
        const result = enforceExploratoryEdgeNonAuthoritative(edge);
        expect(result.passed).toBe(false);
    });
});

// ── Exploratory-to-Canonical Upgrade (Req 4.7) ─────────────────────────────

describe('enforceNoExploratoryUpgrade', () => {
    it('passes when no existing node', () => {
        const newNode = makeNode({ graph_kind: 'canonical' });
        const result = enforceNoExploratoryUpgrade(undefined, newNode);
        expect(result.passed).toBe(true);
    });

    it('passes when existing is canonical and new is canonical', () => {
        const existing = makeNode({ graph_kind: 'canonical' });
        const newNode = makeNode({ graph_kind: 'canonical' });
        const result = enforceNoExploratoryUpgrade(existing, newNode);
        expect(result.passed).toBe(true);
    });

    it('fails when existing is exploratory and new is canonical (silent upgrade)', () => {
        const existing = makeNode({ graph_kind: 'exploratory', trust_level: 'EXPLORATORY' });
        const newNode = makeNode({ graph_kind: 'canonical' });
        const result = enforceNoExploratoryUpgrade(existing, newNode);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.code).toBe(PipelineError.CANONICAL_PROMOTION_DENIED);
    });

    it('passes when existing is derived and new is canonical', () => {
        const existing = makeNode({ graph_kind: 'derived', trust_level: 'DERIVED' });
        const newNode = makeNode({ graph_kind: 'canonical' });
        const result = enforceNoExploratoryUpgrade(existing, newNode);
        expect(result.passed).toBe(true);
    });
});

// ── External Gating (Req 6.6) ───────────────────────────────────────────────

describe('enforceExternalGated', () => {
    it('passes for external node with full audit trail', () => {
        const node = makeNode({
            graph_kind: 'external',
            trust_level: 'EXPLORATORY',
            provenance: {
                source: 'user',
                artifact_source: 'feedback',
                producer_stage: 'external-ingestion',
                timestamp: '2026-01-01T00:00:00.000Z',
            },
        });
        const result = enforceExternalGated(node);
        expect(result.passed).toBe(true);
    });

    it('fails for external node without timestamp', () => {
        const node = makeNode({
            graph_kind: 'external',
            trust_level: 'EXPLORATORY',
            provenance: {
                source: 'user',
                artifact_source: 'feedback',
                producer_stage: 'external-ingestion',
                timestamp: '',
            },
        });
        const result = enforceExternalGated(node);
        expect(result.passed).toBe(false);
    });

    it('fails for external node with AUTHORITATIVE trust', () => {
        const node = makeNode({
            graph_kind: 'external',
            trust_level: 'AUTHORITATIVE',
            provenance: {
                source: 'user',
                artifact_source: 'feedback',
                producer_stage: 'external-ingestion',
                timestamp: '2026-01-01T00:00:00.000Z',
            },
        });
        const result = enforceExternalGated(node);
        expect(result.passed).toBe(false);
        expect(result.violations[0]!.message).toContain('AUTHORITATIVE');
    });

    it('skips non-external nodes', () => {
        const node = makeNode({ graph_kind: 'canonical' });
        const result = enforceExternalGated(node);
        expect(result.passed).toBe(true);
    });
});

describe('enforceExternalEdgeGated', () => {
    it('passes for external edge with full audit trail', () => {
        const edge = makeEdge({
            graph_kind: 'external',
            trust_level: 'EXPLORATORY',
            provenance: {
                source: 'user',
                artifact_source: 'feedback',
                producer_stage: 'external-ingestion',
                timestamp: '2026-01-01T00:00:00.000Z',
            },
        });
        const result = enforceExternalEdgeGated(edge);
        expect(result.passed).toBe(true);
    });

    it('fails for external edge with AUTHORITATIVE trust', () => {
        const edge = makeEdge({
            graph_kind: 'external',
            trust_level: 'AUTHORITATIVE',
            provenance: {
                source: 'user',
                artifact_source: 'feedback',
                producer_stage: 'external-ingestion',
                timestamp: '2026-01-01T00:00:00.000Z',
            },
        });
        const result = enforceExternalEdgeGated(edge);
        expect(result.passed).toBe(false);
    });
});

// ── Aggregate Utilities ─────────────────────────────────────────────────────

describe('collectViolations', () => {
    it('collects violations from multiple results', () => {
        const r1 = { passed: false, violations: [{ code: 'A', message: 'a' }] };
        const r2 = { passed: false, violations: [{ code: 'B', message: 'b' }] };
        const combined = collectViolations(r1, r2);
        expect(combined.passed).toBe(false);
        expect(combined.violations).toHaveLength(2);
    });

    it('passes when all results pass', () => {
        const r1 = { passed: true, violations: [] };
        const r2 = { passed: true, violations: [] };
        const combined = collectViolations(r1, r2);
        expect(combined.passed).toBe(true);
    });
});

describe('throwOnViolations', () => {
    it('does not throw when result passes', () => {
        expect(() => throwOnViolations({ passed: true, violations: [] }, 'test')).not.toThrow();
    });

    it('throws with GRAPH_BUILD_FAILED when violations exist', () => {
        const result = {
            passed: false,
            violations: [{ code: 'TEST', message: 'test violation' }],
        };
        expect(() => throwOnViolations(result, 'testStage')).toThrow('GRAPH_BUILD_FAILED');
        expect(() => throwOnViolations(result, 'testStage')).toThrow('testStage');
    });
});
