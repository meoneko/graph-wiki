import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { TypeScriptTreeSitterParser } from '../../scanner/languages/typescript/TypeScriptTreeSitterParser.js';
import type { ImportDecl, ParsedFile, ParsedSymbol } from '../../scanner/core/ILanguageParser.js';

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

export class TypeScriptAdapter implements IProjectAdapter {
  private readonly parser = new TypeScriptTreeSitterParser();

  async parse(paths: string[]): Promise<ParsedTsFile[]> {
    return Promise.all(paths.map(async (p) => {
      const content = await readFile(p, 'utf-8');
      const parsed = await this.parser.parse(content, p);
      if (parsed.errors.length > 0) {
        console.warn(`[crg] parser backend ${this.parser.backendId} diagnostics for ${p}: ${parsed.errors.map((e) => e.message).join('; ')}`);
      }
      return { filePath: p, parsed };
    }));
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const files = parsed as ParsedTsFile[];
    const candidates: CandidateRecord[] = [];

    for (const file of files) {
      for (const symbol of file.parsed.symbols) {
        const candidate = this.symbolToCandidate(symbol, file.filePath, context);
        if (nodeTypeRegistry.has(candidate.candidate_type)) candidates.push(candidate);
      }

      for (const imp of file.parsed.imports) {
        const candidate = this.importToCandidate(imp, file.filePath, context);
        if (nodeTypeRegistry.has(candidate.candidate_type)) candidates.push(candidate);
      }
    }

    return candidates;
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
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
      lang_meta: { kind: 'import', module: imp.module, symbols: imp.symbols ?? [] },
    };
  }

  private symbolToCandidate(symbol: ParsedSymbol, filePath: string, context: AdapterContext): CandidateRecord {
    const type = this.resolveNodeType(symbol);
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
      annotations: symbol.annotations,
      lang_meta: { kind: symbol.kind, parserBackend: this.parser.backendId, isPublic: symbol.isPublic },
    };
  }

  private resolveNodeType(symbol: ParsedSymbol): string {
    if (/^use[A-Z]/.test(symbol.name)) return 'ts_hook';
    if (symbol.annotations.includes('jsx_component')) return 'ts_component';
    return 'ts_function';
  }
}
