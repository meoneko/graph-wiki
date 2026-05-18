import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrustEventEmitter, type TrustEvent } from './TrustEventEmitter.js';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function createTmpDir(): string {
    const dir = path.join(os.tmpdir(), `trust-emitter-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    return dir;
}

function makeEvent(overrides: Partial<TrustEvent> = {}): TrustEvent {
    return {
        timestamp: '2024-01-01T00:00:00.000Z',
        workspace_id: 'test-workspace',
        operation: 'ask',
        mode: 'authoritative',
        status: 'OK',
        codes: [],
        warnings: [],
        selected_path_count: 1,
        ...overrides,
    };
}

describe('TrustEventEmitter', () => {
    let tmpDir: string;

    beforeEach(() => {
        TrustEventEmitter.resetInstance();
        tmpDir = createTmpDir();
    });

    afterEach(() => {
        TrustEventEmitter.resetInstance();
        try {
            rmSync(tmpDir, { recursive: true, force: true });
        } catch {
            // cleanup best-effort
        }
    });

    describe('singleton pattern', () => {
        it('returns the same instance on multiple calls', () => {
            const a = TrustEventEmitter.getInstance();
            const b = TrustEventEmitter.getInstance();
            expect(a).toBe(b);
        });

        it('resets instance correctly', () => {
            const a = TrustEventEmitter.getInstance();
            TrustEventEmitter.resetInstance();
            const b = TrustEventEmitter.getInstance();
            expect(a).not.toBe(b);
        });
    });

    describe('configure()', () => {
        it('sets the reports directory', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();
            expect(emitter.getReportsDir()).toBe(tmpDir);
        });

        it('configure before getInstance works', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();
            expect(emitter.getReportsDir()).toBe(tmpDir);
        });
    });

    describe('emit() and JSONL persistence', () => {
        it('writes event to workspace-scoped JSONL file', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            const event = makeEvent({ workspace_id: 'my-workspace' });
            emitter.emitTrustEvent(event);

            const eventsPath = path.join(tmpDir, 'my-workspace', 'trust-events.jsonl');
            expect(existsSync(eventsPath)).toBe(true);

            const content = readFileSync(eventsPath, 'utf-8').trim();
            const parsed = JSON.parse(content);
            expect(parsed.workspace_id).toBe('my-workspace');
            expect(parsed.operation).toBe('ask');
            expect(parsed.mode).toBe('authoritative');
            expect(parsed.status).toBe('OK');
            expect(parsed.selected_path_count).toBe(1);
        });

        it('appends multiple events to the same JSONL file', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({ status: 'OK' }));
            emitter.emitTrustEvent(makeEvent({ status: 'INSUFFICIENT_EVIDENCE' }));
            emitter.emitTrustEvent(makeEvent({ status: 'POLICY_VIOLATION' }));

            const eventsPath = path.join(tmpDir, 'test-workspace', 'trust-events.jsonl');
            const lines = readFileSync(eventsPath, 'utf-8').trim().split('\n');
            expect(lines).toHaveLength(3);

            expect(JSON.parse(lines[0]!).status).toBe('OK');
            expect(JSON.parse(lines[1]!).status).toBe('INSUFFICIENT_EVIDENCE');
            expect(JSON.parse(lines[2]!).status).toBe('POLICY_VIOLATION');
        });

        it('isolates events by workspace', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({ workspace_id: 'ws-a' }));
            emitter.emitTrustEvent(makeEvent({ workspace_id: 'ws-b' }));

            const pathA = path.join(tmpDir, 'ws-a', 'trust-events.jsonl');
            const pathB = path.join(tmpDir, 'ws-b', 'trust-events.jsonl');

            expect(existsSync(pathA)).toBe(true);
            expect(existsSync(pathB)).toBe(true);

            const linesA = readFileSync(pathA, 'utf-8').trim().split('\n');
            const linesB = readFileSync(pathB, 'utf-8').trim().split('\n');
            expect(linesA).toHaveLength(1);
            expect(linesB).toHaveLength(1);
        });

        it('emits trust_event on the EventEmitter', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            const received: TrustEvent[] = [];
            emitter.onTrustEvent((e) => received.push(e));

            const event = makeEvent();
            emitter.emitTrustEvent(event);

            expect(received).toHaveLength(1);
            expect(received[0]).toEqual(event);
        });
    });

    describe('TrustEvent interface', () => {
        it('includes all required fields per design contract', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            const event: TrustEvent = {
                timestamp: '2024-06-15T10:30:00.000Z',
                workspace_id: 'production-ws',
                operation: 'impact',
                mode: 'mixed_safe',
                status: 'EXPLORATORY_ONLY',
                codes: ['EXPLORATORY_USED'],
                warnings: ['RESULT_BELOW_REQUESTED_TRUST_LEVEL'],
                selected_path_count: 3,
            };

            emitter.emitTrustEvent(event);

            const eventsPath = path.join(tmpDir, 'production-ws', 'trust-events.jsonl');
            const parsed = JSON.parse(readFileSync(eventsPath, 'utf-8').trim());

            expect(parsed.timestamp).toBe('2024-06-15T10:30:00.000Z');
            expect(parsed.workspace_id).toBe('production-ws');
            expect(parsed.operation).toBe('impact');
            expect(parsed.mode).toBe('mixed_safe');
            expect(parsed.status).toBe('EXPLORATORY_ONLY');
            expect(parsed.codes).toEqual(['EXPLORATORY_USED']);
            expect(parsed.warnings).toEqual(['RESULT_BELOW_REQUESTED_TRUST_LEVEL']);
            expect(parsed.selected_path_count).toBe(3);
        });
    });

    describe('writeSummary()', () => {
        it('writes trust-summary.json for a workspace', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({ status: 'OK', operation: 'ask' }));
            emitter.emitTrustEvent(makeEvent({ status: 'INSUFFICIENT_EVIDENCE', operation: 'impact' }));

            emitter.writeSummary('test-workspace');

            const summaryPath = path.join(tmpDir, 'test-workspace', 'trust-summary.json');
            expect(existsSync(summaryPath)).toBe(true);

            const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
            expect(summary.totalEvents).toBe(2);
            expect(summary.byStatus['OK']).toBe(1);
            expect(summary.byStatus['INSUFFICIENT_EVIDENCE']).toBe(1);
            expect(summary.byOperation['ask']).toBe(1);
            expect(summary.byOperation['impact']).toBe(1);
        });

        it('writes global trust-summary.json when no workspace specified', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent());
            emitter.writeSummary();

            const summaryPath = path.join(tmpDir, 'trust-summary.json');
            expect(existsSync(summaryPath)).toBe(true);

            const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
            expect(summary.totalEvents).toBe(1);
        });

        it('tracks metrics per requirements 15.4', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            // Emit various events to test metric tracking
            emitter.emitTrustEvent(makeEvent({ status: 'OK', mode: 'authoritative' }));
            emitter.emitTrustEvent(makeEvent({ status: 'INSUFFICIENT_EVIDENCE', mode: 'authoritative' }));
            emitter.emitTrustEvent(makeEvent({ status: 'POLICY_VIOLATION', codes: ['AUTHORITY_CHAIN_BROKEN'] }));
            emitter.emitTrustEvent(makeEvent({ status: 'OK', mode: 'mixed_safe', codes: ['EXPLORATORY_USED'] }));

            const summary = emitter.getSummary();

            expect(summary.totalEvents).toBe(4);
            expect(summary.insufficientEvidenceRate).toBe(1 / 4);
            expect(summary.policyViolationCount).toBe(1);
            expect(summary.authorityChainFailureCount).toBe(1);
            expect(summary.exploratoryUsageRate).toBe(1 / 4); // 1 mixed_safe out of 4
            expect(summary.lastUpdated).toBeTruthy();
        });

        it('tracks validation failures', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({ codes: ['CANONICAL_PROVENANCE_MISSING'] }));
            emitter.emitTrustEvent(makeEvent({ codes: ['INVALID_EDGE_TYPE'] }));

            const summary = emitter.getSummary();
            expect(summary.validationFailureCount).toBe(2);
        });
    });

    describe('getSummary()', () => {
        it('returns a copy of the summary state', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent());

            const summary1 = emitter.getSummary();
            const summary2 = emitter.getSummary();

            expect(summary1).toEqual(summary2);
            expect(summary1).not.toBe(summary2); // different object references
        });

        it('starts with empty summary', () => {
            const emitter = TrustEventEmitter.getInstance();
            const summary = emitter.getSummary();

            expect(summary.totalEvents).toBe(0);
            expect(summary.byStatus).toEqual({});
            expect(summary.byOperation).toEqual({});
            expect(summary.byMode).toEqual({});
            expect(summary.exploratoryUsageRate).toBe(0);
            expect(summary.insufficientEvidenceRate).toBe(0);
            expect(summary.policyViolationCount).toBe(0);
            expect(summary.authorityChainFailureCount).toBe(0);
            expect(summary.validationFailureCount).toBe(0);
        });
    });

    describe('JSONL format compliance', () => {
        it('each line in the JSONL file is valid JSON', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({ status: 'OK' }));
            emitter.emitTrustEvent(makeEvent({ status: 'INSUFFICIENT_EVIDENCE', codes: ['EXPLORATORY_USED'] }));
            emitter.emitTrustEvent(makeEvent({ status: 'POLICY_VIOLATION', warnings: ['some warning'] }));

            const eventsPath = path.join(tmpDir, 'test-workspace', 'trust-events.jsonl');
            const content = readFileSync(eventsPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim().length > 0);

            expect(lines).toHaveLength(3);
            for (const line of lines) {
                expect(() => JSON.parse(line)).not.toThrow();
            }
        });

        it('each JSONL line contains all required TrustEvent fields', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({
                operation: 'lineage',
                mode: 'mixed_safe',
                status: 'EXPLORATORY_ONLY',
                codes: ['EXPLORATORY_USED'],
                warnings: ['RESULT_BELOW_REQUESTED_TRUST_LEVEL'],
                selected_path_count: 5,
            }));

            const eventsPath = path.join(tmpDir, 'test-workspace', 'trust-events.jsonl');
            const line = readFileSync(eventsPath, 'utf-8').trim();
            const parsed = JSON.parse(line);

            // Verify all required fields per Requirements 15.3
            expect(parsed).toHaveProperty('timestamp');
            expect(parsed).toHaveProperty('workspace_id');
            expect(parsed).toHaveProperty('operation');
            expect(parsed).toHaveProperty('mode');
            expect(parsed).toHaveProperty('status');
            expect(parsed).toHaveProperty('codes');
            expect(parsed).toHaveProperty('warnings');
            expect(parsed).toHaveProperty('selected_path_count');

            // Verify types
            expect(typeof parsed.timestamp).toBe('string');
            expect(typeof parsed.workspace_id).toBe('string');
            expect(typeof parsed.operation).toBe('string');
            expect(typeof parsed.mode).toBe('string');
            expect(typeof parsed.status).toBe('string');
            expect(Array.isArray(parsed.codes)).toBe(true);
            expect(Array.isArray(parsed.warnings)).toBe(true);
            expect(typeof parsed.selected_path_count).toBe('number');
        });

        it('JSONL file uses newline-delimited format (one JSON object per line)', () => {
            TrustEventEmitter.configure(tmpDir);
            const emitter = TrustEventEmitter.getInstance();

            emitter.emitTrustEvent(makeEvent({ status: 'OK' }));
            emitter.emitTrustEvent(makeEvent({ status: 'PARTIAL' }));

            const eventsPath = path.join(tmpDir, 'test-workspace', 'trust-events.jsonl');
            const content = readFileSync(eventsPath, 'utf-8');

            // File should end with a newline
            expect(content.endsWith('\n')).toBe(true);

            // No line should contain a nested newline within the JSON
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            for (const line of lines) {
                expect(line).not.toContain('\n');
                // Each line should be a single-line JSON (no pretty-printing)
                const parsed = JSON.parse(line);
                expect(JSON.stringify(parsed)).toBe(line);
            }
        });
    });
});
