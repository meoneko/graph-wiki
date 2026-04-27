import { createHash } from 'node:crypto';
import path from 'node:path';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import type { ParsedSymbol } from '../../scanner/core/ILanguageParser.js';
import { CSharpParser } from '../../scanner/languages/csharp/CSharpParser.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { readFile } from 'node:fs/promises';

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

export class CSharpAdapter implements IProjectAdapter {
  private readonly parser = new CSharpParser();

  async parse(paths: string[]): Promise<{ paths: string[]; files: Array<{ filePath: string; symbols: ParsedSymbol[] }> }> {
    const files = await Promise.all(paths.map(async (p) => {
      const source = await readFile(p, 'utf-8');
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
        if (nodeTypeRegistry.has(candidate.candidate_type)) out.push(candidate);
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

  async identify_entrypoints(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates.map((c) => ({ ...c, is_entrypoint: nodeTypeRegistry.isEntrypoint(c.candidate_type) }));
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
      lang_meta: {
        kind: symbol.kind,
        namespace: symbol.namespace,
        containingClass: symbol.containingClass,
        semantic_role: this.inferSemanticRole(symbol),
      },
    };
  }

  private resolveNodeType(symbol: ParsedSymbol): string {
    if (symbol.annotations.some((a) => /Http(Get|Post|Put|Delete|Patch)/i.test(a))) return 'csharp_controller_action';
    if (symbol.name.match(/^Map(Get|Post|Put|Delete|Patch):/)) return 'csharp_minimal_api';
    if (symbol.kind === 'interface') return 'csharp_interface';
    return 'csharp_class';
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
