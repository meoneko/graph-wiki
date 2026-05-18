# Story Backlog

## Candidate Epics

| Epic | Description | Status |
|---|---|---|
| E01 | Codebase Architecture Review — automated analysis of module coupling, cycles, layer violations, dead code, flow complexity | planned |

## E01 Stories (ordered by dependency)

| Story | Title | Lane | Depends On | Status |
|---|---|---|---|---|
| US-001 | Core data models and types | normal | — | planned |
| US-002 | ModuleBoundaryAnalyzer | normal | US-001 | planned |
| US-003 | CycleDetector | normal | US-001 | planned |
| US-004 | LayerViolationDetector | normal | US-001 | planned |
| US-005 | FlowAssessor | normal | US-001 | planned |
| US-006 | DeadCodeClassifier | normal | US-001 | planned |
| US-007 | ArchitectureReviewEngine orchestrator | normal | US-002–006 | planned |
| US-008 | ArchitectureReportWriter | tiny | US-001 | planned |
| US-009 | MCP tool integration | normal | US-007, US-008 | planned |
| US-010 | CLI command and OperationResolver wiring | normal | US-007, US-008 | planned |
| US-011 | End-to-end integration | normal | US-009, US-010 | planned |

## Implementation Order

Recommended execution sequence:

1. **US-001** — Types (foundation, no dependencies)
2. **US-002 through US-006** — Analyzers (parallel-safe, all depend only on US-001)
3. **US-007** — Engine orchestrator (needs all analyzers)
4. **US-008** — Report writer (can be done alongside US-007)
5. **US-009 + US-010** — MCP + CLI (need engine + writer)
6. **US-011** — Integration validation (needs everything)
