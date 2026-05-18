import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ quiet: true });

import { runPipeline } from '../pipeline/run.js';
import { PipelineStages } from '../pipeline/run.js';
import { startWatch } from '../pipeline/watch.js';
import { getDiff } from '../pipeline/gitDiff.js';
import { buildImpactReport } from '../pipeline/impactReport.js';
import { loadConfig, resolveDbPath, getWorkspace, getWorkspaceProjects } from '../pipeline/config.js';
import { loadImportMap } from '../pipeline/importMap.js';
import { getDB } from '../storage/GraphDB.js';
import { getTrustedQueryService } from '../core/graph/query/TrustedQueryService.js';
import { registerRepo } from '../registry/index.js';
import { exportGraphML } from '../export/graphml.js';
import { exportObsidian } from '../export/obsidian.js';
import { exportNeo4j } from '../export/neo4j.js';
import { OperationResolver } from '../core/graph/query/OperationResolver.js';
import { StructuredAskEngine } from '../core/ask/StructuredAskEngine.js';
import type { StructuredQueryType } from '../core/ask/StructuredAskEngine.js';
import { AgentContextBuilder } from '../core/agent/AgentContextBuilder.js';
import { DriftDetector } from '../core/drift/DriftDetector.js';
import { GovernanceValidator } from '../core/graph/policy/GovernanceValidator.js';
import { GraphValidator } from '../core/graph/validation/GraphValidator.js';
import { WikiBuilder } from '../pipeline/stages/08_wiki.js';
import { ReportBuilder } from '../pipeline/stages/09_report.js';
import { ArtifactStore } from '../pipeline/artifacts/graphArtifacts.js';
import { ArchitectureReviewEngine } from '../core/graph/analysis/architecture/ArchitectureReviewEngine.js';
import { ArchitectureReportWriter } from '../core/graph/analysis/architecture/ArchitectureReportWriter.js';
import type { ArchitectureReport } from '../core/graph/analysis/architecture/types.js';
import type { QueryMode } from '../core/types.js';
import type { ImportMapArtifact } from '../pipeline/importMap.js';

