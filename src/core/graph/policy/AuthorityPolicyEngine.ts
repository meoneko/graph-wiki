/**
 * AuthorityPolicyEngine — governs canonical fact eligibility, conflict resolution,
 * and ambiguity handling via YAML-based policy configuration.
 *
 * Policy Source: knowledge.config.yaml governance section.
 * Merge Semantics: workspace > preset > base defaults (override-by-id).
 *
 * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { DecisionStatus } from '../../errors.js';
import type { NormalizedFact, ReasoningPath, TrustLevel } from '../../types.js';

// ─── Policy Interfaces ───────────────────────────────────────────────────────

export interface CanonicalFactRule {
  id: string;
  effect: 'allow' | 'deny';
  factKind: string;
  requiredExtractionMethods?: string[];
  requiredProvenance?: boolean;
  minConfidence?: number;
  allowedSourceRoots?: string[];
  disallowedPatterns?: string[];
  priority?: number; // 0-100, default 50
  reason?: string;
}

export interface CanonicalEdgeRule {
  id: string;
  effect: 'allow' | 'deny';
  edgeKind: string;
  sourceKind?: string;
  targetKind?: string;
  requiredProvenance?: boolean;
  minConfidence?: number;
  allowedSourceRoots?: string[];
  priority?: number; // 0-100, default 50
  reason?: string;
}

export interface AmbiguityRule {
  id: string;
  factKind?: string;
  edgeKind?: string;
  condition: string;
  priority?: number;
  reason: string;
}

export interface ConflictResolutionPolicy {
  priorityRange: [number, number];
  defaultPriority: number;
  samePriorityBehavior: 'deny-wins' | 'ambiguous';
  conflictingAllowDenyBehavior: 'deny-wins' | 'ambiguous';
}

export interface AuthorityPolicy {
  version: string;
  canonicalFactRules: CanonicalFactRule[];
  canonicalEdgeRules: CanonicalEdgeRule[];
  ambiguityRules: AmbiguityRule[];
  conflictResolution: ConflictResolutionPolicy;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface Evidence {
  id: string;
  type: 'canonical' | 'derived' | 'exploratory' | 'external';
  source: string;
  confidence: number;
  provenance?: {
    file?: string;
    line_start?: number;
    line_end?: number;
    extraction_method?: string;
  };
}

export interface ConflictResolution {
  status: typeof DecisionStatus.OK | typeof DecisionStatus.AMBIGUOUS;
  selectedPaths: ReasoningPath[];
  conflictingPaths?: ReasoningPath[];
  reason: string;
}

export interface PromotionDecision {
  approved: boolean;
  reason: string;
  requiredEvidence: string[];
  providedEvidence: string[];
  missingEvidence: string[];
}

// ─── Default Policy ──────────────────────────────────────────────────────────

const DEFAULT_CONFLICT_RESOLUTION: ConflictResolutionPolicy = {
  priorityRange: [0, 100],
  defaultPriority: 50,
  samePriorityBehavior: 'deny-wins',
  conflictingAllowDenyBehavior: 'deny-wins',
};

const DEFAULT_POLICY: AuthorityPolicy = {
  version: '1.0.0',
  canonicalFactRules: [
    {
      id: 'require-parser-provenance',
      effect: 'allow',
      factKind: '*',
      requiredExtractionMethods: ['ast', 'static-analysis'],
      requiredProvenance: true,
      minConfidence: 0.7,
      priority: 50,
      reason: 'Canonical facts require parser-backed extraction with provenance',
    },
    {
      id: 'deny-ai-canonical',
      effect: 'deny',
      factKind: '*',
      requiredExtractionMethods: ['ai'],
      priority: 90,
      reason: 'AI-extracted facts cannot be canonical',
    },
  ],
  canonicalEdgeRules: [
    {
      id: 'require-edge-provenance',
      effect: 'allow',
      edgeKind: '*',
      requiredProvenance: true,
      minConfidence: 0.7,
      priority: 50,
      reason: 'Canonical edges require provenance',
    },
  ],
  ambiguityRules: [],
  conflictResolution: DEFAULT_CONFLICT_RESOLUTION,
};

// ─── Merge Utilities ─────────────────────────────────────────────────────────

/**
 * Override-by-id merge for rule arrays.
 * Workspace rules override base rules by matching `id`.
 * Rules with `disabled: true` are removed.
 */
