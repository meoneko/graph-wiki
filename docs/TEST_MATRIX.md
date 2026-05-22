# Test Matrix

This file maps product behavior to proof.

## Status Values

| Status | Meaning |
|---|---|
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Trusted Code Intelligence Platform (Existing — Implemented)

| Area | Contract | Unit | Integration | Status | Evidence |
|---|---|---|---|---|---|
| Pipeline (12 stages) | Deterministic execution order | yes | yes | implemented | 767 tests pass |
| Error taxonomy | 7 + 12 + 15 stable codes | yes | — | implemented | typecheck + tests |
| TrustAwareQueryEngine | Fail-closed, 3 query modes | yes | yes | implemented | trust-enforcement tests |
| EdgePolicyTable | Operation-specific traversal rules | yes | yes | implemented | traversal-policy tests |
| PathSelector | Deterministic path selection | yes | — | implemented | pathSelector tests |
| OperationResolver | 42 CallerIDs, mandatory gateway | yes | — | implemented | operation-query tests |
| AuthorityPolicyEngine | YAML policy, override-by-id merge | yes | — | implemented | policy engine tests |
| GovernanceValidator | Authority chains, forbidden patterns, flow integrity | yes | — | implemented | governance tests |
| StructuredAskEngine | 7 query types → OperationType mapping | yes | yes | implemented | ask engine tests |
| AgentContextBuilder | Deterministic ranking, output limits | yes | — | implemented | agent context tests |
| WikiBuilder | Trust-aware pages, insufficient_context status | yes | yes | implemented | wiki tests |
| DriftDetector | 13 drift types, baseline management | yes | — | implemented | drift tests |
| ReportBuilder | 8 report types | yes | — | implemented | report tests |
| TrustEventEmitter | JSONL events, summary snapshots | yes | — | implemented | emitter tests |
| ExternalKnowledgeGate | 5-step workflow, blocks direct canonical entry | yes | — | implemented | gate tests |
| PresetResolver | 9 presets, inheritance, override-by-id | yes | — | implemented | preset tests |
| ArtifactStore | Atomic writes, workspace-scoped storage | yes | — | implemented | artifact tests |
| Storage mappers | DB ↔ runtime bridging | yes | — | implemented | mapper tests |

## E01 — Codebase Architecture Review (Implemented)

| Story | Contract | Unit | Integration | Status | Evidence |
|---|---|---|---|---|---|
| US-001 Core data models | Types compile, interfaces enforced | yes | — | implemented | types.test.ts |
| US-002 ModuleBoundaryAnalyzer | Partitioning, coupling/cohesion bounds | yes | — | implemented | ModuleBoundaryAnalyzer.prop.test.ts |
| US-003 CycleDetector | Tarjan SCC correctness, severity classification | yes | — | implemented | CycleDetector.prop.test.ts |
| US-004 LayerViolationDetector | Direction/distance detection, source refs | yes | — | implemented | LayerViolationDetector.prop.test.ts |
| US-005 FlowAssessor | Threshold flagging, entrypoint detection | yes | — | implemented | FlowAssessor.prop.test.ts |
| US-006 DeadCodeClassifier | Type classification, exclusion, ratio | yes | — | implemented | DeadCodeClassifier.prop.test.ts |
| US-007 ArchitectureReviewEngine | Trust filtering, aggregation, confidence | yes | — | implemented | ArchitectureReviewEngine.prop.test.ts |
| US-008 ArchitectureReportWriter | File output, custom path, error handling | yes | — | implemented | ArchitectureReportWriter.test.ts |
| US-009 MCP tools | Tool registration, invocation, errors | yes | yes | implemented | mcp/tools/__tests__/architecture.test.ts |
| US-010 CLI command | Flags, JSON output, exit codes | yes | — | implemented | cli.test.ts |
| US-011 End-to-end | Full pipeline, graceful degradation | — | yes | implemented | integration.test.ts |

## E02 — Python Reference Capability Migration (Implemented)

| Story | Contract | Unit | Integration | Status | Evidence |
|---|---|---|---|---|---|
| US-012 Migration map | Python reference capabilities classified as migrate/reference/reject for TypeScript | yes | no | implemented | python-reference-map.md, capability-inventory.md |
| US-013 Installer onboarding | `crg install` generates idempotent client configs and hooks without destructive overwrite | yes | no | implemented | installer-detector.test.ts, installer-writer.test.ts |
| US-014 MCP tool filtering | `serve-mcp` exposes only allow-listed tools from CLI/env selection | yes | no | implemented | applyToolFilter.test.ts |
| US-015 Multi-repo daemon | Daemon supervises per-repo watchers, reports status, and restarts crashed children | yes | no | implemented | supervisor.test.ts, worker.test.ts |
| US-016 Evaluation runner | Benchmark reports cover token efficiency, impact, flow, search, and build metrics | yes | no | implemented | scorer.test.ts, runner.test.ts |
| US-017 Hybrid search | FTS, optional embeddings, and fallback keyword ranking respect workspace/trust filters | yes | no | implemented | embedding-index.test.ts, search-fusion.test.ts, hybrid-search-engine.test.ts |
| US-018 Visualization export | Interactive graph export renders nodes/edges and preserves trust metadata | yes | no | implemented | export-html.test.ts |
| US-019 Language slice | First migrated language adapter has fixtures, parser evidence, and trust classification | yes | no | implemented | java-parser.acceptance.test.ts |
| US-020 Community analysis | Deterministic fallback grouping and oversized-community splitting preserve trust metadata | yes | no | implemented | community-splitting.test.ts |
| US-021 Flow criticality | Flow criticality and affected-flow lookup use trusted graph evidence | yes | no | implemented | flows.acceptance.test.ts |
| US-022 Agent prompts | Review/debug/onboarding/pre-merge prompts route agents to trust-aware context | yes | no | implemented | src/mcp/prompts/index.ts |
| US-023 Memory/wiki re-ingestion | Parse YAML and HTML annotations from wiki markdown files and save to external_memory table safely | yes | yes | implemented | MemoryReIngestion.test.ts |

## E03 — Partial Class Support (Implemented)

| Story | Contract | Unit | Integration | Status | Evidence |
|---|---|---|---|---|---|
| US-001 Partial class method extraction | Config-driven C# method extraction inside partial classes | yes | — | implemented | 05b_build_derived.test.ts |
| US-002 Derived partial class identity merge | Merge multiple class fragments into a single virtual_class node with derived edges | yes | — | implemented | 05b_build_derived.test.ts |
| US-003 Contains edge materialization | Establish contains edges between classes and methods using containingClass metadata | yes | — | implemented | 05b_build_derived.test.ts |

## E04 — Universal Headless Semantic Knowledge Graph (Planned)

| Story | Contract | Unit | Integration | Status | Evidence |
|---|---|---|---|---|---|
| US-024 Declarative Language Parser Engine | Parse symbols and edges using standard Tree-sitter configurations | no | no | planned | none |
| US-025 Adaptive Context Explorer | Budget AI context dynamically using centrality scoring and character-to-token ratio | no | no | planned | none |
| US-026 Guided Client Installer | Safely merge MCP client config files globally and locally and clone rules templates | no | no | planned | none |
| US-027 Local Vector Search | Compute ONNX embeddings locally and run similarity hybrid queries | no | no | planned | none |
| US-028 End-to-end Validation | Multi-workspace concurrent pipeline runs yield zero data leakage | no | yes | planned | none |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
