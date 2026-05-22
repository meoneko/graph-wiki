import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CSharpParser } from './CSharpParser.js';

const fixturePath = fileURLToPath(new URL('./__fixtures__/controller.cs', import.meta.url));

describe('CSharpParser', () => {
  it('extracts controller actions, minimal APIs, use cases, and DTOs from WASM CST', async () => {
    const parser = new CSharpParser();
    const source = await readFile(fixturePath, 'utf-8');
    const parsed = await parser.parse(source, fixturePath);
    const names = parsed.symbols.map((symbol) => symbol.name);

    expect(parser.backendId).toBe('csharp_tree_sitter');
    expect(parser.isAuthoritative).toBe(true);
    expect(names).toContain('GetStudent');
    expect(names).toContain('MapGet:/health');
    expect(names).toContain('CreateStudentUseCase');
    expect(names).toContain('StudentDto');
    expect(parsed.imports.some((imp) => imp.module === 'Microsoft.AspNetCore.Mvc')).toBe(true);
  });
});
