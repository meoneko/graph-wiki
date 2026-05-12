import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGitStyleIgnoreFilter } from './fileFilters.js';

describe('git-style project filters', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `crg-ignore-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('parses .gitignore semantics via ignore package', () => {
    writeFileSync(join(root, '.gitignore'), 'dist/\n*.snap\n[a]rtifacts/**\n', 'utf-8');
    const filter = createGitStyleIgnoreFilter(root);

    expect(filter.isIgnored('dist/app.js')).toBe(true);
    expect(filter.isIgnored('src/button.snap')).toBe(true);
    expect(filter.isIgnored('artifacts/report.json')).toBe(true);
    expect(filter.isIgnored('src/app.ts')).toBe(false);
  });

  it('.crgignore can negate project-root .gitignore patterns in pass 2', () => {
    writeFileSync(join(root, '.gitignore'), 'generated/**\n', 'utf-8');
    writeFileSync(join(root, '.crgignore'), '!generated/keep.ts\n', 'utf-8');
    const filter = createGitStyleIgnoreFilter(root);

    expect(filter.isIgnored('generated/drop.ts')).toBe(true);
    expect(filter.isIgnored('generated/keep.ts')).toBe(false);
  });
});
