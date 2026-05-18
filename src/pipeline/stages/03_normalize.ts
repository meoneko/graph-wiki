import { createHash } from 'node:crypto';
import type { CandidateRecord, NormalizedFact, Provenance } from '../../core/types.js';

/**
 * Normalizer — Pipeline Stage 03
 *
 * Transforms extracted CandidateRecords into NormalizedFacts with:
 * - Stable keys for cross-build identification (deterministic hash)
 * - Unified field naming across adapters (TypeScript, C#, Markdown)
 * - Deduplication of facts with identical stable keys (keep highest confidence)
 * - Full provenance preservation from extraction stage
 *
 * Requirements: 3.2
 */

// ─── Field Unification Maps ─────────────────────────────────────────────────

/**
 * Maps adapter-specific candidate_type values to unified kind names.
 * This ensures consistent naming regardless of source language adapter.
 */
const TYPE_UNIFICATION_MAP: Record<string, string> = {
  // TypeScript adapter types → unified
  ts_function: 'function',
  ts_class: 'class',
  ts_method: 'method',
  ts_interface: 'interface',
  ts_import: 'import',
  ts_api_endpoint: 'api_endpoint',
  ts_hook: 'hook',
  ts_component: 'react_component',
  ts_react_component: 'react_component',
  ts_module: 'module',
  ts_namespace: 'namespace',
  ts_enum: 'enum',
  ts_type_alias: 'type_alias',
  ts_variable: 'variable',
  ts_arrow_function: 'function',
  ts_export: 'export',

  // C# adapter types → unified
  csharp_class: 'class',
  csharp_method: 'method',
  csharp_interface: 'interface',
  csharp_controller: 'controller_action',
  csharp_controller_action: 'controller_action',
  csharp_service: 'service',
  csharp_usecase: 'usecase',
  csharp_dto: 'dto',
  csharp_model: 'model',
  csharp_entity: 'entity',
  csharp_enum: 'enum',
  csharp_namespace: 'namespace',
  csharp_property: 'property',
  csharp_record: 'dto',

  // Structured file adapter types → unified
  config_key: 'config',
  config_section: 'config',
  env_variable: 'config',
  openapi_endpoint: 'api_endpoint',
  openapi_schema: 'dto',
  json_schema: 'dto',
  yaml_config: 'config',
  toml_config: 'config',

  // Markdown adapter types → unified
  md_section: 'documentation',
  md_heading: 'documentation',
  markdown_section: 'documentation',
};

/**
 * Maps adapter-specific extractor identifiers to a normalized extraction method.
 */
const EXTRACTION_METHOD_MAP: Record<string, string> = {
  ts_tree_sitter_parser: 'ast',
  ts_tree_sitter: 'ast',
  csharp_tree_sitter: 'ast',
  csharp_tree_sitter_parser: 'ast',
  structured_file_parser: 'static-analysis',
  json_parser: 'static-analysis',
  yaml_parser: 'static-analysis',
  toml_parser: 'static-analysis',
  env_parser: 'static-analysis',
  openapi_parser: 'doc-parse',
  markdown_parser: 'doc-parse',
  regex_extractor: 'regex',
  manual: 'manual',
};

// ─── Stable Key Generation ───────────────────────────────────────────────────

/**
 * Generates a deterministic stable key for cross-build identification.
 * The key is a SHA-256 hash of: workspace + project + kind + symbol + file.
 * This ensures the same logical fact produces the same key across builds.
 */
function computeStableKey(
  workspaceId: string,
  project: string,
  kind: string,
  symbol: string,
  file: string,
): string {
  const input = [workspaceId, project, kind, symbol, file].join('::');
  return createHash('sha256').update(input).digest('hex');
}

// ─── Provenance Extraction ───────────────────────────────────────────────────

/**
 * Extracts provenance records from a CandidateRecord's evidence spans.
 * Preserves all extraction-stage provenance information.
 * Includes full provenance fields per Requirement 21.1.
 */
