import { globalAdapterRegistry } from './registry.js';
import { CSharpAdapter } from './CSharpAdapter.js';
import { JavaAdapter } from './JavaAdapter.js';
import { TypeScriptAdapter } from './TypeScriptAdapter.js';
import { StructuredFileAdapter } from './StructuredFileAdapter.js';

globalAdapterRegistry.register('csharp', /\.cs$/i, () => new CSharpAdapter());
globalAdapterRegistry.register('java', /\.java$/i, () => new JavaAdapter());
globalAdapterRegistry.register('typescript', /\.(ts|tsx|js|jsx)$/i, () => new TypeScriptAdapter());
globalAdapterRegistry.register('structured', /(?:\.json|\.ya?ml|\.toml|\.env|\.sql|\.tf|\.graphql|\.gql|\.md|Dockerfile|\.dockerfile)$/i, () => new StructuredFileAdapter());

export { globalAdapterRegistry };
export type { IProjectAdapter } from './IProjectAdapter.js';
