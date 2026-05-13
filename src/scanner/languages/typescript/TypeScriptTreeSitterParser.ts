import path from 'node:path';
import type { Node } from 'web-tree-sitter';
import type { CalledSymbol, ILanguageParser, ImportDecl, ParsedFile, ParsedSymbol, SymbolKind } from '../../core/ILanguageParser.js';
import { WebTreeSitterWrapper } from '../../core/WebTreeSitterWrapper.js';

const CALL_SCOPE_TYPES = new Set([
  'function_declaration',
  'arrow_function',
  'function_expression',
  'method_definition',
]);

const IGNORED_CALLS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'function',
  'require',
  'super',
]);

function text(node: Node, source: string): string {
  return source.slice(node.startIndex, node.endIndex);
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function isPascalCase(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function isIdentifierLike(node: Node): boolean {
  return node.type === 'identifier' || node.type === 'type_identifier' || node.type === 'property_identifier';
}

export class TypeScriptTreeSitterParser implements ILanguageParser {
  readonly backendId = 'ts_tree_sitter_parser';
  readonly language = 'typescript';
  readonly fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  readonly isAuthoritative = true;

  private readonly wrappers = new Map<string, Promise<WebTreeSitterWrapper>>();

  async parse(sourceCode: string, filePath: string): Promise<ParsedFile> {
    const wrapper = await this.wrapperFor(filePath);
    const tree = wrapper.parse(sourceCode);
    const root = tree.rootNode;
    const symbols = this.extractSymbols(root, sourceCode);

    this.applyNamedExports(root, sourceCode, symbols);

    return {
      filePath,
      symbols,
      imports: this.extractImports(root, sourceCode),
      errors: root.hasError ? [{ message: 'Parse error', node: root }] : [],
    };
  }

  private wrapperFor(filePath: string): Promise<WebTreeSitterWrapper> {
    const wasmFile = this.wasmFileFor(filePath);
    let wrapper = this.wrappers.get(wasmFile);
    if (!wrapper) {
      wrapper = WebTreeSitterWrapper.create({
        backendId: this.backendId,
        wasmFile,
      });
      this.wrappers.set(wasmFile, wrapper);
    }
    return wrapper;
  }

  private wasmFileFor(filePath: string): string {
    switch (path.extname(filePath).toLowerCase()) {
      case '.tsx':
        return 'tree-sitter-tsx.wasm';
      case '.js':
      case '.jsx':
        return 'tree-sitter-javascript.wasm';
      case '.ts':
        return 'tree-sitter-typescript.wasm';
      default:
        throw new Error(`Unsupported TypeScript parser extension for ${filePath}`);
    }
  }

  private extractSymbols(root: Node, source: string): ParsedSymbol[] {
    const symbols: ParsedSymbol[] = [];

    for (const node of this.walk(root)) {
      if (node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name') ?? this.firstIdentifier(node);
        if (nameNode) symbols.push(this.toSymbol(node, text(nameNode, source), 'function', source));
      } else if (node.type === 'class_declaration') {
        const nameNode = node.childForFieldName('name') ?? this.firstIdentifier(node);
        if (nameNode) symbols.push(this.toSymbol(node, text(nameNode, source), 'class', source));
      } else if (node.type === 'variable_declarator') {
        const valueNode = this.variableValue(node);
        const functionNode = valueNode ? this.functionLikeValue(valueNode) : undefined;
        if (!functionNode) continue;
        const nameNode = node.childForFieldName('name') ?? this.firstIdentifier(node);
        if (nameNode) symbols.push(this.toSymbol(node, text(nameNode, source), 'function', source, functionNode));
      } else if (node.type === 'export_statement') {
        const exportedCall = node.namedChildren.find((child) => child.type === 'call_expression');
        const functionNode = exportedCall ? this.functionLikeValue(exportedCall) : undefined;
        if (!functionNode) continue;
        const nameNode = functionNode.childForFieldName('name') ?? this.firstIdentifier(functionNode);
        const name = nameNode ? text(nameNode, source) : 'default';
        symbols.push(this.toSymbol(node, name, 'function', source, functionNode));
      } else if (node.type === 'object') {
        const route = this.routeFromObject(node, source);
        if (route) symbols.push(route);
      }
    }

    const seen = new Set<string>();
    return symbols.filter((symbol) => {
      const key = `${symbol.qualifiedName}:${symbol.startLine}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private toSymbol(node: Node, name: string, kind: SymbolKind, source: string, bodyNode = node): ParsedSymbol {
    const annotations = this.extractDecorators(node, source);
    const isComponent = isPascalCase(name) && this.containsJsx(bodyNode);
    if (isComponent) annotations.push('jsx_component');

    return {
      name,
      qualifiedName: name,
      kind,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      body: text(node, source),
      calledSymbols: this.extractCalledSymbols(bodyNode, source),
      annotations,
      isPublic: this.isExported(node),
      isStatic: false,
      isEntrypoint: isComponent,
    };
  }

  private routeFromObject(node: Node, source: string): ParsedSymbol | undefined {
    const pairs = node.namedChildren.filter((child) => child.type === 'pair');
    let pathNode: Node | undefined;
    let targetNode: Node | undefined;

    for (const pair of pairs) {
      const key = pair.childForFieldName('key');
      const value = pair.childForFieldName('value');
      if (!key || !value) continue;
      const keyText = text(key, source);
      if (keyText === 'path' && value.type === 'string') pathNode = value;
      if (keyText === 'element' || keyText === 'Component' || keyText === 'component') targetNode = value;
    }

    if (!pathNode || !targetNode) return undefined;
    const routePath = unquote(text(pathNode, source));
    const calledSymbols = this.routeTargets(targetNode, source).map((name) => ({
      name,
      qualifiedName: name,
      callSite: { line: targetNode!.startPosition.row + 1, column: targetNode!.startPosition.column + 1 },
    }));

    return {
      name: `Route:${routePath}`,
      qualifiedName: `Route:${routePath}`,
      kind: 'top_level_statement',
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      body: text(node, source),
      calledSymbols,
      annotations: ['ts_route'],
      isPublic: this.isExported(node),
      isStatic: false,
      isEntrypoint: true,
    };
  }

  private routeTargets(node: Node, source: string): string[] {
    if (node.type === 'identifier' || node.type === 'property_identifier') return [text(node, source)];
    if (node.type === 'jsx_element' || node.type === 'jsx_self_closing_element') {
      const nameNode = node.childForFieldName('name') ?? node.namedChildren.find(isIdentifierLike);
      return nameNode ? [text(nameNode, source)] : [];
    }
    return this.walk(node).filter(isIdentifierLike).map((child) => text(child, source));
  }

  private extractImports(root: Node, source: string): ImportDecl[] {
    const imports: ImportDecl[] = [];

    for (const node of this.walk(root)) {
      if (node.type === 'import_statement') {
        const moduleNode = this.findFirst(node, 'string');
        if (!moduleNode) continue;
        imports.push({
          module: unquote(text(moduleNode, source)),
          symbols: this.importedSymbols(node, source),
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
        });
      } else if (node.type === 'call_expression') {
        const functionNode = node.childForFieldName('function') ?? node.namedChildren[0];
        if (!functionNode || text(functionNode, source) !== 'require') continue;
        const stringNode = this.findFirst(node.childForFieldName('arguments') ?? node, 'string');
        if (!stringNode) continue;
        imports.push({
          module: unquote(text(stringNode, source)),
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
        });
      }
    }

    return imports;
  }

  private importedSymbols(importNode: Node, source: string): string[] {
    const moduleString = this.findFirst(importNode, 'string');
    const symbols: string[] = [];
    for (const node of this.walk(importNode)) {
      if (!isIdentifierLike(node)) continue;
      if (moduleString && node.startIndex >= moduleString.startIndex && node.endIndex <= moduleString.endIndex) continue;
      symbols.push(text(node, source));
    }
    return [...new Set(symbols)];
  }

  private applyNamedExports(root: Node, source: string, symbols: ParsedSymbol[]): void {
    const exportedNames = new Set<string>();

    for (const exportNode of this.walk(root).filter((node) => node.type === 'export_statement')) {
      if (exportNode.namedChildren.some((child) => child.type.endsWith('_declaration') || child.type === 'lexical_declaration')) continue;
      for (const identifier of this.walk(exportNode).filter(isIdentifierLike)) {
        exportedNames.add(text(identifier, source));
      }
    }

    for (const symbol of symbols) {
      if (exportedNames.has(symbol.name)) symbol.isPublic = true;
    }
  }

  private extractDecorators(node: Node, source: string): string[] {
    const decorators: string[] = [];
    const parent = node.parent;
    if (parent?.type === 'export_statement') {
      decorators.push(...parent.namedChildren.filter((child) => child.type === 'decorator').map((child) => text(child, source)));
    }

    if (parent?.type !== 'export_statement') {
      let sibling = node.previousNamedSibling;
      while (sibling?.type === 'decorator') {
        decorators.unshift(text(sibling, source));
        sibling = sibling.previousNamedSibling;
      }
    }

    return [...new Set(decorators)];
  }

  private extractCalledSymbols(scope: Node, source: string): CalledSymbol[] {
    const out: CalledSymbol[] = [];
    const seen = new Set<string>();
    const stack: Node[] = [scope];

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node !== scope && CALL_SCOPE_TYPES.has(node.type)) continue;

      if (node.type === 'call_expression') {
        const functionNode = node.childForFieldName('function') ?? node.namedChildren[0];
        const name = functionNode ? this.callName(functionNode, source) : undefined;
        if (name && !IGNORED_CALLS.has(name) && !seen.has(name)) {
          seen.add(name);
          out.push({
            name,
            qualifiedName: name,
            callSite: { line: node.startPosition.row + 1, column: node.startPosition.column + 1 },
          });
        }
      }

      for (let i = node.namedChildCount - 1; i >= 0; i--) {
        const child = node.namedChild(i);
        if (child) stack.push(child);
      }
    }

    return out;
  }

  private callName(functionNode: Node, source: string): string | undefined {
    if (isIdentifierLike(functionNode)) return text(functionNode, source);
    const identifiers = this.walk(functionNode).filter(isIdentifierLike);
    const last = identifiers.at(-1);
    return last ? text(last, source) : undefined;
  }

  private isExported(node: Node): boolean {
    let current: Node | null = node.parent;
    while (current) {
      if (current.type === 'export_statement') return true;
      if (current.type === 'program') return false;
      current = current.parent;
    }
    return false;
  }

  private containsJsx(node: Node): boolean {
    return this.walk(node).some((child) => child.type === 'jsx_element' || child.type === 'jsx_self_closing_element');
  }

  private variableValue(node: Node): Node | undefined {
    return node.childForFieldName('value') ?? node.namedChildren.find((child) =>
      child.type === 'arrow_function' ||
      child.type === 'function_expression' ||
      child.type === 'call_expression'
    );
  }

  private functionLikeValue(node: Node): Node | undefined {
    if (node.type === 'arrow_function' || node.type === 'function_expression') return node;
    if (node.type !== 'call_expression') return undefined;
    return this.walk(node).find((child) => child.type === 'arrow_function' || child.type === 'function_expression');
  }

  private firstIdentifier(node: Node): Node | undefined {
    return node.namedChildren.find(isIdentifierLike) ?? this.walk(node).find(isIdentifierLike);
  }

  private findFirst(node: Node, type: string): Node | undefined {
    return this.walk(node).find((child) => child.type === type);
  }

  private walk(root: Node): Node[] {
    const out: Node[] = [];
    const stack: Node[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      out.push(node);
      for (let i = node.namedChildCount - 1; i >= 0; i--) {
        const child = node.namedChild(i);
        if (child) stack.push(child);
      }
    }
    return out;
  }
}
