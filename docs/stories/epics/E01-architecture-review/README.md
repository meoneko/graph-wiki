# E01 — Codebase Architecture Review

## Goal

Add automated architecture analysis capabilities to `code-review-graph` by
leveraging the existing knowledge graph to detect structural issues: module
coupling, dependency cycles, layer violations, dead code, and flow complexity.

## Surfaces

- **MCP tools**: `architecture_review`, `get_architecture_findings`
- **CLI command**: `crg review-architecture`
- **Report output**: `knowledge/reports/{workspace}/architecture.json`

## Design Principle

Reuse existing infrastructure (`computeGraphMetrics`, `detectCommunities`,
`computeFlows`, `findDeadCode`) and add thin analyzer layers on top. The
`ArchitectureReviewEngine` orchestrates existing modules and new analyzers,
exposed via MCP tools and CLI following established patterns.

## Key Reuse Points

| Existing Module | Reuse Strategy |
|---|---|
| `computeGraphMetrics()` | Orphans, hotspots, bridges for initial detection |
| `detectCommunities()` | Cohesion scores and coupling warnings |
| `computeFlows()` | Domain derivation for module identification |
| `TrustAwareQueryEngine.getVisibleGraph()` | Trust-filtered graph source |
| `OperationResolver` | Add architecture caller IDs |
| `QueryResultFactory` | All QueryResult construction |

## Candidate Stories

| Story | Title | Status |
|---|---|---|
| US-001 | Core data models and types | planned |
| US-002 | ModuleBoundaryAnalyzer | planned |
| US-003 | CycleDetector | planned |
| US-004 | LayerViolationDetector | planned |
| US-005 | FlowAssessor | planned |
| US-006 | DeadCodeClassifier | planned |
| US-007 | ArchitectureReviewEngine orchestrator | planned |
| US-008 | ArchitectureReportWriter | planned |
| US-009 | MCP tool integration | planned |
| US-010 | CLI command and OperationResolver wiring | planned |
| US-011 | End-to-end integration | planned |

## Exit Criteria

- All analyzers produce findings from a real workspace graph
- MCP tools return valid `QueryResult` with architecture report in metadata
- CLI command outputs human-readable summary and JSON
- `--fail-on-critical` exits with code 1 when critical findings exist
- All tests pass (`npm test`)
- Zero TypeScript errors (`npm run typecheck`)

## Spec Source

- `.kiro/specs/codebase-review/design.md`
- `.kiro/specs/codebase-review/tasks.md`
