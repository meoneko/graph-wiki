import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { AdapterContext, CandidateRecord, EvidenceSpan, IProjectAdapter } from '../../core/types.js';
import { nodeTypeRegistry } from '../../core/nodeTypeRegistry.js';
import { createExtractionError, type AdapterExtractionError } from './IProjectAdapter.js';

/** Adapter identity constants for provenance tracking */
const ADAPTER_ID = 'structured-file-adapter';
const ADAPTER_VERSION = '1.0.0';

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

/**
 * Resolves the extraction method for a given extractor identifier.
 */
function resolveExtractionMethod(extractor: string): 'ast' | 'static-analysis' | 'regex' | 'doc-parse' | 'manual' {
  if (extractor.includes('openapi') || extractor.includes('markdown') || extractor.includes('doc')) return 'doc-parse';
  if (extractor.includes('regex') || extractor.includes('sql') || extractor.includes('terraform') || extractor.includes('dockerfile') || extractor.includes('graphql')) return 'regex';
  return 'static-analysis';
}

/**
 * Resolves the confidence for a given extraction method.
 */
function confidenceForMethod(method: 'ast' | 'static-analysis' | 'regex' | 'doc-parse' | 'manual'): number {
  switch (method) {
    case 'ast': return 0.95;
    case 'static-analysis': return 0.85;
    case 'doc-parse': return 0.80;
    case 'regex': return 0.70;
    case 'manual': return 0.70;
  }
}

/**
 * StructuredFileAdapter — Extracts facts from structured files (JSON, YAML, TOML, env, SQL, etc.).
 *
 * Emits findings and evidence only — does NOT assign trust semantics.
 * Implements structured error handling (EXTRACTION_FAILED) with continue-on-error.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class StructuredFileAdapter implements IProjectAdapter {
  /** Collected extraction errors for the current extraction run */
  private extractionErrors: AdapterExtractionError[] = [];

  /** Returns errors from the last extraction run */
  getExtractionErrors(): AdapterExtractionError[] {
    return [...this.extractionErrors];
  }

  async parse(paths: string[]): Promise<ParsedStructuredFile[]> {
    this.extractionErrors = [];
    const results: ParsedStructuredFile[] = [];

    for (const p of paths) {
      try {
        const content = await readFile(p, 'utf-8');
        results.push({ filePath: p, content });
      } catch (err) {
        // Structured error handling: emit EXTRACTION_FAILED and continue
        this.extractionErrors.push(
          createExtractionError(
            p,
            err instanceof Error ? err.message : String(err),
            ADAPTER_ID,
            ADAPTER_VERSION,
            err,
          ),
        );
        // Continue processing remaining files
      }
    }

    return results;
  }

  async extract(parsed: unknown, context: AdapterContext): Promise<CandidateRecord[]> {
    const files = parsed as ParsedStructuredFile[];
    const candidates: CandidateRecord[] = [];

    for (const file of files) {
      try {
        candidates.push(...this.extractFile(file, context));
      } catch (err) {
        // Structured error handling: emit EXTRACTION_FAILED and continue
        this.extractionErrors.push(
          createExtractionError(
            file.filePath,
            err instanceof Error ? err.message : String(err),
            ADAPTER_ID,
            ADAPTER_VERSION,
            err,
          ),
        );
        // Continue processing remaining files
      }
    }

    return candidates;
  }

  async enrich(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates;
  }

  async classify(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    // Adapters do NOT assign trust semantics — emit findings and evidence only
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
    const extractionMethod = resolveExtractionMethod(extractor);
    const confidence = confidenceForMethod(extractionMethod);
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
      lang_meta: {
        ...meta,
        // Full provenance fields
        extraction_method: extractionMethod,
        adapter_id: ADAPTER_ID,
        adapter_version: ADAPTER_VERSION,
        confidence,
        record_type: 'node' as const,
      },
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
      const candidates = flattenObject(parsed)
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

      // Check for OpenAPI spec in JSON
      if (parsed?.openapi && parsed?.paths && typeof parsed.paths === 'object') {
        candidates.push(...this.extractOpenApiObject(file, context, parsed, 'json_config_parser'));
      }

      return candidates;
    } catch (err) {
      // Structured error: emit EXTRACTION_FAILED for unparseable JSON
      this.extractionErrors.push(
        createExtractionError(
          file.filePath,
          `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
          ADAPTER_ID,
          ADAPTER_VERSION,
          err,
        ),
      );
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
    } catch (err) {
      // Structured error: emit EXTRACTION_FAILED for unparseable YAML
      this.extractionErrors.push(
        createExtractionError(
          file.filePath,
          `Failed to parse YAML: ${err instanceof Error ? err.message : String(err)}`,
          ADAPTER_ID,
          ADAPTER_VERSION,
          err,
        ),
      );
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
