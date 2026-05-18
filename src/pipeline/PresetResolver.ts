/**
 * PresetResolver — resolves workspace presets with inheritance semantics
 * using `extends` field and override-by-id merge strategy.
 *
 * @see Requirements 1.2, 1.3, 1.4, 1.5
 */

import { PipelineError } from '../core/errors.js';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface AdapterConfig {
  id: string;
  language: string;
  pattern?: string;
  enabled?: boolean;
  options?: Record<string, unknown>;
}

export interface PolicyRule {
  id: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface PolicyDefaults {
  authorityPolicy?: {
    canonicalFactRules?: PolicyRule[];
    canonicalEdgeRules?: PolicyRule[];
    ambiguityRules?: PolicyRule[];
    conflictResolution?: {
      priorityRange?: [number, number];
      defaultPriority?: number;
      samePriorityBehavior?: 'deny-wins' | 'ambiguous';
      conflictingAllowDenyBehavior?: 'deny-wins' | 'ambiguous';
    };
  };
  graphPolicy?: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
  askPolicy?: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
  wikiPolicy?: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
}

export interface WorkspaceVerificationConfig {
  require_flows?: boolean;
  required_golden_flows?: string[];
  require_runtime_script_contract?: boolean;
  require_artifact_parity?: boolean;
  min_process_coverage?: number;
}

export interface Preset {
  id: string;
  extends?: string;
  adapters: AdapterConfig[];
  policy: PolicyDefaults;
  verification?: WorkspaceVerificationConfig;
}

export interface ResolvedPreset {
  id: string;
  adapters: AdapterConfig[];
  policy: PolicyDefaults;
  verification?: WorkspaceVerificationConfig;
}

/**
 * Partial workspace config used for merge overrides.
 * Mirrors the fields that a workspace can override from a preset.
 */
export interface WorkspaceOverrides {
  id?: string;
  name?: string;
  preset?: string;
  projects?: string[];
  adapters?: AdapterConfig[];
  verification?: WorkspaceVerificationConfig;
  authorityPolicy?: {
    canonicalFactRules?: PolicyRule[];
    canonicalEdgeRules?: PolicyRule[];
    ambiguityRules?: PolicyRule[];
    conflictResolution?: {
      priorityRange?: [number, number];
      defaultPriority?: number;
      samePriorityBehavior?: 'deny-wins' | 'ambiguous';
      conflictingAllowDenyBehavior?: 'deny-wins' | 'ambiguous';
    };
  };
  graphPolicy?: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
  askPolicy?: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
  wikiPolicy?: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface MergedWorkspaceConfig {
  id: string;
  name?: string;
  preset?: string;
  projects: string[];
  adapters: AdapterConfig[];
  policy: PolicyDefaults;
  verification?: WorkspaceVerificationConfig;
}

// ─── Preset Registry ─────────────────────────────────────────────────────────

import { genericCodebase } from './presets/generic-codebase.js';
import { webApi } from './presets/web-api.js';
import { dotnetWebApi } from './presets/dotnet-web-api.js';
import { reactApp } from './presets/react-app.js';
import { nextjsApp } from './presets/nextjs-app.js';
import { nodeService } from './presets/node-service.js';
import { libraryPackage } from './presets/library-package.js';
import { markdownDocs } from './presets/markdown-docs.js';
import { mixedMonorepo } from './presets/mixed-monorepo.js';

const PRESET_REGISTRY: Map<string, Preset> = new Map([
  ['generic-codebase', genericCodebase],
  ['web-api', webApi],
  ['dotnet-web-api', dotnetWebApi],
  ['react-app', reactApp],
  ['nextjs-app', nextjsApp],
  ['node-service', nodeService],
  ['library-package', libraryPackage],
  ['markdown-docs', markdownDocs],
  ['mixed-monorepo', mixedMonorepo],
]);

// ─── Merge Utilities ─────────────────────────────────────────────────────────

/**
 * Override-by-id merge for policy rule arrays.
 * Workspace rules override base rules by matching `id`.
 * Rules with `{ id, disabled: true }` disable the base rule.
 * New workspace rules (not in base) are appended.
 */
function mergeRuleArrays(base: PolicyRule[] | undefined, overrides: PolicyRule[] | undefined): PolicyRule[] | undefined {
  if (!base && !overrides) return undefined;
  if (!base) return overrides;
  if (!overrides) return [...base];

  const result: PolicyRule[] = [];

  for (const baseRule of base) {
    const override = overrides.find((o) => o.id === baseRule.id);
    if (override) {
      // If override disables the rule, skip it entirely
      if (override.disabled) continue;
      // Otherwise merge: override fields win
      result.push({ ...baseRule, ...override });
    } else {
      result.push({ ...baseRule });
    }
  }

  // Append new rules from overrides that don't exist in base
  for (const override of overrides) {
    if (override.disabled) continue; // disabled rules with no base match are just skipped
    if (!base.find((b) => b.id === override.id)) {
      result.push({ ...override });
    }
  }

  return result;
}

/**
 * Merge two PolicyDefaults objects using override-by-id for rule arrays
 * and shallow-merge for object fields (child wins).
 */
function mergePolicies(base: PolicyDefaults, overrides: PolicyDefaults | undefined): PolicyDefaults {
  if (!overrides) return { ...base };

  const result: PolicyDefaults = {};

  // Authority policy
  if (base.authorityPolicy || overrides.authorityPolicy) {
    const baseAuth = base.authorityPolicy ?? {};
    const overAuth = overrides.authorityPolicy ?? {};
    result.authorityPolicy = {
      canonicalFactRules: mergeRuleArrays(baseAuth.canonicalFactRules, overAuth.canonicalFactRules),
      canonicalEdgeRules: mergeRuleArrays(baseAuth.canonicalEdgeRules, overAuth.canonicalEdgeRules),
      ambiguityRules: mergeRuleArrays(baseAuth.ambiguityRules, overAuth.ambiguityRules),
      conflictResolution: overAuth.conflictResolution
        ? { ...baseAuth.conflictResolution, ...overAuth.conflictResolution }
        : baseAuth.conflictResolution
          ? { ...baseAuth.conflictResolution }
          : undefined,
    };
  }

  // Graph policy — shallow merge, override-by-id for rules array
  if (base.graphPolicy || overrides.graphPolicy) {
    const baseGraph = base.graphPolicy ?? {};
    const overGraph = overrides.graphPolicy ?? {};
    result.graphPolicy = {
      ...baseGraph,
      ...overGraph,
      rules: mergeRuleArrays(baseGraph.rules, overGraph.rules),
    };
  }

  // Ask policy — shallow merge, override-by-id for rules array
  if (base.askPolicy || overrides.askPolicy) {
    const baseAsk = base.askPolicy ?? {};
    const overAsk = overrides.askPolicy ?? {};
    result.askPolicy = {
      ...baseAsk,
      ...overAsk,
      rules: mergeRuleArrays(baseAsk.rules, overAsk.rules),
    };
  }

  // Wiki policy — shallow merge, override-by-id for rules array
  if (base.wikiPolicy || overrides.wikiPolicy) {
    const baseWiki = base.wikiPolicy ?? {};
    const overWiki = overrides.wikiPolicy ?? {};
    result.wikiPolicy = {
      ...baseWiki,
      ...overWiki,
      rules: mergeRuleArrays(baseWiki.rules, overWiki.rules),
    };
  }

  return result;
}

/**
 * Merge adapter arrays using override-by-id.
 * Workspace adapters override base adapters by matching `id`.
 */
function mergeAdapters(base: AdapterConfig[], overrides: AdapterConfig[] | undefined): AdapterConfig[] {
  if (!overrides) return [...base];

  const result: AdapterConfig[] = [];

  for (const baseAdapter of base) {
    const override = overrides.find((o) => o.id === baseAdapter.id);
    if (override) {
      result.push({ ...baseAdapter, ...override });
    } else {
      result.push({ ...baseAdapter });
    }
  }

  // Append new adapters from overrides that don't exist in base
  for (const override of overrides) {
    if (!base.find((b) => b.id === override.id)) {
      result.push({ ...override });
    }
  }

  return result;
}

// ─── PresetResolver Class ────────────────────────────────────────────────────

export class PresetResolver {
  private registry: Map<string, Preset>;

