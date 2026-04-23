import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface RegisteredRepo {
  id: string;
  path: string;
  addedAt: string;
}

const REGISTRY_FILE = path.join(process.cwd(), '.code-review-graph', 'repos.json');

export async function listRegisteredRepos(): Promise<RegisteredRepo[]> {
  try {
    const raw = await readFile(REGISTRY_FILE, 'utf-8');
    return JSON.parse(raw) as RegisteredRepo[];
  } catch {
    return [];
  }
}

export async function registerRepo(repoPath: string): Promise<RegisteredRepo> {
  await mkdir(path.dirname(REGISTRY_FILE), { recursive: true });
  const repos = await listRegisteredRepos();
  const existing = repos.find((r) => r.path === repoPath);
  if (existing) return existing;

  const repo: RegisteredRepo = {
    id: `repo_${repos.length + 1}`,
    path: repoPath,
    addedAt: new Date().toISOString(),
  };
  repos.push(repo);
  await writeFile(REGISTRY_FILE, JSON.stringify(repos, null, 2), 'utf-8');
  return repo;
}
