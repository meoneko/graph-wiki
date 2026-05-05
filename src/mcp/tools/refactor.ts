import { getDB } from '../../storage/GraphDB.js';
import { resolveDbPath } from '../../pipeline/config.js';
import { registerTool } from './runtime.js';
import { getTrustedQueryService } from '../../core/graph/query/TrustedQueryService.js';
import { OperationResolver } from '../../core/graph/query/OperationResolver.js';
import { FindDeadCodeInput, RenamePreviewInput } from '../schemas/index.js';

export function registerRefactorTools(): void {
  registerTool({
    name: 'rename_preview',
    description: 'Preview symbol rename impact',
    inputSchema: RenamePreviewInput,
    handler: async (args) => {
      const input = RenamePreviewInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.refactor.rename_preview' });
      return engine.renamePreview(input.oldSymbol, input.newSymbol, operation, 'authoritative');
    },
  });

  registerTool({
    name: 'find_dead_code',
    description: 'Find unreferenced symbols',
    inputSchema: FindDeadCodeInput,
    handler: async (args) => {
      const input = FindDeadCodeInput.parse(args);
      const engine = getTrustedQueryService(getDB(resolveDbPath())).engine(input.workspaceId);
      const operation = OperationResolver.resolve({ caller: 'mcp.refactor.find_dead_code' });
      return engine.findDeadCode(operation, 'authoritative');
    },
  });
}
