import { createHash } from 'node:crypto';
import path from 'node:path';
import type { AdapterContext, CalledSymbolRef, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import {
  DEFAULT_PARSE_BUDGET,
  type AdapterParsedResult,
  type ParsedFile,
  type ParsedSymbol,
  type SourceFileSnapshot,
} from '../../scanner/core/ILanguageParser.js';
import { readSourceFileSnapshot } from '../../scanner/core/sourceFileSnapshot.js';
import { CSharpParser } from '../../scanner/languages/csharp/CSharpParser.js';

type ParsedCSharpFile = ParsedFile & {
  sourceHash?: string;
  encoding?: SourceFileSnapshot['encoding'];
};

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

export class CSharpAdapter implements IProjectAdapter {
  private readonly parser = new CSharpParser();

  async parse(paths: string[]): Promise<AdapterParsedResult> {
    const snapshots = await Promise.all(paths.map((p) => readSourceFileSnapshot(p)));
    return this.parseSnapshots(snapshots);
  }

  async parseSnapshots(snapshots: SourceFileSnapshot[]): Promise<AdapterParsedResult> {
    await this.parser.ensureReady();
    const files = snapshots.map((snapshot): ParsedCSharpFile => {
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
    const input = parsed as { files: ParsedCSharpFile[] };
    const out: CandidateRecord[] = [];

    for (const file of input.files) {
      for (const symbol of file.symbols) {
        const candidate = this.symbolToCandidate(symbol, file, context);
        out.push(candidate);
      }
    }

    return out;
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  private symbolToCandidate(symbol: ParsedSymbol, file: ParsedCSharpFile, context: AdapterContext): CandidateRecord {
    const filePath = file.filePath;
    const nodeType = this.resolveNodeType(symbol);
    const declaringTypeFullName = this.declaringTypeFullName(symbol);
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
      language: 'csharp',
      workspaceId: context.workspaceId,
      project: context.projectId,
      source_file: filePath,
      symbol: symbol.qualifiedName || symbol.name,
      line_start: symbol.startLine,
      line_end: symbol.endLine,
      called_symbols: symbol.calledSymbols.map((c): CalledSymbolRef => ({
        name: c.name,
        qualifiedName: c.qualifiedName,
        line: c.callSite.line,
        column: c.callSite.column,
        source_file: filePath,
        containingClass: declaringTypeFullName ?? symbol.containingClass,
        receiver: c.receiver,
        receiverType: c.receiverType,
      })),
      http_method: this.extractHttpMethod(symbol),
      http_path: this.extractHttpPath(symbol),
      annotations: symbol.annotations,
      evidence: [evidence],
      extractor: file.parseMode === 'fallback' ? 'csharp_legacy_fallback' : 'csharp_tree_sitter',
      status: 'candidate',
      lang_meta: {
        originalKind: symbol.kind,
        kind: symbol.kind,
        isPublic: symbol.isPublic,
        isStatic: symbol.isStatic,
        returnType: symbol.returnType,
        namespace: symbol.namespace,
        containingClass: symbol.containingClass,
        declaringTypeFullName,
        isPartial: symbol.isPartial ?? false,
        parseMode: file.parseMode,
        parseMetrics: file.metrics,
        sourceHash: file.sourceHash,
        encoding: file.encoding,
        semantic_role: this.inferSemanticRole(symbol),
      },
    };
  }

  private declaringTypeFullName(symbol: ParsedSymbol): string | undefined {
    const qualifiedName = symbol.qualifiedName || symbol.name;
    if (qualifiedName.includes('.')) {
      const parts = qualifiedName.split('.');
      parts.pop();
      if (parts.length > 0) return parts.join('.');
    }
    if (!symbol.containingClass) return undefined;
    if (!symbol.namespace || symbol.containingClass.startsWith(`${symbol.namespace}.`)) return symbol.containingClass;
    return `${symbol.namespace}.${symbol.containingClass}`;
  }

  private resolveNodeType(symbol: ParsedSymbol): CandidateRecord['candidate_type'] {
    if (symbol.kind === 'interface') return 'interface';
    if (symbol.kind === 'method' || symbol.kind === 'constructor') return 'method';
    if (symbol.kind === 'function' || symbol.kind === 'top_level_statement') return 'function';
    if (symbol.name.match(/(Dto|Request|Response|Command|Query)$/i)) return 'dto';
    if (symbol.kind === 'class') return 'class';
    return 'type';
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
