import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createHash } from 'node:crypto';
import { mergePartialClasses, materializeContainsEdges } from '../../src/pipeline/stages/05b_build_derived.js';
import type { GraphNode } from '../../src/core/types.js';

/** Helper: compute sid hash (same as in 05b_build_derived.ts) */
function sid(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

/** Arbitrary: valid C# identifier (PascalCase) */
const csharpIdentifierArb = fc
  .tuple(
    fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'),
    fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
  )
  .map(([first, rest]) => `${first}${rest}`);

/** Arbitrary: workspace ID */
const workspaceIdArb = fc.stringMatching(/^[a-z]{3,10}$/);

/** Arbitrary: project ID */
const projectIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,12}$/);

/** Arbitrary: first-level subdirectory name */
const subdirArb = fc.constantFrom('src', 'lib', 'domain', 'services', 'models', 'controllers');

/** Arbitrary: file name within the subdirectory */
const fileNameArb = fc
  .tuple(csharpIdentifierArb, fc.constantFrom('.cs', '.partial.cs', '.Methods.cs', '.Props.cs'))
  .map(([name, ext]) => `${name}${ext}`);

/**
 * Creates a fragment GraphNode for a partial class.
 */
function createFragmentNode(
  workspaceId: string,
  projectId: string,
  className: string,
  sourceFile: string,
  namespace: string | undefined,
  index: number,
): GraphNode {
  const nodeId = `node:${sid(workspaceId, projectId, sourceFile, className)}_${index}`;
  return {
    id: nodeId,
    stableKey: nodeId,
    workspace: workspaceId,
    project: projectId,
    type: 'csharp_class',
    label: className,
    symbol: className,
    source_file: sourceFile,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: sourceFile,
      producer_stage: 'extract',
      timestamp: new Date().toISOString(),
    },
    lang_meta: {
      isPartial: true,
      ...(namespace !== undefined ? { namespace } : {}),
    },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Creates a csharp_method GraphNode.
 */
function createMethodNode(
  workspaceId: string,
  projectId: string,
  className: string,
  methodName: string,
  sourceFile: string,
  index: number,
): GraphNode {
  const symbol = `${className}.${methodName}`;
  const nodeId = `node:${sid(workspaceId, projectId, sourceFile, symbol)}_method_${index}`;
  return {
    id: nodeId,
    stableKey: nodeId,
    workspace: workspaceId,
    project: projectId,
    type: 'csharp_method',
    label: methodName,
    symbol,
    source_file: sourceFile,
    graph_kind: 'canonical',
    confidence_band: 'AUTHORITATIVE',
    trust_level: 'AUTHORITATIVE',
    provenance: {
      source: 'parser',
      artifact_source: sourceFile,
      producer_stage: 'extract',
      timestamp: new Date().toISOString(),
    },
    lang_meta: {
      containingClass: className,
      returnType: 'void',
      parameters: '',
      sourceFile,
      isPartialClass: true,
    },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Feature: partial-class-support, Property 10: Contains edge resolution with priority tiers
 *
 * For any `csharp_method` node (where `node.type === 'csharp_method'`) with `lang_meta.containingClass` set,
 * `materializeContainsEdges` SHALL create exactly one `contains` edge where the source node is resolved by:
 * (1) the `virtual_class` node for that class name in the same `project` if one exists, else
 * (2) the `csharp_class` fragment whose `source_file` matches the method's `lang_meta.sourceFile`, else
 * (3) any `csharp_class` fragment with the same label in the same `project`.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.7**
 */
describe('Feature: partial-class-support, Property 10: Contains edge resolution with priority tiers', () => {
  /** Arbitrary: relative file path */
  const filePathArb = fc
    .tuple(
      fc.constantFrom('src', 'lib', 'domain', 'services'),
      csharpIdentifierArb,
      fc.constantFrom('.cs', '.partial.cs', '.Methods.cs'),
    )
    .map(([dir, name, ext]) => `${dir}/${name}${ext}`);

  /** Arbitrary: method name */
  const methodNameArb = fc
    .tuple(
      fc.constantFrom('Get', 'Set', 'Process', 'Handle', 'Create', 'Update', 'Delete', 'Find'),
      csharpIdentifierArb,
    )
    .map(([prefix, suffix]) => `${prefix}${suffix}`);

  /**
   * Creates a virtual_class node.
   */
  function createVirtualClassNode(
    workspaceId: string,
    projectId: string,
    className: string,
  ): GraphNode {
    const virtualId = `virtual_class:${sid(workspaceId, projectId, className)}`;
    return {
      id: virtualId,
      stableKey: virtualId,
      workspace: workspaceId,
      project: projectId,
      type: 'virtual_class',
      label: className,
      symbol: className,
      graph_kind: 'derived',
      confidence_band: 'INFERRED',
      trust_level: 'DERIVED',
      provenance: {
        source: 'analysis',
        artifact_source: 'cross-file-analysis',
        producer_stage: 'buildDerivedGraph',
        rule: 'partial-class-merge',
        timestamp: new Date().toISOString(),
      },
      lang_meta: {
        fragmentCount: 2,
        mergedFrom: [],
      },
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a minimal mock DB that returns the given nodes from getAllNodesByWorkspace.
   */
  function createMockDBForResolution(nodes: GraphNode[]) {
    return {
      getAllNodesByWorkspace(_workspace: string): GraphNode[] {
        return nodes;
      },
    } as any;
  }

  it('resolves to virtual_class when one exists for the class name in same project (Tier 1)', () => {
    fc.assert(
      fc.property(
        workspaceIdArb,
        projectIdArb,
        csharpIdentifierArb,
        methodNameArb,
        filePathArb,
        filePathArb,
        (workspaceId, projectId, className, methodName, methodFile, fragmentFile) => {
          const methodNode = createMethodNode(workspaceId, projectId, className, methodName, methodFile, 0);
          const virtualNode = createVirtualClassNode(workspaceId, projectId, className);
          // Also include a fragment that matches by source_file — virtual_class should still win
          const fragmentNode = createFragmentNode(workspaceId, projectId, className, methodFile, undefined, 0);

          const db = createMockDBForResolution([methodNode, virtualNode, fragmentNode]);
          const result = materializeContainsEdges(workspaceId, db);

          // Exactly one contains edge per method node
          expect(result.edges).toHaveLength(1);

          const edge = result.edges[0]!;
          expect(edge.type).toBe('contains');
          // from_id should be the virtual_class node (Tier 1 priority)
          expect(edge.from_id).toBe(virtualNode.id);
          expect(edge.to_id).toBe(methodNode.id);
          // No warnings
          expect(result.warnings).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('resolves to csharp_class fragment matching by source_file when no virtual_class exists (Tier 2)', () => {
    fc.assert(
      fc.property(
        workspaceIdArb,
        projectIdArb,
        csharpIdentifierArb,
        methodNameArb,
        filePathArb,
        filePathArb,
        (workspaceId, projectId, className, methodName, methodFile, otherFile) => {
          // Ensure otherFile is different from methodFile for the non-matching fragment
          const distinctOtherFile = otherFile === methodFile ? `other/${otherFile}` : otherFile;

          const methodNode = createMethodNode(workspaceId, projectId, className, methodName, methodFile, 0);
          // Fragment that matches by source_file
          const matchingFragment = createFragmentNode(workspaceId, projectId, className, methodFile, undefined, 0);
          // Fragment that does NOT match by source_file (same label, different file)
          const otherFragment = createFragmentNode(workspaceId, projectId, className, distinctOtherFile, undefined, 1);

          // No virtual_class node present
          const db = createMockDBForResolution([methodNode, matchingFragment, otherFragment]);
          const result = materializeContainsEdges(workspaceId, db);

          // Exactly one contains edge
          expect(result.edges).toHaveLength(1);

          const edge = result.edges[0]!;
          expect(edge.type).toBe('contains');
          // from_id should be the fragment matching by source_file (Tier 2)
          expect(edge.from_id).toBe(matchingFragment.id);
          expect(edge.to_id).toBe(methodNode.id);
          expect(result.warnings).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('resolves to any csharp_class fragment with same label when no virtual_class and no source_file match (Tier 3)', () => {
    fc.assert(
      fc.property(
        workspaceIdArb,
        projectIdArb,
        csharpIdentifierArb,
        methodNameArb,
        filePathArb,
        filePathArb,
        (workspaceId, projectId, className, methodName, methodFile, fragmentFile) => {
          // Ensure fragment file is different from method file so Tier 2 doesn't match
          const distinctFragmentFile = fragmentFile === methodFile ? `alt/${fragmentFile}` : fragmentFile;

          const methodNode = createMethodNode(workspaceId, projectId, className, methodName, methodFile, 0);
          // Fragment with same label but different source_file
          const fragmentNode = createFragmentNode(workspaceId, projectId, className, distinctFragmentFile, undefined, 0);

          // No virtual_class, no source_file match — should fall back to label match (Tier 3)
          const db = createMockDBForResolution([methodNode, fragmentNode]);
          const result = materializeContainsEdges(workspaceId, db);

          // Exactly one contains edge
          expect(result.edges).toHaveLength(1);

          const edge = result.edges[0]!;
          expect(edge.type).toBe('contains');
          // from_id should be the fragment matched by label (Tier 3)
          expect(edge.from_id).toBe(fragmentNode.id);
          expect(edge.to_id).toBe(methodNode.id);
          expect(result.warnings).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('emits warning and creates no edge when no matching class node exists', () => {
    fc.assert(
      fc.property(
        workspaceIdArb,
        projectIdArb,
        csharpIdentifierArb,
        csharpIdentifierArb,
        methodNameArb,
        filePathArb,
        (workspaceId, projectId, className, otherClassName, methodName, methodFile) => {
          // Ensure the class names are different so there's no match
          const distinctOtherClass = otherClassName === className ? `${className}X` : otherClassName;

          const methodNode = createMethodNode(workspaceId, projectId, className, methodName, methodFile, 0);
          // Fragment with a DIFFERENT class name — should not match
          const unrelatedFragment = createFragmentNode(workspaceId, projectId, distinctOtherClass, methodFile, undefined, 0);

          const db = createMockDBForResolution([methodNode, unrelatedFragment]);
          const result = materializeContainsEdges(workspaceId, db);

          // No edge should be created
          expect(result.edges).toHaveLength(0);
          // Warning should be emitted
          expect(result.warnings).toHaveLength(1);
          expect(result.warnings[0]).toContain('CONTAINS_EDGE_UNRESOLVED');
          expect(result.warnings[0]).toContain(className);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('creates exactly one contains edge per method node regardless of available class nodes', () => {
    fc.assert(
      fc.property(
        workspaceIdArb,
        projectIdArb,
        csharpIdentifierArb,
        fc.array(
          fc.tuple(
            fc.constantFrom('Get', 'Set', 'Process', 'Handle', 'Create', 'Update', 'Delete', 'Find'),
            csharpIdentifierArb,
          ).map(([prefix, suffix]) => `${prefix}${suffix}`),
          { minLength: 1, maxLength: 4 },
        ),
        filePathArb,
        fc.array(filePathArb, { minLength: 1, maxLength: 3 }),
        (workspaceId, projectId, className, methodNames, methodFile, fragmentFiles) => {
          // Deduplicate method names by appending index
          const uniqueMethodNames = methodNames.map((name, i) =>
            methodNames.indexOf(name) === i ? name : `${name}${i}`,
          );

          // Create method nodes — all in the same class
          const methodNodes = uniqueMethodNames.map((name, i) =>
            createMethodNode(workspaceId, projectId, className, name, methodFile, i),
          );

          // Create a virtual_class node
          const virtualNode = createVirtualClassNode(workspaceId, projectId, className);

          // Create multiple fragment nodes
          const fragmentNodes = fragmentFiles.map((file, i) =>
            createFragmentNode(workspaceId, projectId, className, file, undefined, i),
          );

          const allNodes = [...methodNodes, virtualNode, ...fragmentNodes];
          const db = createMockDBForResolution(allNodes);
          const result = materializeContainsEdges(workspaceId, db);

          // Exactly one edge per method node
          expect(result.edges).toHaveLength(methodNodes.length);

          // Each method should have exactly one edge pointing to it
          const toIds = result.edges.map((e) => e.to_id);
          for (const method of methodNodes) {
            expect(toIds.filter((id) => id === method.id)).toHaveLength(1);
          }

          // All edges should come from the virtual_class (Tier 1 priority)
          for (const edge of result.edges) {
            expect(edge.from_id).toBe(virtualNode.id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: partial-class-support, Property 11: Trust metadata on derived artifacts
 *
 * For any `virtual_class` node produced by `mergePartialClasses`, `confidence_band` SHALL be
 * `'INFERRED'` and `graph_kind` SHALL be `'derived'`.
 * For any `is_partial_of` edge, `graph_kind` SHALL be `'derived'`.
 * For any `contains` edge produced by `materializeContainsEdges`, `graph_kind` SHALL be `'derived'`.
 *
 * **Validates: Requirements 8.3, 8.4, 8.5**
 */
describe('Feature: partial-class-support, Property 11: Trust metadata on derived artifacts', () => {
  /**
   * Generates a scenario with 2-4 fragment nodes and 1-3 method nodes per class,
   * all in the same project and first-level subdirectory.
   */
  const scenarioArb = fc.tuple(
    workspaceIdArb,
    projectIdArb,
    csharpIdentifierArb, // className
    subdirArb,
    fc.integer({ min: 2, max: 4 }), // fragment count
    fc.integer({ min: 1, max: 3 }), // methods per fragment
  ).chain(([workspaceId, projectId, className, subdir, fragmentCount, methodsPerFragment]) =>
    fc.tuple(
      fc.constant(workspaceId),
      fc.constant(projectId),
      fc.constant(className),
      fc.constant(subdir),
      fc.constant(fragmentCount),
      fc.constant(methodsPerFragment),
      // Generate unique file names for each fragment
      fc.array(fileNameArb, { minLength: fragmentCount, maxLength: fragmentCount })
        .map((files) => {
          const seen = new Set<string>();
          return files.map((f, i) => {
            let name = f;
            while (seen.has(name)) {
              name = `${i}_${f}`;
            }
            seen.add(name);
            return name;
          });
        }),
      // Generate method names
      fc.array(csharpIdentifierArb, { minLength: methodsPerFragment, maxLength: methodsPerFragment })
        .map((methods) => {
          const seen = new Set<string>();
          return methods.map((m, i) => {
            let name = m;
            while (seen.has(name)) {
              name = `${m}${i}`;
            }
            seen.add(name);
            return name;
          });
        }),
    ),
  );

  /**
   * Creates a mock DB that returns the given nodes from getAllNodesByWorkspace.
   * After merge, the mock is updated to include virtual_class nodes so
   * materializeContainsEdges can resolve them.
   */
  function createMockDB(nodes: GraphNode[]) {
    let currentNodes = [...nodes];
    return {
      getAllNodesByWorkspace(_workspace: string): GraphNode[] {
        return currentNodes;
      },
      addNodes(newNodes: GraphNode[]) {
        currentNodes = [...currentNodes, ...newNodes];
      },
    };
  }

  it('all virtual_class nodes have graph_kind === "derived" and confidence_band === "INFERRED"', () => {
    fc.assert(
      fc.property(scenarioArb, ([workspaceId, projectId, className, subdir, fragmentCount, _methodsPerFragment, fileNames, _methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, 'TestNamespace', i);
        });

        const db = createMockDB(fragments);
        const mergeResult = mergePartialClasses(workspaceId, db as any);

        // Verify all virtual_class nodes have correct trust metadata
        expect(mergeResult.nodes.length).toBeGreaterThanOrEqual(1);
        for (const node of mergeResult.nodes) {
          expect(node.type).toBe('virtual_class');
          expect(node.graph_kind).toBe('derived');
          expect(node.confidence_band).toBe('INFERRED');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('all is_partial_of edges have graph_kind === "derived"', () => {
    fc.assert(
      fc.property(scenarioArb, ([workspaceId, projectId, className, subdir, fragmentCount, _methodsPerFragment, fileNames, _methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, 'TestNamespace', i);
        });

        const db = createMockDB(fragments);
        const mergeResult = mergePartialClasses(workspaceId, db as any);

        // Verify all is_partial_of edges have correct trust metadata
        expect(mergeResult.edges.length).toBeGreaterThanOrEqual(2);
        for (const edge of mergeResult.edges) {
          expect(edge.type).toBe('is_partial_of');
          expect(edge.graph_kind).toBe('derived');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('all contains edges have graph_kind === "derived"', () => {
    fc.assert(
      fc.property(scenarioArb, ([workspaceId, projectId, className, subdir, fragmentCount, methodsPerFragment, fileNames, methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, 'TestNamespace', i);
        });

        // Build method nodes — assign methods to the first fragment's source file
        const firstSourceFile = `${subdir}/${fileNames[0]}`;
        const methods: GraphNode[] = methodNames.map((methodName, i) =>
          createMethodNode(workspaceId, projectId, className, methodName, firstSourceFile, i),
        );

        const allNodes = [...fragments, ...methods];
        const db = createMockDB(allNodes);

        // Run merge first to create virtual_class nodes
        const mergeResult = mergePartialClasses(workspaceId, db as any);

        // Add virtual_class nodes to the mock DB so materializeContainsEdges can find them
        db.addNodes(mergeResult.nodes);

        // Run contains edge materialization
        const containsResult = materializeContainsEdges(workspaceId, db as any);

        // Verify all contains edges have correct trust metadata
        expect(containsResult.edges.length).toBeGreaterThanOrEqual(1);
        for (const edge of containsResult.edges) {
          expect(edge.type).toBe('contains');
          expect(edge.graph_kind).toBe('derived');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('combined: merge + contains produces all derived artifacts with correct trust metadata', () => {
    fc.assert(
      fc.property(scenarioArb, ([workspaceId, projectId, className, subdir, fragmentCount, methodsPerFragment, fileNames, methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, 'TestNamespace', i);
        });

        // Build method nodes — distribute across fragment source files
        const methods: GraphNode[] = methodNames.map((methodName, i) => {
          const sourceFile = `${subdir}/${fileNames[i % fileNames.length]}`;
          return createMethodNode(workspaceId, projectId, className, methodName, sourceFile, i);
        });

        const allNodes = [...fragments, ...methods];
        const db = createMockDB(allNodes);

        // Step 1: Run merge
        const mergeResult = mergePartialClasses(workspaceId, db as any);

        // Add virtual_class nodes to the mock DB
        db.addNodes(mergeResult.nodes);

        // Step 2: Run contains edge materialization
        const containsResult = materializeContainsEdges(workspaceId, db as any);

        // Verify ALL produced nodes have graph_kind === 'derived' and confidence_band === 'INFERRED'
        for (const node of mergeResult.nodes) {
          expect(node.graph_kind).toBe('derived');
          expect(node.confidence_band).toBe('INFERRED');
        }

        // Verify ALL is_partial_of edges have graph_kind === 'derived'
        for (const edge of mergeResult.edges) {
          expect(edge.graph_kind).toBe('derived');
        }

        // Verify ALL contains edges have graph_kind === 'derived'
        for (const edge of containsResult.edges) {
          expect(edge.graph_kind).toBe('derived');
        }

        // Verify counts are consistent
        expect(mergeResult.nodes).toHaveLength(1); // one virtual_class
        expect(mergeResult.edges).toHaveLength(fragmentCount); // one is_partial_of per fragment
        expect(containsResult.edges).toHaveLength(methodNames.length); // one contains per method
      }),
      { numRuns: 100 },
    );
  });
});
