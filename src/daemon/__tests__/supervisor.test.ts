import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeBackoff, Supervisor, type WorkerState } from '../supervisor.js';

// Mock loadConfig to return a workspace list
vi.mock('../../pipeline/config.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    workspaces: [{ id: 'test-ws', projects: [] }],
    projects: [],
    outputs: {
      source_root: './knowledge/sources',
      state_root: './knowledge/artifacts/internal/state',
      records_root: './knowledge/artifacts/internal/records',
      wiki_root: './knowledge/wiki',
      index_root: './knowledge/artifacts/internal/index',
      reports_root: './knowledge/reports',
    },
  }),
}));

// Track call count for worker mock
let workerCallCount = 0;

vi.mock('../worker.js', () => ({
  runWorker: vi.fn().mockImplementation(() => {
    workerCallCount++;
    if (workerCallCount <= 2) {
      return Promise.reject(new Error(`Crash #${workerCallCount}`));
    }
    // Third call: return a promise that never resolves (simulates running worker)
    return new Promise(() => {});
  }),
}));

describe('computeBackoff', () => {
  it('returns 2000ms for restartCount=0', () => {
    expect(computeBackoff(0)).toBe(2000);
  });

  it('returns 4000ms for restartCount=1', () => {
    expect(computeBackoff(1)).toBe(4000);
  });

  it('returns 8000ms for restartCount=2', () => {
    expect(computeBackoff(2)).toBe(8000);
  });

  it('returns 16000ms for restartCount=3', () => {
    expect(computeBackoff(3)).toBe(16000);
  });

  it('returns 32000ms for restartCount=4', () => {
    expect(computeBackoff(4)).toBe(32000);
  });

  it('caps at 60000ms for restartCount=5', () => {
    expect(computeBackoff(5)).toBe(60000);
  });

  it('stays capped at 60000ms for restartCount=6', () => {
    expect(computeBackoff(6)).toBe(60000);
  });

  it('stays capped at 60000ms for restartCount=10', () => {
    expect(computeBackoff(10)).toBe(60000);
  });

  it('follows the formula min(2^n * 2000, 60000)', () => {
    for (let n = 0; n < 20; n++) {
      const expected = Math.min(Math.pow(2, n) * 2000, 60000);
      expect(computeBackoff(n)).toBe(expected);
    }
  });
});

describe('Supervisor', () => {
  let supervisor: Supervisor;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-supervisor-test-'));
    supervisor = new Supervisor({
      foreground: true,
      logPath: path.join(tmpDir, 'daemon.log'),
      pidPath: path.join(tmpDir, 'test.pid'),
    });
  });

  afterEach(async () => {
    await supervisor.stop();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('initializes with no workers', () => {
    expect(supervisor.getWorkerStates()).toHaveLength(0);
  });

  it('stop is idempotent when not started', async () => {
    await supervisor.stop();
    await supervisor.stop();
    // Should not throw
  });
});

describe('Supervisor crash recovery', () => {
  let tmpDir: string;
  let logPath: string;
  let pidPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-supervisor-crash-'));
    logPath = path.join(tmpDir, 'daemon.log');
    pidPath = path.join(tmpDir, 'test.pid');
    workerCallCount = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('respawns worker after crash with exponential back-off', async () => {
    const supervisor = new Supervisor({
      foreground: true,
      logPath,
      pidPath,
    });

    await supervisor.start();

    // First crash happens immediately — worker should be in 'crashed' state
    // After first crash: restartCount becomes 1, backoffMs = 2^1 * 2000 = 4000
    await vi.advanceTimersByTimeAsync(100);

    let states = supervisor.getWorkerStates();
    expect(states.length).toBe(1);
    expect(states[0]!.status).toBe('crashed');
    expect(states[0]!.restartCount).toBe(1);
    expect(states[0]!.backoffMs).toBe(4000);

    // Advance past first back-off (4000ms) to trigger second spawn
    await vi.advanceTimersByTimeAsync(4000);

    // Second crash happens immediately
    await vi.advanceTimersByTimeAsync(100);

    states = supervisor.getWorkerStates();
    expect(states[0]!.status).toBe('crashed');
    expect(states[0]!.restartCount).toBe(2);
    expect(states[0]!.backoffMs).toBe(8000);

    // Advance past second back-off (8000ms) to trigger third spawn
    await vi.advanceTimersByTimeAsync(8000);

    // Third call succeeds (never resolves = running)
    await vi.advanceTimersByTimeAsync(100);

    states = supervisor.getWorkerStates();
    expect(states[0]!.status).toBe('running');

    // Verify log file was written with crash events
    expect(fs.existsSync(logPath)).toBe(true);
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const lines = logContent.trim().split('\n');
    // Should have multiple log entries (start, crash, restart, etc.)
    expect(lines.length).toBeGreaterThan(2);
    // At least one line should mention crash/restart
    const hasRestartLog = lines.some((line) => {
      const parsed = JSON.parse(line);
      return parsed.message.includes('crashed') || parsed.message.includes('restarting');
    });
    expect(hasRestartLog).toBe(true);

    await supervisor.stop();
  });
});

describe('WorkerState interface', () => {
  it('has correct shape', () => {
    const state: WorkerState = {
      workspaceId: 'test-ws',
      status: 'starting',
      restartCount: 0,
      backoffMs: 2000,
    };
    expect(state.workspaceId).toBe('test-ws');
    expect(state.status).toBe('starting');
    expect(state.restartCount).toBe(0);
    expect(state.backoffMs).toBe(2000);
  });

  it('supports all status values', () => {
    const statuses: WorkerState['status'][] = ['starting', 'running', 'crashed', 'stopped'];
    for (const status of statuses) {
      const state: WorkerState = {
        workspaceId: 'ws',
        status,
        restartCount: 0,
        backoffMs: 2000,
      };
      expect(state.status).toBe(status);
    }
  });

  it('supports optional fields', () => {
    const state: WorkerState = {
      workspaceId: 'ws',
      pid: 12345,
      status: 'running',
      restartCount: 3,
      lastBuildAt: '2024-01-01T00:00:00Z',
      lastError: 'ENOENT',
      backoffMs: 8000,
    };
    expect(state.pid).toBe(12345);
    expect(state.lastBuildAt).toBe('2024-01-01T00:00:00Z');
    expect(state.lastError).toBe('ENOENT');
  });
});
