/**
 * Postprocessing orchestrator — runs flows, communities, and FTS index steps.
 *
 * Design rules:
 * - Each step runs independently; failure of one does NOT abort others.
 * - Returns PARTIAL (not OK) if any step fails — caller must inspect warnings[].
 * - All results via QueryResultFactory.create() — no raw object literals.
 * - workspace param is mandatory — multi-workspace system requires scoped queries.
 *
 * Ported from Python reference postprocessing.py pattern (fail-safe orchestrator).
 */
import { QueryResultFactory } from '../core/graph/query/QueryResultFactory.js';
import type { QueryResult } from '../core/types.js';
import type { GraphDB } from '../storage/GraphDB.js';
import { traceFlows } from './flows.js';
import { detectCommunities } from '../core/graph/analysis/community.js';

// ── Options ───────────────────────────────────────────────────────────────────

export interface PostProcessOptions {
  flows?: boolean;
  communities?: boolean;
  fts?: boolean;
}

// ── Step helpers ───────────────────────────────────────────────────────────────

async function tryStep(
  name: string,
  fn: () => Promise<unknown> | unknown,
  results: Record<string, unknown>,
  failures: string[],
): Promise<void> {
  try {
    results[name] = await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[postprocess] step "${name}" failed:`, err);
    failures.push(`${name}: ${message}`);
    results[name] = { error: message };
  }
}

// ── Individual steps ──────────────────────────────────────────────────────────

async function traceAndStoreFlows(
  store: GraphDB,
  workspace: string,
): Promise<{ flowsDetected: number }> {
  const nodes = store.getAllNodesByWorkspace(workspace);
  const edges = store.getEdgesByWorkspace(workspace);
  const flows = traceFlows(nodes, edges);

  // Full rebuild: clear existing flows for workspace, then insert fresh
  store.clearFlowsForWorkspace(workspace);
  for (const flow of flows) {
    const flowId = store.insertFlow(workspace, {
      name:         flow.name,
      entryPointId: flow.entryPointId,
      depth:        flow.depth,
      nodeCount:    flow.nodeCount,
      fileCount:    flow.fileCount,
      criticality:  flow.criticality,
      path:         flow.path,
    });
    store.insertFlowMemberships(flowId, flow.path);
  }

  return { flowsDetected: flows.length };
}

async function detectAndStoreCommunities(
  store: GraphDB,
  workspace: string,
): Promise<{ communitiesDetected: number }> {
  const nodes = store.getAllNodesByWorkspace(workspace);
  const edges = store.getEdgesByWorkspace(workspace);
  const communities = detectCommunities(nodes, edges);

  // P2-4 FIX: always clear before insert — idempotent and prevents duplicates
  // when this step runs independently (opts.flows = false).
  store.clearCommunitiesForWorkspace(workspace);
  for (const community of communities) {
    const commId = store.insertCommunity(workspace, {
      name:    community.label,
      size:    community.nodeIds.length,
      cohesion: community.cohesion,
    });
    store.insertCommunityMemberships(commId, community.nodeIds);
  }

  return { communitiesDetected: communities.length };
}

async function rebuildFtsIndex(
  store: GraphDB,
  workspace: string,
): Promise<{ ftsIndexed: number }> {
  // FTS is maintained via upsertNode triggers; this step just reports the count.
  const nodes = store.getNodesByWorkspace(workspace);
  return { ftsIndexed: nodes.length };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run postprocessing steps for a workspace.
 *
 * Steps are independent — each runs even if others fail.
 * Returns PARTIAL + codes['POSTPROCESS_PARTIAL'] if any step fails.
 */
export async function runPostProcess(
  store: GraphDB,
  workspace: string,
  opts: PostProcessOptions = { flows: true, communities: true, fts: true },
): Promise<QueryResult> {
  const stepResults: Record<string, unknown> = {};
  const failures: string[] = [];

  if (opts.fts !== false)         await tryStep('fts',         () => rebuildFtsIndex(store, workspace),             stepResults, failures);
  if (opts.flows !== false)       await tryStep('flows',        () => traceAndStoreFlows(store, workspace),         stepResults, failures);
  if (opts.communities !== false) await tryStep('communities',  () => detectAndStoreCommunities(store, workspace),  stepResults, failures);

  const flowsResult  = stepResults['flows']       as { flowsDetected?: number }       | undefined;
  const commResult   = stepResults['communities'] as { communitiesDetected?: number } | undefined;
  const ftsResult    = stepResults['fts']         as { ftsIndexed?: number }          | undefined;

  const flowsDetected       = flowsResult?.flowsDetected       ?? 0;
  const communitiesDetected = commResult?.communitiesDetected  ?? 0;
  const ftsIndexed          = ftsResult?.ftsIndexed            ?? 0;

  return QueryResultFactory.create({
    status:   failures.length > 0 ? 'PARTIAL' : 'OK',
    nodes:    [],
    edges:    [],
    reasons:  [
      failures.length > 0
        ? `Postprocessing partially complete. Failed steps: ${failures.join(', ')}.`
        : `All postprocessing steps completed successfully.`,
    ],
    warnings: failures.length > 0 ? failures : undefined,
    codes:    failures.length > 0 ? ['POSTPROCESS_PARTIAL'] : undefined,
    metadata: {
      tool: { name: 'run_postprocess', workspace },
      flowsDetected,
      communitiesDetected,
      ftsIndexed,
      ...stepResults,
    },
  });
}
