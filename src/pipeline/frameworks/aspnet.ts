import path from 'node:path';
import { access, readdir } from 'node:fs/promises';
import type { AdapterContext, CandidateRecord, NodeRole } from '../../core/types.js';
import type { IFrameworkAdapter } from './IFrameworkAdapter.js';

async function pathExists(filePath: string): Promise<boolean> {
  try { await access(filePath); return true; } catch { return false; }
}

function hasAnyRole(candidate: CandidateRecord, roles: NodeRole[]): boolean {
  return roles.some((role) => candidate.roles.includes(role));
}

function addRoles(candidate: CandidateRecord, roles: NodeRole[]): CandidateRecord {
  return { ...candidate, roles: [...new Set([...candidate.roles, ...roles])] };
}

function setFramework(candidate: CandidateRecord, framework: string): CandidateRecord {
  if (candidate.framework && candidate.framework !== framework) {
    return {
      ...candidate,
      lang_meta: {
        ...(candidate.lang_meta ?? {}),
        frameworks: [...new Set([candidate.framework, framework])],
      },
    };
  }
  return { ...candidate, framework };
}

function isCSharpMethod(candidate: CandidateRecord): boolean {
  return candidate.language === 'csharp' && (candidate.candidate_type === 'method' || candidate.candidate_type === 'function');
}

function fileHasSegment(filePath: string, segment: string): boolean {
  return filePath.replace(/\\/g, '/').split('/').some((part) => part.toLowerCase() === segment.toLowerCase());
}

export class AspNetMvcFrameworkAdapter implements IFrameworkAdapter {
  readonly name = 'aspnet-mvc';
  readonly language = 'csharp';

  async detectProjectFramework(context: AdapterContext): Promise<boolean> {
    if (await pathExists(path.join(context.projectRoot, 'Controllers'))) return true;
    try {
      const files = await readdir(context.projectRoot, { recursive: true });
      return files.some((f) => String(f).replace(/\\/g, '/').split('/').some((part) => part.toLowerCase() === 'controllers'));
    } catch {
      return false;
    }
  }

  async enrichCandidates(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates.map((candidate) => {
      if (!isCSharpMethod(candidate)) return candidate;
      const containingClass = String(candidate.lang_meta?.containingClass ?? '');
      const isControllerFile = fileHasSegment(candidate.source_file, 'Controllers');
      const isControllerClass = /Controller$/i.test(containingClass) || /\.Controllers\.[^.]*Controller\./i.test(candidate.symbol);
      const annotations = candidate.annotations ?? [];
      if (annotations.some((a) => /NonAction/i.test(a))) return candidate;
      const hasHttpAnnotation = annotations.some((a) => /Http(Get|Post|Put|Delete|Patch)|Route|Authorize/i.test(a));
      const isConventionAction = isControllerFile && isControllerClass && candidate.candidate_type === 'method'
        && candidate.lang_meta?.isPublic === true && candidate.lang_meta?.isStatic !== true;
      if (!hasHttpAnnotation && !isConventionAction) return candidate;

      const method = hasHttpAnnotation
        ? annotations.find((a) => /Http(Get|Post|Put|Delete|Patch)/i.test(a))?.match(/Http(Get|Post|Put|Delete|Patch)/i)?.[1]?.toUpperCase()
        : undefined;
      return setFramework(addRoles({ ...candidate, http_method: candidate.http_method ?? method }, ['entrypoint', 'http_handler']), this.name);
    });
  }
}

export class AspNetMinimalApiFrameworkAdapter implements IFrameworkAdapter {
  readonly name = 'aspnet-minimal-api';
  readonly language = 'csharp';

  async detectProjectFramework(context: AdapterContext): Promise<boolean> {
    return pathExists(path.join(context.projectRoot, 'Program.cs'));
  }

  async enrichCandidates(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    return candidates.map((candidate) => {
      if (!isCSharpMethod(candidate)) return candidate;
      if (!/^MinimalApi\.Map(Get|Post|Put|Delete|Patch):/i.test(candidate.symbol)) return candidate;
      return setFramework(addRoles(candidate, ['entrypoint', 'http_handler']), this.name);
    });
  }
}

export class AspNetWebFormsFrameworkAdapter implements IFrameworkAdapter {
  readonly name = 'aspnet-webforms';
  readonly language = 'csharp';

  async detectProjectFramework(context: AdapterContext): Promise<boolean> {
    try {
      const files = await readdir(context.projectRoot, { recursive: true });
      return files.some((f) => /\.aspx$/i.test(String(f)));
    } catch {
      return false;
    }
  }

  async enrichCandidates(candidates: CandidateRecord[]): Promise<CandidateRecord[]> {
    const handlerPattern = /(^|\.)(Page_(Load|Init|PreRender)|[A-Za-z0-9_]+_(Click|Command|SelectedIndexChanged|RowCommand|NeedDataSource))$/i;
    return candidates.map((candidate) => {
      if (!isCSharpMethod(candidate)) return candidate;
      if (!/\.(aspx|ascx|master)\.cs$/i.test(candidate.source_file)) return candidate;
      if (!handlerPattern.test(candidate.symbol)) return candidate;
      if (hasAnyRole(candidate, ['http_handler'])) return candidate;
      return setFramework(addRoles(candidate, ['entrypoint', 'event_handler']), this.name);
    });
  }
}
