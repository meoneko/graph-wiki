/**
 * GovernanceValidator unit tests.
 *
 * Tests authority chain validation, forbidden pattern detection,
 * flow integrity validation, and pipeline error reporting integration.
 *
 * **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**
 */
import { describe, it, expect } from 'vitest';
import { GovernanceValidator } from './GovernanceValidator.js';
import { DecisionStatus, RuntimeCode } from '../../errors.js';
import type { GraphNode, GraphEdge, Provenance } from '../../types.js';
import type { ForbiddenPattern, GovernanceConfig } from '../../../pipeline/config.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

const parserProv: Provenance = {
  source: 'parser',
  artifact_source: 'test.ts',
  producer_stage: 'extract',
  timestamp: '2026-01-01T00:00:00Z',
};

const aiProv: Provenance = {
  source: 'ai',
  artifact_source: 'test.ts',
  producer_stage: 'enrich',
  timestamp: '2026-01-01T00:00:00Z',
};

function makeNode(overrides: Partial<GraphNode> & Pick<GraphNode, 'id'>): GraphNode {
  return {
    stableKey: overrides.id,
    workspace: 'ws1',
    project: 'p1',
    type: 'function',
    label: overrides.id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProv,
    ...overrides,
  };
}

function makeEdge(
  overrides: Partial<GraphEdge> & Pick<GraphEdge, 'id' | 'from_id' | 'to_id' | 'type'>,
): GraphEdge {
  return {
    stableKey: overrides.id,
    workspace: 'ws1',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: parserProv,
    ...overrides,
  };
}


// ─── Authority Chain Validation Tests ────────────────────────────────────────

