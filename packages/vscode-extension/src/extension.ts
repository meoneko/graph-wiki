import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { BlastRadiusPanel } from './panels/BlastRadiusPanel';
import { SetupPanel } from './panels/SetupPanel';
import { FlowsProvider } from './providers/FlowsProvider';
import { CommunitiesProvider } from './providers/CommunitiesProvider';
import { CrgMcpService, resultErrorSummary } from './services/CrgMcpService';
import { getUnifiedDiff } from './services/GitDiff';

let statusBarItem: vscode.StatusBarItem;
let service: CrgMcpService | undefined;
let output: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  output = vscode.window.createOutputChannel('Code Review Graph');
  context.subscriptions.push(output);

  service = new CrgMcpService(context.extensionPath);

  const flowsProvider = new FlowsProvider(service);
  const communitiesProvider = new CommunitiesProvider(service);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('crg.views.flows', flowsProvider),
    vscode.window.registerTreeDataProvider('crg.views.communities', communitiesProvider),
    service.onGraphUpdated(() => {
      flowsProvider.refresh();
      communitiesProvider.refresh();
      vscode.window.showInformationMessage('CRG: Graph data updated.');
    }),
    service,
  );

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'crg.showStats';
  context.subscriptions.push(statusBarItem);
  updateStatusBar('CRG: Initializing...', '$(sync~spin)', 'Connecting to MCP Server');

  const openSetup = (reason?: string) => {
    if (!service) return;
    SetupPanel.render(context.extensionUri, service, reason);
  };

  try {
    const crgContext = await service.connect().then(() => service!.getContext());
    updateStatusBar(`CRG: ${crgContext.workspaceId}`, '$(graph)', 'Code Review Graph is ready');
  } catch (error) {
    const message = setupError(error);
    updateStatusBar('CRG: Setup Required', '$(warning)', message);
    output.appendLine(message);
    openSetup(errorMessage(error));
  }

  const cmdSetup = vscode.commands.registerCommand('crg.openSetup', () => {
    openSetup();
  });

  const cmdOpenSettings = vscode.commands.registerCommand('crg.openSettings', async () => {
    await openCrgSettings();
  });

  const cmdBlastRadius = vscode.commands.registerCommand('crg.showBlastRadius', async (uri?: vscode.Uri) => {
    const targetFile = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!targetFile) {
      vscode.window.showWarningMessage('No active file to show blast radius for.');
      return;
    }
    if (!service) return;
    try {
      await service.getContext();
      BlastRadiusPanel.render(context.extensionUri, targetFile, service);
    } catch (error) {
      vscode.window.showWarningMessage(`CRG setup required: ${errorMessage(error)}`);
      openSetup(errorMessage(error));
    }
  });

  const cmdRebuild = vscode.commands.registerCommand('crg.rebuildGraph', async () => {
    if (!service) return;
    updateStatusBar('CRG: Building...', '$(sync~spin)', 'Building graph...');
    try {
      const crgContext = await service.refreshContext();
      const build = await service.callTool('build_graph', {
        workspaceId: crgContext.workspaceId,
        incremental: false,
      });
      if (build.status !== 'OK' && build.status !== 'PARTIAL') {
        throw new Error(resultErrorSummary(build));
      }
      const postprocess = await service.callTool('run_postprocess', {
        workspaceId: crgContext.workspaceId,
      });
      if (postprocess.status !== 'OK' && postprocess.status !== 'PARTIAL') {
        throw new Error(resultErrorSummary(postprocess));
      }
      flowsProvider.refresh();
      communitiesProvider.refresh();
      updateStatusBar(`CRG: ${crgContext.workspaceId}`, '$(graph)', 'Code Review Graph is ready');
      vscode.window.showInformationMessage(`CRG: Rebuilt graph for ${crgContext.workspaceId}.`);
    } catch (error) {
      vscode.window.showErrorMessage(`CRG Build Failed: ${errorMessage(error)}`);
      updateStatusBar('CRG: Error', '$(error)', 'Build failed');
      openSetupIfSetupError(error, openSetup);
    }
  });

  const cmdStats = vscode.commands.registerCommand('crg.showStats', async () => {
    if (!service) return;
    try {
      const crgContext = await service.getContext();
      const stats = await service.callTool('get_minimal_context', {
        workspaceId: crgContext.workspaceId,
        projectId: crgContext.projectId,
      });
      if (stats.status !== 'OK' && stats.status !== 'PARTIAL') {
        vscode.window.showWarningMessage(`CRG Stats: ${resultErrorSummary(stats)}`);
        return;
      }
      const values = stats.data?.stats ?? stats.metadata?.stats ?? stats.data?.metrics;
      vscode.window.showInformationMessage(
        `CRG Stats (${crgContext.workspaceId}): ${values?.nodes ?? 0} Nodes, ${values?.edges ?? 0} Edges, ${values?.flows ?? 0} Flows`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(`CRG Stats Failed: ${errorMessage(error)}`);
      openSetupIfSetupError(error, openSetup);
    }
  });

  const cmdAnalyzeChanges = vscode.commands.registerCommand('crg.analyzeChanges', async () => {
    if (!service) return;
    try {
      const diffText = await getUnifiedDiff();
      if (!diffText.trim()) {
        vscode.window.showInformationMessage('CRG: No git diff to analyze.');
        return;
      }
      const crgContext = await service.getContext();
      const result = await service.callTool('review_diff', {
        workspaceId: crgContext.workspaceId,
        diffText,
        mode: 'mixed_safe',
      });
      renderAnalysis(result, crgContext.workspaceId);
      output.show(true);
    } catch (error) {
      vscode.window.showErrorMessage(`CRG Analyze Changes Failed: ${errorMessage(error)}`);
      openSetupIfSetupError(error, openSetup);
    }
  });

  const cmdGenerateAgentContext = vscode.commands.registerCommand('crg.generateAgentContext', async () => {
    if (!service) return;
    try {
      await generateAgentContextFile(service);
    } catch (error) {
      vscode.window.showErrorMessage(`CRG Generate Agent Context Failed: ${errorMessage(error)}`);
      openSetupIfSetupError(error, openSetup);
    }
  });

  context.subscriptions.push(cmdSetup, cmdOpenSettings, cmdBlastRadius, cmdRebuild, cmdStats, cmdAnalyzeChanges, cmdGenerateAgentContext);
}

