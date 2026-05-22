/**
 * Suite loader — reads eval suite files from disk (JSON or YAML).
 *
 * @see Requirements 5.1
 */

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { EvalCase } from './types.js';

/**
 * Loads an eval suite from a JSON or YAML file.
 *
 * @param filePath - Absolute or relative path to the suite file.
 * @returns Array of EvalCase objects parsed from the file.
 * @throws If the file does not exist, has an unsupported extension, or contains invalid content.
 */
export function loadSuite(filePath: string): EvalCase[] {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Eval suite file not found: ${resolved}`);
  }

  const ext = path.extname(resolved).toLowerCase();
  const raw = fs.readFileSync(resolved, 'utf-8');

  let parsed: unknown;

  if (ext === '.json') {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse JSON suite file: ${resolved} — ${(err as Error).message}`);
    }
  } else if (ext === '.yaml' || ext === '.yml') {
    parsed = parseYaml(raw, resolved);
  } else {
    throw new Error(
      `Unsupported eval suite file extension "${ext}". Supported: .json, .yaml, .yml`,
    );
  }

  return validateSuite(parsed, resolved);
}

/**
 * Parses YAML content using the `yaml` package (already a project dependency).
 */
function parseYaml(content: string, filePath: string): unknown {
  try {
    return YAML.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse YAML suite file: ${filePath} — ${(err as Error).message}`);
  }
}

/**
 * Validates that parsed content is an array of EvalCase objects with required fields.
 */
function validateSuite(data: unknown, filePath: string): EvalCase[] {
  if (!Array.isArray(data)) {
    throw new Error(
      `Eval suite file must contain a JSON/YAML array of cases. Got ${typeof data} in: ${filePath}`,
    );
  }

  const cases: EvalCase[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Eval case at index ${i} must be an object in: ${filePath}`);
    }

    const record = item as Record<string, unknown>;

    // Validate required fields
    if (typeof record['id'] !== 'string' || record['id'].length === 0) {
      throw new Error(`Eval case at index ${i} is missing required field "id" in: ${filePath}`);
    }
    if (typeof record['description'] !== 'string') {
      throw new Error(
        `Eval case at index ${i} is missing required field "description" in: ${filePath}`,
      );
    }
    if (typeof record['queryType'] !== 'string') {
      throw new Error(
        `Eval case at index ${i} is missing required field "queryType" in: ${filePath}`,
      );
    }
    if (typeof record['query'] !== 'string') {
      throw new Error(
        `Eval case at index ${i} is missing required field "query" in: ${filePath}`,
      );
    }
    if (typeof record['expect'] !== 'object' || record['expect'] === null) {
      throw new Error(
        `Eval case at index ${i} is missing required field "expect" in: ${filePath}`,
      );
    }

    cases.push({
      id: record['id'] as string,
      description: record['description'] as string,
      queryType: record['queryType'] as EvalCase['queryType'],
      query: record['query'] as string,
      mode: record['mode'] as EvalCase['mode'],
      expect: record['expect'] as EvalCase['expect'],
    });
  }

  return cases;
}
