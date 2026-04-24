import type { GraphNode, QueryMode } from '../core/types.js';
import type { GraphPathResult } from '../core/graph/types.js';
import { TrustAwareQueryEngine } from '../core/graph/query/TrustAwareQueryEngine.js';
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
  criticalPaths: any[]; // Changed from GraphPathResult to tolerate QueryResult
  affectedFlows: Array<{ id: string; title: string }>;
  reviewSuggestions: string[];
}

export async function buildImpactReport(
  diff: DiffEntry[],
  workspaceId: string,
  mode: QueryMode = 'mixed_safe'
): Promise<ImpactReport> {
  const db = getDB(resolveDbPath());
  const loader = new GraphArtifactLoader(db);
  const engine = new TrustAwareQueryEngine(workspaceId, loader);

  const allNodes = db.getNodesByWorkspace(workspaceId, 'canonical');
  const changedNodes = allNodes.filter((n) => diff.some((d) => n.source_file?.endsWith(d.filePath)));

  const affectedNodeMap = new Map<string, GraphNode>();
  const criticalResults: any[] = [];

  for (const node of changedNodes) {
    const impact = await engine.analyzeImpact(node.id, mode, 5);
    for (const impacted of impact.nodes) affectedNodeMap.set(impacted.id, impacted);

    // Look for entrypoints in the impact set
    const entrypoints = impact.nodes.filter((n) =>
      n.type.includes('api') || n.type.includes('route') || n.type.includes('controller')
    );

    for (const ep of entrypoints) {
      const result = await engine.findReasoningPaths(node.id, ep.id, mode);
      if (result.status === 'OK' || result.status === 'AMBIGUOUS') {
        criticalResults.push(result);
      }
    }
  }

  const affectedNodes = [...affectedNodeMap.values()];
  const affectedEntrypoints = affectedNodes.filter((n) =>
    n.type.includes('api') || n.type.includes('route') || n.type.includes('controller')
  );

  const riskScore = Math.min(100,
    changedNodes.length * 10 +
    affectedEntrypoints.length * 8 +
    criticalResults.length * 4
  );

  return {
    changedNodes,
    affectedNodes,
    affectedEntrypoints,
    riskScore,
    riskRationale: [
      `changed_nodes=${changedNodes.length}`,
      `affected_nodes=${affectedNodes.length}`,
      `affected_entrypoints=${affectedEntrypoints.length}`,
      `critical_paths=${criticalResults.length}`,
      `query_mode=${mode}`
    ],
    criticalPaths: criticalResults,
    affectedFlows: [],
    reviewSuggestions: riskScore > 70
      ? ['Run full regression tests', 'Request backend + API review', 'Gate merge on manual verification']
      : ['Run targeted tests for changed entrypoints'],
  };
}
