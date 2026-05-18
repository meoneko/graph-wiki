import { EventEmitter } from 'node:events';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { DecisionStatus, OperationType, QueryMode } from '../types.js';

/**
 * Trust event schema per design contract.
 * Emitted for every trust-relevant operation with stable fields.
 *
 * @see Requirements 15.3
 */
export interface TrustEvent {
    timestamp: string;
    workspace_id: string;
    operation: OperationType;
    mode: QueryMode;
    status: DecisionStatus;
    codes: string[];
    warnings: string[];
    selected_path_count: number;
}

/**
 * Trust summary snapshot written to trust-summary.json.
 * Aggregates metrics for observability dashboards.
 *
 * @see Requirements 15.2, 15.4
 */
export interface TrustSummary {
    totalEvents: number;
    byStatus: Record<string, number>;
    byOperation: Record<string, number>;
    byMode: Record<string, number>;
    exploratoryUsageRate: number;
    insufficientEvidenceRate: number;
    policyViolationCount: number;
    authorityChainFailureCount: number;
    validationFailureCount: number;
    lastUpdated: string;
}

/**
 * Local-first observability of trust outcomes via JSONL event streams.
 *
 * Singleton pattern with `configure(reportsDir)` and `getInstance()`.
 * Writes workspace-scoped JSONL event files and JSON summary snapshots.
 *
 * @see Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
export class TrustEventEmitter extends EventEmitter {
    private static instance: TrustEventEmitter;
    private reportsDir: string;
    private summary: TrustSummary;

    private constructor() {
        super();
        this.reportsDir = path.resolve(process.cwd(), 'knowledge/reports');
        this.summary = TrustEventEmitter.createEmptySummary();
    }

    /**
     * Configure the reports directory for event persistence.
     * Must be called before emitting events to set the correct output path.
     */
    static configure(reportsDir: string): void {
        const instance = TrustEventEmitter.getInstance();
        instance.reportsDir = reportsDir;
    }

    /**
     * Get the singleton instance of TrustEventEmitter.
     */
    static getInstance(): TrustEventEmitter {
        if (!TrustEventEmitter.instance) {
            TrustEventEmitter.instance = new TrustEventEmitter();
        }
        return TrustEventEmitter.instance;
    }

    /**
     * Reset the singleton instance (for testing purposes).
     * @internal
     */
    static resetInstance(): void {
        TrustEventEmitter.instance = undefined as unknown as TrustEventEmitter;
    }

    /**
     * Emit a trust event. Persists to workspace-scoped JSONL file and updates summary.
     */
    override emit(event: TrustEvent): boolean;
    override emit(eventName: string | symbol, ...args: unknown[]): boolean;
    override emit(eventOrName: TrustEvent | string | symbol, ...args: unknown[]): boolean {
        if (typeof eventOrName === 'object' && eventOrName !== null && 'workspace_id' in eventOrName) {
            const event = eventOrName as TrustEvent;
            super.emit('trust_event', event);
            this.persist(event);
            this.updateSummary(event);
            return true;
        }
        return super.emit(eventOrName as string | symbol, ...args);
    }

    /**
     * Convenience method to emit a trust event (backward-compatible API).
     */
    emitTrustEvent(event: TrustEvent): void {
        this.emit(event);
    }

    /**
     * Register a handler for trust events.
     */
    onTrustEvent(handler: (event: TrustEvent) => void): void {
        this.on('trust_event', handler);
    }

    /**
     * Write the current summary snapshot to trust-summary.json for the given workspace.
     * If no workspace is specified, writes a global summary.
     */
    writeSummary(workspaceId?: string): void {
        try {
            const summaryDir = workspaceId
                ? path.join(this.reportsDir, workspaceId)
                : this.reportsDir;
            mkdirSync(summaryDir, { recursive: true });
            const summaryPath = path.join(summaryDir, 'trust-summary.json');
            writeFileSync(summaryPath, JSON.stringify(this.summary, null, 2), 'utf-8');
        } catch {
            // Observability must not make trusted query execution unavailable.
        }
    }

    /**
     * Get the current summary state (for testing/inspection).
     */
    getSummary(): Readonly<TrustSummary> {
        return { ...this.summary };
    }

    /**
     * Get the configured reports directory.
     */
    getReportsDir(): string {
        return this.reportsDir;
    }

    private persist(event: TrustEvent): void {
        try {
            const workspaceDir = path.join(this.reportsDir, event.workspace_id);
            mkdirSync(workspaceDir, { recursive: true });
            const eventsPath = path.join(workspaceDir, 'trust-events.jsonl');
            appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, 'utf-8');
        } catch {
            // Observability must not make trusted query execution unavailable.
        }
    }

    private updateSummary(event: TrustEvent): void {
        this.summary.totalEvents += 1;
        this.summary.byStatus[event.status] = (this.summary.byStatus[event.status] ?? 0) + 1;
        this.summary.byOperation[event.operation] = (this.summary.byOperation[event.operation] ?? 0) + 1;
        this.summary.byMode[event.mode] = (this.summary.byMode[event.mode] ?? 0) + 1;

        // Track specific metrics per requirements 15.4
        if (event.codes.includes('EXPLORATORY_USED')) {
            this.summary.exploratoryUsageRate = this.computeRate('EXPLORATORY_USED', event.codes);
        }
        if (event.status === 'INSUFFICIENT_EVIDENCE') {
            this.summary.insufficientEvidenceRate =
                (this.summary.byStatus['INSUFFICIENT_EVIDENCE'] ?? 0) / this.summary.totalEvents;
        }
        if (event.status === 'POLICY_VIOLATION') {
            this.summary.policyViolationCount = this.summary.byStatus['POLICY_VIOLATION'] ?? 0;
        }
        if (event.codes.includes('AUTHORITY_CHAIN_BROKEN')) {
            this.summary.authorityChainFailureCount += 1;
        }
        if (event.codes.includes('CANONICAL_PROVENANCE_MISSING') || event.codes.includes('INVALID_EDGE_TYPE')) {
            this.summary.validationFailureCount += 1;
        }

        // Recompute exploratory usage rate
        this.summary.exploratoryUsageRate =
            this.summary.totalEvents > 0
                ? (this.summary.byMode['mixed_safe'] ?? 0) / this.summary.totalEvents
                : 0;
        this.summary.insufficientEvidenceRate =
            this.summary.totalEvents > 0
                ? (this.summary.byStatus['INSUFFICIENT_EVIDENCE'] ?? 0) / this.summary.totalEvents
                : 0;

        this.summary.lastUpdated = event.timestamp;
    }

    private computeRate(code: string, _codes: string[]): number {
        // Rate is computed from summary totals, not individual event
        return this.summary.totalEvents > 0
            ? (this.summary.byMode['mixed_safe'] ?? 0) / this.summary.totalEvents
            : 0;
    }

    private static createEmptySummary(): TrustSummary {
        return {
            totalEvents: 0,
            byStatus: {},
            byOperation: {},
            byMode: {},
            exploratoryUsageRate: 0,
            insufficientEvidenceRate: 0,
            policyViolationCount: 0,
            authorityChainFailureCount: 0,
            validationFailureCount: 0,
            lastUpdated: '',
        };
    }
}
