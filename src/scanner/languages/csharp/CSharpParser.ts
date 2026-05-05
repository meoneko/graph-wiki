import type Parser from 'tree-sitter';
import CSharpGrammar from 'tree-sitter-c-sharp';
import { TreeSitterWrapper } from '../../core/TreeSitterWrapper.js';
import type { ILanguageParser, ImportDecl, ParsedFile, ParsedSymbol, CalledSymbol } from '../../core/ILanguageParser.js';
import { CSHARP_BUILTIN_SYMBOLS } from './builtins.js';

function text(node: Parser.SyntaxNode, source: string): string {
  return source.slice(node.startIndex, node.endIndex);
}

export class CSharpParser implements ILanguageParser {
  readonly language = 'csharp';
  readonly fileExtensions = ['.cs'];

  private readonly wrapper = new TreeSitterWrapper(CSharpGrammar);

  parse(sourceCode: string, filePath: string): ParsedFile {
    const tree = this.wrapper.parse(sourceCode);
    const root = tree.rootNode;
    const symbols: ParsedSymbol[] = [
      ...this.extractTopLevelStatements(root, sourceCode),
      ...this.extractMethods(root, sourceCode),
      ...this.extractMinimalApiRoutes(root, sourceCode),
      ...this.extractUseCases(root, sourceCode),
      ...this.extractDTOs(root, sourceCode),
      ...this.extractPartialClasses(root, sourceCode),
      ...this.extractClasses(root, sourceCode),
    ];

    return {
      filePath,
      symbols,
      imports: this.extractUsings(root, sourceCode),
      errors: root.hasError ? [{ message: 'Parse error', node: root }] : [],
    };
  }

  // â”€â”€ Qualified name resolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private resolveQualifiedInfo(
    node: Parser.SyntaxNode,
    leafName: string,
    source: string,
  ): { qualifiedName: string; containingClass?: string; namespace?: string } {
    const parts: string[] = [leafName];
    let containingClass: string | undefined;
    let namespace: string | undefined;
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
          if (!containingClass) containingClass = className;
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

    return { qualifiedName: parts.join('.'), containingClass, namespace };
  }

  // â”€â”€ Annotation extraction (correct: only preceding sibling attribute_list) â”€

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

  // â”€â”€ Extractors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Symbol helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    for (const inv of this.collectByType(node, 'invocation_expression')) {
      const raw = text(inv, source);
      const matches = [...raw.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>]+>)?\s*\(/g)];
      const name = matches.at(-1)?.[1];
      if (!name || CSHARP_BUILTIN_SYMBOLS.has(name) || seen.has(name)) continue;
      seen.add(name);
      const receiverMatch = raw.match(new RegExp(`([A-Za-z_][A-Za-z0-9_\\.<>]*)\\s*\\.\\s*${name}\\s*(?:<[^>]+>)?\\s*\\(`));
      out.push({
        name,
        qualifiedName: name,
        receiver: receiverMatch?.[1],
        callSite: { line: inv.startPosition.row + 1, column: inv.startPosition.column },
      });
    }
    return out;
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
