import { describe, expect, it } from 'vitest';
import { TrustClassifier } from './TrustClassifier.js';

describe('TrustClassifier fallback extractors', () => {
  it('maps C# legacy fallback to derived trust', () => {
    expect(TrustClassifier.classify('csharp_legacy_fallback')).toEqual({
      trust_level: 'DERIVED',
      decision_status: 'OK',
    });
  });
});

