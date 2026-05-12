import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';

export interface GitStyleIgnoreFilter {
  isIgnored(relativePath: string): boolean;
}

function normalizePath(input: string): string {
  return input.replace(/\\/g, '/').replace(/^\/+/, '');
}

function readIgnoreFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  return readFileSync(filePath, 'utf-8');
}

export function createGitStyleIgnoreFilter(projectRoot: string): GitStyleIgnoreFilter {
  const ig = ignore();

  // Ordering is intentional: .crgignore is added after .gitignore, so its
  // negation rules can re-include files excluded by .gitignore. This is still
  // pass-2 only; it cannot resurrect files removed by fast-glob built-ins or
  // sources.exclude in stage 02.
  for (const fileName of ['.gitignore', '.crgignore']) {
    const content = readIgnoreFile(path.join(projectRoot, fileName));
    if (content) ig.add(content);
  }

  return {
    isIgnored(relativePath: string): boolean {
      return ig.ignores(normalizePath(relativePath));
    },
  };
}
