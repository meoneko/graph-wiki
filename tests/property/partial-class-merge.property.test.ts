import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createHash } from 'node:crypto';
import { mergePartialClasses, materializeContainsEdges } from '../../src/pipeline/stages/05b_build_derived.js';
import type { GraphNode } from '../../src/core/types.js';

/**
 * Feature: partial-class-support, Property 7: Merge correctness
 *
 * For any set of 2 or more `csharp_class` fragment nodes (where `node.type === 'csharp_class'`)
 * sharing the same label and `node.project` value (within the same first-level subdirectory),
 * `mergePartialClasses` SHALL produce exactly one `virtual_class` node where:
 * - `symbol` equals the simple class name
 * - `lang_meta.fragmentCount` equals the number of input fragments
 * - `lang_meta.mergedFrom` contains all fragment node IDs sorted alphabetically
 * - `lang_meta.namespace` equals the common namespace (or is unset if namespaces differ)
 * - Exactly N `is_partial_of` edges exist (one from each fragment to the virtual_class)
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.8, 5.9**
 */
describe('Feature: partial-class-support, Property 7: Merge correctness', () => {
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

  /** Arbitrary: valid namespace like "MyApp.Domain" */
  const namespaceArb = fc
    .tuple(csharpIdentifierArb, csharpIdentifierArb)
    .map(([ns1, ns2]) => `${ns1}.${ns2}`);

  /** Arbitrary: workspace ID */
  const workspaceIdArb = fc.stringMatching(/^[a-z]{3,10}$/);

  /** Arbitrary: project ID */
  const projectIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,12}$/);

  /** Arbitrary: first-level subdirectory name (all fragments share the same one) */
  const subdirArb = fc.constantFrom('src', 'lib', 'domain', 'services', 'models', 'controllers');

  /** Arbitrary: file name within the subdirectory */
  const fileNameArb = fc
    .tuple(csharpIdentifierArb, fc.constantFrom('.cs', '.partial.cs', '.Methods.cs', '.Props.cs'))
    .map(([name, ext]) => `${name}${ext}`);

  /**
   * Generates a set of 2-5 fragment nodes with the same class name, project,
   * and first-level subdirectory. Each fragment has a unique source_file.
   */
  const fragmentSetArb = fc.tuple(
    workspaceIdArb,
    projectIdArb,
    csharpIdentifierArb, // className
    subdirArb,
    fc.integer({ min: 2, max: 5 }), // fragment count
    // Whether all fragments share the same namespace
    fc.boolean(),
    namespaceArb, // common namespace
    namespaceArb, // alternate namespace (used when namespaces differ)
  ).chain(([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs]) =>
    fc.tuple(
      fc.constant(workspaceId),
      fc.constant(projectId),
      fc.constant(className),
      fc.constant(subdir),
      fc.constant(fragmentCount),
      fc.constant(sameNamespace),
      fc.constant(commonNs),
      fc.constant(altNs),
      // Generate unique file names for each fragment
      fc.array(fileNameArb, { minLength: fragmentCount, maxLength: fragmentCount })
        .map((files) => {
          // Ensure uniqueness by appending index if needed
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
    ),
  );

  /**
   * Creates a minimal mock DB that returns the given nodes from getAllNodesByWorkspace.
   */
  function createMockDB(nodes: GraphNode[]) {
    return {
      getAllNodesByWorkspace(_workspace: string): GraphNode[] {
        return nodes;
      },
    } as any; // Cast to GraphDB — we only need getAllNodesByWorkspace for mergePartialClasses
  }

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

  it('produces exactly one virtual_class node with correct symbol/label for merged fragments', () => {
    fc.assert(
      fc.property(fragmentSetArb, ([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs, fileNames]) => {
        // Build fragment nodes — all in the same first-level subdirectory
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          const ns = sameNamespace ? commonNs : (i === 0 ? commonNs : altNs);
          return createFragmentNode(workspaceId, projectId, className, sourceFile, ns, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        // Should produce exactly 1 virtual_class node
        expect(result.nodes).toHaveLength(1);

        const virtualNode = result.nodes[0]!;

        // Verify type is virtual_class
        expect(virtualNode.type).toBe('virtual_class');

        // Verify symbol equals the simple class name
        expect(virtualNode.symbol).toBe(className);

        // Verify label equals the simple class name
        expect(virtualNode.label).toBe(className);

        // Verify workspace and project
        expect(virtualNode.workspace).toBe(workspaceId);
        expect(virtualNode.project).toBe(projectId);
      }),
      { numRuns: 100 },
    );
  });

  it('sets lang_meta.fragmentCount to the number of input fragments', () => {
    fc.assert(
      fc.property(fragmentSetArb, ([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs, fileNames]) => {
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          const ns = sameNamespace ? commonNs : (i === 0 ? commonNs : altNs);
          return createFragmentNode(workspaceId, projectId, className, sourceFile, ns, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        expect(result.nodes).toHaveLength(1);
        const virtualNode = result.nodes[0]!;

        // Verify fragmentCount equals the number of input fragments
        expect(virtualNode.lang_meta?.fragmentCount).toBe(fragmentCount);
      }),
      { numRuns: 100 },
    );
  });

  it('sets lang_meta.mergedFrom to fragment IDs sorted alphabetically', () => {
    fc.assert(
      fc.property(fragmentSetArb, ([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs, fileNames]) => {
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          const ns = sameNamespace ? commonNs : (i === 0 ? commonNs : altNs);
          return createFragmentNode(workspaceId, projectId, className, sourceFile, ns, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        expect(result.nodes).toHaveLength(1);
        const virtualNode = result.nodes[0]!;

        // mergedFrom should contain all fragment IDs sorted alphabetically
        const expectedMergedFrom = [...fragments].sort((a, b) => a.id.localeCompare(b.id)).map(f => f.id);
        expect(virtualNode.lang_meta?.mergedFrom).toEqual(expectedMergedFrom);
      }),
      { numRuns: 100 },
    );
  });

  it('sets lang_meta.namespace to common namespace or leaves unset if different', () => {
    fc.assert(
      fc.property(fragmentSetArb, ([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs, fileNames]) => {
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          const ns = sameNamespace ? commonNs : (i === 0 ? commonNs : altNs);
          return createFragmentNode(workspaceId, projectId, className, sourceFile, ns, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        expect(result.nodes).toHaveLength(1);
        const virtualNode = result.nodes[0]!;

        if (sameNamespace) {
          // All fragments share the same namespace — should be set
          expect(virtualNode.lang_meta?.namespace).toBe(commonNs);
        } else {
          // Fragments have different namespaces — should be unset
          expect(virtualNode.lang_meta?.namespace).toBeUndefined();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('produces exactly N is_partial_of edges (one per fragment to virtual_class)', () => {
    fc.assert(
      fc.property(fragmentSetArb, ([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs, fileNames]) => {
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          const ns = sameNamespace ? commonNs : (i === 0 ? commonNs : altNs);
          return createFragmentNode(workspaceId, projectId, className, sourceFile, ns, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        // Should produce exactly N edges (one per fragment)
        expect(result.edges).toHaveLength(fragmentCount);

        const virtualNode = result.nodes[0]!;

        // Each edge should be is_partial_of type
        for (const edge of result.edges) {
          expect(edge.type).toBe('is_partial_of');
        }

        // Each edge should point to the virtual_class node
        for (const edge of result.edges) {
          expect(edge.to_id).toBe(virtualNode.id);
        }

        // Each fragment should have exactly one edge from it
        const fromIds = new Set(result.edges.map(e => e.from_id));
        for (const fragment of fragments) {
          expect(fromIds.has(fragment.id)).toBe(true);
        }

        // No duplicate from_ids (one edge per fragment)
        expect(fromIds.size).toBe(fragmentCount);
      }),
      { numRuns: 100 },
    );
  });

  it('each is_partial_of edge has from_id = fragment.id and to_id = virtual_class.id', () => {
    fc.assert(
      fc.property(fragmentSetArb, ([workspaceId, projectId, className, subdir, fragmentCount, sameNamespace, commonNs, altNs, fileNames]) => {
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          const ns = sameNamespace ? commonNs : (i === 0 ? commonNs : altNs);
          return createFragmentNode(workspaceId, projectId, className, sourceFile, ns, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        expect(result.nodes).toHaveLength(1);
        const virtualNode = result.nodes[0]!;
        const fragmentIds = new Set(fragments.map(f => f.id));

        for (const edge of result.edges) {
          // from_id must be one of the fragment IDs
          expect(fragmentIds.has(edge.from_id)).toBe(true);
          // to_id must be the virtual_class node ID
          expect(edge.to_id).toBe(virtualNode.id);
          // Verify edge workspace
          expect(edge.workspace).toBe(workspaceId);
          // Verify graph_kind is derived
          expect(edge.graph_kind).toBe('derived');
          // Verify confidence_band is INFERRED
          expect(edge.confidence_band).toBe('INFERRED');
        }
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: partial-class-support, Property 13: Derived node stable key invariant
 *
 * Property 13 (derived scope): virtual_class stableKey === id
 *
 * For all `virtual_class` nodes produced by `mergePartialClasses`, verify
 * `node.stableKey === node.id` (derived nodes use id as stableKey).
 *
 * For all `is_partial_of` and `contains` edges, verify `edge.stableKey === edge.id`.
 *
 * Note: canonical `csharp_method` stableKey determinism (sid pattern) is tested
 * at the canonical pipeline / CSharpAdapter layer, not here.
 *
 * **Validates: Requirements 8.2 (derived portion)**
 */
describe('Feature: partial-class-support, Property 13: Derived node stable key invariant', () => {
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

  /** Arbitrary: valid namespace like "MyApp.Domain" */
  const namespaceArb = fc
    .tuple(csharpIdentifierArb, csharpIdentifierArb)
    .map(([ns1, ns2]) => `${ns1}.${ns2}`);

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

  /** Arbitrary: method name */
  const methodNameArb = fc
    .tuple(
      fc.constantFrom('Get', 'Set', 'Process', 'Handle', 'Create', 'Update', 'Delete', 'Find'),
      csharpIdentifierArb,
    )
    .map(([prefix, suffix]) => `${prefix}${suffix}`);

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
    const nodeId = `node:${sid(workspaceId, projectId, sourceFile, `${className}.${methodName}`)}_m${index}`;
    return {
      id: nodeId,
      stableKey: nodeId,
      workspace: workspaceId,
      project: projectId,
      type: 'csharp_method',
      label: methodName,
      symbol: `${className}.${methodName}`,
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
   * Creates a mock DB that returns the given nodes from getAllNodesByWorkspace.
   */
  function createMockDB(nodes: GraphNode[]) {
    return {
      getAllNodesByWorkspace(_workspace: string): GraphNode[] {
        return nodes;
      },
    } as any;
  }

  /**
   * Generates 2-5 fragment nodes + 1-3 method nodes per fragment, all sharing
   * the same class name, project, and first-level subdirectory.
   */
  const fragmentsWithMethodsArb = fc.tuple(
    workspaceIdArb,
    projectIdArb,
    csharpIdentifierArb, // className
    subdirArb,
    namespaceArb,
    fc.integer({ min: 2, max: 5 }), // fragment count
    fc.integer({ min: 1, max: 3 }), // methods per fragment
  ).chain(([workspaceId, projectId, className, subdir, namespace, fragmentCount, methodsPerFragment]) =>
    fc.tuple(
      fc.constant(workspaceId),
      fc.constant(projectId),
      fc.constant(className),
      fc.constant(subdir),
      fc.constant(namespace),
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
      // Generate method names for each fragment
      fc.array(
        fc.array(methodNameArb, { minLength: methodsPerFragment, maxLength: methodsPerFragment }),
        { minLength: fragmentCount, maxLength: fragmentCount },
      ),
    ),
  );

  it('every virtual_class node has stableKey === id', () => {
    fc.assert(
      fc.property(fragmentsWithMethodsArb, ([workspaceId, projectId, className, subdir, namespace, fragmentCount, _methodsPerFragment, fileNames, _methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        // Every virtual_class node must have stableKey === id
        expect(result.nodes.length).toBeGreaterThanOrEqual(1);
        for (const node of result.nodes) {
          expect(node.type).toBe('virtual_class');
          expect(node.stableKey).toBe(node.id);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('every is_partial_of edge has stableKey === id', () => {
    fc.assert(
      fc.property(fragmentsWithMethodsArb, ([workspaceId, projectId, className, subdir, namespace, fragmentCount, _methodsPerFragment, fileNames, _methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
        });

        const db = createMockDB(fragments);
        const result = mergePartialClasses(workspaceId, db);

        // Every is_partial_of edge must have stableKey === id
        expect(result.edges.length).toBeGreaterThanOrEqual(2);
        for (const edge of result.edges) {
          expect(edge.type).toBe('is_partial_of');
          expect(edge.stableKey).toBe(edge.id);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('every contains edge has stableKey === id', () => {
    fc.assert(
      fc.property(fragmentsWithMethodsArb, ([workspaceId, projectId, className, subdir, namespace, fragmentCount, methodsPerFragment, fileNames, methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
        });

        // Build method nodes (one set per fragment)
        const methods: GraphNode[] = [];
        fileNames.forEach((fileName, fragIdx) => {
          const sourceFile = `${subdir}/${fileName}`;
          const fragMethods = methodNames[fragIdx] ?? [];
          fragMethods.forEach((methodName, mIdx) => {
            methods.push(
              createMethodNode(workspaceId, projectId, className, `${methodName}_${fragIdx}_${mIdx}`, sourceFile, fragIdx * 10 + mIdx),
            );
          });
        });

        // First run mergePartialClasses to create virtual_class nodes
        const allNodesForMerge = [...fragments];
        const dbForMerge = createMockDB(allNodesForMerge);
        const mergeResult = mergePartialClasses(workspaceId, dbForMerge);

        // Now run materializeContainsEdges with all nodes (fragments + methods + virtual_class)
        const allNodesForContains = [...fragments, ...methods, ...mergeResult.nodes];
        const dbForContains = createMockDB(allNodesForContains);
        const containsResult = materializeContainsEdges(workspaceId, dbForContains);

        // Every contains edge must have stableKey === id
        expect(containsResult.edges.length).toBeGreaterThanOrEqual(1);
        for (const edge of containsResult.edges) {
          expect(edge.type).toBe('contains');
          expect(edge.stableKey).toBe(edge.id);
        }
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: partial-class-support, Property 12: Rebuild idempotency (delete-then-recreate)
 *
 * For any sequence of two consecutive executions of mergePartialClasses + materializeContainsEdges
 * on the same workspace with the same canonical data, the resulting set of virtual_class nodes,
 * is_partial_of edges, and contains edges SHALL be identical.
 * Furthermore, if a fragment is removed between runs such that a class group drops below 2 fragments,
 * no virtual_class node SHALL exist for that class after the second run.
 *
 * **Validates: Requirements 8.6, 8.7, 8.8**
 */
describe('Feature: partial-class-support, Property 12: Rebuild idempotency (delete-then-recreate)', () => {
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

  /** Arbitrary: valid namespace like "MyApp.Domain" */
  const namespaceArb = fc
    .tuple(csharpIdentifierArb, csharpIdentifierArb)
    .map(([ns1, ns2]) => `${ns1}.${ns2}`);

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
        timestamp: '2025-01-01T00:00:00.000Z',
      },
      lang_meta: {
        isPartial: true,
        ...(namespace !== undefined ? { namespace } : {}),
      },
      updated_at: '2025-01-01T00:00:00.000Z',
    };
  }

  /**
   * Creates a method GraphNode for a partial class method.
   */
  function createMethodNode(
    workspaceId: string,
    projectId: string,
    className: string,
    methodName: string,
    sourceFile: string,
    index: number,
  ): GraphNode {
    const nodeId = `node:${sid(workspaceId, projectId, sourceFile, `${className}.${methodName}`)}_method_${index}`;
    return {
      id: nodeId,
      stableKey: nodeId,
      workspace: workspaceId,
      project: projectId,
      type: 'csharp_method',
      label: methodName,
      symbol: `${className}.${methodName}`,
      source_file: sourceFile,
      graph_kind: 'canonical',
      confidence_band: 'AUTHORITATIVE',
      trust_level: 'AUTHORITATIVE',
      provenance: {
        source: 'parser',
        artifact_source: sourceFile,
        producer_stage: 'extract',
        timestamp: '2025-01-01T00:00:00.000Z',
      },
      lang_meta: {
        containingClass: className,
        returnType: 'void',
        parameters: '',
        sourceFile,
        isPartialClass: true,
      },
      updated_at: '2025-01-01T00:00:00.000Z',
    };
  }

  /**
   * Creates a mock DB that returns the given nodes from getAllNodesByWorkspace.
   * Supports dynamic node injection (simulating merge results being available for contains edges).
   */
  function createMockDB(nodes: GraphNode[]) {
    let currentNodes = [...nodes];
    return {
      getAllNodesByWorkspace(_workspace: string): GraphNode[] {
        return currentNodes;
      },
      /** Inject additional nodes (simulates DB upsert of virtual_class nodes) */
      _injectNodes(additionalNodes: GraphNode[]) {
        currentNodes = [...currentNodes, ...additionalNodes];
      },
      /** Reset to original canonical nodes */
      _reset(originalNodes: GraphNode[]) {
        currentNodes = [...originalNodes];
      },
    } as any;
  }

  /**
   * Normalizes results for comparison by stripping timestamps and sorting.
   * This ensures deterministic comparison regardless of execution timing.
   */
  function normalizeForComparison(result: { nodes: GraphNode[]; edges: any[] }) {
    const normalizedNodes = result.nodes
      .map((n) => {
        const { updated_at, provenance, ...rest } = n as any;
        const { timestamp, ...provRest } = provenance ?? {};
        return { ...rest, provenance: provRest };
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    const normalizedEdges = result.edges
      .map((e) => {
        const { updated_at, provenance, ...rest } = e as any;
        const { timestamp, ...provRest } = provenance ?? {};
        return { ...rest, provenance: provRest };
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    return { nodes: normalizedNodes, edges: normalizedEdges };
  }

  /**
   * Generates a set of 2-5 fragment nodes with the same class name, project,
   * and first-level subdirectory, plus 1-3 method nodes per fragment.
   */
  const idempotencyInputArb = fc.tuple(
    workspaceIdArb,
    projectIdArb,
    csharpIdentifierArb, // className
    subdirArb,
    fc.integer({ min: 2, max: 5 }), // fragment count
    namespaceArb, // common namespace
    fc.integer({ min: 1, max: 3 }), // methods per fragment
  ).chain(([workspaceId, projectId, className, subdir, fragmentCount, namespace, methodsPerFragment]) =>
    fc.tuple(
      fc.constant(workspaceId),
      fc.constant(projectId),
      fc.constant(className),
      fc.constant(subdir),
      fc.constant(fragmentCount),
      fc.constant(namespace),
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
      fc.array(csharpIdentifierArb, { minLength: methodsPerFragment, maxLength: methodsPerFragment }),
    ),
  );

  it('mergePartialClasses produces identical output on two consecutive runs with same input', () => {
    fc.assert(
      fc.property(idempotencyInputArb, ([workspaceId, projectId, className, subdir, fragmentCount, namespace, _methodsPerFragment, fileNames, _methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
        });

        // Run 1
        const db1 = createMockDB(fragments);
        const result1 = mergePartialClasses(workspaceId, db1);

        // Run 2 (same input)
        const db2 = createMockDB(fragments);
        const result2 = mergePartialClasses(workspaceId, db2);

        // Compare normalized outputs — should be identical
        const normalized1 = normalizeForComparison(result1);
        const normalized2 = normalizeForComparison(result2);

        expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2));
      }),
      { numRuns: 100 },
    );
  });

  it('materializeContainsEdges produces identical output on two consecutive runs with same input', () => {
    fc.assert(
      fc.property(idempotencyInputArb, ([workspaceId, projectId, className, subdir, fragmentCount, namespace, methodsPerFragment, fileNames, methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
        });

        // Build method nodes (spread across fragments)
        const methods: GraphNode[] = [];
        for (let i = 0; i < methodsPerFragment; i++) {
          const fragIndex = i % fragmentCount;
          const sourceFile = `${subdir}/${fileNames[fragIndex]}`;
          methods.push(createMethodNode(workspaceId, projectId, className, methodNames[i]!, sourceFile, i));
        }

        // First: run merge to get virtual_class nodes
        const allCanonicalNodes = [...fragments, ...methods];
        const mergeDb = createMockDB(allCanonicalNodes);
        const mergeResult = mergePartialClasses(workspaceId, mergeDb);

        // Now create DB with canonical + virtual_class nodes for contains edge resolution
        const allNodesWithVirtual = [...allCanonicalNodes, ...mergeResult.nodes];

        // Run 1
        const db1 = createMockDB(allNodesWithVirtual);
        const result1 = materializeContainsEdges(workspaceId, db1);

        // Run 2 (same input)
        const db2 = createMockDB(allNodesWithVirtual);
        const result2 = materializeContainsEdges(workspaceId, db2);

        // Compare normalized outputs — should be identical
        const normalized1 = normalizeForComparison({ nodes: [], edges: result1.edges });
        const normalized2 = normalizeForComparison({ nodes: [], edges: result2.edges });

        expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2));
      }),
      { numRuns: 100 },
    );
  });

  it('full merge+contains pipeline produces identical output on two consecutive runs', () => {
    fc.assert(
      fc.property(idempotencyInputArb, ([workspaceId, projectId, className, subdir, fragmentCount, namespace, methodsPerFragment, fileNames, methodNames]) => {
        // Build fragment nodes
        const fragments: GraphNode[] = fileNames.map((fileName, i) => {
          const sourceFile = `${subdir}/${fileName}`;
          return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
        });

        // Build method nodes
        const methods: GraphNode[] = [];
        for (let i = 0; i < methodsPerFragment; i++) {
          const fragIndex = i % fragmentCount;
          const sourceFile = `${subdir}/${fileNames[fragIndex]}`;
          methods.push(createMethodNode(workspaceId, projectId, className, methodNames[i]!, sourceFile, i));
        }

        const allCanonicalNodes = [...fragments, ...methods];

        // Run 1: merge then contains
        const db1 = createMockDB(allCanonicalNodes);
        const mergeResult1 = mergePartialClasses(workspaceId, db1);
        db1._injectNodes(mergeResult1.nodes);
        const containsResult1 = materializeContainsEdges(workspaceId, db1);

        // Run 2: merge then contains (same canonical input)
        const db2 = createMockDB(allCanonicalNodes);
        const mergeResult2 = mergePartialClasses(workspaceId, db2);
        db2._injectNodes(mergeResult2.nodes);
        const containsResult2 = materializeContainsEdges(workspaceId, db2);

        // Compare all nodes
        const allNodes1 = normalizeForComparison({ nodes: mergeResult1.nodes, edges: [...mergeResult1.edges, ...containsResult1.edges] });
        const allNodes2 = normalizeForComparison({ nodes: mergeResult2.nodes, edges: [...mergeResult2.edges, ...containsResult2.edges] });

        expect(JSON.stringify(allNodes1)).toBe(JSON.stringify(allNodes2));
      }),
      { numRuns: 100 },
    );
  });

  it('removing a fragment so group drops below 2 causes no virtual_class on second run', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          workspaceIdArb,
          projectIdArb,
          csharpIdentifierArb, // className
          subdirArb,
          namespaceArb,
          // Generate exactly 2 unique file names (minimum for merge)
          fc.tuple(fileNameArb, fileNameArb).map(([f1, f2]) => {
            if (f1 === f2) return [f1, `alt_${f2}`];
            return [f1, f2];
          }),
        ),
        ([workspaceId, projectId, className, subdir, namespace, fileNames]) => {
          // Build 2 fragment nodes (minimum for merge)
          const fragments: GraphNode[] = fileNames.map((fileName, i) => {
            const sourceFile = `${subdir}/${fileName}`;
            return createFragmentNode(workspaceId, projectId, className, sourceFile, namespace, i);
          });

          // Run 1: with 2 fragments — should produce a virtual_class
          const db1 = createMockDB(fragments);
          const result1 = mergePartialClasses(workspaceId, db1);

          expect(result1.nodes).toHaveLength(1);
          expect(result1.nodes[0]!.type).toBe('virtual_class');
          expect(result1.edges.length).toBeGreaterThanOrEqual(2);

          // Run 2: remove one fragment so only 1 remains — should produce NO virtual_class
          const reducedFragments = [fragments[0]!]; // Only keep first fragment
          const db2 = createMockDB(reducedFragments);
          const result2 = mergePartialClasses(workspaceId, db2);

          // No virtual_class node should be produced
          expect(result2.nodes).toHaveLength(0);
          // No is_partial_of edges should be produced
          expect(result2.edges).toHaveLength(0);
          // No warnings (single fragment is not an error)
          expect(result2.warnings).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('removing fragments from multiple groups correctly removes only affected virtual_class nodes', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          workspaceIdArb,
          projectIdArb,
          csharpIdentifierArb, // className1
          csharpIdentifierArb, // className2
          subdirArb,
          namespaceArb,
          fc.tuple(fileNameArb, fileNameArb, fileNameArb, fileNameArb).map(([f1, f2, f3, f4]) => {
            // Ensure all 4 file names are unique
            const names = [f1, f2, f3, f4].map((n, i) => {
              const seen = new Set([f1, f2, f3, f4].slice(0, i));
              return seen.has(n) ? `${i}_${n}` : n;
            });
            return names;
          }),
        ).filter(([_w, _p, className1, className2]) => className1 !== className2), // Ensure different class names
        ([workspaceId, projectId, className1, className2, subdir, namespace, fileNames]) => {
          // Class 1: 2 fragments (will be reduced to 1)
          const class1Fragments: GraphNode[] = [
            createFragmentNode(workspaceId, projectId, className1, `${subdir}/${fileNames[0]}`, namespace, 0),
            createFragmentNode(workspaceId, projectId, className1, `${subdir}/${fileNames[1]}`, namespace, 1),
          ];

          // Class 2: 2 fragments (will remain at 2)
          const class2Fragments: GraphNode[] = [
            createFragmentNode(workspaceId, projectId, className2, `${subdir}/${fileNames[2]}`, namespace, 2),
            createFragmentNode(workspaceId, projectId, className2, `${subdir}/${fileNames[3]}`, namespace, 3),
          ];

          // Run 1: both classes have 2 fragments — both get virtual_class
          const allFragments = [...class1Fragments, ...class2Fragments];
          const db1 = createMockDB(allFragments);
          const result1 = mergePartialClasses(workspaceId, db1);

          expect(result1.nodes).toHaveLength(2); // Two virtual_class nodes

          // Run 2: remove one fragment from class1, keep class2 intact
          const reducedFragments = [class1Fragments[0]!, ...class2Fragments];
          const db2 = createMockDB(reducedFragments);
          const result2 = mergePartialClasses(workspaceId, db2);

          // Only class2 should have a virtual_class node
          expect(result2.nodes).toHaveLength(1);
          expect(result2.nodes[0]!.label).toBe(className2);
          expect(result2.nodes[0]!.type).toBe('virtual_class');

          // Only class2 fragments should have is_partial_of edges
          expect(result2.edges).toHaveLength(2); // 2 edges for class2's 2 fragments
          for (const edge of result2.edges) {
            expect(edge.to_id).toBe(result2.nodes[0]!.id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
