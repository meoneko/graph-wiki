import type { GraphImpactTraversal } from '../types.js';

export interface ReasoningInput {
  traversal: GraphImpactTraversal;
}

export interface ReasoningOutput {
  riskScore: number;
  reasons: string[];
}
