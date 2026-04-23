import type { GraphNode, GraphEdge } from '../core/types.js';

export function exportNeo4j(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const statements: string[] = [];
  for (const n of nodes) {
    statements.push(`MERGE (n:Node {id: '${n.id}'}) SET n.label='${escape(n.label)}', n.type='${escape(n.type)}';`);
  }
  for (const e of edges) {
    statements.push(`MATCH (a:Node {id: '${e.from_id}'}), (b:Node {id: '${e.to_id}'}) MERGE (a)-[:${safeRel(e.type)}]->(b);`);
  }
  return statements;
}

function escape(value: string): string {
  return value.replaceAll("'", "\\'");
}

function safeRel(rel: string): string {
  return rel.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
}
