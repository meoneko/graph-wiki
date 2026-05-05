import { loadConfig, getWorkspace, resolveDbPath, resolveOutputPath } from './config.js';
import { getDB } from '../storage/GraphDB.js';
import { TrustEventEmitter } from '../core/observability/TrustEventEmitter.js';
import { syncSources } from './stages/01_sync.js';
import { extractCandidates } from './stages/02_extract.js';
import { frameworkEnrichCandidates } from './stages/02b_framework_enrich.js';
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
  frameworkEnrichCandidates,
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

async function runStage<T>(workspaceId: string, stageName: string, action: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  console.log(`[pipeline:${workspaceId}] start ${stageName}`);
  const result = await action();
  console.log(`[pipeline:${workspaceId}] done ${stageName} (${Date.now() - startedAt}ms)`);
  return result;
}

export async function runPipeline(workspaceId: string, _options: RunOptions = {}): Promise<void> {
  const pipelineStartedAt = Date.now();
  const config = await loadConfig();
  const workspace = getWorkspace(config, workspaceId);
  const db = getDB(resolveDbPath(config));
  TrustEventEmitter.configure(resolveOutputPath(config, 'reports_root'));
  console.log(`[pipeline:${workspace.id}] mode=${_options.incremental ? 'incremental' : 'full'}`);

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
  await runStage(workspace.id, 'syncSources', async () => PipelineStages.syncSources(workspace, config));
  const extraction = await runStage(workspace.id, 'extractCandidates', async () =>
    PipelineStages.extractCandidates(workspace, config, db, _options)
  );
  console.log(`[pipeline:${workspace.id}] candidates=${extraction.candidates.length} rejects=${extraction.rejects.length}`);

  const frameworked = await runStage(workspace.id, 'frameworkEnrich', async () =>
    PipelineStages.frameworkEnrichCandidates(extraction.candidates, workspace, config)
  );
  console.log(`[pipeline:${workspace.id}] frameworkedCandidates=${frameworked.candidates.length}`);

  // 2. Validate & Classify (Hydrates trust metadata)
  const validated = await runStage(workspace.id, 'validateFacts', async () =>
    PipelineStages.validateFacts(frameworked.candidates, workspace.id, db)
  );
  console.log(`[pipeline:${workspace.id}] facts=${validated.facts.length} rejectedFacts=${validated.rejects.length}`);

  // 3. Build Multi-Layer Graph
  const canonical = await runStage(workspace.id, 'buildCanonicalGraph', async () =>
    PipelineStages.buildCanonicalGraph(validated.facts, workspace.id, db)
  );
  const derived = await runStage(workspace.id, 'buildDerivedGraph', async () =>
    PipelineStages.buildDerivedGraph(validated.facts, workspace.id, db)
  );
  const exploratory = await runStage(workspace.id, 'buildExploratoryGraph', async () =>
    PipelineStages.buildExploratoryGraph(validated.facts, workspace.id, db)
  );

  const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
  const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];
  console.log(`[pipeline:${workspace.id}] graphNodes=${allNodes.length} graphEdges=${allEdges.length}`);
  const currentNodes = _options.incremental ? db.getAllNodesByWorkspace(workspace.id) : allNodes;
  const currentEdges = _options.incremental ? db.getEdgesByWorkspace(workspace.id) : allEdges;

  // 4. Enrich & Wiki
  // 5. Verify
  await runStage(workspace.id, 'writeGraphArtifacts', async () => PipelineStages.writeGraphArtifacts(db, workspace.id));
  const report = await runStage(workspace.id, 'verifyGraph', async () =>
    PipelineStages.verifyGraph(currentNodes, currentEdges, workspace, db, config)
  );

  if (!report.passed) {
    await runStage(workspace.id, 'writeReport(failed)', async () =>
      PipelineStages.writeReport(workspace.id, report, config)
    );
    throw new Error(`Verification failed for workspace ${workspaceId}: ${report.issues.join(', ')}`);
  }

  // 6. Wiki & Report
  await runStage(workspace.id, 'generateWiki', async () =>
    PipelineStages.generateWiki(workspace.id, currentNodes, currentEdges, db, config)
  );
  await runStage(workspace.id, 'writeReport', async () =>
    PipelineStages.writeReport(workspace.id, report, config)
  );
  console.log(`[pipeline:${workspace.id}] completed (${Date.now() - pipelineStartedAt}ms)`);
}
