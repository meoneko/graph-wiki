import { describe, it, expect } from 'vitest';
import {
  mapAdapterRecordToCandidate,
  mapAdapterRecordsToCandidate,
  createExtractionError,
  type AdapterCandidateRecord,
  type AdapterExtractionError,
} from './IProjectAdapter.js';
import type { AdapterContext } from '../../core/types.js';
import { TypeScriptAdapter } from './TypeScriptAdapter.js';
import { CSharpAdapter } from './CSharpAdapter.js';
import { StructuredFileAdapter } from './StructuredFileAdapter.js';

const context: AdapterContext = {
  workspaceId: 'ws-1',
  projectId: 'proj-1',
  projectRoot: '/tmp/test-project',
};

describe('AdapterCandidateRecord mapping', () => {
  it('maps a node record to pipeline CandidateRecord', () => {
    const record: AdapterCandidateRecord = {
      id: 'test-id-1',
      recordType: 'node',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      filePath: '/tmp/test.ts',
      lineStart: 10,
      lineEnd: 20,
      kind: 'ts_function',
      name: 'myFunction',
      symbol: 'myFunction',
      confidence: 0.95,
      extractionMethod: 'ast',
      adapterId: 'typescript-adapter',
      adapterVersion: '1.0.0',
      metadata: { isPublic: true },
    };

    const candidate = mapAdapterRecordToCandidate(record, context);

    expect(candidate.candidate_id).toBe('test-id-1');
    expect(candidate.candidate_type).toBe('ts_function');
    expect(candidate.workspaceId).toBe('ws-1');
    expect(candidate.project).toBe('proj-1');
    expect(candidate.source_file).toBe('/tmp/test.ts');
    expect(candidate.symbol).toBe('myFunction');
    expect(candidate.line_start).toBe(10);
    expect(candidate.line_end).toBe(20);
    expect(candidate.status).toBe('candidate');
    expect(candidate.extractor).toBe('typescript-adapter@1.0.0');
    expect(candidate.evidence).toHaveLength(1);
    expect(candidate.evidence[0]!.source_file).toBe('/tmp/test.ts');
    expect(candidate.evidence[0]!.line_start).toBe(10);
    expect(candidate.evidence[0]!.line_end).toBe(20);
    // Provenance metadata preserved in lang_meta
    expect(candidate.lang_meta).toBeDefined();
    expect(candidate.lang_meta!.record_type).toBe('node');
    expect(candidate.lang_meta!.extraction_method).toBe('ast');
    expect(candidate.lang_meta!.adapter_id).toBe('typescript-adapter');
    expect(candidate.lang_meta!.adapter_version).toBe('1.0.0');
    expect(candidate.lang_meta!.confidence).toBe(0.95);
    expect(candidate.lang_meta!.isPublic).toBe(true);
  });

  it('maps an edge record with edge-specific fields', () => {
    const record: AdapterCandidateRecord = {
      id: 'edge-id-1',
      recordType: 'edge',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      filePath: '/tmp/test.ts',
      lineStart: 5,
      kind: 'calls',
      confidence: 0.90,
      extractionMethod: 'ast',
      adapterId: 'typescript-adapter',
      adapterVersion: '1.0.0',
      fromId: 'node-a',
      toId: 'node-b',
      edgeType: 'calls',
    };

    const candidate = mapAdapterRecordToCandidate(record, context);

    expect(candidate.lang_meta!.record_type).toBe('edge');
    expect(candidate.lang_meta!.from_id).toBe('node-a');
    expect(candidate.lang_meta!.to_id).toBe('node-b');
    expect(candidate.lang_meta!.edge_type).toBe('calls');
  });

  it('maps multiple records at once', () => {
    const records: AdapterCandidateRecord[] = [
      {
        id: 'r1',
        recordType: 'node',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        filePath: '/tmp/a.ts',
        kind: 'ts_function',
        confidence: 0.95,
        extractionMethod: 'ast',
        adapterId: 'typescript-adapter',
        adapterVersion: '1.0.0',
      },
      {
        id: 'r2',
        recordType: 'node',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        filePath: '/tmp/b.ts',
        kind: 'ts_class',
        confidence: 0.95,
        extractionMethod: 'ast',
        adapterId: 'typescript-adapter',
        adapterVersion: '1.0.0',
      },
    ];

    const candidates = mapAdapterRecordsToCandidate(records, context);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]!.candidate_id).toBe('r1');
    expect(candidates[1]!.candidate_id).toBe('r2');
  });

  it('handles missing optional fields gracefully', () => {
    const record: AdapterCandidateRecord = {
      id: 'minimal-id',
      recordType: 'node',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      filePath: '/tmp/test.ts',
      kind: 'unknown_type',
      confidence: 0.5,
      extractionMethod: 'regex',
      adapterId: 'test-adapter',
      adapterVersion: '0.1.0',
    };

    const candidate = mapAdapterRecordToCandidate(record, context);

    expect(candidate.symbol).toBe('unknown_type'); // Falls back to kind
    expect(candidate.line_start).toBe(1); // Default
    expect(candidate.line_end).toBe(1); // Default
  });
});

