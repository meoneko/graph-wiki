import type { AdapterContext, CandidateRecord } from '../../core/types.js';
import type { ParsedSymbol } from '../../scanner/core/ILanguageParser.js';
import { CSharpParser } from '../../scanner/languages/csharp/CSharpParser.js';
import {
  TreeSitterLanguageAdapter,
  type ParsedFileWithMeta,
} from './TreeSitterLanguageAdapter.js';

export class CSharpAdapter extends TreeSitterLanguageAdapter {
  private readonly csharpParser = new CSharpParser();

  override get language(): string {
    return 'csharp';
  }

  protected override get parser(): CSharpParser {
    return this.csharpParser;
  }

  protected override resolveNodeType(symbol: ParsedSymbol): CandidateRecord['candidate_type'] {
    if (symbol.kind === 'interface') return 'interface';
    if (symbol.kind === 'method' || symbol.kind === 'constructor') return 'method';
    if (symbol.kind === 'function' || symbol.kind === 'top_level_statement') return 'function';
    if (symbol.name.match(/(Dto|Request|Response|Command|Query)$/i)) return 'dto';
    if (symbol.kind === 'class') return 'class';
    return 'type';
  }

  protected override buildLangMeta(symbol: ParsedSymbol, file: ParsedFileWithMeta): Record<string, unknown> {
    return {
      ...super.buildLangMeta(symbol, file),
      declaringTypeFullName: this.declaringTypeFullName(symbol),
      isPartial: symbol.isPartial ?? false,
      semantic_role: this.inferSemanticRole(symbol),
    };
  }

  protected override symbolToCandidate(
    symbol: ParsedSymbol,
    file: ParsedFileWithMeta,
    context: AdapterContext,
  ): CandidateRecord {
    const base = super.symbolToCandidate(symbol, file, context);
    const declaringTypeFullName = this.declaringTypeFullName(symbol);
    return {
      ...base,
      http_method: this.extractHttpMethod(symbol),
      http_path: this.extractHttpPath(symbol),
      called_symbols: base.called_symbols?.map((call) => ({
        ...call,
        containingClass: declaringTypeFullName ?? symbol.containingClass,
      })),
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

