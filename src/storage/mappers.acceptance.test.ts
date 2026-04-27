import { describe, expect, it } from 'vitest';
import { mapConfidenceToBand, mapEdgeFromDB, mapProvenance } from './mappers.js';

describe('storage mapper trust safety', () => {
  it('fails closed instead of defaulting missing provenance', () => {
    expect(() => mapProvenance(null)).toThrow(/INVALID_GRAPH_STATE/);
  });

  it('fails closed instead of defaulting invalid confidence', () => {
    expect(() => mapConfidenceToBand(undefined)).toThrow(/INVALID_GRAPH_STATE/);
  });

  it('fails closed instead of defaulting missing graph_kind', () => {
    expect(() => mapEdgeFromDB({
      id: 'e1',
      workspace: 'w1',
      from_id: 'a',
      to_id: 'b',
      type: 'calls',
      confidence: 'AUTHORITATIVE',
      provenance: JSON.stringify({ source: 'parser', artifact_source: 'f', producer_stage: 'test', timestamp: 't' }),
    })).toThrow(/INVALID_GRAPH_STATE/);
  });
});
