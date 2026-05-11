import { describe, expect, it } from 'vitest';
import type { IProjectAdapter } from '../../core/types.js';
import { globalAdapterRegistry } from './registry.js';

const noopAdapter = (): IProjectAdapter => ({
  parse: async () => ({}),
  extract: async () => [],
  enrich: async (candidates) => candidates,
  classify: async (candidates) => candidates,
});

describe('AdapterRegistry', () => {
  it('rejects global regex patterns because RegExp.test mutates lastIndex', () => {
    expect(() => globalAdapterRegistry.register('bad-global-test', /\.java$/gi, noopAdapter)).toThrow(/global or sticky/);
  });

  it('rejects sticky regex patterns because RegExp.test mutates lastIndex', () => {
    expect(() => globalAdapterRegistry.register('bad-sticky-test', /\.java$/y, noopAdapter)).toThrow(/global or sticky/);
  });
});

