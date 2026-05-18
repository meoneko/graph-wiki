# Design

## Domain Model

```typescript
type Severity = 'critical' | 'warning' | 'info';

type FindingType =
  | 'high_coupling' | 'low_cohesion' | 'dependency_cycle'
  | 'layer_violation' | 'reverse_dependency'
  | 'high_complexity_flow' | 'missing_entrypoint' | 'cross_module_flow' | 'dead_branch'
  | 'dead_code' | 'unused_component' | 'test_only_reachable' | 'high_dead_code_ratio';

interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  description: string;
  affectedModules: string[];
  sourceReferences: Array<{ file?: string; line?: number; nodeId?: string; label?: string }>;
  confidence: 'high' | 'medium' | 'low';
}

interface ArchitectureReport {
  workspaceId: string;
  generatedAt: string;
  summary: { totalFindings: number; critical: number; warning: number; info: number };
  metrics: { moduleCount: number; averageCoupling: number; averageCohesion: number; cycleCount: number; deadCodeCount: number; flowCount: number };
  findings: Finding[];
  recommendations: Recommendation[];
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  relatedFindings: string[];
}
```

## Application Flow

N/A — types only.

## Interface Contract

All types exported from `src/core/graph/analysis/architecture/types.ts`.
Re-exports `GraphNode`, `GraphEdge` from `../../types.js` and `Community` from `../community.js`.

## Data Model

N/A — no persistence.

## UI / Platform Impact

None.

## Observability

None.

## Alternatives Considered

1. Define types inline in each analyzer — rejected for DRY and import consistency.
