import { loadConfig, getWorkspace, getWorkspaceProjects, resolveDbPath, resolveOutputPath } from './config.js';
import { loadImportMap, type ImportMapArtifact } from './importMap.js';
import { getDB } from '../storage/GraphDB.js';
import { TrustEventEmitter, type TrustEvent } from '../core/observability/TrustEventEmitter.js';
import { syncSources } from './stages/01_sync.js';
import { extractCandidates } from './stages/02_extract.js';
import { normalizeFacts } from './stages/03_normalize.js';
import { validateFacts } from './stages/04_validate.js';
import { buildCanonicalGraph } from './stages/05a_build_canonical.js';
import { buildDerivedGraph } from './stages/05b_build_derived.js';
import { buildExploratoryGraph } from './stages/05c_build_exploratory.js';
import { buildFlowGraph } from './stages/05d_build_flows.js';
import { enrichFacts } from './stages/06_enrich.js';
import { verifyGraph } from './stages/07_verify.js';
import { generateWiki } from './stages/08_wiki.js';
import { writeReport } from './stages/09_report.js';
import { TRUST_POLICY_VERSION } from './TrustClassifier.js';
import { writeGraphArtifacts } from './artifacts/graphArtifacts.js';
import { PipelineError, DecisionStatus } from '../core/errors.js';
import type { OperationType, QueryMode } from '../core/types.js';

export interface RunOptions {
  incremental?: boolean;
  changedFiles?: string[];
}

/**
 * Pipeline stage names in execution order.
 * Used for event emission and error reporting.
 */
export const PIPELINE_STAGE_ORDER = [
  'sync',
  'extract',
  'normalize',
  'validate',
  'build_canonical',
  'build_derived',
  'build_exploratory',
  'build_flows',
  'enrich',
  'verify',
  'wiki',
  'report',
  'pipeline',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGE_ORDER)[number];

