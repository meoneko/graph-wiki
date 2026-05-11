import type { CandidateRecord, AdapterContext } from '../../core/types.js';
import type { KnowledgeConfig, WorkspaceConfig } from '../config.js';
import { getWorkspaceProjects } from '../config.js';
import { globalFrameworkAdapterRegistry } from '../frameworks/index.js';

export async function frameworkEnrichCandidates(
  candidates: CandidateRecord[],
  workspace: WorkspaceConfig,
  config: KnowledgeConfig,
): Promise<{ candidates: CandidateRecord[] }> {
  const projects = getWorkspaceProjects(config, workspace.id);
  const byProject = new Map<string, CandidateRecord[]>();

  for (const candidate of candidates) {
    const group = byProject.get(candidate.project) ?? [];
    group.push(candidate);
    byProject.set(candidate.project, group);
  }

  const enriched: CandidateRecord[] = [];
  for (const project of projects) {
    let projectCandidates = byProject.get(project.id) ?? [];
    if (projectCandidates.length === 0) continue;

    const languages = [...new Set(projectCandidates.map((candidate) => candidate.language))];
    const context: AdapterContext = {
      workspaceId: workspace.id,
      projectId: project.id,
      projectRoot: project.path,
    };

    for (const language of languages) {
      const adapters = await globalFrameworkAdapterRegistry.resolve(language, context);
      for (const adapter of adapters) {
        projectCandidates = await adapter.enrichCandidates(projectCandidates, context);
      }
    }

    enriched.push(...projectCandidates);
    byProject.delete(project.id);
  }

  for (const remaining of byProject.values()) {
    enriched.push(...remaining);
  }

  return { candidates: enriched };
}
