import type { QueryMode, ReasoningPath, TrustLevel } from '../../types.js';

export interface TraceEvent {
    type: 'path_discovered' | 'path_rejected' | 'policy_violation' | 'node_hidden';
    message: string;
    details?: any;
}

export class ReasoningTrace {
    private events: TraceEvent[] = [];

    constructor(private readonly workspaceId: string, private readonly mode: QueryMode) { }

    logDiscovered(path: ReasoningPath): void {
        this.events.push({
            type: 'path_discovered',
            message: `Found path of length ${path.edges.length} with trust level: ${path.trust_level}`,
            details: { pathId: path.path_id, trust: path.trust_level },
        });
    }

    logRejected(path: ReasoningPath, reason: string): void {
        this.events.push({
            type: 'path_rejected',
            message: `Path rejected: ${reason}`,
            details: { pathId: path.path_id, reason },
        });
    }

    logViolation(nodeId: string, trust: string, requiredMode: string): void {
        this.events.push({
            type: 'policy_violation',
            message: `Policy violation: Node ${nodeId} (${trust}) not allowed in ${requiredMode} mode`,
        });
    }

    getSummary() {
        return {
            workspaceId: this.workspaceId,
            mode: this.mode,
            totalEvents: this.events.length,
            discoveredCount: this.events.filter(e => e.type === 'path_discovered').length,
            rejectedCount: this.events.filter(e => e.type === 'path_rejected').length,
            violations: this.events.filter(e => e.type === 'policy_violation').length,
            events: this.events,
        };
    }
}
