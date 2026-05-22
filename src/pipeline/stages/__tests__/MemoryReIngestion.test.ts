import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDB, closeDB, type ExternalMemoryRow } from '../../../storage/GraphDB.js';
import {
  parseAnnotationsFromMarkdown,
  reingestWikiAnnotations
} from '../01b_reingest.js';
import {
  computeASTSignatureHash,
  reconcileAnnotations
} from '../01b_reingest.js';

// Setup secret and HMAC signature helpers
const TEST_SECRET = 'team-shared-secret-key-12345';
process.env.ANNOTATION_SECRET = TEST_SECRET;

function generateSignature(nodeId: string, author: string, content: string): string {
  const commentText = `node_id: ${nodeId}\nauthor: ${author}\n---\n${content}`;
  return crypto.createHmac('sha256', TEST_SECRET).update(commentText).digest('hex');
}

describe('Memory & Wiki Re-Ingestion Loop', () => {
  let db: any;

  beforeEach(() => {
    db = getDB(':memory:');
    // Clear any existing tables or data if they persist in the singleton
    db.db.exec('DELETE FROM external_memory; DELETE FROM stale_annotations;');
  });

  afterEach(() => {
    closeDB(':memory:');
  });

  describe('Annotation Parser (parseAnnotationsFromMarkdown)', () => {
    it('should extract human annotations and verify valid HMAC signatures', () => {
      const nodeId = 'CreateOrderUseCase';
      const content = 'Processes creation of new orders in system.';
      const signature = generateSignature(nodeId, 'human', content);

      const markdown = `
# Overview of CreateOrder
This is some documentation.

<!-- annotation
node_id: ${nodeId}
author: human
signature: ${signature}
---
${content}
-->

Some other random text.
`;

      const annotations = parseAnnotationsFromMarkdown(markdown);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].node_id).toBe(nodeId);
      expect(annotations[0].author).toBe('human');
      expect(annotations[0].annotation).toBe(content);
      expect(annotations[0].signature).toBe(signature);
    });

    it('should ignore system-generated reflections within safe wrapping blocks', () => {
      const markdown = `
# Page Header

<!-- BEGIN GENERATED ANNOTATIONS -->
## Speculations
<!-- annotation
node_id: SpeculativeNode
author: agent
---
This is a speculative annotation.
-->
- Speculative point 1
<!-- END GENERATED ANNOTATIONS -->

Some actual human content:
<!-- annotation
node_id: RealNode
author: human
signature: dummy_signature
---
Genuine annotation.
-->
`;

      const annotations = parseAnnotationsFromMarkdown(markdown);
      // It should strip the GENERATED block entirely and only parse RealNode
      expect(annotations).toHaveLength(1);
      expect(annotations[0].node_id).toBe('RealNode');
    });

    it('should fallback to agent demotion on failed signature verification', async () => {
      const nodeId = 'CreateOrderUseCase';
      const content = 'Hack the planet.';
      // Use wrong signature
      const signature = 'wrong_hmac_signature';

      const markdown = `
<!-- annotation
node_id: ${nodeId}
author: human
signature: ${signature}
---
${content}
-->
`;

      const annotations = parseAnnotationsFromMarkdown(markdown);
      expect(annotations).toHaveLength(1);
      
      // Stage execution test for HMAC validation
      const workspace = { id: 'test-workspace', root: '.' };
      const tempWikiRoot = path.join(__dirname, 'test_wiki_tmp');
      const config = { outputs: { wiki_root: tempWikiRoot } } as any;

      // Mock a wiki root folder with this markdown
      const wikiDir = path.join(tempWikiRoot, 'test-workspace');
      fs.mkdirSync(wikiDir, { recursive: true });
      fs.writeFileSync(path.join(wikiDir, 'overview.md'), markdown, 'utf-8');

      try {
        await reingestWikiAnnotations(workspace, config, db);
        const rows = db.getExternalMemoryByWorkspace('test-workspace');
        expect(rows).toHaveLength(1);
        // Expect human to be demoted to agent due to invalid HMAC!
        expect(rows[0].author).toBe('agent');
        expect(rows[0].confidence_band).toBe('INFERRED');
      } finally {
        fs.rmSync(tempWikiRoot, { recursive: true, force: true });
      }
    });
  });

  describe('Post-Build Annotation Reconciliation & AST Signature Validation', () => {
    it('should update ast_signature_hash for matching nodes and detect signature drift', async () => {
      const workspaceId = 'test-workspace';

      // 1. Insert an external memory record with initial NULL/old signature hash
      const row: ExternalMemoryRow = {
        id: 'ann-1',
        node_id: 'CreateOrderUseCase',
        workspace: workspaceId,
        author: 'human',
        annotation: 'Original comment.',
        provenance_info: '{}',
        confidence_band: 'AUTHORITATIVE',
        ast_signature_hash: 'old-signature-hash',
      };
      db.upsertExternalMemory(row);

      // 2. Prepare nodes list incompiled graph
      const nodes = [
        {
          id: 'CreateOrderUseCase',
          workspace: workspaceId,
          type: 'method',
          symbol: 'CreateOrderUseCase',
          metadata: {
            lang_meta: {
              kind: 'method',
              parameters: [{ name: 'order', type: 'OrderDto' }],
              returnType: 'Promise<OrderResult>',
            }
          }
        }
      ];

      const computedHash = computeASTSignatureHash(nodes[0]);
      expect(computedHash).toBeDefined();

      const tempReportsRoot = path.join(__dirname, 'test_reports_tmp');
      const config = { outputs: { reports_root: tempReportsRoot } } as any;

      try {
        await reconcileAnnotations(workspaceId, nodes, db, config);

        // Fetch refreshed record
        const updated = db.getExternalMemoryByWorkspace(workspaceId);
        expect(updated).toHaveLength(1);
        // The AST signature hash should now be reconciled to the new correct hash!
        expect(updated[0].ast_signature_hash).toBe(computedHash);

        // Check that a drift warning was written because expected_hash ('old-signature-hash') !== actual_hash
        const driftFile = path.join(tempReportsRoot, workspaceId, 'drift.json');
        expect(fs.existsSync(driftFile)).toBe(true);
        const driftReport = JSON.parse(fs.readFileSync(driftFile, 'utf-8'));
        expect(driftReport.warnings).toHaveLength(1);
        expect(driftReport.warnings[0].type).toBe('AST_DRIFT');
        expect(driftReport.warnings[0].node_id).toBe('CreateOrderUseCase');
      } finally {
        fs.rmSync(tempReportsRoot, { recursive: true, force: true });
      }
    });

    it('should archive orphan annotations and clean them from external_memory', async () => {
      const workspaceId = 'test-workspace';

      // Insert an external memory record for an orphan node
      const row: ExternalMemoryRow = {
        id: 'ann-orphan',
        node_id: 'DeletedService',
        workspace: workspaceId,
        author: 'human',
        annotation: 'This class has been removed.',
        provenance_info: '{}',
        confidence_band: 'AUTHORITATIVE',
        ast_signature_hash: null,
      };
      db.upsertExternalMemory(row);

      // Current compiled graph does NOT contain 'DeletedService'
      const nodes: any[] = [];
      const tempReportsRoot = path.join(__dirname, 'test_reports_tmp2');
      const config = { outputs: { reports_root: tempReportsRoot } } as any;

      try {
        await reconcileAnnotations(workspaceId, nodes, db, config);

        // It should be deleted from active external_memory
        const active = db.getExternalMemoryByWorkspace(workspaceId);
        expect(active).toHaveLength(0);

        // It should be archived in stale_annotations
        const stale = db.getStaleAnnotations(workspaceId);
        expect(stale).toHaveLength(1);
        expect(stale[0].original_node_id).toBe('DeletedService');
        expect(stale[0].stale_reason).toBe('ORPHAN');

        // Check drift warning details
        const driftFile = path.join(tempReportsRoot, workspaceId, 'drift.json');
        expect(fs.existsSync(driftFile)).toBe(true);
        const driftReport = JSON.parse(fs.readFileSync(driftFile, 'utf-8'));
        expect(driftReport.warnings).toHaveLength(1);
        expect(driftReport.warnings[0].type).toBe('ORPHAN');
        expect(driftReport.warnings[0].node_id).toBe('DeletedService');
      } finally {
        fs.rmSync(tempReportsRoot, { recursive: true, force: true });
      }
    });
  });
});
