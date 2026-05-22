# Exec Plan

## Goal

Add config-driven method extraction for public methods inside C# partial classes, making
them first-class `csharp_method` graph nodes queryable via all existing surfaces.

## Scope

In scope:

- Register `csharp_method` in `nodeTypeRegistry.ts`
- Add `extract_partial_methods?: boolean` to `ProjectConfig` in `config.ts`
- Add `extractPartialMethods?: boolean` to `AdapterOptions` in `02_extract.ts`
- Implement `extractPartialClassMethods()` in `CSharpParser.ts` (returns `kind: 'method'`)
- Extend `extractPartialClasses()` to call the helper when flag is enabled
- Update `CSharpAdapter.ts` to map partial class method symbols → `candidate_type: 'csharp_method'`
  and populate `lang_meta`
- Config non-boolean validation in `loadConfig()`
- Update `knowledge.config.yaml.example` with new field

Out of scope:

- Non-public methods
- Methods in non-partial classes
- Contains edges (US-003)
- Parameter-level graph nodes

## Risk Classification

Risk flags:

- **Node count growth**: `extract_partial_methods: false` default prevents surprise.

Hard gates:

- `npm run typecheck` must pass with zero errors
- `npm test` must pass

## Work Phases

### Phase 1 — Node type and config types

1. Register `csharp_method` in `src/core/nodeTypeRegistry.ts`:

```typescript
nodeTypeRegistry.register({
  id: 'csharp_method',
  category: 'domain',
  isCanonical: true,
  isEntrypoint: false,
  defaultExecutionRole: 'structural_support',
  languages: ['csharp'],
});
```

2. Add to `ProjectConfig` interface in `src/pipeline/config.ts`:

```typescript
extract_partial_methods?: boolean;
```

3. Add validation in `loadConfig()`: if `extract_partial_methods` is not undefined and
   not a boolean, throw `"extract_partial_methods must be a boolean (project: ${id})"`.

4. Add to `AdapterOptions` in `src/pipeline/stages/02_extract.ts`:

```typescript
extractPartialMethods?: boolean;
```

5. In `02_extract.ts`, when building `AdapterOptions` from a `ProjectConfig`, add:

```typescript
extractPartialMethods: project.extract_partial_methods ?? false,
```

### Phase 2 — Parser implementation

6. In `src/scanner/languages/csharp/CSharpParser.ts`, add helper after `extractPartialClasses()`:

```typescript
private extractPartialClassMethods(
  classNode: Node,
  className: string,
  namespace: string | undefined,
  source: string,
): ParsedSymbol[] {
  const out: ParsedSymbol[] = [];
  const nameCounts = new Map<string, number>();

  for (const method of this.collectByType(classNode, 'method_declaration')) {
    const modifiers = this.collectByType(method, 'modifier').map(m => text(m, source));
    if (!modifiers.includes('public')) continue;

    const nameNode = method.childForFieldName('name');
    if (!nameNode) continue;
    const baseMethodName = text(nameNode, source);

    // Overload disambiguation (Req 3.6): suffix starts at _2
    const count = (nameCounts.get(baseMethodName) ?? 0) + 1;
    nameCounts.set(baseMethodName, count);
    const methodName = count === 1 ? baseMethodName : `${baseMethodName}_${count}`;
    const qualifiedName = `${className}.${methodName}`;

    const returnNode = method.childForFieldName('type');
    const paramsNode = method.childForFieldName('parameters');

    // Build structured ParameterDef[] for ParsedSymbol.parameters
    const parameters: ParameterDef[] = paramsNode
      ? paramsNode.namedChildren.map(p => ({
          name: p.childForFieldName('name')?.text ?? '',
          type: p.childForFieldName('type')?.text,
        }))
      : [];

    out.push({
      name: methodName,
      qualifiedName,
      kind: 'method',   // SymbolKind — the adapter maps this to candidate_type 'csharp_method'
      startLine: method.startPosition.row + 1,
      endLine: method.endPosition.row + 1,
      body: text(method, source),
      calledSymbols: this.extractCalledSymbols(method, source),
      annotations: this.getMethodAnnotations(method, source),
      isPublic: true,
      isStatic: modifiers.includes('static'),
      isEntrypoint: false,
      containingClass: className,   // adapter uses this to detect partial class method
      namespace,
      returnType: returnNode ? text(returnNode, source) : 'void',
      parameters,
    });
  }
  return out;
}
```

7. In `extractPartialClasses()` (~line 255), after pushing each partial class symbol,
   conditionally call the helper:

```typescript
if (this.options?.extractPartialMethods) {
  out.push(...this.extractPartialClassMethods(c, name, namespace, source));
}
```

   Note: `this.options` requires CSharpParser to accept an options bag. Check how existing
   parsers handle this; if needed, add a constructor parameter.

### Phase 3 — Adapter mapping

8. In `src/pipeline/adapters/CSharpAdapter.ts`, after building each `CandidateRecord` from
   a `ParsedSymbol`, add a special case for partial class method symbols:

```typescript
// If this is a partial class method (kind: 'method' with containingClass, emitted by
// extractPartialClassMethods), remap to csharp_method and populate lang_meta.
if (symbol.kind === 'method' && symbol.containingClass && options.extractPartialMethods) {
  candidate.candidate_type = 'csharp_method';
  candidate.lang_meta = {
    ...candidate.lang_meta,
    containingClass: symbol.containingClass,
    isPartialClass: true,
    returnType: symbol.returnType ?? 'void',
    parameters: symbol.parameters
      ?.map(p => p.type ? `${p.type} ${p.name}` : p.name)
      .join(', ') ?? '',
    sourceFile: candidate.source_file,
  };
}
```

   Note: this guard must not catch regular extension methods (which also have
   `containingClass`). The `options.extractPartialMethods` flag scopes it correctly since
   partial class method extraction only runs when the flag is true.

### Phase 4 — Config example

9. In `knowledge.config.yaml.example`, add under each project block:

```yaml
    # Optional: extract public methods from partial classes as csharp_method nodes.
    # Disabled by default to avoid node-count growth on large codebases.
    # extract_partial_methods: false
```

### Phase 5 — Verification

10. `npm run typecheck` — fix any errors (especially `SymbolKind` type check on `kind`).
11. `npm test` — fix any failures.
12. Enable flag locally, run `npm run dev build`, confirm `crg stats` shows `csharp_method`
    in node type breakdown.

## Stop Conditions

- If `CSharpParser` does not accept options currently: check `CSharpAdapter` → adapter
  likely creates a new parser per file or shares one; add `options` to the constructor.
- If `ParameterDef` import is missing from `CSharpParser.ts`: add the import from
  `../../core/ILanguageParser.js`.
