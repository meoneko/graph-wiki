import type { Node } from 'web-tree-sitter';
import { WebTreeSitterWrapper } from '../../core/WebTreeSitterWrapper.js';
import type { ILanguageParser, ImportDecl, ParsedFile, ParsedSymbol } from '../../core/ILanguageParser.js';

function text(node: Node, source: string): string {
  return source.slice(node.startIndex, node.endIndex);
}

/**
 * Maps Spring stereotype annotations to Java-specific node types.
 * Returns undefined for non-annotated classes (which should produce no symbols).
 */
function resolveKind(annotations: string[]): string | undefined {
  if (annotations.some((a) => /^@(Rest)?Controller$/.test(a))) return 'java_controller';
  if (annotations.some((a) => a === '@Service')) return 'java_service';
  if (annotations.some((a) => /^@Repository$/.test(a))) return 'java_repository';
  return undefined;
}

/**
 * Extracts the package name from the root AST node.
 * Looks for `package_declaration` → scoped_identifier or identifier.
 */
function extractPackage(root: Node, source: string): string | undefined {
  for (let i = 0; i < root.namedChildCount; i++) {
    const child = root.namedChild(i);
    if (child && child.type === 'package_declaration') {
      // The package name is typically in a scoped_identifier or identifier child
      for (let j = 0; j < child.namedChildCount; j++) {
        const nameNode = child.namedChild(j);
        if (nameNode && (nameNode.type === 'scoped_identifier' || nameNode.type === 'identifier')) {
          return text(nameNode, source);
        }
      }
    }
  }
  return undefined;
}

/**
 * Extracts annotation names from a class_declaration node.
 * In tree-sitter-java, annotations appear as `modifiers` children containing
 * `marker_annotation` or `annotation` nodes.
 */
function getAnnotations(classNode: Node, source: string): string[] {
  const annotations: string[] = [];

  for (let i = 0; i < classNode.namedChildCount; i++) {
    const child = classNode.namedChild(i);
    if (!child) continue;

    if (child.type === 'modifiers') {
      for (let j = 0; j < child.namedChildCount; j++) {
        const mod = child.namedChild(j);
        if (!mod) continue;
        if (mod.type === 'marker_annotation' || mod.type === 'annotation') {
          // Extract the annotation name (e.g., @RestController → @RestController)
          const nameNode = mod.childForFieldName('name');
          if (nameNode) {
            annotations.push(`@${text(nameNode, source)}`);
          }
        }
      }
    }
  }

  return annotations;
}

function collectByType(root: Node, type: string): Node[] {
  const out: Node[] = [];
  const stack: Node[] = [root];
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

/**
 * JavaParser — Extracts Spring-annotated classes from Java source files.
 *
 * Only classes annotated with @RestController, @Controller, @Service, or @Repository
 * produce symbols. Non-annotated classes are intentionally excluded.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8
 */
export class JavaParser implements ILanguageParser {
  readonly backendId = 'java_tree_sitter';
  readonly language = 'java';
  readonly fileExtensions = ['.java'];
  readonly isAuthoritative = true;

  private wrapperPromise: Promise<WebTreeSitterWrapper> | undefined;

  private getWrapper(): Promise<WebTreeSitterWrapper> {
    this.wrapperPromise ??= WebTreeSitterWrapper.create({
      backendId: this.backendId,
      wasmFile: 'tree-sitter-java.wasm',
    });
    return this.wrapperPromise;
  }

  async parse(sourceCode: string, filePath: string): Promise<ParsedFile> {
    const wrapper = await this.getWrapper();
    const tree = wrapper.parse(sourceCode);
    const root = tree.rootNode;

    const symbols = this.extractAnnotatedClasses(root, sourceCode);
    const imports = this.extractImports(root, sourceCode);

    return {
      filePath,
      symbols,
      imports,
      errors: root.hasError ? [{ message: 'Parse error', node: root }] : [],
    };
  }

  private extractAnnotatedClasses(root: Node, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    const packageName = extractPackage(root, source);

    for (const classNode of collectByType(root, 'class_declaration')) {
      const annotations = getAnnotations(classNode, source);
      const kind = resolveKind(annotations);
      if (!kind) continue; // Non-annotated classes produce no symbols

      const nameNode = classNode.childForFieldName('name');
      if (!nameNode) continue;
      const className = text(nameNode, source);

      out.push({
        name: className,
        qualifiedName: packageName ? `${packageName}.${className}` : className,
        kind: 'class',
        startLine: classNode.startPosition.row + 1,
        endLine: classNode.endPosition.row + 1,
        body: text(classNode, source),
        calledSymbols: [],
        annotations,
        isPublic: true,
        isStatic: false,
        isEntrypoint: kind === 'java_controller',
        namespace: packageName,
      });
    }

    return out;
  }

  private extractImports(root: Node, source: string): ImportDecl[] {
    const imports: ImportDecl[] = [];
    for (let i = 0; i < root.namedChildCount; i++) {
      const child = root.namedChild(i);
      if (child && child.type === 'import_declaration') {
        // Extract the full import path
        for (let j = 0; j < child.namedChildCount; j++) {
          const nameNode = child.namedChild(j);
          if (nameNode && (nameNode.type === 'scoped_identifier' || nameNode.type === 'identifier')) {
            imports.push({ module: text(nameNode, source) });
            break;
          }
        }
      }
    }
    return imports;
  }
}

/**
 * Resolves the Java-specific node type from annotations.
 * Exported for use by the JavaAdapter to determine candidate_type.
 */
export { resolveKind as resolveJavaNodeType };
