import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';
import { loadConfig } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';

export function registerWorkspaceTools(): void {
  registerTool({
    name: 'list_workspaces',
    description: 'List configured Code Review Graph workspaces from the MCP server runtime config.',
    inputSchema: {},
    handler: async () => {
      const config = await loadConfig();
      const projectById = new Map(config.projects.map((project) => [project.id, project]));
      const workspaces = config.workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        label: workspace.name ? `${workspace.id} - ${workspace.name}` : workspace.id,
        projectIds: workspace.projects,
        projects: workspace.projects.map((projectId) => {
          const project = projectById.get(projectId);
          return {
            id: projectId,
            path: project?.path,
            description: project?.description,
            enabled: project?.enabled ?? true,
          };
        }),
      }));

      return QueryResultFactory.create({
        status: 'OK',
        nodes: [],
        edges: [],
        reasons: ['WORKSPACES_RETURNED'],
        data: { workspaces },
        metadata: { tool: { name: 'list_workspaces' } },
      });
    },
  });
}
