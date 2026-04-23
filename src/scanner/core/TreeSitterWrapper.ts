import Parser from 'tree-sitter';

export class TreeSitterWrapper {
  private readonly parser: Parser;

  constructor(language: unknown) {
    this.parser = new Parser();
    this.parser.setLanguage(language as never);
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
