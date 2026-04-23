import type { GraphEdge } from '../../../core/types.js';

export function classifyEdge(edge: GraphEdge): 'critical' | 'normal' {
  return edge.type === 'node_uses_authority' ? 'critical' : 'normal';
}