function parseFlag(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  return args[i + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function positionalArgs(args: string[]): string[] {
  const valueFlags = new Set(['--workspace', '--diff', '--format', '--query-type', '--mode', '--max-nodes', '--max-edges', '--max-suggestions', '--type']);
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (valueFlags.has(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith('--')) out.push(arg);
  }
  return out;
}

function help(): void {
  console.log(`crg commands:
  build [workspace] [--incremental]
      Run the full pipeline (sync through report)
  sync [--workspace <id>]
      Run the sync stage (copy/link source files)
  extract [--workspace <id>]
      Run the extract stage (produce candidate records)
  normalize [--workspace <id>]
      Run sync + extract + normalize stages
  validate [--workspace <id>]
      Run sync + extract + normalize + validate stages
  graph [--workspace <id>]
      Run sync through graph build stages (canonical, derived, exploratory, flows)
  watch [workspace]
  ask <question> [--workspace <id>] [--query-type <type>] [--mode <mode>]
      query types: what-is-symbol, what-depends-on, what-route-calls, lineage, impact, why-canonical, why-insufficient-context
      modes: authoritative (default), mixed_safe, exploratory
  agent-context <task> [--workspace <id>] [--mode <mode>] [--max-nodes <n>] [--max-edges <n>] [--max-suggestions <n>]
      modes: authoritative (default), mixed_safe, exploratory
  drift [--workspace <id>]
      Run drift detection against baseline
  verify [--workspace <id>]
      Run governance validation and graph invariant checks
  wiki [--workspace <id>]
      Generate trust-aware wiki pages
  report [--workspace <id>] [--type <type>]
      Generate reports. Types: quality, verification, lint, digest, metrics, edge-health, ask-readiness, agent-context-readiness, all (default)
  impact [--diff <base..head>] [--workspace <id>]
  serve-mcp
  stats [workspace]
  search <query> [--workspace <id>]
  register <repoPath>
  export [--format graphml|obsidian|neo4j] [--workspace <id>]
  review-architecture [workspace] [--workspace <id>] [--mode <mode>] [--output <path>] [--json] [--fail-on-critical]
      Run architecture review analysis
      modes: authoritative (default), mixed_safe, exploratory`);
}

async function resolveWorkspace(explicit: string | undefined): Promise<string> {
  const cfg = await loadConfig();
  const ws = explicit ?? cfg.workspaces[0]?.id;
  if (!ws) throw new Error('No workspace found');
  return ws;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = argv.slice(1);

  if (!command || command === '--help' || command === '-h') {
    help();
    return;
  }

  if (command === 'build') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(workspace);
    try {
      await runPipeline(ws, { incremental: hasFlag(rest, '--incremental') });
      const result = {
        status: 'OK',
        workspace: ws,
        stage: 'build',
        message: `build completed for workspace=${ws}`,
        codes: [] as string[],
      };
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const codes = (error as { codes?: string[] }).codes ?? ['PIPELINE_FAILED'];
      const stage = (error as { stage?: string }).stage ?? 'unknown';
      const errorOutput = {
        status: 'error',
        workspace: ws,
        stage,
        codes,
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'sync') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? (rest[0]?.startsWith('--') ? undefined : rest[0]));
    const config = await loadConfig();
    const workspace = getWorkspace(config, ws);

    try {
      await PipelineStages.syncSources(workspace, config);
      const result = {
        status: 'OK',
        workspace: ws,
        stage: 'sync',
        message: `sync completed for workspace=${ws}`,
        codes: [] as string[],
      };
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        workspace: ws,
        stage: 'sync',
        codes: ['WORKSPACE_CONFIG_INVALID'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'extract') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? (rest[0]?.startsWith('--') ? undefined : rest[0]));
    const config = await loadConfig();
    const workspace = getWorkspace(config, ws);
    const db = getDB(resolveDbPath(config));

    try {
      // Sync first to ensure sources are available
      await PipelineStages.syncSources(workspace, config);
      const extraction = await PipelineStages.extractCandidates(workspace, config, db, {});
      const result = {
        status: 'OK',
        workspace: ws,
        stage: 'extract',
        candidateCount: extraction.candidates.length,
        rejectCount: extraction.rejects.length,
        codes: [] as string[],
      };
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        workspace: ws,
        stage: 'extract',
        codes: ['EXTRACTION_FAILED'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'normalize') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? (rest[0]?.startsWith('--') ? undefined : rest[0]));
    const config = await loadConfig();
    const workspace = getWorkspace(config, ws);
    const db = getDB(resolveDbPath(config));

    try {
      // Run prerequisite stages: sync → extract → normalize
      await PipelineStages.syncSources(workspace, config);
      const extraction = await PipelineStages.extractCandidates(workspace, config, db, {});
      const normalized = await PipelineStages.normalizeFacts(extraction.candidates, ws);
      const result = {
        status: 'OK',
        workspace: ws,
        stage: 'normalize',
        inputCount: extraction.candidates.length,
        normalizedCount: normalized.length,
        codes: [] as string[],
      };
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        workspace: ws,
        stage: 'normalize',
        codes: ['NORMALIZATION_FAILED'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'validate') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? (rest[0]?.startsWith('--') ? undefined : rest[0]));
    const config = await loadConfig();
    const workspace = getWorkspace(config, ws);
    const db = getDB(resolveDbPath(config));

    try {
      // Run prerequisite stages: sync → extract → normalize → validate
      await PipelineStages.syncSources(workspace, config);
      const extraction = await PipelineStages.extractCandidates(workspace, config, db, {});
      const normalized = await PipelineStages.normalizeFacts(extraction.candidates, ws);
      const validated = await PipelineStages.validateFacts(normalized, ws, db);
      const result = {
        status: 'OK',
        workspace: ws,
        stage: 'validate',
        inputCount: normalized.length,
        validCount: validated.facts.length,
        rejectCount: validated.rejects.length,
        codes: [] as string[],
      };
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const codes = (error as { codes?: string[] }).codes ?? ['VERIFY_FAILED'];
      const errorOutput = {
        status: 'error',
        workspace: ws,
        stage: 'validate',
        codes,
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'graph') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? (rest[0]?.startsWith('--') ? undefined : rest[0]));
    const config = await loadConfig();
    const workspace = getWorkspace(config, ws);
    const db = getDB(resolveDbPath(config));

    try {
      // Run prerequisite stages: sync → extract → normalize → validate → build graph
      await PipelineStages.syncSources(workspace, config);
      const extraction = await PipelineStages.extractCandidates(workspace, config, db, {});
      const normalized = await PipelineStages.normalizeFacts(extraction.candidates, ws);
      const validated = await PipelineStages.validateFacts(normalized, ws, db);

      // Clear workspace data before graph build
      db.clearWorkspaceData(workspace.id, workspace.projects);

      // Build canonical
      const canonical = await PipelineStages.buildCanonicalGraph(validated.facts, ws, db);

      // Build derived (with import maps)
      const projects = getWorkspaceProjects(config, ws);
      const importMaps = (await Promise.all(projects.map((p) => loadImportMap(config, p.id))))
        .filter((m): m is ImportMapArtifact => m !== undefined);
      const derived = await PipelineStages.buildDerivedGraph(validated.facts, ws, db, {
        importMaps,
        canonicalNodes: canonical.nodes,
      });

      // Build exploratory
      const exploratory = await PipelineStages.buildExploratoryGraph(validated.facts, ws, db);

      // Build flows
      const allNodes = [...canonical.nodes, ...derived.nodes, ...exploratory.nodes];
      const allEdges = [...canonical.edges, ...derived.edges, ...exploratory.edges];
      await PipelineStages.buildFlowGraph(allNodes, allEdges, ws, db);

      // Write graph artifacts
      await PipelineStages.writeGraphArtifacts(db, ws);

      const result = {
        status: 'OK',
        workspace: ws,
        stage: 'graph',
        summary: {
          canonicalNodes: canonical.nodes.length,
          canonicalEdges: canonical.edges.length,
          derivedNodes: derived.nodes.length,
          derivedEdges: derived.edges.length,
          exploratoryNodes: exploratory.nodes.length,
          exploratoryEdges: exploratory.edges.length,
        },
        codes: [] as string[],
      };
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const codes = (error as { codes?: string[] }).codes ?? ['GRAPH_BUILD_FAILED'];
      const errorOutput = {
        status: 'error',
        workspace: ws,
        stage: 'graph',
        codes,
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'watch') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(workspace);
    await startWatch(ws);
    return;
  }

  if (command === 'ask') {
    const question = positionalArgs(rest)[0];
    if (!question) throw new Error('ask requires <question>');
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));

    const queryType = parseFlag(rest, '--query-type') as StructuredQueryType | undefined;
    const modeFlag = parseFlag(rest, '--mode') as QueryMode | undefined;
    const mode: QueryMode = modeFlag ?? 'authoritative';

    const validQueryTypes: StructuredQueryType[] = [
      'what-is-symbol',
      'what-depends-on',
      'what-route-calls',
      'lineage',
      'impact',
      'why-canonical',
      'why-insufficient-context',
    ];
    if (queryType && !validQueryTypes.includes(queryType)) {
      throw new Error(`Invalid --query-type: ${queryType}. Valid values: ${validQueryTypes.join(', ')}`);
    }

    const validModes: QueryMode[] = ['authoritative', 'mixed_safe', 'exploratory'];
    if (modeFlag && !validModes.includes(mode)) {
      throw new Error(`Invalid --mode: ${modeFlag}. Valid values: ${validModes.join(', ')}`);
    }

    const service = getTrustedQueryService(getDB(resolveDbPath()));
    const engine = new StructuredAskEngine((workspaceId) => service.engine(workspaceId));

    const result = await engine.ask({
      question,
      workspace: ws,
      queryType,
      mode,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'agent-context') {
    const task = positionalArgs(rest)[0];
    if (!task) throw new Error('agent-context requires <task>');
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));

    const modeFlag = parseFlag(rest, '--mode') as QueryMode | undefined;
    const mode: QueryMode = modeFlag ?? 'authoritative';

    const validModes: QueryMode[] = ['authoritative', 'mixed_safe', 'exploratory'];
    if (modeFlag && !validModes.includes(mode)) {
      throw new Error(`Invalid --mode: ${modeFlag}. Valid values: ${validModes.join(', ')}`);
    }

    const maxNodesStr = parseFlag(rest, '--max-nodes');
    const maxEdgesStr = parseFlag(rest, '--max-edges');
    const maxSuggestionsStr = parseFlag(rest, '--max-suggestions');

    const limits: { maxNodes?: number; maxEdges?: number; maxSuggestions?: number } = {};
    if (maxNodesStr) {
      const n = parseInt(maxNodesStr, 10);
      if (isNaN(n) || n < 1) throw new Error(`Invalid --max-nodes: ${maxNodesStr}. Must be a positive integer.`);
      limits.maxNodes = n;
    }
    if (maxEdgesStr) {
      const n = parseInt(maxEdgesStr, 10);
      if (isNaN(n) || n < 1) throw new Error(`Invalid --max-edges: ${maxEdgesStr}. Must be a positive integer.`);
      limits.maxEdges = n;
    }
    if (maxSuggestionsStr) {
      const n = parseInt(maxSuggestionsStr, 10);
      if (isNaN(n) || n < 0) throw new Error(`Invalid --max-suggestions: ${maxSuggestionsStr}. Must be a non-negative integer.`);
      limits.maxSuggestions = n;
    }

    const service = getTrustedQueryService(getDB(resolveDbPath()));
    const builder = new AgentContextBuilder((workspaceId) => service.engine(workspaceId));

    try {
      const result = await builder.build({
        task,
        workspace: ws,
        mode,
        limits: Object.keys(limits).length > 0 ? limits : undefined,
      });
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        codes: ['AGENT_CONTEXT_BUILD_FAILED'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'impact') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const range = parseFlag(rest, '--diff') ?? 'HEAD~1..HEAD';
    const [baseRaw, headRaw] = range.split('..');
    const base = baseRaw || 'HEAD~1';
    const head = headRaw || 'HEAD';
    const diff = await getDiff(process.cwd(), base, head);
    const report = await buildImpactReport(diff, ws);
    // buildImpactReport already returns QueryResult shape
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (command === 'drift') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const config = await loadConfig();
    const db = getDB(resolveDbPath(config));
    const artifactStore = new ArtifactStore();
    const baselinesDir = artifactStore.getSubdir(ws, 'baselines');
    const detector = new DriftDetector(db, baselinesDir);

    try {
      const report = await detector.detect(ws);
      console.log(JSON.stringify(report, null, 2));
      if (report.status === 'fail') process.exitCode = 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        codes: ['DRIFT_DETECTION_FAILED'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'verify') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const config = await loadConfig();
    const db = getDB(resolveDbPath(config));
    const workspace = getWorkspace(config, ws);

    // Get all nodes and edges from the workspace
    const canonicalNodes = db.getNodesByWorkspace(ws, 'canonical');
    const derivedNodes = db.getNodesByWorkspace(ws, 'derived');
    const exploratoryNodes = db.getNodesByWorkspace(ws, 'exploratory');
    const allNodes = [...canonicalNodes, ...derivedNodes, ...exploratoryNodes];
    const allEdges = db.getEdgesByWorkspace(ws);

    // Register CallerID and resolve operation
    const operation = OperationResolver.resolve({ caller: 'cli.verify' });

    // Run graph structural validation
    const graphValidation = GraphValidator.validate(allNodes, allEdges, {
      externalWorkflowEnabled: workspace.external_workflow_enabled ?? false,
    });

    // Run governance validation
    const govValidation = GovernanceValidator.validate(allNodes, allEdges, {
      governance: workspace.governance,
    });

    const issues = [
      ...graphValidation.issues.map((i) => ({
        source: 'graph-validator' as const,
        code: i.code,
        severity: i.severity,
        nodeId: i.nodeId,
        edgeId: i.edgeId,
        detail: i.detail,
      })),
      ...govValidation.issues.map((i) => ({
        source: 'governance-validator' as const,
        code: i.code,
        severity: i.severity,
        nodeId: i.nodeId,
        edgeId: i.edgeId,
        detail: i.detail,
        chainBreak: i.chainBreak,
      })),
    ];

    const passed = govValidation.passed && graphValidation.issues.filter((i) => i.severity === 'error').length === 0;

    const result = {
      status: passed ? 'OK' : 'POLICY_VIOLATION',
      operation,
      workspace: ws,
      passed,
      summary: {
        totalIssues: issues.length,
        errors: issues.filter((i) => i.severity === 'error').length,
        warnings: issues.filter((i) => i.severity === 'warning').length,
        nodeCount: allNodes.length,
        edgeCount: allEdges.length,
      },
      issues,
      codes: [
        ...govValidation.codes,
        ...graphValidation.issues.filter((i) => i.severity === 'error').map((i) => i.code),
      ],
    };

    console.log(JSON.stringify(result, null, 2));
    if (!passed) process.exitCode = 1;
    return;
  }

  if (command === 'wiki') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? (rest[0]?.startsWith('--') ? undefined : rest[0]));
    const config = await loadConfig();
    const db = getDB(resolveDbPath(config));

    // Register CallerID and resolve operation
    const operation = OperationResolver.resolve({ caller: 'cli.wiki' });

    // Get all nodes and edges from the workspace
    const canonicalNodes = db.getNodesByWorkspace(ws, 'canonical');
    const derivedNodes = db.getNodesByWorkspace(ws, 'derived');
    const exploratoryNodes = db.getNodesByWorkspace(ws, 'exploratory');
    const allNodes = [...canonicalNodes, ...derivedNodes, ...exploratoryNodes];
    const allEdges = db.getEdgesByWorkspace(ws);

    const wikiBuilder = new WikiBuilder();

    try {
      const pages = await wikiBuilder.generate(ws, allNodes, allEdges);

      const result = {
        status: 'OK',
        operation,
        workspace: ws,
        pagesGenerated: pages.length,
        pages: pages.map((p) => ({
          id: p.id,
          title: p.title,
          pageType: p.pageType,
          status: p.status,
        })),
        codes: [] as string[],
      };

      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        codes: ['WIKI_BUILD_FAILED'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'report') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const reportType = parseFlag(rest, '--type') ?? 'all';
    const config = await loadConfig();
    const db = getDB(resolveDbPath(config));

    const validTypes = ['quality', 'verification', 'lint', 'digest', 'metrics', 'edge-health', 'ask-readiness', 'agent-context-readiness', 'all'];
    if (!validTypes.includes(reportType)) {
      const errorOutput = {
        status: 'error',
        codes: ['INVALID_REPORT_TYPE'],
        message: `Invalid --type: ${reportType}. Valid values: ${validTypes.join(', ')}`,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
      return;
    }

    // Get all nodes and edges from the workspace
    const canonicalNodes = db.getNodesByWorkspace(ws, 'canonical');
    const derivedNodes = db.getNodesByWorkspace(ws, 'derived');
    const exploratoryNodes = db.getNodesByWorkspace(ws, 'exploratory');
    const allNodes = [...canonicalNodes, ...derivedNodes, ...exploratoryNodes];
    const allEdges = db.getEdgesByWorkspace(ws);

    const service = getTrustedQueryService(db);
    const askEngine = new StructuredAskEngine((workspaceId) => service.engine(workspaceId));
    const builder = new ReportBuilder(config, (workspaceId) => service.engine(workspaceId), askEngine);

    try {
      const generated: string[] = [];

      if (reportType === 'all' || reportType === 'quality') {
        await builder.writeQualityReport(ws, allNodes, allEdges);
        generated.push('quality');
      }
      if (reportType === 'all' || reportType === 'verification') {
        // Run a quick verify to get verification data
        const workspace = getWorkspace(config, ws);
        const govValidation = GovernanceValidator.validate(allNodes, allEdges, {
          governance: workspace.governance,
        });
        const graphValidation = GraphValidator.validate(allNodes, allEdges, {
          externalWorkflowEnabled: workspace.external_workflow_enabled ?? false,
        });
        const errorCount = graphValidation.issues.filter((i) => i.severity === 'error').length;
        await builder.writeVerificationReport(ws, {
          passed: govValidation.passed && errorCount === 0,
          issues: [
            ...govValidation.issues.map((i) => `${i.code}: ${i.detail}`),
            ...graphValidation.issues.filter((i) => i.severity === 'error').map((i) => `${i.code}: ${i.detail}`),
          ],
          invariants_checked: govValidation.issues.length + graphValidation.issues.length,
          invariants_passed: govValidation.issues.filter((i) => i.severity !== 'error').length + graphValidation.issues.filter((i) => i.severity !== 'error').length,
        });
        generated.push('verification');
      }
      if (reportType === 'all' || reportType === 'lint') {
        const graphValidation = GraphValidator.validate(allNodes, allEdges, {
          externalWorkflowEnabled: false,
        });
        await builder.writeLintReport(ws, graphValidation.issues.map((issue, idx) => ({
          id: issue.nodeId ?? issue.edgeId ?? `lint-${idx}`,
          severity: issue.severity,
          message: issue.detail,
        })));
        generated.push('lint');
      }
      if (reportType === 'all' || reportType === 'digest') {
        await builder.writeDigest(ws, allNodes, allEdges);
        generated.push('digest');
      }
      if (reportType === 'all' || reportType === 'metrics') {
        await builder.writeMetrics(ws, allNodes, allEdges);
        generated.push('metrics');
      }
      if (reportType === 'all' || reportType === 'edge-health') {
        await builder.writeEdgeHealth(ws, allEdges, allNodes);
        generated.push('edge-health');
      }
      if (reportType === 'all' || reportType === 'ask-readiness') {
        await builder.writeAskReadiness(ws);
        generated.push('ask-readiness');
      }
      if (reportType === 'all' || reportType === 'agent-context-readiness') {
        await builder.writeAgentContextReadiness(ws);
        generated.push('agent-context-readiness');
      }

      const result = {
        status: 'OK',
        workspace: ws,
        reportsGenerated: generated,
        codes: [] as string[],
      };

      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = {
        status: 'error',
        codes: ['REPORT_BUILD_FAILED'],
        message: errorMessage,
      };
      console.log(JSON.stringify(errorOutput, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'serve-mcp') {
    await import('../mcp/server.js');
    return;
  }

  if (command === 'stats') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(workspace);
    const modeFlag = parseFlag(rest, '--mode') as QueryMode | undefined;
    const mode: QueryMode = modeFlag ?? 'authoritative';
    const validModes: QueryMode[] = ['authoritative', 'mixed_safe', 'exploratory'];
    if (modeFlag && !validModes.includes(mode)) {
      throw new Error(`Invalid --mode: ${modeFlag}. Valid values: ${validModes.join(', ')}`);
    }
    const operation = OperationResolver.resolve({ caller: 'cli.stats' });
    const result = await getTrustedQueryService(getDB(resolveDbPath())).engine(ws).getGraphStats(operation, mode);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'search') {
    const query = rest.find((r) => !r.startsWith('--'));
    if (!query) throw new Error('search requires <query>');
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const modeFlag = parseFlag(rest, '--mode') as QueryMode | undefined;
    const mode: QueryMode = modeFlag ?? 'authoritative';
    const validModes: QueryMode[] = ['authoritative', 'mixed_safe', 'exploratory'];
    if (modeFlag && !validModes.includes(mode)) {
      throw new Error(`Invalid --mode: ${modeFlag}. Valid values: ${validModes.join(', ')}`);
    }
    const operation = OperationResolver.resolve({ caller: 'cli.search' });
    const result = await getTrustedQueryService(getDB(resolveDbPath())).engine(ws).searchNodes(query, operation, mode, 25);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'register') {
    const repoPath = rest[0];
    if (!repoPath) throw new Error('register requires <repoPath>');
    const repo = await registerRepo(repoPath);
    console.log(JSON.stringify(repo, null, 2));
    return;
  }

  if (command === 'review-architecture') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace') ?? workspace);
    const modeFlag = parseFlag(rest, '--mode') as QueryMode | undefined;
    const mode: QueryMode = modeFlag ?? 'authoritative';
    const outputPath = parseFlag(rest, '--output');

    const validModes: QueryMode[] = ['authoritative', 'mixed_safe', 'exploratory'];
    if (modeFlag && !validModes.includes(mode)) {
      throw new Error(`Invalid --mode: ${modeFlag}. Valid values: ${validModes.join(', ')}`);
    }

    const operation = OperationResolver.resolve({ caller: 'cli.review-architecture' });
    const service = getTrustedQueryService(getDB(resolveDbPath()));
    const engine = new ArchitectureReviewEngine(service);
    const result = await engine.review(ws, mode, operation);

    // Write report
    const report = (result.metadata as { report: ArchitectureReport }).report;
    const writer = new ArchitectureReportWriter();
    writer.write(ws, report, outputPath ?? undefined);

    if (hasFlag(rest, '--json')) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Human-readable summary
      console.log(`Architecture Review: ${ws}`);
      console.log(`  Findings: ${report.summary.totalFindings} (${report.summary.critical} critical, ${report.summary.warning} warning, ${report.summary.info} info)`);
      console.log(`  Modules: ${report.metrics.moduleCount}`);
      console.log(`  Cycles: ${report.metrics.cycleCount}`);
      console.log(`  Dead Code: ${report.metrics.deadCodeCount}`);
      if (report.recommendations.length > 0) {
        console.log(`  Top Recommendations:`);
        for (const rec of report.recommendations.slice(0, 3)) {
          console.log(`    [${rec.priority}] ${rec.description}`);
        }
      }
    }

    if (hasFlag(rest, '--fail-on-critical') && report.summary.critical > 0) {
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'export') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const format = parseFlag(rest, '--format') ?? 'graphml';
    const operation = OperationResolver.resolve({ caller: 'cli.export' });
    const graph = await getTrustedQueryService(getDB(resolveDbPath())).engine(ws).getVisibleGraph(operation, 'authoritative');
    const { nodes, edges } = graph;

    let exportData: string;
    if (format === 'graphml') exportData = exportGraphML(nodes, edges);
    else if (format === 'obsidian') exportData = JSON.stringify(exportObsidian(nodes, edges), null, 2);
    else if (format === 'neo4j') exportData = exportNeo4j(nodes, edges).join('\n');
    else throw new Error(`Unsupported format: ${format}`);

    // Wrap export output in QueryResult envelope for contract compliance
    const result = {
      status: 'OK',
      reasoning: { selected_paths: [], selection_explanation: [`exported ${format} format for workspace ${ws}`] },
      data: { nodes: [], edges: [], export: exportData, format, nodeCount: nodes.length, edgeCount: edges.length },
      confidence: { level: 'HIGH', reasons: ['export from authoritative graph data'] },
      provenance: { sources: nodes.slice(0, 10).map((n: typeof nodes[number]) => n.provenance) },
      warnings: [] as string[],
      codes: [] as string[],
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

await main();
