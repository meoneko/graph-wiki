import { createHash } from 'node:crypto';
import fg from 'fast-glob';
import type { CandidateRecord, RejectedRecord } from '../../core/types.js';
import type { WorkspaceConfig, KnowledgeConfig, ProjectConfig } from '../config.js';
import { getWorkspaceProjects } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { globalAdapterRegistry } from '../adapters/index.js';
import { canonicalizePath } from '../../storage/pathUtils.js';
import type { AdapterParsedResult, SourceFileSnapshot } from '../../scanner/core/ILanguageParser.js';
import { readSourceFileSnapshot } from '../../scanner/core/sourceFileSnapshot.js';

function sha1(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

export interface ExtractOptions {
  incremental?: boolean;
  changedFiles?: string[];
}

type AdapterWithSnapshots = {
  parseSnapshots?: (
    snapshots: SourceFileSnapshot[],
    context: { workspaceId: string; projectId: string; projectRoot: string },
  ) => Promise<AdapterParsedResult>;
};

async function listProjectFiles(project: ProjectConfig): Promise<string[]> {
  const patterns = project.sources?.include ?? ['**/*.cs'];
  return fg(patterns, {
    cwd: project.path,
    absolute: true,
    ignore: project.sources?.exclude ?? ['**/node_modules/**', '**/.git/**', '**/bin/**', '**/obj/**'],
  });
}

async function getSnapshotsToExtract(project: ProjectConfig, db: GraphDB, options: ExtractOptions): Promise<SourceFileSnapshot[]> {
  const files = await listProjectFiles(project);

  if (!options.incremental) {
    const snapshots: SourceFileSnapshot[] = [];
    for (const file of files) {
      const normalized = canonicalizePath(file);
      const snapshot = await readSourceFileSnapshot(normalized);
      db.upsertFileHash(project.id, normalized, snapshot.hash);
      snapshots.push(snapshot);
    }
    return snapshots;
  }

  const explicitChanges = options.changedFiles
    ? new Set(options.changedFiles.map((file) => canonicalizePath(file)))
    : undefined;

  const changed: SourceFileSnapshot[] = [];
  for (const file of files) {
    const normalized = canonicalizePath(file);
    if (explicitChanges && !explicitChanges.has(normalized)) {
      continue;
    }

    const snapshot = await readSourceFileSnapshot(normalized);
    if (db.getFileHash(project.id, normalized) !== snapshot.hash) {
      changed.push(snapshot);
      db.upsertFileHash(project.id, normalized, snapshot.hash);
    }
  }
  return changed;
}

export async function extractCandidates(
  workspace: WorkspaceConfig,
  config: KnowledgeConfig,
  db: GraphDB,
  options: ExtractOptions = {},
): Promise<{ candidates: CandidateRecord[]; rejects: RejectedRecord[] }> {
  const projects = getWorkspaceProjects(config, workspace.id);
  const allCandidates: CandidateRecord[] = [];
  const rejects: RejectedRecord[] = [];

  for (const project of projects) {
    const changedSnapshots = await getSnapshotsToExtract(project, db, options);
    if (changedSnapshots.length === 0) continue;

    const snapshotsByPath = new Map(changedSnapshots.map((snapshot) => [snapshot.filePath, snapshot]));
    const changedFiles = changedSnapshots.map((snapshot) => snapshot.filePath);
    const context = { workspaceId: workspace.id, projectId: project.id, projectRoot: project.path };
    const { resolutions, unmatched } = globalAdapterRegistry.resolveAll(context, changedFiles);
    if (resolutions.length === 0) {
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

    for (const file of unmatched) {
      rejects.push({
        id: `${workspace.id}:${project.id}:adapter_not_found:${sha1(file)}`,
        workspace: workspace.id,
        project: project.id,
        stage: 'extract',
        reason_code: 'ADAPTER_NOT_FOUND_FOR_FILE',
        details: file,
      });
    }

    for (const resolution of resolutions) {
      const adapterWithSnapshots = resolution.adapter as typeof resolution.adapter & AdapterWithSnapshots;
      const resolutionSnapshots = resolution.filePaths
        .map((filePath) => snapshotsByPath.get(filePath))
        .filter((snapshot): snapshot is SourceFileSnapshot => snapshot !== undefined);
      const parsed = adapterWithSnapshots.parseSnapshots
        ? await adapterWithSnapshots.parseSnapshots(resolutionSnapshots, context)
        : await resolution.adapter.parse(resolution.filePaths, context);
      const extracted = await resolution.adapter.extract(parsed, context);
      const enriched = await resolution.adapter.enrich(extracted, context);
      const classified = await resolution.adapter.classify(enriched, context);
      allCandidates.push(...classified);
    }
  }

  return { candidates: allCandidates, rejects };
}

