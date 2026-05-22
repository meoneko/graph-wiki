import { createHash } from 'node:crypto';
import path from 'node:path';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import type { ParsedSymbol } from '../../scanner/core/ILanguageParser.js';
import { JavaParser, resolveJavaNodeType } from '../../scanner/languages/java/JavaParser.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { readFile } from 'node:fs/promises';
import { createExtractionError, type AdapterExtractionError } from './IProjectAdapter.js';

/** Adapter identity constants for provenance tracking */
const ADAPTER_ID = 'java-adapter';
const ADAPTER_VERSION = '1.0.0';

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

/**
 * JavaAdapter — Extracts facts from Java source files (Spring-annotated classes).
 *
 * Emits findings and evidence only — does NOT assign trust semantics.
 * Implements structured error handling (EXTRACTION_FAILED) with continue-on-error.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */
export class JavaAdapter implements IProjectAdapter {
  private parser: JavaParser | undefined;

  /** Collected extraction errors for the current extraction run */
  private extractionErrors: AdapterExtractionError[] = [];

  private getParser(): JavaParser {
    if (!this.parser) {
      this.parser = new JavaParser();
    }
    return this.parser;
  }

  /** Returns errors from the last extraction run */
  getExtractionErrors(): AdapterExtractionError[] {
    return [...this.extractionErrors];
  }

  async parse(paths: string[], context: AdapterContext): Promise<{ paths: string[]; files: Array<{ filePath: string; symbols: ParsedSymbol[] }> }> {
    this.extractionErrors = [];
    const parser = this.getParser();
    const files: Array<{ filePath: string; symbols: ParsedSymbol[] }> = [];

    for (const p of paths) {
      try {
        const source = await readFile(p, 'utf-8');
        const parsed = await parser.parse(source, p);
        files.push({ filePath: p, symbols: parsed.symbols });
      } catch (err) {
        // Structured error handling: emit EXTRACTION_FAILED and continue
        this.extractionErrors.push(
          createExtractionError(
            p,
            err instanceof Error ? err.message : String(err),
            ADAPTER_ID,
            ADAPTER_VERSION,
            err,
          ),
        );
        // Continue processing remaining files
      }
    }

    return { paths, files };
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const input = parsed as { files: Array<{ filePath: string; symbols: ParsedSymbol[] }> };
    const out: CandidateRecord[] = [];

    for (const file of input.files) {
      try {
        for (const symbol of file.symbols) {
          const candidate = this.symbolToCandidate(symbol, file.filePath, context);
          if (nodeTypeRegistry.has(candidate.candidate_type)) out.push(candidate);
        }
      } catch (err) {
        // Structured error handling: emit EXTRACTION_FAILED and continue
        this.extractionErrors.push(
          createExtractionError(
            file.filePath,
            err instanceof Error ? err.message : String(err),
            ADAPTER_ID,
            ADAPTER_VERSION,
            err,
          ),
        );
        // Continue processing remaining files
      }
    }

    return out;
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    // Adapters do NOT assign trust semantics — emit findings and evidence only
    return candidates;
  }

  async identify_entrypoints(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates.map((c) => ({ ...c, is_entrypoint: nodeTypeRegistry.isEntrypoint(c.candidate_type) }));
  }

  private symbolToCandidate(symbol: ParsedSymbol, filePath: string, context: AdapterContext): CandidateRecord {
    const nodeType = resolveJavaNodeType(symbol.annotations) ?? 'java_class';
    const evidence: EvidenceSpan = {
      evidence_id: stableId(filePath, symbol.name, String(symbol.startLine)),
      source_file: filePath,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      excerpt: `${symbol.name} (${path.basename(filePath)})`,
      role: this.roleForType(nodeType),
    };

    const lang_meta: Record<string, unknown> = {
      kind: symbol.kind,
      namespace: symbol.namespace,
      annotations: symbol.annotations,
      // Full provenance fields
      extraction_method: 'ast' as const,
      adapter_id: ADAPTER_ID,
      adapter_version: ADAPTER_VERSION,
      confidence: 0.95,
      record_type: 'node' as const,
    };

    return {
      candidate_id: stableId(nodeType, filePath, symbol.qualifiedName || symbol.name),
      candidate_type: nodeType,
      workspaceId: context.workspaceId,
      project: context.projectId,
      source_file: filePath,
      symbol: symbol.qualifiedName || symbol.name,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      called_symbols: symbol.calledSymbols.map((c) => c.qualifiedName || c.name),
      is_entrypoint: nodeTypeRegistry.isEntrypoint(nodeType),
      annotations: symbol.annotations,
      evidence: [evidence],
      extractor: 'java_tree_sitter',
      status: 'candidate',
      lang_meta,
    };
  }

  private roleForType(candidateType: string): EvidenceSpan['role'] {
    if (candidateType.includes('controller')) return 'controller';
    if (candidateType.includes('service')) return 'source';
    if (candidateType.includes('repository')) return 'source';
    return 'source';
  }
}
