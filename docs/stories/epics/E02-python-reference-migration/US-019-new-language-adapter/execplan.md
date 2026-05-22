# Exec Plan

## Goal

Register Java node types, implement `JavaParser` using tree-sitter-java, wire into the
adapter registry, and write an adapter roadmap document.

## Scope

In scope:

- Register `java_controller`, `java_service`, `java_repository` in `nodeTypeRegistry.ts`
- `src/scanner/languages/java/JavaParser.ts`
- `src/pipeline/adapters/JavaAdapter.ts`
- Register `.java` → `JavaAdapter` in `src/pipeline/adapters/registry.ts`
- `docs/migration/adapter-roadmap.md`
- `knowledge.config.yaml.example` — add Java project example (commented out)
- `README.md` — add Java to supported languages

Out of scope:

- Java method extraction
- Import analysis / call graph
- Python, Go, Kotlin adapters

## Risk Classification

Risk flags:

- **Medium**: `tree-sitter-java` WASM availability. If the package doesn't ship a
  prebuilt WASM, native compilation is required (breaks cross-platform build). Verify
  before starting.
- **Low**: annotation detection — Java annotations are `@Name` tokens on `marker_annotation`
  or `normal_annotation` AST nodes. Tree-sitter grammar handles this reliably.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- A `.java` file with `@RestController` class must produce a `java_controller` candidate
  through the full pipeline (extract → normalize → validate)

## Work Phases

### Phase 1 — WASM dependency check

1. Check `node_modules/@vscode/tree-sitter-wasm/` for `tree-sitter-java.wasm`.
   If absent: `npm install tree-sitter-java` and locate the `.wasm` file in its package.
   Copy to the WASM assets directory used by `WebTreeSitterWrapper`.

### Phase 2 — Node type registration

2. Add to `src/core/nodeTypeRegistry.ts`:

```typescript
nodeTypeRegistry
  .register({ id: 'java_controller', category: 'handler', isCanonical: true,
    isEntrypoint: true, defaultExecutionRole: 'executable', languages: ['java'] })
  .register({ id: 'java_service', category: 'domain', isCanonical: true,
    isEntrypoint: false, defaultExecutionRole: 'structural_support', languages: ['java'] })
  .register({ id: 'java_repository', category: 'domain', isCanonical: true,
    isEntrypoint: false, defaultExecutionRole: 'structural_support', languages: ['java'] })
```

### Phase 3 — JavaParser

3. Create `src/scanner/languages/java/JavaParser.ts` implementing `ILanguageParser`:

```typescript
export class JavaParser implements ILanguageParser {
  readonly backendId = 'java_tree_sitter';
  readonly language = 'java';
  readonly fileExtensions = ['.java'];
  readonly isAuthoritative = true;

  async parse(sourceCode: string, filePath: string): Promise<ParsedFile> {
    const wrapper = await JavaTreeSitterWrapper.getInstance();
    const root = wrapper.parse(sourceCode).rootNode;
    const symbols = this.extractAnnotatedClasses(root, sourceCode);
    return { filePath, symbols, imports: [], errors: [] };
  }

  private extractAnnotatedClasses(root: Node, source: string): ParsedSymbol[] {
    const out: ParsedSymbol[] = [];
    for (const classNode of collectByType(root, 'class_declaration')) {
      const annotations = getAnnotations(classNode, source);
      const kind = resolveKind(annotations);
      if (!kind) continue;
      const nameNode = classNode.childForFieldName('name');
      if (!nameNode) continue;
      const className = text(nameNode, source);
      const packageName = extractPackage(root, source);
      out.push({
        name: className,
        qualifiedName: packageName ? `${packageName}.${className}` : className,
        kind,
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
}

function resolveKind(annotations: string[]): string | undefined {
  if (annotations.some(a => /^@(Rest)?Controller$/.test(a))) return 'java_controller';
  if (annotations.some(a => a === '@Service')) return 'java_service';
  if (annotations.some(a => /^@Repository/.test(a))) return 'java_repository';
  return undefined;
}
```

### Phase 4 — JavaAdapter

4. Create `src/pipeline/adapters/JavaAdapter.ts` following the `CSharpAdapter` pattern.
   Register in `src/pipeline/adapters/registry.ts`:

```typescript
registry.register('.java', new JavaAdapter());
```

### Phase 5 — Adapter roadmap doc

5. Create `docs/migration/adapter-roadmap.md`:

| Language | Priority | Complexity | Key node types | Status |
|---|---|---|---|---|
| Java | 1 | medium | java_controller, java_service, java_repository | **in-progress (US-019)** |
| Python | 2 | medium | python_fastapi_route, python_class | planned |
| Go | 3 | low | go_handler, go_struct | planned |
| Kotlin | 4 | medium | kotlin_controller (Spring) | planned |
| Ruby | 5 | high | ruby_rails_controller | planned |

### Phase 6 — Verification

6. `npm run typecheck` — fix any errors.
7. `npm test` — fix any failures.
8. Create a minimal `.java` fixture with `@RestController`, run `npm run dev extract`,
   confirm `java_controller` candidate appears.

## Stop Conditions

- If `tree-sitter-java.wasm` is not available without native compilation: stub the parser
  to return empty `ParsedFile` with a warning, document the limitation in the roadmap.
