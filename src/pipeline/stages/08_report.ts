import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';

export async function writeReport(workspaceId: string, report: unknown, config: KnowledgeConfig): Promise<void> {
  const root = path.join(resolveOutputPath(config, 'reports_root'), workspaceId);
  await mkdir(root, { recursive: true });

  await writeFile(path.join(root, 'verification.json'), JSON.stringify(report, null, 2), 'utf-8');

  const verification = report as { passed?: boolean; issues?: string[]; nodeCount?: number; edgeCount?: number };
  const digest = {
    workspaceId,
    generatedAt: new Date().toISOString(),
    summary: verification.passed ? 'PASS' : 'FAIL',
    nodeCount: verification.nodeCount ?? 0,
    edgeCount: verification.edgeCount ?? 0,
    issueCount: verification.issues?.length ?? 0,
  };

  const lint = {
    workspaceId,
    generatedAt: new Date().toISOString(),
    unknownToken: config.scheduler?.reporting?.unknown_token ?? 'UNKNOWN',
    inferredToken: config.scheduler?.reporting?.inferred_token ?? 'INFERRED_LOW_CONFIDENCE',
    violations: verification.issues ?? [],
  };

  await Promise.all([
    writeFile(path.join(root, 'digest.json'), JSON.stringify(digest, null, 2), 'utf-8'),
    writeFile(path.join(root, 'lint.json'), JSON.stringify(lint, null, 2), 'utf-8'),
  ]);
}
