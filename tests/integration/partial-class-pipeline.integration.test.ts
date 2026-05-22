import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { GraphDB } from '../../src/storage/GraphDB.js';
import {
  mergePartialClasses,
  materializeContainsEdges,
  buildDerivedGraph,
} from '../../src/pipeline/stages/05b_build_derived.js';
import type { GraphNode, GraphEdge } from '../../src/core/types.js';

/**
 * Integration tests for partial class pipeline end-to-end (Task 9.1)
 *
 * Tests the full pipeline flow including:
 * - Method node extraction → DB persistence
 * - get_neighbors traversal on virtual_class nodes
 * - Impact analysis including method nodes
 * - Authoritative mode filtering of derived artifacts
 * - Incremental rebuild after fragment removal
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

function sid(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

const WORKSPACE = 'integration-test-ws';
const PROJECT = 'backend';
const TIMESTAMP = '2025-01-01T00:00:00.000Z';

const PROVENANCE_CANONICAL = {
  source: 'parser' as const,
  artifact_source: 'fixture',
  producer_stage: 'extract',
  timestamp: TIMESTAMP,
};

/**
 * Helper: creates a canonical csharp_class fragment node for a partial class.
 */
function makeFragmentNode(
  className: string,
  sourceFile: string,
  namespace?: string,
): GraphNode {
  const nodeId = `node:${sid(WORKSPACE, PROJECT, sourceFile, className)}`;
  return {
    id: nodeId,
    stableKey: nodeId,
    workspace: WORKSPACE,
    project: PROJECT,
    type: 'csharp_class',
    label: className,
    symbol: className,
    source_file: sourceFile,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: PROVENANCE_CANONICAL,
    lang_meta: {
      isPartial: true,
      ...(namespace ? { namespace } : {}),
    },
    updated_at: TIMESTAMP,
  };
}

/**
 * Helper: creates a canonical csharp_method node.
 */
function makeMethodNode(
  className: string,
  methodName: string,
  sourceFile: string,
): GraphNode {
  const symbol = `${className}.${methodName}`;
  const nodeId = `node:${sid(WORKSPACE, PROJECT, sourceFile, symbol)}`;
  return {
    id: nodeId,
    stableKey: nodeId,
    workspace: WORKSPACE,
    project: PROJECT,
    type: 'csharp_method',
    label: methodName,
    symbol,
    source_file: sourceFile,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: PROVENANCE_CANONICAL,
    lang_meta: {
      containingClass: className,
      returnType: 'void',
      parameters: 'string id',
      sourceFile,
      isPartialClass: true,
    },
    updated_at: TIMESTAMP,
  };
}

