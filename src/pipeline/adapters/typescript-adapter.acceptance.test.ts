import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AdapterContext, GraphEdge, GraphNode, NormalizedFact } from '../../core/types.js';
import { TypeScriptAdapter } from './TypeScriptAdapter.js';
import { validateFacts } from '../stages/03_validate.js';
import { buildCanonicalGraph } from '../stages/04a_build_canonical.js';

const fixturePath = fileURLToPath(new URL('../../scanner/languages/typescript/__fixtures__/component.tsx', import.meta.url));

function makeStubDb() {
  const facts: NormalizedFact[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  return {
    facts,
    nodes,
    edges,
    upsertFact(fact: NormalizedFact) { facts.push(fact); },
    upsertNode(node: GraphNode) { nodes.push(node); },
    upsertEdge(edge: GraphEdge) { edges.push(edge); },
    transaction(fn: () => void) { fn(); },
  };
}

describe('TypeScriptAdapter', () => {
  it('emits only tree-sitter parser facts and promotes them to canonical graph', async () => {
    await readFile(fixturePath, 'utf-8');
    const adapter = new TypeScriptAdapter();
    const context: AdapterContext = {
      workspaceId: 'ws',
      projectId: 'app',
      projectRoot: fileURLToPath(new URL('../../../../', import.meta.url)),
    };

    const parsed = await adapter.parse([fixturePath]);
    const candidates = await adapter.extract(parsed, context);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.extractor === 'ts_tree_sitter_parser')).toBe(true);
    expect(candidates.some((candidate) => candidate.extractor === 'ts_react_adapter')).toBe(false);
    expect(candidates.some((candidate) => candidate.candidate_type === 'ts_api_endpoint')).toBe(false);
    expect(candidates.some((candidate) => candidate.domain !== undefined)).toBe(true);

    const db = makeStubDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validated = await validateFacts(candidates, 'ws', db as any);
    expect(validated.facts.every((fact) => fact.trust_level === 'AUTHORITATIVE')).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonical = await buildCanonicalGraph(validated.facts, 'ws', db as any);
    expect(canonical.nodes.some((node) => node.type === 'ts_component')).toBe(true);
  });
});
