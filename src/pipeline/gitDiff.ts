import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface DiffEntry {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  hunks: Array<{ startLine: number; endLine: number }>;
}

export async function parseDiff(diffText: string): Promise<DiffEntry[]> {
  const lines = diffText.split(/\r?\n/);
  const entries: DiffEntry[] = [];
  let current: DiffEntry | undefined;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (current) entries.push(current);
      const m = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      const filePath = m?.[2] ?? 'unknown';
      current = { filePath, changeType: 'modified', hunks: [] };
      continue;
    }
    if (!current) continue;
    if (line.startsWith('new file mode')) current.changeType = 'added';
    if (line.startsWith('deleted file mode')) current.changeType = 'deleted';
    if (line.startsWith('@@')) {
      const m = line.match(/\+([0-9]+)(?:,([0-9]+))?/);
      const start = Number(m?.[1] ?? 1);
      const count = Number(m?.[2] ?? 1);
      current.hunks.push({ startLine: start, endLine: start + Math.max(0, count - 1) });
    }
  }

  if (current) entries.push(current);
  return entries;
}

export async function getDiff(repoPath: string, base: string, head: string): Promise<DiffEntry[]> {
  const { stdout } = await execFileAsync('git', ['-C', repoPath, 'diff', `${base}..${head}`]);
  return parseDiff(stdout);
}

export async function mapDiffToNodeIds(diff: DiffEntry[], finder: (filePath: string, lineStart: number, lineEnd: number) => Promise<string[]>): Promise<string[]> {
  const ids = new Set<string>();
  for (const entry of diff) {
    for (const hunk of entry.hunks) {
      const matches = await finder(entry.filePath, hunk.startLine, hunk.endLine);
      matches.forEach((id) => ids.add(id));
    }
  }
  return [...ids];
}
