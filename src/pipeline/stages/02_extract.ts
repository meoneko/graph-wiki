import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import type { CandidateRecord, RejectedRecord } from '../../core/types.js';
import type { WorkspaceConfig, KnowledgeConfig, ProjectConfig } from '../config.js';
import { getWorkspaceProjects } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { globalAdapterRegistry } from '../adapters/index.js';
import { canonicalizePath } from '../../storage/pathUtils.js';

function sha1(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

async function getChangedFiles(project: ProjectConfig, db: GraphDB): Promise<string[]> {
  const patterns = project.sources?.include ?? ['**/*.cs'];
  const files = await fg(patterns, {
    cwd: project.path,
    absolute: true,
    ignore: project.sources?.exclude ?? ['**/node_modules/**', '**/.git/**', '**/bin/**', '**/obj/**'],
  });

  const changed: string[] = [];
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const hash = sha1(content);
    const normalized = canonicalizePath(file);
    if (db.getFileHash(project.id, normalized) !== hash) {
      changed.push(normalized);
      db.upsertFileHash(project.id, normalized, hash);
    }
  }
  return changed;
}

export async function extractCandidates(workspace: WorkspaceConfig, config: KnowledgeConfig, db: GraphDB): Promise<{ candidates: CandidateRecord[]; rejects: RejectedRecord[] }> {
  const projects = getWorkspaceProjects(config, workspace.id);
  const allCandidates: CandidateRecord[] = [];
  const rejects: RejectedRecord[] = [];

  for (const project of projects) {
    const changedFiles = await getChangedFiles(project, db);
    if (changedFiles.length === 0) continue;

    const adapter = globalAdapterRegistry.resolve({ workspaceId: workspace.id, projectId: project.id, projectRoot: project.path }, changedFiles);
    if (!adapter) {
      rejects.push({
        id: `${workspace.id}:${project.id}:adapter_not_found`,
        workspace: workspace.id,
        project: project.id,
        stage: 'extract',
        reason_code: 'ADAPTER_NOT_FOUND',
        details: 'No adapter matched project files',
      });
      continue;
    }

    const context = { workspaceId: workspace.id, projectId: project.id, projectRoot: project.path };
    const parsed = await adapter.parse(changedFiles, context);
    const extracted = await adapter.extract(parsed, context);
    const enriched = await adapter.enrich(extracted, context);
    const classified = await adapter.classify(enriched, context);
    const entrypointed = await adapter.identify_entrypoints(classified, context);
    allCandidates.push(...entrypointed);
  }

  return { candidates: allCandidates, rejects };
}