function extractProvenance(candidate: CandidateRecord): Provenance[] {
  const provenanceRecords: Provenance[] = [];
  const extractionMethod = unifyExtractionMethod(candidate.extractor);
  const adapterId = candidate.extractor;
  const adapterVersion = String(candidate.lang_meta?.adapter_version ?? '1.0.0');
  const confidence = computeConfidence(candidate);

  // Build provenance from evidence spans
  for (const ev of candidate.evidence) {
    provenanceRecords.push({
      source: resolveProvenanceSource(candidate.extractor),
      artifact_source: candidate.source_file,
      producer_stage: 'extract',
      timestamp: new Date().toISOString(),
      file: ev.source_file,
      line_start: ev.line_start,
      line_end: ev.line_end,
      workspaceId: candidate.workspaceId,
      sourceRootId: candidate.project,
      filePath: ev.source_file,
      extractionStage: 'extract',
      extractionMethod,
      adapterId,
      adapterVersion,
      confidence,
    });
  }

  // If no evidence spans, create a single provenance from the candidate itself
  if (provenanceRecords.length === 0) {
    provenanceRecords.push({
      source: resolveProvenanceSource(candidate.extractor),
      artifact_source: candidate.source_file,
      producer_stage: 'extract',
      timestamp: new Date().toISOString(),
      file: candidate.source_file,
      line_start: candidate.line_start,
      line_end: candidate.line_end,
      workspaceId: candidate.workspaceId,
      sourceRootId: candidate.project,
      filePath: candidate.source_file,
      extractionStage: 'extract',
      extractionMethod,
      adapterId,
      adapterVersion,
      confidence,
    });
  }

  return provenanceRecords;
}

/**
 * Maps extractor identifier to provenance source type.
 */
function resolveProvenanceSource(extractor: string): Provenance['source'] {
  const lower = extractor.toLowerCase();
  if (lower.includes('tree_sitter') || lower.includes('parser') || lower.includes('ast')) {
    return 'parser';
  }
  if (lower.includes('analysis') || lower.includes('static')) {
    return 'analysis';
  }
  if (lower.includes('ai') || lower.includes('llm') || lower.includes('gpt')) {
    return 'ai';
  }
  return 'user';
}

// ─── Field Unification ───────────────────────────────────────────────────────

/**
 * Unifies the candidate_type to a normalized kind.
 * If no mapping exists, the original type is preserved.
 */
function unifyKind(candidateType: string): string {
  return TYPE_UNIFICATION_MAP[candidateType] ?? candidateType;
}

/**
 * Resolves the normalized extraction method from the extractor identifier.
 */
function unifyExtractionMethod(extractor: string): string {
  return EXTRACTION_METHOD_MAP[extractor] ?? EXTRACTION_METHOD_MAP[extractor.toLowerCase()] ?? 'static-analysis';
}

/**
 * Computes a confidence score for a candidate.
 * Uses evidence count and extraction method as heuristics when no explicit confidence exists.
 */
function computeConfidence(candidate: CandidateRecord): number {
  // If the candidate already has a confidence score in lang_meta, use it
  const existingConfidence = candidate.lang_meta?.confidence;
  if (typeof existingConfidence === 'number' && existingConfidence >= 0 && existingConfidence <= 1) {
    return existingConfidence;
  }

  // Derive confidence from extraction method
  const method = unifyExtractionMethod(candidate.extractor);
  switch (method) {
    case 'ast':
      return 0.95;
    case 'static-analysis':
      return 0.85;
    case 'doc-parse':
      return 0.80;
    case 'regex':
      return 0.60;
    case 'manual':
      return 0.70;
    default:
      return 0.50;
  }
}

// ─── Internal Types ──────────────────────────────────────────────────────────

