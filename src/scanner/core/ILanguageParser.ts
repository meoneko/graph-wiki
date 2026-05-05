import Parser from 'tree-sitter';

export type SymbolKind =
  | 'function' | 'method' | 'class' | 'interface'
  | 'constructor' | 'property' | 'field' | 'namespace'
  | 'module' | 'enum' | 'type_alias' | 'top_level_statement';

export interface CalledSymbol {
  name: string;
  qualifiedName?: string;
  callSite: { line: number; column: number };
  receiver?: string;
  receiverType?: string;
}

export interface ParameterDef {
  name: string;
  type?: string;
}

export interface ImportDecl {
  module: string;
  symbols?: string[];
}

export interface ParseError {
  message: string;
  node?: Parser.SyntaxNode;
}

export interface ParsedSymbol {
  name: string;
  qualifiedName: string;
  kind: SymbolKind;
  startLine: number;
  endLine: number;
  body?: string;
  calledSymbols: CalledSymbol[];
  parameters?: ParameterDef[];
  returnType?: string;
  annotations: string[];
  isPublic: boolean;
  isStatic: boolean;
  isEntrypoint: boolean;
  isPartial?: boolean;
  namespace?: string;
  containingClass?: string;
}

export interface ParsedFile {
  filePath: string;
  symbols: ParsedSymbol[];
  imports: ImportDecl[];
  errors: ParseError[];
}

export interface ILanguageParser {
  readonly language: string;
  readonly fileExtensions: string[];
  parse(sourceCode: string, filePath: string): ParsedFile;
}
