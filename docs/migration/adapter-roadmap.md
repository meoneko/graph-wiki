# Language Adapter Roadmap

This document outlines the strategy and priority order for adding new language
adapters to `code-review-graph`. Each adapter uses tree-sitter WASM grammars to
extract framework-specific nodes (controllers, services, repositories, routes)
into the knowledge graph.

---

## Strategy

Language adapters follow a consistent pattern:

1. **Tree-sitter WASM grammar** — no native compilation required
2. **Framework-aware extraction** — focus on annotated/decorated entry points,
   not raw AST dumping
3. **Adapter registry integration** — register file extensions in
   `src/pipeline/adapters/registry.ts`
4. **Node type registration** — define canonical node kinds in
   `src/core/nodeTypeRegistry.ts`

Each adapter extracts only framework-annotated constructs (e.g., Spring
annotations for Java, Flask/Django decorators for Python). Plain classes and
functions without framework markers do not produce nodes.

---

## Completed Adapters

| Language | Location | Extracts | Status |
|---|---|---|---|
| TypeScript / TSX | `src/scanner/languages/typescript/` | Classes, functions, exports, React components | done |
| C# | `src/scanner/languages/csharp/` | Controllers, services, Entity Framework models | done |

---

## Adapter Priority Table

| Priority | Language | Complexity | Status | Notes |
|---|---|---|---|---|
| 1 | Java | Medium | in-progress | Spring annotations (`@RestController`, `@Service`, `@Repository`). Implemented in `src/scanner/languages/java/`. |
| 2 | Python | Medium | planned | Flask/Django decorators (`@app.route`, `@api_view`), FastAPI path operations, dataclass models. |
| 3 | Go | Low | planned | Exported functions, HTTP handler registrations (`http.HandleFunc`), struct types with tags. |
| 4 | Kotlin | Medium | planned | Spring Boot annotations (same as Java), Ktor routing DSL, coroutine entry points. |
| 5 | Ruby | High | planned | Rails controllers, ActiveRecord models, route DSL (`resources`, `get`, `post`). Complexity due to metaprogramming and dynamic dispatch. |

---

## Adapter Details

### Java (Priority 1 — in-progress)

- **Grammar:** `tree-sitter-java` WASM
- **Extracts:** `@RestController` / `@Controller` → `java_controller`,
  `@Service` → `java_service`, `@Repository` → `java_repository`
- **Entry points:** Controllers marked as `isEntrypoint: true`
- **Qualified names:** Package + class name (e.g., `com.example.OrdersController`)
- **Location:** `src/scanner/languages/java/`

### Python (Priority 2 — planned)

- **Grammar:** `tree-sitter-python` WASM
- **Would extract:** Flask route decorators (`@app.route`), Django view
  decorators (`@api_view`, `@action`), FastAPI path operations
  (`@router.get`), SQLAlchemy/Django ORM models
- **Node kinds:** `python_route`, `python_view`, `python_model`
- **Challenges:** Decorator detection requires resolving import aliases;
  dynamic route registration patterns

### Go (Priority 3 — planned)

- **Grammar:** `tree-sitter-go` WASM
- **Would extract:** Exported handler functions, `http.HandleFunc` /
  `mux.HandleFunc` registrations, gRPC service definitions, struct types
  with JSON/DB tags
- **Node kinds:** `go_handler`, `go_service`, `go_model`
- **Challenges:** Low — Go's explicit style makes extraction straightforward

### Kotlin (Priority 4 — planned)

- **Grammar:** `tree-sitter-kotlin` WASM
- **Would extract:** Spring Boot annotations (shared with Java), Ktor routing
  DSL (`routing { get("/path") { ... } }`), `@Serializable` data classes
- **Node kinds:** `kotlin_controller`, `kotlin_service`, `kotlin_route`
- **Challenges:** Ktor DSL uses nested lambdas; Spring annotations overlap
  with Java adapter logic (potential shared utilities)

### Ruby (Priority 5 — planned)

- **Grammar:** `tree-sitter-ruby` WASM
- **Would extract:** Rails controller classes (`< ApplicationController`),
  ActiveRecord models (`< ApplicationRecord`), route DSL entries
  (`resources :orders`), Sidekiq workers
- **Node kinds:** `ruby_controller`, `ruby_model`, `ruby_worker`
- **Challenges:** Heavy metaprogramming (`has_many`, `belongs_to`, dynamic
  method definitions), `method_missing` patterns, DSL-heavy routing makes
  static extraction harder

---

## Adding a New Adapter

To add a language adapter:

1. Install the tree-sitter WASM grammar package
2. Create `src/scanner/languages/{lang}/{Lang}Parser.ts` implementing
   `ILanguageParser`
3. Register node types in `src/core/nodeTypeRegistry.ts`
4. Create `src/pipeline/adapters/{Lang}Adapter.ts` following the existing
   `CSharpAdapter` / `JavaAdapter` pattern
5. Register file extensions in `src/pipeline/adapters/registry.ts`
6. Add fixture files and tests in `src/scanner/languages/{lang}/__tests__/`
7. Update this roadmap document with the new adapter's status

---

## References

- Design: `.kiro/specs/python-reference-migration/design.md` § Java Adapter
- Story: `docs/stories/epics/E02-python-reference-migration/US-019-new-language-adapter/`
- ADR: `docs/decisions/0005-python-reference-migration-strategy.md`