/** Internal representation used during normalization before final output. */
interface NormalizationEntry {
  fact: NormalizedFact;
  stableKey: string;
  confidence: number;
  provenance: Provenance[];
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

export class Normalizer {
  /**
   * Normalizes extracted CandidateRecords into NormalizedFacts.
   *
   * Responsibilities:
   * 1. Assigns stable keys for cross-build identification
   * 2. Unifies field naming across adapters (TypeScript, C#, Markdown)
   * 3. Deduplicates facts with identical stable keys (keeps highest confidence)
   * 4. Preserves all provenance from extraction stage
   */
  normalize(facts: CandidateRecord[], workspaceId: string): NormalizedFact[] {
    // Phase 1: Transform each candidate into a normalization entry
    const entries = facts.map((candidate) => this.normalizeSingle(candidate, workspaceId));

    // Phase 2: Deduplicate by stable key, keeping highest confidence
    return this.deduplicate(entries);
  }

  /**
   * Normalizes a single CandidateRecord into a NormalizationEntry.
   */
  private normalizeSingle(candidate: CandidateRecord, workspaceId: string): NormalizationEntry {
    const unifiedKind = unifyKind(candidate.candidate_type);
    const confidence = computeConfidence(candidate);
    const provenance = extractProvenance(candidate);

    const stableKey = computeStableKey(
      workspaceId,
      candidate.project,
      unifiedKind,
      candidate.symbol,
      candidate.source_file,
    );

    // Build the NormalizedFact preserving the existing type contract
    const fact: NormalizedFact = {
      // Preserve all original CandidateRecord fields
      ...candidate,
      // Override workspaceId to ensure consistency
      workspaceId,
      // Set status to candidate (will be overwritten to 'validated' by validate stage)
      status: 'candidate',
      // Assign fact_id using the stable key for deterministic identification
      fact_id: stableKey,
      // Store normalization metadata in lang_meta
      lang_meta: {
        ...(candidate.lang_meta ?? {}),
        normalized_kind: unifiedKind,
        extraction_method: unifyExtractionMethod(candidate.extractor),
        stable_key: stableKey,
        confidence_score: confidence,
        provenance_records: provenance,
      },
    };

    return { fact, stableKey, confidence, provenance };
  }

  /**
   * Deduplicates normalized facts by stable key.
   * When multiple facts share the same stable key, keeps the one with highest confidence.
   * Provenance from all duplicates is merged into the surviving fact.
   */
  private deduplicate(entries: NormalizationEntry[]): NormalizedFact[] {
    const byKey = new Map<string, NormalizationEntry[]>();

    // Group by stable key
    for (const entry of entries) {
      const group = byKey.get(entry.stableKey);
      if (group) {
        group.push(entry);
      } else {
        byKey.set(entry.stableKey, [entry]);
      }
    }

    // For each group, keep highest confidence and merge provenance
    const result: NormalizedFact[] = [];
    for (const group of byKey.values()) {
      // Sort by confidence descending — highest first
      group.sort((a, b) => b.confidence - a.confidence);
      const winner = group[0]!;

      // Merge provenance from all duplicates into the winner
      const mergedProvenance: Provenance[] = [];
      for (const entry of group) {
        mergedProvenance.push(...entry.provenance);
      }

      // Update lang_meta with merged provenance
      const cleanFact: NormalizedFact = {
        ...winner.fact,
        lang_meta: {
          ...(winner.fact.lang_meta ?? {}),
          provenance_records: mergedProvenance,
          duplicate_count: group.length > 1 ? group.length : undefined,
        },
      };

      result.push(cleanFact);
    }

    return result;
  }
}

/**
 * Pipeline stage entry point.
 * Normalizes extracted candidates into a uniform schema with stable keys.
 */
export async function normalizeFacts(
  candidates: CandidateRecord[],
  workspaceId: string,
): Promise<NormalizedFact[]> {
  const normalizer = new Normalizer();
  return normalizer.normalize(candidates, workspaceId);
}
