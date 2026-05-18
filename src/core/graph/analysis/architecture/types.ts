/**
 * Core types for the Architecture Review feature.
 *
 * Re-exports relevant types from existing modules and defines
 * all shared interfaces used by the architecture analyzers.
 */

// Re-export types from existing modules
export type { GraphNode, GraphEdge, QueryMode, QueryResult } from '../../../types.js';
export type { Community } from '../community.js';
export type { FlowSummary } from '../../../flows.js';

// ---------------------------------------------------------------------------
// Severity & Finding Types
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'warning' | 'info';

export type FindingType =
  | 'high_coupling'
  | 'low_cohesion'
  | 'dependency_cycle'
  | 'layer_violation'
  | 'reverse_dependency'
  | 'high_complexity_flow'
  | 'missing_entrypoint'
  | 'cross_module_flow'
  | 'dead_branch'
  | 'dead_code'
  | 'unused_component'
  | 'test_only_reachable'
  | 'high_dead_code_ratio';

export interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  description: string;
  affectedModules: string[];
  sourceReferences: Array<{
    file?: string;
    line?: number;
    nodeId?: string;
    label?: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Architecture Report
// ---------------------------------------------------------------------------

export interface ArchitectureReport {
  workspaceId: string;
  generatedAt: string;
  summary: {
    totalFindings: number;
    critical: number;
    warning: number;
    info: number;
  };
  metrics: {
    moduleCount: number;
    averageCoupling: number;
    averageCohesion: number;
    cycleCount: number;
    deadCodeCount: number;
    flowCount: number;
  };
  findings: Finding[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  relatedFindings: string[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ArchitectureReviewConfig {
  layers?: LayerConfig;
  thresholds?: {
    highCoupling?: number;      // default: 0.7
    lowCohesion?: number;       // default: 0.3
    highComplexity?: number;    // default: 10
    deadCodeRatio?: number;     // default: 0.2
  };
  includeExploratory?: boolean; // default: false
}

export interface LayerConfig {
  hierarchy: string[];
  aliases?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Module Boundary Types
// ---------------------------------------------------------------------------

export interface ModuleInfo {
  id: string;
  name: string;
  nodeCount: number;
  nodeIds: string[];
}

export interface CouplingPair {
  moduleA: string;
  moduleB: string;
  score: number;
  crossEdgeCount: number;
}

// ---------------------------------------------------------------------------
// Dead Code Types
// ---------------------------------------------------------------------------

export interface DeadCodeEntry {
  nodeId: string;
  label: string;
  type: string;
  sourceFile: string;
  classification: 'potentially_dead_code' | 'unused_component' | 'test_only_reachable';
  severity: 'warning' | 'info';
}

// ---------------------------------------------------------------------------
// Flow Assessment Types
// ---------------------------------------------------------------------------

export interface FlowAssessment {
  flowId: string;
  flowName: string;
  nodeCount: number;
  moduleSpan: string[];
  hasEntrypoint: boolean;
  deadBranches: Array<{ nodeId: string; label: string }>;
  complexity: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Layer Violation Types
// ---------------------------------------------------------------------------

export interface LayerViolation {
  fromModule: string;
  toModule: string;
  fromLayer: number;
  toLayer: number;
  edgeType: string;
  sourceFile?: string;
  line?: number;
  violationType: 'skip_layer' | 'reverse_dependency';
  severity: 'critical' | 'warning';
}

// ---------------------------------------------------------------------------
// Dependency Cycle Types
// ---------------------------------------------------------------------------

export interface DependencyCycle {
  modules: string[];
  edgeTypes: string[];
  severity: 'critical' | 'warning';
}

// ---------------------------------------------------------------------------
// Analyzer Result Types
// ---------------------------------------------------------------------------

export interface ModuleBoundaryResult {
  modules: ModuleInfo[];
  couplingPairs: CouplingPair[];
  cohesionScores: Array<{ moduleId: string; score: number }>;
  findings: Finding[];
}

export interface CycleDetectionResult {
  cycles: DependencyCycle[];
  findings: Finding[];
}

export interface LayerViolationResult {
  violations: LayerViolation[];
  findings: Finding[];
}

export interface FlowAssessmentResult {
  assessments: FlowAssessment[];
  findings: Finding[];
}

export interface DeadCodeResult {
  entries: DeadCodeEntry[];
  moduleRatios: Array<{ moduleId: string; ratio: number; flagged: boolean }>;
  findings: Finding[];
}
