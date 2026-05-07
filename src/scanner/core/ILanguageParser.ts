import type Parser from 'web-tree-sitter';

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

export type ParseMode = 'full' | 'partial' | 'fallback' | 'skipped';

export interface SourceFileSnapshot {
  filePath: string;
  rawBuffer: Buffer;
  content: string;
  encoding: 'utf8' | 'utf16le' | 'utf16be' | 'unknown';
  hash: string;
  sizeBytes: number;
  lineCount: number;
}

export interface ParseBudget {
  maxFileSizeBytesForFullParse: number;
  maxSymbolsPerFile: number;
  maxCallRefsPerFile: number;
  maxExcerptChars: number;
}

export const DEFAULT_PARSE_BUDGET: ParseBudget = {
  maxFileSizeBytesForFullParse: 2_000_000,
  maxSymbolsPerFile: 20_000,
  maxCallRefsPerFile: 100_000,
  maxExcerptChars: 4_000,
};

export interface ParseMetrics {
  sizeBytes: number;
  lineCount: number;
  symbolCount: number;
  callRefCount: number;
  totalNodeCount?: number;
  errorNodeCount: number;
  truncated: boolean;
  reasonCodes: string[];
}

export interface ParseFallbackContext {
  budget: ParseBudget;
  snapshot?: SourceFileSnapshot;
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
  parseMode?: ParseMode;
  metrics?: ParseMetrics;
}

export interface AdapterParsedResult {
  paths?: string[];
  files: ParsedFile[];
}

export interface ILanguageParser {
  readonly language: string;
  readonly fileExtensions: string[];
  parse(sourceCode: string, filePath: string): ParsedFile;
  parseFallback?(sourceCode: string, filePath: string, context: ParseFallbackContext): ParsedFile;
}
