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

## E01 — Codebase Architecture Review (Planned)

| Story | Contract | Unit | Integration | Status | Evidence |
|---|---|---|---|---|---|
| US-001 Core data models | Types compile, interfaces enforced | no | no | planned | none |
| US-002 ModuleBoundaryAnalyzer | Partitioning, coupling/cohesion bounds | no | no | planned | none |
| US-003 CycleDetector | Tarjan SCC correctness, severity classification | no | no | planned | none |
| US-004 LayerViolationDetector | Direction/distance detection, source refs | no | no | planned | none |
| US-005 FlowAssessor | Threshold flagging, entrypoint detection | no | no | planned | none |
| US-006 DeadCodeClassifier | Type classification, exclusion, ratio | no | no | planned | none |
| US-007 ArchitectureReviewEngine | Trust filtering, aggregation, confidence | no | no | planned | none |
| US-008 ArchitectureReportWriter | File output, custom path, error handling | no | no | planned | none |
| US-009 MCP tools | Tool registration, invocation, errors | no | no | planned | none |
| US-010 CLI command | Flags, JSON output, exit codes | no | no | planned | none |
| US-011 End-to-end | Full pipeline, graceful degradation | no | yes | planned | none |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
