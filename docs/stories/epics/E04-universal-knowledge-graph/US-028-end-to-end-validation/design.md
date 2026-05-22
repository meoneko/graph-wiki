# Design

## Multi-Workspace Pipeline Validation Flow

The harness orchestrates parallel workspace runs and asserts security invariants:

```mermaid
graph TD
    A[Setup Multi-Workspace Fixtures] --> B[Workspace 1: TS project]
    A --> C[Workspace 2: Python project]
    A --> D[Workspace 3: Go project]
    
    B --> E[Run crg build WS_1]
    C --> F[Run crg build WS_2]
    D --> G[Run crg build WS_3]
    
    E --> H[Verify Workspace Databases Isolated]
    F --> H
    G --> H
    
    H --> I[Execute Concurrent Hybrid Search Queries]
    I --> J[Assert Integrity, Performance & Leak-Free States]
```

## Isolation Invariant Checks

The testing framework explicitly runs:

```typescript
// Assert that a query for WS_1 never returns nodes carrying provenance metadata of WS_2
const leakedNodes = db.prepare(`
  SELECT count(*) as count FROM nodes 
  WHERE workspace = ? AND id IN (SELECT id FROM nodes WHERE workspace = ?)
`).get(workspace1, workspace2);
expect(leakedNodes.count).toBe(0);
```

## Alternatives Considered

None — E2E validation requires direct SQLite scans and environment validations.
