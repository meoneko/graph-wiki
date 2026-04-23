import { normalize, resolve } from 'node:path';

export function canonicalizePath(filePath: string, cwd?: string): string {
  return normalize(resolve(cwd ?? process.cwd(), filePath));
}
