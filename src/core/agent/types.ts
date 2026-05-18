/**
 * Agent context types — Interfaces for invariants, risks, verification checklist,
 * and forbidden assumptions used in AgentContextPackage.
 *
 * @see Requirements 10.1
 */

import type { GraphNode, GraphEdge, QueryMode, Provenance } from '../types.js';

// ─── Invariant ───────────────────────────────────────────────────────────────

export type InvariantSource =
  | 'hard-rule'
  | 'authority-policy'
  | 'graph-policy'
  | 'workspace-policy'
  | 'preset'
  | 'process'
  | 'manual';

export type InvariantSeverity = 'hard' | 'soft';

export type InvariantCategory =
  | 'architecture'
  | 'authority'
  | 'workspace'
  | 'graph'
  | 'security'
  | 'testing'
  | 'runtime';

export interface Invariant {
  id: string;
  source: InvariantSource;
  severity: InvariantSeverity;
  category: InvariantCategory;
  description: string;
  appliesTo?: string[];
  verificationHint?: string;
}

// ─── RiskItem ────────────────────────────────────────────────────────────────

export type RiskSeverity = 'high' | 'medium' | 'low';

export interface RiskItem {
  id: string;
  severity: RiskSeverity;
  description: string;
  relatedNodes?: string[];
  relatedFiles?: string[];
}

// ─── VerificationChecklistItem ───────────────────────────────────────────────

export type VerificationSource =
  | 'impact'
  | 'policy'
  | 'preset'
  | 'test-coverage'
  | 'manual'
  | 'drift';

export interface VerificationChecklistItem {
  id: string;
  source: VerificationSource;
  required: boolean;
  description: string;
  command?: string;
  expectedSignal?: string;
  relatedNodes?: string[];
  relatedFiles?: string[];
}

// ─── ForbiddenAssumption ─────────────────────────────────────────────────────

export interface ForbiddenAssumption {
  id: string;
  severity: 'hard' | 'soft';
  description: string;
  reason: string;
  relatedPolicy?: string;
}

// ─── SourceReference ─────────────────────────────────────────────────────────

export interface SourceReference {
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  reason: string;
}

// ─── ToolSuggestion ──────────────────────────────────────────────────────────

export interface ToolSuggestion {
  tool: string;
  reason: string;
  args: Record<string, unknown>;
}

// ─── AgentContextPackage ─────────────────────────────────────────────────────

export interface AgentContextPackage {
  workspaceId: string;
  task: string;
  status: 'ready' | 'partial' | 'insufficient_context' | 'policy_blocked';
  nodes: GraphNode[];
  edges: GraphEdge[];
  relevantFiles: SourceReference[];
  invariants: Invariant[];
  risks: RiskItem[];
  verification_checklist: VerificationChecklistItem[];
  forbidden_assumptions: ForbiddenAssumption[];
  suggestions: ToolSuggestion[];
  codes: string[];
  warnings: string[];
  provenance: Provenance[];
}

// ─── AgentContextQuery ───────────────────────────────────────────────────────

export interface AgentContextQuery {
  task: string;
  workspace: string;
  mode?: QueryMode;
  limits?: {
    maxNodes?: number;
    maxEdges?: number;
    maxSuggestions?: number;
  };
}
