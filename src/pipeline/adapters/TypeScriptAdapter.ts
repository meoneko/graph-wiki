import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { TypeScriptTreeSitterParser } from '../../scanner/languages/typescript/TypeScriptTreeSitterParser.js';
import type { ImportDecl, ParsedFile, ParsedSymbol } from '../../scanner/core/ILanguageParser.js';
import { createExtractionError, type AdapterExtractionError } from './IProjectAdapter.js';

/** Adapter identity constants for provenance tracking */
const ADAPTER_ID = 'typescript-adapter';
const ADAPTER_VERSION = '1.0.0';

interface ParsedTsFile {
  filePath: string;
  parsed: ParsedFile;
}

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

function makeEvidence(filePath: string, line: number, excerpt: string, role: EvidenceSpan['role'] = 'source'): EvidenceSpan {
  return {
    evidence_id: stableId(filePath, String(line), excerpt),
    source_file: filePath,
    line_start: line,
    line_end: line,
    excerpt,
    role,
  };
}

/**
 * TypeScriptAdapter — Extracts facts from TypeScript/JavaScript source files.
 *
 * Emits findings and evidence only — does NOT assign trust semantics.
 * Implements structured error handling (EXTRACTION_FAILED) with continue-on-error.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class TypeScriptAdapter implements IProjectAdapter {
  private readonly parser = new TypeScriptTreeSitterParser();

  /** Collected extraction errors for the current extraction run */
  private extractionErrors: AdapterExtractionError[] = [];

  /** Returns errors from the last extraction run */
  getExtractionErrors(): AdapterExtractionError[] {
    return [...this.extractionErrors];
  }

  async parse(paths: string[]): Promise<ParsedTsFile[]> {
    this.extractionErrors = [];
    const results: ParsedTsFile[] = [];

    for (const p of paths) {
      try {
        const content = await readFile(p, 'utf-8');
        const parsed = await this.parser.parse(content, p);
        if (parsed.errors.length > 0) {
          console.warn(`[crg] parser backend ${this.parser.backendId} diagnostics for ${p}: ${parsed.errors.map((e) => e.message).join('; ')}`);
        }
        results.push({ filePath: p, parsed });
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

    return results;
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const files = parsed as ParsedTsFile[];
    const candidates: CandidateRecord[] = [];

    for (const file of files) {
      try {
        for (const symbol of file.parsed.symbols) {
          const candidate = this.symbolToCandidate(symbol, file.filePath, context);
          if (nodeTypeRegistry.has(candidate.candidate_type)) candidates.push(candidate);
        }

        for (const imp of file.parsed.imports) {
          const candidate = this.importToCandidate(imp, file.filePath, context);
          if (nodeTypeRegistry.has(candidate.candidate_type)) candidates.push(candidate);
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

    return candidates;
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

  private importToCandidate(imp: ImportDecl, filePath: string, context: AdapterContext): CandidateRecord {
    const line = imp.startLine ?? 1;
    return {
      candidate_id: stableId('ts_import', filePath, imp.module, String(line)),
      candidate_type: 'ts_import',
      workspaceId: context.workspaceId,
      project: context.projectId,
      source_file: filePath,
      symbol: `${path.basename(filePath)} imports ${imp.module}`,
      line_start: line,
      line_end: imp.endLine ?? line,
      status: 'candidate',
      extractor: this.parser.backendId,
      evidence: [makeEvidence(filePath, line, imp.module)],
      is_entrypoint: false,
      lang_meta: {
        kind: 'import',
        module: imp.module,
        symbols: imp.symbols ?? [],
        // Full provenance fields
        extraction_method: 'ast' as const,
        adapter_id: ADAPTER_ID,
        adapter_version: ADAPTER_VERSION,
        confidence: 0.95,
        record_type: 'node' as const,
      },
    };
  }

  private symbolToCandidate(symbol: ParsedSymbol, filePath: string, context: AdapterContext): CandidateRecord {
    const type = this.resolveNodeType(symbol);
    const domain = this.inferDomain(filePath, context.projectRoot);
    return {
      candidate_id: stableId(type, filePath, symbol.qualifiedName || symbol.name, String(symbol.startLine)),
      candidate_type: type,
      workspaceId: context.workspaceId,
      project: context.projectId,
      source_file: filePath,
      symbol: symbol.qualifiedName || symbol.name,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      status: 'candidate',
      extractor: this.parser.backendId,
      evidence: [makeEvidence(filePath, symbol.startLine, symbol.body ?? symbol.name)],
      called_symbols: symbol.calledSymbols.map((c) => c.qualifiedName || c.name),
      is_entrypoint: symbol.isEntrypoint,
      http_path: this.extractRoutePath(symbol),
      annotations: symbol.annotations,
      domain,
      lang_meta: {
        kind: symbol.kind,
        parserBackend: this.parser.backendId,
        isPublic: symbol.isPublic,
        derived_domain: domain,
        // Full provenance fields
        extraction_method: 'ast' as const,
        adapter_id: ADAPTER_ID,
        adapter_version: ADAPTER_VERSION,
        confidence: 0.95,
        record_type: 'node' as const,
      },
    };
  }

  private resolveNodeType(symbol: ParsedSymbol): string {
    if (symbol.annotations.includes('ts_route')) return 'ts_route';
    if (/^use[A-Z]/.test(symbol.name)) return 'ts_hook';
    if (symbol.annotations.includes('jsx_component')) return 'ts_component';
    return 'ts_function';
  }

  private extractRoutePath(symbol: ParsedSymbol): string | undefined {
    return symbol.name.match(/^Route:(.*)$/)?.[1];
  }

  private inferDomain(filePath: string, projectRoot: string): string | undefined {
    const relative = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    const parts = relative.split('/').filter(Boolean);
    const srcIndex = parts.findIndex((part) => part === 'src' || part === 'app');
    const candidate = srcIndex >= 0 ? parts[srcIndex + 1] : parts[0];
    if (!candidate || candidate.includes('.')) return undefined;
    if (['components', 'pages', 'routes', 'app', 'src', 'lib', 'utils', 'hooks'].includes(candidate.toLowerCase())) {
      return parts[srcIndex + 2] && !parts[srcIndex + 2]!.includes('.') ? parts[srcIndex + 2] : candidate;
    }
    return candidate;
  }
}
