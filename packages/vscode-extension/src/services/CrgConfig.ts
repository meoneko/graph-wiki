import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { parse } from 'yaml';

export interface CrgContext {
  serverPath: string;
  serverCwd?: string;
  workspaceId: string;
  projectId?: string;
  maxItems: number;
  workspaceFolder?: vscode.WorkspaceFolder;
}

export interface WorkspaceCandidate {
  id: string;
  label: string;
  folderName: string;
  folderPath: string;
}

export interface SetupSettings {
  serverPath?: string;
  serverCwd?: string;
  workspaceId?: string;
  projectId?: string;
  maxItems?: number;
}

interface KnowledgeConfig {
  workspaces?: Array<{ id?: string; name?: string }>;
}

function config(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('crg');
}

export function configuredString(key: string): string | undefined {
  const value = config().get<string>(key)?.trim();
  return value ? value : undefined;
}

export function configuredMaxItems(): number {
  const value = config().get<number>('maxItems') ?? 50;
  return Math.max(1, Math.min(500, value));
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function firstExisting(paths: string[]): Promise<string | undefined> {
  for (const candidate of paths) {
    if (await pathExists(candidate)) return candidate;
  }
  return undefined;
}

export async function resolveServerPath(extensionPath: string): Promise<string> {
  const explicit = configuredString('serverPath');
  if (explicit) {
    if (await pathExists(explicit)) return explicit;
    throw new Error(`CRG serverPath does not exist: ${explicit}. Update setting crg.serverPath.`);
  }

  const workspaceCandidates = (vscode.workspace.workspaceFolders ?? []).flatMap((folder) => [
    path.join(folder.uri.fsPath, 'dist', 'cli', 'index.js'),
    path.join(folder.uri.fsPath, 'node_modules', 'code-review-graph', 'dist', 'cli', 'index.js'),
  ]);
  const devFallback = path.resolve(extensionPath, '..', '..', 'dist', 'cli', 'index.js');
  const found = await firstExisting([...workspaceCandidates, devFallback]);
  if (found) return found;

  throw new Error(
    'CRG CLI not found. Set VS Code setting crg.serverPath to the built dist/cli/index.js file.',
  );
}

async function readKnowledgeConfig(folder: vscode.WorkspaceFolder): Promise<KnowledgeConfig | undefined> {
  const configPath = path.join(folder.uri.fsPath, 'knowledge.config.yaml');
  if (!(await pathExists(configPath))) return undefined;
  const raw = await fs.promises.readFile(configPath, 'utf8');
  return parse(raw) as KnowledgeConfig;
}

export async function loadWorkspaceCandidates(): Promise<WorkspaceCandidate[]> {
  const candidates: WorkspaceCandidate[] = [];
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const cfg = await readKnowledgeConfig(folder);
    for (const workspace of cfg?.workspaces ?? []) {
      if (!workspace.id) continue;
      candidates.push({
        id: workspace.id,
        label: workspace.name ? `${workspace.id} - ${workspace.name}` : workspace.id,
        folderName: folder.name,
        folderPath: folder.uri.fsPath,
      });
    }
  }
  return candidates;
}

export function getSetupSettings(): Required<Pick<SetupSettings, 'serverPath' | 'serverCwd' | 'workspaceId' | 'projectId' | 'maxItems'>> {
  return {
    serverPath: configuredString('serverPath') ?? '',
    serverCwd: configuredString('serverCwd') ?? '',
    workspaceId: configuredString('workspaceId') ?? '',
    projectId: configuredString('projectId') ?? '',
    maxItems: configuredMaxItems(),
  };
}

export async function saveSetupSettings(settings: SetupSettings): Promise<void> {
  const cfg = config();
  if (settings.serverPath !== undefined) {
    await cfg.update('serverPath', settings.serverPath.trim(), vscode.ConfigurationTarget.Global);
  }
  if (settings.serverCwd !== undefined) {
    await cfg.update('serverCwd', settings.serverCwd.trim(), vscode.ConfigurationTarget.Global);
  }
  if (settings.workspaceId !== undefined) {
    await cfg.update('workspaceId', settings.workspaceId.trim(), vscode.ConfigurationTarget.Workspace);
  }
  if (settings.projectId !== undefined) {
    await cfg.update('projectId', settings.projectId.trim(), vscode.ConfigurationTarget.Workspace);
  }
  if (settings.maxItems !== undefined) {
    await cfg.update('maxItems', Math.max(1, Math.min(500, settings.maxItems)), vscode.ConfigurationTarget.Workspace);
  }
}

export async function resolveWorkspaceId(): Promise<{ workspaceId: string; workspaceFolder?: vscode.WorkspaceFolder }> {
  const explicit = configuredString('workspaceId');
  if (explicit) return { workspaceId: explicit };

  const rawCandidates = await loadWorkspaceCandidates();
  const candidates = rawCandidates.map((candidate) => ({
    ...candidate,
    folder: vscode.workspace.workspaceFolders?.find((folder) => folder.uri.fsPath === candidate.folderPath),
  })).filter((candidate): candidate is typeof candidate & { folder: vscode.WorkspaceFolder } => Boolean(candidate.folder));

  if (candidates.length === 1) {
    return { workspaceId: candidates[0].id, workspaceFolder: candidates[0].folder };
  }

  if (candidates.length > 1) {
    const picked = await vscode.window.showQuickPick(
      candidates.map((candidate) => ({
        label: candidate.label,
        description: candidate.folder.name,
        candidate,
      })),
      { title: 'Select Code Review Graph workspace' },
    );
    if (!picked) throw new Error('No CRG workspace selected.');
    await config().update('workspaceId', picked.candidate.id, vscode.ConfigurationTarget.Workspace);
    return { workspaceId: picked.candidate.id, workspaceFolder: picked.candidate.folder };
  }

  throw new Error('No CRG workspace found. Set crg.workspaceId or add knowledge.config.yaml to the workspace.');
}

export function resolveProjectId(): string | undefined {
  return configuredString('projectId');
}

export function resolveServerCwdSetting(): string | undefined {
  return configuredString('serverCwd');
}

export async function resolveCrgContext(extensionPath: string): Promise<CrgContext> {
  const [serverPath, workspace] = await Promise.all([
    resolveServerPath(extensionPath),
    resolveWorkspaceId(),
  ]);
  return {
    serverPath,
    serverCwd: resolveServerCwdSetting(),
    workspaceId: workspace.workspaceId,
    workspaceFolder: workspace.workspaceFolder,
    projectId: resolveProjectId(),
    maxItems: configuredMaxItems(),
  };
}
