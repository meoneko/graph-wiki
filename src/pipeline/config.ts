import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

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
}

export interface WorkspaceVerification {
  require_flows?: boolean;
  required_golden_flows?: string[];
  require_runtime_script_contract?: boolean;
  require_artifact_parity?: boolean;
  min_process_coverage?: number;
}

export interface WorkspaceConfig {
  id: string;
  name?: string;
  profile_mode?: 'bootstrap' | 'configured';
  projects: string[];
  verification?: WorkspaceVerification;
  governance?: {
    authority_chain?: string[];
    forbidden_patterns?: string[];
    reporting?: {
      unknown_token?: string;
      inferred_token?: string;
    };
  };
  rules_path?: string;
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

export interface KnowledgeConfig {
  workspaces: WorkspaceConfig[];
  projects: ProjectConfig[];
  outputs: OutputConfig;
  ai?: AIConfig;
  scheduler?: SchedulerConfig;
}

interface RawKnowledgeConfig {
  workspaces?: WorkspaceConfig[];
  projects?: Record<string, Omit<ProjectConfig, 'id'>> | ProjectConfig[];
  outputs?: Partial<OutputConfig>;
  ai?: AIConfig;
  scheduler?: SchedulerConfig;
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
  };
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
  };

  // Load local override (knowledge.config.local.yaml) — gitignored, never committed
  const localPath = configPath.replace(/\.yaml$/, '.local.yaml');
  try {
    const localRaw = await readFile(localPath, 'utf-8');
    const localParsed = YAML.parse(localRaw) as RawKnowledgeConfig;
    return mergeLocalConfig(base, localParsed);
  } catch {
    // No local override — use base as-is
    return base;
  }
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