function mergeRules<T extends { id: string; disabled?: boolean }>(
  base: T[],
  overrides: T[] | undefined,
): T[] {
  if (!overrides || overrides.length === 0) return [...base];

  const result: T[] = [];

  for (const baseRule of base) {
    const override = overrides.find((o) => o.id === baseRule.id);
    if (override) {
      if ((override as { disabled?: boolean }).disabled) continue;
      result.push({ ...baseRule, ...override });
    } else {
      result.push({ ...baseRule });
    }
  }

  // Append new rules from overrides that don't exist in base
  for (const override of overrides) {
    if ((override as { disabled?: boolean }).disabled) continue;
    if (!base.find((b) => b.id === override.id)) {
      result.push({ ...override });
    }
  }

  return result;
}

// ─── YAML Policy Loader ──────────────────────────────────────────────────────

interface YamlGovernanceSection {
  authority_policy?: {
    version?: string;
    canonical_fact_rules?: Array<Record<string, unknown>>;
    canonical_edge_rules?: Array<Record<string, unknown>>;
    ambiguity_rules?: Array<Record<string, unknown>>;
    conflict_resolution?: Record<string, unknown>;
  };
}

interface YamlConfig {
  workspaces?: Array<{
    id?: string;
    governance?: YamlGovernanceSection;
    authorityPolicy?: Record<string, unknown>;
  }>;
  governance?: YamlGovernanceSection;
}

function parseFactRule(raw: Record<string, unknown>): CanonicalFactRule {
  return {
    id: String(raw.id ?? ''),
    effect: (raw.effect as 'allow' | 'deny') ?? 'allow',
    factKind: String(raw.factKind ?? raw.fact_kind ?? '*'),
    requiredExtractionMethods: raw.requiredExtractionMethods as string[] | undefined
      ?? raw.required_extraction_methods as string[] | undefined,
    requiredProvenance: raw.requiredProvenance as boolean | undefined
      ?? raw.required_provenance as boolean | undefined,
    minConfidence: raw.minConfidence as number | undefined
      ?? raw.min_confidence as number | undefined,
    allowedSourceRoots: raw.allowedSourceRoots as string[] | undefined
      ?? raw.allowed_source_roots as string[] | undefined,
    disallowedPatterns: raw.disallowedPatterns as string[] | undefined
      ?? raw.disallowed_patterns as string[] | undefined,
    priority: raw.priority as number | undefined,
    reason: raw.reason as string | undefined,
  };
}

function parseEdgeRule(raw: Record<string, unknown>): CanonicalEdgeRule {
  return {
    id: String(raw.id ?? ''),
    effect: (raw.effect as 'allow' | 'deny') ?? 'allow',
    edgeKind: String(raw.edgeKind ?? raw.edge_kind ?? '*'),
    sourceKind: raw.sourceKind as string | undefined ?? raw.source_kind as string | undefined,
    targetKind: raw.targetKind as string | undefined ?? raw.target_kind as string | undefined,
    requiredProvenance: raw.requiredProvenance as boolean | undefined
      ?? raw.required_provenance as boolean | undefined,
    minConfidence: raw.minConfidence as number | undefined
      ?? raw.min_confidence as number | undefined,
    allowedSourceRoots: raw.allowedSourceRoots as string[] | undefined
      ?? raw.allowed_source_roots as string[] | undefined,
    priority: raw.priority as number | undefined,
    reason: raw.reason as string | undefined,
  };
}

function parseAmbiguityRule(raw: Record<string, unknown>): AmbiguityRule {
  return {
    id: String(raw.id ?? ''),
    factKind: raw.factKind as string | undefined ?? raw.fact_kind as string | undefined,
    edgeKind: raw.edgeKind as string | undefined ?? raw.edge_kind as string | undefined,
    condition: String(raw.condition ?? ''),
    priority: raw.priority as number | undefined,
    reason: String(raw.reason ?? ''),
  };
}

function parseConflictResolution(raw: Record<string, unknown> | undefined): ConflictResolutionPolicy {
  if (!raw) return { ...DEFAULT_CONFLICT_RESOLUTION };
  return {
    priorityRange: (raw.priorityRange ?? raw.priority_range ?? [0, 100]) as [number, number],
    defaultPriority: (raw.defaultPriority ?? raw.default_priority ?? 50) as number,
    samePriorityBehavior: (raw.samePriorityBehavior ?? raw.same_priority_behavior ?? 'deny-wins') as 'deny-wins' | 'ambiguous',
    conflictingAllowDenyBehavior: (raw.conflictingAllowDenyBehavior ?? raw.conflicting_allow_deny_behavior ?? 'deny-wins') as 'deny-wins' | 'ambiguous',
  };
}

