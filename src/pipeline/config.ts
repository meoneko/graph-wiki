import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { PresetResolver, type AdapterConfig, type PolicyRule } from './PresetResolver.js';

export type { AdapterConfig, PolicyRule } from './PresetResolver.js';

export interface ProjectRules {
  extract?: string[];
  path_hints?: Record<string, string[]>;
  emphasis?: string[];
  classify?: Record<string, unknown>;
}

export interface ProjectConfig {
  id: string;
  enabled?: boolean;
  path: string;
  description?: string;
  sources?: {
    include?: string[];
    exclude?: string[];
  };
  rules?: ProjectRules;
  expectation?: 'optional' | 'required';
  extract_partial_methods?: boolean;
}

export interface WorkspaceVerification {
  require_flows?: boolean;
  required_golden_flows?: string[];
  require_runtime_script_contract?: boolean;
  require_artifact_parity?: boolean;
  min_process_coverage?: number;
}

// ─── Policy Config Interfaces ────────────────────────────────────────────────

/**
 * Authority policy configuration for canonical fact eligibility,
 * conflict resolution, and ambiguity handling.
 */
export interface AuthorityPolicyConfig {
  canonicalFactRules?: PolicyRule[];
  canonicalEdgeRules?: PolicyRule[];
  ambiguityRules?: PolicyRule[];
  conflictResolution?: {
    priorityRange?: [number, number];
    defaultPriority?: number;
    samePriorityBehavior?: 'deny-wins' | 'ambiguous';
    conflictingAllowDenyBehavior?: 'deny-wins' | 'ambiguous';
  };
}

/**
 * Graph policy configuration for graph-level rules.
 */
export interface GraphPolicyConfig {
  rules?: PolicyRule[];
  [key: string]: unknown;
}

/**
 * Ask policy configuration for structured ask engine rules.
 */
export interface AskPolicyConfig {
  rules?: PolicyRule[];
  [key: string]: unknown;
}

/**
 * Wiki policy configuration for wiki builder rules.
 */
export interface WikiPolicyConfig {
  rules?: PolicyRule[];
  [key: string]: unknown;
}

// ─── Governance Config ───────────────────────────────────────────────────────

/**
 * A forbidden traversal pattern between node types.
 * Configured per workspace policy (not hardcoded in the platform kernel).
 */
export interface ForbiddenPattern {
  id: string;
  from_type: string;
  to_type: string;
  via_edge?: string;
  description: string;
}

/**
 * Governance configuration for authority chains, forbidden patterns,
 * critical flows, and reporting tokens.
 */
export interface GovernanceConfig {
  authority_chain?: string[];
  forbidden_patterns?: ForbiddenPattern[];
  critical_flows?: string[];
  reporting?: {
    unknown_token?: string;
    inferred_token?: string;
  };
}

// ─── Workspace Config ────────────────────────────────────────────────────────

/**
 * Workspace configuration defining source roots, language adapters,
 * policy settings, and verification requirements.
 *
 * `profile_mode` semantics:
 * - `bootstrap`: Initial indexing mode. Relaxes validation to allow
 *   exploratory-first classification. All facts default to exploratory
 *   unless explicitly promoted. Useful for first-time workspace onboarding
 *   where canonical evidence hasn't been established yet.
 * - `configured`: Normal operation mode. Full validation rules apply.
 *   Canonical promotion requires policy compliance. This is the default
 *   when `profile_mode` is omitted.
 */
export interface WorkspaceConfig {
  id: string;
  name?: string;
  preset?: string;
  profile_mode?: 'bootstrap' | 'configured';
  projects: string[];
  adapters?: AdapterConfig[];
  verification?: WorkspaceVerification;
  external_workflow_enabled?: boolean;
  governance?: GovernanceConfig;
  rules_path?: string;
  /** Authority policy — resolved via PresetResolver into effective config */
  authorityPolicy?: AuthorityPolicyConfig;
  /** Graph policy — resolved via PresetResolver into effective config */
  graphPolicy?: GraphPolicyConfig;
  /** Ask policy — resolved via PresetResolver into effective config */
  askPolicy?: AskPolicyConfig;
  /** Wiki policy — resolved via PresetResolver into effective config */
  wikiPolicy?: WikiPolicyConfig;
}

