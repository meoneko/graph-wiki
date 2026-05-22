import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { writePid, readPid, clearPid, isAlive } from './pidfile.js';

describe('pidfile', () => {
  let tmpDir: string;
  let pidPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-pidfile-test-'));
    pidPath = path.join(tmpDir, 'test.pid');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('writePid', () => {
    it('writes PID to file', () => {
      writePid(pidPath, 12345);
      const content = fs.readFileSync(pidPath, 'utf-8');
      expect(content.trim()).toBe('12345');
    });

    it('creates parent directories if needed', () => {
      const nested = path.join(tmpDir, 'a', 'b', 'nested.pid');
      writePid(nested, 99);
      expect(fs.existsSync(nested)).toBe(true);
    });
  });

  describe('readPid', () => {
    it('reads a valid PID from file', () => {
      fs.writeFileSync(pidPath, '42\n', 'utf-8');
      expect(readPid(pidPath)).toBe(42);
    });

    it('returns null when file does not exist', () => {
      expect(readPid(path.join(tmpDir, 'nonexistent.pid'))).toBeNull();
    });

    it('returns null when file contains non-numeric content', () => {
      fs.writeFileSync(pidPath, 'not-a-number\n', 'utf-8');
      expect(readPid(pidPath)).toBeNull();
    });

    it('returns null when file contains zero', () => {
      fs.writeFileSync(pidPath, '0\n', 'utf-8');
      expect(readPid(pidPath)).toBeNull();
    });

    it('returns null when file contains negative number', () => {
      fs.writeFileSync(pidPath, '-1\n', 'utf-8');
      expect(readPid(pidPath)).toBeNull();
    });

    it('handles whitespace around PID', () => {
      fs.writeFileSync(pidPath, '  7890  \n', 'utf-8');
      expect(readPid(pidPath)).toBe(7890);
    });
  });

  describe('clearPid', () => {
    it('deletes the PID file', () => {
      fs.writeFileSync(pidPath, '123\n', 'utf-8');
      clearPid(pidPath);
      expect(fs.existsSync(pidPath)).toBe(false);
    });

    it('is a no-op when file does not exist', () => {
      // Should not throw
      clearPid(path.join(tmpDir, 'nonexistent.pid'));
    });
  });

  describe('isAlive', () => {
    it('returns true for the current process', () => {
      expect(isAlive(process.pid)).toBe(true);
    });

    it('returns false for a non-existent PID', () => {
      // PID 99999999 is extremely unlikely to exist
      expect(isAlive(99999999)).toBe(false);
    });
  });
});