function loadPolicyFromGovernance(governance: YamlGovernanceSection | undefined): Partial<AuthorityPolicy> {
  if (!governance?.authority_policy) return {};

  const ap = governance.authority_policy;
  const result: Partial<AuthorityPolicy> = {};

  if (ap.version) result.version = ap.version;
  if (ap.canonical_fact_rules) {
    result.canonicalFactRules = ap.canonical_fact_rules.map(parseFactRule);
  }
  if (ap.canonical_edge_rules) {
    result.canonicalEdgeRules = ap.canonical_edge_rules.map(parseEdgeRule);
  }
  if (ap.ambiguity_rules) {
    result.ambiguityRules = ap.ambiguity_rules.map(parseAmbiguityRule);
  }
  if (ap.conflict_resolution) {
    result.conflictResolution = parseConflictResolution(ap.conflict_resolution);
  }

  return result;
}

// ─── AuthorityPolicyEngine Class ─────────────────────────────────────────────

export class AuthorityPolicyEngine {
  private policy: AuthorityPolicy;

  constructor(policyPath?: string) {
    this.policy = { ...DEFAULT_POLICY };

    if (policyPath) {
      this.loadFromYaml(policyPath);
    }
  }

  /**
   * Load policy from a YAML config file (knowledge.config.yaml).
   * Merges loaded policy on top of base defaults using override-by-id.
   */
  private loadFromYaml(policyPath: string): void {
    let raw: string;
    try {
      raw = readFileSync(policyPath, 'utf-8');
    } catch {
      // If file doesn't exist, keep defaults
      return;
    }

    const parsed = YAML.parse(raw) as YamlConfig;
    const governance = parsed?.governance;
    const loaded = loadPolicyFromGovernance(governance);

    this.mergePolicy(loaded);
  }

  /**
   * Merge an external policy (from preset or workspace) on top of current policy.
   * Uses override-by-id for rule arrays.
   */
  mergePolicy(overrides: Partial<AuthorityPolicy>): void {
    if (overrides.version) {
      this.policy.version = overrides.version;
    }
    if (overrides.canonicalFactRules) {
      this.policy.canonicalFactRules = mergeRules(
        this.policy.canonicalFactRules,
        overrides.canonicalFactRules,
      );
    }
    if (overrides.canonicalEdgeRules) {
      this.policy.canonicalEdgeRules = mergeRules(
        this.policy.canonicalEdgeRules,
        overrides.canonicalEdgeRules,
      );
    }
    if (overrides.ambiguityRules) {
      this.policy.ambiguityRules = mergeRules(
        this.policy.ambiguityRules,
        overrides.ambiguityRules,
      );
    }
    if (overrides.conflictResolution) {
      this.policy.conflictResolution = {
        ...this.policy.conflictResolution,
        ...overrides.conflictResolution,
      };
    }
  }

  /**
   * Get the current effective policy (for inspection/testing).
   */
  getPolicy(): Readonly<AuthorityPolicy> {
    return this.policy;
  }

  // ─── Core Methods ────────────────────────────────────────────────────────

