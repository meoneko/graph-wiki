import { describe, expect, it } from 'vitest';
import { TrustClassifier } from '../TrustClassifier.js';
import { isImportParticipating, type ImportMapArtifact } from '../importMap.js';
import { TypeScriptTreeSitterParser } from '../../scanner/languages/typescript/TypeScriptTreeSitterParser.js';

describe('trust boundaries', () => {
  it('classifies CST-backed TypeScript and C# parsers as authoritative', () => {
    const parser = new TypeScriptTreeSitterParser();

    expect(parser.backendId).toBe('ts_tree_sitter_parser');
    expect(parser.isAuthoritative).toBe(true);
    expect(TrustClassifier.classify('ts_tree_sitter_parser').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('csharp_tree_sitter').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('ts_react_adapter').trust_level).toBe('DERIVED');
  });

  it('classifies config declarations as authoritative but config link analysis as derived', () => {
    expect(TrustClassifier.classify('json_config_parser').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('yaml_config_parser').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('toml_config_parser').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('env_parser').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('config_link_analysis').trust_level).toBe('DERIVED');
  });
});

describe('import map invalidation', () => {
  it('treats every hashed import-map file as import participating', () => {
    const artifact: ImportMapArtifact = {
      version: 1,
      projectId: 'app',
      generatedAt: '2026-05-11T00:00:00.000Z',
      combinedHash: 'hash',
      perFileHashes: {
        'src/side-effect.ts': 'a',
      },
      imports: {},
      exports: {},
      reExports: {},
    };

    expect(isImportParticipating(artifact, 'src/side-effect.ts')).toBe(true);
  });
});
