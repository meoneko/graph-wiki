import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { WorkspaceConfig, KnowledgeConfig } from '../config.js';
import { resolveOutputPath } from '../config.js';
import { GraphDB, type ExternalMemoryRow } from '../../storage/GraphDB.js';

/**
 * Parses annotations from a Markdown wiki page, ignoring auto-generated segments.
 */
export function parseAnnotationsFromMarkdown(content: string): Array<{
  node_id: string;
  author: 'human' | 'agent';
  signature?: string;
  annotation: string;
}> {
  // First, strip all generated annotation blocks to prevent circular ingestion
  let cleanContent = content;
  const generatedBlockRegex = /<!--\s*BEGIN GENERATED ANNOTATIONS\s*-->[\s\S]*?<!--\s*END GENERATED ANNOTATIONS\s*-->/g;
  cleanContent = cleanContent.replace(generatedBlockRegex, '');

  const annotations: Array<{
    node_id: string;
    author: 'human' | 'agent';
    signature?: string;
    annotation: string;
  }> = [];

  const annotationRegex = /<!--\s*annotation\s*\n([\s\S]*?)\n-->/g;
  let match;
  while ((match = annotationRegex.exec(cleanContent)) !== null) {
    const block = match[1];
    if (!block) continue;

    // Split frontmatter and annotation content
    const parts = block.split(/\n---\n|\n---/);
    const frontmatterStr = parts[0] || '';
    const annotationContent = (parts.slice(1).join('\n') || '').trim();

    // Parse simple key-value YAML-like frontmatter
    const metadata: Record<string, string> = {};
    const lines = frontmatterStr.split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      metadata[key] = val;
    }

    if (!metadata.node_id) {
      continue; // Needs a valid node_id target
    }

    annotations.push({
      node_id: metadata.node_id,
      author: (metadata.author === 'human' ? 'human' : 'agent') as 'human' | 'agent',
      signature: metadata.signature,
      annotation: annotationContent,
    });
  }

  return annotations;
}

/**
 * Re-ingests manually written or AI annotations from Wiki markdown files.
 * HMAC cryptographically verifies human entries to prevent AI spoofing.
 */
export async function reingestWikiAnnotations(
  workspace: WorkspaceConfig,
  config: KnowledgeConfig,
  db: GraphDB,
): Promise<void> {
  const wikiRoot = resolveOutputPath(config, 'wiki_root');
  const workspaceWikiDir = path.join(wikiRoot, workspace.id);

  let files: string[] = [];
  try {
    const allFiles = await readdir(workspaceWikiDir);
    files = allFiles.filter((f) => f.endsWith('.md'));
  } catch (err) {
    // If the wiki directory does not exist yet (first execution), just skip reingesting
    return;
  }

  const secret = process.env.ANNOTATION_SECRET || '';
  if (!secret) {
    console.warn(
      '[WARNING] ANNOTATION_SECRET is not configured in environment. All human annotations will be downgraded to agent-exploratory trust status.',
    );
  }

  for (const filename of files) {
    const filePath = path.join(workspaceWikiDir, filename);
    const content = await readFile(filePath, 'utf-8');
    const parsedAnnotations = parseAnnotationsFromMarkdown(content);

    for (const ann of parsedAnnotations) {
      let finalAuthor = ann.author;
      let confidenceBand: 'AUTHORITATIVE' | 'INFERRED' = 'INFERRED';

      if (ann.author === 'human') {
        if (!secret) {
          finalAuthor = 'agent';
          confidenceBand = 'INFERRED';
        } else if (!ann.signature) {
          finalAuthor = 'agent';
          confidenceBand = 'INFERRED';
        } else {
          // Cryptographically verify human signature
          const computedSignature = crypto
            .createHmac('sha256', secret)
            .update(ann.annotation)
            .digest('hex');

          if (computedSignature === ann.signature) {
            confidenceBand = 'AUTHORITATIVE';
          } else {
            console.warn(
              `[SECURITY] HMAC mismatch for human annotation on node '${ann.node_id}'. Downgrading to agent status.`,
            );
            finalAuthor = 'agent';
            confidenceBand = 'INFERRED';
          }
        }
      }

      const stableId = crypto
        .createHash('sha256')
        .update(`${workspace.id}:${ann.node_id}:${ann.annotation}`)
        .digest('hex');

      const provenanceInfo = JSON.stringify({
        file_source: path.relative(wikiRoot, filePath),
        parsed_at: new Date().toISOString(),
      });

      const row: ExternalMemoryRow = {
        id: stableId,
        node_id: ann.node_id,
        workspace: workspace.id,
        author: finalAuthor,
        annotation: ann.annotation,
        provenance_info: provenanceInfo,
        confidence_band: confidenceBand,
        verification_signature: ann.signature || undefined,
        // ast_signature_hash starts as null, to be reconciled in post-build pass
      };

      db.upsertExternalMemory(row);
    }
  }
}

