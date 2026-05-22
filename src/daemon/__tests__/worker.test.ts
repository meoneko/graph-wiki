import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runWorker } from './worker.js';

// Mock startWatch to control behavior in tests
vi.mock('../pipeline/watch.js', () => ({
  startWatch: vi.fn(),
}));

import { startWatch } from '../pipeline/watch.js';

const mockedStartWatch = vi.mocked(startWatch);

describe('runWorker', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daemon-worker-test-'));
    logPath = path.join(tmpDir, 'daemon.log');
    vi.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('calls startWatch with the workspace ID', async () => {
    mockedStartWatch.mockResolvedValueOnce(undefined);

    await runWorker({ workspaceId: 'my-workspace', logPath });

    expect(mockedStartWatch).toHaveBeenCalledWith('my-workspace');
  });

  it('writes a start log event', async () => {
    mockedStartWatch.mockResolvedValueOnce(undefined);

    await runWorker({ workspaceId: 'ws-1', logPath });

    const logContent = fs.readFileSync(logPath, 'utf-8');
    const lines = logContent.trim().split('\n');
    const event = JSON.parse(lines[0]!);
    expect(event.level).toBe('info');
    expect(event.workspaceId).toBe('ws-1');
    expect(event.message).toContain('Worker starting');
  });

  it('propagates errors from startWatch', async () => {
    mockedStartWatch.mockRejectedValueOnce(new Error('Config not found'));

    await expect(
      runWorker({ workspaceId: 'bad-ws', logPath }),
    ).rejects.toThrow('Config not found');
  });

  it('logs error details when startWatch throws', async () => {
    mockedStartWatch.mockRejectedValueOnce(new Error('ENOENT: file missing'));

    try {
      await runWorker({ workspaceId: 'crash-ws', logPath });
    } catch {
      // Expected
    }

    const logContent = fs.readFileSync(logPath, 'utf-8');
    const lines = logContent.trim().split('\n');
    // Should have start log + error log
    expect(lines.length).toBe(2);
    const errorEvent = JSON.parse(lines[1]!);
    expect(errorEvent.level).toBe('error');
    expect(errorEvent.workspaceId).toBe('crash-ws');
    expect(errorEvent.message).toContain('Worker crashed');
    expect(errorEvent.message).toContain('ENOENT: file missing');
  });
});
