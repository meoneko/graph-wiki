import { createRequire } from 'node:module';
import path from 'node:path';
import Parser from 'web-tree-sitter';

let runtimeReady: Promise<void> | null = null;
const languageCache = new Map<string, Parser.Language>();

function ensureRuntime(): Promise<void> {
  if (!runtimeReady) runtimeReady = Parser.init();
  return runtimeReady;
}

async function loadLanguage(wasmPath: string): Promise<Parser.Language> {
  const cached = languageCache.get(wasmPath);
  if (cached) return cached;
  const language = await Parser.Language.load(wasmPath);
  languageCache.set(wasmPath, language);
  return language;
}

export function resolveWasmPath(grammarFilename: string): string {
  const require = createRequire(import.meta.url);
  const pkgJson = require.resolve('tree-sitter-wasms/package.json');
  return path.join(path.dirname(pkgJson), 'out', grammarFilename);
}

export class TreeSitterWrapper {
  private readonly parser: Parser;

  private constructor(parser: Parser) {
    this.parser = parser;
  }

  static async create(wasmPath: string): Promise<TreeSitterWrapper> {
    await ensureRuntime();
    const language = await loadLanguage(wasmPath);
    const parser = new Parser();
    parser.setLanguage(language);
    return new TreeSitterWrapper(parser);
  }

  parse(code: string): Parser.Tree {
    return this.parser.parse(code);
  }

  walkNodes(tree: Parser.Tree, nodeType: string): Parser.SyntaxNode[] {
    const out: Parser.SyntaxNode[] = [];
    const stack: Parser.SyntaxNode[] = [tree.rootNode];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.type === nodeType) out.push(node);
      for (let i = node.namedChildCount - 1; i >= 0; i--) {
        const child = node.namedChild(i);
        if (child) stack.push(child);
      }
    }
    return out;
  }

  getText(node: Parser.SyntaxNode, source: string): string {
    return source.slice(node.startIndex, node.endIndex);
  }

  lineOf(node: Parser.SyntaxNode): number {
    return node.startPosition.row + 1;
  }
}

