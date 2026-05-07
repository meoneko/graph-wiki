import { describe, expect, it } from 'vitest';
import { TrustClassifier } from './TrustClassifier.js';

describe('TrustClassifier fallback extractors', () => {
  it('keeps C# tree-sitter authoritative after convention refactor', () => {
    expect(TrustClassifier.classify('csharp_tree_sitter')).toEqual({
      trust_level: 'AUTHORITATIVE',
      decision_status: 'OK',
    });
  });

  it('maps any *_tree_sitter extractor to authoritative trust', () => {
    expect(TrustClassifier.classify('java_tree_sitter').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('python_tree_sitter').trust_level).toBe('AUTHORITATIVE');
    expect(TrustClassifier.classify('go_tree_sitter').trust_level).toBe('AUTHORITATIVE');
  });

  it('maps C# legacy fallback to derived trust', () => {
    expect(TrustClassifier.classify('csharp_legacy_fallback')).toEqual({
      trust_level: 'DERIVED',
      decision_status: 'OK',
    });
  });

  it('maps any *_legacy_fallback extractor to derived trust', () => {
    expect(TrustClassifier.classify('java_legacy_fallback').trust_level).toBe('DERIVED');
  });

  it('maps regex extractors to derived trust', () => {
    expect(TrustClassifier.classify('java_regex').trust_level).toBe('DERIVED');
  });

  it('keeps TS React legacy adapter as derived trust', () => {
    expect(TrustClassifier.classify('ts_react_adapter')).toEqual({
      trust_level: 'DERIVED',
      decision_status: 'OK',
    });
  });
});
