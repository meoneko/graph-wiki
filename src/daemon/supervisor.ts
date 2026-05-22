import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../pipeline/config.js';
import { appendLog, type DaemonLogEvent } from './logger.js';
import { clearPid } from './pidfile.js';
import { runWorker } from './worker.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const INITIAL_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 60_000;
const STABLE_RUN_THRESHOLD_MS = 60_000;

const DEFAULT_PID_PATH = path.resolve(process.cwd(), 'knowledge/.daemon.pid');
const DEFAULT_LOG_PATH = path.resolve(process.cwd(), 'knowledge/logs/daemon.log');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorkerState {
  workspaceId: string;
  pid?: number;
  status: 'starting' | 'running' | 'crashed' | 'stopped';
  restartCount: number;
  lastBuildAt?: string;
  lastError?: string;
  backoffMs: number;
}

export interface SupervisorOptions {
  /** Run in foreground (in-process workers) instead of spawning child processes */
  foreground?: boolean;
  /** Override PID file path */
  pidPath?: string;
  /** Override log file path */
  logPath?: string;
}

// ─── Back-off Calculation ────────────────────────────────────────────────────

/**
 * Computes the exponential back-off delay for the nth consecutive crash.
 * Formula: min(2^n * 2000, 60000)
 *
 * Sequence: 2000, 4000, 8000, 16000, 32000, 60000, 60000, ...
 */
export function computeBackoff(restartCount: number): number {
  const delay = Math.pow(2, restartCount) * INITIAL_BACKOFF_MS;
  return Math.min(delay, MAX_BACKOFF_MS);
}

// ─── Supervisor ──────────────────────────────────────────────────────────────

export class Supervisor {
  private workers: Map<string, WorkerState> = new Map();
  private childProcesses: Map<string, ChildProcess> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private abortController: AbortController = new AbortController();
  private running = false;

  private readonly logPath: string;
  private readonly pidPath: string;
  private readonly foreground: boolean;

  constructor(options: SupervisorOptions = {}) {
    this.logPath = options.logPath ?? DEFAULT_LOG_PATH;
    this.pidPath = options.pidPath ?? DEFAULT_PID_PATH;
    this.foreground = options.foreground ?? false;
  }

  /**
   * Starts the supervisor: loads config, spawns workers for each workspace.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    this.setupSignalHandlers();

    const config = await loadConfig();
    const workspaceIds = config.workspaces.map((ws) => ws.id);

    this.log('info', undefined, `Supervisor starting with ${workspaceIds.length} workspace(s)`);

    for (const workspaceId of workspaceIds) {
      this.spawnWorker(workspaceId);
    }
  }

  /**
   * Gracefully stops all workers and cleans up.
   */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    this.log('info', undefined, 'Supervisor stopping — killing all workers');
    this.abortController.abort();

    // Clear all pending restart timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Kill all child processes (spawned mode)
    for (const [workspaceId, child] of this.childProcesses.entries()) {
      this.log('info', workspaceId, `Stopping worker (pid=${child.pid})`);
      try {
        if (process.platform === 'win32') {
          // On Windows, use taskkill for detached processes
          spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
        } else {
          child.kill('SIGTERM');
        }
      } catch {
        // Process may already be dead
      }
      const state = this.workers.get(workspaceId);
      if (state) state.status = 'stopped';
    }
    this.childProcesses.clear();

    // Mark all in-process workers as stopped
    for (const state of this.workers.values()) {
      if (state.status !== 'stopped') {
        state.status = 'stopped';
      }
    }