// Exported stages for testing and extensibility
export const PipelineStages = {
  syncSources,
  extractCandidates,
  normalizeFacts,
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

/**
 * Error thrown when the pipeline halts due to a hard failure.
 * Contains machine-readable error codes and the stage that failed.
 */
export class PipelineHaltError extends Error {
  public readonly stage: PipelineStage;
  public readonly codes: string[];

  constructor(stage: PipelineStage, codes: string[], message: string) {
    super(`Pipeline halted at stage '${stage}': ${message}`);
    this.name = 'PipelineHaltError';
    this.stage = stage;
    this.codes = codes;
  }
}

/**
 * Emit a trust event for a pipeline stage transition.
 */
function emitStageEvent(
  emitter: TrustEventEmitter,
  workspaceId: string,
  stage: PipelineStage,
  status: typeof DecisionStatus[keyof typeof DecisionStatus],
  codes: string[] = [],
  warnings: string[] = [],
): void {
  const event: TrustEvent = {
    timestamp: new Date().toISOString(),
    workspace_id: workspaceId,
    operation: 'ask' as OperationType, // Pipeline stages use 'ask' as generic operation type
    mode: 'authoritative' as QueryMode,
    status,
    codes: [`PIPELINE_STAGE:${stage}`, ...codes],
    warnings,
    selected_path_count: 0,
  };
  emitter.emitTrustEvent(event);
}

/**
 * Execute the complete pipeline in order:
 * sync → extract → normalize → validate → build canonical → build derived →
 * build exploratory → build flows → enrich → verify → wiki → report
 *
 * Each stage depends on the output of the previous stage.
 * Pipeline halts on hard-fail with specific error codes.
 * TrustEventEmitter emits events at each stage transition.
 *
 * @see Requirements 3.1, 3.6
 */
export async function runPipeline(workspaceId: string, _options: RunOptions = {}): Promise<void> {
  const config = await loadConfig();
  const workspace = getWorkspace(config, workspaceId);
  const db = getDB(resolveDbPath(config));
  TrustEventEmitter.configure(resolveOutputPath(config, 'reports_root'));
  const emitter = TrustEventEmitter.getInstance();

  if (!_options.incremental) {
    db.clearWorkspaceData(workspace.id, workspace.projects);
  } else {
    const staleFacts = db.getFactsByWorkspace(workspace.id).filter((fact) =>
      fact.lang_meta?.trustPolicyVersion !== TRUST_POLICY_VERSION
    );
    if (staleFacts.length > 0) {
      emitStageEvent(emitter, workspaceId, 'sync', DecisionStatus.POLICY_VIOLATION, [
        PipelineError.WORKSPACE_CONFIG_INVALID,
        'TRUST_POLICY_VERSION_MISMATCH',
      ]);
      throw new PipelineHaltError('sync', [PipelineError.WORKSPACE_CONFIG_INVALID], 
        `TRUST_POLICY_VERSION_MISMATCH: run a full non-incremental rebuild for workspace ${workspace.id}`);
    }
  }

  // ── Stage 1: Sync ──────────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'sync', DecisionStatus.OK);
  try {
    await PipelineStages.syncSources(workspace, config);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'sync', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.WORKSPACE_CONFIG_INVALID,
    ]);
    throw new PipelineHaltError('sync', [PipelineError.WORKSPACE_CONFIG_INVALID], message);
  }

  // ── Stage 2: Extract ───────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'extract', DecisionStatus.OK);
  let extraction: { candidates: import('../core/types.js').CandidateRecord[]; rejects: import('../core/types.js').RejectedRecord[] };
  try {
    extraction = await PipelineStages.extractCandidates(workspace, config, db, _options);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'extract', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.EXTRACTION_FAILED,
    ]);
    throw new PipelineHaltError('extract', [PipelineError.EXTRACTION_FAILED], message);
  }

  // ── Stage 3: Normalize ─────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'normalize', DecisionStatus.OK);
  let normalized: import('../core/types.js').NormalizedFact[];
  try {
    normalized = await PipelineStages.normalizeFacts(extraction.candidates, workspace.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'normalize', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.NORMALIZATION_FAILED,
    ]);
    throw new PipelineHaltError('normalize', [PipelineError.NORMALIZATION_FAILED], message);
  }

  // ── Stage 4: Validate ──────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'validate', DecisionStatus.OK);
  let validated: { facts: import('../core/types.js').NormalizedFact[]; rejects: import('../core/types.js').RejectedRecord[] };
  try {
    validated = await PipelineStages.validateFacts(normalized, workspace.id, db);
  } catch (err) {
    // ValidationPipelineError from the validator contains machine-readable codes
    const codes = (err as { codes?: string[] }).codes ?? [PipelineError.VERIFY_FAILED];
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'validate', DecisionStatus.POLICY_VIOLATION, codes);
    throw new PipelineHaltError('validate', codes, message);
  }

  // In incremental mode: merge DB facts (unchanged files) with newly validated facts (changed files).
  // New facts take precedence over stale DB facts with the same fact_id.
  const graphFacts = _options.incremental
    ? (() => {
        const dbFacts = db.getFactsByWorkspace(workspace.id);
        const newFactIds = new Set(validated.facts.map((f) => f.fact_id));
        return [...dbFacts.filter((f) => !newFactIds.has(f.fact_id)), ...validated.facts];
      })()
    : validated.facts;

  // ── Stage 5a: Build Canonical ──────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'build_canonical', DecisionStatus.OK);
  let canonical: { nodes: import('../core/types.js').GraphNode[]; edges: import('../core/types.js').GraphEdge[] };
  try {
    canonical = await PipelineStages.buildCanonicalGraph(graphFacts, workspace.id, db);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'build_canonical', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.GRAPH_BUILD_FAILED,
    ]);
    throw new PipelineHaltError('build_canonical', [PipelineError.GRAPH_BUILD_FAILED], message);
  }

  // ── Stage 5b: Build Derived ────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'build_derived', DecisionStatus.OK);
  let derived: { nodes: import('../core/types.js').GraphNode[]; edges: import('../core/types.js').GraphEdge[] };
  try {
    // Load per-project importMaps so derived stage can create module-level `imports` edges.
    const projects = getWorkspaceProjects(config, workspace.id);
    const importMaps = (await Promise.all(projects.map((p) => loadImportMap(config, p.id))))
      .filter((m): m is ImportMapArtifact => m !== undefined);

    derived = await PipelineStages.buildDerivedGraph(graphFacts, workspace.id, db, {
      importMaps,
      canonicalNodes: canonical.nodes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'build_derived', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.GRAPH_BUILD_FAILED,
    ]);
    throw new PipelineHaltError('build_derived', [PipelineError.GRAPH_BUILD_FAILED], message);
  }

  // ── Stage 5c: Build Exploratory ────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'build_exploratory', DecisionStatus.OK);
  let exploratory: { nodes: import('../core/types.js').GraphNode[]; edges: import('../core/types.js').GraphEdge[] };
  try {
    exploratory = await PipelineStages.buildExploratoryGraph(graphFacts, workspace.id, db);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'build_exploratory', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.GRAPH_BUILD_FAILED,
    ]);
    throw new PipelineHaltError('build_exploratory', [PipelineError.GRAPH_BUILD_FAILED], message);
  }

  const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
  const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];

  // ── Stage 5d: Build Flows ──────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'build_flows', DecisionStatus.OK);
  try {
    await PipelineStages.buildFlowGraph(allNodes, allEdges, workspace.id, db);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'build_flows', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.GRAPH_BUILD_FAILED,
    ]);
    throw new PipelineHaltError('build_flows', [PipelineError.GRAPH_BUILD_FAILED], message);
  }

  // Always read currentNodes/currentEdges from DB so they include flow nodes regardless of
  // incremental mode. After buildFlowGraph the DB is the canonical source of truth.
  const currentNodes = db.getAllNodesByWorkspace(workspace.id);
  const currentEdges = db.getEdgesByWorkspace(workspace.id);

  // ── Stage 6: Enrich ────────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'enrich', DecisionStatus.OK);
  try {
    const enrichment = await PipelineStages.enrichFacts(graphFacts, currentNodes, currentEdges, workspace.id, db, config);
    if (enrichment.status === 'skipped') {
      emitStageEvent(emitter, workspaceId, 'enrich', DecisionStatus.OK, [], [
        `enrichment skipped: ${enrichment.reason ?? 'no AI provider configured'}`,
      ]);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'enrich', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.EXTRACTION_FAILED,
    ]);
    throw new PipelineHaltError('enrich', [PipelineError.EXTRACTION_FAILED], message);
  }

  // Write graph artifacts before verify (verify may need them)
  await PipelineStages.writeGraphArtifacts(db, workspace.id);

  // ── Stage 7: Verify ────────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'verify', DecisionStatus.OK);
  let report;
  try {
    report = await PipelineStages.verifyGraph(currentNodes, currentEdges, workspace, db, config);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'verify', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.VERIFY_FAILED,
    ]);
    throw new PipelineHaltError('verify', [PipelineError.VERIFY_FAILED], message);
  }

  if (!report.passed) {
    const codes = [PipelineError.VERIFY_FAILED];
    emitStageEvent(emitter, workspaceId, 'verify', DecisionStatus.POLICY_VIOLATION, codes, report.issues);
    // Write report even on failure so diagnostics are available
    await PipelineStages.writeReport(workspace.id, report, config, { nodes: currentNodes, edges: currentEdges });
    throw new PipelineHaltError('verify', codes, `Verification failed: ${report.issues.join(', ')}`);
  }

  // ── Stage 8: Wiki ──────────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'wiki', DecisionStatus.OK);
  try {
    await PipelineStages.generateWiki(workspace.id, currentNodes, currentEdges, db, config);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'wiki', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.WIKI_SOURCE_POLICY_VIOLATION,
    ]);
    throw new PipelineHaltError('wiki', [PipelineError.WIKI_SOURCE_POLICY_VIOLATION], message);
  }

  // ── Stage 9: Report ────────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'report', DecisionStatus.OK);
  try {
    await PipelineStages.writeReport(workspace.id, report, config, { nodes: currentNodes, edges: currentEdges });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitStageEvent(emitter, workspaceId, 'report', DecisionStatus.POLICY_VIOLATION, [
      PipelineError.VERIFY_FAILED,
    ]);
    throw new PipelineHaltError('report', [PipelineError.VERIFY_FAILED], message);
  }

  // ── Pipeline Complete ──────────────────────────────────────────────────────
  emitStageEvent(emitter, workspaceId, 'pipeline', DecisionStatus.OK, ['PIPELINE_COMPLETE']);
  emitter.writeSummary(workspaceId);
}
