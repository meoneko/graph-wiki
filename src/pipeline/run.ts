import { loadConfig, getWorkspace, resolveDbPath } from './config.js';
import { getDB } from '../storage/GraphDB.js';
import { syncSources } from './stages/01_sync.js';
import { extractCandidates } from './stages/02_extract.js';
import { validateFacts } from './stages/03_validate.js';
import { buildCanonicalGraph } from './stages/04a_build_canonical.js';
import { buildDerivedGraph } from './stages/04b_build_derived.js';
import { buildExploratoryGraph } from './stages/04c_build_exploratory.js';
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

  if (!_options.incremental) {
    db.cleanWorkspace(workspace.id);
  }

  // 1. Sync & Extract
  await syncSources(workspace, config);
  const extraction = await extractCandidates(workspace, config, db, _options);

  // 2. Validate & Classify (Hydrates trust metadata)
  const validated = await validateFacts(extraction.candidates, workspace.id, db);

  // 3. Build Multi-Layer Graph
  const canonical = await buildCanonicalGraph(validated.facts, workspace.id, db);
  const derived = await buildDerivedGraph(validated.facts, workspace.id, db);
  const exploratory = await buildExploratoryGraph(validated.facts, workspace.id, db);

  const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
  const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];
  const currentNodes = _options.incremental ? db.getAllNodesByWorkspace(workspace.id) : allNodes;
  const currentEdges = _options.incremental ? db.getEdgesByWorkspace(workspace.id) : allEdges;

  // 4. Enrich & Wiki
  await enrichFacts(validated.facts, currentNodes, currentEdges, workspace.id, db, config);
  await generateWiki(workspace.id, currentNodes, currentEdges, db, config);

  // 5. Verify & Final Report
  const report = await verifyGraph(currentNodes, currentEdges, workspace, db, config);
  await writeReport(workspace.id, report, config);

  if (!report.passed) {
    throw new Error(`Verification failed for workspace ${workspaceId}: ${report.issues.join(', ')}`);
  }
}