    // Clean up PID file
    clearPid(this.pidPath);
    this.log('info', undefined, 'Supervisor stopped');
  }

  /**
   * Returns the current state of all workers.
   */
  getWorkerStates(): WorkerState[] {
    return [...this.workers.values()];
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private spawnWorker(workspaceId: string): void {
    const existing = this.workers.get(workspaceId);
    const restartCount = existing?.restartCount ?? 0;
    const backoffMs = existing?.backoffMs ?? INITIAL_BACKOFF_MS;

    const state: WorkerState = {
      workspaceId,
      status: 'starting',
      restartCount,
      backoffMs,
    };
    this.workers.set(workspaceId, state);

    if (this.foreground) {
      this.spawnInProcess(workspaceId, state);
    } else {
      this.spawnChildProcess(workspaceId, state);
    }
  }

  /**
   * In-process (foreground) mode: runs the worker directly in this process.
   */
  private spawnInProcess(workspaceId: string, state: WorkerState): void {
    const startTime = Date.now();
    state.status = 'running';

    this.log('info', workspaceId, `Worker running in-process (foreground mode)`);

    runWorker({ workspaceId, logPath: this.logPath })
      .then(() => {
        // startWatch normally never resolves, but if it does, treat as clean exit
        if (this.running) {
          state.status = 'stopped';
          this.log('info', workspaceId, 'Worker exited cleanly');
        }
      })
      .catch((err: unknown) => {
        if (!this.running) return; // Supervisor is shutting down

        const elapsed = Date.now() - startTime;
        state.status = 'crashed';
        state.lastError = err instanceof Error ? err.message : String(err);

        // Reset back-off if the worker ran successfully for > 60s
        if (elapsed > STABLE_RUN_THRESHOLD_MS) {
          state.restartCount = 0;
          state.backoffMs = INITIAL_BACKOFF_MS;
        } else {
          state.restartCount++;
          state.backoffMs = computeBackoff(state.restartCount);
        }

        this.log('warn', workspaceId, `Worker crashed, restarting in ${state.backoffMs}ms (attempt #${state.restartCount})`, {
          error: state.lastError,
          elapsed,
        });

        this.scheduleRestart(workspaceId, state.backoffMs);
      });
  }

  /**
   * Spawned child process mode: uses child_process.spawn.
   * On Windows, uses `detached: true` (no fork()).
   */
  private spawnChildProcess(workspaceId: string, state: WorkerState): void {
    const startTime = Date.now();
    const thisFile = fileURLToPath(import.meta.url);
    const workerScript = path.resolve(path.dirname(thisFile), 'worker-entry.js');

    const isWindows = process.platform === 'win32';

    const child = spawn(
      process.execPath,
      [workerScript, workspaceId, this.logPath],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: isWindows,
        env: { ...process.env },
        cwd: process.cwd(),
      },
    );

    state.pid = child.pid;
    state.status = 'running';
    this.childProcesses.set(workspaceId, child);

    this.log('info', workspaceId, `Worker spawned (pid=${child.pid})`);

    child.on('exit', (code, signal) => {
      if (!this.running) return; // Supervisor is shutting down

      this.childProcesses.delete(workspaceId);
      const elapsed = Date.now() - startTime;

      if (code === 0) {
        state.status = 'stopped';
        this.log('info', workspaceId, 'Worker exited cleanly');
        return;
      }

      state.status = 'crashed';
      state.lastError = `Exit code=${code}, signal=${signal}`;

      // Reset back-off if the worker ran successfully for > 60s
      if (elapsed > STABLE_RUN_THRESHOLD_MS) {
        state.restartCount = 0;
        state.backoffMs = INITIAL_BACKOFF_MS;
      } else {
        state.restartCount++;
        state.backoffMs = computeBackoff(state.restartCount);
      }

      this.log('warn', workspaceId, `Worker crashed, restarting in ${state.backoffMs}ms (attempt #${state.restartCount})`, {
        code,
        signal,
        elapsed,
      });

      this.scheduleRestart(workspaceId, state.backoffMs);
    });

    child.on('error', (err) => {
      if (!this.running) return;
      state.status = 'crashed';
      state.lastError = err.message;
      this.log('error', workspaceId, `Worker spawn error: ${err.message}`);
    });
  }

  private scheduleRestart(workspaceId: string, delayMs: number): void {
    if (!this.running) return;

    const timer = setTimeout(() => {
      this.timers.delete(workspaceId);
      if (this.running) {
        this.spawnWorker(workspaceId);
      }
    }, delayMs);

    this.timers.set(workspaceId, timer);
  }

  private setupSignalHandlers(): void {
    const handler = (): void => {
      void this.stop().then(() => process.exit(0));
    };

    process.on('SIGTERM', handler);
    process.on('SIGINT', handler);
  }

  private log(
    level: DaemonLogEvent['level'],
    workspaceId: string | undefined,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    appendLog(this.logPath, {
      timestamp: new Date().toISOString(),
      level,
      ...(workspaceId ? { workspaceId } : {}),
      message,
      ...(data ? { data } : {}),
    });
  }
}
