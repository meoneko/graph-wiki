import type Parser from 'web-tree-sitter';
import { resolveWasmPath, TreeSitterWrapper } from '../../core/TreeSitterWrapper.js';
import {
  DEFAULT_PARSE_BUDGET,
  type CalledSymbol,
  type ILanguageParser,
  type ImportDecl,
  type ParseBudget,
  type ParseFallbackContext,
  type ParseMetrics,
  type ParsedFile,
  type ParsedSymbol,
} from '../../core/ILanguageParser.js';
import { CSHARP_BUILTIN_SYMBOLS } from './builtins.js';

function text(node: Parser.SyntaxNode, source: string): string {
  return source.slice(node.startIndex, node.endIndex);
}

export class CSharpParser implements ILanguageParser {
  readonly language = 'csharp';
  readonly fileExtensions = ['.cs'];

  private wrapper: TreeSitterWrapper | null = null;
  private initPromise: Promise<void> | null = null;

  async ensureReady(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = TreeSitterWrapper.create(
        resolveWasmPath('tree-sitter-c_sharp.wasm'),
      ).then((wrapper) => {
        this.wrapper = wrapper;
      });
    }
    return this.initPromise;
  }

  private getWrapper(): TreeSitterWrapper {
    if (!this.wrapper) {
      throw new Error('CSharpParser: parser not initialized. Call ensureReady() before parse.');
    }
    return this.wrapper;
  }

  parse(sourceCode: string, filePath: string): ParsedFile {
    return this.parseWithContext(sourceCode, filePath, { budget: DEFAULT_PARSE_BUDGET });
  }

  parseWithContext(sourceCode: string, filePath: string, context: ParseFallbackContext): ParsedFile {
    let tree: Parser.Tree;
    try {
      tree = this.getWrapper().parse(sourceCode);
    } catch (error) {
      const fallback = this.parseFallback(sourceCode, filePath, context);
      return {
        ...fallback,
        errors: [{ message: `Parser exception: ${error instanceof Error ? error.message : String(error)}` }],
        metrics: this.createMetrics(sourceCode, fallback.symbols, {
          budget: context.budget,
          totalNodeCount: 0,
          errorNodeCount: 1,
          reasonCodes: [...(fallback.metrics?.reasonCodes ?? []), 'PARSER_ERROR_THRESHOLD_EXCEEDED', 'FALLBACK_PARSER_USED'],
        }),
      };
    }
    const root = tree.rootNode;
    const totalNodeCount = this.countNodes(root);
    const errorNodeCount = this.countErrorNodes(root);
    const treeSitterSymbols: ParsedSymbol[] = [
      ...this.extractTopLevelStatements(root, sourceCode),
      ...this.extractMethods(root, sourceCode),
      ...this.extractMinimalApiRoutes(root, sourceCode),
      ...this.extractUseCases(root, sourceCode),
      ...this.extractDTOs(root, sourceCode),
      ...this.extractPartialClasses(root, sourceCode),
      ...this.extractClasses(root, sourceCode),
    ];
    const shouldFallback = this.shouldUseFallback({
      totalNodeCount,
      errorNodeCount,
      symbolCount: treeSitterSymbols.length,
      sizeBytes: Buffer.byteLength(sourceCode),
    });

    if (shouldFallback) {
      const errorRatio = totalNodeCount > 0 ? errorNodeCount / totalNodeCount : 0;
      const fallbackReasonCodes = errorRatio > 0.10 ? ['PARSER_ERROR_THRESHOLD_EXCEEDED'] : [];
      const fallback = this.parseFallback(sourceCode, filePath, {
        budget: context.budget,
        snapshot: context.snapshot,
      });
      const mergedSymbols = this.mergeSymbols(treeSitterSymbols, fallback.symbols);
      return {
        ...fallback,
        symbols: mergedSymbols,
        imports: fallback.imports.length > 0 ? fallback.imports : this.extractUsings(root, sourceCode),
        errors: this.nodeHasError(root) ? [{ message: 'Parse error threshold exceeded', node: root }, ...fallback.errors] : fallback.errors,
        metrics: this.createMetrics(sourceCode, mergedSymbols, {
          budget: context.budget,
          totalNodeCount,
          errorNodeCount,
          reasonCodes: [...(fallback.metrics?.reasonCodes ?? []), ...fallbackReasonCodes, 'FALLBACK_PARSER_USED'],
        }),
        parseMode: 'fallback',
      };
    }

    const reasonCodes: string[] = [];
    const symbols = this.applyBudget(treeSitterSymbols, context.budget, reasonCodes);
    return {
      filePath,
      symbols,
      imports: this.extractUsings(root, sourceCode),
      errors: this.nodeHasError(root) ? [{ message: 'Parse error', node: root }] : [],
      parseMode: this.nodeHasError(root) ? 'partial' : 'full',
      metrics: this.createMetrics(sourceCode, symbols, {
        budget: context.budget,
        totalNodeCount,
        errorNodeCount,
        reasonCodes,
      }),
    };
  }

  parseFallback(sourceCode: string, filePath: string, context: ParseFallbackContext): ParsedFile {
    const reasonCodes = ['FALLBACK_PARSER_USED'];
    const symbols = this.applyBudget(
      [...this.extractLegacyTypes(sourceCode), ...this.extractLegacyMethods(sourceCode)],
      context.budget,
      reasonCodes,
    );
    return {
      filePath,
      symbols,
      imports: this.extractLegacyUsings(sourceCode),
      errors: [],
      parseMode: 'fallback',
      metrics: this.createMetrics(sourceCode, symbols, {
        budget: context.budget,
        totalNodeCount: undefined,
        errorNodeCount: 0,
        reasonCodes,
      }),
    };
  }

  private shouldUseFallback(input: {
    totalNodeCount: number;
    errorNodeCount: number;
    symbolCount: number;
    sizeBytes: number;
  }): boolean {
    const errorRatio = input.totalNodeCount > 0 ? input.errorNodeCount / input.totalNodeCount : 0;
    return errorRatio > 0.10 || (input.symbolCount === 0 && input.sizeBytes > 200);
  }

  private nodeHasError(node: Parser.SyntaxNode): boolean {
    const hasError = node.hasError as unknown;
    return typeof hasError === 'function' ? Boolean(hasError.call(node)) : Boolean(hasError);
  }

  private nodeIsMissing(node: Parser.SyntaxNode): boolean {
    const isMissing = node.isMissing as unknown;
    return typeof isMissing === 'function' ? Boolean(isMissing.call(node)) : Boolean(isMissing);
  }

  private countNodes(root: Parser.SyntaxNode): number {
    let count = 0;
    const stack: Parser.SyntaxNode[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      count++;
      for (let i = node.namedChildCount - 1; i >= 0; i--) {
        const child = node.namedChild(i);
        if (child) stack.push(child);
      }
    }
    return count;
  }

  private countErrorNodes(root: Parser.SyntaxNode): number {
    let count = 0;
    const stack: Parser.SyntaxNode[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.type === 'ERROR' || this.nodeIsMissing(node)) count++;
      for (let i = node.namedChildCount - 1; i >= 0; i--) {
        const child = node.namedChild(i);
        if (child) stack.push(child);
      }
    }
    return count;
  }

  private applyBudget(symbols: ParsedSymbol[], budget: ParseBudget, reasonCodes: string[]): ParsedSymbol[] {
    let output = symbols;
    if (output.length > budget.maxSymbolsPerFile) {
      output = output.slice(0, budget.maxSymbolsPerFile);
      reasonCodes.push('SYMBOL_LIMIT_REACHED');
    }

    let remainingCallRefs = budget.maxCallRefsPerFile;
    output = output.map((symbol) => {
      let body = symbol.body;
      if (body && body.length > budget.maxExcerptChars) {
        body = body.slice(0, budget.maxExcerptChars);
        reasonCodes.push('EXCERPT_TRUNCATED');
      }

      const calledSymbols = symbol.calledSymbols.length > remainingCallRefs
        ? symbol.calledSymbols.slice(0, Math.max(remainingCallRefs, 0))
        : symbol.calledSymbols;
      if (calledSymbols.length < symbol.calledSymbols.length) {
        reasonCodes.push('CALL_REF_LIMIT_REACHED');
      }
      remainingCallRefs -= calledSymbols.length;
      return { ...symbol, body, calledSymbols };
    });

    return output;
  }

  private createMetrics(
    sourceCode: string,
    symbols: ParsedSymbol[],
    opts: {
      budget: ParseBudget;
      totalNodeCount?: number;
      errorNodeCount: number;
      reasonCodes: string[];
    },
  ): ParseMetrics {
    const reasonCodes = [...new Set(opts.reasonCodes)];
    if (Buffer.byteLength(sourceCode) > opts.budget.maxFileSizeBytesForFullParse) {
      reasonCodes.push('FILE_SIZE_BUDGET_EXCEEDED');
    }
    return {
      sizeBytes: Buffer.byteLength(sourceCode),
      lineCount: sourceCode.length === 0 ? 0 : sourceCode.split(/\r?\n/).length,
      symbolCount: symbols.length,
      callRefCount: symbols.reduce((count, symbol) => count + symbol.calledSymbols.length, 0),
      totalNodeCount: opts.totalNodeCount,
      errorNodeCount: opts.errorNodeCount,
      truncated: reasonCodes.some((code) => code.endsWith('_LIMIT_REACHED') || code === 'EXCERPT_TRUNCATED'),
      reasonCodes,
    };
  }

  // ── Qualified name resolution ────────────────────────────────────────────

  private resolveQualifiedInfo(
    node: Parser.SyntaxNode,
    leafName: string,
    source: string,
  ): { qualifiedName: string; containingClass?: string; namespace?: string } {
    const parts: string[] = [leafName];
    let containingClass: string | undefined;
    let namespace: string | undefined;
    const classParts: string[] = [];
    let cur: Parser.SyntaxNode | null = node.parent;

    while (cur) {
      if (
        cur.type === 'class_declaration' ||
        cur.type === 'struct_declaration' ||
        cur.type === 'record_declaration'
      ) {
        const nameNode = cur.childForFieldName('name');
        if (nameNode) {
          const className = text(nameNode, source);
          classParts.unshift(className);
          parts.unshift(className);
        }
      } else if (
        cur.type === 'namespace_declaration' ||
        cur.type === 'file_scoped_namespace_declaration'
      ) {
        const nameNode = cur.childForFieldName('name');
        if (nameNode) {
          const ns = text(nameNode, source);
          if (!namespace) namespace = ns;
          parts.unshift(ns);
        }
      }
      cur = cur.parent;
    }

    containingClass = classParts.join('.') || undefined;
    return { qualifiedName: parts.join('.'), containingClass, namespace };
  }

  // ── Annotation extraction (correct: only preceding sibling attribute_list) ─

  private getMethodAnnotations(methodNode: Parser.SyntaxNode, source: string): string[] {
    const annotations: string[] = [];
    let sibling = methodNode.previousNamedSibling;
    while (sibling !== null && sibling.type === 'attribute_list') {
      const attrs = this.collectByType(sibling, 'attribute').map((a) => text(a, source));
      annotations.unshift(...attrs);
      sibling = sibling.previousNamedSibling;
    }
    return annotations;
  }

  // ── Extractors ───────────────────────────────────────────────────────────

  private extractTopLevelStatements(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    const globalStmts = root.namedChildren.filter((n) => n.type === 'global_statement');
    if (globalStmts.length === 0) return [];

    const first = globalStmts[0]!;
    const last = globalStmts[globalStmts.length - 1]!;
    const calledSymbols = globalStmts.flatMap((s) => this.extractCalledSymbols(s, source));

    return [{
      name: 'Program',
      qualifiedName: 'Program',
      kind: 'top_level_statement',
      startLine: first.startPosition.row + 1,
      endLine: last.endPosition.row + 1,
      body: globalStmts.map((s) => text(s, source)).join('\n'),
      calledSymbols,
      annotations: [],
      isPublic: true,
      isStatic: false,
      isEntrypoint: true,
    }];
  }

  private extractMethods(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    return this.collectByType(root, 'method_declaration')
      .map((m) => this.toMethodSymbol(m, source))
      .filter((s): s is ParsedSymbol => s !== undefined);
  }
  private extractMinimalApiRoutes(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    for (const inv of this.collectByType(root, 'invocation_expression')) {
      const call = text(inv, source);
      const m = call.match(/Map(Get|Post|Put|Delete|Patch)\s*\(\s*"([^"]+)"/i);
      if (!m) continue;
      const method = m[1] ?? 'GET';
      const route = m[2] ?? '/';
      out.push({
        name: `Map${method}:${route}`,
        qualifiedName: `MinimalApi.Map${method}:${route}`,
        kind: 'method',
        startLine: inv.startPosition.row + 1,
        endLine: inv.endPosition.row + 1,
        body: call,
        calledSymbols: this.extractCalledSymbols(inv, source),
        annotations: [`Http${method}`],
        isPublic: true,
        isStatic: false,
        isEntrypoint: true,
      });
    }
    return out;
  }

  private extractUseCases(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    for (const c of this.collectByType(root, 'class_declaration')) {
      const nameNode = c.childForFieldName('name');
      const className = nameNode ? text(nameNode, source) : '';
      if (!/(UseCase|Handler)$/i.test(className)) continue;
      const { qualifiedName, containingClass, namespace } = this.resolveQualifiedInfo(c, className, source);
      out.push({
        name: className,
        qualifiedName,
        kind: 'class',
        startLine: c.startPosition.row + 1,
        endLine: c.endPosition.row + 1,
        body: text(c, source),
        calledSymbols: this.extractCalledSymbols(c, source),
        annotations: [],
        isPublic: true,
        isStatic: false,
        isEntrypoint: false,
        containingClass,
        namespace,
      });
    }
    return out;
  }

  private extractDTOs(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    const nodes = [
      ...this.collectByType(root, 'record_declaration'),
      ...this.collectByType(root, 'class_declaration'),
    ];
    for (const n of nodes) {
      const nameNode = n.childForFieldName('name');
      const name = nameNode ? text(nameNode, source) : '';
      if (!/(Dto|Request|Response|Command|Query)$/i.test(name)) continue;
      const { qualifiedName, containingClass, namespace } = this.resolveQualifiedInfo(n, name, source);
      out.push({
        name,
        qualifiedName,
        kind: 'class',
        startLine: n.startPosition.row + 1,
        endLine: n.endPosition.row + 1,
        body: text(n, source),
        calledSymbols: [],
        annotations: [],
        isPublic: true,
        isStatic: false,
        isEntrypoint: false,
        containingClass,
        namespace,
      });
    }
    return out;
  }

  private extractExtensionMethods(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    for (const m of this.collectByType(root, 'method_declaration')) {
      const body = text(m, source);
      if (!/\bstatic\b/.test(body)) continue;
      const paramList = m.childForFieldName('parameters');
      if (!paramList) continue;
      const firstParam = paramList.namedChildren[0];
      if (!firstParam) continue;
      if (!text(firstParam, source).trimStart().startsWith('this ')) continue;

      const nameNode = m.childForFieldName('name');
      if (!nameNode) continue;
      const methodName = text(nameNode, source);
      const { qualifiedName, containingClass, namespace } = this.resolveQualifiedInfo(m, methodName, source);

      out.push({
        name: methodName,
        qualifiedName,
        kind: 'method',
        startLine: m.startPosition.row + 1,
        endLine: m.endPosition.row + 1,
        body,
        calledSymbols: this.extractCalledSymbols(m, source),
        annotations: this.getMethodAnnotations(m, source),
        isPublic: /\bpublic\b/.test(body),
        isStatic: true,
        isEntrypoint: false,
        containingClass,
        namespace,
      });
    }
    return out;
  }

  private extractPartialClasses(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    for (const c of this.collectByType(root, 'class_declaration')) {
      const modifiers = this.collectByType(c, 'modifier').map((m) => text(m, source));
      if (!modifiers.includes('partial')) continue;
      const nameNode = c.childForFieldName('name');
      const name = nameNode ? text(nameNode, source) : 'UnknownClass';
      const { qualifiedName, containingClass, namespace } = this.resolveQualifiedInfo(c, name, source);
      out.push({
        name,
        qualifiedName,
        kind: 'class',
        startLine: c.startPosition.row + 1,
        endLine: c.endPosition.row + 1,
        body: text(c, source),
        calledSymbols: this.extractCalledSymbols(c, source),
        annotations: [],
        isPublic: modifiers.includes('public'),
        isStatic: modifiers.includes('static'),
        isEntrypoint: false,
        isPartial: true,
        containingClass,
        namespace,
      });
    }
    return out;
  }

  private extractClasses(root: Parser.SyntaxNode, source: string): ParsedSymbol[] {
    return this.collectByType(root, 'class_declaration')
      .filter((c) => {
        // Skip classes already handled by more specific extractors
        const nameNode = c.childForFieldName('name');
        const name = nameNode ? text(nameNode, source) : '';
        const modifiers = this.collectByType(c, 'modifier').map((m) => text(m, source));
        const isPartial = modifiers.includes('partial');
        const isUseCase = /(UseCase|Handler)$/i.test(name);
        const isDto = /(Dto|Request|Response|Command|Query)$/i.test(name);
        return !isPartial && !isUseCase && !isDto;
      })
      .map((c) => {
        const nameNode = c.childForFieldName('name');
        const name = nameNode ? text(nameNode, source) : 'UnknownClass';
        const { qualifiedName, containingClass, namespace } = this.resolveQualifiedInfo(c, name, source);
        const modifiers = this.collectByType(c, 'modifier').map((m) => text(m, source));
        return {
          name,
          qualifiedName,
          kind: 'class' as const,
          startLine: c.startPosition.row + 1,
          endLine: c.endPosition.row + 1,
          body: text(c, source),
          calledSymbols: this.extractCalledSymbols(c, source),
          annotations: [],
          isPublic: modifiers.includes('public'),
          isStatic: modifiers.includes('static'),
          isEntrypoint: false,
          containingClass,
          namespace,
        };
      });
  }

  private extractUsings(root: Parser.SyntaxNode, source: string): ImportDecl[] {
    return this.collectByType(root, 'using_directive').map((u) => ({
      module: text(u, source).replace(/^using\s+/, '').replace(/;$/, '').trim(),
    }));
  }

  // ── Symbol helpers ───────────────────────────────────────────────────────

  private toMethodSymbol(node: Parser.SyntaxNode, source: string): ParsedSymbol | undefined {
    const nameNode = node.childForFieldName('name');
    if (!nameNode) return undefined;
    const methodName = text(nameNode, source);
    const body = text(node, source);
    const annotations = this.getMethodAnnotations(node, source);
    const { qualifiedName, containingClass, namespace } = this.resolveQualifiedInfo(node, methodName, source);

    return {
      name: methodName,
      qualifiedName,
      kind: 'method',
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      body,
      calledSymbols: this.extractCalledSymbols(node, source),
      annotations,
      isPublic: /\bpublic\b/.test(body),
      isStatic: /\bstatic\b/.test(body),
      isEntrypoint: annotations.some((a) => /Http(Get|Post|Put|Delete|Patch)/i.test(a)),
      containingClass,
      namespace,
    };
  }

  private extractCalledSymbols(node: Parser.SyntaxNode, source: string): CalledSymbol[] {
    const out: CalledSymbol[] = [];
    const seen = new Set<string>();
    const receiverTypes = this.extractReceiverTypes(node, source);
    for (const inv of this.collectByType(node, 'invocation_expression')) {
      const raw = text(inv, source);
      const matches = [...raw.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>]+>)?\s*\(/g)];
      const name = matches.at(-1)?.[1];
      if (!name || CSHARP_BUILTIN_SYMBOLS.has(name) || seen.has(name)) continue;
      seen.add(name);
      const receiverMatch = raw.match(new RegExp(`([A-Za-z_][A-Za-z0-9_\\.<>]*)\\s*\\.\\s*${name}\\s*(?:<[^>]+>)?\\s*\\(`));
      const receiver = receiverMatch?.[1];
      out.push({
        name,
        qualifiedName: name,
        receiver,
        receiverType: receiver ? receiverTypes.get(receiver) : undefined,
        callSite: { line: inv.startPosition.row + 1, column: inv.startPosition.column },
      });
    }
    return out;
  }

  private extractCalledSymbolsFromText(body: string, baseLine: number): CalledSymbol[] {
    const out: CalledSymbol[] = [];
    const seen = new Set<string>();
    const receiverTypes = this.extractReceiverTypesFromText(body);
    const invocations = [...body.matchAll(/(?:([A-Za-z_][A-Za-z0-9_\.<>]*)\s*\.\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>]+>)?\s*\(/g)];
    for (const match of invocations) {
      const receiver = match[1];
      const name = match[2];
      if (!name || CSHARP_BUILTIN_SYMBOLS.has(name) || seen.has(`${receiver ?? ''}.${name}`)) continue;
      if (['if', 'for', 'foreach', 'while', 'switch', 'catch', 'using', 'lock', 'return', 'new'].includes(name)) continue;
      seen.add(`${receiver ?? ''}.${name}`);
      const before = body.slice(0, match.index ?? 0);
      const line = baseLine + before.split(/\r?\n/).length - 1;
      const lastBreak = Math.max(before.lastIndexOf('\n'), before.lastIndexOf('\r'));
      out.push({
        name,
        qualifiedName: name,
        receiver,
        receiverType: receiver ? receiverTypes.get(receiver) : undefined,
        callSite: { line, column: (match.index ?? 0) - lastBreak - 1 },
      });
    }
    return out;
  }

  private extractReceiverTypes(node: Parser.SyntaxNode, source: string): Map<string, string> {
    return this.extractReceiverTypesFromText(text(node, source));
  }

  private extractReceiverTypesFromText(body: string): Map<string, string> {
    const receiverTypes = new Map<string, string>();

    // Common C# local declarations:
    //   Processing oNetProcess = new Processing();
    //   var oNetProcess = new Processing();
    // This deliberately stays conservative; incorrect receiver types create bad edges.
    const explicitDecl = /\b([A-Z_][A-Za-z0-9_\.<>]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*new\s+([A-Z_][A-Za-z0-9_\.<>]*)\s*\(/g;
    for (const match of body.matchAll(explicitDecl)) {
      const declaredType = match[1];
      const variable = match[2];
      const constructedType = match[3];
      if (!variable) continue;
      receiverTypes.set(variable, constructedType ?? declaredType ?? '');
    }

    const varDecl = /\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*new\s+([A-Z_][A-Za-z0-9_\.<>]*)\s*\(/g;
    for (const match of body.matchAll(varDecl)) {
      const variable = match[1];
      const constructedType = match[2];
      if (variable && constructedType) receiverTypes.set(variable, constructedType);
    }

    return receiverTypes;
  }

  private extractLegacyMethods(source: string): ParsedSymbol[] {
    const scopes = this.buildLegacyScopes(source);
    const methods: ParsedSymbol[] = [];
    const methodPattern = /\b(?:(?:public|private|protected|internal|static|virtual|override|async|sealed|new|partial)\s+)+[A-Za-z_][A-Za-z0-9_<>\[\]\.,\?\s]*\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^;{}]*\)\s*(?:where\s+[^{]+)?\{/g;
    const ignored = new Set(['if', 'for', 'foreach', 'while', 'switch', 'catch', 'using', 'lock']);
    const matches = [...source.matchAll(methodPattern)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]!;
      const name = match[1];
      if (!name || ignored.has(name)) continue;
      const openBrace = source.indexOf('{', (match.index ?? 0) + match[0].length - 1);
      if (openBrace < 0) continue;
      const matchedCloseBrace = this.findMatchingBrace(source, openBrace);
      const nextMethodIndex = matches[i + 1]?.index;
      const closeBrace = matchedCloseBrace > openBrace
        ? matchedCloseBrace
        : (nextMethodIndex !== undefined ? nextMethodIndex - 1 : source.length - 1);

      const indentScope = this.resolveIndentScope(source, match.index ?? 0);
      const activeScopes = scopes.filter((scope) => scope.start < (match.index ?? 0) && scope.end > closeBrace);
      const namespace = indentScope.namespace ?? activeScopes.filter((scope) => scope.kind === 'namespace').at(-1)?.name;
      const classes = indentScope.classes.length > 0
        ? indentScope.classes
        : activeScopes.filter((scope) => scope.kind === 'class').map((scope) => scope.name);
      const containingClass = classes.at(-1);
      const qualifiedName = [...(namespace ? [namespace] : []), ...classes, name].join('.') || name;
      const startLine = this.lineFromIndex(source, match.index ?? 0);
      const endLine = this.lineFromIndex(source, closeBrace);
      const body = source.slice(match.index ?? 0, closeBrace + 1);

      methods.push({
        name,
        qualifiedName,
        kind: 'method',
        startLine,
        endLine,
        body,
        calledSymbols: this.extractCalledSymbolsFromText(body, startLine),
        annotations: [],
        isPublic: /\bpublic\b/.test(match[0]),
        isStatic: /\bstatic\b/.test(match[0]),
        isEntrypoint: false,
        namespace,
        containingClass,
        isPartial: classes.length > 0,
      });
    }
    return methods;
  }

  private extractLegacyTypes(source: string): ParsedSymbol[] {
    const symbols: ParsedSymbol[] = [];
    const typePattern = /\b(?:(?:public|private|protected|internal|static|sealed|abstract|partial)\s+)*(class|interface)\s+([A-Za-z_][A-Za-z0-9_]*)[^{;]*\{/g;
    for (const match of source.matchAll(typePattern)) {
      const kind = match[1] === 'interface' ? 'interface' : 'class';
      const name = match[2];
      if (!name) continue;
      const openBrace = source.indexOf('{', (match.index ?? 0) + match[0].length - 1);
      const closeBrace = openBrace >= 0 ? this.findMatchingBrace(source, openBrace) : -1;
      const indentScope = this.resolveIndentScope(source, match.index ?? 0);
      const namespace = indentScope.namespace;
      const qualifiedName = [...(namespace ? [namespace] : []), name].join('.') || name;
      symbols.push({
        name,
        qualifiedName,
        kind,
        startLine: this.lineFromIndex(source, match.index ?? 0),
        endLine: closeBrace > openBrace ? this.lineFromIndex(source, closeBrace) : this.lineFromIndex(source, match.index ?? 0),
        body: closeBrace > openBrace ? source.slice(match.index ?? 0, closeBrace + 1) : match[0],
        calledSymbols: [],
        annotations: [],
        isPublic: /\bpublic\b/.test(match[0]),
        isStatic: /\bstatic\b/.test(match[0]),
        isEntrypoint: false,
        isPartial: /\bpartial\b/.test(match[0]),
        namespace,
      });
    }
    return symbols;
  }

  private extractLegacyUsings(source: string): ImportDecl[] {
    return [...source.matchAll(/^\s*using\s+([^;]+);/gm)].map((match) => ({
      module: (match[1] ?? '').trim(),
    })).filter((decl) => decl.module.length > 0);
  }

  private buildLegacyScopes(source: string): Array<{ kind: 'namespace' | 'class'; name: string; start: number; end: number }> {
    const scopes: Array<{ kind: 'namespace' | 'class'; name: string; start: number; end: number }> = [];
    const scopePattern = /\bnamespace\s+([A-Za-z_][A-Za-z0-9_.]*)\s*\{|\b(?:public|private|protected|internal|static|sealed|abstract|partial|\s)*class\s+([A-Za-z_][A-Za-z0-9_]*)[^{;]*\{/g;
    for (const match of source.matchAll(scopePattern)) {
      const kind = match[1] ? 'namespace' : 'class';
      const name = match[1] ?? match[2];
      if (!name) continue;
      const openBrace = source.indexOf('{', (match.index ?? 0) + match[0].length - 1);
      const end = this.findMatchingBrace(source, openBrace);
      if (openBrace >= 0 && end > openBrace) scopes.push({ kind, name, start: openBrace, end });
    }
    return scopes;
  }

  private resolveIndentScope(source: string, index: number): { namespace?: string; classes: string[] } {
    const before = source.slice(0, index);
    const lines = before.split(/\r?\n/);
    const methodLine = lines[lines.length - 1] ?? '';
    const methodIndent = methodLine.match(/^\s*/)?.[0].length ?? 0;
    let namespace: string | undefined;
    const classByIndent = new Map<number, string>();

    for (const line of lines) {
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      const ns = line.match(/^\s*namespace\s+([A-Za-z_][A-Za-z0-9_.]*)/);
      if (ns?.[1]) namespace = ns[1];
      const cls = line.match(/^\s*(?:public|private|protected|internal|static|sealed|abstract|partial|\s)*class\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
      if (cls?.[1] && indent < methodIndent) {
        for (const existingIndent of [...classByIndent.keys()]) {
          if (existingIndent >= indent) classByIndent.delete(existingIndent);
        }
        classByIndent.set(indent, cls[1]);
      }
    }

    return {
      namespace,
      classes: [...classByIndent.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, name]) => name),
    };
  }

  private findMatchingBrace(source: string, openBrace: number): number {
    let depth = 0;
    let quote: '"' | "'" | undefined;
    let verbatim = false;
    let lineComment = false;
    let blockComment = false;
    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];
      const next = source[i + 1];
      const prev = source[i - 1];
      if (lineComment) {
        if (ch === '\n' || ch === '\r') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (ch === '*' && next === '/') {
          blockComment = false;
          i++;
        }
        continue;
      }
      if (quote) {
        if (verbatim && ch === quote && next === quote) {
          i++;
          continue;
        }
        if (ch === quote && (verbatim || prev !== '\\')) {
          quote = undefined;
          verbatim = false;
        }
        continue;
      }
      if (ch === '/' && next === '/') {
        lineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        blockComment = true;
        i++;
        continue;
      }
      if (ch === '@' && next === '"') {
        quote = '"';
        verbatim = true;
        i++;
        continue;
      }
      if ((ch === '$' && next === '"') || (ch === '$' && next === '@' && source[i + 2] === '"')) {
        quote = '"';
        verbatim = next === '@';
        i += verbatim ? 2 : 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        verbatim = false;
        continue;
      }
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  private lineFromIndex(source: string, index: number): number {
    return source.slice(0, index).split(/\r?\n/).length;
  }

  private mergeSymbols(primary: ParsedSymbol[], fallback: ParsedSymbol[]): ParsedSymbol[] {
    const seen = new Set(primary.map((symbol) => `${symbol.qualifiedName}:${symbol.startLine}`));
    const merged = [...primary];
    for (const symbol of fallback) {
      const key = `${symbol.qualifiedName}:${symbol.startLine}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(symbol);
    }
    return merged;
  }

  private collectByType(root: Parser.SyntaxNode, type: string): Parser.SyntaxNode[] {
    const out: Parser.SyntaxNode[] = [];
    const stack: Parser.SyntaxNode[] = [root];
    while (stack.length > 0) {
      const n = stack.pop()!;
      if (n.type === type) out.push(n);
      for (let i = n.namedChildCount - 1; i >= 0; i--) {
        const child = n.namedChild(i);
        if (child) stack.push(child);
      }
    }
    return out;
  }
}

