# Design

## Domain Model

New node types registered in `src/core/nodeTypeRegistry.ts`:

```typescript
nodeTypeRegistry
  .register({ id: 'java_controller', category: 'handler', isCanonical: true,
    isEntrypoint: true, defaultExecutionRole: 'executable', languages: ['java'] })
  .register({ id: 'java_service', category: 'domain', isCanonical: true,
    isEntrypoint: false, defaultExecutionRole: 'structural_support', languages: ['java'] })
  .register({ id: 'java_repository', category: 'domain', isCanonical: true,
    isEntrypoint: false, defaultExecutionRole: 'structural_support', languages: ['java'] })
```

New modules:

```
src/scanner/languages/java/
  JavaParser.ts                — implements ILanguageParser for .java files
  JavaTreeSitterWrapper.ts     — initializes tree-sitter-java WASM grammar

src/pipeline/adapters/
  JavaAdapter.ts               — wraps JavaParser, maps to CandidateRecord
```

## Application Flow

`JavaParser` follows the same pattern as `CSharpParser`:

1. Load `tree-sitter-java.wasm` via `WebTreeSitterWrapper` (lazy singleton).
2. `parse(sourceCode, filePath)` traverses the AST for:
   - `class_declaration` nodes with Spring stereotype annotations:
     - `@RestController` / `@Controller` → kind `java_controller`
     - `@Service` → kind `java_service`
     - `@Repository` / `@RepositoryRestResource` → kind `java_repository`
3. Each matching class becomes a `ParsedSymbol` with:
   - `name`: class name
   - `qualifiedName`: `package.ClassName` (extracted from enclosing `package_declaration`)
   - `kind`: `java_controller` | `java_service` | `java_repository`
   - `namespace`: package name
   - `isEntrypoint`: true for `java_controller`
4. Returns `ParsedFile` with `symbols` and empty `imports` (import extraction deferred).

`JavaAdapter` maps `ParsedFile` to `CandidateRecord[]` following the same pattern as
`CSharpAdapter`.

## Interface Contract

`JavaAdapter` registered in `src/pipeline/adapters/registry.ts`:

```typescript
registry.register('.java', new JavaAdapter());
```

`ILanguageParser` contract is unchanged. `JavaParser` implements it directly.

`knowledge.config.yaml` project config for Java:

```yaml
projects:
  - id: my_java_project
    root: ../my-java-project/src/main/java
    include: ["**/*.java"]
    language: java
```

## WASM Dependency

`tree-sitter-java` WASM grammar. Check if `@vscode/tree-sitter-wasm` bundles it; if not,
add `tree-sitter-java` npm package which ships a prebuilt WASM file. No native compilation needed.

## Data Model

`java_controller`, `java_service`, `java_repository` nodes in `nodes` table. No schema
change.

## UI / Platform Impact

MCP tools and CLI commands that enumerate nodes will surface Java nodes automatically.

## Observability

Extraction stage candidate/reject counters capture Java node extraction volume.

## Alternatives Considered

1. **Python adapter first** — Python is higher volume in many teams but has a more complex
   AST (decorators, dynamic dispatch). Java's static annotation-based patterns map more
   cleanly to the existing node taxonomy.

2. **Regex-based Java adapter** — rejected. Tree-sitter grammar for Java is mature and
   already handles nested classes, annotations, generics correctly. Regex would miss edge
   cases.
