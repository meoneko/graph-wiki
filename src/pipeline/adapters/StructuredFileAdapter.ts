import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';

interface ParsedStructuredFile {
  filePath: string;
  content: string;
}

function stableId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex');
}

function lineOf(content: string, needle: string): number {
  const index = content.indexOf(needle);
  return index < 0 ? 1 : content.slice(0, index).split(/\r?\n/).length;
}

function evidence(filePath: string, line: number, excerpt: string, role: EvidenceSpan['role']): EvidenceSpan {
  return {
    evidence_id: stableId(filePath, String(line), excerpt),
    source_file: filePath,
    line_start: line,
    line_end: line,
    excerpt,
    role,
  };
}

function flattenObject(value: unknown, prefix = ''): Array<{ key: string; value: unknown }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const out: Array<{ key: string; value: unknown }> = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const full = prefix ? `${prefix}:${key}` : key;
    out.push({ key: full, value: child });
    out.push(...flattenObject(child, full));
  }
  return out;
}

export class StructuredFileAdapter implements IProjectAdapter {
  async parse(paths: string[]): Promise<ParsedStructuredFile[]> {
    return Promise.all(paths.map(async (p) => ({ filePath: p, content: await readFile(p, 'utf-8') })));
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const files = parsed as ParsedStructuredFile[];
    return files.flatMap((file) => this.extractFile(file, context));
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async identify_entrypoints(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates.map((c) => ({ ...c, is_entrypoint: nodeTypeRegistry.isEntrypoint(c.candidate_type) }));
  }

  private makeCandidate(
    context: AdapterContext,
    file: ParsedStructuredFile,
    type: string,
    symbol: string,
    extractor: string,
    role: EvidenceSpan['role'],
    excerpt = symbol,
    meta: Record<string, unknown> = {},
  ): CandidateRecord | undefined {
    if (!nodeTypeRegistry.has(type)) return undefined;
    const line = lineOf(file.content, excerpt);
    return {
      candidate_id: stableId(type, file.filePath, symbol, String(line)),
      candidate_type: type,
      workspaceId: context.workspaceId,
      project: context.projectId,
      source_file: file.filePath,
      symbol,
      line_start: line,
      line_end: line,
      status: 'candidate',
      extractor,
      evidence: [evidence(file.filePath, line, excerpt, role)],
      lang_meta: meta,
    };
  }

  private extractFile(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    const basename = path.basename(file.filePath).toLowerCase();
    const ext = path.extname(file.filePath).toLowerCase();
    if (basename === 'dockerfile' || basename.endsWith('.dockerfile')) return this.extractDockerfile(file, context);
    if (ext === '.sql') return this.extractSql(file, context);
    if (ext === '.tf') return this.extractTerraform(file, context);
    if (ext === '.graphql' || ext === '.gql') return this.extractGraphql(file, context);
    if (ext === '.md') return this.extractMarkdown(file, context);
    if (ext === '.env') return this.extractEnv(file, context);
    if (ext === '.json') return this.extractJson(file, context);
    if (ext === '.yaml' || ext === '.yml') return this.extractYaml(file, context);
    if (ext === '.toml') return this.extractToml(file, context);
    return [];
  }

  private extractJson(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    try {
      const parsed = JSON.parse(file.content);
      const isAppSettings = /appsettings.*\.json$/i.test(path.basename(file.filePath));
      return flattenObject(parsed)
        .map(({ key }) => this.makeCandidate(
          context,
          file,
          isAppSettings && !key.includes(':') ? 'appsettings_section' : isAppSettings ? 'appsettings_key' : 'json_config_key',
          key,
          'json_config_parser',
          key.includes(':') ? 'config_key' : 'config_section',
          key.split(':').at(-1) ?? key,
        ))
        .filter((c): c is CandidateRecord => Boolean(c));
    } catch {
      return [];
    }
  }

  private extractYaml(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    try {
      const parsed = YAML.parse(file.content);
      const candidates = flattenObject(parsed)
        .map(({ key }) => this.makeCandidate(context, file, 'yaml_config_key', key, 'yaml_config_parser', 'config_key', key.split(':').at(-1) ?? key))
        .filter((c): c is CandidateRecord => Boolean(c));
      const kind = typeof parsed?.kind === 'string' ? parsed.kind : undefined;
      const name = typeof parsed?.metadata?.name === 'string' ? parsed.metadata.name : undefined;
      if (kind === 'Service' && name) {
        const svc = this.makeCandidate(context, file, 'k8s_service', name, 'kubernetes_parser', 'infra_resource', name, { kind });
        if (svc) candidates.push(svc);
      }
      if (parsed?.openapi && parsed?.paths && typeof parsed.paths === 'object') {
        candidates.push(...this.extractOpenApiObject(file, context, parsed, 'yaml_config_parser'));
      }
      return candidates;
    } catch {
      return [];
    }
  }

  private extractToml(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    return [...file.content.matchAll(/^\s*([A-Za-z0-9_.-]+)\s*=/gm)]
      .map((match) => this.makeCandidate(context, file, 'toml_config_key', match[1] ?? '', 'toml_config_parser', 'config_key', match[0]))
      .filter((c): c is CandidateRecord => Boolean(c));
  }

  private extractEnv(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    return [...file.content.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)]
      .map((match) => this.makeCandidate(context, file, 'env_key', match[1] ?? '', 'env_parser', 'config_key', match[0]))
      .filter((c): c is CandidateRecord => Boolean(c));
  }

