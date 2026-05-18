/**
 * SourceAdapter Contract — Design-doc interface for pipeline adapters.
 *
 * This module defines the full adapter contract as specified in the design document.
 * Adapters emit `AdapterCandidateRecord` instances which are then mapped to the
 * existing pipeline `CandidateRecord` type via `mapAdapterRecordToCandidate()`.
 *
 * Key principles:
 * - Adapters emit findings and evidence only — NO trust semantics
 * - Full provenance: adapterId, adapterVersion, extractionMethod, confidence
 * - Structured error handling: EXTRACTION_FAILED with continue-on-error
 * - recordType discriminator allows Normalizer to distinguish nodes from edges
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import type { AdapterContext, CandidateRecord, EvidenceSpan } from '../../core/types.js';

// Re-export the IProjectAdapter interface from core types for backward compatibility
export type { IProjectAdapter } from '../../core/types.js';

// ─── Design-Doc CandidateRecord (Adapter Output) ────────────────────────────

/**
 * The extraction method used by the adapter to produce this record.
 */
export type ExtractionMethod = 'ast' | 'static-analysis' | 'regex' | 'doc-parse' | 'manual';

/**
 * The primary handoff contract between adapters and the normalization stage.
 * This matches the design document's CandidateRecord interface exactly.
 *
 * Adapters produce these records. The mapping layer converts them to the
 * pipeline's internal CandidateRecord type for downstream consumption.
 */
export interface AdapterCandidateRecord {
  /** Unique identifier for this record */
  id: string;
  /** Discriminator for Normalizer to distinguish node records from edge records */
  recordType: 'node' | 'edge';
  /** Workspace this record belongs to */
  workspaceId: string;
  /** Project within the workspace */
  projectId: string;
  /** Source file path where this was extracted from */
  filePath: string;
  /** Starting line number (1-based) */
  lineStart?: number;
  /** Ending line number (1-based) */
  lineEnd?: number;
  /** Node/edge type from taxonomy (e.g., 'function', 'class', 'calls') */
  kind: string;
  /** Human-readable name */
  name?: string;
  /** Code symbol identifier */
  symbol?: string;
  /** Adapter-specific raw data */
  rawValue?: unknown;
  /** Numeric confidence 0-1 */
  confidence: number;
  /** How this record was extracted */
  extractionMethod: ExtractionMethod;
  /** Identifier of the adapter that produced this record */
  adapterId: string;
  /** Version of the adapter */
  adapterVersion: string;
  /** Additional adapter-specific metadata */
  metadata?: Record<string, unknown>;
  /** Edge-specific: source node ID */
  fromId?: string;
  /** Edge-specific: target node ID */
  toId?: string;
  /** Edge-specific: type of the edge relationship */
  edgeType?: string;
}

// ─── Adapter Error Types ─────────────────────────────────────────────────────

/**
 * Structured error emitted when an adapter encounters an unparseable file.
 * Adapters continue processing remaining files after emitting this error.
 */
export interface AdapterExtractionError {
  /** Error code — always EXTRACTION_FAILED for adapter errors */
  code: 'EXTRACTION_FAILED';
  /** The file that could not be processed */
  filePath: string;
  /** Human-readable error message */
  message: string;
  /** The adapter that encountered the error */
  adapterId: string;
  /** The adapter version */
  adapterVersion: string;
  /** Timestamp of the error */
  timestamp: string;
  /** Optional underlying error details */
  details?: unknown;
}

/**
 * Result of an adapter extraction operation.
 * Contains both successful records and any errors encountered.
 */
export interface AdapterExtractionResult {
  /** Successfully extracted records */
  records: AdapterCandidateRecord[];
  /** Errors encountered during extraction (continue-on-error) */
  errors: AdapterExtractionError[];
}

// ─── Adapter Context Extension ───────────────────────────────────────────────

