import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentContextBuilder } from './AgentContextBuilder.js';
import type { GraphNode, GraphEdge, QueryMode, OperationType } from '../types.js';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<GraphNode> & { id: string }): GraphNode {
  return {
    stableKey: overrides.id,
    workspace: 'test-ws',
    project: 'test-project',
    type: 'function',
    label: overrides.id,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test.ts',
      producer_stage: '05a_build_canonical',
      timestamp: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

function makeEdge(overrides: Partial<GraphEdge> & { id: string; from_id: string; to_id: string }): GraphEdge {
  return {
    stableKey: overrides.id,
    workspace: 'test-ws',
    type: 'calls',
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: 'test.ts',
      producer_stage: '05a_build_canonical',
      timestamp: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

function createMockEngine(nodes: GraphNode[], edges: GraphEdge[]) {
  return {
    getVisibleGraph: vi.fn().mockResolvedValue({ nodes, edges }),
    searchNodes: vi.fn(),
    analyzeImpact: vi.fn(),
    findCallers: vi.fn(),
    getNode: vi.fn(),
    findReasoningPaths: vi.fn(),
    getBlastRadiusIds: vi.fn(),
    getRiskScore: vi.fn(),
    getGraphStats: vi.fn(),
    findHubs: vi.fn(),
    findBridges: vi.fn(),
    findKnowledgeGaps: vi.fn(),
    findDeadCode: vi.fn(),
    renamePreview: vi.fn(),
  } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AgentContextBuilder — Invariants, Risks, Verification, Forbidden Assumptions', () => {
  let builder: AgentContextBuilder;
  let mockEngine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    mockEngine = createMockEngine([], []);
    builder = new AgentContextBuilder(() => mockEngine);
  });

  // ─── Invariants ────────────────────────────────────────────────────────────

  describe('invariants collection', () => {
    it('always includes hard-rule invariants', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const hardRuleInvariants = result.invariants.filter((i) => i.source === 'hard-rule');
      expect(hardRuleInvariants.length).toBeGreaterThanOrEqual(3);

      const ids = hardRuleInvariants.map((i) => i.id);
      expect(ids).toContain('hard-rule-no-exploratory-in-canonical');
      expect(ids).toContain('hard-rule-node-id-uniqueness');
      expect(ids).toContain('hard-rule-canonical-parser-provenance');
    });

    it('includes authority-policy invariants when canonical nodes are present', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'canonical' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const authorityInvariants = result.invariants.filter((i) => i.source === 'authority-policy');
      expect(authorityInvariants.length).toBeGreaterThanOrEqual(1);
      expect(authorityInvariants.some((i) => i.id === 'authority-policy-canonical-eligibility')).toBe(true);
      expect(authorityInvariants.some((i) => i.id === 'authority-policy-no-silent-promotion')).toBe(true);
    });

    it('does not include authority-policy invariants when no canonical nodes', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'exploratory' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const authorityInvariants = result.invariants.filter((i) => i.source === 'authority-policy');
      expect(authorityInvariants.length).toBe(0);
    });

    it('includes graph-policy invariants for derived edges', async () => {
      const nodes = [
        makeNode({ id: 'n1' }),
        makeNode({ id: 'n2' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n2', graph_kind: 'derived' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const graphPolicyInvariants = result.invariants.filter((i) => i.source === 'graph-policy');
      expect(graphPolicyInvariants.some((i) => i.id === 'graph-policy-no-derived-from-derived')).toBe(true);
    });

    it('always includes graph-policy no-silent-trust-upgrade invariant', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const graphPolicyInvariants = result.invariants.filter((i) => i.source === 'graph-policy');
      expect(graphPolicyInvariants.some((i) => i.id === 'graph-policy-no-silent-trust-upgrade')).toBe(true);
    });

    it('always includes workspace-policy isolation invariant', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const wsPolicyInvariants = result.invariants.filter((i) => i.source === 'workspace-policy');
      expect(wsPolicyInvariants.some((i) => i.id === 'workspace-policy-isolation')).toBe(true);
    });

    it('all invariants have required fields', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'canonical' })];
      const edges = [makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n1', graph_kind: 'derived' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      for (const inv of result.invariants) {
        expect(inv.id).toBeTruthy();
        expect(inv.source).toBeTruthy();
        expect(inv.severity).toMatch(/^(hard|soft)$/);
        expect(inv.category).toBeTruthy();
        expect(inv.description).toBeTruthy();
      }
    });

    it('authority-policy invariants include appliesTo with canonical node IDs', async () => {
      const nodes = [
        makeNode({ id: 'canonical-1', graph_kind: 'canonical' }),
        makeNode({ id: 'canonical-2', graph_kind: 'canonical' }),
        makeNode({ id: 'exploratory-1', graph_kind: 'exploratory' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const eligibility = result.invariants.find((i) => i.id === 'authority-policy-canonical-eligibility');
      expect(eligibility).toBeDefined();
      expect(eligibility!.appliesTo).toContain('canonical-1');
      expect(eligibility!.appliesTo).toContain('canonical-2');
      expect(eligibility!.appliesTo).not.toContain('exploratory-1');
    });
  });

  // ─── Risk Assessment ───────────────────────────────────────────────────────

  describe('risk assessment', () => {
    it('identifies high-risk nodes with high fan-out', async () => {
      const nodes = [
        makeNode({ id: 'hub', source_file: 'src/hub.ts' }),
        makeNode({ id: 'target-1' }),
        makeNode({ id: 'target-2' }),
        makeNode({ id: 'target-3' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'hub', to_id: 'target-1' }),
        makeEdge({ id: 'e2', from_id: 'hub', to_id: 'target-2' }),
        makeEdge({ id: 'e3', from_id: 'hub', to_id: 'target-3' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const highRisk = result.risks.find((r) => r.severity === 'high');
      expect(highRisk).toBeDefined();
      expect(highRisk!.relatedNodes).toContain('hub');
      expect(highRisk!.description).toContain('fan-out');
    });

    it('identifies medium-risk entrypoint nodes', async () => {
      const nodes = [
        makeNode({ id: 'ep1', type: 'api_endpoint', source_file: 'src/api.ts' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const mediumRisk = result.risks.find((r) => r.severity === 'medium');
      expect(mediumRisk).toBeDefined();
      expect(mediumRisk!.relatedNodes).toContain('ep1');
      expect(mediumRisk!.description).toContain('entrypoint');
    });

    it('identifies low-risk nodes with exploratory edges', async () => {
      const nodes = [
        makeNode({ id: 'n1' }),
        makeNode({ id: 'n2' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n2', graph_kind: 'exploratory' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const lowRisk = result.risks.find((r) => r.severity === 'low');
      expect(lowRisk).toBeDefined();
      expect(lowRisk!.relatedNodes).toContain('n1');
      expect(lowRisk!.relatedNodes).toContain('n2');
      expect(lowRisk!.description).toContain('exploratory');
    });

    it('returns empty risks when no risk conditions are met', async () => {
      const nodes = [makeNode({ id: 'n1', type: 'function' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      expect(result.risks.length).toBe(0);
    });

    it('includes related files for high-risk nodes', async () => {
      const nodes = [
        makeNode({ id: 'hub', source_file: 'src/hub.ts' }),
        makeNode({ id: 't1' }),
        makeNode({ id: 't2' }),
        makeNode({ id: 't3' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'hub', to_id: 't1' }),
        makeEdge({ id: 'e2', from_id: 'hub', to_id: 't2' }),
        makeEdge({ id: 'e3', from_id: 'hub', to_id: 't3' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const highRisk = result.risks.find((r) => r.severity === 'high');
      expect(highRisk!.relatedFiles).toContain('src/hub.ts');
    });

    it('all risk items have required fields', async () => {
      const nodes = [
        makeNode({ id: 'hub', source_file: 'src/hub.ts' }),
        makeNode({ id: 'ep', type: 'api_endpoint' }),
        makeNode({ id: 't1' }),
        makeNode({ id: 't2' }),
        makeNode({ id: 't3' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'hub', to_id: 't1' }),
        makeEdge({ id: 'e2', from_id: 'hub', to_id: 't2' }),
        makeEdge({ id: 'e3', from_id: 'hub', to_id: 't3' }),
        makeEdge({ id: 'e4', from_id: 'ep', to_id: 'hub', graph_kind: 'exploratory' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      for (const risk of result.risks) {
        expect(risk.id).toBeTruthy();
        expect(risk.severity).toMatch(/^(high|medium|low)$/);
        expect(risk.description).toBeTruthy();
      }
    });
  });

  // ─── Verification Checklist ────────────────────────────────────────────────

  describe('verification checklist generation', () => {
    it('includes impact verification when nodes have downstream edges', async () => {
      const nodes = [
        makeNode({ id: 'n1', source_file: 'src/a.ts' }),
        makeNode({ id: 'n2' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n2' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const impactItem = result.verification_checklist.find((v) => v.source === 'impact');
      expect(impactItem).toBeDefined();
      expect(impactItem!.description).toContain('downstream');
      expect(impactItem!.required).toBe(true);
    });

    it('includes policy verification when canonical nodes are present', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'canonical' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const policyItem = result.verification_checklist.find((v) => v.source === 'policy');
      expect(policyItem).toBeDefined();
      expect(policyItem!.description).toContain('provenance');
      expect(policyItem!.required).toBe(true);
    });

    it('includes test-coverage verification when relevant files exist', async () => {
      const nodes = [makeNode({ id: 'n1', source_file: 'src/service.ts' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const testItem = result.verification_checklist.find((v) => v.source === 'test-coverage');
      expect(testItem).toBeDefined();
      expect(testItem!.description).toContain('tests');
      expect(testItem!.command).toBe('npm test');
      expect(testItem!.relatedFiles).toContain('src/service.ts');
    });

    it('does not include impact verification when no downstream edges', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const impactItem = result.verification_checklist.find((v) => v.source === 'impact');
      expect(impactItem).toBeUndefined();
    });

    it('all checklist items have required fields', async () => {
      const nodes = [
        makeNode({ id: 'n1', graph_kind: 'canonical', source_file: 'src/a.ts' }),
        makeNode({ id: 'n2' }),
      ];
      const edges = [makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n2' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      for (const item of result.verification_checklist) {
        expect(item.id).toBeTruthy();
        expect(item.source).toMatch(/^(impact|policy|preset|test-coverage|manual|drift)$/);
        expect(typeof item.required).toBe('boolean');
        expect(item.description).toBeTruthy();
      }
    });
  });

  // ─── Forbidden Assumptions ─────────────────────────────────────────────────

  describe('forbidden assumptions', () => {
    it('includes exploratory reliability warning when exploratory edges present', async () => {
      const nodes = [
        makeNode({ id: 'n1' }),
        makeNode({ id: 'n2' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n2', graph_kind: 'exploratory' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const exploratoryAssumption = result.forbidden_assumptions.find(
        (a) => a.id === 'forbidden-exploratory-reliability',
      );
      expect(exploratoryAssumption).toBeDefined();
      expect(exploratoryAssumption!.severity).toBe('hard');
      expect(exploratoryAssumption!.description).toContain('exploratory');
    });

    it('includes exploratory reliability warning in mixed_safe mode', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Test',
        workspace: 'test-ws',
        mode: 'mixed_safe',
      });

      const exploratoryAssumption = result.forbidden_assumptions.find(
        (a) => a.id === 'forbidden-exploratory-reliability',
      );
      expect(exploratoryAssumption).toBeDefined();
    });

    it('always includes cross-workspace access forbidden assumption', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const crossWsAssumption = result.forbidden_assumptions.find(
        (a) => a.id === 'forbidden-cross-workspace-access',
      );
      expect(crossWsAssumption).toBeDefined();
      expect(crossWsAssumption!.severity).toBe('hard');
      expect(crossWsAssumption!.relatedPolicy).toBe('workspace-policy');
    });

    it('includes canonical modification warning when canonical nodes present', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'canonical' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const canonicalAssumption = result.forbidden_assumptions.find(
        (a) => a.id === 'forbidden-canonical-modification',
      );
      expect(canonicalAssumption).toBeDefined();
      expect(canonicalAssumption!.severity).toBe('hard');
      expect(canonicalAssumption!.relatedPolicy).toBe('authority-policy');
    });

    it('does not include canonical modification warning when no canonical nodes', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'exploratory' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const canonicalAssumption = result.forbidden_assumptions.find(
        (a) => a.id === 'forbidden-canonical-modification',
      );
      expect(canonicalAssumption).toBeUndefined();
    });

    it('does not include exploratory warning when no exploratory edges and authoritative mode', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'canonical' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      const exploratoryAssumption = result.forbidden_assumptions.find(
        (a) => a.id === 'forbidden-exploratory-reliability',
      );
      expect(exploratoryAssumption).toBeUndefined();
    });

    it('all forbidden assumptions have required fields', async () => {
      const nodes = [makeNode({ id: 'n1', graph_kind: 'canonical' })];
      const edges = [makeEdge({ id: 'e1', from_id: 'n1', to_id: 'n1', graph_kind: 'exploratory' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      for (const assumption of result.forbidden_assumptions) {
        expect(assumption.id).toBeTruthy();
        expect(assumption.severity).toMatch(/^(hard|soft)$/);
        expect(assumption.description).toBeTruthy();
        expect(assumption.reason).toBeTruthy();
      }
    });
  });

  // ─── Integration: empty arrays for insufficient context ────────────────────

  describe('empty context handling', () => {
    it('returns empty risks and checklist when no nodes available', async () => {
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes: [], edges: [] });

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      // Invariants are still present (system-level rules always apply)
      expect(result.invariants.length).toBeGreaterThan(0);
      // But risks and checklist are empty since there are no nodes to assess
      expect(result.risks).toEqual([]);
      expect(result.verification_checklist).toEqual([]);
      // Cross-workspace assumption is always present
      expect(result.forbidden_assumptions.some((a) => a.id === 'forbidden-cross-workspace-access')).toBe(true);
    });

    it('returns empty arrays for all fields on policy error', async () => {
      mockEngine.getVisibleGraph.mockRejectedValue(
        new Error('WORKSPACE_BOUNDARY_VIOLATION: foreign workspace'),
      );

      const result = await builder.build({ task: 'Test', workspace: 'test-ws' });

      // Error packages return empty arrays for everything
      expect(result.invariants).toEqual([]);
      expect(result.risks).toEqual([]);
      expect(result.verification_checklist).toEqual([]);
      expect(result.forbidden_assumptions).toEqual([]);
    });
  });
});
