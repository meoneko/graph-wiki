import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CLIENT_REGISTRY, expandConfigPath, type ClientDefinition } from '../../src/installer/clientRegistry.js';
import { detectClients } from '../../src/installer/detector.js';

/**
 * Unit tests for installer client registry and detector.
 *
 * Validates: Requirements 2.1, 2.8
 */

const TMP_DIR = path.join(os.tmpdir(), 'crg-installer-test-' + process.pid);

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

describe('CLIENT_REGISTRY', () => {
  it('contains 4 known clients', () => {
    expect(CLIENT_REGISTRY).toHaveLength(4);
  });

  it('includes claude-desktop, cursor, windsurf, vscode', () => {
    const ids = CLIENT_REGISTRY.map((c) => c.id);
    expect(ids).toContain('claude-desktop');
    expect(ids).toContain('cursor');
    expect(ids).toContain('windsurf');
    expect(ids).toContain('vscode');
  });

  it('each client has win32, darwin, and linux paths', () => {
    for (const client of CLIENT_REGISTRY) {
      expect(client.configPaths).toHaveProperty('win32');
      expect(client.configPaths).toHaveProperty('darwin');
      expect(client.configPaths).toHaveProperty('linux');
    }
  });

  it('claude-desktop uses claude-desktop config format', () => {
    const claude = CLIENT_REGISTRY.find((c) => c.id === 'claude-desktop');
    expect(claude?.configFormat).toBe('claude-desktop');
  });

  it('cursor, windsurf, vscode use vscode-mcp config format', () => {
    for (const id of ['cursor', 'windsurf', 'vscode']) {
      const client = CLIENT_REGISTRY.find((c) => c.id === id);
      expect(client?.configFormat).toBe('vscode-mcp');
    }
  });
});

describe('expandConfigPath', () => {
  it('expands ~ to os.homedir()', () => {
    const result = expandConfigPath('~/.config/claude/config.json');
    expect(result).toContain(os.homedir());
    expect(result).not.toContain('~');
  });

  it('expands %APPDATA% using environment variable', () => {
    const originalAppData = process.env.APPDATA;
    process.env.APPDATA = '/mock/appdata';
    try {
      const result = expandConfigPath('%APPDATA%\\Claude\\config.json');
      expect(result).toContain('mock');
      expect(result).not.toContain('%APPDATA%');
    } finally {
      process.env.APPDATA = originalAppData;
    }
  });

  it('falls back to AppData/Roaming when APPDATA env is unset', () => {
    const originalAppData = process.env.APPDATA;
    delete process.env.APPDATA;
    try {
      const result = expandConfigPath('%APPDATA%\\Claude\\config.json');
      expect(result).toContain(os.homedir());
      expect(result).toContain('AppData');
      expect(result).toContain('Roaming');
    } finally {
      process.env.APPDATA = originalAppData;
    }
  });

  it('normalizes path separators', () => {
    const result = expandConfigPath('~/some/path/file.json');
    expect(path.isAbsolute(result)).toBe(true);
  });
});

describe('detectClients', () => {
  it('returns detected: true when config file exists', () => {
    const configFile = path.join(TMP_DIR, 'config.json');
    writeFileSync(configFile, '{}');

    const registry: ClientDefinition[] = [
      {
        id: 'test-client',
        label: 'Test Client',
        configPaths: { [process.platform]: configFile } as Partial<Record<NodeJS.Platform, string>>,
        configFormat: 'claude-desktop',
      },
    ];

    const results = detectClients(registry);
    expect(results).toHaveLength(1);
    expect(results[0]!.detected).toBe(true);
    expect(results[0]!.configPath).toBe(configFile);
  });

  it('returns detected: true when parent directory exists (config not yet created)', () => {
    const parentDir = path.join(TMP_DIR, 'client-dir');
    mkdirSync(parentDir, { recursive: true });
    const configFile = path.join(parentDir, 'config.json');

    const registry: ClientDefinition[] = [
      {
        id: 'test-client',
        label: 'Test Client',
        configPaths: { [process.platform]: configFile } as Partial<Record<NodeJS.Platform, string>>,
        configFormat: 'vscode-mcp',
      },
    ];

    const results = detectClients(registry);
    expect(results[0]!.detected).toBe(true);
  });

  it('returns detected: false for non-existent path', () => {
    const registry: ClientDefinition[] = [
      {
        id: 'missing-client',
        label: 'Missing Client',
        configPaths: { [process.platform]: path.join(TMP_DIR, 'nonexistent', 'deep', 'config.json') } as Partial<Record<NodeJS.Platform, string>>,
        configFormat: 'claude-desktop',
      },
    ];

    const results = detectClients(registry);
    expect(results[0]!.detected).toBe(false);
  });

  it('returns detected: false when platform has no config path', () => {
    const registry: ClientDefinition[] = [
      {
        id: 'no-platform',
        label: 'No Platform',
        configPaths: {},
        configFormat: 'claude-desktop',
      },
    ];

    const results = detectClients(registry);
    expect(results[0]!.detected).toBe(false);
    expect(results[0]!.configPath).toBe('');
  });

  it('preserves all ClientDefinition fields in DetectedClient', () => {
    const configFile = path.join(TMP_DIR, 'preserve.json');
    writeFileSync(configFile, '{}');

    const registry: ClientDefinition[] = [
      {
        id: 'full-client',
        label: 'Full Client',
        configPaths: { [process.platform]: configFile } as Partial<Record<NodeJS.Platform, string>>,
        configFormat: 'vscode-mcp',
      },
    ];

    const results = detectClients(registry);
    expect(results[0]!.id).toBe('full-client');
    expect(results[0]!.label).toBe('Full Client');
    expect(results[0]!.configFormat).toBe('vscode-mcp');
  });
});