interface AgentContextTarget {
  label: string;
  description: string;
  relativePath?: string;
  custom?: boolean;
}

const AGENT_CONTEXT_TARGETS: AgentContextTarget[] = [
  { label: 'Codex / Generic Agents', description: 'AGENTS.md', relativePath: 'AGENTS.md' },
  { label: 'Claude Code', description: 'CLAUDE.md', relativePath: 'CLAUDE.md' },
  { label: 'Cursor', description: '.cursor/rules/crg.md', relativePath: '.cursor/rules/crg.md' },
  { label: 'Custom Path', description: 'Enter a workspace-relative path', custom: true },
];

async function generateAgentContextFile(crg: CrgMcpService): Promise<void> {
  const crgContext = await crg.getContext();
  const workspaceRoot = crgContext.workspaceFolder?.uri.fsPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('CRG: Open a workspace folder before generating agent context.');
    return;
  }

  const target = await vscode.window.showQuickPick(
    AGENT_CONTEXT_TARGETS.map((item) => ({
      label: item.label,
      description: item.description,
      target: item,
    })),
    { title: 'Generate CRG agent context for...' },
  );
  if (!target) return;

  const relativePath = target.target.custom
    ? await promptCustomAgentContextPath()
    : target.target.relativePath;
  if (!relativePath) return;

  const resolved = resolveWorkspaceRelativePath(workspaceRoot, relativePath);
  if (!resolved) {
    vscode.window.showErrorMessage('CRG: Target path must be a safe relative path inside the workspace.');
    return;
  }

  const result = await crg.callTool('generate_agent_context', {
    workspaceId: crgContext.workspaceId,
    projectId: crgContext.projectId,
    maxEntrypoints: 50,
    maxFlows: 20,
    mode: 'mixed_safe',
  });
  if (result.status !== 'OK' && result.status !== 'PARTIAL') {
    throw new Error(resultErrorSummary(result));
  }
  const markdown = result.data?.markdown;
  if (typeof markdown !== 'string' || markdown.trim().length === 0) {
    throw new Error('generate_agent_context returned empty markdown.');
  }

  if (fs.existsSync(resolved)) {
    const action = await vscode.window.showWarningMessage(
      `CRG: ${path.relative(workspaceRoot, resolved)} already exists.`,
      { modal: true },
      'Overwrite',
      'Cancel',
    );
    if (action !== 'Overwrite') return;
  }

  await fs.promises.mkdir(path.dirname(resolved), { recursive: true });
  const markerTarget = target.target.custom ? relativePath : target.target.label;
  const content = `<!-- Generated by code-review-graph for ${markerTarget}. Edit if needed. -->\n\n${markdown}`;
  await fs.promises.writeFile(resolved, content, 'utf8');

  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(resolved));
  await vscode.window.showTextDocument(doc);
  vscode.window.showInformationMessage(`CRG: Generated ${path.relative(workspaceRoot, resolved)}.`);
}

