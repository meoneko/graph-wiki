import { EventEmitter } from 'node:events';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { QueryMode } from '../types.js';

export interface TrustEvent {
    workspaceId: string;
    timestamp: string;
    mode: QueryMode;
    type: 'TRUST_REASONING_START' | 'TRUST_REASONING_SUCCESS' | 'TRUST_REASONING_FAILURE' | 'TRUST_POLICY_VIOLATION' | 'PATH_DISCOVERED';
    message: string;
    meta?: any;
}

export class TrustEventEmitter extends EventEmitter {
    private static instance: TrustEventEmitter;
    private eventsPath: string;
    private summaryPath: string;
    private summary = {
        totalEvents: 0,
        byType: {} as Record<string, number>,
        byMode: {} as Record<string, number>,
        warnings: [] as string[],
    };

    private constructor() {
        super();
        const defaultDir = path.resolve(process.cwd(), 'knowledge/reports');
        this.eventsPath = path.join(defaultDir, 'trust-events.jsonl');
        this.summaryPath = path.join(defaultDir, 'trust-summary.json');
    }

    static getInstance(): TrustEventEmitter {
        if (!TrustEventEmitter.instance) {
            TrustEventEmitter.instance = new TrustEventEmitter();
        }
        return TrustEventEmitter.instance;
    }

    static configure(reportsDir: string): void {
        const instance = TrustEventEmitter.getInstance();
        instance.eventsPath = path.join(reportsDir, 'trust-events.jsonl');
        instance.summaryPath = path.join(reportsDir, 'trust-summary.json');
    }

    emitTrustEvent(event: TrustEvent): void {
        this.emit('trust_event', event);
        this.persist(event);
        console.log(`[TrustEvent][${event.type}] ${event.message}`, JSON.stringify(event.meta));
    }

    onTrustEvent(handler: (event: TrustEvent) => void): void {
        this.on('trust_event', handler);
    }

    private persist(event: TrustEvent): void {
        try {
            mkdirSync(path.dirname(this.eventsPath), { recursive: true });
            appendFileSync(this.eventsPath, `${JSON.stringify(event)}\n`, 'utf-8');
            this.summary.totalEvents += 1;
            this.summary.byType[event.type] = (this.summary.byType[event.type] ?? 0) + 1;
            this.summary.byMode[event.mode] = (this.summary.byMode[event.mode] ?? 0) + 1;
            const warnings = Array.isArray(event.meta?.warnings) ? event.meta.warnings : [];
            this.summary.warnings = [...new Set([...this.summary.warnings, ...warnings])];
            writeFileSync(this.summaryPath, JSON.stringify(this.summary, null, 2), 'utf-8');
        } catch {
            // Observability must not make trusted query execution unavailable.
        }
    }
}
