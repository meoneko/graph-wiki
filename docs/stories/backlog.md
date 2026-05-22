# Story Backlog

## Candidate Epics

| Epic | Description | Status |
|---|---|---|
| E01 | Codebase Architecture Review — automated analysis of module coupling, cycles, layer violations, dead code, flow complexity | implemented |
| E02 | Python Reference Capability Migration — enrich the TypeScript target with selected installer, MCP, daemon, eval, search, visualization, language, flow, and wiki capabilities from the Python reference implementation | implemented |
| E03 | Partial Class Support — extract methods from C# partial classes, merge cross-file identity via derived layer, materialize contains edges | implemented |
| E04 | Universal Headless Semantic Knowledge Graph — broaden CRG into a universal headless, high-performance, workspace-segmented semantic knowledge graph engine by integrating CodeGraph components (declarative parsing, installer, token-budgeted exploration, and local embeddings) | planned |

## E01 Stories (ordered by dependency)

| Story | Title | Lane | Depends On | Status |
|---|---|---|---|---|
| US-001 | Core data models and types | normal | — | implemented |
| US-002 | ModuleBoundaryAnalyzer | normal | US-001 | implemented |
| US-003 | CycleDetector | normal | US-001 | implemented |
| US-004 | LayerViolationDetector | normal | US-001 | implemented |
| US-005 | FlowAssessor | normal | US-001 | implemented |
| US-006 | DeadCodeClassifier | normal | US-001 | implemented |
| US-007 | ArchitectureReviewEngine orchestrator | normal | US-002–006 | implemented |
| US-008 | ArchitectureReportWriter | tiny | US-001 | implemented |
| US-009 | MCP tool integration | normal | US-007, US-008 | implemented |
| US-010 | CLI command and OperationResolver wiring | normal | US-007, US-008 | implemented |
| US-011 | End-to-end integration | normal | US-009, US-010 | implemented |

## E02 Stories (ordered by dependency)

| Story | Title | Lane | Depends On | Status |
|---|---|---|---|---|
| US-012 | TypeScript migration map for Python reference capabilities | tiny | — | implemented |
| US-013 | `crg install` client detection and config generation | normal | US-012 | implemented |
| US-014 | MCP tool filtering for `serve-mcp` | normal | US-012 | implemented |
| US-015 | Multi-repo daemon and watcher supervision | normal | US-012 | implemented |
| US-016 | Evaluation benchmark runner and report schema | normal | US-012 | implemented |
| US-017 | Hybrid search enrichment | high-risk | US-012 | implemented |
| US-018 | Interactive visualization export | normal | US-012 | implemented |
| US-019 | Expanded parser adapter roadmap and first migrated language slice | normal | US-012 | implemented |
| US-020 | Community analysis fallback and oversized-community splitting | normal | US-012 | implemented |
| US-021 | Flow criticality and affected-flow lookup enrichment | normal | US-012 | implemented |
| US-022 | Agent prompt/template exposure for review workflows | normal | US-012 | implemented |
| US-023 | Memory/wiki re-ingestion policy and provenance design | high-risk | US-012 | implemented |

## E02 Implementation Order

Recommended execution sequence:

1. **US-012** — Migration map (foundation; all others reference it)
2. **US-013, US-014, US-019** - Installer, MCP filter, first selected language slice (independent; parallel-safe)
3. **US-015** — Daemon (builds on existing `watch`; standalone)
4. **US-016** — Eval runner (reads from existing graph; standalone)
5. **US-018, US-020, US-021, US-022** - Viz, community, flow, and prompt/template enrichment (read-mostly; standalone after US-012)
6. **US-017** - Hybrid search (high-risk; requires embeddings from pipeline stage 06)
7. **US-023** - Memory/wiki re-ingestion policy (high-risk; requires a follow-up ADR before implementation)

## E03 Stories — Partial Class Support (ordered by dependency)

| Story | Title | Lane | Depends On | Status |
|---|---|---|---|---|
| US-001 | Partial class method extraction | normal | — | implemented |
| US-002 | Derived partial class identity merge | high-risk | — | implemented |
| US-003 | Contains edge materialization | normal | US-001 | implemented |

## E03 Implementation Order

Recommended execution sequence:

1. **US-001** — Method extraction (foundation; enables US-003)
2. **US-002** — Class identity merge (independent; standalone deployment)
3. **US-003** — Contains edges (needs US-001; benefits from US-002 if active)

---

## E01 Implementation Order

Recommended execution sequence:

1. **US-001** — Types (foundation, no dependencies)
2. **US-002 through US-006** — Analyzers (parallel-safe, all depend only on US-001)
3. **US-007** — Engine orchestrator (needs all analyzers)
4. **US-008** — Report writer (can be done alongside US-007)
5. **US-009 + US-010** — MCP + CLI (need engine + writer)
6. **US-011** — Integration validation (needs everything)

---

## E04 Stories — Universal Headless Semantic Knowledge Graph (ordered by dependency)

| Story | Title | Lane | Depends On | Status |
|---|---|---|---|---|
| US-024 | Universal Declarative Language Parser Engine | normal | — | planned |
| US-025 | Adaptive Context Explorer with Token Budgeting | normal | — | planned |
| US-026 | Interactive Guided Client Installer (`crg install`) | normal | — | planned |
| US-027 | Local Vector Search & Hybrid Search Integration | high-risk | — | planned |
| US-028 | End-to-end multi-workspace CLI & MCP headless validation | normal | US-024–027 | planned |

## E04 Implementation Order

Recommended execution sequence:

1. **US-024, US-025, US-026** — Declarative parser engine, token budgeter, and guided installer (independent; parallel-safe)
2. **US-027** — Local vector embedding integration (high-risk; requires sqlite-vss bindings in exploratory build stage)
3. **US-028** — End-to-end multi-workspace CLI & MCP validation (integrates all sub-components)

