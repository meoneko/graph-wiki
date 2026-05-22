import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { writeClientConfig, type McpServerEntry } from '../../src/installer/writer.js';

/**
 * Unit tests for installer config writer.
 *
 * Validates: Requirements 2.2, 2.3, 2.4, 2.7
 */

const TMP_DIR = path.join(os.tmpdir(), 'crg-writer-test-' + process.pid);

const SERVER_NAME = 'code-review-graph';
const ENTRY: McpServerEntry = {
  command: 'node',
  args: ['dist/mcp/server.js'],
  cwd: '/projects/my-repo',
};

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  try {
    rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

describe('writeClientConfig', () => {
  describe('file creation', () => {
    it('creates config file with correct JSON when target is absent (claude-desktop format)', () => {
      const configPath = path.join(TMP_DIR, 'new-config', 'config.json');

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      expect(result.action).toBe('created');
      expect(result.written).toBe(true);
      expect(existsSync(configPath)).toBe(true);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.mcpServers[SERVER_NAME]).toEqual({
        command: 'node',
        args: ['dist/mcp/server.js'],
        cwd: '/projects/my-repo',
      });
    });

    it('creates config file with servers key for vscode-mcp format', () => {
      const configPath = path.join(TMP_DIR, 'vscode-config.json');

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'vscode-mcp', false);

      expect(result.action).toBe('created');
      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.servers[SERVER_NAME]).toEqual({
        command: 'node',
        args: ['dist/mcp/server.js'],
        cwd: '/projects/my-repo',
      });
    });
  });

  describe('merge behavior', () => {
    it('merges without removing other mcpServers entries', () => {
      const configPath = path.join(TMP_DIR, 'existing.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          'other-server': { command: 'python', args: ['serve.py'] },
        },
      }));

      writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.mcpServers['other-server']).toEqual({ command: 'python', args: ['serve.py'] });
      expect(content.mcpServers[SERVER_NAME]).toEqual({
        command: 'node',
        args: ['dist/mcp/server.js'],
        cwd: '/projects/my-repo',
      });
    });

    it('preserves other top-level keys in the config', () => {
      const configPath = path.join(TMP_DIR, 'with-extras.json');
      writeFileSync(configPath, JSON.stringify({
        theme: 'dark',
        mcpServers: {},
      }));

      writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.theme).toBe('dark');
    });

    it('returns action: updated when overwriting an existing entry', () => {
      const configPath = path.join(TMP_DIR, 'update.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'old-cmd', args: [] },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      expect(result.action).toBe('updated');
      expect(result.written).toBe(true);
    });
  });

  describe('idempotency', () => {
    it('returns unchanged when entry already matches exactly', () => {
      const configPath = path.join(TMP_DIR, 'idempotent.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'node', args: ['dist/mcp/server.js'], cwd: '/projects/my-repo' },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      expect(result.action).toBe('unchanged');
      expect(result.written).toBe(false);
    });

    it('returns unchanged for vscode-mcp format when entry matches', () => {
      const configPath = path.join(TMP_DIR, 'idempotent-vscode.json');
      writeFileSync(configPath, JSON.stringify({
        servers: {
          [SERVER_NAME]: { command: 'node', args: ['dist/mcp/server.js'], cwd: '/projects/my-repo' },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'vscode-mcp', false);

      expect(result.action).toBe('unchanged');
      expect(result.written).toBe(false);
    });

    it('detects difference in args and returns updated', () => {
      const configPath = path.join(TMP_DIR, 'diff-args.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'node', args: ['old/path.js'], cwd: '/projects/my-repo' },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      expect(result.action).toBe('updated');
    });

    it('detects difference in cwd and returns updated', () => {
      const configPath = path.join(TMP_DIR, 'diff-cwd.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'node', args: ['dist/mcp/server.js'], cwd: '/other/path' },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      expect(result.action).toBe('updated');
    });

    it('detects extra keys in existing entry and returns updated', () => {
      const configPath = path.join(TMP_DIR, 'extra-keys.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'node', args: ['dist/mcp/server.js'], cwd: '/projects/my-repo', env: {} },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);

      expect(result.action).toBe('updated');
    });
  });

  describe('malformed JSON handling', () => {
    it('throws with file path in error message for malformed JSON', () => {
      const configPath = path.join(TMP_DIR, 'malformed.json');
      writeFileSync(configPath, '{ invalid json content !!!');

      expect(() => {
        writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);
      }).toThrow(configPath);
    });

    it('throws error message starting with "Malformed JSON"', () => {
      const configPath = path.join(TMP_DIR, 'bad.json');
      writeFileSync(configPath, 'not json at all');

      expect(() => {
        writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', false);
      }).toThrow(/Malformed JSON/);
    });
  });

  describe('dryRun mode', () => {
    it('does not create file when dryRun is true and file absent', () => {
      const configPath = path.join(TMP_DIR, 'dry-run-new', 'config.json');

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', true);

      expect(result.action).toBe('created');
      expect(result.written).toBe(false);
      expect(existsSync(configPath)).toBe(false);
    });

    it('does not modify existing file when dryRun is true', () => {
      const configPath = path.join(TMP_DIR, 'dry-run-existing.json');
      const originalContent = JSON.stringify({ mcpServers: {} });
      writeFileSync(configPath, originalContent);

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', true);

      expect(result.action).toBe('created');
      expect(result.written).toBe(false);
      expect(readFileSync(configPath, 'utf-8')).toBe(originalContent);
    });

    it('still returns unchanged in dryRun when entry matches', () => {
      const configPath = path.join(TMP_DIR, 'dry-run-unchanged.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'node', args: ['dist/mcp/server.js'], cwd: '/projects/my-repo' },
        },
      }));

      const result = writeClientConfig(configPath, SERVER_NAME, ENTRY, 'claude-desktop', true);

      expect(result.action).toBe('unchanged');
      expect(result.written).toBe(false);
    });
  });

  describe('entry without cwd', () => {
    it('creates entry without cwd field when cwd is undefined', () => {
      const configPath = path.join(TMP_DIR, 'no-cwd.json');
      const entryNoCwd: McpServerEntry = { command: 'node', args: ['server.js'] };

      writeClientConfig(configPath, SERVER_NAME, entryNoCwd, 'claude-desktop', false);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.mcpServers[SERVER_NAME]).toEqual({ command: 'node', args: ['server.js'] });
      expect('cwd' in content.mcpServers[SERVER_NAME]).toBe(false);
    });

    it('returns unchanged when existing entry also has no cwd', () => {
      const configPath = path.join(TMP_DIR, 'no-cwd-match.json');
      writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          [SERVER_NAME]: { command: 'node', args: ['server.js'] },
        },
      }));

      const entryNoCwd: McpServerEntry = { command: 'node', args: ['server.js'] };
      const result = writeClientConfig(configPath, SERVER_NAME, entryNoCwd, 'claude-desktop', false);

      expect(result.action).toBe('unchanged');
    });
  });
});
