import type { GraphNode } from '../../core/types.js';
import type { GraphDB } from '../../storage/GraphDB.js';
import { fileMatchesGraphPath, normalizePathForMatch } from '../../core/utils/pathMatch.js';

export { fileMatchesGraphPath };
export const normalizeGraphPath = normalizePathForMatch;

export function nodeSummary(node: GraphNode): {
  id: string;
  label: string;
  type: string;
  roles: string[];
  language: string;
  framework?: string;
  project: string;
  source_file?: string;
} {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    roles: node.roles ?? [],
    language: node.language,
    framework: node.framework,
    project: node.project,
    source_file: node.source_file,
  };
}

export function buildNodeIndex(nodes: GraphNode[]): Map<string, GraphNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

export function filterNodesByProject(nodes: GraphNode[], projectId?: string): GraphNode[] {
  return projectId ? nodes.filter((node) => node.project === projectId) : nodes;
}

export function flowProjects(path: string[], nodeById: Map<string, GraphNode>): string[] {
  return [...new Set(path.map((id) => nodeById.get(id)?.project).filter((p): p is string => Boolean(p)))].sort();
}

export function findNodesByFiles(nodes: GraphNode[], files: string[]): {
  matchedNodes: GraphNode[];
  matchedFiles: string[];
  unmatchedFiles: string[];
} {
  const matchedNodes = new Map<string, GraphNode>();
  const matchedFiles = new Set<string>();

  for (const file of files) {
    for (const node of nodes) {
      if (fileMatchesGraphPath(file, node.source_file)) {
        matchedNodes.set(node.id, node);
        matchedFiles.add(file);
      }
    }
  }

  return {
    matchedNodes: [...matchedNodes.values()],
    matchedFiles: [...matchedFiles],
    unmatchedFiles: files.filter((file) => !matchedFiles.has(file)),
  };
}

export function getWorkspaceGraph(store: GraphDB, workspaceId: string): {
  nodes: GraphNode[];
  nodeById: Map<string, GraphNode>;
  flows: ReturnType<GraphDB['getFlows']>;
  communities: ReturnType<GraphDB['getCommunities']>;
} {
  const nodes = store.getAllNodesByWorkspace(workspaceId);
  return {
    nodes,
    nodeById: buildNodeIndex(nodes),
    flows: store.getFlows(workspaceId),
    communities: store.getCommunities(workspaceId),
  };
}
