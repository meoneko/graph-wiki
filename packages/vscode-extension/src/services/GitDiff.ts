import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

export async function getUnifiedDiff(): Promise<string> {
  const gitDiff = await getDiffFromVsCodeGit();
  if (gitDiff.trim()) return gitDiff;

  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error('No workspace folder available for git diff.');
  const { stdout } = await execFileAsync('git', ['-C', folder.uri.fsPath, 'diff', 'HEAD'], {
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout;
}

async function getDiffFromVsCodeGit(): Promise<string> {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (!gitExtension) return '';
  const exports = gitExtension.isActive ? gitExtension.exports : (await gitExtension.activate());
  const api = exports?.getAPI?.(1);
  const repo = api?.repositories?.[0];
  if (!repo?.diff) return '';
  const workingTreeDiff = await repo.diff(false);
  const stagedDiff = await repo.diff(true);
  return [workingTreeDiff, stagedDiff].filter(Boolean).join('\n');
}
