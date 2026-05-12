import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectConfig, KnowledgeConfig } from './config.js';
import { resolveOutputPath } from './config.js';
import { canonicalizePath } from '../storage/pathUtils.js';

export interface ImportMapArtifact {
  version: number;
  projectId: string;
  generatedAt: string;
  combinedHash: string;
  perFileHashes: Record<string, string>;
  imports: Record<string, string[]>;
  exports: Record<string, string[]>;
  reExports: Record<string, string[]>;
}

function sha1(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function normalizeImportSource(fromFile: string, source: string): string | undefined {
  if (!source.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(fromFile), source);
  return canonicalizePath(base).replace(/\.(ts|tsx|js|jsx)$/i, '');
}

function extractImports(filePath: string, content: string): string[] {
  const out: string[] = [];
  for (const match of content.matchAll(/\bimport(?:\s+type)?[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g)) {
    const resolved = normalizeImportSource(filePath, match[1] ?? '');
    if (resolved) out.push(resolved);
  }
  for (const match of content.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const resolved = normalizeImportSource(filePath, match[1] ?? '');
    if (resolved) out.push(resolved);
  }
  return unique(out);
}

function extractExports(content: string): string[] {
  const out: string[] = [];
  for (const match of content.matchAll(/\bexport\s+(?:async\s+)?(?:function|class|const|let|var|interface|type)\s+([A-Za-z_$][\w$]*)/g)) {
    if (match[1]) out.push(match[1]);
  }
  for (const match of content.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const part of (match[1] ?? '').split(',')) {
      const name = part.trim().split(/\s+as\s+/i)[0]?.trim();
      if (name) out.push(name);
    }
  }
  return unique(out);
}

function extractReExports(filePath: string, content: string): string[] {
  const out: string[] = [];
  for (const match of content.matchAll(/\bexport\s+(?:\*|\{[^}]+\})\s+from\s*['"]([^'"]+)['"]/g)) {
    const resolved = normalizeImportSource(filePath, match[1] ?? '');
    if (resolved) out.push(resolved);
  }
  return unique(out);
}

export function getImportMapPath(config: KnowledgeConfig, projectId: string): string {
  return path.join(resolveOutputPath(config, 'state_root'), projectId, 'import-map.json');
}

export async function loadImportMap(config: KnowledgeConfig, projectId: string): Promise<ImportMapArtifact | undefined> {
  try {
    return JSON.parse(await readFile(getImportMapPath(config, projectId), 'utf-8')) as ImportMapArtifact;
  } catch {
    return undefined;
  }
}

export function isImportParticipating(artifact: ImportMapArtifact | undefined, normalizedFile: string): boolean {
  if (!artifact) return true;
  const withoutExt = normalizedFile.replace(/\.(ts|tsx|js|jsx)$/i, '');
  if (artifact.perFileHashes[normalizedFile] || artifact.perFileHashes[withoutExt]) return true;
  if (artifact.imports[normalizedFile] || artifact.exports[normalizedFile] || artifact.reExports[normalizedFile]) return true;
  if (artifact.imports[withoutExt] || artifact.exports[withoutExt] || artifact.reExports[withoutExt]) return true;
  return Object.values(artifact.imports).some((targets) => targets.includes(withoutExt) || targets.includes(normalizedFile)) ||
    Object.values(artifact.reExports).some((targets) => targets.includes(withoutExt) || targets.includes(normalizedFile));
}

export async function buildImportMap(project: ProjectConfig, config: KnowledgeConfig, files: string[]): Promise<ImportMapArtifact> {
  const perFileHashes: Record<string, string> = {};
  const imports: Record<string, string[]> = {};
  const exports: Record<string, string[]> = {};
  const reExports: Record<string, string[]> = {};

  for (const file of files.filter((f) => /\.(ts|tsx|js|jsx)$/i.test(f))) {
    const content = await readFile(file, 'utf-8');
    const normalized = canonicalizePath(file);
    perFileHashes[normalized] = sha1(content);
    imports[normalized] = extractImports(file, content);
    exports[normalized] = extractExports(content);
    reExports[normalized] = extractReExports(file, content);
  }

  const combinedHash = sha1(JSON.stringify(Object.entries(perFileHashes).sort(([a], [b]) => a.localeCompare(b))));
  const artifact: ImportMapArtifact = {
    version: 1,
    projectId: project.id,
    generatedAt: new Date().toISOString(),
    combinedHash,
    perFileHashes,
    imports,
    exports,
    reExports,
  };
  const artifactPath = getImportMapPath(config, project.id);
  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, JSON.stringify(artifact, null, 2), 'utf-8');
  return artifact;
}