  /**
   * Evaluate whether a normalized fact is eligible for canonical status.
   *
   * Evaluation order:
   * 1. Collect all matching rules (by factKind) sorted by priority (highest first)
   * 2. If rules have opposing effects (allow vs deny):
   *    → Apply `conflictingAllowDenyBehavior` first
   * 3. If rules have the same effect but conflict semantically:
   *    → Apply `samePriorityBehavior` as fallback
   * 4. If only one effect type matches, apply that effect directly
   */
  isCanonicalEligible(fact: NormalizedFact): boolean {
    const rules = this.getMatchingFactRules(fact);

    if (rules.length === 0) {
      // No rules match — default deny (fail-closed)
      return false;
    }

    // Separate rules by effect
    const allowRules = rules.filter((r) => r.effect === 'allow');
    const denyRules = rules.filter((r) => r.effect === 'deny');

    // Case 1: Only allow rules match
    if (denyRules.length === 0 && allowRules.length > 0) {
      // Check if any allow rule's conditions are satisfied
      return allowRules.some((rule) => this.factSatisfiesRule(fact, rule));
    }

    // Case 2: Only deny rules match
    if (allowRules.length === 0 && denyRules.length > 0) {
      // If any deny rule matches the fact's characteristics, deny
      return !denyRules.some((rule) => this.factSatisfiesRule(fact, rule));
    }

    // Case 3: Both allow and deny rules exist — conflicting effects
    // Apply conflictingAllowDenyBehavior FIRST
    const matchingAllows = allowRules.filter((r) => this.factSatisfiesRule(fact, r));
    const matchingDenies = denyRules.filter((r) => this.factSatisfiesRule(fact, r));

    if (matchingAllows.length > 0 && matchingDenies.length > 0) {
      // Conflicting allow/deny effects — use conflictingAllowDenyBehavior
      if (this.policy.conflictResolution.conflictingAllowDenyBehavior === 'deny-wins') {
        return false;
      }
      // 'ambiguous' — compare priorities
      const highestAllow = Math.max(...matchingAllows.map((r) => r.priority ?? this.policy.conflictResolution.defaultPriority));
      const highestDeny = Math.max(...matchingDenies.map((r) => r.priority ?? this.policy.conflictResolution.defaultPriority));

      if (highestDeny > highestAllow) return false;
      if (highestAllow > highestDeny) return true;

      // Same priority — fall through to samePriorityBehavior
      if (this.policy.conflictResolution.samePriorityBehavior === 'deny-wins') {
        return false;
      }
      // 'ambiguous' at same priority — deny (fail-closed)
      return false;
    }

    // Only one side has matching rules
    if (matchingDenies.length > 0) return false;
    if (matchingAllows.length > 0) return true;

    // No rules matched conditions — default deny (fail-closed)
    return false;
  }

  /**
   * Resolve conflicts between multiple reasoning paths.
   * Returns AMBIGUOUS with both traces when paths lead to conflicting conclusions.
   */
  resolveConflict(paths: ReasoningPath[]): ConflictResolution {
    if (paths.length === 0) {
      return {
        status: DecisionStatus.OK,
        selectedPaths: [],
        reason: 'No paths to resolve',
      };
    }

    if (paths.length === 1) {
      return {
        status: DecisionStatus.OK,
        selectedPaths: paths,
        reason: 'Single path — no conflict',
      };
    }

    // Check for conflicting conclusions by comparing path statuses and trust levels
    const hasConflict = this.detectConflict(paths);

    if (!hasConflict) {
      return {
        status: DecisionStatus.OK,
        selectedPaths: paths,
        reason: 'All paths agree — no conflict detected',
      };
    }

    // Conflicting paths — return AMBIGUOUS with both traces
    return {
      status: DecisionStatus.AMBIGUOUS,
      selectedPaths: paths,
      conflictingPaths: paths,
      reason: 'Multiple reasoning paths lead to conflicting conclusions',
    };
  }

