/**
 * DriftDetector — Identifies divergence between the knowledge graph and current source state.
 *
 * Accesses SQLite directly for read-only comparison (not through reasoning engine).
 * Supports baseline management: update, promote with atomic preservation.
 *
 * @see Requirements 13.1, 13.2, 13.3, 13.4, 13.5
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GraphNode, GraphEdge, Provenance } from '../types.js';
import { PipelineError } from '../errors.js';
import { GraphDB } from '../../storage/GraphDB.js';

// ─── Drift Types ─────────────────────────────────────────────────────────────

export type DriftCategory =
  | 'artifact'
  | 'graph'
  | 'policy'
  | 'wiki'
  | 'ask'
  | 'agent-context'
  | 'workspace'
  | 'adapter';

export type DriftSeverity = 'critical' | 'warning' | 'info';

export type DriftType =
  | 'artifact_missing'
  | 'artifact_schema_changed'
  | 'canonical_node_count_changed'
  | 'canonical_edge_count_changed'
  | 'exploratory_count_changed'
  | 'provenance_missing'
  | 'authority_policy_changed'
  | 'workspace_boundary_violation'
  | 'wiki_stale'
  | 'ask_readiness_degraded'
  | 'agent_context_readiness_degraded'
  | 'adapter_version_changed'
  | 'unknown';

export interface DriftItem {
  id: string;
  workspaceId: string;
  baselineId: string;
  category: DriftCategory;
  severity: DriftSeverity;
  driftType: DriftType;
  description: string;
  affectedArtifacts?: string[];
  affectedNodes?: string[];
  affectedEdges?: string[];
  affectedFiles?: string[];
  violatedPolicyIds?: string[];
  provenance?: Provenance[];
  detectedAt: string;
  suggestedActions: string[];
}

export interface DriftReport {
  workspaceId: string;
  baselineId: string;
  comparedWith?: string;
  status: 'pass' | 'warning' | 'fail';
  items: DriftItem[];
  summary: {
    info: number;
    warning: number;
    critical: number;
  };
  nextActions: string[];
}

// ─── Baseline Snapshot ───────────────────────────────────────────────────────

export interface BaselineSnapshot {
  id: string;
  workspaceId: string;
  createdAt: string;
  canonicalNodeCount: number;
  canonicalEdgeCount: number;
  exploratoryNodeCount: number;
  exploratoryEdgeCount: number;
  derivedNodeCount: number;
  derivedEdgeCount: number;
  nodeStableKeys: string[];
  edgeStableKeys: string[];
  adapterVersions: Record<string, string>;
  artifactFiles: string[];
  policyHash?: string;
  wikiGeneratedAt?: string;
  askReadinessScore?: number;
  agentContextReadinessScore?: number;
}

// ─── DriftDetector Class ─────────────────────────────────────────────────────

export class DriftDetector {
  private readonly db: GraphDB;
  private readonly baselinesDir: string;

  constructor(db: GraphDB, baselinesDir: string) {
    this.db = db;
    this.baselinesDir = baselinesDir;
  }

  /**
   * Compare current graph state against baseline and produce a DriftReport.
   */
  async detect(workspaceId: string): Promise<DriftReport> {
    const baseline = this.loadBaseline(workspaceId);
    if (!baseline) {
      return this.createMissingBaselineReport(workspaceId);
    }

    const items: DriftItem[] = [];
    const now = new Date().toISOString();

    // Get current state from SQLite directly (read-only comparison)
    const currentNodes = this.db.getAllNodesByWorkspace(workspaceId);
    const currentEdges = this.db.getEdgesByWorkspace(workspaceId);

    const canonicalNodes = currentNodes.filter(n => n.graph_kind === 'canonical');
    const canonicalEdges = currentEdges.filter(e => e.graph_kind === 'canonical');
    const exploratoryNodes = currentNodes.filter(n => n.graph_kind === 'exploratory');
    const exploratoryEdges = currentEdges.filter(e => e.graph_kind === 'exploratory');
    const derivedNodes = currentNodes.filter(n => n.graph_kind === 'derived');
    const derivedEdges = currentEdges.filter(e => e.graph_kind === 'derived');

    // 1. canonical_node_count_changed
    if (canonicalNodes.length !== baseline.canonicalNodeCount) {
      const diff = canonicalNodes.length - baseline.canonicalNodeCount;
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'graph',
        severity: Math.abs(diff) > baseline.canonicalNodeCount * 0.2 ? 'critical' : 'warning',
        driftType: 'canonical_node_count_changed',
        description: `Canonical node count changed from ${baseline.canonicalNodeCount} to ${canonicalNodes.length} (${diff > 0 ? '+' : ''}${diff})`,
        detectedAt: now,
        suggestedActions: ['Run full rebuild to reconcile graph state', 'Investigate source changes'],
      }));
    }

    // 2. canonical_edge_count_changed
    if (canonicalEdges.length !== baseline.canonicalEdgeCount) {
      const diff = canonicalEdges.length - baseline.canonicalEdgeCount;
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'graph',
        severity: Math.abs(diff) > baseline.canonicalEdgeCount * 0.2 ? 'critical' : 'warning',
        driftType: 'canonical_edge_count_changed',
        description: `Canonical edge count changed from ${baseline.canonicalEdgeCount} to ${canonicalEdges.length} (${diff > 0 ? '+' : ''}${diff})`,
        detectedAt: now,
        suggestedActions: ['Run full rebuild to reconcile graph state', 'Review edge extraction rules'],
      }));
    }

    // 3. exploratory_count_changed
    const currentExploratoryCount = exploratoryNodes.length + exploratoryEdges.length;
    const baselineExploratoryCount = baseline.exploratoryNodeCount + baseline.exploratoryEdgeCount;
    if (currentExploratoryCount !== baselineExploratoryCount) {
      const diff = currentExploratoryCount - baselineExploratoryCount;
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'graph',
        severity: 'info',
        driftType: 'exploratory_count_changed',
        description: `Exploratory count changed from ${baselineExploratoryCount} to ${currentExploratoryCount} (${diff > 0 ? '+' : ''}${diff})`,
        detectedAt: now,
        suggestedActions: ['Review exploratory enrichment results'],
      }));
    }

    // 4. artifact_missing — check expected artifact files
    const missingArtifacts = this.checkMissingArtifacts(workspaceId, baseline);
    for (const missing of missingArtifacts) {
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'artifact',
        severity: 'critical',
        driftType: 'artifact_missing',
        description: `Expected artifact file missing: ${missing}`,
        affectedArtifacts: [missing],
        detectedAt: now,
        suggestedActions: ['Run full rebuild to regenerate artifacts', 'Check file system permissions'],
      }));
    }

    // 5. artifact_schema_changed — detect stable key drift
    const currentNodeKeys = new Set(
      canonicalNodes
        .filter(n => n.stableKey != null)
        .map(n => n.stableKey!)
    );
    const baselineNodeKeys = new Set(baseline.nodeStableKeys);
    const addedNodeKeys = [...currentNodeKeys].filter(k => !baselineNodeKeys.has(k));
    const removedNodeKeys = [...baselineNodeKeys].filter(k => !currentNodeKeys.has(k));

    if (addedNodeKeys.length > 0 || removedNodeKeys.length > 0) {
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'artifact',
        severity: removedNodeKeys.length > 0 ? 'warning' : 'info',
        driftType: 'artifact_schema_changed',
        description: `Node stable keys changed: ${addedNodeKeys.length} added, ${removedNodeKeys.length} removed`,
        affectedNodes: [...addedNodeKeys.slice(0, 10), ...removedNodeKeys.slice(0, 10)],
        detectedAt: now,
        suggestedActions: ['Review schema changes', 'Update baseline after verification'],
      }));
    }

    // 6. provenance_missing — check canonical nodes without provenance
    const nodesWithoutProvenance = canonicalNodes.filter(n => !n.provenance || !n.provenance.source);
    if (nodesWithoutProvenance.length > 0) {
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'graph',
        severity: 'critical',
        driftType: 'provenance_missing',
        description: `${nodesWithoutProvenance.length} canonical node(s) missing provenance`,
        affectedNodes: nodesWithoutProvenance.slice(0, 10).map(n => n.id),
        detectedAt: now,
        suggestedActions: ['Run validation to identify provenance gaps', 'Rebuild affected nodes'],
      }));
    }

    // 7. authority_policy_changed — compare policy hash
    const currentPolicyHash = this.computePolicyHash(workspaceId);
    if (baseline.policyHash && currentPolicyHash !== baseline.policyHash) {
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'policy',
        severity: 'critical',
        driftType: 'authority_policy_changed',
        description: 'Authority policy configuration has changed since baseline',
        detectedAt: now,
        suggestedActions: ['Invalidate and rebuild graph artifacts', 'Review policy changes for compatibility'],
      }));
    }

    // 8. workspace_boundary_violation — check for cross-workspace references
    const boundaryViolations = this.checkWorkspaceBoundaryViolations(currentNodes, currentEdges, workspaceId);
    if (boundaryViolations.length > 0) {
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'workspace',
        severity: 'critical',
        driftType: 'workspace_boundary_violation',
        description: `${boundaryViolations.length} workspace boundary violation(s) detected`,
        affectedNodes: boundaryViolations.slice(0, 10),
        detectedAt: now,
        suggestedActions: ['Remove cross-workspace references', 'Review workspace isolation policy'],
      }));
    }

    // 9. wiki_stale — check if wiki was generated before baseline
    if (baseline.wikiGeneratedAt) {
      const wikiAge = Date.now() - new Date(baseline.wikiGeneratedAt).getTime();
      const baselineAge = Date.now() - new Date(baseline.createdAt).getTime();
      if (wikiAge > baselineAge) {
        items.push(this.createDriftItem({
          workspaceId,
          baselineId: baseline.id,
          category: 'wiki',
          severity: 'warning',
          driftType: 'wiki_stale',
          description: 'Wiki pages were generated before the current baseline',
          detectedAt: now,
          suggestedActions: ['Regenerate wiki pages from current graph state'],
        }));
      }
    }

    // 10. ask_readiness_degraded
    if (baseline.askReadinessScore != null) {
      const currentScore = this.computeAskReadinessScore(canonicalNodes, canonicalEdges);
      if (currentScore < baseline.askReadinessScore) {
        items.push(this.createDriftItem({
          workspaceId,
          baselineId: baseline.id,
          category: 'ask',
          severity: currentScore < baseline.askReadinessScore * 0.8 ? 'warning' : 'info',
          driftType: 'ask_readiness_degraded',
          description: `Ask readiness score degraded from ${baseline.askReadinessScore.toFixed(2)} to ${currentScore.toFixed(2)}`,
          detectedAt: now,
          suggestedActions: ['Investigate missing canonical paths', 'Run full rebuild'],
        }));
      }
    }

    // 11. agent_context_readiness_degraded
    if (baseline.agentContextReadinessScore != null) {
      const currentScore = this.computeAgentContextReadinessScore(canonicalNodes, canonicalEdges);
      if (currentScore < baseline.agentContextReadinessScore) {
        items.push(this.createDriftItem({
          workspaceId,
          baselineId: baseline.id,
          category: 'agent-context',
          severity: currentScore < baseline.agentContextReadinessScore * 0.8 ? 'warning' : 'info',
          driftType: 'agent_context_readiness_degraded',
          description: `Agent context readiness score degraded from ${baseline.agentContextReadinessScore.toFixed(2)} to ${currentScore.toFixed(2)}`,
          detectedAt: now,
          suggestedActions: ['Review graph coverage for agent context', 'Run full rebuild'],
        }));
      }
    }

    // 12. adapter_version_changed
    const currentAdapterVersions = this.collectAdapterVersions(currentNodes);
    for (const [adapterId, currentVersion] of Object.entries(currentAdapterVersions)) {
      const baselineVersion = baseline.adapterVersions[adapterId];
      if (baselineVersion && baselineVersion !== currentVersion) {
        items.push(this.createDriftItem({
          workspaceId,
          baselineId: baseline.id,
          category: 'adapter',
          severity: 'warning',
          driftType: 'adapter_version_changed',
          description: `Adapter '${adapterId}' version changed from ${baselineVersion} to ${currentVersion}`,
          detectedAt: now,
          suggestedActions: ['Rebuild graph with new adapter version', 'Review adapter changelog for breaking changes'],
        }));
      }
    }

    // 13. unknown — catch-all for edge stable key drift
    const currentEdgeKeys = new Set(
      canonicalEdges
        .filter(e => e.stableKey != null)
        .map(e => e.stableKey!)
    );
    const baselineEdgeKeys = new Set(baseline.edgeStableKeys);
    const addedEdgeKeys = [...currentEdgeKeys].filter(k => !baselineEdgeKeys.has(k));
    const removedEdgeKeys = [...baselineEdgeKeys].filter(k => !currentEdgeKeys.has(k));

    if (removedEdgeKeys.length > addedEdgeKeys.length * 2 && removedEdgeKeys.length > 5) {
      items.push(this.createDriftItem({
        workspaceId,
        baselineId: baseline.id,
        category: 'graph',
        severity: 'warning',
        driftType: 'unknown',
        description: `Significant edge stable key drift detected: ${addedEdgeKeys.length} added, ${removedEdgeKeys.length} removed — possible semantic change`,
        affectedEdges: removedEdgeKeys.slice(0, 10),
        detectedAt: now,
        suggestedActions: ['Investigate source changes', 'Consider full rebuild if semantics changed'],
      }));
    }

    // Compute summary and status
    const summary = {
      info: items.filter(i => i.severity === 'info').length,
      warning: items.filter(i => i.severity === 'warning').length,
      critical: items.filter(i => i.severity === 'critical').length,
    };

    const status: DriftReport['status'] =
      summary.critical > 0 ? 'fail' :
      summary.warning > 0 ? 'warning' :
      'pass';

    const nextActions = this.computeNextActions(items, status);

    return {
      workspaceId,
      baselineId: baseline.id,
      comparedWith: 'current',
      status,
      items,
      summary,
      nextActions,
    };
  }

  /**
   * Overwrite current baseline with latest graph state.
   * Used internally after successful builds.
   */
  async updateBaseline(workspaceId: string): Promise<void> {
    const snapshot = this.captureCurrentState(workspaceId);
    const baselinePath = this.getBaselinePath(workspaceId, 'current.json');
    await this.writeAtomicJSON(baselinePath, snapshot);
  }

  /**
   * Promotes current baseline to "previous" and snapshots current state as new baseline.
   * Requires verify pass unless opts.force is true.
   * Promotion is atomic (previous baseline preserved before promotion).
   */
  async promoteBaseline(workspaceId: string, opts?: { force?: boolean }): Promise<void> {
    if (!opts?.force) {
      const verifyPassed = await this.checkVerifyPass(workspaceId);
      if (!verifyPassed) {
        throw new Error(`${PipelineError.VERIFY_FAILED}: Cannot promote baseline without passing verification. Use force=true to override.`);
      }
    }

    const currentPath = this.getBaselinePath(workspaceId, 'current.json');
    const previousPath = this.getBaselinePath(workspaceId, 'previous.json');

    // Atomic promotion: preserve previous before overwriting
    if (fs.existsSync(currentPath)) {
      const currentContent = fs.readFileSync(currentPath, 'utf-8');
      await this.writeAtomicJSON(previousPath, JSON.parse(currentContent));
    }

    // Snapshot current state as new baseline
    const snapshot = this.captureCurrentState(workspaceId);
    await this.writeAtomicJSON(currentPath, snapshot);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private loadBaseline(workspaceId: string): BaselineSnapshot | null {
    const baselinePath = this.getBaselinePath(workspaceId, 'current.json');
    if (!fs.existsSync(baselinePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(baselinePath, 'utf-8');
      return JSON.parse(content) as BaselineSnapshot;
    } catch {
      return null;
    }
  }

  private getBaselinePath(workspaceId: string, filename: string): string {
    return path.join(this.baselinesDir, workspaceId, filename);
  }

  private createMissingBaselineReport(workspaceId: string): DriftReport {
    const now = new Date().toISOString();
    return {
      workspaceId,
      baselineId: 'none',
      status: 'fail',
      items: [{
        id: randomUUID(),
        workspaceId,
        baselineId: 'none',
        category: 'workspace',
        severity: 'critical',
        driftType: 'unknown',
        description: `No baseline found for workspace '${workspaceId}'. Run updateBaseline first.`,
        detectedAt: now,
        suggestedActions: ['Run updateBaseline to establish initial baseline'],
      }],
      summary: { info: 0, warning: 0, critical: 1 },
      nextActions: ['Establish baseline with updateBaseline command'],
    };
  }

  private captureCurrentState(workspaceId: string): BaselineSnapshot {
    const nodes = this.db.getAllNodesByWorkspace(workspaceId);
    const edges = this.db.getEdgesByWorkspace(workspaceId);

    const canonicalNodes = nodes.filter(n => n.graph_kind === 'canonical');
    const canonicalEdges = edges.filter(e => e.graph_kind === 'canonical');
    const exploratoryNodes = nodes.filter(n => n.graph_kind === 'exploratory');
    const exploratoryEdges = edges.filter(e => e.graph_kind === 'exploratory');
    const derivedNodes = nodes.filter(n => n.graph_kind === 'derived');
    const derivedEdges = edges.filter(e => e.graph_kind === 'derived');

    const nodeStableKeys = canonicalNodes
      .filter(n => n.stableKey != null)
      .map(n => n.stableKey!)
      .sort();

    const edgeStableKeys = canonicalEdges
      .filter(e => e.stableKey != null)
      .map(e => e.stableKey!)
      .sort();

    const adapterVersions = this.collectAdapterVersions(nodes);
    const artifactFiles = this.listArtifactFiles(workspaceId);

    return {
      id: randomUUID(),
      workspaceId,
      createdAt: new Date().toISOString(),
      canonicalNodeCount: canonicalNodes.length,
      canonicalEdgeCount: canonicalEdges.length,
      exploratoryNodeCount: exploratoryNodes.length,
      exploratoryEdgeCount: exploratoryEdges.length,
      derivedNodeCount: derivedNodes.length,
      derivedEdgeCount: derivedEdges.length,
      nodeStableKeys,
      edgeStableKeys,
      adapterVersions,
      artifactFiles,
      policyHash: this.computePolicyHash(workspaceId),
    };
  }

  private createDriftItem(partial: Omit<DriftItem, 'id'>): DriftItem {
    return {
      id: randomUUID(),
      ...partial,
    };
  }

  private checkMissingArtifacts(workspaceId: string, baseline: BaselineSnapshot): string[] {
    const missing: string[] = [];
    for (const file of baseline.artifactFiles) {
      if (!fs.existsSync(file)) {
        missing.push(file);
      }
    }
    return missing;
  }

  private checkWorkspaceBoundaryViolations(
    nodes: GraphNode[],
    edges: GraphEdge[],
    workspaceId: string,
  ): string[] {
    const violations: string[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    // Check edges referencing nodes not in this workspace's node set
    for (const edge of edges) {
      if (!nodeIds.has(edge.from_id) || !nodeIds.has(edge.to_id)) {
        violations.push(edge.id);
      }
    }

    // Check nodes that somehow have wrong workspace (shouldn't happen with DB filter, but defensive)
    for (const node of nodes) {
      if (node.workspace !== workspaceId) {
        violations.push(node.id);
      }
    }

    // Check edges with wrong workspace
    for (const edge of edges) {
      if (edge.workspace !== workspaceId) {
        violations.push(edge.id);
      }
    }

    return [...new Set(violations)];
  }

  private collectAdapterVersions(nodes: GraphNode[]): Record<string, string> {
    const versions: Record<string, string> = {};
    for (const node of nodes) {
      if (node.provenance?.source === 'parser' && node.provenance.artifact_source) {
        const adapterId = node.provenance.artifact_source;
        const version = (node.metadata as any)?.adapterVersion;
        if (adapterId && version && typeof version === 'string') {
          versions[adapterId] = version;
        }
      }
    }
    return versions;
  }

  private listArtifactFiles(workspaceId: string): string[] {
    const graphDir = path.join(this.baselinesDir, '..', workspaceId, 'graph');
    if (!fs.existsSync(graphDir)) {
      return [];
    }
    try {
      return fs.readdirSync(graphDir)
        .map(f => path.join(graphDir, f))
        .filter(f => fs.statSync(f).isFile());
    } catch {
      return [];
    }
  }

  private computePolicyHash(workspaceId: string): string | undefined {
    // Look for knowledge.config.yaml in common locations
    const configPaths = [
      path.join(process.cwd(), 'knowledge.config.yaml'),
      path.join(process.cwd(), 'knowledge.config.yml'),
    ];
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        // Simple hash based on content length and first/last chars
        return `policy-${content.length}-${hashString(content)}`;
      }
    }
    return undefined;
  }

  private computeAskReadinessScore(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (nodes.length === 0) return 0;
    // Score based on: node coverage, edge connectivity, provenance completeness
    const withProvenance = nodes.filter(n => n.provenance?.source).length;
    const connectedNodes = new Set<string>();
    for (const edge of edges) {
      connectedNodes.add(edge.from_id);
      connectedNodes.add(edge.to_id);
    }
    const connectivity = connectedNodes.size / Math.max(nodes.length, 1);
    const provenanceCoverage = withProvenance / nodes.length;
    return (connectivity * 0.5 + provenanceCoverage * 0.5);
  }

  private computeAgentContextReadinessScore(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (nodes.length === 0) return 0;
    // Score based on: symbol coverage, file coverage, edge density
    const withSymbol = nodes.filter(n => n.symbol).length;
    const withFile = nodes.filter(n => n.source_file).length;
    const edgeDensity = Math.min(edges.length / Math.max(nodes.length, 1), 3) / 3;
    const symbolCoverage = withSymbol / nodes.length;
    const fileCoverage = withFile / nodes.length;
    return (symbolCoverage * 0.4 + fileCoverage * 0.3 + edgeDensity * 0.3);
  }

  private async checkVerifyPass(workspaceId: string): Promise<boolean> {
    // Check for verification report in the reports directory
    const reportPaths = [
      path.join(this.baselinesDir, '..', workspaceId, 'reports', 'verification.json'),
      path.join(this.baselinesDir, '..', '..', 'reports', workspaceId, 'verification.json'),
    ];

    for (const reportPath of reportPaths) {
      if (fs.existsSync(reportPath)) {
        try {
          const content = fs.readFileSync(reportPath, 'utf-8');
          const report = JSON.parse(content);
          return report.passed === true;
        } catch {
          continue;
        }
      }
    }

    // No verification report found — fail closed
    return false;
  }

  private computeNextActions(items: DriftItem[], status: DriftReport['status']): string[] {
    const actions: string[] = [];

    if (status === 'fail') {
      actions.push('Run full rebuild to reconcile graph state');
    }

    const hasPolicyDrift = items.some(i => i.driftType === 'authority_policy_changed');
    if (hasPolicyDrift) {
      actions.push('Invalidate and rebuild graph artifacts (policy semantics changed)');
    }

    const hasMissingArtifacts = items.some(i => i.driftType === 'artifact_missing');
    if (hasMissingArtifacts) {
      actions.push('Regenerate missing artifacts');
    }

    const hasWikiStale = items.some(i => i.driftType === 'wiki_stale');
    if (hasWikiStale) {
      actions.push('Regenerate wiki pages');
    }

    if (status === 'warning' && !hasPolicyDrift) {
      actions.push('Review drift items and update baseline if acceptable');
    }

    if (status === 'pass') {
      actions.push('No action required — graph state matches baseline');
    }

    return actions;
  }

  private async writeAtomicJSON(filePath: string, data: unknown): Promise<void> {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = filePath + '.tmp';
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
