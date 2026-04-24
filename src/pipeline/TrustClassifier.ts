import type { DecisionStatus, TrustLevel } from '../core/types.js';

export interface TrustClassification {
    trust_level: TrustLevel;
    decision_status: DecisionStatus;
}

export class TrustClassifier {
    /**
     * Deterministically classifies a fact based on its extractor/source origin.
     * This is the authoritative mapping defining the system's trust boundaries.
     */
    static classify(extractor: string): TrustClassification {
        const e = extractor.toLowerCase();

        // 1. Authoritative: Direct static analysis from source code
        if (e.includes('parser-static') || e.includes('parser-verified') || e === 'ts_react_adapter' || e === 'csharp_adapter') {
            return {
                trust_level: 'AUTHORITATIVE',
                decision_status: 'OK',
            };
        }

        // 2. Derived: Results of cross-file analysis or composition rules
        if (e.includes('analysis') || e.includes('composition') || e.includes('enrichment')) {
            return {
                trust_level: 'DERIVED',
                decision_status: 'OK',
            };
        }

        // 3. Exploratory: Heuristics, AI, or uncertain traces
        if (e.includes('ai') || e.includes('heuristic') || e.includes('uncertain')) {
            return {
                trust_level: 'EXPLORATORY',
                decision_status: 'AMBIGUOUS',
            };
        }

        // Default to exploratory/ambiguous for unknown sources (fail-closed reasoning)
        return {
            trust_level: 'EXPLORATORY',
            decision_status: 'INSUFFICIENT_EVIDENCE',
        };
    }
}
