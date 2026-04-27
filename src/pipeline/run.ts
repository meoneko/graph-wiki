import { loadConfig, getWorkspace, resolveDbPath, resolveOutputPath } from './config.js';
import { getDB } from '../storage/GraphDB.js';
import { TrustEventEmitter } from '../core/observability/TrustEventEmitter.js';
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
import { TRUST_POLICY_VERSION } from './TrustClassifier.js';
import { writeGraphArtifacts } from './artifacts/graphArtifacts.js';

export interface RunOptions {
  incremental?: boolean;
  changedFiles?: string[];
}

// Exported stages for testing and extensibility
export const PipelineStages = {
  syncSources,
  extractCandidates,
  validateFacts,
  buildCanonicalGraph,
  buildDerivedGraph,
  buildExploratoryGraph,
  enrichFacts,
  writeGraphArtifacts,
  verifyGraph,
  generateWiki,
  writeReport,
};

export async function runPipeline(workspaceId: string, _options: RunOptions = {}): Promise<void> {
  const config = await loadConfig();
  const workspace = getWorkspace(config, workspaceId);
  const db = getDB(resolveDbPath(config));
  TrustEventEmitter.configure(resolveOutputPath(config, 'reports_root'));

  if (!_options.incremental) {
    db.clearWorkspaceData(workspace.id, workspace.projects);
  } else {
    const staleFacts = db.getFactsByWorkspace(workspace.id).filter((fact) =>
      fact.lang_meta?.trustPolicyVersion !== TRUST_POLICY_VERSION
    );
    if (staleFacts.length > 0) {
      throw new Error(
        `TRUST_POLICY_VERSION_MISMATCH: run a full non-incremental rebuild for workspace ${workspace.id}`,
      );
    }
  }

  // 1. Sync & Extract
  await PipelineStages.syncSources(workspace, config);
  const extraction = await PipelineStages.extractCandidates(workspace, config, db, _options);

  // 2. Validate & Classify (Hydrates trust metadata)
  const validated = await PipelineStages.validateFacts(extraction.candidates, workspace.id, db);

  // 3. Build Multi-Layer Graph
  const canonical = await PipelineStages.buildCanonicalGraph(validated.facts, workspace.id, db);
  const derived = await PipelineStages.buildDerivedGraph(validated.facts, workspace.id, db);
  const exploratory = await PipelineStages.buildExploratoryGraph(validated.facts, workspace.id, db);

  const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
  const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];
  const currentNodes = _options.incremental ? db.getAllNodesByWorkspace(workspace.id) : allNodes;
  const currentEdges = _options.incremental ? db.getEdgesByWorkspace(workspace.id) : allEdges;

  // 4. Enrich & Wiki
  // 5. Verify
  await PipelineStages.writeGraphArtifacts(db, workspace.id);
  const report = await PipelineStages.verifyGraph(currentNodes, currentEdges, workspace, db, config);

  if (!report.passed) {
    await PipelineStages.writeReport(workspace.id, report, config);
    throw new Error(`Verification failed for workspace ${workspaceId}: ${report.issues.join(', ')}`);
  }

  // 6. Wiki & Report
  await PipelineStages.generateWiki(workspace.id, currentNodes, currentEdges, db, config);
  await PipelineStages.writeReport(workspace.id, report, config);
}
