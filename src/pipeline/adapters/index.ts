import { globalAdapterRegistry } from './registry.js';
import { CSharpAdapter } from './CSharpAdapter.js';
import { TSReactAdapter } from './TSReactAdapter.js';

globalAdapterRegistry.register('csharp', /\.cs$/i, () => new CSharpAdapter());
globalAdapterRegistry.register('tsreact', /\.(ts|tsx|js|jsx)$/i, () => new TSReactAdapter());

export { globalAdapterRegistry };
export type { IProjectAdapter } from './IProjectAdapter.js';