describe('GovernanceValidator', () => {
  describe('Authority Chain Validation (Req 17.1, 17.4, 17.5)', () => {
    it('rejects exploratory authority edges as governance proof', () => {
      const node = makeNode({ id: 'n1' });
      const target = makeNode({ id: 'n2' });
      const exploratoryAuth = makeEdge({
        id: 'auth-exp',
        from_id: 'n1',
        to_id: 'n2',
        type: 'uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY',
        provenance: aiProv,
      });

      const result = GovernanceValidator.validate([node, target], [exploratoryAuth]);

      expect(result.passed).toBe(false);
      expect(result.status).toBe(DecisionStatus.POLICY_VIOLATION);
      expect(result.issues.some((i) => i.code === RuntimeCode.AUTHORITY_CHAIN_BROKEN)).toBe(true);
      const issue = result.issues.find((i) => i.edgeId === 'auth-exp');
      expect(issue).toBeDefined();
      expect(issue!.chainBreak).toBeDefined();
      expect(issue!.chainBreak!.reason).toContain('Exploratory');
    });

    it('accepts canonical authority edges as valid governance proof', () => {
      const node = makeNode({ id: 'n1' });
      const target = makeNode({ id: 'n2' });
      const canonicalAuth = makeEdge({
        id: 'auth-can',
        from_id: 'n1',
        to_id: 'n2',
        type: 'uses_authority',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([node, target], [canonicalAuth]);

      expect(result.passed).toBe(true);
      expect(result.status).toBe(DecisionStatus.OK);
      expect(result.issues).toHaveLength(0);
    });

    it('detects dangling authority edges (missing endpoints)', () => {
      const node = makeNode({ id: 'n1' });
      const danglingAuth = makeEdge({
        id: 'auth-dangling',
        from_id: 'n1',
        to_id: 'missing-node',
        type: 'depends_on_authority',
      });

      const result = GovernanceValidator.validate([node], [danglingAuth]);

      expect(result.passed).toBe(false);
      expect(result.status).toBe(DecisionStatus.POLICY_VIOLATION);
      const issue = result.issues.find((i) => i.edgeId === 'auth-dangling');
      expect(issue).toBeDefined();
      expect(issue!.code).toBe(RuntimeCode.AUTHORITY_CHAIN_BROKEN);
      expect(issue!.chainBreak!.reason).toContain('non-existent');
    });

    it('flags canonical node with only exploratory authority edges', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical' });
      const target = makeNode({ id: 'n2' });
      const exploratoryAuth = makeEdge({
        id: 'auth-exp',
        from_id: 'n1',
        to_id: 'n2',
        type: 'node_uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY',
        provenance: aiProv,
      });

      const result = GovernanceValidator.validate([node, target], [exploratoryAuth]);

      expect(result.passed).toBe(false);
      const nodeIssue = result.issues.find(
        (i) => i.nodeId === 'n1' && i.code === RuntimeCode.AUTHORITY_CHAIN_BROKEN,
      );
      expect(nodeIssue).toBeDefined();
      expect(nodeIssue!.chainBreak!.reason).toContain('exploratory');
    });

    it('passes canonical node with mixed authority edges (at least one canonical)', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical' });
      const target1 = makeNode({ id: 'n2' });
      const target2 = makeNode({ id: 'n3' });
      const canonicalAuth = makeEdge({
        id: 'auth-can',
        from_id: 'n1',
        to_id: 'n2',
        type: 'uses_authority',
        graph_kind: 'canonical',
      });
      const exploratoryAuth = makeEdge({
        id: 'auth-exp',
        from_id: 'n1',
        to_id: 'n3',
        type: 'uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        trust_level: 'EXPLORATORY',
        provenance: aiProv,
      });

      const result = GovernanceValidator.validate(
        [node, target1, target2],
        [canonicalAuth, exploratoryAuth],
      );

      // The exploratory edge itself is flagged, but the node is not
      // because it has at least one canonical authority edge
      const nodeIssues = result.issues.filter(
        (i) => i.nodeId === 'n1' && i.code === RuntimeCode.AUTHORITY_CHAIN_BROKEN,
      );
      expect(nodeIssues).toHaveLength(0);
    });

    it('flags governance-relevant edge without canonical authority proof', () => {
      const source = makeNode({ id: 'svc' });
      const target = makeNode({ id: 'policy' });
      const govEdge = makeEdge({
        id: 'gov-edge',
        from_id: 'svc',
        to_id: 'policy',
        type: 'calls',
        graph_kind: 'canonical',
        metadata: { requires_authority: true },
      });

      const result = GovernanceValidator.validate([source, target], [govEdge]);

      expect(result.passed).toBe(false);
      const issue = result.issues.find((i) => i.edgeId === 'gov-edge');
      expect(issue).toBeDefined();
      expect(issue!.code).toBe(RuntimeCode.AUTHORITY_CHAIN_BROKEN);
    });

    it('passes governance-relevant edge with canonical authority proof', () => {
      const source = makeNode({ id: 'svc' });
      const target = makeNode({ id: 'policy' });
      const authTarget = makeNode({ id: 'auth-target' });
      const govEdge = makeEdge({
        id: 'gov-edge',
        from_id: 'svc',
        to_id: 'policy',
        type: 'calls',
        graph_kind: 'canonical',
        metadata: { requires_authority: true },
      });
      const authEdge = makeEdge({
        id: 'auth-proof',
        from_id: 'svc',
        to_id: 'auth-target',
        type: 'uses_authority',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate(
        [source, target, authTarget],
        [govEdge, authEdge],
      );

      const govIssues = result.issues.filter((i) => i.edgeId === 'gov-edge');
      expect(govIssues).toHaveLength(0);
    });
  });

  // ─── Forbidden Pattern Detection Tests ───────────────────────────────────

  describe('Forbidden Pattern Detection (Req 17.2)', () => {
    const forbiddenPatterns: ForbiddenPattern[] = [
      {
        id: 'no-controller-to-db',
        from_type: 'controller_action',
        to_type: 'repository',
        description: 'Controllers must not access repositories directly',
      },
      {
        id: 'no-fe-to-db-via-calls',
        from_type: 'frontend_route',
        to_type: 'entity',
        via_edge: 'calls',
        description: 'Frontend routes must not call entities directly',
      },
    ];

    it('detects forbidden pattern violation (from_type → to_type)', () => {
      const controller = makeNode({ id: 'ctrl', type: 'controller_action' });
      const repo = makeNode({ id: 'repo', type: 'repository' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'ctrl',
        to_id: 'repo',
        type: 'calls',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([controller, repo], [edge], {
        governance: { forbidden_patterns: forbiddenPatterns },
      });

      expect(result.passed).toBe(false);
      expect(result.status).toBe(DecisionStatus.POLICY_VIOLATION);
      const issue = result.issues.find((i) => i.code === 'FORBIDDEN_PATTERN_VIOLATION');
      expect(issue).toBeDefined();
      expect(issue!.detail).toContain('no-controller-to-db');
      expect(issue!.chainBreak).toBeDefined();
    });

    it('detects forbidden pattern with via_edge constraint', () => {
      const feRoute = makeNode({ id: 'fe', type: 'frontend_route' });
      const entity = makeNode({ id: 'ent', type: 'entity' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'fe',
        to_id: 'ent',
        type: 'calls',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([feRoute, entity], [edge], {
        governance: { forbidden_patterns: forbiddenPatterns },
      });

      expect(result.passed).toBe(false);
      const issue = result.issues.find(
        (i) => i.code === 'FORBIDDEN_PATTERN_VIOLATION' && i.detail.includes('no-fe-to-db-via-calls'),
      );
      expect(issue).toBeDefined();
    });

    it('does not flag when via_edge does not match', () => {
      const feRoute = makeNode({ id: 'fe', type: 'frontend_route' });
      const entity = makeNode({ id: 'ent', type: 'entity' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'fe',
        to_id: 'ent',
        type: 'imports', // not 'calls'
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([feRoute, entity], [edge], {
        governance: { forbidden_patterns: forbiddenPatterns },
      });

      const feToDbIssues = result.issues.filter(
        (i) => i.code === 'FORBIDDEN_PATTERN_VIOLATION' && i.detail.includes('no-fe-to-db-via-calls'),
      );
      expect(feToDbIssues).toHaveLength(0);
    });

    it('ignores exploratory edges for forbidden pattern detection', () => {
      const controller = makeNode({ id: 'ctrl', type: 'controller_action' });
      const repo = makeNode({ id: 'repo', type: 'repository' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'ctrl',
        to_id: 'repo',
        type: 'calls',
        graph_kind: 'exploratory', // exploratory edges are not checked
        confidence_band: 'AMBIGUOUS',
      });

      const result = GovernanceValidator.validate([controller, repo], [edge], {
        governance: { forbidden_patterns: forbiddenPatterns },
      });

      const patternIssues = result.issues.filter(
        (i) => i.code === 'FORBIDDEN_PATTERN_VIOLATION',
      );
      expect(patternIssues).toHaveLength(0);
    });

    it('does not flag when no forbidden patterns are configured', () => {
      const controller = makeNode({ id: 'ctrl', type: 'controller_action' });
      const repo = makeNode({ id: 'repo', type: 'repository' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'ctrl',
        to_id: 'repo',
        type: 'calls',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([controller, repo], [edge], {
        governance: { forbidden_patterns: [] },
      });

      const patternIssues = result.issues.filter(
        (i) => i.code === 'FORBIDDEN_PATTERN_VIOLATION',
      );
      expect(patternIssues).toHaveLength(0);
    });

    it('supports wildcard prefix matching in pattern types', () => {
      const patterns: ForbiddenPattern[] = [
        {
          id: 'no-frontend-to-db',
          from_type: 'frontend*',
          to_type: 'entity',
          description: 'No frontend component should access entities',
        },
      ];
      const feComponent = makeNode({ id: 'fe', type: 'frontend_route' });
      const entity = makeNode({ id: 'ent', type: 'entity' });
      const edge = makeEdge({
        id: 'e1',
        from_id: 'fe',
        to_id: 'ent',
        type: 'calls',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([feComponent, entity], [edge], {
        governance: { forbidden_patterns: patterns },
      });

      expect(result.issues.some((i) => i.code === 'FORBIDDEN_PATTERN_VIOLATION')).toBe(true);
    });
  });

  // ─── Flow Integrity Validation Tests ─────────────────────────────────────

  describe('Flow Integrity Validation (Req 17.3)', () => {
    it('flags critical flow not found in graph', () => {
      const node = makeNode({ id: 'n1', type: 'function' });

      const result = GovernanceValidator.validate([node], [], {
        governance: { critical_flows: ['order-processing'] },
      });

      expect(result.passed).toBe(false);
      const issue = result.issues.find(
        (i) => i.code === 'FLOW_INTEGRITY_VIOLATION' && i.detail.includes('order-processing'),
      );
      expect(issue).toBeDefined();
      expect(issue!.chainBreak!.reason).toContain('No flow node');
    });

    it('flags critical flow with no reachable entrypoint', () => {
      const flowNode = makeNode({ id: 'order-flow', type: 'flow' });
      const member = makeNode({ id: 'step1', type: 'usecase' });
      const belongsEdge = makeEdge({
        id: 'btf1',
        from_id: 'step1',
        to_id: 'order-flow',
        type: 'belongs_to_flow',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate([flowNode, member], [belongsEdge], {
        governance: { critical_flows: ['order-flow'] },
      });

      const issue = result.issues.find(
        (i) =>
          i.code === 'FLOW_INTEGRITY_VIOLATION' &&
          i.detail.includes('no reachable entrypoint'),
      );
      expect(issue).toBeDefined();
    });

    it('passes critical flow with reachable entrypoint', () => {
      const flowNode = makeNode({ id: 'order-flow', type: 'flow' });
      const entrypoint = makeNode({ id: 'ep1', type: 'entrypoint' });
      const member = makeNode({ id: 'step1', type: 'usecase' });
      const entryEdge = makeEdge({
        id: 'entry1',
        from_id: 'ep1',
        to_id: 'order-flow',
        type: 'entry_of',
        graph_kind: 'canonical',
      });
      const belongsEdge = makeEdge({
        id: 'btf1',
        from_id: 'step1',
        to_id: 'order-flow',
        type: 'belongs_to_flow',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate(
        [flowNode, entrypoint, member],
        [entryEdge, belongsEdge],
        { governance: { critical_flows: ['order-flow'] } },
      );

      const entrypointIssues = result.issues.filter(
        (i) => i.code === 'FLOW_INTEGRITY_VIOLATION' && i.detail.includes('no reachable entrypoint'),
      );
      expect(entrypointIssues).toHaveLength(0);
    });

    it('detects dead branches in critical flows', () => {
      const flowNode = makeNode({ id: 'order-flow', type: 'flow' });
      const entrypoint = makeNode({ id: 'ep1', type: 'entrypoint' });
      const step1 = makeNode({ id: 'step1', type: 'usecase' });
      const deadStep = makeNode({ id: 'dead-step', type: 'usecase' });

      const entryEdge = makeEdge({
        id: 'entry1',
        from_id: 'ep1',
        to_id: 'order-flow',
        type: 'entry_of',
        graph_kind: 'canonical',
      });
      const belongsEdge1 = makeEdge({
        id: 'btf1',
        from_id: 'step1',
        to_id: 'order-flow',
        type: 'belongs_to_flow',
        graph_kind: 'canonical',
      });
      const belongsEdge2 = makeEdge({
        id: 'btf2',
        from_id: 'dead-step',
        to_id: 'order-flow',
        type: 'belongs_to_flow',
        graph_kind: 'canonical',
      });
      const flowEdge = makeEdge({
        id: 'flow1',
        from_id: 'step1',
        to_id: 'dead-step',
        type: 'calls',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate(
        [flowNode, entrypoint, step1, deadStep],
        [entryEdge, belongsEdge1, belongsEdge2, flowEdge],
        { governance: { critical_flows: ['order-flow'] } },
      );

      // dead-step has no outgoing control flow edges and is not a terminal type
      const deadBranchIssue = result.issues.find(
        (i) =>
          i.code === 'FLOW_INTEGRITY_VIOLATION' &&
          i.detail.includes('dead-step') &&
          i.detail.includes('Dead branch'),
      );
      expect(deadBranchIssue).toBeDefined();
    });

    it('does not flag terminal node types as dead branches', () => {
      const flowNode = makeNode({ id: 'order-flow', type: 'flow' });
      const entrypoint = makeNode({ id: 'ep1', type: 'entrypoint' });
      const step1 = makeNode({ id: 'step1', type: 'usecase' });
      const externalSvc = makeNode({ id: 'ext-svc', type: 'external_service' });

      const entryEdge = makeEdge({
        id: 'entry1',
        from_id: 'ep1',
        to_id: 'order-flow',
        type: 'entry_of',
        graph_kind: 'canonical',
      });
      const belongsEdge1 = makeEdge({
        id: 'btf1',
        from_id: 'step1',
        to_id: 'order-flow',
        type: 'belongs_to_flow',
        graph_kind: 'canonical',
      });
      const belongsEdge2 = makeEdge({
        id: 'btf2',
        from_id: 'ext-svc',
        to_id: 'order-flow',
        type: 'belongs_to_flow',
        graph_kind: 'canonical',
      });
      const flowEdge = makeEdge({
        id: 'flow1',
        from_id: 'step1',
        to_id: 'ext-svc',
        type: 'calls',
        graph_kind: 'canonical',
      });

      const result = GovernanceValidator.validate(
        [flowNode, entrypoint, step1, externalSvc],
        [entryEdge, belongsEdge1, belongsEdge2, flowEdge],
        { governance: { critical_flows: ['order-flow'] } },
      );

      // external_service is a terminal type, should not be flagged
      const deadBranchIssues = result.issues.filter(
        (i) =>
          i.code === 'FLOW_INTEGRITY_VIOLATION' &&
          i.detail.includes('ext-svc') &&
          i.detail.includes('Dead branch'),
      );
      expect(deadBranchIssues).toHaveLength(0);
    });

    it('does not run flow validation when no critical flows configured', () => {
      const node = makeNode({ id: 'n1', type: 'function' });

      const result = GovernanceValidator.validate([node], [], {
        governance: { critical_flows: [] },
      });

      const flowIssues = result.issues.filter(
        (i) => i.code === 'FLOW_INTEGRITY_VIOLATION',
      );
      expect(flowIssues).toHaveLength(0);
    });
  });

  // ─── Result Structure Tests ──────────────────────────────────────────────

  describe('Result Structure', () => {
    it('returns OK status when no issues found', () => {
      const node = makeNode({ id: 'n1' });

      const result = GovernanceValidator.validate([node], []);

      expect(result.passed).toBe(true);
      expect(result.status).toBe(DecisionStatus.OK);
      expect(result.issues).toHaveLength(0);
      expect(result.codes).toHaveLength(0);
    });

    it('returns POLICY_VIOLATION status when errors exist', () => {
      const node = makeNode({ id: 'n1' });
      const exploratoryAuth = makeEdge({
        id: 'auth-exp',
        from_id: 'n1',
        to_id: 'missing',
        type: 'uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        provenance: aiProv,
      });

      const result = GovernanceValidator.validate([node], [exploratoryAuth]);

      expect(result.passed).toBe(false);
      expect(result.status).toBe(DecisionStatus.POLICY_VIOLATION);
    });

    it('collects unique codes from all issues', () => {
      const node = makeNode({ id: 'n1', graph_kind: 'canonical' });
      const target = makeNode({ id: 'n2' });
      const exploratoryAuth = makeEdge({
        id: 'auth-exp',
        from_id: 'n1',
        to_id: 'n2',
        type: 'uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        provenance: aiProv,
      });

      const result = GovernanceValidator.validate([node, target], [exploratoryAuth]);

      expect(result.codes.length).toBeGreaterThan(0);
      // Codes should be unique
      const uniqueCodes = new Set(result.codes);
      expect(uniqueCodes.size).toBe(result.codes.length);
    });

    it('includes chainBreak details in issues', () => {
      const node = makeNode({ id: 'n1' });
      const danglingAuth = makeEdge({
        id: 'auth-dangling',
        from_id: 'n1',
        to_id: 'missing',
        type: 'uses_authority',
      });

      const result = GovernanceValidator.validate([node], [danglingAuth]);

      const issue = result.issues.find((i) => i.edgeId === 'auth-dangling');
      expect(issue).toBeDefined();
      expect(issue!.chainBreak).toBeDefined();
      expect(issue!.chainBreak!.breakPoint).toBeDefined();
      expect(issue!.chainBreak!.expectedChain).toBeDefined();
      expect(issue!.chainBreak!.actualChain).toBeDefined();
      expect(issue!.chainBreak!.reason).toBeDefined();
    });
  });

  // ─── Integration with 07_verify.ts ──────────────────────────────────────

  describe('Pipeline Integration', () => {
    it('governance issues are structured for pipeline error reporting', () => {
      const node = makeNode({ id: 'n1' });
      const exploratoryAuth = makeEdge({
        id: 'auth-exp',
        from_id: 'n1',
        to_id: 'missing',
        type: 'uses_authority',
        graph_kind: 'exploratory',
        confidence_band: 'AMBIGUOUS',
        provenance: aiProv,
      });

      const result = GovernanceValidator.validate([node], [exploratoryAuth]);

      // Verify the structure matches what 07_verify.ts expects
      for (const issue of result.issues) {
        expect(typeof issue.code).toBe('string');
        expect(issue.code.length).toBeGreaterThan(0);
        expect(['error', 'warning']).toContain(issue.severity);
        expect(typeof issue.detail).toBe('string');
      }
    });

    it('governance options accept workspace governance config', () => {
      const node = makeNode({ id: 'n1', type: 'function' });

      const governance: GovernanceConfig = {
        authority_chain: ['canonical', 'derived'],
        forbidden_patterns: [
          {
            id: 'test-pattern',
            from_type: 'controller_action',
            to_type: 'repository',
            description: 'Test pattern',
          },
        ],
        critical_flows: ['test-flow'],
        reporting: { unknown_token: '?', inferred_token: '~' },
      };

      // Should not throw
      const result = GovernanceValidator.validate([node], [], { governance });
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });
});