/**
 * Extended adapter context with additional fields for the design-doc contract.
 * This extends the base AdapterContext from core/types.ts.
 */
export interface ExtendedAdapterContext extends AdapterContext {
  /** Additional configuration for the adapter */
  adapterConfig?: Record<string, unknown>;
}

// ─── Mapping Layer ───────────────────────────────────────────────────────────

/**
 * Maps an AdapterCandidateRecord (design-doc shape) to the pipeline's
 * internal CandidateRecord type used by downstream stages.
 *
 * This bridging function allows adapters to emit the design-doc contract
 * while the rest of the pipeline continues to use the existing CandidateRecord shape.
 */
export function mapAdapterRecordToCandidate(
  record: AdapterCandidateRecord,
  context: AdapterContext,
): CandidateRecord {
  // Build evidence span from the record's provenance
  const evidenceSpan: EvidenceSpan = {
    evidence_id: record.id,
    source_file: record.filePath,
    line_start: record.lineStart ?? 1,
    line_end: record.lineEnd ?? record.lineStart ?? 1,
    excerpt: record.name ?? record.symbol ?? record.kind,
    role: inferEvidenceRole(record.kind),
  };

  // Map edge records to a candidate with edge-specific metadata
  const candidate: CandidateRecord = {
    candidate_id: record.id,
    candidate_type: record.kind,
    workspaceId: record.workspaceId,
    project: record.projectId,
    source_file: record.filePath,
    symbol: record.symbol ?? record.name ?? record.kind,
    line_start: record.lineStart ?? 1,
    line_end: record.lineEnd ?? record.lineStart ?? 1,
    status: 'candidate',
    extractor: `${record.adapterId}@${record.adapterVersion}`,
    evidence: [evidenceSpan],
    lang_meta: {
      ...(record.metadata ?? {}),
      record_type: record.recordType,
      extraction_method: record.extractionMethod,
      adapter_id: record.adapterId,
      adapter_version: record.adapterVersion,
      confidence: record.confidence,
      raw_value: record.rawValue,
      // Edge-specific fields preserved in metadata
      ...(record.recordType === 'edge' ? {
        from_id: record.fromId,
        to_id: record.toId,
        edge_type: record.edgeType,
      } : {}),
    },
  };

  return candidate;
}

/**
 * Maps multiple AdapterCandidateRecords to pipeline CandidateRecords.
 */
export function mapAdapterRecordsToCandidate(
  records: AdapterCandidateRecord[],
  context: AdapterContext,
): CandidateRecord[] {
  return records.map((r) => mapAdapterRecordToCandidate(r, context));
}

/**
 * Infers the evidence role from the record kind.
 */
function inferEvidenceRole(kind: string): EvidenceSpan['role'] {
  if (kind.includes('controller') || kind.includes('action')) return 'controller';
  if (kind.includes('route') || kind.includes('endpoint')) return 'route';
  if (kind.includes('usecase') || kind.includes('handler')) return 'usecase';
  if (kind.includes('dto') || kind.includes('request') || kind.includes('response')) return 'dto';
  if (kind.includes('config') || kind.includes('env')) return 'config_key';
  if (kind.includes('schema')) return 'schema_field';
  if (kind.includes('doc') || kind.includes('section')) return 'doc_section';
  if (kind.includes('infra') || kind.includes('resource') || kind.includes('docker') || kind.includes('terraform')) return 'infra_resource';
  if (kind.includes('call') || kind.includes('invoke')) return 'call';
  return 'source';
}

/**
 * Creates a structured extraction error.
 * Used by adapters when they encounter an unparseable file.
 */
export function createExtractionError(
  filePath: string,
  message: string,
  adapterId: string,
  adapterVersion: string,
  details?: unknown,
): AdapterExtractionError {
  return {
    code: 'EXTRACTION_FAILED',
    filePath,
    message,
    adapterId,
    adapterVersion,
    timestamp: new Date().toISOString(),
    details,
  };
}
