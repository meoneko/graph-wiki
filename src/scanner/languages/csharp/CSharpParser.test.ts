import { describe, expect, it } from 'vitest';
import { DEFAULT_PARSE_BUDGET } from '../../core/ILanguageParser.js';
import { CSharpParser } from './CSharpParser.js';

describe('CSharpParser parse metadata', () => {
  it('does not fallback for a normal file', async () => {
    const parser = new CSharpParser();
    await parser.ensureReady();
    const parsed = parser.parse('namespace Demo { public class A { public void Run() { Save(); } private void Save() {} } }', 'A.cs');

    expect(parsed.parseMode).toBe('full');
    expect(parsed.metrics?.reasonCodes).not.toContain('FALLBACK_PARSER_USED');
    expect(parsed.symbols.some((symbol) => symbol.name === 'Run')).toBe(true);
  });

  it('uses fallback when no useful symbols are extracted from a non-empty file', async () => {
    const parser = new CSharpParser();
    await parser.ensureReady();
    const source = 'not csharp\n'.repeat(30);
    const parsed = parser.parseWithContext(source, 'Broken.cs', { budget: DEFAULT_PARSE_BUDGET });

    expect(parsed.parseMode).toBe('fallback');
    expect(parsed.metrics?.reasonCodes).toContain('FALLBACK_PARSER_USED');
  });
});
