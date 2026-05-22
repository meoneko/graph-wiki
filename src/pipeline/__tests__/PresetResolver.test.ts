import { describe, it, expect } from 'vitest';
import {
  PresetResolver,
  mergeRuleArrays,
  mergeAdapters,
  type Preset,
  type PolicyRule,
  type AdapterConfig,
  type WorkspaceOverrides,
} from '../PresetResolver.js';

describe('PresetResolver', () => {
  describe('resolve()', () => {
    it('resolves a preset without extends', () => {
      const resolver = new PresetResolver();
      const result = resolver.resolve('generic-codebase');

      expect(result.id).toBe('generic-codebase');
      expect(result.adapters.length).toBeGreaterThan(0);
      expect(result.policy.authorityPolicy).toBeDefined();
    });

    it('resolves a preset with single-level extends', () => {
      const resolver = new PresetResolver();
      const result = resolver.resolve('web-api');

      expect(result.id).toBe('web-api');
      // Should inherit generic-codebase adapters merged with web-api adapters
      expect(result.adapters.find((a) => a.id === 'typescript')).toBeDefined();
      expect(result.adapters.find((a) => a.id === 'structured-file')).toBeDefined();
      // Should have web-api specific policy rules merged with generic-codebase
      expect(result.policy.authorityPolicy?.canonicalFactRules).toBeDefined();
    });

    it('resolves multi-level inheritance (nextjs-app → react-app → generic-codebase)', () => {
      const resolver = new PresetResolver();
      const result = resolver.resolve('nextjs-app');

      expect(result.id).toBe('nextjs-app');
      // Should have adapters from the chain
      expect(result.adapters.find((a) => a.id === 'typescript')).toBeDefined();
      // Should have merged policies from all levels
      expect(result.policy.authorityPolicy?.canonicalFactRules).toBeDefined();
      const rules = result.policy.authorityPolicy!.canonicalFactRules!;
      // Should have rules from generic-codebase, react-app, and nextjs-app
      expect(rules.find((r) => r.id === 'deny-ai-canonical')).toBeDefined();
    });

    it('resolves dotnet-web-api (→ web-api → generic-codebase)', () => {
      const resolver = new PresetResolver();
      const result = resolver.resolve('dotnet-web-api');

      expect(result.id).toBe('dotnet-web-api');
      expect(result.adapters.find((a) => a.id === 'csharp')).toBeDefined();
      expect(result.verification?.require_flows).toBe(true);
    });

    it('throws on non-existent preset', () => {
      const resolver = new PresetResolver();
      expect(() => resolver.resolve('non-existent')).toThrow('non-existent');
      expect(() => resolver.resolve('non-existent')).toThrow('WORKSPACE_CONFIG_INVALID');
    });

    it('throws on cycle detection', () => {
      const cycleA: Preset = {
        id: 'cycle-a',
        extends: 'cycle-b',
        adapters: [],
        policy: {},
      };
      const cycleB: Preset = {
        id: 'cycle-b',
        extends: 'cycle-a',
        adapters: [],
        policy: {},
      };
      const resolver = new PresetResolver(
        new Map([
          ['cycle-a', cycleA],
          ['cycle-b', cycleB],
        ]),
      );

      expect(() => resolver.resolve('cycle-a')).toThrow('Cycle detected');
      expect(() => resolver.resolve('cycle-a')).toThrow('WORKSPACE_CONFIG_INVALID');
    });

    it('throws on self-referencing preset', () => {
      const selfRef: Preset = {
        id: 'self-ref',
        extends: 'self-ref',
        adapters: [],
        policy: {},
      };
      const resolver = new PresetResolver(new Map([['self-ref', selfRef]]));

      expect(() => resolver.resolve('self-ref')).toThrow('Cycle detected');
    });

    it('resolves all 9 built-in presets without error', () => {
      const resolver = new PresetResolver();
      const presetIds = [
        'generic-codebase',
        'web-api',
        'dotnet-web-api',
        'react-app',
        'nextjs-app',
        'node-service',
        'library-package',
        'markdown-docs',
        'mixed-monorepo',
      ];

      for (const id of presetIds) {
        const result = resolver.resolve(id);
        expect(result.id).toBe(id);
        expect(result.adapters).toBeDefined();
        expect(result.policy).toBeDefined();
      }
    });
  });

  describe('merge()', () => {
    it('merges workspace overrides with resolved preset', () => {
      const resolver = new PresetResolver();
      const base = resolver.resolve('generic-codebase');

      const overrides: WorkspaceOverrides = {
        id: 'my-workspace',
        name: 'My Workspace',
        projects: ['project-a', 'project-b'],
      };

      const result = resolver.merge(base, overrides);

      expect(result.id).toBe('my-workspace');
      expect(result.name).toBe('My Workspace');
      expect(result.projects).toEqual(['project-a', 'project-b']);
      // Should inherit preset adapters
      expect(result.adapters.length).toBeGreaterThan(0);
    });

    it('replaces primitive arrays entirely (projects)', () => {
      const resolver = new PresetResolver();
      const base = resolver.resolve('generic-codebase');

      const overrides: WorkspaceOverrides = {
        projects: ['only-this-project'],
      };

      const result = resolver.merge(base, overrides);
      expect(result.projects).toEqual(['only-this-project']);
    });

    it('uses override-by-id for policy rule arrays', () => {
      const resolver = new PresetResolver();
      const base = resolver.resolve('generic-codebase');

      const overrides: WorkspaceOverrides = {
        projects: [],
        authorityPolicy: {
          canonicalFactRules: [
            {
              id: 'require-parser-provenance',
              effect: 'allow',
              factKind: '*',
              minConfidence: 0.9, // Override the confidence threshold
              priority: 70,
            },
          ],
        },
      };

      const result = resolver.merge(base, overrides);
      const rule = result.policy.authorityPolicy?.canonicalFactRules?.find(
        (r) => r.id === 'require-parser-provenance',
      );
      expect(rule).toBeDefined();
      expect(rule!.minConfidence).toBe(0.9);
      expect(rule!.priority).toBe(70);
    });

    it('supports disabling rules via { id, disabled: true }', () => {
      const resolver = new PresetResolver();
      const base = resolver.resolve('generic-codebase');

      const overrides: WorkspaceOverrides = {
        projects: [],
        authorityPolicy: {
          canonicalFactRules: [
            { id: 'deny-ai-canonical', disabled: true },
          ],
        },
      };

      const result = resolver.merge(base, overrides);
      const disabledRule = result.policy.authorityPolicy?.canonicalFactRules?.find(
        (r) => r.id === 'deny-ai-canonical',
      );
      // Disabled rules should be removed from the result
      expect(disabledRule).toBeUndefined();
    });

    it('shallow-merges verification (workspace wins)', () => {
      const resolver = new PresetResolver();
      const base = resolver.resolve('web-api');

      const overrides: WorkspaceOverrides = {
        projects: [],
        verification: {
          min_process_coverage: 0.8,
        },
      };

      const result = resolver.merge(base, overrides);
      expect(result.verification?.min_process_coverage).toBe(0.8);
      // Other verification fields from base should be preserved
      expect(result.verification?.require_flows).toBe(true);
    });

    it('overrides adapters by id', () => {
      const resolver = new PresetResolver();
      const base = resolver.resolve('generic-codebase');

      const overrides: WorkspaceOverrides = {
        projects: [],
        adapters: [
          { id: 'typescript', language: 'typescript', pattern: 'src/**/*.ts', enabled: true },
          { id: 'custom-adapter', language: 'python', pattern: '**/*.py' },
        ],
      };

      const result = resolver.merge(base, overrides);
      const tsAdapter = result.adapters.find((a) => a.id === 'typescript');
      expect(tsAdapter?.pattern).toBe('src/**/*.ts');
      const customAdapter = result.adapters.find((a) => a.id === 'custom-adapter');
      expect(customAdapter).toBeDefined();
      expect(customAdapter?.language).toBe('python');
    });
  });

  describe('inheritance with policy conflict resolution', () => {
    it('inherits conflictResolution settings from parent preset', () => {
      const parent: Preset = {
        id: 'parent',
        adapters: [],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [{ id: 'rule-1', effect: 'allow', factKind: '*', priority: 50 }],
            conflictResolution: {
              priorityRange: [0, 100],
              defaultPriority: 50,
              samePriorityBehavior: 'deny-wins',
              conflictingAllowDenyBehavior: 'deny-wins',
            },
          },
        },
      };
      const child: Preset = {
        id: 'child',
        extends: 'parent',
        adapters: [],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [{ id: 'rule-2', effect: 'deny', factKind: 'function', priority: 80 }],
            conflictResolution: {
              priorityRange: [0, 100],
              defaultPriority: 60,
              samePriorityBehavior: 'ambiguous',
              conflictingAllowDenyBehavior: 'ambiguous',
            },
          },
        },
      };
      const resolver = new PresetResolver(
        new Map([
          ['parent', parent],
          ['child', child],
        ]),
      );

      const result = resolver.resolve('child');
      // Child's conflictResolution should override parent's
      expect(result.policy.authorityPolicy?.conflictResolution?.samePriorityBehavior).toBe('ambiguous');
      expect(result.policy.authorityPolicy?.conflictResolution?.defaultPriority).toBe(60);
      // Rules should be merged from both levels
      const rules = result.policy.authorityPolicy?.canonicalFactRules;
      expect(rules?.find((r) => r.id === 'rule-1')).toBeDefined();
      expect(rules?.find((r) => r.id === 'rule-2')).toBeDefined();
    });

    it('child can override specific rules from parent while keeping others', () => {
      const parent: Preset = {
        id: 'parent',
        adapters: [{ id: 'ts', language: 'typescript', pattern: '**/*.ts' }],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [
              { id: 'rule-a', effect: 'allow', factKind: '*', priority: 50 },
              { id: 'rule-b', effect: 'deny', factKind: 'test', priority: 70 },
            ],
          },
        },
      };
      const child: Preset = {
        id: 'child',
        extends: 'parent',
        adapters: [],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [
              { id: 'rule-a', effect: 'allow', factKind: '*', priority: 90 }, // Override priority
            ],
          },
        },
      };
      const resolver = new PresetResolver(
        new Map([
          ['parent', parent],
          ['child', child],
        ]),
      );

      const result = resolver.resolve('child');
      const rules = result.policy.authorityPolicy?.canonicalFactRules!;
      // rule-a should have child's priority
      expect(rules.find((r) => r.id === 'rule-a')?.priority).toBe(90);
      // rule-b should be preserved from parent
      expect(rules.find((r) => r.id === 'rule-b')?.priority).toBe(70);
    });

    it('three-level inheritance merges rules correctly', () => {
      const grandparent: Preset = {
        id: 'grandparent',
        adapters: [],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [
              { id: 'base-rule', effect: 'allow', factKind: '*', priority: 30 },
            ],
          },
        },
      };
      const parent: Preset = {
        id: 'parent',
        extends: 'grandparent',
        adapters: [],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [
              { id: 'parent-rule', effect: 'deny', factKind: 'function', priority: 60 },
            ],
          },
        },
      };
      const child: Preset = {
        id: 'child',
        extends: 'parent',
        adapters: [],
        policy: {
          authorityPolicy: {
            canonicalFactRules: [
              { id: 'base-rule', effect: 'allow', factKind: '*', priority: 80 }, // Override grandparent
            ],
          },
        },
      };
      const resolver = new PresetResolver(
        new Map([
          ['grandparent', grandparent],
          ['parent', parent],
          ['child', child],
        ]),
      );

      const result = resolver.resolve('child');
      const rules = result.policy.authorityPolicy?.canonicalFactRules!;
      // base-rule should have child's priority (overridden through chain)
      expect(rules.find((r) => r.id === 'base-rule')?.priority).toBe(80);
      // parent-rule should be preserved
      expect(rules.find((r) => r.id === 'parent-rule')?.priority).toBe(60);
    });
  });
});