  /**
   * Evaluate whether a fact can be promoted from exploratory/derived to canonical.
   * Requires independent canonical or derived evidence plus explicit approval.
   */
  evaluatePromotion(fact: NormalizedFact, evidence: Evidence[]): PromotionDecision {
    const requiredEvidence: string[] = [
      'independent_canonical_or_derived_source',
      'parser_backed_extraction',
      'provenance_complete',
    ];

    const providedEvidence: string[] = [];
    const missingEvidence: string[] = [];

    // Check for independent canonical or derived evidence
    const hasCanonicalEvidence = evidence.some(
      (e) => e.type === 'canonical' || e.type === 'derived',
    );
    if (hasCanonicalEvidence) {
      providedEvidence.push('independent_canonical_or_derived_source');
    } else {
      missingEvidence.push('independent_canonical_or_derived_source');
    }

    // Check for parser-backed extraction
    const hasParserEvidence = evidence.some(
      (e) =>
        e.provenance?.extraction_method === 'ast' ||
        e.provenance?.extraction_method === 'static-analysis',
    );
    if (hasParserEvidence) {
      providedEvidence.push('parser_backed_extraction');
    } else {
      missingEvidence.push('parser_backed_extraction');
    }

    // Check for complete provenance
    const hasProvenance = evidence.some(
      (e) => e.provenance?.file && e.provenance?.line_start != null,
    );
    if (hasProvenance) {
      providedEvidence.push('provenance_complete');
    } else {
      missingEvidence.push('provenance_complete');
    }

    // Promotion requires ALL evidence types
    const approved = missingEvidence.length === 0;

    return {
      approved,
      reason: approved
        ? 'All required evidence provided — promotion approved'
        : `Missing required evidence: ${missingEvidence.join(', ')}`,
      requiredEvidence,
      providedEvidence,
      missingEvidence,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Get all rules that match a fact's kind (including wildcard '*' rules).
   * Sorted by priority descending (highest priority first).
   */
  private getMatchingFactRules(fact: NormalizedFact): CanonicalFactRule[] {
    const factKind = fact.candidate_type ?? '';

    return this.policy.canonicalFactRules
      .filter((rule) => rule.factKind === '*' || rule.factKind === factKind)
      .sort((a, b) => {
        const pa = a.priority ?? this.policy.conflictResolution.defaultPriority;
        const pb = b.priority ?? this.policy.conflictResolution.defaultPriority;
        return pb - pa; // Descending
      });
  }

  /**
   * Check if a fact satisfies a rule's conditions.
   * A rule matches if ALL specified conditions are met.
   */
  private factSatisfiesRule(fact: NormalizedFact, rule: CanonicalFactRule): boolean {
    // Check extraction method requirement
    if (rule.requiredExtractionMethods && rule.requiredExtractionMethods.length > 0) {
      const extractor = String(fact.extractor ?? '').toLowerCase();
      const langExtractor = String(fact.lang_meta?.extractor ?? '').toLowerCase();
      const factMethod = extractor || langExtractor;

      const methodMatches = rule.requiredExtractionMethods.some((method) => {
        const m = method.toLowerCase();
        // Map common extractor names to method categories
        if (m === 'ast' || m === 'static-analysis') {
          return factMethod.includes('tree_sitter') ||
            factMethod.includes('treesitter') ||
            factMethod.includes('ast') ||
            factMethod.includes('parser') ||
            factMethod.includes('static');
        }
        if (m === 'ai') {
          return factMethod.includes('ai') ||
            factMethod.includes('llm') ||
            factMethod.includes('gpt') ||
            factMethod.includes('gemini');
        }
        if (m === 'regex') {
          return factMethod.includes('regex');
        }
        if (m === 'doc-parse') {
          return factMethod.includes('doc') || factMethod.includes('markdown');
        }
        return factMethod.includes(m);
      });

      if (!methodMatches) return false;
    }

    // Check provenance requirement
    if (rule.requiredProvenance) {
      const hasProvenance = fact.evidence && fact.evidence.length > 0 &&
        fact.evidence.some((e) => e.source_file && e.line_start != null);
      if (!hasProvenance) return false;
    }

    // Check minimum confidence
    if (rule.minConfidence != null) {
      // Use lang_meta confidence_score or default to 0.5
      const factConfidence = (fact.lang_meta?.confidence_score as number | undefined) ?? 0.5;
      if (factConfidence < rule.minConfidence) return false;
    }

    // Check allowed source roots
    if (rule.allowedSourceRoots && rule.allowedSourceRoots.length > 0) {
      const sourceFile = fact.source_file ?? '';
      const inAllowedRoot = rule.allowedSourceRoots.some((root) =>
        sourceFile.startsWith(root),
      );
      if (!inAllowedRoot) return false;
    }

    // Check disallowed patterns
    if (rule.disallowedPatterns && rule.disallowedPatterns.length > 0) {
      const sourceFile = fact.source_file ?? '';
      const symbol = fact.symbol ?? '';
      const matchesDisallowed = rule.disallowedPatterns.some((pattern) => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(sourceFile) || regex.test(symbol);
        } catch {
          return false;
        }
      });
      if (matchesDisallowed) return false;
    }

    return true;
  }

  /**
   * Detect whether paths have conflicting conclusions.
   * Paths conflict when they have different statuses or different trust levels
   * that would lead to contradictory answers.
   */
  private detectConflict(paths: ReasoningPath[]): boolean {
    if (paths.length <= 1) return false;

    // Check for status conflicts
    const statuses = new Set(paths.map((p) => p.status));
    if (statuses.size > 1) return true;

    // Check for trust level conflicts that indicate contradictory conclusions
    const trustLevels = new Set(paths.map((p) => p.trust_level));
    if (trustLevels.has('AUTHORITATIVE') && trustLevels.has('EXPLORATORY')) {
      return true;
    }

    // Check for paths that reach different terminal nodes (contradictory conclusions)
    if (paths.length >= 2) {
      const terminalNodes = paths.map((p) => {
        const lastNode = p.nodes[p.nodes.length - 1];
        return lastNode?.id;
      });
      const uniqueTerminals = new Set(terminalNodes.filter(Boolean));
      if (uniqueTerminals.size > 1) return true;
    }

    return false;
  }
}
