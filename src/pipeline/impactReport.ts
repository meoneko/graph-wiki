import type { GraphNode } from '../core/types.js';
import type { GraphPathResult } from '../core/graph/types.js';
import { GraphQueryEngine } from '../core/graph/query/GraphQueryEngine.js';
import { GraphArtifactLoader } from '../core/graph/query/GraphArtifactLoader.js';
import { getDB } from '../storage/GraphDB.js';
import { resolveDbPath } from './config.js';
import type { DiffEntry } from './gitDiff.js';

export interface ImpactReport {
  changedNodes: GraphNode[];
  affectedNodes: GraphNode[];
  affectedEntrypoints: GraphNode[];
  riskScore: number;
  riskRationale: string[];
  criticalPaths: GraphPathResult[];
  affectedFlows: Array<{ id: string; title: string }>;
  reviewSuggestions: string[];
}

export async function buildImpactReport(diff: DiffEntry[], workspaceId: string): Promise<ImpactReport> {
  const db = getDB(resolveDbPath());
  const loader = new GraphArtifactLoader(db);
  const engine = new GraphQueryEngine(workspaceId, loader);

  const changedNodes = db.getNodesByWorkspace(workspaceId, 'canonical').filter((n) => diff.some((d) => n.source_file?.endsWith(d.filePath)));

  const affectedNodeMap = new Map<string, GraphNode>();
  const criticalPaths: GraphPathResult[] = [];

  for (const node of changedNodes) {
    const impact = await engine.getImpact([node.id], 5);
    for (const impacted of impact.nodes) affectedNodeMap.set(impacted.id, impacted);
    const entrypoints = impact.nodes.filter((n) => n.type.includes('api') || n.type.includes('route') || n.type.includes('controller'));
    for (const ep of entrypoints) {
      const path = await engine.getPath(node.id, ep.id);
      if (path.found) criticalPaths.push(path);
    }
  }

  const affectedNodes = [...affectedNodeMap.values()];
  const affectedEntrypoints = affectedNodes.filter((n) => n.type.includes('api') || n.type.includes('route') || n.type.includes('controller'));
  const riskScore = Math.min(100, changedNodes.length * 10 + affectedEntrypoints.length * 8 + criticalPaths.length * 4);

  return {
    changedNodes,
    affectedNodes,
    affectedEntrypoints,
    riskScore,
    riskRationale: [
      `changed_nodes=${changedNodes.length}`,
      `affected_nodes=${affectedNodes.length}`,
      `affected_entrypoints=${affectedEntrypoints.length}`,
      `critical_paths=${criticalPaths.length}`,
    ],
    criticalPaths,
    affectedFlows: [],
    reviewSuggestions: riskScore > 70
      ? ['Run full regression tests', 'Request backend + API review', 'Gate merge on manual verification']
      : ['Run targeted tests for changed entrypoints'],
  };
}
