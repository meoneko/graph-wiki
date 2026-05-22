import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadConfig } from '../../src/pipeline/config.js';

/**
 * Feature: partial-class-support, Property 6: Config validation rejects non-boolean values
 *
 * For any value of `extract_partial_methods` that is not a boolean (strings, numbers,
 * arrays, objects, null), the configuration loader SHALL reject the configuration with
 * an error message indicating the field must be a boolean.
 *
 * **Validates: Requirements 2.6**
 */
describe('Feature: partial-class-support, Property 6: Config validation rejects non-boolean values', () => {
  /**
   * Arbitrary that generates non-boolean JSON values:
   * strings, numbers, arrays, objects, null
   */
  const nonBooleanArb = fc.oneof(
    fc.string(),
    fc.integer(),
    fc.double({ noNaN: true, noDefaultInfinity: true }),
    fc.array(fc.anything({ maxDepth: 0 }), { maxLength: 3 }),
    fc.dictionary(fc.string({ minLength: 1, maxLength: 5 }), fc.anything({ maxDepth: 0 }), { maxKeys: 3 }),
    fc.constant(null),
  );

  /**
   * Generates a valid project ID (alphanumeric with hyphens, non-empty)
   */
  const projectIdArb = fc.string({ minLength: 1, maxLength: 20 })
    .filter(s => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s));

  it('rejects non-boolean extract_partial_methods with appropriate error message', async () => {
    await fc.assert(
      fc.asyncProperty(nonBooleanArb, projectIdArb, async (nonBoolValue, projectId) => {
        // Build a minimal valid YAML config with the non-boolean value
        const configContent = buildYamlConfig(projectId, nonBoolValue);

        // Write to a temp file
        const tmpDir = path.join(os.tmpdir(), 'crg-prop-test-config');
        await mkdir(tmpDir, { recursive: true });
        const configPath = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.yaml`);

        try {
          await writeFile(configPath, configContent, 'utf-8');

          // loadConfig should throw with the expected error message
          await expect(loadConfig(configPath)).rejects.toThrow(
            `extract_partial_methods must be a boolean (project: ${projectId})`
          );
        } finally {
          // Cleanup temp file
          try { await unlink(configPath); } catch { /* ignore */ }
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Builds a minimal YAML config string with the given project ID and
 * extract_partial_methods value (which will be serialized as a JSON value
 * embedded in YAML).
 */
function buildYamlConfig(projectId: string, extractPartialMethods: unknown): string {
  // Serialize the value for YAML embedding
  const yamlValue = serializeForYaml(extractPartialMethods);

  return `
workspaces:
  - id: test-workspace
    projects:
      - ${projectId}

projects:
  ${projectId}:
    enabled: true
    path: /tmp/test-project
    extract_partial_methods: ${yamlValue}

outputs:
  source_root: ./test/sources
  state_root: ./test/state
  records_root: ./test/records
  wiki_root: ./test/wiki
  index_root: ./test/index
  reports_root: ./test/reports
`;
}

/**
 * Serializes a JavaScript value into a YAML-compatible representation
 * that will NOT be parsed as a boolean by the YAML parser.
 */
function serializeForYaml(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Quote strings to prevent YAML from interpreting them as booleans
    // (e.g., "true", "yes", "on" would be parsed as boolean by YAML)
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