/**
 * Computes deterministic AST signature hash of a graph node.
 * Formula: SHA-256([kind]:[name]([paramTypes]):[returnType])
 */
export function computeASTSignatureHash(node: any): string {
  const langMeta = node.metadata?.lang_meta || {};
  const kind = langMeta.kind || node.type || 'unknown';
  const name = node.symbol || node.label || 'unknown';

  // Format parameters deterministic representation
  const params = Array.isArray(langMeta.parameters)
    ? langMeta.parameters.map((p: any) => p.type || 'any').join(',')
    : '';

  const returnType = langMeta.returnType || langMeta.return_type || 'void';

  const signatureString = `${kind}:${name}(${params}):${returnType}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

/**
 * Reconciles external annotations in database against the compiled graph nodes.
 * Identifies orphans and moves them to stale annotations, and reports AST drift warnings.
 */
export async function reconcileAnnotations(
  workspaceId: string,
  currentNodes: any[],
  db: GraphDB,
  config: KnowledgeConfig,
): Promise<void> {
  const annotations = db.getExternalMemoryByWorkspace(workspaceId);
  const { existsSync, mkdirSync, writeFileSync } = await import('node:fs');

  // Build a index of current nodes by their various identifiers for robust resolution
  const nodeMap = new Map<string, any>();
  for (const node of currentNodes) {
    nodeMap.set(node.id, node);
    // Support matching both prefixed 'node:CreateOrderUseCase' and raw 'CreateOrderUseCase'
    const unprefixed = node.id.replace(/^node:/, '');
    nodeMap.set(unprefixed, node);
    if (node.symbol) {
      nodeMap.set(node.symbol, node);
    }
    if (node.label) {
      nodeMap.set(node.label, node);
    }
  }

  const warnings: Array<{
    type: 'AST_DRIFT' | 'ORPHAN';
    node_id: string;
    message: string;
    details: Record<string, any>;
  }> = [];

  for (const ann of annotations) {
    const node = nodeMap.get(ann.node_id);

    if (!node) {
      // 1. Orphan node: target not found in the current compiled graph
      db.upsertStaleAnnotation({
        id: ann.id,
        original_node_id: ann.node_id,
        workspace: workspaceId,
        author: ann.author,
        annotation: ann.annotation,
        stale_reason: 'ORPHAN',
      });
      db.deleteExternalMemory(ann.id);

      warnings.push({
        type: 'ORPHAN',
        node_id: ann.node_id,
        message: `Orphan annotation detected for node '${ann.node_id}' (node no longer exists in compiled graph). Migrating to stale annotations.`,
        details: {
          annotation_id: ann.id,
          author: ann.author,
          provenance: ann.provenance_info,
        },
      });
      continue;
    }

    // 2. Node exists: compute AST signature hash and compare
    const newHash = computeASTSignatureHash(node);

    if (ann.ast_signature_hash && ann.ast_signature_hash !== newHash) {
      // Drift warning!
      warnings.push({
        type: 'AST_DRIFT',
        node_id: ann.node_id,
        message: `AST signature drift detected for node '${ann.node_id}'. Code signature has changed since annotation was recorded.`,
        details: {
          annotation_id: ann.id,
          expected_hash: ann.ast_signature_hash,
          actual_hash: newHash,
        },
      });
    }

    // Update the annotation record in database with the new/reconciled AST hash
    const updatedRow = {
      ...ann,
      ast_signature_hash: newHash,
    };
    db.upsertExternalMemory(updatedRow);
  }

  // Write drift warnings to reports_root/{workspaceId}/drift.json
  const reportsRoot = resolveOutputPath(config, 'reports_root');
  const workspaceReportsDir = path.join(reportsRoot, workspaceId);
  try {
    if (!existsSync(workspaceReportsDir)) {
      mkdirSync(workspaceReportsDir, { recursive: true });
    }
    const driftFilePath = path.join(workspaceReportsDir, 'drift.json');
    writeFileSync(driftFilePath, JSON.stringify({ warnings }, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[ERROR] Failed to write drift.json: ${err}`);
  }
}