export interface OutputConfig {
  source_root: string;
  state_root: string;
  records_root: string;
  wiki_root: string;
  index_root: string;
  reports_root: string;
}

export interface AIConfig {
  provider?: string;
  model_extract?: string;
  model_build?: string;
  model_query?: string;
  api_key_env?: string;
  max_chunk_chars?: number;
  temperature?: number;
}

export interface SchedulerJob {
  name: string;
  command: string;
  cron: string;
}

export interface SchedulerConfig {
  enabled?: boolean;
  jobs?: SchedulerJob[];
  reporting?: {
    unknown_token?: string;
    inferred_token?: string;
  };
}

// ─── MCP Config ──────────────────────────────────────────────────────────────

/**
 * MCP tool filtering configuration.
 * - `allow`: if non-empty, only these tools are exposed (allowlist).
 * - `deny`: tools to exclude (applied after allow filter).
 * Empty arrays or omitted fields mean no filtering (all tools remain).
 */
export interface McpToolFilterConfig {
  allow?: string[];
  deny?: string[];
}

/**
 * MCP server configuration block.
 */
export interface McpConfig {
  tools?: McpToolFilterConfig;
}

// ─── Community Config ─────────────────────────────────────────────────────────

/**
 * Community detection configuration.
 * - `max_size`: maximum number of nodes in a community before splitting (default: 50).
 */
export interface CommunityConfig {
  max_size?: number;
}

export interface KnowledgeConfig {
  workspaces: WorkspaceConfig[];
  projects: ProjectConfig[];
  outputs: OutputConfig;
  ai?: AIConfig;
  scheduler?: SchedulerConfig;
  mcp?: McpConfig;
  community?: CommunityConfig;
}

interface RawKnowledgeConfig {
  workspaces?: WorkspaceConfig[];
  projects?: Record<string, Omit<ProjectConfig, 'id'>> | ProjectConfig[];
  outputs?: Partial<OutputConfig>;
  ai?: AIConfig;
  scheduler?: SchedulerConfig;
  mcp?: McpConfig;
  community?: CommunityConfig;
}

const DEFAULT_OUTPUTS: OutputConfig = {
  source_root: './knowledge/sources',
  state_root: './knowledge/artifacts/internal/state',
  records_root: './knowledge/artifacts/internal/records',
  wiki_root: './knowledge/wiki',
  index_root: './knowledge/artifacts/internal/index',
  reports_root: './knowledge/reports',
};

function toProjectArray(projects: RawKnowledgeConfig['projects']): ProjectConfig[] {
  if (!projects) return [];
  if (Array.isArray(projects)) return projects;
  return Object.entries(projects).map(([id, value]) => ({ id, ...value }));
}

function mergeLocalConfig(base: KnowledgeConfig, local: RawKnowledgeConfig): KnowledgeConfig {
  const localProjects = toProjectArray(local.projects);

  // workspaces: local fully replaces base if present
  const workspaces = local.workspaces ?? base.workspaces;

  // projects: per-project shallow merge (local wins per field), plus local-only projects appended
  const merged = base.projects.map((p) => {
    const override = localProjects.find((lp) => lp.id === p.id);
    return override ? { ...p, ...override } : p;
  });
  const added = localProjects.filter((lp) => !base.projects.some((p) => p.id === lp.id));

  return {
    workspaces,
    projects: [...merged, ...added],
    outputs: local.outputs ? { ...base.outputs, ...local.outputs } : base.outputs,
    ai: local.ai ? { ...base.ai, ...local.ai } : base.ai,
    scheduler: local.scheduler ?? base.scheduler,
    mcp: local.mcp ?? base.mcp,
    community: local.community ?? base.community,
  };
}

/**
 * Resolves preset-based effective config for each workspace.
 * When a workspace specifies a `preset`, the PresetResolver resolves the
 * preset (following inheritance chains) and merges workspace-level overrides
 * on top. Fields not overridden by the workspace inherit from the preset.
 */