  constructor(customPresets?: Map<string, Preset>) {
    this.registry = new Map(PRESET_REGISTRY);
    if (customPresets) {
      for (const [id, preset] of customPresets) {
        this.registry.set(id, preset);
      }
    }
  }

  /**
   * Resolve a preset by ID, following the `extends` chain and merging
   * inherited presets bottom-up. Detects cycles.
   *
   * @throws Error with PipelineError.WORKSPACE_CONFIG_INVALID if preset not found or cycle detected
   */
  resolve(presetId: string): ResolvedPreset {
    const visited = new Set<string>();
    return this._resolve(presetId, visited);
  }

  private _resolve(presetId: string, visited: Set<string>): ResolvedPreset {
    if (visited.has(presetId)) {
      throw new Error(
        `[${PipelineError.WORKSPACE_CONFIG_INVALID}] Cycle detected in preset inheritance: ${[...visited, presetId].join(' → ')}`,
      );
    }

    const preset = this.registry.get(presetId);
    if (!preset) {
      throw new Error(
        `[${PipelineError.WORKSPACE_CONFIG_INVALID}] Preset '${presetId}' not found. Available presets: ${[...this.registry.keys()].join(', ')}`,
      );
    }

    visited.add(presetId);

    // If no parent, this is the base
    if (!preset.extends) {
      return {
        id: preset.id,
        adapters: [...preset.adapters],
        policy: { ...preset.policy },
        verification: preset.verification ? { ...preset.verification } : undefined,
      };
    }

    // Resolve parent first
    const parent = this._resolve(preset.extends, visited);

    // Merge: child overrides parent
    return {
      id: preset.id,
      adapters: mergeAdapters(parent.adapters, preset.adapters),
      policy: mergePolicies(parent.policy, preset.policy),
      verification: preset.verification
        ? parent.verification
          ? { ...parent.verification, ...preset.verification }
          : { ...preset.verification }
        : parent.verification
          ? { ...parent.verification }
          : undefined,
    };
  }

