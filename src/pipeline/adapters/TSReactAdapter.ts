import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';

interface ParsedTsFile {
  filePath: string;
  content: string;
}

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

function makeEvidence(filePath: string, line: number, excerpt: string): EvidenceSpan {
  return {
    evidence_id: stableId(filePath, String(line), excerpt),
    source_file: filePath,
    line_start: line,
    line_end: line,
    excerpt,
    role: 'source',
  };
}

function getLine(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

export class TSReactAdapter implements IProjectAdapter {
  async parse(paths: string[]): Promise<ParsedTsFile[]> {
    return Promise.all(paths.map(async (p) => ({ filePath: p, content: await readFile(p, 'utf-8') })));
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const files = parsed as ParsedTsFile[];
    const candidates: CandidateRecord[] = [];

    for (const file of files) {
      const routeMatches = file.content.matchAll(/(Route\s*\(|path\s*:\s*['"`][^'"`]+['"`])/g);
      for (const match of routeMatches) {
        const raw = match[0];
        const line = getLine(file.content, match.index ?? 0);
        const routePath = raw.match(/['"`]([^'"`]+)['"`]/)?.[1] ?? '/unknown';
        const type = 'function' as const;
        candidates.push({
          candidate_id: stableId(type, file.filePath, raw, String(line)),
          candidate_type: type,
          roles: [],
          language: file.filePath.match(/\.jsx?$/i) ? 'javascript' : 'typescript',
          workspaceId: context.workspaceId,
          project: context.projectId,
          source_file: file.filePath,
          symbol: `${path.basename(file.filePath)}:${routePath}`,
          line_start: line,
          line_end: line,
          status: 'candidate',
          extractor: 'ts_react_adapter',
          evidence: [makeEvidence(file.filePath, line, raw)],
          http_path: routePath,
          lang_meta: { kind: 'route', originalType: 'ts_route' },
        });
      }

      const apiMatches = file.content.matchAll(/(fetch\s*\(|axios\.(get|post|put|delete|patch)\s*\()/gi);
      for (const match of apiMatches) {
        const raw = match[0];
        const line = getLine(file.content, match.index ?? 0);
        const type = 'function' as const;
        candidates.push({
          candidate_id: stableId(type, file.filePath, raw, String(line)),
          candidate_type: type,
          roles: [],
          language: file.filePath.match(/\.jsx?$/i) ? 'javascript' : 'typescript',
          workspaceId: context.workspaceId,
          project: context.projectId,
          source_file: file.filePath,
          symbol: `${path.basename(file.filePath)}:${raw.replace(/\s+/g, '')}`,
          line_start: line,
          line_end: line,
          status: 'candidate',
          extractor: 'ts_react_adapter',
          evidence: [makeEvidence(file.filePath, line, raw)],
          lang_meta: { kind: 'api_call', originalType: 'ts_api_endpoint' },
        });
      }
    }

    return candidates;
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

}
