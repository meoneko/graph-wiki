# Validation

## Proof Strategy

Run the pipeline against a project that contains C# partial classes with the
`extract_partial_methods: true` flag. Confirm that method nodes appear in the DB and are
queryable. Confirm that the flag defaults to off and produces no extra nodes when unset.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `CSharpParser` with `extractPartialMethods: true` parses fixture partial class → returns 1 symbol for `Blaze_CSV_Output` with `kind: 'method'` |
| Unit | `CSharpParser` with `extractPartialMethods: false` (default) → zero `kind: 'method'` symbols for same fixture |
| Unit | Private/protected methods in a partial class are not extracted |
| Unit | Overloaded public methods (same name × 2) → second gets `_2` suffix in `name` and `qualifiedName` |
| Unit | `qualifiedName` = `${className}.${methodName}` for all emitted symbols |
| Unit | `CSharpAdapter` maps `kind: 'method'` + `containingClass` → `candidate_type: 'csharp_method'` with `lang_meta.isPartialClass: true` |
| Integration | Pipeline stage 02 (extract) produces `csharp_method` candidates that survive stage 03 (normalize) and stage 04 (validate) |
| E2E | `crg stats` shows `csharp_method` node count > 0 after build with flag enabled |
| E2E | `crg ask "methods in Orders"` returns `Blaze_CSV_Output` as a node |
| Platform | `npm run typecheck` zero errors |
| Performance | Node count for `B2G/LocalAdmin` with flag enabled is < 2× previous count (guard against explosion) |

## Property-Based Tests

Use `fast-check` (already a project dependency). Run with `npm test`.

| # | Property | Generators |
|---|---|---|
| P1 | `extractPartialClassMethods()` always returns symbols where `kind === 'method'` | random set of public method names |
| P2 | Result count equals number of distinct public method names (overloads counted once per occurrence) | 1–10 public methods, 0–5 private/protected |
| P3 | No private/protected method appears in result | arbitrary method modifier combinations |
| P4 | When N public methods share the same name, the Nth occurrence has suffix `_${N}` (N ≥ 2) | method names with duplicates |
| P5 | Every emitted symbol has `qualifiedName === "${className}.${name}"` | random class and method names |
| P6 | When `extractPartialMethods = false`, result is always empty regardless of class content | any partial class AST |

```typescript
// Example property test skeleton (fast-check):
import fc from 'fast-check';

it('P4: overload disambiguation suffix is _2 for second occurrence', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),           // method base name
      fc.integer({ min: 2, max: 6 }),        // N occurrences
      (baseName, count) => {
        const symbols = extractPartialClassMethods(
          buildClassWithNOverloads(baseName, count),
          'TestClass', undefined, source
        );
        const names = symbols.map(s => s.name);
        expect(names[0]).toBe(baseName);
        expect(names[1]).toBe(`${baseName}_2`);
        if (count >= 3) expect(names[2]).toBe(`${baseName}_3`);
      }
    )
  );
});
```

## Fixtures

Create `src/scanner/languages/csharp/__tests__/fixtures/partial_class_methods.cs`:

```csharp
public partial class Orders
{
    public bool Blaze_CSV_Output(string path) { return true; }
    private void InternalHelper() { }
    protected int Score { get; set; }
    public void Process() { }
    public void Process(string mode) { }
}
```

Expected parse output with `extractPartialMethods: true`:
- `Blaze_CSV_Output` (`kind: 'method'`, `qualifiedName: 'Orders.Blaze_CSV_Output'`)
- `Process` (`qualifiedName: 'Orders.Process'`)
- `Process_2` (`qualifiedName: 'Orders.Process_2'`)

`InternalHelper` and `Score` must NOT appear.

## Commands

```bash
npm run typecheck
npm test
npm run dev build -- --workspace vietiq
crg stats
```

## Acceptance Evidence

Pending implementation. Evidence must include:

- Test output showing `csharp_method` fixture test passes and all P1–P6 properties hold
- `crg stats` output showing `csharp_method` in node type breakdown
- `crg ask` output showing at least one partial class method as a result node
