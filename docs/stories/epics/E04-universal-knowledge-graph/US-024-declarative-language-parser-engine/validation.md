# Validation

## Proof Strategy

Compile and execute parser tests using real language grammar files (e.g. Python class/method samples).

## Test Plan

| Layer | Cases |
|---|---|
| **Unit** | Extract `python_class` and `python_method` symbols from a sample Python file. Validate stable keys and edge generation. |
| **Integration** | Ensure the pipeline registers the declarative parser correctly when scanning workspace folders. |
| **Performance** | Measure AST query execution time (must be < 5ms per file). |

## Commands

```bash
npm run test src/scanner/core/__tests__/DeclarativeParser.test.ts
npm run typecheck
```

## Acceptance Evidence

Pending implementation.
