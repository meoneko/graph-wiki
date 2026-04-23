import { loadConfig, getWorkspace, resolveDbPath } from './config.js';
import { getDB } from '../storage/GraphDB.js';
import { syncSources } from './stages/01_sync.js';
import { extractCandidates } from './stages/02_extract.js';
import { validateFacts } from './stages/03_validate.js';
import { buildGraph } from './stages/04_buildGraph.js';
import { enrichFacts } from './stages/05_enrich.js';
import { verifyGraph } from './stages/06_verify.js';
import { generateWiki } from './stages/07_wiki.js';
import { writeReport } from './stages/08_report.js';

export interface RunOptions {
  incremental?: boolean;
  changedFiles?: string[];
}

export async function runPipeline(workspaceId: string, _options: RunOptions = {}): Promise<void> {
  const config = await loadConfig();
  const workspace = getWorkspace(config, workspaceId);
  const db = getDB(resolveDbPath(config));

  await syncSources(workspace, config);
  const extraction = await extractCandidates(workspace, config, db);
  const validated = await validateFacts(extraction.candidates, workspace.id, db);
  const graph = await buildGraph(validated.facts, workspace.id, db);
  await enrichFacts(validated.facts, graph.nodes, graph.edges, workspace.id, db, config);
  await generateWiki(workspace.id, graph.nodes, graph.edges, db, config);
  const report = await verifyGraph(graph.nodes, graph.edges, workspace, db, config);
  await writeReport(workspace.id, report, config);

  if (!report.passed) {
    throw new Error(`Verification failed for workspace ${workspaceId}: ${report.issues.join(', ')}`);
  }
}
