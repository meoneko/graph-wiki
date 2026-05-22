import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { JavaParser } from './JavaParser.js';
import { JavaAdapter } from '../../../pipeline/adapters/JavaAdapter.js';
import { nodeTypeRegistry } from '../../../core/nodeTypeRegistry.js';
import { normalizeFacts } from '../../../pipeline/stages/03_normalize.js';
import { Validator } from '../../../pipeline/stages/04_validate.js';
import type { AdapterContext } from '../../../core/types.js';

const fixturePath = fileURLToPath(new URL('./__fixtures__/SpringControllers.java', import.meta.url));

describe('JavaParser', () => {
  it('extracts @RestController class as java_controller symbol', async () => {
    const parser = new JavaParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);

    const controller = parsed.symbols.find((s) => s.name === 'OrdersController');
    expect(controller).toBeDefined();
    expect(controller!.annotations).toEqual(expect.arrayContaining(['@RestController']));
    expect(controller!.isEntrypoint).toBe(true);
  });

  it('extracts @Service class as java_service symbol', async () => {
    const parser = new JavaParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);

    const service = parsed.symbols.find((s) => s.name === 'OrderService');
    expect(service).toBeDefined();
    expect(service!.annotations).toEqual(expect.arrayContaining(['@Service']));
    expect(service!.isEntrypoint).toBe(false);
  });

  it('extracts @Repository class as java_repository symbol', async () => {
    const parser = new JavaParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);

    const repo = parsed.symbols.find((s) => s.name === 'OrderRepository');
    expect(repo).toBeDefined();
    expect(repo!.annotations).toEqual(expect.arrayContaining(['@Repository']));
    expect(repo!.isEntrypoint).toBe(false);
  });

  it('does not produce symbols for plain (non-annotated) classes', async () => {
    const parser = new JavaParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);

    const mapper = parsed.symbols.find((s) => s.name === 'OrderMapper');
    expect(mapper).toBeUndefined();
  });

  it('includes package name in qualifiedName', async () => {
    const parser = new JavaParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);

    const controller = parsed.symbols.find((s) => s.name === 'OrdersController');
    expect(controller!.qualifiedName).toBe('com.example.demo.OrdersController');

    const service = parsed.symbols.find((s) => s.name === 'OrderService');
    expect(service!.qualifiedName).toBe('com.example.demo.OrderService');
  });

  it('extracts exactly 3 annotated symbols from fixture (no plain classes)', async () => {
    const parser = new JavaParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);

    expect(parsed.symbols).toHaveLength(3);
  });
});

describe('JavaAdapter integration', () => {
  it('produces CandidateRecord[] that pass normalize and validate stages', async () => {
    const adapter = new JavaAdapter();
    const context: AdapterContext = {
      workspaceId: 'test-ws',
      projectId: 'demo-app',
      projectRoot: fileURLToPath(new URL('../../../../', import.meta.url)),
    };

    const parsed = await adapter.parse([fixturePath], context);
    const candidates = await adapter.extract(parsed, context);

    // Should produce 3 candidates (controller, service, repository)
    expect(candidates).toHaveLength(3);
    expect(candidates.every((c) => c.extractor === 'java_tree_sitter')).toBe(true);

    // Verify candidate types map to registered node types
    const types = candidates.map((c) => c.candidate_type);
    expect(types).toContain('java_controller');
    expect(types).toContain('java_service');
    expect(types).toContain('java_repository');

    // Normalize stage
    const normalized = await normalizeFacts(candidates, 'test-ws');
    expect(normalized).toHaveLength(3);
    expect(normalized.every((f) => f.fact_id)).toBe(true);

    // Validate stage (without DB persistence — use Validator directly)
    const validator = new Validator();
    const result = validator.validate(normalized, 'test-ws');

    expect(result.hardFailures).toHaveLength(0);
    expect(result.facts).toHaveLength(3);
    expect(result.facts.every((f) => f.status === 'validated')).toBe(true);
    expect(result.facts.every((f) => f.trust_level === 'AUTHORITATIVE')).toBe(true);
  });

  it('marks java_controller candidates as entrypoints', async () => {
    const adapter = new JavaAdapter();
    const context: AdapterContext = {
      workspaceId: 'test-ws',
      projectId: 'demo-app',
      projectRoot: fileURLToPath(new URL('../../../../', import.meta.url)),
    };

    const parsed = await adapter.parse([fixturePath], context);
    const candidates = await adapter.extract(parsed, context);
    const enriched = await adapter.identify_entrypoints(candidates);

    const controller = enriched.find((c) => c.candidate_type === 'java_controller');
    expect(controller!.is_entrypoint).toBe(true);

    const service = enriched.find((c) => c.candidate_type === 'java_service');
    expect(service!.is_entrypoint).toBe(false);

    const repo = enriched.find((c) => c.candidate_type === 'java_repository');
    expect(repo!.is_entrypoint).toBe(false);
  });
});

describe('nodeTypeRegistry Java types', () => {
  it('has java_controller registered', () => {
    expect(nodeTypeRegistry.has('java_controller')).toBe(true);
  });

  it('has java_service registered', () => {
    expect(nodeTypeRegistry.has('java_service')).toBe(true);
  });

  it('has java_repository registered', () => {
    expect(nodeTypeRegistry.has('java_repository')).toBe(true);
  });

  it('marks java_controller as entrypoint', () => {
    expect(nodeTypeRegistry.isEntrypoint('java_controller')).toBe(true);
  });

  it('marks java_service and java_repository as non-entrypoint', () => {
    expect(nodeTypeRegistry.isEntrypoint('java_service')).toBe(false);
    expect(nodeTypeRegistry.isEntrypoint('java_repository')).toBe(false);
  });
});
