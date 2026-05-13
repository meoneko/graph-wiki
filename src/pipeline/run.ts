import { loadConfig, getWorkspace, getWorkspaceProjects, resolveDbPath, resolveOutputPath } from './config.js';
import { loadImportMap, type ImportMapArtifact } from './importMap.js';
import { getDB } from '../storage/GraphDB.js';
import { TrustEventEmitter } from '../core/observability/TrustEventEmitter.js';
import { syncSources } from './stages/01_sync.js';
import { extractCandidates } from './stages/02_extract.js';
import { validateFacts } from './stages/03_validate.js';
import { buildCanonicalGraph } from './stages/04a_build_canonical.js';
import { buildDerivedGraph } from './stages/04b_build_derived.js';
import { buildExploratoryGraph } from './stages/04c_build_exploratory.js';
import { buildFlowGraph } from './stages/04d_build_flows.js';
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
  buildFlowGraph,
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
  const graphFacts = _options.incremental
    ? db.getFactsByWorkspace(workspace.id)
    : validated.facts;

  // 3. Build Multi-Layer Graph
  const canonical = await PipelineStages.buildCanonicalGraph(graphFacts, workspace.id, db);

  // Load per-project importMaps so derived stage can create module-level `imports` edges.
  const projects = getWorkspaceProjects(config, workspace.id);
  const importMaps = (await Promise.all(projects.map((p) => loadImportMap(config, p.id))))
    .filter((m): m is ImportMapArtifact => m !== undefined);

  const derived = await PipelineStages.buildDerivedGraph(graphFacts, workspace.id, db, {
    importMaps,
    canonicalNodes: canonical.nodes,
  });
  const exploratory = await PipelineStages.buildExploratoryGraph(graphFacts, workspace.id, db);

  const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
  const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];

  // 4. Derive domain metadata + flow_domain nodes + belongs_to_flow edges.
  //    Must run BEFORE writeGraphArtifacts so artifacts, wiki, and verify all see flow nodes.
  await PipelineStages.buildFlowGraph(allNodes, allEdges, workspace.id, db);

  // Always read currentNodes/currentEdges from DB so they include flow nodes regardless of
  // incremental mode. After buildFlowGraph the DB is the canonical source of truth.
  const currentNodes = db.getAllNodesByWorkspace(workspace.id);
  const currentEdges = db.getEdgesByWorkspace(workspace.id);

  // 5. AI enrichment (disabled by default; logs skip reason so users know it exists)
  const enrichment = await PipelineStages.enrichFacts(graphFacts, currentNodes, currentEdges, workspace.id, db, config);
  if (enrichment.status === 'skipped') {
    console.log(`[CRG] stage 05 enrichment skipped (${enrichment.reason ?? 'no AI provider configured'}) — set ai.provider in knowledge.config.yaml to enable`);
  }

  // 6. Write artifacts & verify
  await PipelineStages.writeGraphArtifacts(db, workspace.id);
  const report = await PipelineStages.verifyGraph(currentNodes, currentEdges, workspace, db, config);

  if (!report.passed) {
    await PipelineStages.writeReport(workspace.id, report, config, { nodes: currentNodes, edges: currentEdges });
    throw new Error(`Verification failed for workspace ${workspaceId}: ${report.issues.join(', ')}`);
  }

  // 6. Wiki & Report
  await PipelineStages.generateWiki(workspace.id, currentNodes, currentEdges, db, config);
  await PipelineStages.writeReport(workspace.id, report, config, { nodes: currentNodes, edges: currentEdges });
}