function resolveWorkspacePresets(config: KnowledgeConfig): KnowledgeConfig {
  const resolver = new PresetResolver();

  const resolvedWorkspaces = config.workspaces.map((ws) => {
    if (!ws.preset) return ws;

    // Resolve the preset (follows extends chain)
    const resolved = resolver.resolve(ws.preset);

    // Merge workspace overrides on top of resolved preset
    const merged = resolver.merge(resolved, {
      id: ws.id,
      name: ws.name,
      preset: ws.preset,
      projects: ws.projects,
      adapters: ws.adapters,
      verification: ws.verification,
      authorityPolicy: ws.authorityPolicy,
      graphPolicy: ws.graphPolicy,
      askPolicy: ws.askPolicy,
      wikiPolicy: ws.wikiPolicy,
    });

    // Reconstruct WorkspaceConfig with effective values from preset merge
    return {
      ...ws,
      adapters: merged.adapters,
      verification: merged.verification,
      // Spread policy from merged result back into workspace-level fields
      authorityPolicy: merged.policy.authorityPolicy
        ? {
            canonicalFactRules: merged.policy.authorityPolicy.canonicalFactRules,
            canonicalEdgeRules: merged.policy.authorityPolicy.canonicalEdgeRules,
            ambiguityRules: merged.policy.authorityPolicy.ambiguityRules,
            conflictResolution: merged.policy.authorityPolicy.conflictResolution,
          }
        : ws.authorityPolicy,
      graphPolicy: merged.policy.graphPolicy
        ? { ...merged.policy.graphPolicy }
        : ws.graphPolicy,
      askPolicy: merged.policy.askPolicy
        ? { ...merged.policy.askPolicy }
        : ws.askPolicy,
      wikiPolicy: merged.policy.wikiPolicy
        ? { ...merged.policy.wikiPolicy }
        : ws.wikiPolicy,
    } satisfies WorkspaceConfig;
  });

  return { ...config, workspaces: resolvedWorkspaces };
}

export async function loadConfig(configPath = path.resolve(process.cwd(), 'knowledge.config.yaml')): Promise<KnowledgeConfig> {
  const raw = await readFile(configPath, 'utf-8');
  const parsed = YAML.parse(raw) as RawKnowledgeConfig;

  const base: KnowledgeConfig = {
    workspaces: parsed.workspaces ?? [],
    projects: toProjectArray(parsed.projects),
    outputs: { ...DEFAULT_OUTPUTS, ...(parsed.outputs ?? {}) },
    ai: parsed.ai,
    scheduler: parsed.scheduler,
    mcp: parsed.mcp,
    community: parsed.community,
  };

  // Load local override (knowledge.config.local.yaml) — gitignored, never committed
  const localPath = configPath.replace(/\.yaml$/, '.local.yaml');
  let config: KnowledgeConfig;
  try {
    const localRaw = await readFile(localPath, 'utf-8');
    const localParsed = YAML.parse(localRaw) as RawKnowledgeConfig;
    config = mergeLocalConfig(base, localParsed);
  } catch {
    // No local override — use base as-is
    config = base;
  }

  // Validate project-level fields
  for (const project of config.projects) {
    if (project.extract_partial_methods !== undefined && typeof project.extract_partial_methods !== 'boolean') {
      throw new Error(`extract_partial_methods must be a boolean (project: ${project.id})`);
    }
  }

  // Resolve presets: compute effective config for workspaces that specify a preset
  return resolveWorkspacePresets(config);
}

export function getWorkspace(config: KnowledgeConfig, workspaceId: string): WorkspaceConfig {
  const ws = config.workspaces.find((w) => w.id === workspaceId);
  if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
  return ws;
}

export function getWorkspaceProjects(config: KnowledgeConfig, workspaceId: string): ProjectConfig[] {
  const ws = getWorkspace(config, workspaceId);
  return ws.projects
    .map((pid) => {
      const p = config.projects.find((pr) => pr.id === pid);
      if (!p) throw new Error(`Project ${pid} not found in config`);
      return p;
    })
    .filter((p) => p.enabled !== false);
}

export function resolveOutputPath(config: KnowledgeConfig, key: keyof OutputConfig, root = process.cwd()): string {
  return path.resolve(root, config.outputs[key]);
}

export function resolveDbPath(config?: KnowledgeConfig, root = process.cwd()): string {
  if (!config) {
    return path.join(path.resolve(root, DEFAULT_OUTPUTS.state_root), 'graph.db');
  }
  return path.join(resolveOutputPath(config, 'state_root', root), 'graph.db');
}
