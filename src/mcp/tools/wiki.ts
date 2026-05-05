import { getDB } from '../../storage/GraphDB.js';
import { loadConfig, resolveDbPath } from '../../pipeline/config.js';
import { generateWiki } from '../../pipeline/stages/07_wiki.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import type { QueryMode } from '../../core/types.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { QueryResultFactory } from '../../core/graph/query/QueryResultFactory.js';
import { GenerateWikiInput, GetWikiPageInput } from '../schemas/index.js';

export function registerWikiTools(): void {
  registerTool({
    name: 'get_wiki_page',
    description: 'Get wiki page for node (trust-aware)',
    inputSchema: GetWikiPageInput,
    handler: async (args) => {
      const input = GetWikiPageInput.parse(args);
      const config = await loadConfig();
      const db = getDB(resolveDbPath(config));
      const engine = getTrustedQueryService(db).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.wiki.get_wiki_page' });
      const result = await engine.getNode(input.nodeId, operation, input.mode as QueryMode);
      const node = result.data.nodes[0];
      if (!node) return result;
      return QueryResultFactory.withMetadata(result, {
        markdown: `# ${node.label}\n\nType: ${node.type}\n\nSource: ${node.source_file ?? 'UNKNOWN'}\nTrust Level: ${node.trust_level ?? node.confidence_band}`,
      });
    },
  });

  registerTool({
    name: 'generate_wiki',
    description: 'Generate trust-aware wiki for workspace',
    inputSchema: GenerateWikiInput,
    handler: async (args) => {
      const input = GenerateWikiInput.parse(args);
      const config = await loadConfig();
      const db = getDB(resolveDbPath(config));
      const engine = getTrustedQueryService(db).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.wiki.generate_wiki' });
      const stats = await engine.getGraphStats(operation, input.mode as QueryMode);
      if (stats.status === 'POLICY_VIOLATION') return stats;
      const graph = await engine.getVisibleGraph(operation, input.mode as QueryMode);
      await generateWiki(input.workspaceId, graph.nodes, graph.edges, db, config);
      return stats;
    },
  });
}
