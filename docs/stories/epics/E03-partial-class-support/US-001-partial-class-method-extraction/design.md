# Design

## Domain Model

New node type registered in `src/core/nodeTypeRegistry.ts`:

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

`lang_meta` fields on `csharp_method` nodes (set by `CSharpAdapter`, not by the parser):

```typescript
interface CSharpMethodMeta {
  containingClass: string;  // simple class name without namespace (e.g. "Orders")
  isPartialClass: true;     // always true — only extracted from partial classes
  returnType: string;       // return type text as in source (e.g. "bool", "Task<IActionResult>")
  parameters: string;       // parameter list without surrounding parentheses (e.g. "string path, int id")
  sourceFile: string;       // file path relative to project root
}
```

## Application Flow

`extractPartialClasses()` at line 255 already exists and produces `csharp_class` fragment
symbols with `isPartial: true`. US-001 adds `extractPartialClassMethods()` called from
within that same loop.

### Parser responsibility (`CSharpParser.ts`)

Returns `ParsedSymbol` with `kind: 'method'` (valid `SymbolKind`). No `lang_meta` field
exists on `ParsedSymbol` — it is set later by the adapter.

The `ParsedSymbol` for each extracted method uses the existing structured fields:
- `returnType?: string` — return type text
- `parameters?: ParameterDef[]` — structured param list (adapter strips parens for `lang_meta.parameters`)
- `containingClass?: string` — class name (marks it as a partial-class method)
- `isPartial` is carried on the **class** symbol; methods are tagged via `containingClass`

Overload disambiguation (per-file): when two methods share the same name in the same
class, `qualifiedName` becomes `ClassName.MethodName`, `ClassName.MethodName_2`, etc.
The suffix starts at `_2` for the second occurrence.

```typescript
out.push({
  name: methodName,
  qualifiedName,       // e.g. "Orders.Blaze_CSV_Output"
  kind: 'method',      // SymbolKind — NOT 'csharp_method'
  startLine: ...,
  endLine: ...,
  body: text(method, source),
  calledSymbols: [...],
  annotations: [...],
  isPublic: true,
  isStatic: modifiers.includes('static'),
  isEntrypoint: false,
  containingClass: className,   // signals partial-class method to adapter
  namespace,
  returnType: returnNode ? text(returnNode, source) : 'void',
  parameters: [/* ParameterDef[] */],
});
```

### Adapter responsibility (`CSharpAdapter.ts`)

`CSharpAdapter` maps `ParsedSymbol` → `CandidateRecord`. When it encounters a symbol
with `kind: 'method'` AND `containingClass` set AND the symbol was emitted by
`extractPartialClassMethods()` (detectable via a local flag set during parsing), it:

1. Sets `candidate_type: 'csharp_method'`
2. Populates `lang_meta`:

```typescript
candidate.lang_meta = {
  containingClass: symbol.containingClass,
  isPartialClass: true,
  returnType: symbol.returnType ?? 'void',
  parameters: formatParameters(symbol.parameters ?? []),  // strips parens, joins
  sourceFile: symbol.source_file,
};
```

This is the correct separation: the parser sees AST; the adapter builds graph semantics.

## Interface Contract

Config schema in `knowledge.config.yaml` (project-level):

```yaml
projects:
  - id: my_project
    extract_partial_methods: true   # default: false
```

`ProjectConfig` in `src/pipeline/config.ts`:
```typescript
extract_partial_methods?: boolean;  // default false
```

Config validation: if `extract_partial_methods` is present and not a boolean, `loadConfig()`
throws: `"extract_partial_methods must be a boolean (project: {id})"`.

Propagation path: `ProjectConfig` → `AdapterOptions.extractPartialMethods?: boolean` in
`02_extract.ts` → `CSharpAdapter` → `CSharpParser`.

## Data Model

No schema changes. `csharp_method` nodes stored in `nodes` table as any other canonical
node. `lang_meta` stored as JSON in the existing `lang_meta` column.

`GraphNode` shape (actual interface fields — `workspace`, `project`, `type`, not `kind`/`workspace_id`):

```typescript
{
  id: `node:${candidateId}`,
  stableKey: sid(workspace, project, sourceFile, symbol),  // file-path-based hash
  workspace: workspaceId,
  project: projectId,
  type: 'csharp_method',         // matches nodeTypeRegistry id
  label: methodName,
  symbol: qualifiedName,         // e.g. "Orders.Blaze_CSV_Output"
  source_file: relativeFilePath,
  graph_kind: 'canonical',
  confidence_band: 'AUTHORITATIVE',
  trust_level: 'AUTHORITATIVE',
  lang_meta: { containingClass, isPartialClass: true, returnType, parameters, sourceFile },
  provenance: { ... },           // required field
}
```

## UI / Platform Impact

None at extraction stage. MCP tools that enumerate nodes surface `csharp_method` nodes
automatically after a pipeline rebuild.

## Observability

Extraction stage candidate/reject counters capture method extraction volume.

## Alternatives Considered

1. **`kind: 'csharp_method'` in ParsedSymbol** — rejected. `SymbolKind` is a closed union
   that does not include `'csharp_method'`. Using `'method'` preserves type safety and
   follows the existing pattern (`toMethodSymbol` also returns `kind: 'method'`).

2. **`lang_meta` in ParsedSymbol** — rejected. `ParsedSymbol` has no `lang_meta` field.
   The adapter is the correct layer for graph semantics mapping.

3. **Extract all methods from all C# classes** — rejected. Node-count explosion risk.
   Scoped to partial classes only.
