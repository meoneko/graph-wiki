import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const sourceDir = join(root, 'node_modules', '@vscode', 'tree-sitter-wasm', 'wasm');
const destDir = join(root, 'dist', 'scanner', 'grammars');

const grammarFiles = [
  'tree-sitter-c-sharp.wasm',
  'tree-sitter-typescript.wasm',
  'tree-sitter-tsx.wasm',
  'tree-sitter-javascript.wasm',
  'tree-sitter-java.wasm',
];

await mkdir(destDir, { recursive: true });

await Promise.all(grammarFiles.map((file) => copyFile(
  join(sourceDir, file),
  join(destDir, file),
)));
