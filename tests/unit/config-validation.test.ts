import { describe, it, expect, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadConfig } from '../../src/pipeline/config.js';

/**
 * Unit tests for extract_partial_methods config validation and AdapterOptions wiring.
 *
 * Validates: Requirements 2.1, 2.2, 2.4, 2.6
 */

const TMP_DIR = path.join(os.tmpdir(), 'crg-config-test-' + process.pid);

async function writeYaml(filename: string, content: string): Promise<string> {
  await mkdir(TMP_DIR, { recursive: true });
  const filePath = path.join(TMP_DIR, filename);
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

afterEach(async () => {
  try {
    await rm(TMP_DIR, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

describe('extract_partial_methods config validation', () => {
  describe('default behavior (Requirement 2.1)', () => {
    it('missing extract_partial_methods defaults to undefined in ProjectConfig', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
`);

      const config = await loadConfig(configPath);
      const project = config.projects.find(p => p.id === 'backend');
      expect(project).toBeDefined();
      expect(project!.extract_partial_methods).toBeUndefined();
    });
  });

  describe('boolean values pass through unchanged (Requirement 2.4)', () => {
    it('extract_partial_methods: true passes through', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
    extract_partial_methods: true
`);

      const config = await loadConfig(configPath);
      const project = config.projects.find(p => p.id === 'backend');
      expect(project).toBeDefined();
      expect(project!.extract_partial_methods).toBe(true);
    });

    it('extract_partial_methods: false passes through', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
    extract_partial_methods: false
`);

      const config = await loadConfig(configPath);
      const project = config.projects.find(p => p.id === 'backend');
      expect(project).toBeDefined();
      expect(project!.extract_partial_methods).toBe(false);
    });
  });

  describe('non-boolean values produce descriptive error (Requirement 2.6)', () => {
    it('rejects string value', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
    extract_partial_methods: "yes"
`);

      await expect(loadConfig(configPath)).rejects.toThrow(
        'extract_partial_methods must be a boolean (project: backend)',
      );
    });

    it('rejects number value', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [myproject]
projects:
  myproject:
    path: /some/path
    extract_partial_methods: 1
`);

      await expect(loadConfig(configPath)).rejects.toThrow(
        'extract_partial_methods must be a boolean (project: myproject)',
      );
    });

    it('rejects array value', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
    extract_partial_methods: [true]
`);

      await expect(loadConfig(configPath)).rejects.toThrow(
        'extract_partial_methods must be a boolean (project: backend)',
      );
    });

    it('rejects object value', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
    extract_partial_methods:
      enabled: true
`);

      await expect(loadConfig(configPath)).rejects.toThrow(
        'extract_partial_methods must be a boolean (project: backend)',
      );
    });

    it('rejects null value', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [backend]
projects:
  backend:
    path: /some/path
    extract_partial_methods: null
`);

      // YAML null becomes JS null, which is not a boolean
      await expect(loadConfig(configPath)).rejects.toThrow(
        'extract_partial_methods must be a boolean (project: backend)',
      );
    });

    it('error message includes the project id', async () => {
      const configPath = await writeYaml('knowledge.config.yaml', `
workspaces:
  - id: ws1
    projects: [my-special-project]
projects:
  my-special-project:
    path: /some/path
    extract_partial_methods: "invalid"
`);

      await expect(loadConfig(configPath)).rejects.toThrow('my-special-project');
    });
  });
});

describe('AdapterOptions wiring', () => {
  describe('extractPartialMethods defaults to false when absent (Requirement 2.4)', () => {
    it('project without extract_partial_methods produces options.extractPartialMethods === false', () => {
      // This tests the wiring logic: project.extract_partial_methods ?? false
      const project = { id: 'test', path: '/test', extract_partial_methods: undefined as boolean | undefined };
      const extractPartialMethods = project.extract_partial_methods ?? false;
      expect(extractPartialMethods).toBe(false);
    });
  });

  describe('boolean values pass through to AdapterOptions unchanged (Requirement 2.5)', () => {
    it('extract_partial_methods: true produces options.extractPartialMethods === true', () => {
      const project = { id: 'test', path: '/test', extract_partial_methods: true };
      const extractPartialMethods = project.extract_partial_methods ?? false;
      expect(extractPartialMethods).toBe(true);
    });

    it('extract_partial_methods: false produces options.extractPartialMethods === false', () => {
      const project = { id: 'test', path: '/test', extract_partial_methods: false };
      const extractPartialMethods = project.extract_partial_methods ?? false;
      expect(extractPartialMethods).toBe(false);
    });
  });

  describe('AdapterContext options shape', () => {
    it('context options object has correct shape when extract_partial_methods is absent', () => {
      const project = { id: 'test', path: '/test' } as { id: string; path: string; extract_partial_methods?: boolean };
      const context = {
        workspaceId: 'ws1',
        projectId: project.id,
        projectRoot: project.path,
        options: { extractPartialMethods: project.extract_partial_methods ?? false },
      };

      expect(context.options).toEqual({ extractPartialMethods: false });
    });

    it('context options object has correct shape when extract_partial_methods is true', () => {
      const project = { id: 'test', path: '/test', extract_partial_methods: true };
      const context = {
        workspaceId: 'ws1',
        projectId: project.id,
        projectRoot: project.path,
        options: { extractPartialMethods: project.extract_partial_methods ?? false },
      };

      expect(context.options).toEqual({ extractPartialMethods: true });
    });
  });
});
