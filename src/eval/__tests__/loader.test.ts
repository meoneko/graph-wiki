import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadSuite } from '../loader.js';
import type { EvalCase } from '../types.js';

const VALID_SUITE: EvalCase[] = [
  {
    id: 'test-1',
    description: 'Find OrdersController',
    queryType: 'what-is-symbol',
    query: 'OrdersController',
    mode: 'authoritative',
    expect: {
      notEmpty: true,
      minNodeCount: 1,
      nodeLabels: ['OrdersController'],
    },
  },
  {
    id: 'test-2',
    description: 'Check dependencies',
    queryType: 'what-depends-on',
    query: 'PaymentService',
    expect: {
      minNodeCount: 2,
      nodeKinds: ['service'],
    },
  },
];

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-loader-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadSuite', () => {
  it('parses a valid JSON suite file', () => {
    const filePath = path.join(tmpDir, 'suite.json');
    fs.writeFileSync(filePath, JSON.stringify(VALID_SUITE), 'utf-8');

    const result = loadSuite(filePath);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('test-1');
    expect(result[0]!.queryType).toBe('what-is-symbol');
    expect(result[0]!.expect.notEmpty).toBe(true);
    expect(result[1]!.id).toBe('test-2');
    expect(result[1]!.mode).toBeUndefined();
  });

  it('parses a valid YAML suite file', () => {
    const yamlContent = `
- id: yaml-1
  description: YAML test case
  queryType: lineage
  query: UserService
  expect:
    notEmpty: true
    minNodeCount: 3
`;
    const filePath = path.join(tmpDir, 'suite.yaml');
    fs.writeFileSync(filePath, yamlContent, 'utf-8');

    const result = loadSuite(filePath);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('yaml-1');
    expect(result[0]!.queryType).toBe('lineage');
    expect(result[0]!.expect.minNodeCount).toBe(3);
  });

  it('parses .yml extension as YAML', () => {
    const yamlContent = `
- id: yml-1
  description: YML extension test
  queryType: impact
  query: AuthModule
  expect:
    nodeKinds:
      - service
      - controller_action
`;
    const filePath = path.join(tmpDir, 'suite.yml');
    fs.writeFileSync(filePath, yamlContent, 'utf-8');

    const result = loadSuite(filePath);

    expect(result).toHaveLength(1);
    expect(result[0]!.expect.nodeKinds).toEqual(['service', 'controller_action']);
  });

  it('throws when file does not exist', () => {
    expect(() => loadSuite('/nonexistent/path/suite.json')).toThrow('Eval suite file not found');
  });

  it('throws for unsupported file extension', () => {
    const filePath = path.join(tmpDir, 'suite.txt');
    fs.writeFileSync(filePath, '[]', 'utf-8');

    expect(() => loadSuite(filePath)).toThrow('Unsupported eval suite file extension');
  });

  it('throws when JSON is malformed', () => {
    const filePath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(filePath, '{ not valid json', 'utf-8');

    expect(() => loadSuite(filePath)).toThrow('Failed to parse JSON suite file');
  });

  it('throws when content is not an array', () => {
    const filePath = path.join(tmpDir, 'object.json');
    fs.writeFileSync(filePath, JSON.stringify({ id: 'not-array' }), 'utf-8');

    expect(() => loadSuite(filePath)).toThrow('must contain a JSON/YAML array');
  });

  it('throws when a case is missing required "id" field', () => {
    const filePath = path.join(tmpDir, 'no-id.json');
    fs.writeFileSync(filePath, JSON.stringify([{ description: 'x', queryType: 'lineage', query: 'q', expect: {} }]), 'utf-8');

    expect(() => loadSuite(filePath)).toThrow('missing required field "id"');
  });

  it('throws when a case is missing required "queryType" field', () => {
    const filePath = path.join(tmpDir, 'no-qt.json');
    fs.writeFileSync(filePath, JSON.stringify([{ id: 'x', description: 'x', query: 'q', expect: {} }]), 'utf-8');

    expect(() => loadSuite(filePath)).toThrow('missing required field "queryType"');
  });

  it('throws when a case is missing required "expect" field', () => {
    const filePath = path.join(tmpDir, 'no-expect.json');
    fs.writeFileSync(filePath, JSON.stringify([{ id: 'x', description: 'x', queryType: 'lineage', query: 'q' }]), 'utf-8');

    expect(() => loadSuite(filePath)).toThrow('missing required field "expect"');
  });

  it('handles an empty array gracefully', () => {
    const filePath = path.join(tmpDir, 'empty.json');
    fs.writeFileSync(filePath, '[]', 'utf-8');

    const result = loadSuite(filePath);
    expect(result).toEqual([]);
  });
});
