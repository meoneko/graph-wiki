import { createHash } from 'node:crypto';
import path from 'node:path';
import type {
  AdapterContext,
  CalledSymbolRef,
  CandidateRecord,
  EvidenceSpan,
  IProjectAdapter,
} from '../../core/types.js';
import {
  DEFAULT_PARSE_BUDGET,
  type AdapterParsedResult,
  type ParsedFile,
  type ParsedSymbol,
  type ParseFallbackContext,
  type SourceFileSnapshot,
} from '../../scanner/core/ILanguageParser.js';
import { readSourceFileSnapshot } from '../../scanner/core/sourceFileSnapshot.js';

export type ParsedFileWithMeta = ParsedFile & {
  sourceHash?: string;
  encoding?: SourceFileSnapshot['encoding'];
};

export interface ILanguageParserWithReady {
  parseWithContext(
    sourceCode: string,
    filePath: string,
    context: ParseFallbackContext,
  ): ParsedFile;
  ensureReady(): Promise<void>;
}

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

export abstract class TreeSitterLanguageAdapter implements IProjectAdapter {
  abstract get language(): string;
  protected abstract get parser(): ILanguageParserWithReady;

  async parse(paths: string[]): Promise<AdapterParsedResult> {
    const snapshots = await Promise.all(paths.map((p) => readSourceFileSnapshot(p)));
    return this.parseSnapshots(snapshots);
  }

  async parseSnapshots(snapshots: SourceFileSnapshot[], _context?: AdapterContext): Promise<AdapterParsedResult> {
    await this.parser.ensureReady();
    const files = snapshots.map((snapshot): ParsedFileWithMeta => {
      const parsed = this.parser.parseWithContext(snapshot.content, snapshot.filePath, {
        budget: DEFAULT_PARSE_BUDGET,
        snapshot,
      });
      return {
        ...parsed,
        sourceHash: snapshot.hash,
        encoding: snapshot.encoding,
      };
    });
    return { paths: snapshots.map((snapshot) => snapshot.filePath), files };
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const input = parsed as { files: ParsedFileWithMeta[] };
    return input.files.flatMap((file) =>
      file.symbols.map((symbol) => this.symbolToCandidate(symbol, file, context)));
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  protected resolveNodeType(symbol: ParsedSymbol): CandidateRecord['candidate_type'] {
    if (symbol.kind === 'interface') return 'interface';
    if (symbol.kind === 'method' || symbol.kind === 'constructor') return 'method';
    if (symbol.kind === 'function' || symbol.kind === 'top_level_statement') return 'function';
    if (symbol.kind === 'class') return 'class';
    return 'type';
  }

  protected buildLangMeta(symbol: ParsedSymbol, file: ParsedFileWithMeta): Record<string, unknown> {
    return {
      originalKind: symbol.kind,
      kind: symbol.kind,
      isPublic: symbol.isPublic,
      isStatic: symbol.isStatic,
      returnType: symbol.returnType,
      namespace: symbol.namespace,
      containingClass: symbol.containingClass,
      parseMode: file.parseMode,
      parseMetrics: file.metrics,
      sourceHash: file.sourceHash,
      encoding: file.encoding,
    };
  }

  protected symbolToCandidate(
    symbol: ParsedSymbol,
    file: ParsedFileWithMeta,
    context: AdapterContext,
  ): CandidateRecord {
    const filePath = file.filePath;
    const nodeType = this.resolveNodeType(symbol);
    const evidence: EvidenceSpan = {
      evidence_id: stableId(filePath, symbol.name, String(symbol.startLine)),
      source_file: filePath,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      excerpt: `${symbol.name} (${path.basename(filePath)})`,
      role: 'source',
    };

    return {
      candidate_id: stableId(nodeType, filePath, symbol.qualifiedName || symbol.name),
      candidate_type: nodeType,
      roles: [],
      language: this.language,
      workspaceId: context.workspaceId,
      project: context.projectId,
      source_file: filePath,
      symbol: symbol.qualifiedName || symbol.name,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      called_symbols: (symbol.calledSymbols ?? []).map((call): CalledSymbolRef => ({
        name: call.name,
        qualifiedName: call.qualifiedName,
        line: call.callSite.line,
        column: call.callSite.column,
        source_file: filePath,
        containingClass: symbol.containingClass,
        receiver: call.receiver,
        receiverType: call.receiverType,
      })),
      annotations: symbol.annotations ?? [],
      evidence: [evidence],
      extractor: file.parseMode === 'fallback'
        ? `${this.language}_legacy_fallback`
        : `${this.language}_tree_sitter`,
      status: 'candidate',
      lang_meta: this.buildLangMeta(symbol, file),
    };
  }
}

