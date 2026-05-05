import { createHash } from 'node:crypto';
import path from 'node:path';
import type { AdapterContext, CalledSymbolRef, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import type { ParsedSymbol } from '../../scanner/core/ILanguageParser.js';
import { CSharpParser } from '../../scanner/languages/csharp/CSharpParser.js';
import { readFile } from 'node:fs/promises';
import { TextDecoder } from 'node:util';

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

function decodeCSharpSource(raw: Buffer): string {
  if (raw.length >= 2) {
    const b0 = raw[0] ?? 0;
    const b1 = raw[1] ?? 0;
    if (b0 === 0xff && b1 === 0xfe) {
      return new TextDecoder('utf-16le').decode(raw.subarray(2));
    }
    if (b0 === 0xfe && b1 === 0xff) {
      const swapped = Buffer.allocUnsafe(raw.length - 2);
      for (let i = 2; i + 1 < raw.length; i += 2) {
        swapped[i - 2] = raw[i + 1] ?? 0;
        swapped[i - 1] = raw[i] ?? 0;
      }
      return new TextDecoder('utf-16le').decode(swapped);
    }
  }

  let source = new TextDecoder('utf-8').decode(raw);
  const sample = source.slice(0, Math.min(source.length, 4096));
  const nullCount = [...sample].filter((ch) => ch === '\u0000').length;
  if (sample.length > 0 && (nullCount / sample.length) > 0.2) {
    source = new TextDecoder('utf-16le').decode(raw);
  }
  return source.replace(/\u0000/g, '');
}

export class CSharpAdapter implements IProjectAdapter {
  private readonly parser = new CSharpParser();

  async parse(paths: string[]): Promise<{ paths: string[]; files: Array<{ filePath: string; symbols: ParsedSymbol[] }> }> {
    const files = await Promise.all(paths.map(async (p) => {
      const raw = await readFile(p);
      const source = decodeCSharpSource(raw);
      const parsed = this.parser.parse(source, p);
      return { filePath: p, symbols: parsed.symbols };
    }));
    return { paths, files };
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const input = parsed as { files: Array<{ filePath: string; symbols: ParsedSymbol[] }> };
    const out: CandidateRecord[] = [];

    for (const file of input.files) {
      for (const symbol of file.symbols) {
        const candidate = this.symbolToCandidate(symbol, file.filePath, context);
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


  private symbolToCandidate(symbol: ParsedSymbol, filePath: string, context: AdapterContext): CandidateRecord {
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
        containingClass: symbol.containingClass,
        receiver: c.receiver,
        receiverType: c.receiverType,
      })),
      http_method: this.extractHttpMethod(symbol),
      http_path: this.extractHttpPath(symbol),
      annotations: symbol.annotations,
      evidence: [evidence],
      extractor: 'csharp_tree_sitter',
      status: 'candidate',
      lang_meta: {
        originalKind: symbol.kind,
        kind: symbol.kind,
        isPublic: symbol.isPublic,
        isStatic: symbol.isStatic,
        returnType: symbol.returnType,
        namespace: symbol.namespace,
        containingClass: symbol.containingClass,
        semantic_role: this.inferSemanticRole(symbol),
      },
    };
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
