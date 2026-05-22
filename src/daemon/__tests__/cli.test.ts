import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { handleDaemonCommand } from './cli.js';

// Mock the supervisor to avoid actually starting watchers
vi.mock('./supervisor.js', () => {
  return {
    Supervisor: class MockSupervisor {
      options: unknown;
      constructor(options: unknown) {
        this.options = options;
        MockSupervisor.lastInstance = this;
        MockSupervisor.lastOptions = options;
      }
      start = vi.fn().mockResolvedValue(undefined);
      stop = vi.fn().mockResolvedValue(undefined);
      getWorkerStates = vi.fn().mockReturnValue([]);
      static lastInstance: unknown;
      static lastOptions: unknown;
    },
  };
});

// Mock child_process.spawn to avoid actually spawning processes
vi.mock('node:child_process', () => ({
  spawn: vi.fn().mockReturnValue({
    pid: 12345,
    unref: vi.fn(),
    on: vi.fn(),
  }),
}));

describe('daemon CLI', () => {
  let tmpDir: string;
  let originalCwd: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daemon-cli-test-'));
    originalCwd = process.cwd();
    // Create knowledge directory structure
    fs.mkdirSync(path.join(tmpDir, 'knowledge', 'logs'), { recursive: true });
    process.chdir(tmpDir);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.exitCode = undefined;
    vi.clearAllMocks();
  });

  describe('handleDaemonCommand', () => {
    it('prints error for unknown subcommand', async () => {
      await handleDaemonCommand('unknown', []);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown daemon subcommand'));
      expect(process.exitCode).toBe(1);
    });

    it('prints error when no subcommand provided', async () => {
      await handleDaemonCommand(undefined, []);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown daemon subcommand'));
      expect(process.exitCode).toBe(1);
    });

    it('start writes PID file when spawning detached process', async () => {
      await handleDaemonCommand('start', []);
      const pidPath = path.join(tmpDir, 'knowledge', '.daemon.pid');
      expect(fs.existsSync(pidPath)).toBe(true);
      const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
      expect(pid).toBe(12345);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Daemon started'));
    });

    it('start returns error when daemon already running', async () => {
      // Write a PID file with the current process PID (which is alive)
      const pidPath = path.join(tmpDir, 'knowledge', '.daemon.pid');
      fs.mkdirSync(path.dirname(pidPath), { recursive: true });
      fs.writeFileSync(pidPath, String(process.pid) + '\n');

      await handleDaemonCommand('start', []);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('daemon already running'));
      expect(process.exitCode).toBe(1);
    });

    it('stop clears stale PID file when process is not alive', async () => {
      // Write a PID file with a non-existent PID
      const pidPath = path.join(tmpDir, 'knowledge', '.daemon.pid');
      fs.mkdirSync(path.dirname(pidPath), { recursive: true });
      fs.writeFileSync(pidPath, '999999\n');

      await handleDaemonCommand('stop', []);
      expect(fs.existsSync(pidPath)).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not running'));
    });

    it('stop reports no PID file when daemon is not running', async () => {
      await handleDaemonCommand('stop', []);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not running'));
    });

    it('status reports stopped when no PID file exists', async () => {
      await handleDaemonCommand('status', []);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('stopped'));
    });

    it('status reports running when PID is alive', async () => {
      // Write a PID file with the current process PID (which is alive)
      const pidPath = path.join(tmpDir, 'knowledge', '.daemon.pid');
      fs.mkdirSync(path.dirname(pidPath), { recursive: true });
      fs.writeFileSync(pidPath, String(process.pid) + '\n');

      await handleDaemonCommand('status', []);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('running'));
    });

    it('status reports dead and clears stale PID file', async () => {
      const pidPath = path.join(tmpDir, 'knowledge', '.daemon.pid');
      fs.mkdirSync(path.dirname(pidPath), { recursive: true });
      fs.writeFileSync(pidPath, '999999\n');

      await handleDaemonCommand('status', []);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('dead'));
      expect(fs.existsSync(pidPath)).toBe(false);
    });

    it('start --foreground runs supervisor in current process', async () => {
      const { Supervisor } = await import('./supervisor.js');
      await handleDaemonCommand('start', ['--foreground']);

      // PID file should be written with current process PID
      const pidPath = path.join(tmpDir, 'knowledge', '.daemon.pid');
      expect(fs.existsSync(pidPath)).toBe(true);
      const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
      expect(pid).toBe(process.pid);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('foreground'));
    });

    it('start --foreground starts watcher and writes to daemon.log', async () => {
      const { Supervisor } = await import('./supervisor.js');
      await handleDaemonCommand('start', ['--foreground']);

      // Verify the Supervisor was instantiated with foreground: true and correct log path
      const MockSupervisor = Supervisor as unknown as { lastOptions: { foreground: boolean; logPath: string; pidPath: string } };
      expect(MockSupervisor.lastOptions.foreground).toBe(true);
      expect(MockSupervisor.lastOptions.logPath).toBe(path.join(tmpDir, 'knowledge', 'logs', 'daemon.log'));
    });
  });
});
