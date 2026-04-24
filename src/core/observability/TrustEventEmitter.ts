import { EventEmitter } from 'node:events';
import type { QueryMode, ReasoningPath, TrustLevel } from '../types.js';

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

    private constructor() {
        super();
    }

    static getInstance(): TrustEventEmitter {
        if (!TrustEventEmitter.instance) {
            TrustEventEmitter.instance = new TrustEventEmitter();
        }
        return TrustEventEmitter.instance;
    }

    emitTrustEvent(event: TrustEvent): void {
        this.emit('trust_event', event);
        // Also log to console in a structured way for now
        console.log(`[TrustEvent][${event.type}] ${event.message}`, JSON.stringify(event.meta));
    }

    onTrustEvent(handler: (event: TrustEvent) => void): void {
        this.on('trust_event', handler);
    }
}
