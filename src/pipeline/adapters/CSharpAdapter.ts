import { createHash } from 'node:crypto';
import path from 'node:path';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import type { ParsedSymbol } from '../../scanner/core/ILanguageParser.js';
import { CSharpParser, type CSharpParserOptions } from '../../scanner/languages/csharp/CSharpParser.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { readFile } from 'node:fs/promises';
import { createExtractionError, type AdapterExtractionError } from './IProjectAdapter.js';

/** Adapter identity constants for provenance tracking */
const ADAPTER_ID = 'csharp-adapter';
const ADAPTER_VERSION = '1.0.0';

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

/**
 * CSharpAdapter — Extracts facts from C# source files.
 *
 * Emits findings and evidence only — does NOT assign trust semantics.
 * Implements structured error handling (EXTRACTION_FAILED) with continue-on-error.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class CSharpAdapter implements IProjectAdapter {
  private parser: CSharpParser | undefined;

  /** Collected extraction errors for the current extraction run */
  private extractionErrors: AdapterExtractionError[] = [];

  private getParser(context: AdapterContext): CSharpParser {
    if (!this.parser) {
      const parserOptions: CSharpParserOptions = {
        extractPartialMethods: context.options?.extractPartialMethods ?? false,
      };
      this.parser = new CSharpParser(parserOptions);
    }
    return this.parser;
  }

  /** Returns errors from the last extraction run */
  getExtractionErrors(): AdapterExtractionError[] {
    return [...this.extractionErrors];
  }

  async parse(paths: string[], context: AdapterContext): Promise<{ paths: string[]; files: Array<{ filePath: string; symbols: ParsedSymbol[] }> }> {
    this.extractionErrors = [];
    const parser = this.getParser(context);
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
    const nodeType = this.resolveNodeType(symbol, context.options);
    const evidence: EvidenceSpan = {
      evidence_id: stableId(filePath, symbol.name, String(symbol.startLine)),
      source_file: filePath,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      excerpt: `${symbol.name} (${path.basename(filePath)})`,
      role: this.roleForType(nodeType, symbol),
    };

    // Build lang_meta based on node type
    let lang_meta: Record<string, unknown>;
    if (nodeType === 'csharp_method') {
      // For method nodes, populate CSharpMethodMeta fields
      const rawParams = symbol.parameters
        ? symbol.parameters.map((p) => [p.type, p.name].filter(Boolean).join(' ')).join(', ')
        : undefined;
      // Strip parentheses and trim whitespace (in case raw string has them)
      const parameters = rawParams
        ? rawParams.replace(/^\(/, '').replace(/\)$/, '').trim()
        : undefined;

      lang_meta = {
        containingClass: symbol.containingClass,
        returnType: symbol.returnType,
        parameters,
        sourceFile: filePath,
        isPartialClass: true,
        // Full provenance fields
        extraction_method: 'ast' as const,
        adapter_id: ADAPTER_ID,
        adapter_version: ADAPTER_VERSION,
        confidence: 0.95,
        record_type: 'node' as const,
      };
    } else {
      lang_meta = {
        kind: symbol.kind,
        namespace: symbol.namespace,
        containingClass: symbol.containingClass,
        semantic_role: this.inferSemanticRole(symbol),
        // Full provenance fields
        extraction_method: 'ast' as const,
        adapter_id: ADAPTER_ID,
        adapter_version: ADAPTER_VERSION,
        confidence: 0.95,
        record_type: 'node' as const,
      };
    }

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
      http_method: this.extractHttpMethod(symbol),
      http_path: this.extractHttpPath(symbol),
      annotations: symbol.annotations,
      evidence: [evidence],
      extractor: 'csharp_tree_sitter',
      status: 'candidate',
      lang_meta,
    };
  }

  private resolveNodeType(symbol: ParsedSymbol, options?: { extractPartialMethods?: boolean }): string {
    if (symbol.annotations.some((a) => /Http(Get|Post|Put|Delete|Patch)/i.test(a))) return 'csharp_controller_action';
    if (symbol.name.match(/^Map(Get|Post|Put|Delete|Patch):/)) return 'csharp_minimal_api';
    if (symbol.kind === 'interface') return 'csharp_interface';
    const semanticRole = this.inferSemanticRole(symbol);
    if (semanticRole === 'usecase') return 'csharp_usecase';
    if (semanticRole === 'dto') return 'csharp_dto';
    if (symbol.kind === 'method' && symbol.containingClass && options?.extractPartialMethods === true) return 'csharp_method';
    return 'csharp_class';
  }

  private roleForType(candidateType: string, symbol: ParsedSymbol): EvidenceSpan['role'] {
    const semanticRole = this.inferSemanticRole(symbol);
    if (candidateType.includes('controller')) return 'controller';
    if (semanticRole === 'usecase') return 'usecase';
    if (semanticRole === 'dto') return 'dto';
    return 'source';
  }

  private inferSemanticRole(symbol: ParsedSymbol): string | undefined {
    if (symbol.kind === 'class' && symbol.name.match(/(UseCase|Handler)$/)) return 'usecase';
    if (symbol.name.match(/(Dto|Request|Response|Command|Query)$/)) return 'dto';
    return undefined;
  }

  private extractHttpMethod(symbol: ParsedSymbol): string | undefined {
    for (const ann of symbol.annotations) {
      const m = ann.match(/Http(Get|Post|Put|Delete|Patch)/i);
      if (m?.[1]) return m[1].toUpperCase();
    }
    const route = symbol.name.match(/^Map(Get|Post|Put|Delete|Patch):/i);
    return route?.[1] ? route[1].toUpperCase() : undefined;
  }

  private extractHttpPath(symbol: ParsedSymbol): string | undefined {
    const fromName = symbol.name.match(/^Map(Get|Post|Put|Delete|Patch):(.*)$/i);
    return fromName?.[2] ?? undefined;
  }
}
