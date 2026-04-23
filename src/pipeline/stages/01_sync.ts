import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import type { KnowledgeConfig, WorkspaceConfig, ProjectConfig } from '../config.js';
import { getWorkspaceProjects, resolveOutputPath } from '../config.js';

async function listSourceFiles(project: ProjectConfig): Promise<string[]> {
  const include = project.sources?.include ?? ['**/*.cs', '**/*.ts', '**/*.tsx', '**/*.md'];
  const exclude = project.sources?.exclude ?? [];
  return fg(include, {
    cwd: project.path,
    absolute: true,
    onlyFiles: true,
    ignore: exclude,
  });
}

export async function syncSources(workspace: WorkspaceConfig, config: KnowledgeConfig): Promise<void> {
  const sourceRoot = resolveOutputPath(config, 'source_root');
  const stateRoot = resolveOutputPath(config, 'state_root');
  const recordsRoot = resolveOutputPath(config, 'records_root');
  const indexRoot = resolveOutputPath(config, 'index_root');
  const wikiRoot = resolveOutputPath(config, 'wiki_root');
  const reportsRoot = resolveOutputPath(config, 'reports_root');

  await Promise.all([
    mkdir(sourceRoot, { recursive: true }),
    mkdir(stateRoot, { recursive: true }),
    mkdir(recordsRoot, { recursive: true }),
    mkdir(indexRoot, { recursive: true }),
    mkdir(wikiRoot, { recursive: true }),
    mkdir(reportsRoot, { recursive: true }),
  ]);

  const projects = getWorkspaceProjects(config, workspace.id);

  for (const project of projects) {
    const files = await listSourceFiles(project);
    const projectTargetRoot = path.join(sourceRoot, workspace.id, project.id);
    await mkdir(projectTargetRoot, { recursive: true });

    for (const absFile of files) {
      const rel = path.relative(path.resolve(project.path), absFile);
      const dst = path.join(projectTargetRoot, rel);
      await mkdir(path.dirname(dst), { recursive: true });
      await copyFile(absFile, dst);
    }
  }
}
