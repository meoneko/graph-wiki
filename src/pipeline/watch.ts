import chokidar from 'chokidar';
import { debounce } from './utils.js';
import { loadConfig, getWorkspace } from './config.js';
import { runPipeline } from './run.js';
import { closeAllDBs } from '../storage/GraphDB.js';
import { canonicalizePath } from '../storage/pathUtils.js';

export async function startWatch(workspaceId: string): Promise<void> {
  const config = await loadConfig();
  const ws = getWorkspace(config, workspaceId);
  const paths = ws.projects
    .map((pid) => config.projects.find((p) => p.id === pid)?.path)
    .filter((p): p is string => Boolean(p));

  const pending = new Set<string>();

  const rebuild = debounce(async () => {
    const changed = [...pending];
    pending.clear();
    if (changed.length === 0) return;
    console.log(`[watch] ${changed.length} files changed, rebuilding...`);
    await runPipeline(workspaceId, { incremental: true, changedFiles: changed });
  }, 500);

  const watcher = chokidar.watch(paths, {
    ignoreInitial: true,
    ignored: /(node_modules|\.git|dist|build|\.code-review-graph)/,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  const onChange = (p: string): void => {
    pending.add(canonicalizePath(p));
    void rebuild();
  };

  watcher.on('change', onChange);
  watcher.on('add', onChange);
  watcher.on('unlink', onChange);

  const shutdown = async (): Promise<void> => {
    console.log('[watch] shutting down...');
    await watcher.close();
    closeAllDBs();
    process.exit(0);
  };

  process.on('SIGINT', () => { void shutdown(); });
  process.on('SIGTERM', () => { void shutdown(); });
}
