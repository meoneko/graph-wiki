import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Language, Parser, type Node, type Tree } from 'web-tree-sitter';

let parserInitPromise: Promise<void> | undefined;

function ensureParserInit(): Promise<void> {
  parserInitPromise ??= Parser.init();
  return parserInitPromise;
}

export function resolveGrammarWasm(wasmFile: string): string {
  const distPath = fileURLToPath(new URL(`../grammars/${wasmFile}`, import.meta.url));
  if (existsSync(distPath)) return distPath;

  const nodeModulesPath = fileURLToPath(
    new URL(`../../../node_modules/@vscode/tree-sitter-wasm/wasm/${wasmFile}`, import.meta.url),
  );
  if (existsSync(nodeModulesPath)) return nodeModulesPath;

  throw new Error(
    `Grammar WASM not found: ${wasmFile}. Run 'npm install' to ensure @vscode/tree-sitter-wasm is present.`,
  );
}

export class WebTreeSitterWrapper {
  private constructor(
    readonly backendId: string,
    private readonly parser: Parser,
  ) {}

  static async create(options: { backendId: string; wasmFile: string }): Promise<WebTreeSitterWrapper> {
    await ensureParserInit();
    const wasmPath = resolveGrammarWasm(options.wasmFile);
    const language = await Language.load(wasmPath).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load grammar '${options.wasmFile}' from '${wasmPath}': ${message}`);
    });
    const parser = new Parser();
    parser.setLanguage(language);
    return new WebTreeSitterWrapper(options.backendId, parser);
  }

  parse(code: string): Tree {
    const tree = this.parser.parse(code);
    if (!tree) throw new Error(`Parser backend ${this.backendId} returned no tree`);
    return tree;
  }

  walkNodes(root: Node, nodeType: string): Node[] {
    const out: Node[] = [];
    const stack: Node[] = [root];
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

  getText(node: Node, source: string): string {
    return source.slice(node.startIndex, node.endIndex);
  }

  lineOf(node: Node): number {
    return node.startPosition.row + 1;
  }
}

export type { Node, Tree };
