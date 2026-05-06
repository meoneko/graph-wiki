import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { runPipeline } from '../pipeline/run.js';
import { startWatch } from '../pipeline/watch.js';
import { getDiff } from '../pipeline/gitDiff.js';
import { buildImpactReport } from '../pipeline/impactReport.js';
import { runPostProcess } from '../pipeline/postprocess.js';
import { loadConfig, resolveDbPath } from '../pipeline/config.js';
import { getDB } from '../storage/GraphDB.js';
import { getTrustedQueryService } from '../core/graph/query/TrustedQueryService.js';
import { registerRepo } from '../registry/index.js';
import { exportGraphML } from '../export/graphml.js';
import { exportObsidian } from '../export/obsidian.js';
import { exportNeo4j } from '../export/neo4j.js';
import { OperationResolver } from '../core/graph/query/OperationResolver.js';

function parseFlag(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  return args[i + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function positionalArgs(args: string[]): string[] {
  const valueFlags = new Set(['--workspace', '--diff', '--format']);
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
  watch [workspace]
  ask <question> [--workspace <id>]
  impact [--diff <base..head>] [--workspace <id>]
  wiki [workspace]
  postprocess [workspace]
  serve-mcp
  stats [workspace]
  search <query> [--workspace <id>]
  register <repoPath>
  export [--format graphml|obsidian|neo4j] [--workspace <id>]`);
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
    await runPipeline(ws, { incremental: hasFlag(rest, '--incremental') });
    console.log(`build completed for workspace=${ws}`);
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
    const exactOnly = hasFlag(rest, '--exact');
    if (!question) throw new Error('ask requires <question>');
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const result = await getTrustedQueryService(getDB(resolveDbPath())).ask(question, ws, 'mixed_safe', exactOnly);
    console.log(JSON.stringify(result, null, 2));
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
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (command === 'wiki') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(workspace);
    await runPipeline(ws, { incremental: true });
    console.log(`wiki regenerated for workspace=${ws}`);
    return;
  }

  if (command === 'postprocess') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(workspace);
    const result = await runPostProcess(getDB(resolveDbPath()), ws);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'serve-mcp') {
    const { startMcpServer } = await import('../mcp/server.js');
    await startMcpServer();
    return;
  }

  if (command === 'stats') {
    const workspace = rest[0]?.startsWith('--') ? undefined : rest[0];
    const ws = await resolveWorkspace(workspace);
    const operation = OperationResolver.resolve({ caller: 'cli.stats' });
    const result = await getTrustedQueryService(getDB(resolveDbPath())).engine(ws).getGraphStats(operation, 'mixed_safe');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'search') {
    const query = rest.find((r) => !r.startsWith('--'));
    if (!query) throw new Error('search requires <query>');
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const operation = OperationResolver.resolve({ caller: 'cli.search' });
    const result = await getTrustedQueryService(getDB(resolveDbPath())).engine(ws).searchNodes(query, operation, 'mixed_safe', 25);
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

  if (command === 'export') {
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    const format = parseFlag(rest, '--format') ?? 'graphml';
    const operation = OperationResolver.resolve({ caller: 'cli.export' });
    const graph = await getTrustedQueryService(getDB(resolveDbPath())).engine(ws).getVisibleGraph(operation, 'authoritative');
    const { nodes, edges } = graph;

    if (format === 'graphml') console.log(exportGraphML(nodes, edges));
    else if (format === 'obsidian') console.log(JSON.stringify(exportObsidian(nodes, edges), null, 2));
    else if (format === 'neo4j') console.log(exportNeo4j(nodes, edges).join('\n'));
    else throw new Error(`Unsupported format: ${format}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

await main();
