import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPid, writePid, clearPid, isAlive } from './pidfile.js';
import { Supervisor } from './supervisor.js';

function getPidPath(): string {
  return path.resolve(process.cwd(), 'knowledge/.daemon.pid');
}

function getLogPath(): string {
  return path.resolve(process.cwd(), 'knowledge/logs/daemon.log');
}

/**
 * Handles `crg daemon <subcommand>` CLI commands.
 */
export async function handleDaemonCommand(subcommand: string | undefined, args: string[]): Promise<void> {
  const foreground = args.includes('--foreground');

  switch (subcommand) {
    case 'start':
      await startDaemon(foreground);
      break;
    case 'stop':
      await stopDaemon();
      break;
    case 'status':
      await statusDaemon();
      break;
    case 'restart':
      await stopDaemon();
      await startDaemon(foreground);
      break;
    default:
      console.error(`Unknown daemon subcommand: ${subcommand ?? '(none)'}`);
      console.error('Usage: crg daemon <start|stop|status|restart> [--foreground]');
      process.exitCode = 1;
  }
}

/**
 * Starts the daemon. In foreground mode, runs the Supervisor in the current
 * terminal (blocking). Otherwise, spawns a detached child process and returns
 * immediately.
 */
async function startDaemon(foreground: boolean): Promise<void> {
  const pidPath = getPidPath();

  // Check if already running
  const existingPid = readPid(pidPath);
  if (existingPid !== null && isAlive(existingPid)) {
    console.error(`Error: daemon already running (pid=${existingPid})`);
    process.exitCode = 1;
    return;
  }

  if (foreground) {
    // Run supervisor in current terminal (blocking)
    writePid(pidPath, process.pid);
    console.log(`Daemon running in foreground (pid=${process.pid})`);

    const supervisor = new Supervisor({
      foreground: true,
      pidPath,
      logPath: getLogPath(),
    });

    await supervisor.start();
    // In foreground mode, start() sets up workers that run indefinitely.
    // The process stays alive until SIGTERM/SIGINT (handled by Supervisor).
    return;
  }

  // Spawn detached child process
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const entryPoint = path.resolve(thisDir, 'index.js');

  const child = spawn(process.execPath, [entryPoint], {
    stdio: 'ignore',
    detached: true,
    cwd: process.cwd(),
    env: { ...process.env },
  });

  if (!child.pid) {
    console.error('Error: failed to spawn daemon process');
    process.exitCode = 1;
    return;
  }

  // Write PID file and detach
  writePid(pidPath, child.pid);
  child.unref();

  console.log(`Daemon started (pid=${child.pid})`);
}

/**
 * Stops the daemon by reading the PID file, sending SIGTERM (or taskkill on
 * Windows), and cleaning up the PID file.
 */
async function stopDaemon(): Promise<void> {
  const pidPath = getPidPath();
  const pid = readPid(pidPath);

  if (pid === null) {
    console.log('Daemon is not running (no PID file)');
    return;
  }

  if (!isAlive(pid)) {
    console.log(`Daemon is not running (stale PID file, pid=${pid})`);
    clearPid(pidPath);
    return;
  }

  // Send termination signal
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    console.log(`Daemon stopped (pid=${pid})`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error stopping daemon (pid=${pid}): ${message}`);
    process.exitCode = 1;
  }

  clearPid(pidPath);
}

/**
 * Reports daemon status: checks PID file and whether the process is alive.
 */
async function statusDaemon(): Promise<void> {
  const pidPath = getPidPath();
  const pid = readPid(pidPath);

  if (pid === null) {
    console.log('Daemon status: stopped (no PID file)');
    return;
  }

  if (!isAlive(pid)) {
    console.log(`Daemon status: dead (stale PID file, pid=${pid})`);
    clearPid(pidPath);
    return;
  }

  console.log(`Daemon status: running (pid=${pid})`);
}
