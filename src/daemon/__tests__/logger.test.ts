import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { appendLog, type DaemonLogEvent } from './logger.js';

describe('logger', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-logger-test-'));
    logPath = path.join(tmpDir, 'daemon.log');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('appendLog', () => {
    it('writes a valid JSON line to the log file', () => {
      const event: DaemonLogEvent = {
        timestamp: '2026-01-15T10:00:00Z',
        level: 'info',
        message: 'Daemon started',
      };

      appendLog(logPath, event);

      const content = fs.readFileSync(logPath, 'utf-8');
      const parsed = JSON.parse(content.trim());
      expect(parsed.timestamp).toBe('2026-01-15T10:00:00Z');
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Daemon started');
    });

    it('appends multiple lines (JSONL format)', () => {
      const event1: DaemonLogEvent = {
        timestamp: '2026-01-15T10:00:00Z',
        level: 'info',
        message: 'First event',
      };
      const event2: DaemonLogEvent = {
        timestamp: '2026-01-15T10:00:01Z',
        level: 'error',
        workspaceId: 'ws-1',
        message: 'Worker crashed',
        data: { exitCode: 1 },
      };

      appendLog(logPath, event1);
      appendLog(logPath, event2);

      const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
      expect(lines).toHaveLength(2);

      const parsed1 = JSON.parse(lines[0]!);
      const parsed2 = JSON.parse(lines[1]!);
      expect(parsed1.message).toBe('First event');
      expect(parsed2.message).toBe('Worker crashed');
      expect(parsed2.workspaceId).toBe('ws-1');
      expect(parsed2.data).toEqual({ exitCode: 1 });
    });

    it('creates parent directories if needed', () => {
      const nested = path.join(tmpDir, 'logs', 'nested', 'daemon.log');
      const event: DaemonLogEvent = {
        timestamp: '2026-01-15T10:00:00Z',
        level: 'debug',
        message: 'test',
      };

      appendLog(nested, event);
      expect(fs.existsSync(nested)).toBe(true);
    });

    it('includes optional fields when provided', () => {
      const event: DaemonLogEvent = {
        timestamp: '2026-01-15T10:00:00Z',
        level: 'warn',
        workspaceId: 'my-workspace',
        message: 'Back-off triggered',
        data: { attempt: 3, delayMs: 8000 },
      };

      appendLog(logPath, event);

      const content = fs.readFileSync(logPath, 'utf-8');
      const parsed = JSON.parse(content.trim());
      expect(parsed.workspaceId).toBe('my-workspace');
      expect(parsed.data.attempt).toBe(3);
      expect(parsed.data.delayMs).toBe(8000);
    });

    it('each line ends with a newline', () => {
      const event: DaemonLogEvent = {
        timestamp: '2026-01-15T10:00:00Z',
        level: 'info',
        message: 'test',
      };

      appendLog(logPath, event);

      const content = fs.readFileSync(logPath, 'utf-8');
      expect(content.endsWith('\n')).toBe(true);
    });
  });
});