async function promptCustomAgentContextPath(): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({
    title: 'Agent context file path',
    prompt: 'Enter a workspace-relative markdown path.',
    placeHolder: 'docs/AGENTS.md',
    validateInput: (input) => {
      if (!input.trim()) return 'Path is required.';
      if (path.isAbsolute(input)) return 'Path must be relative to the workspace.';
      const normalized = input.replace(/\\/g, '/');
      if (normalized.split('/').includes('..')) return 'Path cannot contain .. traversal.';
      return undefined;
    },
  });
  return value?.trim();
}

function resolveWorkspaceRelativePath(workspaceRoot: string, relativePath: string): string | undefined {
  if (path.isAbsolute(relativePath)) return undefined;
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.split('/').includes('..')) return undefined;

  const root = path.resolve(workspaceRoot);
  const resolved = path.resolve(root, relativePath);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return undefined;
  return resolved;
}

function renderAnalysis(result: any, workspaceId: string): void {
  output.clear();
  output.appendLine(`Code Review Graph - Change Analysis (${workspaceId})`);
  output.appendLine(`Status: ${result.status}`);
  if (result.status !== 'OK' && result.status !== 'PARTIAL') {
    output.appendLine(resultErrorSummary(result));
    return;
  }
  const analysis = result.data?.analysis ?? {};
  output.appendLine(`Severity: ${analysis.severity ?? 'UNKNOWN'}`);
  output.appendLine(`Changed nodes: ${analysis.changedNodes?.length ?? 0}`);
  output.appendLine(`Affected nodes: ${analysis.affectedNodes?.length ?? 0}`);
  output.appendLine(`Affected flows: ${analysis.affectedFlows?.length ?? 0}`);
  output.appendLine('');
  output.appendLine('Factor codes:');
  for (const factor of analysis.factorCodes ?? []) {
    output.appendLine(`- ${factor.code}${factor.value !== undefined ? `=${factor.value}` : ''}`);
  }
  output.appendLine('');
  output.appendLine('Suggested checks:');
  for (const code of analysis.suggestedCheckCodes ?? []) {
    output.appendLine(`- ${code}`);
  }
}

function updateStatusBar(text: string, icon: string, tooltip: string): void {
  if (!statusBarItem) return;
  statusBarItem.text = `${icon} ${text}`;
  statusBarItem.tooltip = tooltip;
  statusBarItem.show();
}

function setupError(error: unknown): string {
  return `CRG setup failed: ${errorMessage(error)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function openCrgSettings(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', 'crg');
}

function openSetupIfSetupError(error: unknown, openSetup: (reason?: string) => void): void {
  const message = errorMessage(error);
  if (
    message.includes('crg.serverPath') ||
    message.includes('serverPath') ||
    message.includes('CRG CLI not found') ||
    message.includes('No CRG workspace') ||
    message.includes('workspace selected') ||
    message.includes('workspaceId')
  ) {
    openSetup(message);
  }
}

export async function deactivate(): Promise<void> {
  service?.dispose();
}
