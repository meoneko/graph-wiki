import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GraphNode, GraphEdge, Provenance, ConfidenceBand, GraphKind } from '../../core/types.js';
import type { KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import { GraphDB } from '../../storage/GraphDB.js';
import type { WikiPage, ProvenanceSummary, ConfidenceSummary, WikiAnnotation } from '../artifacts/graphArtifacts.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Minimum number of canonical/derived nodes required to produce a canonical-status page */
const MIN_CANONICAL_EVIDENCE = 2;

// ─── WikiBuilder ─────────────────────────────────────────────────────────────

export class WikiBuilder {
  /**
   * Generate trust-aware wiki pages from graph nodes and edges.
   * 
   * Trust rules:
   * - Canonical-status pages use only canonical/derived facts for conclusions
   * - Exploratory facts appear only as clearly marked annotations
   * - Insufficient canonical evidence → `insufficient_context` status (no speculative content)
   * - All content derived from trust-aware sources
   */
  async generate(workspaceId: string, nodes: GraphNode[], edges: GraphEdge[]): Promise<WikiPage[]> {
    const pages: WikiPage[] = [];

    // Generate overview page
    pages.push(this.generateOverviewPage(workspaceId, nodes, edges));

    // Group nodes by domain to generate domain pages
    const domainGroups = this.groupByDomain(nodes);
    for (const [domain, domainNodes] of domainGroups) {
      const domainEdges = this.getRelevantEdges(domainNodes, edges);
      pages.push(this.generateDomainPage(workspaceId, domain, domainNodes, domainEdges));
    }

    // Group nodes by module/project to generate module pages
    const moduleGroups = this.groupByModule(nodes);
    for (const [moduleName, moduleNodes] of moduleGroups) {
      const moduleEdges = this.getRelevantEdges(moduleNodes, edges);
      pages.push(this.generateModulePage(workspaceId, moduleName, moduleNodes, moduleEdges));
    }

    // Generate entrypoint pages for API/controller nodes
    const entrypoints = nodes.filter(
      (n) => n.type.includes('api') || n.type.includes('controller') || n.type.includes('entrypoint') || n.type.includes('route'),
    );
    if (entrypoints.length > 0) {
      const entrypointEdges = this.getRelevantEdges(entrypoints, edges);
      pages.push(this.generateEntrypointPage(workspaceId, entrypoints, entrypointEdges));
    }

    return pages;
  }

  // ─── Page Generators ─────────────────────────────────────────────────────

  private generateOverviewPage(workspaceId: string, nodes: GraphNode[], edges: GraphEdge[]): WikiPage {
    const canonicalNodes = nodes.filter((n) => n.graph_kind === 'canonical');
    const derivedNodes = nodes.filter((n) => n.graph_kind === 'derived');
    const exploratoryNodes = nodes.filter((n) => n.graph_kind === 'exploratory');

    const status = this.determinePageStatus(nodes);
    const annotations = this.buildAnnotations(exploratoryNodes);
    const warnings = this.buildWarnings(nodes, status);
    const sources = this.collectSources(nodes);
    const provenanceSummary = this.buildProvenanceSummary(nodes);
    const confidenceSummary = this.buildConfidenceSummary(nodes);

    // Build content using only canonical/derived facts for conclusions
    const contentLines: string[] = [];
    contentLines.push(`# Workspace: ${workspaceId}`);
    contentLines.push('');

    if (status === 'insufficient_context') {
      contentLines.push('> Insufficient canonical evidence to generate conclusions for this workspace.');
      contentLines.push('');
    } else {
      contentLines.push('## System Overview');
      contentLines.push(`- Total canonical nodes: ${canonicalNodes.length}`);
      contentLines.push(`- Total derived nodes: ${derivedNodes.length}`);
      contentLines.push(`- Total edges: ${edges.filter((e) => e.graph_kind === 'canonical' || e.graph_kind === 'derived').length}`);
      contentLines.push('');

      // Domains from canonical/derived only
      const canonicalDomains = [...new Set(
        [...canonicalNodes, ...derivedNodes]
          .map((n) => n.domain)
          .filter(Boolean),
      )] as string[];
      if (canonicalDomains.length > 0) {
        contentLines.push('## Domains');
        for (const d of canonicalDomains) {
          contentLines.push(`- ${d}`);
        }
        contentLines.push('');
      }

      // Entrypoints from canonical/derived only
      const canonicalEntrypoints = [...canonicalNodes, ...derivedNodes].filter(
        (n) => n.type.includes('api') || n.type.includes('controller') || n.type.includes('route'),
      );
      if (canonicalEntrypoints.length > 0) {
        contentLines.push('## Entrypoints');
        for (const ep of canonicalEntrypoints.slice(0, 10)) {
          contentLines.push(`- ${ep.label} (${ep.type})`);
        }
        contentLines.push('');
      }
    }

    // Render provenance and confidence summary
    contentLines.push(...this.renderProvenanceSection(provenanceSummary, confidenceSummary, sources));

    return {
      id: `${workspaceId}-overview`,
      workspaceId,
      title: `${workspaceId} Overview`,
      pageType: 'overview',
      status,
      content: contentLines.join('\n'),
      sources,
      provenance_summary: provenanceSummary,
      confidence_summary: confidenceSummary,
      annotations,
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateDomainPage(
    workspaceId: string,
    domain: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): WikiPage {
    const status = this.determinePageStatus(nodes);
    const canonicalNodes = nodes.filter((n) => n.graph_kind === 'canonical' || n.graph_kind === 'derived');
    const exploratoryNodes = nodes.filter((n) => n.graph_kind === 'exploratory');
    const annotations = this.buildAnnotations(exploratoryNodes);
    const warnings = this.buildWarnings(nodes, status);
    const sources = this.collectSources(nodes);
    const provenanceSummary = this.buildProvenanceSummary(nodes);
    const confidenceSummary = this.buildConfidenceSummary(nodes);

    const contentLines: string[] = [];
    contentLines.push(`# Domain: ${domain}`);
    contentLines.push('');

    if (status === 'insufficient_context') {
      contentLines.push('> Insufficient canonical evidence to generate conclusions for this domain.');
    } else {
      contentLines.push('## Components');
      for (const node of canonicalNodes.slice(0, 20)) {
        contentLines.push(`- ${node.label} (${node.type}) [${node.confidence_band}]`);
      }
      contentLines.push('');

      const domainEdges = edges.filter((e) => e.graph_kind === 'canonical' || e.graph_kind === 'derived');
      if (domainEdges.length > 0) {
        contentLines.push('## Relationships');
        for (const edge of domainEdges.slice(0, 15)) {
          contentLines.push(`- ${edge.from_id} → ${edge.type} → ${edge.to_id}`);
        }
        contentLines.push('');
      }
    }

    // Render provenance and confidence summary
    contentLines.push(...this.renderProvenanceSection(provenanceSummary, confidenceSummary, sources));

    return {
      id: `${workspaceId}-domain-${this.slugify(domain)}`,
      workspaceId,
      title: `Domain: ${domain}`,
      pageType: 'domain',
      status,
      content: contentLines.join('\n'),
      sources,
      provenance_summary: provenanceSummary,
      confidence_summary: confidenceSummary,
      annotations,
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateModulePage(
    workspaceId: string,
    moduleName: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): WikiPage {
    const status = this.determinePageStatus(nodes);
    const canonicalNodes = nodes.filter((n) => n.graph_kind === 'canonical' || n.graph_kind === 'derived');
    const exploratoryNodes = nodes.filter((n) => n.graph_kind === 'exploratory');
    const annotations = this.buildAnnotations(exploratoryNodes);
    const warnings = this.buildWarnings(nodes, status);
    const sources = this.collectSources(nodes);
    const provenanceSummary = this.buildProvenanceSummary(nodes);
    const confidenceSummary = this.buildConfidenceSummary(nodes);

    const contentLines: string[] = [];
    contentLines.push(`# Module: ${moduleName}`);
    contentLines.push('');

    if (status === 'insufficient_context') {
      contentLines.push('> Insufficient canonical evidence to generate conclusions for this module.');
    } else {
      contentLines.push('## Symbols');
      for (const node of canonicalNodes.slice(0, 20)) {
        contentLines.push(`- ${node.label} (${node.type})`);
      }
      contentLines.push('');

      const moduleEdges = edges.filter((e) => e.graph_kind === 'canonical' || e.graph_kind === 'derived');
      if (moduleEdges.length > 0) {
        contentLines.push('## Dependencies');
        for (const edge of moduleEdges.slice(0, 15)) {
          contentLines.push(`- ${edge.from_id} → ${edge.type} → ${edge.to_id}`);
        }
        contentLines.push('');
      }
    }

    // Render provenance and confidence summary
    contentLines.push(...this.renderProvenanceSection(provenanceSummary, confidenceSummary, sources));

    return {
      id: `${workspaceId}-module-${this.slugify(moduleName)}`,
      workspaceId,
      title: `Module: ${moduleName}`,
      pageType: 'module',
      status,
      content: contentLines.join('\n'),
      sources,
      provenance_summary: provenanceSummary,
      confidence_summary: confidenceSummary,
      annotations,
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateEntrypointPage(
    workspaceId: string,
    entrypoints: GraphNode[],
    edges: GraphEdge[],
  ): WikiPage {
    const status = this.determinePageStatus(entrypoints);
    const canonicalEntrypoints = entrypoints.filter((n) => n.graph_kind === 'canonical' || n.graph_kind === 'derived');
    const exploratoryEntrypoints = entrypoints.filter((n) => n.graph_kind === 'exploratory');
    const annotations = this.buildAnnotations(exploratoryEntrypoints);
    const warnings = this.buildWarnings(entrypoints, status);
    const sources = this.collectSources(entrypoints);
    const provenanceSummary = this.buildProvenanceSummary(entrypoints);
    const confidenceSummary = this.buildConfidenceSummary(entrypoints);

    const contentLines: string[] = [];
    contentLines.push('# API Entrypoints');
    contentLines.push('');

    if (status === 'insufficient_context') {
      contentLines.push('> Insufficient canonical evidence to generate conclusions for entrypoints.');
    } else {
      for (const ep of canonicalEntrypoints.slice(0, 20)) {
        contentLines.push(`## ${ep.label}`);
        contentLines.push(`- Type: ${ep.type}`);
        if (ep.http_method) contentLines.push(`- Method: ${ep.http_method}`);
        if (ep.http_path) contentLines.push(`- Path: ${ep.http_path}`);
        contentLines.push(`- Source: ${ep.source_file ?? 'unknown'}`);
        contentLines.push(`- Confidence: ${ep.confidence_band}`);
        contentLines.push('');
      }
    }

    // Render provenance and confidence summary
    contentLines.push(...this.renderProvenanceSection(provenanceSummary, confidenceSummary, sources));

    return {
      id: `${workspaceId}-entrypoints`,
      workspaceId,
      title: 'API Entrypoints',
      pageType: 'entrypoints',
      status,
      content: contentLines.join('\n'),
      sources,
      provenance_summary: provenanceSummary,
      confidence_summary: confidenceSummary,
      annotations,
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Trust Logic ─────────────────────────────────────────────────────────

  /**
   * Determine page status based on trust levels of constituent nodes.
   * 
   * - canonical: all nodes are canonical/derived with sufficient evidence
   * - mixed: mix of canonical/derived and exploratory nodes
   * - draft: mostly exploratory with some canonical
   * - insufficient_context: not enough canonical evidence
   */
  determinePageStatus(nodes: GraphNode[]): WikiPage['status'] {
    if (nodes.length === 0) return 'insufficient_context';

    const canonicalCount = nodes.filter((n) => n.graph_kind === 'canonical' || n.graph_kind === 'derived').length;
    const exploratoryCount = nodes.filter((n) => n.graph_kind === 'exploratory').length;

    // Insufficient context: fewer than MIN_CANONICAL_EVIDENCE canonical/derived nodes
    if (canonicalCount < MIN_CANONICAL_EVIDENCE) {
      return 'insufficient_context';
    }

    // All canonical/derived → canonical status
    if (exploratoryCount === 0) {
      return 'canonical';
    }

    // Majority canonical/derived → mixed
    if (canonicalCount >= exploratoryCount) {
      return 'mixed';
    }

    // Mostly exploratory → draft
    return 'draft';
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private buildAnnotations(exploratoryNodes: GraphNode[]): WikiAnnotation[] {
    return exploratoryNodes.map((node, idx) => ({
      id: `annotation-${idx}`,
      type: 'exploratory' as const,
      content: `[Exploratory] ${node.label} (${node.type}) — not verified by canonical evidence`,
      source_node_id: node.id,
      trust_level: 'EXPLORATORY' as const,
    }));
  }

  private buildWarnings(nodes: GraphNode[], status: WikiPage['status']): string[] {
    const warnings: string[] = [];

    if (status === 'mixed') {
      warnings.push('EXPLORATORY_USED: This page includes exploratory annotations alongside canonical conclusions');
    }

    if (status === 'draft') {
      warnings.push('EXPLORATORY_DOMINANT: This page is primarily based on exploratory evidence');
    }

    const missingProvenance = nodes.filter((n) => !n.provenance?.artifact_source);
    if (missingProvenance.length > 0) {
      warnings.push(`PROVENANCE_INCOMPLETE: ${missingProvenance.length} node(s) missing provenance artifact source`);
    }

    return warnings;
  }

  private collectSources(nodes: GraphNode[]): Provenance[] {
    const sources: Provenance[] = [];
    const seen = new Set<string>();

    for (const node of nodes) {
      if (node.provenance) {
        const key = `${node.provenance.source}:${node.provenance.artifact_source}:${node.provenance.file ?? ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          sources.push(node.provenance);
        }
      }
    }

    return sources;
  }

  buildProvenanceSummary(nodes: GraphNode[]): ProvenanceSummary {
    let parserBacked = 0;
    let derived = 0;
    let exploratory = 0;
    let external = 0;

    for (const node of nodes) {
      switch (node.graph_kind) {
        case 'canonical':
          parserBacked++;
          break;
        case 'derived':
          derived++;
          break;
        case 'exploratory':
          exploratory++;
          break;
        case 'external':
          external++;
          break;
      }
    }

    return {
      total_sources: nodes.length,
      parser_backed: parserBacked,
      derived,
      exploratory,
      external,
    };
  }

  buildConfidenceSummary(nodes: GraphNode[]): ConfidenceSummary {
    let authoritative = 0;
    let extracted = 0;
    let inferred = 0;
    let ambiguous = 0;

    for (const node of nodes) {
      switch (node.confidence_band) {
        case 'AUTHORITATIVE':
          authoritative++;
          break;
        case 'EXTRACTED':
          extracted++;
          break;
        case 'INFERRED':
          inferred++;
          break;
        case 'AMBIGUOUS':
          ambiguous++;
          break;
      }
    }

    // Determine overall confidence
    let overall: ConfidenceSummary['overall'];
    if (authoritative + extracted > inferred + ambiguous) {
      overall = 'HIGH';
    } else if (ambiguous > authoritative + extracted) {
      overall = 'LOW';
    } else {
      overall = 'MEDIUM';
    }

    return {
      overall,
      authoritative_count: authoritative,
      extracted_count: extracted,
      inferred_count: inferred,
      ambiguous_count: ambiguous,
    };
  }

  private groupByDomain(nodes: GraphNode[]): Map<string, GraphNode[]> {
    const groups = new Map<string, GraphNode[]>();
    for (const node of nodes) {
      const domain = node.domain ?? 'unknown';
      if (!groups.has(domain)) groups.set(domain, []);
      groups.get(domain)!.push(node);
    }
    return groups;
  }

  private groupByModule(nodes: GraphNode[]): Map<string, GraphNode[]> {
    const groups = new Map<string, GraphNode[]>();
    for (const node of nodes) {
      const moduleName = node.project ?? 'unknown';
      if (!groups.has(moduleName)) groups.set(moduleName, []);
      groups.get(moduleName)!.push(node);
    }
    return groups;
  }

  private getRelevantEdges(nodes: GraphNode[], allEdges: GraphEdge[]): GraphEdge[] {
    const nodeIds = new Set(nodes.map((n) => n.id));
    return allEdges.filter((e) => nodeIds.has(e.from_id) || nodeIds.has(e.to_id));
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /**
   * Renders a provenance and confidence section for wiki page content.
   * Requirement 21.4: WikiBuilder SHALL render provenance and confidence information on generated pages.
   */
  private renderProvenanceSection(
    provenanceSummary: ProvenanceSummary,
    confidenceSummary: ConfidenceSummary,
    sources: Provenance[],
  ): string[] {
    const lines: string[] = [];
    lines.push('## Provenance');
    lines.push('');
    lines.push(`- Overall confidence: ${confidenceSummary.overall}`);
    lines.push(`- Total sources: ${provenanceSummary.total_sources}`);
    lines.push(`- Parser-backed: ${provenanceSummary.parser_backed}`);
    lines.push(`- Derived: ${provenanceSummary.derived}`);
    lines.push(`- Exploratory: ${provenanceSummary.exploratory}`);
    if (provenanceSummary.external > 0) {
      lines.push(`- External: ${provenanceSummary.external}`);
    }
    lines.push('');

    lines.push('### Confidence Distribution');
    lines.push(`- Authoritative: ${confidenceSummary.authoritative_count}`);
    lines.push(`- Extracted: ${confidenceSummary.extracted_count}`);
    lines.push(`- Inferred: ${confidenceSummary.inferred_count}`);
    lines.push(`- Ambiguous: ${confidenceSummary.ambiguous_count}`);
    lines.push('');

    // Show unique source files from provenance
    const uniqueFiles = [...new Set(sources.map((s) => s.file ?? s.filePath ?? s.artifact_source).filter(Boolean))];
    if (uniqueFiles.length > 0) {
      lines.push('### Source Files');
      for (const file of uniqueFiles.slice(0, 10)) {
        lines.push(`- ${file}`);
      }
      if (uniqueFiles.length > 10) {
        lines.push(`- ... and ${uniqueFiles.length - 10} more`);
      }
      lines.push('');
    }

    return lines;
  }
}

// ─── Legacy Pipeline Entry Point ─────────────────────────────────────────────

/**
 * Legacy pipeline entry point that delegates to WikiBuilder.
 * Maintained for backward compatibility with the pipeline orchestrator.
 */
export async function generateWiki(
  workspaceId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  db: GraphDB,
  config: KnowledgeConfig,
): Promise<void> {
  const builder = new WikiBuilder();
  const pages = await builder.generate(workspaceId, nodes, edges);

  const root = path.join(resolveOutputPath(config, 'wiki_root'), workspaceId);
  await mkdir(root, { recursive: true });

  // Load external annotations for this workspace
  const externalAnnotations = db ? db.getExternalMemoryByWorkspace(workspaceId) : [];

  // Write each page as a JSON file and a markdown (.md) file
  for (const page of pages) {
    // 1. Write JSON file
    await writeFile(path.join(root, `${page.id}.json`), JSON.stringify(page, null, 2), 'utf-8');

    // 2. Build Markdown content
    const mdLines: string[] = [];
    mdLines.push('---');
    mdLines.push(`id: ${page.id}`);
    mdLines.push(`title: ${page.title}`);
    mdLines.push(`pageType: ${page.pageType}`);
    mdLines.push(`status: ${page.status}`);
    mdLines.push(`generatedAt: ${page.generatedAt || new Date().toISOString()}`);
    mdLines.push('---');
    mdLines.push('');
    mdLines.push(page.content);
    mdLines.push('');

    // Append AI reflections wrapped in circular-ingestion-proof markers
    mdLines.push('<!-- BEGIN GENERATED ANNOTATIONS -->');
    mdLines.push('## System Generated Reflections');
    mdLines.push('');
    if (page.annotations && page.annotations.length > 0) {
      for (const ann of page.annotations) {
        mdLines.push(`- ${ann.content}`);
      }
    } else {
      mdLines.push('_No system-generated reflections._');
    }
    mdLines.push('<!-- END GENERATED ANNOTATIONS -->');
    mdLines.push('');

    // Determine relevant nodes for this page to filter external annotations
    const pageNodes = new Set<string>();
    if (page.pageType === 'overview') {
      for (const n of nodes) {
        pageNodes.add(n.id);
        if (n.symbol) pageNodes.add(n.symbol);
      }
    } else if (page.pageType === 'domain') {
      const domainName = page.title.replace('Domain: ', '');
      const domainNodes = nodes.filter(n => (n.domain || 'unknown') === domainName);
      for (const n of domainNodes) {
        pageNodes.add(n.id);
        if (n.symbol) pageNodes.add(n.symbol);
      }
    } else if (page.pageType === 'module') {
      const moduleName = page.title.replace('Module: ', '');
      const moduleNodes = nodes.filter(n => (n.project || 'unknown') === moduleName);
      for (const n of moduleNodes) {
        pageNodes.add(n.id);
        if (n.symbol) pageNodes.add(n.symbol);
      }
    } else if (page.pageType === 'entrypoints') {
      const entrypointNodes = nodes.filter(n =>
        n.type.includes('api') || n.type.includes('controller') || n.type.includes('entrypoint') || n.type.includes('route')
      );
      for (const n of entrypointNodes) {
        pageNodes.add(n.id);
        if (n.symbol) pageNodes.add(n.symbol);
      }
    }

    // Filter external annotations for this page
    const relevantExt = externalAnnotations.filter(ext => 
      page.pageType === 'overview' || pageNodes.has(ext.node_id) || pageNodes.has(`node:${ext.node_id}`)
    );

    if (relevantExt.length > 0) {
      mdLines.push('## External Annotations');
      mdLines.push('');
      for (const ext of relevantExt) {
        mdLines.push('<!-- annotation');
        mdLines.push(`node_id: ${ext.node_id}`);
        mdLines.push(`author: ${ext.author}`);
        if (ext.verification_signature) {
          mdLines.push(`signature: ${ext.verification_signature}`);
        }
        mdLines.push('---');
        mdLines.push(ext.annotation);
        mdLines.push('-->');
        mdLines.push(`- [EXTERNAL_ANNOTATION] (Author: ${ext.author}, Trust: ${ext.confidence_band}) **${ext.node_id}**: ${ext.annotation}`);
        mdLines.push('');
      }
    }

    await writeFile(path.join(root, `${page.id}.md`), mdLines.join('\n'), 'utf-8');
  }

  // Also write a README.md summary for human readability
  const readmeLines = [
    `# Wiki: ${workspaceId}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Pages: ${pages.length}`,
    '',
    '## Pages',
    ...pages.map((p) => `- [${p.title}](${p.id}.md) — status: ${p.status}`),
  ];
  await writeFile(path.join(root, 'README.md'), readmeLines.join('\n'), 'utf-8');
}