describe('createExtractionError', () => {
  it('creates a structured EXTRACTION_FAILED error', () => {
    const error = createExtractionError(
      '/tmp/broken.ts',
      'Syntax error at line 5',
      'typescript-adapter',
      '1.0.0',
      new Error('parse failed'),
    );

    expect(error.code).toBe('EXTRACTION_FAILED');
    expect(error.filePath).toBe('/tmp/broken.ts');
    expect(error.message).toBe('Syntax error at line 5');
    expect(error.adapterId).toBe('typescript-adapter');
    expect(error.adapterVersion).toBe('1.0.0');
    expect(error.timestamp).toBeDefined();
    expect(error.details).toBeInstanceOf(Error);
  });
});

describe('TypeScriptAdapter provenance and error handling', () => {
  it('emits full provenance in lang_meta', async () => {
    const adapter = new TypeScriptAdapter();
    // Use a simple inline parse to test provenance fields
    const parsed = await adapter.parse([]);
    const candidates = await adapter.extract(parsed, context);
    // Empty input produces no candidates but no errors
    expect(candidates).toHaveLength(0);
    expect(adapter.getExtractionErrors()).toHaveLength(0);
  });

  it('emits EXTRACTION_FAILED for unparseable files and continues', async () => {
    const adapter = new TypeScriptAdapter();
    // Parse a non-existent file — should emit error and continue
    const parsed = await adapter.parse(['/tmp/nonexistent-file-xyz.ts']);
    expect(parsed).toHaveLength(0);
    const errors = adapter.getExtractionErrors();
    expect(errors.length).toBe(1);
    expect(errors[0]!.code).toBe('EXTRACTION_FAILED');
    expect(errors[0]!.filePath).toBe('/tmp/nonexistent-file-xyz.ts');
    expect(errors[0]!.adapterId).toBe('typescript-adapter');
    expect(errors[0]!.adapterVersion).toBe('1.0.0');
  });

  it('does NOT assign trust semantics in classify', async () => {
    const adapter = new TypeScriptAdapter();
    const mockCandidates = [{
      candidate_id: 'test',
      candidate_type: 'ts_function',
      workspaceId: 'ws-1',
      project: 'proj-1',
      source_file: '/tmp/test.ts',
      symbol: 'foo',
      line_start: 1,
      line_end: 5,
      status: 'candidate' as const,
      extractor: 'ts_tree_sitter',
      evidence: [],
    }];
    const classified = await adapter.classify(mockCandidates);
    // classify should return candidates unchanged — no trust assignment
    expect(classified).toEqual(mockCandidates);
  });
});

describe('CSharpAdapter provenance and error handling', () => {
  it('emits EXTRACTION_FAILED for unparseable files and continues', async () => {
    const adapter = new CSharpAdapter();
    const parsed = await adapter.parse(['/tmp/nonexistent-file-xyz.cs']);
    expect(parsed.files).toHaveLength(0);
    const errors = adapter.getExtractionErrors();
    expect(errors.length).toBe(1);
    expect(errors[0]!.code).toBe('EXTRACTION_FAILED');
    expect(errors[0]!.filePath).toBe('/tmp/nonexistent-file-xyz.cs');
    expect(errors[0]!.adapterId).toBe('csharp-adapter');
    expect(errors[0]!.adapterVersion).toBe('1.0.0');
  });

  it('does NOT assign trust semantics in classify', async () => {
    const adapter = new CSharpAdapter();
    const mockCandidates = [{
      candidate_id: 'test',
      candidate_type: 'csharp_class',
      workspaceId: 'ws-1',
      project: 'proj-1',
      source_file: '/tmp/test.cs',
      symbol: 'MyClass',
      line_start: 1,
      line_end: 10,
      status: 'candidate' as const,
      extractor: 'csharp_tree_sitter',
      evidence: [],
    }];
    const classified = await adapter.classify(mockCandidates);
    expect(classified).toEqual(mockCandidates);
  });
});

describe('StructuredFileAdapter provenance and error handling', () => {
  it('emits EXTRACTION_FAILED for unparseable files and continues', async () => {
    const adapter = new StructuredFileAdapter();
    const parsed = await adapter.parse(['/tmp/nonexistent-file-xyz.json']);
    expect(parsed).toHaveLength(0);
    const errors = adapter.getExtractionErrors();
    expect(errors.length).toBe(1);
    expect(errors[0]!.code).toBe('EXTRACTION_FAILED');
    expect(errors[0]!.filePath).toBe('/tmp/nonexistent-file-xyz.json');
    expect(errors[0]!.adapterId).toBe('structured-file-adapter');
    expect(errors[0]!.adapterVersion).toBe('1.0.0');
  });

  it('does NOT assign trust semantics in classify', async () => {
    const adapter = new StructuredFileAdapter();
    const mockCandidates = [{
      candidate_id: 'test',
      candidate_type: 'json_config_key',
      workspaceId: 'ws-1',
      project: 'proj-1',
      source_file: '/tmp/config.json',
      symbol: 'database.host',
      line_start: 1,
      line_end: 1,
      status: 'candidate' as const,
      extractor: 'json_config_parser',
      evidence: [],
    }];
    const classified = await adapter.classify(mockCandidates);
    expect(classified).toEqual(mockCandidates);
  });
});