describe('mergeRuleArrays', () => {
  it('returns undefined when both are undefined', () => {
    expect(mergeRuleArrays(undefined, undefined)).toBeUndefined();
  });

  it('returns overrides when base is undefined', () => {
    const overrides: PolicyRule[] = [{ id: 'rule-1', effect: 'allow' }];
    expect(mergeRuleArrays(undefined, overrides)).toEqual(overrides);
  });

  it('returns copy of base when overrides is undefined', () => {
    const base: PolicyRule[] = [{ id: 'rule-1', effect: 'allow' }];
    const result = mergeRuleArrays(base, undefined);
    expect(result).toEqual(base);
    expect(result).not.toBe(base); // Should be a copy
  });

  it('merges matching rules by id', () => {
    const base: PolicyRule[] = [
      { id: 'rule-1', effect: 'allow', minConfidence: 0.7 },
      { id: 'rule-2', effect: 'deny', priority: 50 },
    ];
    const overrides: PolicyRule[] = [
      { id: 'rule-1', effect: 'allow', minConfidence: 0.9 },
    ];

    const result = mergeRuleArrays(base, overrides)!;
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'rule-1', effect: 'allow', minConfidence: 0.9 });
    expect(result[1]).toEqual({ id: 'rule-2', effect: 'deny', priority: 50 });
  });

  it('removes disabled rules', () => {
    const base: PolicyRule[] = [
      { id: 'rule-1', effect: 'allow' },
      { id: 'rule-2', effect: 'deny' },
    ];
    const overrides: PolicyRule[] = [{ id: 'rule-1', disabled: true }];

    const result = mergeRuleArrays(base, overrides)!;
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('rule-2');
  });

  it('appends new rules from overrides', () => {
    const base: PolicyRule[] = [{ id: 'rule-1', effect: 'allow' }];
    const overrides: PolicyRule[] = [{ id: 'rule-new', effect: 'deny', priority: 80 }];

    const result = mergeRuleArrays(base, overrides)!;
    expect(result).toHaveLength(2);
    expect(result[1]!.id).toBe('rule-new');
  });

  it('does not append disabled rules that have no base match', () => {
    const base: PolicyRule[] = [{ id: 'rule-1', effect: 'allow' }];
    const overrides: PolicyRule[] = [{ id: 'non-existent', disabled: true }];

    const result = mergeRuleArrays(base, overrides)!;
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('rule-1');
  });
});

describe('mergeAdapters', () => {
  it('returns copy of base when overrides is undefined', () => {
    const base: AdapterConfig[] = [{ id: 'ts', language: 'typescript' }];
    const result = mergeAdapters(base, undefined);
    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });

  it('overrides matching adapters by id', () => {
    const base: AdapterConfig[] = [
      { id: 'ts', language: 'typescript', pattern: '**/*.ts' },
    ];
    const overrides: AdapterConfig[] = [
      { id: 'ts', language: 'typescript', pattern: 'src/**/*.ts' },
    ];

    const result = mergeAdapters(base, overrides);
    expect(result).toHaveLength(1);
    expect(result[0]!.pattern).toBe('src/**/*.ts');
  });

  it('appends new adapters from overrides', () => {
    const base: AdapterConfig[] = [{ id: 'ts', language: 'typescript' }];
    const overrides: AdapterConfig[] = [{ id: 'python', language: 'python', pattern: '**/*.py' }];

    const result = mergeAdapters(base, overrides);
    expect(result).toHaveLength(2);
    expect(result[1]!.id).toBe('python');
  });
});
