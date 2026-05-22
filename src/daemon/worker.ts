import { startWatch } from '../pipeline/watch.js';
import { appendLog, type DaemonLogEvent } from './logger.js';

/**
 * Configuration for a daemon worker that watches a single workspace.
 */
export interface WorkerConfig {
  workspaceId: string;
  logPath: string;
}

/**
 * Runs the watch loop for a single workspace.
 * This function is designed to be called by the supervisor — it never returns
 * under normal operation (startWatch is persistent). If startWatch throws,
 * the error propagates to the supervisor for back-off handling.
 */
export async function runWorker(config: WorkerConfig): Promise<void> {
  const { workspaceId, logPath } = config;

  log(logPath, 'info', workspaceId, `Worker starting for workspace "${workspaceId}"`);

  try {
    await startWatch(workspaceId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(logPath, 'error', workspaceId, `Worker crashed: ${message}`, {
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

/**
 * Helper to write a structured log event.
 */
function log(
  logPath: string,
  level: DaemonLogEvent['level'],
  workspaceId: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  appendLog(logPath, {
    timestamp: new Date().toISOString(),
    level,
    workspaceId,
    message,
    ...(data ? { data } : {}),
  });
}
