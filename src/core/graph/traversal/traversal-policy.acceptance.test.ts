import { describe, it, expect, beforeEach } from 'vitest';
import { EdgePolicyTable } from './EdgePolicyTable.js';
import type { GraphNode, GraphEdge, OperationType, QueryMode } from '../../types.js';

describe('Operation-Aware Traversal Policy Acceptance Tests', () => {
    const canonicalNode: GraphNode = {
        id: 'n1', workspace: 'w1', project: 'p1', label: 'N1', type: 'function', graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE',
        provenance: { source: 'parser', artifact_source: 's1', producer_stage: 'extract', timestamp: '2026-01-01' }
    };

    const exploratoryNode: GraphNode = {
        id: 'n2', workspace: 'w1', project: 'p1', label: 'N2', type: 'function', graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS', trust_level: 'EXPLORATORY',
        provenance: { source: 'ai', artifact_source: 's2', producer_stage: 'enrich', timestamp: '2026-01-01' }
    };

    const callEdge: GraphEdge = {
        id: 'e1', workspace: 'w1', from_id: 'n1', to_id: 'n2', type: 'calls', graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE',
        provenance: { source: 'parser', artifact_source: 's1', producer_stage: 'extract', timestamp: '2026-01-01' }
    };

    const importEdge: GraphEdge = {
        id: 'e2', workspace: 'w1', from_id: 'n1', to_id: 'n2', type: 'imports', graph_kind: 'canonical',
        confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE',
        provenance: { source: 'parser', artifact_source: 's1', producer_stage: 'extract', timestamp: '2026-01-01' }
    };

    const exploratoryEdge: GraphEdge = {
        id: 'e3', workspace: 'w1', from_id: 'n1', to_id: 'n2', type: 'calls', graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS', trust_level: 'EXPLORATORY',
        provenance: { source: 'ai', artifact_source: 's2', producer_stage: 'enrich', timestamp: '2026-01-01' }
    };

    describe('1. Strict Impact Pruning', () => {
        it('should block imports and semantic_match edges in impact operation', () => {
            const result = EdgePolicyTable.evaluateEdge(importEdge, { operation: 'impact', mode: 'mixed_safe' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('IMPACT_REQUIRES_CONTROL_FLOW');
        });

        it('should allow calls edges in impact operation', () => {
            const result = EdgePolicyTable.evaluateEdge(callEdge, { operation: 'impact', mode: 'mixed_safe' });
            expect(result.allowed).toBe(true);
        });
    });

    describe('2. Exploratory Hop Limit', () => {
        it('should allow exploratory edges in mixed_safe up to 2 hops (at 0)', () => {
            const result = EdgePolicyTable.evaluateEdge(exploratoryEdge, {
                operation: 'ask',
                mode: 'mixed_safe',
                currentExploratoryHops: 0
            });
            expect(result.allowed).toBe(true);
            expect(result.warnings).toContain('EXPLORATORY_USED');
        });

        it('should block exploratory edges in mixed_safe at 2 hops', () => {
            const result = EdgePolicyTable.evaluateEdge(exploratoryEdge, {
                operation: 'ask',
                mode: 'mixed_safe',
                currentExploratoryHops: 2
            });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('EXPLORATORY_HOP_LIMIT_EXCEEDED');
        });
    });

    describe('3. Operation Visibility', () => {
        it('should hide exploratory nodes in wiki operation', () => {
            expect(EdgePolicyTable.isNodeVisible(exploratoryNode, { operation: 'wiki', mode: 'mixed_safe' })).toBe(false);
        });

        it('should hide exploratory nodes in authoritative mode', () => {
            expect(EdgePolicyTable.isNodeVisible(exploratoryNode, { operation: 'ask', mode: 'authoritative' })).toBe(false);
        });

        it('should show canonical nodes in wiki operation', () => {
            expect(EdgePolicyTable.isNodeVisible(canonicalNode, { operation: 'wiki', mode: 'mixed_safe' })).toBe(true);
        });
    });

    describe('4. Governance Lineage', () => {
        it('should block exploratory edge kinds for governance operation', () => {
            const result = EdgePolicyTable.evaluateEdge(exploratoryEdge, { operation: 'governance', mode: 'mixed_safe' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('GOVERNANCE_REQUIRES_AUTHORITY');
        });
    });

    describe('5. Fail-Closed Operation', () => {
        it('should block all edges if operation is unknown (cast to any for test)', () => {
            const result = EdgePolicyTable.evaluateEdge(callEdge, { operation: 'invalid' as any, mode: 'mixed_safe' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('POLICY_VIOLATION');
            expect(result.codes).toContain('UNKNOWN_OPERATION');
        });
    });

    describe('6. Mixed Safe Warning', () => {
        it('should emit EXPLORATORY_USED warning when exploratory edge is encountered', () => {
            const result = EdgePolicyTable.evaluateEdge(exploratoryEdge, { operation: 'ask', mode: 'mixed_safe' });
            expect(result.warnings).toContain('EXPLORATORY_USED');
        });
    });

    describe('7. Authoritative Enforce', () => {
        it('should reject exploratory edges even if operation usually allows them', () => {
            const result = EdgePolicyTable.evaluateEdge(exploratoryEdge, { operation: 'ask', mode: 'authoritative' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('CONFIDENCE_BAND_NOT_ALLOWED');
        });

        it('should reject canonical authoritative edges without parser provenance', () => {
            const aiCanonicalEdge: GraphEdge = {
                ...callEdge,
                id: 'ai-canonical-edge',
                provenance: { source: 'ai', artifact_source: 's2', producer_stage: 'enrich', timestamp: '2026-01-01' }
            };

            const result = EdgePolicyTable.evaluateEdge(aiCanonicalEdge, { operation: 'ask', mode: 'authoritative' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('CANONICAL_PROVENANCE_MISSING');
        });
    });

    describe('8. Global Edge Taxonomy Guard', () => {
        const unknownTypeEdge: GraphEdge = {
            id: 'e-unknown', workspace: 'w1', from_id: 'n1', to_id: 'n2',
            type: 'semantic_match' as any,
            graph_kind: 'canonical',
            confidence_band: 'AUTHORITATIVE', trust_level: 'AUTHORITATIVE',
            provenance: { source: 'parser', artifact_source: 's1', producer_stage: 'extract', timestamp: '2026-01-01' }
        };

        it('rejects unknown edge type in ask+mixed_safe (fail-closed)', () => {
            const result = EdgePolicyTable.evaluateEdge(unknownTypeEdge, { operation: 'ask', mode: 'mixed_safe' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('INVALID_EDGE_TYPE');
        });

        it('rejects unknown edge type in ask+authoritative', () => {
            const result = EdgePolicyTable.evaluateEdge(unknownTypeEdge, { operation: 'ask', mode: 'authoritative' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('INVALID_EDGE_TYPE');
        });

        it('rejects unknown edge type in ask+exploratory', () => {
            const result = EdgePolicyTable.evaluateEdge(unknownTypeEdge, { operation: 'ask', mode: 'exploratory' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('INVALID_EDGE_TYPE');
        });

        it('rejects unknown edge type before any operation-specific allow logic (impact)', () => {
            const result = EdgePolicyTable.evaluateEdge(unknownTypeEdge, { operation: 'impact', mode: 'mixed_safe' });
            expect(result.allowed).toBe(false);
            expect(result.codes).toContain('INVALID_EDGE_TYPE');
            expect(result.codes).not.toContain('IMPACT_REQUIRES_CONTROL_FLOW');
        });

        it('allows a known edge type (calls) in ask+mixed_safe', () => {
            const result = EdgePolicyTable.evaluateEdge(callEdge, { operation: 'ask', mode: 'mixed_safe' });
            expect(result.allowed).toBe(true);
            expect(result.codes).not.toContain('INVALID_EDGE_TYPE');
        });
    });
});
