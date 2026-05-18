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

describe('AgentContextBuilder', () => {
  let builder: AgentContextBuilder;
  let mockEngine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    mockEngine = createMockEngine([], []);
    builder = new AgentContextBuilder(() => mockEngine);
  });

  describe('deterministic ranking order', () => {
    it('ranks exact id/symbol match highest', async () => {
      const nodes = [
        makeNode({ id: 'domain-node', domain: 'orders' }),
        makeNode({ id: 'OrderService', symbol: 'OrderService' }),
        makeNode({ id: 'label-match', label: 'order handler' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Fix OrderService bug',
        workspace: 'test-ws',
      });

      // OrderService should be first (exact id/symbol match)
      expect(result.nodes[0]!.id).toBe('OrderService');
    });

    it('ranks exact label match second after id/symbol', async () => {
      const nodes = [
        makeNode({ id: 'some-id-1', label: 'order handler', domain: 'orders' }),
        makeNode({ id: 'some-id-2', label: 'unrelated', source_file: 'order.ts' }),
        makeNode({ id: 'some-id-3', label: 'other', domain: 'payments' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Fix the order handler',
        workspace: 'test-ws',
      });

      // "order handler" exact label match should be first
      expect(result.nodes[0]!.id).toBe('some-id-1');
    });

    it('ranks source file/route match third', async () => {
      const nodes = [
        makeNode({ id: 'node-a', label: 'unrelated-a', domain: 'orders' }),
        makeNode({ id: 'node-b', label: 'unrelated-b', source_file: 'src/orders/handler.ts' }),
        makeNode({ id: 'node-c', label: 'unrelated-c' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Update the handler logic',
        workspace: 'test-ws',
      });

      // source_file match for "handler" should rank before domain match
      expect(result.nodes[0]!.id).toBe('node-b');
    });

    it('ranks domain/project match fourth', async () => {
      const nodes = [
        makeNode({ id: 'node-a', label: 'unrelated-a', domain: 'payments' }),
        makeNode({ id: 'node-b', label: 'unrelated-b' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Fix payments integration',
        workspace: 'test-ws',
      });

      // domain match for "payments" should rank first
      expect(result.nodes[0]!.id).toBe('node-a');
    });

    it('uses lexicographic ordering as tie-breaker within same tier', async () => {
      const nodes = [
        makeNode({ id: 'z-node', label: 'unrelated-z' }),
        makeNode({ id: 'a-node', label: 'unrelated-a' }),
        makeNode({ id: 'm-node', label: 'unrelated-m' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Do something generic',
        workspace: 'test-ws',
      });

      // All in same tier (FTS_FALLBACK), should be sorted lexicographically
      expect(result.nodes.map((n) => n.id)).toEqual(['a-node', 'm-node', 'z-node']);
    });
  });

  describe('output limit enforcement and GRAPH_RESULT_TRUNCATED', () => {
    it('enforces default max 20 nodes limit', async () => {
      const nodes = Array.from({ length: 30 }, (_, i) =>
        makeNode({ id: `node-${String(i).padStart(3, '0')}` }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.nodes.length).toBe(20);
      expect(result.codes).toContain('GRAPH_RESULT_TRUNCATED');
      expect(result.status).toBe('partial');
    });

    it('enforces default max 40 edges limit', async () => {
      // Create 5 nodes and 50 edges between them
      const nodes = Array.from({ length: 5 }, (_, i) =>
        makeNode({ id: `node-${i}` }),
      );
      const edges = Array.from({ length: 50 }, (_, i) =>
        makeEdge({
          id: `edge-${i}`,
          from_id: `node-${i % 5}`,
          to_id: `node-${(i + 1) % 5}`,
        }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.edges.length).toBeLessThanOrEqual(40);
      expect(result.codes).toContain('GRAPH_RESULT_TRUNCATED');
    });

    it('respects custom per-request limits', async () => {
      const nodes = Array.from({ length: 15 }, (_, i) =>
        makeNode({ id: `node-${String(i).padStart(3, '0')}` }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
        limits: { maxNodes: 5 },
      });

      expect(result.nodes.length).toBe(5);
      expect(result.codes).toContain('GRAPH_RESULT_TRUNCATED');
    });

    it('does not emit GRAPH_RESULT_TRUNCATED when within limits', async () => {
      const nodes = Array.from({ length: 3 }, (_, i) =>
        makeNode({ id: `node-${i}` }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.nodes.length).toBe(3);
      expect(result.codes).not.toContain('GRAPH_RESULT_TRUNCATED');
      expect(result.status).toBe('ready');
    });
  });

  describe('default canonical_only mode', () => {
    it('defaults to authoritative (canonical_only) mode', async () => {
      const nodes = [makeNode({ id: 'test-node' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(mockEngine.getVisibleGraph).toHaveBeenCalledWith('ask', 'authoritative');
    });

    it('does not include EXPLORATORY_USED warning in canonical_only mode', async () => {
      const nodes = [makeNode({ id: 'test-node' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.warnings).not.toContain('EXPLORATORY_USED');
    });

    it('includes EXPLORATORY_USED warning when mixed_safe is explicitly requested', async () => {
      const nodes = [makeNode({ id: 'test-node', graph_kind: 'exploratory' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
        mode: 'mixed_safe',
      });

      expect(result.warnings).toContain('EXPLORATORY_USED');
      expect(result.codes).toContain('EXPLORATORY_USED');
    });
  });

  describe('status determination', () => {
    it('returns insufficient_context when no nodes are available', async () => {
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes: [], edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.status).toBe('insufficient_context');
      expect(result.codes).toContain('GRAPH_QUERY_INSUFFICIENT_CONTEXT');
    });

    it('returns policy_blocked on workspace boundary violation', async () => {
      mockEngine.getVisibleGraph.mockRejectedValue(
        new Error('WORKSPACE_BOUNDARY_VIOLATION: foreign workspace detected'),
      );

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.status).toBe('policy_blocked');
      expect(result.codes).toContain('POLICY_VIOLATION');
    });

    it('returns ready when nodes are within limits', async () => {
      const nodes = [makeNode({ id: 'test-node' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.status).toBe('ready');
    });

    it('returns partial when output is truncated', async () => {
      const nodes = Array.from({ length: 25 }, (_, i) =>
        makeNode({ id: `node-${String(i).padStart(3, '0')}` }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.status).toBe('partial');
    });
  });

  describe('AgentContextPackage structure', () => {
    it('includes all required fields', async () => {
      const nodes = [makeNode({ id: 'test-node', source_file: 'src/test.ts' })];
      const edges = [makeEdge({ id: 'e1', from_id: 'test-node', to_id: 'test-node' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({
        task: 'Test task',
        workspace: 'test-ws',
      });

      expect(result).toHaveProperty('workspaceId', 'test-ws');
      expect(result).toHaveProperty('task', 'Test task');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('relevantFiles');
      expect(result).toHaveProperty('invariants');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('verification_checklist');
      expect(result).toHaveProperty('forbidden_assumptions');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('codes');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('provenance');
    });

    it('extracts relevant files from nodes', async () => {
      const nodes = [
        makeNode({ id: 'n1', source_file: 'src/orders/handler.ts', label: 'handler' }),
        makeNode({ id: 'n2', source_file: 'src/orders/service.ts', label: 'service' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Fix orders',
        workspace: 'test-ws',
      });

      expect(result.relevantFiles.length).toBeGreaterThan(0);
      expect(result.relevantFiles.map((f) => f.filePath)).toContain('src/orders/handler.ts');
      expect(result.relevantFiles.map((f) => f.filePath)).toContain('src/orders/service.ts');
    });

    it('collects provenance from nodes and edges', async () => {
      const nodes = [makeNode({ id: 'n1' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      expect(result.provenance.length).toBeGreaterThan(0);
      expect(result.provenance[0]).toHaveProperty('source');
      expect(result.provenance[0]).toHaveProperty('artifact_source');
    });
  });

  describe('suggestion generation', () => {
    it('generates impact_analysis suggestion for entrypoint nodes', async () => {
      const nodes = [
        makeNode({ id: 'ep1', type: 'api_endpoint', label: 'POST /orders' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Check orders endpoint',
        workspace: 'test-ws',
      });

      const impactSuggestion = result.suggestions.find((s) => s.tool === 'impact_analysis');
      expect(impactSuggestion).toBeDefined();
      expect(impactSuggestion!.reason).toContain('entrypoint');
    });

    it('respects max suggestions limit', async () => {
      const nodes = [
        makeNode({ id: 'ep1', type: 'api_endpoint', label: 'POST /orders' }),
        makeNode({ id: 'fn1', type: 'function', symbol: 'createOrder' }),
      ];
      const edges = Array.from({ length: 10 }, (_, i) =>
        makeEdge({ id: `e${i}`, from_id: 'fn1', to_id: 'ep1' }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({
        task: 'Check orders',
        workspace: 'test-ws',
        limits: { maxSuggestions: 2 },
      });

      expect(result.suggestions.length).toBeLessThanOrEqual(2);
    });

    it('defaults to max 5 suggestions', async () => {
      const nodes = [
        makeNode({ id: 'ep1', type: 'api_endpoint', label: 'POST /orders' }),
        makeNode({ id: 'fn1', type: 'function', symbol: 'createOrder' }),
        makeNode({ id: 'fn2', type: 'method', symbol: 'validateOrder' }),
      ];
      const edges = Array.from({ length: 10 }, (_, i) =>
        makeEdge({ id: `e${i}`, from_id: nodes[i % 3]!.id, to_id: nodes[(i + 1) % 3]!.id }),
      );
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({
        task: 'Check orders',
        workspace: 'test-ws',
      });

      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('generates find_callers suggestion for callable nodes', async () => {
      const nodes = [
        makeNode({ id: 'fn1', type: 'function', symbol: 'processPayment' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Check payment processing',
        workspace: 'test-ws',
      });

      const callersSuggestion = result.suggestions.find((s) => s.tool === 'find_callers');
      expect(callersSuggestion).toBeDefined();
      expect(callersSuggestion!.reason).toContain('callable');
      expect(callersSuggestion!.args).toHaveProperty('symbols');
      expect((callersSuggestion!.args.symbols as string[])).toContain('processPayment');
    });

    it('generates blast_radius suggestion for high fan-out nodes', async () => {
      const nodes = [
        makeNode({ id: 'hub-node', type: 'function', symbol: 'orchestrate' }),
        makeNode({ id: 'target-1', type: 'function', symbol: 'step1' }),
        makeNode({ id: 'target-2', type: 'function', symbol: 'step2' }),
        makeNode({ id: 'target-3', type: 'function', symbol: 'step3' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'hub-node', to_id: 'target-1' }),
        makeEdge({ id: 'e2', from_id: 'hub-node', to_id: 'target-2' }),
        makeEdge({ id: 'e3', from_id: 'hub-node', to_id: 'target-3' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({
        task: 'Check orchestration',
        workspace: 'test-ws',
      });

      const blastSuggestion = result.suggestions.find((s) => s.tool === 'blast_radius');
      expect(blastSuggestion).toBeDefined();
      expect(blastSuggestion!.reason).toContain('fan-out');
      expect(blastSuggestion!.args).toHaveProperty('nodeIds');
      expect((blastSuggestion!.args.nodeIds as string[])).toContain('hub-node');
    });

    it('does not generate suggestions when no graph evidence supports them (Req 10.6)', async () => {
      // Nodes that don't match any suggestion criteria:
      // - not entrypoints (no impact_analysis)
      // - not callable types (no find_callers)
      // - no high fan-out (no blast_radius)
      const nodes = [
        makeNode({ id: 'data-model', type: 'class', label: 'OrderDTO' }),
        makeNode({ id: 'config-node', type: 'module', label: 'AppConfig' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Review data models',
        workspace: 'test-ws',
      });

      // No suggestions should be generated — no graph evidence supports any tool suggestion
      expect(result.suggestions).toEqual([]);
    });

    it('includes only minimal required arguments derived from graph node IDs', async () => {
      const nodes = [
        makeNode({ id: 'ep1', type: 'api_endpoint', label: 'GET /users', symbol: 'getUsers' }),
        makeNode({ id: 'ep2', type: 'controller_action', label: 'POST /users', symbol: 'createUser' }),
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      const result = await builder.build({
        task: 'Check user endpoints',
        workspace: 'test-ws',
      });

      const impactSuggestion = result.suggestions.find((s) => s.tool === 'impact_analysis');
      expect(impactSuggestion).toBeDefined();
      // Args should contain nodeIds derived from actual graph nodes
      expect(impactSuggestion!.args.nodeIds).toEqual(['ep1', 'ep2']);
    });
  });

  describe('OperationResolver integration', () => {
    it('uses agent-context caller to resolve operation', async () => {
      const nodes = [makeNode({ id: 'test-node' })];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges: [] });

      await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      // The engine should be called with 'ask' operation (agent-context maps to 'ask')
      expect(mockEngine.getVisibleGraph).toHaveBeenCalledWith('ask', expect.any(String));
    });
  });

  describe('edge selection', () => {
    it('only includes edges connecting selected nodes', async () => {
      const nodes = [
        makeNode({ id: 'node-a' }),
        makeNode({ id: 'node-b' }),
        makeNode({ id: 'node-c' }),
      ];
      const edges = [
        makeEdge({ id: 'e1', from_id: 'node-a', to_id: 'node-b' }),
        makeEdge({ id: 'e2', from_id: 'node-b', to_id: 'node-c' }),
        makeEdge({ id: 'e3', from_id: 'node-a', to_id: 'external-node' }), // external node not in selected
      ];
      mockEngine.getVisibleGraph.mockResolvedValue({ nodes, edges });

      const result = await builder.build({
        task: 'Some task',
        workspace: 'test-ws',
      });

      // e3 should be excluded because 'external-node' is not in selected nodes
      expect(result.edges.map((e) => e.id)).toContain('e1');
      expect(result.edges.map((e) => e.id)).toContain('e2');
      expect(result.edges.map((e) => e.id)).not.toContain('e3');
    });
  });
});