  private extractSql(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    const candidates: CandidateRecord[] = [];
    for (const match of file.content.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_.\[\]"]+)/gi)) {
      const c = this.makeCandidate(context, file, 'sql_table', match[1] ?? '', 'sql_parser', 'schema_field', match[0]);
      if (c) candidates.push(c);
    }
    for (const match of file.content.matchAll(/\bCREATE\s+VIEW\s+([A-Za-z0-9_.\[\]"]+)/gi)) {
      const c = this.makeCandidate(context, file, 'sql_view', match[1] ?? '', 'sql_parser', 'schema_field', match[0]);
      if (c) candidates.push(c);
    }
    if (/migration/i.test(path.basename(file.filePath))) {
      const c = this.makeCandidate(context, file, 'sql_migration', path.basename(file.filePath), 'sql_parser', 'schema_field');
      if (c) candidates.push(c);
    }
    return candidates;
  }

  private extractDockerfile(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    return [...file.content.matchAll(/^\s*FROM\s+(.+?)(?:\s+AS\s+([A-Za-z0-9_.-]+))?\s*$/gim)]
      .map((match, i) => this.makeCandidate(context, file, 'dockerfile_stage', match[2] ?? `stage-${i + 1}`, 'dockerfile_parser', 'infra_resource', match[0], { image: match[1] }))
      .filter((c): c is CandidateRecord => Boolean(c));
  }

  private extractTerraform(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    return [...file.content.matchAll(/\bresource\s+"([^"]+)"\s+"([^"]+)"/g)]
      .map((match) => this.makeCandidate(context, file, 'terraform_resource', `${match[1]}.${match[2]}`, 'terraform_parser', 'infra_resource', match[0]))
      .filter((c): c is CandidateRecord => Boolean(c));
  }

  private extractGraphql(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    const candidates: CandidateRecord[] = [];
    for (const match of file.content.matchAll(/\btype\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
      const c = this.makeCandidate(context, file, 'graphql_type', match[1] ?? '', 'graphql_parser', 'schema_field', match[0]);
      if (c) candidates.push(c);
    }
    for (const match of file.content.matchAll(/\b(query|mutation)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
      const c = this.makeCandidate(context, file, match[1] === 'mutation' ? 'graphql_mutation' : 'graphql_query', match[2] ?? '', 'graphql_parser', 'contract_endpoint', match[0]);
      if (c) candidates.push(c);
    }
    return candidates;
  }

  private extractOpenApiObject(file: ParsedStructuredFile, context: AdapterContext, parsed: any, extractor: string): CandidateRecord[] {
    const candidates: CandidateRecord[] = [];
    for (const [route, operations] of Object.entries(parsed.paths ?? {})) {
      const pathCandidate = this.makeCandidate(context, file, 'openapi_path', route, 'openapi_parser', 'contract_endpoint', route);
      if (pathCandidate) candidates.push(pathCandidate);
      for (const method of Object.keys((operations as Record<string, unknown>) ?? {})) {
        const op = this.makeCandidate(context, file, 'openapi_operation', `${method.toUpperCase()} ${route}`, 'openapi_parser', 'contract_endpoint', method);
        if (op) candidates.push(op);
      }
    }
    for (const schema of Object.keys(parsed.components?.schemas ?? {})) {
      const c = this.makeCandidate(context, file, 'openapi_schema', schema, 'openapi_parser', 'schema_field', schema);
      if (c) candidates.push(c);
    }
    return candidates;
  }

  private extractMarkdown(file: ParsedStructuredFile, context: AdapterContext): CandidateRecord[] {
    const headings = [...file.content.matchAll(/^(#{1,6})\s+(.+)$/gm)];
    const candidates = headings
      .map((match) => this.makeCandidate(
        context,
        file,
        'doc_section',
        `${path.basename(file.filePath)}#${match[2] ?? 'section'}`,
        'markdown_doc_parser',
        'doc_section',
        match[0],
        { level: match[1]?.length ?? 1 },
      ))
      .filter((c): c is CandidateRecord => Boolean(c));
    if (candidates.length === 0) {
      const fallback = this.makeCandidate(
        context,
        file,
        'doc_section',
        path.basename(file.filePath),
        'markdown_doc_parser',
        'doc_section',
        file.content.split(/\r?\n/).find((line) => line.trim()) ?? path.basename(file.filePath),
        { level: 1 },
      );
      if (fallback) candidates.push(fallback);
    }
    return candidates;
  }
}
