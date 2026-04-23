import type { ReasoningInput, ReasoningOutput } from './types.js';

export class ReasoningEngine {
  run(input: ReasoningInput): ReasoningOutput {
    const edges = input.traversal.edges.length;
    const nodes = input.traversal.nodes.length;
    const score = Math.min(100, edges * 2 + nodes);
    return {
      riskScore: score,
      reasons: [`nodes=${nodes}`, `edges=${edges}`],
    };
  }
}