describe('Partial class pipeline integration', () => {
  let db: GraphDB;

  beforeEach(() => {
    db = new GraphDB(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('Full pipeline run with extract_partial_methods: true produces method nodes in DB', () => {
    it('method nodes are persisted and queryable after buildDerivedGraph', async () => {
      // Seed canonical fragment nodes (simulating what stage 05a would produce)
      const frag1 = makeFragmentNode('OrderService', 'src/OrderService.cs', 'MyApp.Domain');
      const frag2 = makeFragmentNode('OrderService', 'src/OrderService.Methods.cs', 'MyApp.Domain');

      // Seed canonical method nodes (simulating CSharpAdapter output with extractPartialMethods=true)
      const method1 = makeMethodNode('OrderService', 'ProcessOrder', 'src/OrderService.cs');
      const method2 = makeMethodNode('OrderService', 'ValidateOrder', 'src/OrderService.Methods.cs');
      const method3 = makeMethodNode('OrderService', 'CancelOrder', 'src/OrderService.Methods.cs');

      // Insert canonical nodes into DB (simulating stage 05a)
      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);
      db.upsertNode(method2);
      db.upsertNode(method3);

      // Run buildDerivedGraph (simulating stage 05b)
      await buildDerivedGraph([], WORKSPACE, db);

      // Verify method nodes are still in DB
      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const methodNodes = allNodes.filter((n) => n.type === 'csharp_method');
      expect(methodNodes).toHaveLength(3);

      // Verify each method node has correct metadata
      for (const method of methodNodes) {
        expect(method.graph_kind).toBe('canonical');
        expect(method.lang_meta?.containingClass).toBe('OrderService');
        expect(method.lang_meta?.isPartialClass).toBe(true);
      }

      // Verify virtual_class node was created
      const virtualNodes = allNodes.filter((n) => n.type === 'virtual_class');
      expect(virtualNodes).toHaveLength(1);
      expect(virtualNodes[0]!.label).toBe('OrderService');

      // Verify contains edges were created for methods
      const allEdges = db.getEdgesByWorkspace(WORKSPACE);
      const containsEdges = allEdges.filter((e) => e.type === 'contains');
      expect(containsEdges).toHaveLength(3);

      // Each contains edge should point from virtual_class to a method
      for (const edge of containsEdges) {
        expect(edge.from_id).toBe(virtualNodes[0]!.id);
        expect(edge.graph_kind).toBe('derived');
      }
    });

    it('method nodes have correct lang_meta fields after full pipeline', async () => {
      const frag = makeFragmentNode('UserService', 'src/UserService.cs', 'MyApp.Users');
      const frag2 = makeFragmentNode('UserService', 'src/UserService.Queries.cs', 'MyApp.Users');
      const method = makeMethodNode('UserService', 'GetUser', 'src/UserService.cs');

      db.upsertNode(frag);
      db.upsertNode(frag2);
      db.upsertNode(method);

      await buildDerivedGraph([], WORKSPACE, db);

      const retrieved = db.getNode(method.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.type).toBe('csharp_method');
      expect(retrieved!.lang_meta?.containingClass).toBe('UserService');
      expect(retrieved!.lang_meta?.returnType).toBe('void');
      expect(retrieved!.lang_meta?.parameters).toBe('string id');
      expect(retrieved!.lang_meta?.sourceFile).toBe('src/UserService.cs');
    });
  });

  describe('get_neighbors on virtual_class returns all fragments and methods', () => {
    it('edges from virtual_class reach all fragments via is_partial_of', async () => {
      const frag1 = makeFragmentNode('PaymentService', 'src/PaymentService.cs', 'MyApp.Payments');
      const frag2 = makeFragmentNode('PaymentService', 'src/PaymentService.Handlers.cs', 'MyApp.Payments');
      const frag3 = makeFragmentNode('PaymentService', 'src/PaymentService.Validators.cs', 'MyApp.Payments');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(frag3);

      await buildDerivedGraph([], WORKSPACE, db);

      // Find the virtual_class node
      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const virtualNode = allNodes.find((n) => n.type === 'virtual_class' && n.label === 'PaymentService');
      expect(virtualNode).toBeDefined();

      // Get edges TO the virtual_class (is_partial_of edges point fragment → virtual_class)
      const edgesToVirtual = db.getEdgesTo(virtualNode!.id);
      const isPartialOfEdges = edgesToVirtual.filter((e) => e.type === 'is_partial_of');

      // Should have 3 is_partial_of edges (one per fragment)
      expect(isPartialOfEdges).toHaveLength(3);

      // Verify each fragment is connected
      const fragmentIds = new Set([frag1.id, frag2.id, frag3.id]);
      for (const edge of isPartialOfEdges) {
        expect(fragmentIds.has(edge.from_id)).toBe(true);
        expect(edge.to_id).toBe(virtualNode!.id);
      }
    });

    it('edges from virtual_class reach all methods via contains', async () => {
      const frag1 = makeFragmentNode('CartService', 'src/CartService.cs', 'MyApp.Cart');
      const frag2 = makeFragmentNode('CartService', 'src/CartService.Operations.cs', 'MyApp.Cart');

      const method1 = makeMethodNode('CartService', 'AddItem', 'src/CartService.cs');
      const method2 = makeMethodNode('CartService', 'RemoveItem', 'src/CartService.Operations.cs');
      const method3 = makeMethodNode('CartService', 'GetTotal', 'src/CartService.Operations.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);
      db.upsertNode(method2);
      db.upsertNode(method3);

      await buildDerivedGraph([], WORKSPACE, db);

      // Find the virtual_class node
      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const virtualNode = allNodes.find((n) => n.type === 'virtual_class' && n.label === 'CartService');
      expect(virtualNode).toBeDefined();

      // Get edges FROM the virtual_class (contains edges point virtual_class → method)
      const edgesFromVirtual = db.getEdgesFrom(virtualNode!.id);
      const containsEdges = edgesFromVirtual.filter((e) => e.type === 'contains');

      // Should have 3 contains edges (one per method)
      expect(containsEdges).toHaveLength(3);

      // Verify each method is connected
      const methodIds = new Set([method1.id, method2.id, method3.id]);
      for (const edge of containsEdges) {
        expect(edge.from_id).toBe(virtualNode!.id);
        expect(methodIds.has(edge.to_id)).toBe(true);
      }
    });

    it('from virtual_class, both fragments and methods are reachable', async () => {
      const frag1 = makeFragmentNode('NotifyService', 'src/NotifyService.cs', 'MyApp.Notify');
      const frag2 = makeFragmentNode('NotifyService', 'src/NotifyService.Email.cs', 'MyApp.Notify');

      const method1 = makeMethodNode('NotifyService', 'SendEmail', 'src/NotifyService.Email.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);

      await buildDerivedGraph([], WORKSPACE, db);

      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const virtualNode = allNodes.find((n) => n.type === 'virtual_class' && n.label === 'NotifyService');
      expect(virtualNode).toBeDefined();

      // Collect all neighbor node IDs reachable from virtual_class
      const edgesFrom = db.getEdgesFrom(virtualNode!.id); // contains edges
      const edgesTo = db.getEdgesTo(virtualNode!.id); // is_partial_of edges

      const reachableNodeIds = new Set([
        ...edgesFrom.map((e) => e.to_id),
        ...edgesTo.map((e) => e.from_id),
      ]);

      // Should reach both fragments and the method
      expect(reachableNodeIds.has(frag1.id)).toBe(true);
      expect(reachableNodeIds.has(frag2.id)).toBe(true);
      expect(reachableNodeIds.has(method1.id)).toBe(true);
    });
  });

  describe('Impact analysis on partial class file includes method nodes', () => {
    it('method nodes from a partial class file are reachable via contains edges', async () => {
      const frag1 = makeFragmentNode('InvoiceService', 'src/InvoiceService.cs', 'MyApp.Billing');
      const frag2 = makeFragmentNode('InvoiceService', 'src/InvoiceService.Calc.cs', 'MyApp.Billing');

      const method1 = makeMethodNode('InvoiceService', 'Calculate', 'src/InvoiceService.Calc.cs');
      const method2 = makeMethodNode('InvoiceService', 'GeneratePdf', 'src/InvoiceService.Calc.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);
      db.upsertNode(method2);

      await buildDerivedGraph([], WORKSPACE, db);

      // Simulate impact analysis: find all nodes related to a file change
      // When a file changes, we find nodes in that file and traverse edges
      const changedFile = 'src/InvoiceService.Calc.cs';

      // Find all nodes in the changed file
      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const nodesInFile = allNodes.filter((n) => n.source_file === changedFile);

      // Should include the fragment and both methods
      const nodeTypes = nodesInFile.map((n) => n.type).sort();
      expect(nodeTypes).toContain('csharp_class');
      expect(nodeTypes).toContain('csharp_method');

      // Method nodes from the file should be in the blast radius
      const methodNodesInFile = nodesInFile.filter((n) => n.type === 'csharp_method');
      expect(methodNodesInFile).toHaveLength(2);
      expect(methodNodesInFile.map((n) => n.label).sort()).toEqual(['Calculate', 'GeneratePdf']);

      // The methods are connected to the virtual_class via contains edges
      const virtualNode = allNodes.find((n) => n.type === 'virtual_class' && n.label === 'InvoiceService');
      expect(virtualNode).toBeDefined();

      // Traversing from the fragment in the changed file should reach the virtual_class
      const fragInFile = nodesInFile.find((n) => n.type === 'csharp_class');
      expect(fragInFile).toBeDefined();

      const edgesFromFrag = db.getEdgesFrom(fragInFile!.id);
      const isPartialOfEdge = edgesFromFrag.find((e) => e.type === 'is_partial_of');
      expect(isPartialOfEdge).toBeDefined();
      expect(isPartialOfEdge!.to_id).toBe(virtualNode!.id);

      // From virtual_class, we can reach all methods (including those in other files)
      const edgesFromVirtual = db.getEdgesFrom(virtualNode!.id);
      const containsEdges = edgesFromVirtual.filter((e) => e.type === 'contains');
      expect(containsEdges).toHaveLength(2);
    });

    it('method nodes declared in a file are included when querying by source_file', async () => {
      const frag1 = makeFragmentNode('ReportService', 'src/ReportService.cs', 'MyApp.Reports');
      const frag2 = makeFragmentNode('ReportService', 'src/ReportService.Export.cs', 'MyApp.Reports');

      const method1 = makeMethodNode('ReportService', 'ExportCsv', 'src/ReportService.Export.cs');
      const method2 = makeMethodNode('ReportService', 'ExportPdf', 'src/ReportService.Export.cs');
      const method3 = makeMethodNode('ReportService', 'Generate', 'src/ReportService.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);
      db.upsertNode(method2);
      db.upsertNode(method3);

      await buildDerivedGraph([], WORKSPACE, db);

      // Query all nodes for a specific file
      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const exportFileNodes = allNodes.filter((n) => n.source_file === 'src/ReportService.Export.cs');

      // Should include the fragment + 2 methods from that file
      expect(exportFileNodes).toHaveLength(3);
      expect(exportFileNodes.filter((n) => n.type === 'csharp_method')).toHaveLength(2);
      expect(exportFileNodes.filter((n) => n.type === 'csharp_class')).toHaveLength(1);
    });
  });

  describe('Authoritative mode excludes virtual_class and is_partial_of from results', () => {
    it('virtual_class nodes have graph_kind=derived', async () => {
      const frag1 = makeFragmentNode('AuthService', 'src/AuthService.cs', 'MyApp.Auth');
      const frag2 = makeFragmentNode('AuthService', 'src/AuthService.OAuth.cs', 'MyApp.Auth');

      db.upsertNode(frag1);
      db.upsertNode(frag2);

      await buildDerivedGraph([], WORKSPACE, db);

      const allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      const virtualNodes = allNodes.filter((n) => n.type === 'virtual_class');

      expect(virtualNodes).toHaveLength(1);
      expect(virtualNodes[0]!.graph_kind).toBe('derived');
      expect(virtualNodes[0]!.confidence_band).toBe('INFERRED');
      expect(virtualNodes[0]!.trust_level).toBe('DERIVED');
    });

    it('is_partial_of edges have graph_kind=derived', async () => {
      const frag1 = makeFragmentNode('CacheService', 'src/CacheService.cs', 'MyApp.Cache');
      const frag2 = makeFragmentNode('CacheService', 'src/CacheService.Redis.cs', 'MyApp.Cache');

      db.upsertNode(frag1);
      db.upsertNode(frag2);

      await buildDerivedGraph([], WORKSPACE, db);

      const allEdges = db.getEdgesByWorkspace(WORKSPACE);
      const isPartialOfEdges = allEdges.filter((e) => e.type === 'is_partial_of');

      expect(isPartialOfEdges.length).toBeGreaterThan(0);
      for (const edge of isPartialOfEdges) {
        expect(edge.graph_kind).toBe('derived');
        expect(edge.confidence_band).toBe('INFERRED');
      }
    });

    it('filtering by graph_kind=canonical excludes virtual_class nodes', async () => {
      const frag1 = makeFragmentNode('SearchService', 'src/SearchService.cs', 'MyApp.Search');
      const frag2 = makeFragmentNode('SearchService', 'src/SearchService.Index.cs', 'MyApp.Search');
      const method1 = makeMethodNode('SearchService', 'Search', 'src/SearchService.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);

      await buildDerivedGraph([], WORKSPACE, db);

      // getNodesByWorkspace with 'canonical' graph_kind should exclude virtual_class
      const canonicalNodes = db.getNodesByWorkspace(WORKSPACE, 'canonical');
      const virtualInCanonical = canonicalNodes.filter((n) => n.type === 'virtual_class');
      expect(virtualInCanonical).toHaveLength(0);

      // But canonical nodes (fragments and methods) should be present
      const fragments = canonicalNodes.filter((n) => n.type === 'csharp_class');
      const methods = canonicalNodes.filter((n) => n.type === 'csharp_method');
      expect(fragments).toHaveLength(2);
      expect(methods).toHaveLength(1);
    });

    it('filtering by graph_kind=canonical excludes is_partial_of and derived contains edges', async () => {
      const frag1 = makeFragmentNode('LogService', 'src/LogService.cs', 'MyApp.Logging');
      const frag2 = makeFragmentNode('LogService', 'src/LogService.File.cs', 'MyApp.Logging');
      const method1 = makeMethodNode('LogService', 'LogInfo', 'src/LogService.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);

      await buildDerivedGraph([], WORKSPACE, db);

      // All edges in workspace
      const allEdges = db.getEdgesByWorkspace(WORKSPACE);

      // Simulating authoritative mode: filter to only canonical edges
      const canonicalEdges = allEdges.filter((e) => e.graph_kind === 'canonical');
      const derivedEdges = allEdges.filter((e) => e.graph_kind === 'derived');

      // is_partial_of and contains edges should all be derived
      const isPartialOf = allEdges.filter((e) => e.type === 'is_partial_of');
      const contains = allEdges.filter((e) => e.type === 'contains');

      for (const edge of isPartialOf) {
        expect(edge.graph_kind).toBe('derived');
      }
      for (const edge of contains) {
        expect(edge.graph_kind).toBe('derived');
      }

      // In authoritative mode, these edges would be excluded
      expect(canonicalEdges.filter((e) => e.type === 'is_partial_of')).toHaveLength(0);
      expect(canonicalEdges.filter((e) => e.type === 'contains')).toHaveLength(0);

      // Derived edges should include both is_partial_of and contains
      expect(derivedEdges.filter((e) => e.type === 'is_partial_of').length).toBeGreaterThan(0);
      expect(derivedEdges.filter((e) => e.type === 'contains').length).toBeGreaterThan(0);
    });
  });

  describe('Incremental rebuild after fragment removal removes stale virtual_class', () => {
    it('removing a fragment so group drops below 2 removes virtual_class on rebuild', async () => {
      // Initial state: 2 fragments → virtual_class is created
      const frag1 = makeFragmentNode('EventBus', 'src/EventBus.cs', 'MyApp.Events');
      const frag2 = makeFragmentNode('EventBus', 'src/EventBus.Handlers.cs', 'MyApp.Events');

      db.upsertNode(frag1);
      db.upsertNode(frag2);

      await buildDerivedGraph([], WORKSPACE, db);

      // Verify virtual_class exists after first build
      let allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      let virtualNodes = allNodes.filter((n) => n.type === 'virtual_class');
      expect(virtualNodes).toHaveLength(1);
      expect(virtualNodes[0]!.label).toBe('EventBus');

      let allEdges = db.getEdgesByWorkspace(WORKSPACE);
      let isPartialOfEdges = allEdges.filter((e) => e.type === 'is_partial_of');
      expect(isPartialOfEdges).toHaveLength(2);

      // Simulate fragment removal: delete one fragment from DB
      // (In real pipeline, this happens when a file is deleted and canonical nodes are removed)
      db.deleteDataForSourceFile(WORKSPACE, PROJECT, 'src/EventBus.Handlers.cs');

      // Run buildDerivedGraph again (incremental rebuild)
      await buildDerivedGraph([], WORKSPACE, db);

      // Verify virtual_class is removed (only 1 fragment remains → no merge)
      allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      virtualNodes = allNodes.filter((n) => n.type === 'virtual_class');
      expect(virtualNodes).toHaveLength(0);

      // Verify is_partial_of edges are also removed
      allEdges = db.getEdgesByWorkspace(WORKSPACE);
      isPartialOfEdges = allEdges.filter((e) => e.type === 'is_partial_of');
      expect(isPartialOfEdges).toHaveLength(0);
    });

    it('adding a third fragment and rebuilding updates virtual_class metadata', async () => {
      // Initial state: 2 fragments
      const frag1 = makeFragmentNode('Scheduler', 'src/Scheduler.cs', 'MyApp.Jobs');
      const frag2 = makeFragmentNode('Scheduler', 'src/Scheduler.Cron.cs', 'MyApp.Jobs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);

      await buildDerivedGraph([], WORKSPACE, db);

      let allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      let virtualNode = allNodes.find((n) => n.type === 'virtual_class' && n.label === 'Scheduler');
      expect(virtualNode).toBeDefined();
      expect(virtualNode!.lang_meta?.fragmentCount).toBe(2);

      // Add a third fragment
      const frag3 = makeFragmentNode('Scheduler', 'src/Scheduler.Retry.cs', 'MyApp.Jobs');
      db.upsertNode(frag3);

      // Rebuild
      await buildDerivedGraph([], WORKSPACE, db);

      // Verify virtual_class is updated with new fragment count
      allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      virtualNode = allNodes.find((n) => n.type === 'virtual_class' && n.label === 'Scheduler');
      expect(virtualNode).toBeDefined();
      expect(virtualNode!.lang_meta?.fragmentCount).toBe(3);

      // Verify mergedFrom includes all 3 fragment IDs
      const mergedFrom = virtualNode!.lang_meta?.mergedFrom as string[];
      expect(mergedFrom).toHaveLength(3);
      expect(mergedFrom).toContain(frag1.id);
      expect(mergedFrom).toContain(frag2.id);
      expect(mergedFrom).toContain(frag3.id);

      // Verify 3 is_partial_of edges
      const allEdges = db.getEdgesByWorkspace(WORKSPACE);
      const isPartialOfEdges = allEdges.filter((e) => e.type === 'is_partial_of');
      expect(isPartialOfEdges).toHaveLength(3);
    });

    it('rebuild is idempotent — running twice produces same results', async () => {
      const frag1 = makeFragmentNode('QueueService', 'src/QueueService.cs', 'MyApp.Queue');
      const frag2 = makeFragmentNode('QueueService', 'src/QueueService.Worker.cs', 'MyApp.Queue');
      const method1 = makeMethodNode('QueueService', 'Enqueue', 'src/QueueService.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);

      // First build
      await buildDerivedGraph([], WORKSPACE, db);

      const nodesAfterFirst = db.getAllNodesByWorkspace(WORKSPACE);
      const edgesAfterFirst = db.getEdgesByWorkspace(WORKSPACE);

      // Second build (same canonical data)
      await buildDerivedGraph([], WORKSPACE, db);

      const nodesAfterSecond = db.getAllNodesByWorkspace(WORKSPACE);
      const edgesAfterSecond = db.getEdgesByWorkspace(WORKSPACE);

      // Same number of nodes and edges
      expect(nodesAfterSecond).toHaveLength(nodesAfterFirst.length);
      expect(edgesAfterSecond).toHaveLength(edgesAfterFirst.length);

      // Same node IDs
      const nodeIdsFirst = nodesAfterFirst.map((n) => n.id).sort();
      const nodeIdsSecond = nodesAfterSecond.map((n) => n.id).sort();
      expect(nodeIdsSecond).toEqual(nodeIdsFirst);

      // Same edge IDs
      const edgeIdsFirst = edgesAfterFirst.map((e) => e.id).sort();
      const edgeIdsSecond = edgesAfterSecond.map((e) => e.id).sort();
      expect(edgeIdsSecond).toEqual(edgeIdsFirst);

      // No duplicate virtual_class nodes
      const virtualNodes = nodesAfterSecond.filter((n) => n.type === 'virtual_class');
      expect(virtualNodes).toHaveLength(1);
    });

    it('removing all fragments removes all derived artifacts', async () => {
      const frag1 = makeFragmentNode('TempService', 'src/TempService.cs', 'MyApp.Temp');
      const frag2 = makeFragmentNode('TempService', 'src/TempService.Cleanup.cs', 'MyApp.Temp');
      const method1 = makeMethodNode('TempService', 'Cleanup', 'src/TempService.Cleanup.cs');

      db.upsertNode(frag1);
      db.upsertNode(frag2);
      db.upsertNode(method1);

      await buildDerivedGraph([], WORKSPACE, db);

      // Verify derived artifacts exist
      let allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      expect(allNodes.filter((n) => n.type === 'virtual_class')).toHaveLength(1);

      let allEdges = db.getEdgesByWorkspace(WORKSPACE);
      expect(allEdges.filter((e) => e.type === 'is_partial_of').length).toBeGreaterThan(0);
      expect(allEdges.filter((e) => e.type === 'contains').length).toBeGreaterThan(0);

      // Remove all canonical nodes (simulating full project deletion)
      db.deleteDataForSourceFile(WORKSPACE, PROJECT, 'src/TempService.cs');
      db.deleteDataForSourceFile(WORKSPACE, PROJECT, 'src/TempService.Cleanup.cs');

      // Rebuild
      await buildDerivedGraph([], WORKSPACE, db);

      // All derived artifacts should be gone
      allNodes = db.getAllNodesByWorkspace(WORKSPACE);
      expect(allNodes.filter((n) => n.type === 'virtual_class')).toHaveLength(0);

      allEdges = db.getEdgesByWorkspace(WORKSPACE);
      expect(allEdges.filter((e) => e.type === 'is_partial_of')).toHaveLength(0);
      expect(allEdges.filter((e) => e.type === 'contains')).toHaveLength(0);
    });
  });
});