  /**
   * Merge a resolved preset with workspace-level overrides.
   *
   * Merge strategy:
   * - Policy rule arrays: override-by-id (workspace can disable/override specific rules)
   * - Object fields: shallow-merge (workspace wins)
   * - Primitive arrays (e.g. `projects`): full-replace (workspace wins entirely)
   * - Adapters: override-by-id
   */
  merge(base: ResolvedPreset, overrides: WorkspaceOverrides): MergedWorkspaceConfig {
    // Build workspace policy from override fields
    const workspacePolicy: PolicyDefaults = {};
    if (overrides.authorityPolicy) {
      workspacePolicy.authorityPolicy = overrides.authorityPolicy;
    }
    if (overrides.graphPolicy) {
      workspacePolicy.graphPolicy = overrides.graphPolicy;
    }
    if (overrides.askPolicy) {
      workspacePolicy.askPolicy = overrides.askPolicy;
    }
    if (overrides.wikiPolicy) {
      workspacePolicy.wikiPolicy = overrides.wikiPolicy;
    }

    return {
      id: overrides.id ?? base.id,
      name: overrides.name,
      preset: overrides.preset,
      // Primitive arrays: full-replace
      projects: overrides.projects ?? [],
      // Adapters: override-by-id
      adapters: mergeAdapters(base.adapters, overrides.adapters),
      // Policy: override-by-id for rule arrays, shallow-merge for objects
      policy: mergePolicies(base.policy, workspacePolicy),
      // Verification: shallow-merge (workspace wins)
      verification: overrides.verification
        ? base.verification
          ? { ...base.verification, ...overrides.verification }
          : { ...overrides.verification }
        : base.verification
          ? { ...base.verification }
          : undefined,
    };
  }
}

// Export merge utilities for testing
export { mergeRuleArrays, mergePolicies, mergeAdapters };
