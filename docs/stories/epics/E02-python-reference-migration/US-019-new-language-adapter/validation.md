# Validation

## Proof Strategy

Parse a Java fixture file with `@RestController`, `@Service`, `@Repository` classes.
Confirm correct kinds are emitted. Confirm non-annotated classes produce no symbols.
Confirm full pipeline accepts `java_controller` candidates without rejecting as unknown type.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `JavaParser.parse()` with `@RestController` class → 1 symbol of kind `java_controller` |
| Unit | `JavaParser.parse()` with `@Service` class → kind `java_service` |
| Unit | `JavaParser.parse()` with `@Repository` class → kind `java_repository` |
| Unit | `JavaParser.parse()` with plain class (no annotation) → 0 symbols |
| Unit | `JavaParser.parse()` with `@RestController` + `@Service` in same file → 2 symbols |
| Unit | `qualifiedName` is `com.example.OrdersController` when `package com.example;` is present |
| Integration | `JavaAdapter` produces `CandidateRecord[]` that pass stage 03 (normalize) and stage 04 (validate) |
| Integration | `nodeTypeRegistry.has('java_controller')` returns true |
| E2E | `crg extract --workspace java-test` on a project with `.java` files shows non-zero candidate count |
| E2E | `crg stats --workspace java-test` shows `java_controller` in node type breakdown |
| Platform | `npm run typecheck` zero errors |

## Fixtures

Create `src/scanner/languages/java/__tests__/fixtures/SpringControllers.java`:

```java
package com.example;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.stereotype.Service;
import org.springframework.stereotype.Repository;

@RestController
public class OrdersController { }

@Service
public class OrderService { }

@Repository
public class OrderRepository { }

public class HelperUtil { }  // no annotation — should NOT be extracted
```

## Commands

```bash
npm run typecheck
npm test
crg extract --workspace java-test
crg stats --workspace java-test
```

## Acceptance Evidence

Pending implementation:

- All 6 unit cases pass
- Integration: `java_controller` survives validate stage without rejection
- E2E: `crg stats` shows 3 nodes (1 java_controller, 1 java_service, 1 java_repository)
  from the fixture project
- `HelperUtil` does NOT appear as a node (non-annotated class filtered out)
