
export type SymbolKind =
  | 'function' | 'method' | 'class' | 'interface'
  | 'constructor' | 'property' | 'field' | 'namespace'
  | 'module' | 'enum' | 'type_alias' | 'top_level_statement';

export interface CalledSymbol {
  name: string;
  qualifiedName?: string;
  callSite: { line: number; column: number };
}

export interface ParameterDef {
  name: string;
  type?: string;
}

export interface ImportDecl {
  module: string;
  symbols?: string[];
  startLine?: number;
  endLine?: number;
}

export interface ParseError {
  message: string;
  node?: unknown;
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
  readonly backendId: string;
  readonly language: string;
  readonly fileExtensions: string[];
  /** Diagnostics-only; trust is classified from extractor IDs. */
  readonly isAuthoritative: boolean;
  parse(sourceCode: string, filePath: string): Promise<ParsedFile>;
}
