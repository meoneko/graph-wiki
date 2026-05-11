import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GraphEdge, GraphNode, NormalizedFact } from '../core/types.js';

// ── Embedded migrations (no file-read risk in dist builds) ────────────────────

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);
`;

const MIGRATION_0001 = `
CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,
  workspace   TEXT NOT NULL,
  project     TEXT NOT NULL,
  label       TEXT NOT NULL,
  type        TEXT NOT NULL,
  graph_kind  TEXT NOT NULL DEFAULT 'canonical',
  confidence  TEXT NOT NULL DEFAULT 'EXTRACTED',
  source_file TEXT,
  symbol      TEXT,
  http_method TEXT,
  http_path   TEXT,
  domain      TEXT,
  lang_meta   TEXT,
  provenance  TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_nodes_workspace ON nodes(workspace);
CREATE INDEX IF NOT EXISTS idx_nodes_type      ON nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_symbol    ON nodes(symbol);

CREATE TABLE IF NOT EXISTS edges (
  id          TEXT PRIMARY KEY,
  workspace   TEXT NOT NULL,
  from_id     TEXT NOT NULL REFERENCES nodes(id),
  to_id       TEXT NOT NULL REFERENCES nodes(id),
  type        TEXT NOT NULL,
  graph_kind  TEXT NOT NULL DEFAULT 'canonical',
  confidence  TEXT NOT NULL DEFAULT 'EXTRACTED',
  metadata    TEXT,
  provenance  TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_edges_from      ON edges(from_id);
CREATE INDEX IF NOT EXISTS idx_edges_to        ON edges(to_id);
CREATE INDEX IF NOT EXISTS idx_edges_workspace ON edges(workspace);

CREATE TABLE IF NOT EXISTS facts (
  id          TEXT PRIMARY KEY,
  workspace   TEXT NOT NULL,
  project     TEXT NOT NULL,
  type        TEXT NOT NULL,
  symbol      TEXT NOT NULL,
  source_file TEXT NOT NULL,
  line_start  INTEGER,
  line_end    INTEGER,
  status      TEXT NOT NULL DEFAULT 'candidate',
  data        TEXT NOT NULL,
  fingerprint TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_facts_workspace ON facts(workspace);
CREATE INDEX IF NOT EXISTS idx_facts_type      ON facts(type);
CREATE INDEX IF NOT EXISTS idx_facts_status    ON facts(status);

CREATE TABLE IF NOT EXISTS rejects (
  id          TEXT PRIMARY KEY,
  workspace   TEXT,
  project     TEXT,
  stage       TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  details     TEXT,
  source_file TEXT,
  symbol      TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_rejects_reason ON rejects(reason_code);

CREATE TABLE IF NOT EXISTS file_hashes (
  project     TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  hash        TEXT NOT NULL,
  synced_at   INTEGER NOT NULL,
  PRIMARY KEY (project, file_path)
);

CREATE TABLE IF NOT EXISTS semantic_facts (
  id          TEXT PRIMARY KEY,
  workspace   TEXT NOT NULL,
  kind        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  relation    TEXT NOT NULL,
  object      TEXT NOT NULL,
  confidence  TEXT NOT NULL,
  stale       INTEGER NOT NULL DEFAULT 0,
  data        TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS embeddings (
  node_id     TEXT PRIMARY KEY REFERENCES nodes(id),
  model       TEXT NOT NULL,
  vector      BLOB NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  id UNINDEXED,
  label,
  symbol,
  http_path,
  domain
);

CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts USING fts5(
  id UNINDEXED,
  symbol,
  source_file
);
`;

const MIGRATION_0002 = `
ALTER TABLE nodes ADD COLUMN updated_at TEXT;
ALTER TABLE edges ADD COLUMN updated_at TEXT;
`;

const MIGRATION_0003 = `
ALTER TABLE nodes ADD COLUMN trust_level TEXT;
ALTER TABLE edges ADD COLUMN trust_level TEXT;
`;

const MIGRATION_0004 = `
CREATE TABLE IF NOT EXISTS flows (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace      TEXT NOT NULL,
  name           TEXT NOT NULL,
  entry_point_id TEXT NOT NULL,
  depth          INTEGER NOT NULL DEFAULT 0,
  node_count     INTEGER NOT NULL DEFAULT 0,
  file_count     INTEGER NOT NULL DEFAULT 0,
  criticality    REAL NOT NULL DEFAULT 0.0,
  path           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_flows_workspace   ON flows(workspace);
CREATE INDEX IF NOT EXISTS idx_flows_criticality ON flows(workspace, criticality DESC);

CREATE TABLE IF NOT EXISTS flow_memberships (
  flow_id  INTEGER NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  node_id  TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (flow_id, node_id)
);
CREATE INDEX IF NOT EXISTS idx_flow_memberships_node ON flow_memberships(node_id);

CREATE TABLE IF NOT EXISTS communities (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace TEXT NOT NULL,
  name      TEXT NOT NULL,
  size      INTEGER NOT NULL DEFAULT 0,
  cohesion  REAL NOT NULL DEFAULT 0.0
);
CREATE INDEX IF NOT EXISTS idx_communities_workspace ON communities(workspace);

CREATE TABLE IF NOT EXISTS community_memberships (
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  node_id      TEXT NOT NULL,
  PRIMARY KEY (community_id, node_id)
);
`;

const MIGRATION_0005 = `
ALTER TABLE nodes ADD COLUMN roles TEXT NOT NULL DEFAULT '[]';
ALTER TABLE nodes ADD COLUMN language TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE nodes ADD COLUMN framework TEXT;
`;

const MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: '0001_init', sql: MIGRATION_0001 },
  { version: '0002_updated_at', sql: MIGRATION_0002 },
  { version: '0003_trust_level', sql: MIGRATION_0003 },
  { version: '0004_postprocess', sql: MIGRATION_0004 },
  { version: '0005_node_roles', sql: MIGRATION_0005 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

import {
  mapNodeFromDB,
  mapEdgeFromDB,
  mapNodeToDB,
  mapEdgeToDB,
} from './mappers.js';

function jsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function vecToBuffer(vector: Float32Array): Buffer {
  return Buffer.from(vector.buffer.slice(vector.byteOffset, vector.byteOffset + vector.byteLength));
}

function bufferToVec(buffer: Buffer): Float32Array {
  return new Float32Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.byteLength / 4));
}

function cosine(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return -1;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv; na += av * av; nb += bv * bv;
  }
  if (na === 0 || nb === 0) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ── GraphDB ───────────────────────────────────────────────────────────────────

export class GraphDB {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.applyMigrations();
  }

  private applyMigrations(): void {
    // Step 1: bootstrap the tracking table before querying it
    this.db.exec(BOOTSTRAP_SQL);

    // Step 2: apply any unapplied migrations in order
    const applied = new Set(
      this.db.prepare('SELECT version FROM schema_migrations').pluck().all() as string[],
    );

    for (const m of MIGRATIONS) {
      if (!applied.has(m.version)) {
        this.db.transaction(() => {
          try {
            this.db.exec(m.sql);
            this.db.prepare('INSERT OR IGNORE INTO schema_migrations(version) VALUES (?)').run(m.version);
          } catch (e) {
            console.error(`Migration ${m.version} failed:`, e);
            throw e;
          }
        })();
      }
    }
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────

  upsertNode(node: GraphNode): void {
    this.upsertNodes([node]);
  }

  upsertNodes(nodes: GraphNode[]): void {
    if (nodes.length === 0) return;

    const upsertNode = this.db.prepare(`
      INSERT INTO nodes(id, workspace, project, label, type, roles, language, framework, graph_kind, confidence, trust_level, source_file, symbol, http_method, http_path, domain, lang_meta, provenance, updated_at)
      VALUES (@id, @workspace, @project, @label, @type, @roles, @language, @framework, @graph_kind, @confidence, @trust_level, @source_file, @symbol, @http_method, @http_path, @domain, @lang_meta, @provenance, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        workspace=excluded.workspace, project=excluded.project, label=excluded.label, type=excluded.type,
        roles=excluded.roles, language=excluded.language, framework=excluded.framework,
        graph_kind=excluded.graph_kind, confidence=excluded.confidence, trust_level=excluded.trust_level, source_file=excluded.source_file,
        symbol=excluded.symbol, http_method=excluded.http_method, http_path=excluded.http_path,
        domain=excluded.domain, lang_meta=excluded.lang_meta, provenance=excluded.provenance, updated_at=excluded.updated_at
    `);
    const deleteFts = this.db.prepare(`
      DELETE FROM nodes_fts WHERE rowid = (SELECT rowid FROM nodes WHERE id = ?)
    `);
    const insertFts = this.db.prepare(`
      INSERT INTO nodes_fts(rowid, id, label, symbol, http_path, domain)
      VALUES ((SELECT rowid FROM nodes WHERE id = ?), ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      for (const node of nodes) {
        const row = mapNodeToDB(node);
        upsertNode.run({ ...row, updated_at: node.updated_at || new Date().toISOString() });
        deleteFts.run(node.id);
        insertFts.run(node.id, node.id, node.label, node.symbol ?? '', node.http_path ?? '', node.domain ?? '');
      }
    })();
  }

  getNode(id: string): GraphNode | undefined {
    const row = this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? mapNodeFromDB(row) : undefined;
  }

  getNodesByWorkspace(workspace: string, graphKind = 'canonical'): GraphNode[] {
    return (this.db.prepare('SELECT * FROM nodes WHERE workspace = ? AND graph_kind = ?').all(workspace, graphKind) as Record<string, unknown>[]).map((r) => mapNodeFromDB(r));
  }

  getAllNodesByWorkspace(workspace: string): GraphNode[] {
    return (this.db.prepare('SELECT * FROM nodes WHERE workspace = ?').all(workspace) as Record<string, unknown>[]).map((r) => mapNodeFromDB(r));
  }

  getNodesBySymbol(symbol: string, workspace?: string): GraphNode[] {
    const rows = workspace
      ? this.db.prepare('SELECT * FROM nodes WHERE symbol = ? AND workspace = ?').all(symbol, workspace)
      : this.db.prepare('SELECT * FROM nodes WHERE symbol = ?').all(symbol);
    return (rows as Record<string, unknown>[]).map((r) => mapNodeFromDB(r));
  }

  deleteNodesByWorkspace(workspace: string): void {
    this.db.prepare('DELETE FROM nodes WHERE workspace = ?').run(workspace);
  }

  // ── Edges ─────────────────────────────────────────────────────────────────

  upsertEdge(edge: GraphEdge): void {
    this.upsertEdges([edge]);
  }

  upsertEdges(edges: GraphEdge[]): void {
    if (edges.length === 0) return;

    const upsertEdge = this.db.prepare(`
      INSERT INTO edges(id, workspace, from_id, to_id, type, graph_kind, confidence, trust_level, metadata, provenance, updated_at)
      VALUES (@id, @workspace, @from_id, @to_id, @type, @graph_kind, @confidence, @trust_level, @metadata, @provenance, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        workspace=excluded.workspace, from_id=excluded.from_id, to_id=excluded.to_id,
        type=excluded.type, graph_kind=excluded.graph_kind, confidence=excluded.confidence, trust_level=excluded.trust_level,
        metadata=excluded.metadata, provenance=excluded.provenance, updated_at=excluded.updated_at
    `);

    this.db.transaction(() => {
      for (const edge of edges) {
        const row = mapEdgeToDB(edge);
        upsertEdge.run({ ...row, updated_at: edge.updated_at || new Date().toISOString() });
      }
    })();
  }

  getEdgesFrom(nodeId: string): GraphEdge[] {
    return (this.db.prepare('SELECT * FROM edges WHERE from_id = ?').all(nodeId) as Record<string, unknown>[]).map((r) => mapEdgeFromDB(r));
  }

  getEdgesTo(nodeId: string): GraphEdge[] {
    return (this.db.prepare('SELECT * FROM edges WHERE to_id = ?').all(nodeId) as Record<string, unknown>[]).map((r) => mapEdgeFromDB(r));
  }

  getEdgesByWorkspace(workspace: string): GraphEdge[] {
    return (this.db.prepare('SELECT * FROM edges WHERE workspace = ?').all(workspace) as Record<string, unknown>[]).map((r) => mapEdgeFromDB(r));
  }

  deleteEdgesByWorkspace(workspace: string): void {
    this.db.prepare('DELETE FROM edges WHERE workspace = ?').run(workspace);
  }

  clearWorkspaceData(workspace: string, projectIds: string[]): void {
    this.db.transaction(() => {
      // FTS + embeddings
      this.db.prepare('DELETE FROM nodes_fts WHERE rowid IN (SELECT rowid FROM nodes WHERE workspace = ?)').run(workspace);
      this.db.prepare('DELETE FROM facts_fts WHERE rowid IN (SELECT rowid FROM facts WHERE workspace = ?)').run(workspace);
      this.db.prepare('DELETE FROM embeddings WHERE node_id IN (SELECT id FROM nodes WHERE workspace = ?)').run(workspace);
      // Core graph
      this.db.prepare('DELETE FROM edges WHERE workspace = ?').run(workspace);
      this.db.prepare('DELETE FROM nodes WHERE workspace = ?').run(workspace);
      this.db.prepare('DELETE FROM facts WHERE workspace = ?').run(workspace);
      this.db.prepare('DELETE FROM rejects WHERE workspace = ?').run(workspace);
      // Postprocess — flows/communities CASCADE-delete memberships via FK
      this.db.prepare('DELETE FROM flows WHERE workspace = ?').run(workspace);
      this.db.prepare('DELETE FROM communities WHERE workspace = ?').run(workspace);

      for (const projectId of projectIds) {
        this.db.prepare('DELETE FROM file_hashes WHERE project = ?').run(projectId);
      }
    })();
  }

  // ── Facts ─────────────────────────────────────────────────────────────────

  upsertFact(fact: NormalizedFact): void {
    this.upsertFacts([fact]);
  }

  upsertFacts(facts: NormalizedFact[]): void {
    if (facts.length === 0) return;

    const upsertFact = this.db.prepare(`
      INSERT INTO facts(id, workspace, project, type, symbol, source_file, line_start, line_end, status, data, fingerprint)
      VALUES (@id, @workspace, @project, @type, @symbol, @source_file, @line_start, @line_end, @status, @data, @fingerprint)
      ON CONFLICT(id) DO UPDATE SET
        workspace=excluded.workspace, project=excluded.project, type=excluded.type,
        symbol=excluded.symbol, source_file=excluded.source_file, line_start=excluded.line_start,
        line_end=excluded.line_end, status=excluded.status, data=excluded.data, fingerprint=excluded.fingerprint
    `);
    const deleteFts = this.db.prepare(`
      DELETE FROM facts_fts WHERE rowid = (SELECT rowid FROM facts WHERE id = ?)
    `);
    const insertFts = this.db.prepare(`
      INSERT INTO facts_fts(rowid, id, symbol, source_file)
      VALUES ((SELECT rowid FROM facts WHERE id = ?), ?, ?, ?)
    `);

    this.db.transaction(() => {
      for (const fact of facts) {
        const id = fact.fact_id || fact.candidate_id;
        upsertFact.run({
          id,
          workspace: fact.workspaceId,
          project: fact.project,
          type: fact.candidate_type,
          symbol: fact.symbol,
          source_file: fact.source_file,
          line_start: fact.line_start,
          line_end: fact.line_end,
          status: fact.status,
          data: JSON.stringify(fact),
          fingerprint: `${fact.project}:${fact.source_file}:${fact.symbol}:${fact.line_start}:${fact.line_end}`,
        });
        deleteFts.run(id);
        insertFts.run(id, id, fact.symbol, fact.source_file);
      }
    })();
  }

  getFactsByWorkspace(workspace: string): NormalizedFact[] {
    return (this.db.prepare('SELECT data FROM facts WHERE workspace = ?').all(workspace) as Array<{ data: string }>).map((r) => jsonParse<NormalizedFact>(r.data, {} as NormalizedFact));
  }

  getFactsByProject(project: string): NormalizedFact[] {
    return (this.db.prepare('SELECT data FROM facts WHERE project = ?').all(project) as Array<{ data: string }>).map((r) => jsonParse<NormalizedFact>(r.data, {} as NormalizedFact));
  }

  // ── File hashes ───────────────────────────────────────────────────────────

  getFileHash(project: string, filePath: string): string | undefined {
    return (this.db.prepare('SELECT hash FROM file_hashes WHERE project = ? AND file_path = ?').get(project, filePath) as { hash?: string } | undefined)?.hash;
  }

  upsertFileHash(project: string, filePath: string, hash: string): void {
    this.db.prepare(`
      INSERT INTO file_hashes(project, file_path, hash, synced_at)
      VALUES (?, ?, ?, unixepoch())
      ON CONFLICT(project, file_path) DO UPDATE SET hash=excluded.hash, synced_at=excluded.synced_at
    `).run(project, filePath, hash);
  }

  // ── Search ────────────────────────────────────────────────────────────────

  searchNodesFTS(query: string, workspace?: string, limit = 20): GraphNode[] {
    const rows = workspace
      ? this.db.prepare('SELECT n.* FROM nodes_fts f JOIN nodes n ON n.rowid = f.rowid WHERE nodes_fts MATCH ? AND n.workspace = ? LIMIT ?').all(query, workspace, limit)
      : this.db.prepare('SELECT n.* FROM nodes_fts f JOIN nodes n ON n.id = f.id WHERE nodes_fts MATCH ? LIMIT ?').all(query, limit);
    return (rows as Record<string, unknown>[]).map((r) => mapNodeFromDB(r));
  }

  searchFactsFTS(query: string, workspace?: string, limit = 20): NormalizedFact[] {
    const rows = workspace
      ? this.db.prepare('SELECT fa.data FROM facts_fts f JOIN facts fa ON fa.rowid = f.rowid WHERE facts_fts MATCH ? AND fa.workspace = ? LIMIT ?').all(query, workspace, limit)
      : this.db.prepare('SELECT fa.data FROM facts_fts f JOIN facts fa ON fa.rowid = f.rowid WHERE facts_fts MATCH ? LIMIT ?').all(query, limit);
    return (rows as Array<{ data: string }>).map((r) => jsonParse<NormalizedFact>(r.data, {} as NormalizedFact));
  }

  // ── Embeddings ────────────────────────────────────────────────────────────

  upsertEmbedding(nodeId: string, model: string, vector: Float32Array): void {
    this.db.prepare('INSERT INTO embeddings(node_id, model, vector) VALUES (?, ?, ?) ON CONFLICT(node_id) DO UPDATE SET model=excluded.model, vector=excluded.vector').run(nodeId, model, vecToBuffer(vector));
  }

  getEmbedding(nodeId: string): { vector: Float32Array; model: string } | undefined {
    const row = this.db.prepare('SELECT model, vector FROM embeddings WHERE node_id = ?').get(nodeId) as { model: string; vector: Buffer } | undefined;
    return row ? { model: row.model, vector: bufferToVec(row.vector) } : undefined;
  }

  findSimilarByVector(vector: Float32Array, workspace: string, topK: number): { nodeId: string; score: number }[] {
    const rows = this.db.prepare('SELECT e.node_id, e.vector FROM embeddings e JOIN nodes n ON n.id = e.node_id WHERE n.workspace = ?').all(workspace) as Array<{ node_id: string; vector: Buffer }>;
    return rows
      .map((r) => ({ nodeId: r.node_id, score: cosine(vector, bufferToVec(r.vector)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // ── Flows ─────────────────────────────────────────────────────────────────

  clearFlowsForWorkspace(workspace: string): void {
    // P1 FIX: only clear flows — communities are managed independently by clearCommunitiesForWorkspace.
    // CASCADE deletes flow_memberships automatically via FK.
    this.db.prepare('DELETE FROM flows WHERE workspace = ?').run(workspace);
  }

  clearCommunitiesForWorkspace(workspace: string): void {
    // Idempotent clear — community_memberships cascade-deleted via FK
    this.db.prepare('DELETE FROM communities WHERE workspace = ?').run(workspace);
  }

  insertFlow(workspace: string, flow: {
    name: string;
    entryPointId: string;
    depth: number;
    nodeCount: number;
    fileCount: number;
    criticality: number;
    path: string[];
  }): number {
    const result = this.db.prepare(`
      INSERT INTO flows(workspace, name, entry_point_id, depth, node_count, file_count, criticality, path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workspace,
      flow.name,
      flow.entryPointId,
      flow.depth,
      flow.nodeCount,
      flow.fileCount,
      flow.criticality,
      JSON.stringify(flow.path),
    );
    return result.lastInsertRowid as number;
  }

  insertFlowMemberships(flowId: number, nodeIds: string[]): void {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO flow_memberships(flow_id, node_id, position) VALUES (?, ?, ?)');
    this.db.transaction(() => {
      nodeIds.forEach((nodeId, position) => stmt.run(flowId, nodeId, position));
    })();
  }

  getFlows(workspace: string): Array<{
    id: number;
    name: string;
    entryPointId: string;
    depth: number;
    nodeCount: number;
    fileCount: number;
    criticality: number;
    path: string[];
  }> {
    const rows = this.db.prepare('SELECT * FROM flows WHERE workspace = ? ORDER BY criticality DESC').all(workspace) as Array<{
      id: number; name: string; entry_point_id: string;
      depth: number; node_count: number; file_count: number; criticality: number; path: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      entryPointId: r.entry_point_id,
      depth: r.depth,
      nodeCount: r.node_count,
      fileCount: r.file_count,
      criticality: r.criticality,
      path: jsonParse<string[]>(r.path, []),
    }));
  }

  insertCommunity(workspace: string, community: {
    name: string;
    size: number;
    cohesion: number;
  }): number {
    const result = this.db.prepare(`
      INSERT INTO communities(workspace, name, size, cohesion) VALUES (?, ?, ?, ?)
    `).run(workspace, community.name, community.size, community.cohesion);
    return result.lastInsertRowid as number;
  }

  insertCommunityMemberships(communityId: number, nodeIds: string[]): void {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO community_memberships(community_id, node_id) VALUES (?, ?)');
    this.db.transaction(() => {
      nodeIds.forEach((nodeId) => stmt.run(communityId, nodeId));
    })();
  }

  getCommunities(workspace: string): Array<{
    id: number;
    name: string;
    size: number;
    cohesion: number;
    nodeIds: string[];
  }> {
    const rows = this.db.prepare('SELECT * FROM communities WHERE workspace = ? ORDER BY cohesion DESC').all(workspace) as Array<{
      id: number; name: string; size: number; cohesion: number;
    }>;
    return rows.map((r) => {
      const memberRows = this.db.prepare('SELECT node_id FROM community_memberships WHERE community_id = ?').all(r.id) as Array<{ node_id: string }>;
      return {
        id: r.id,
        name: r.name,
        size: r.size,
        cohesion: r.cohesion,
        nodeIds: memberRows.map((m) => m.node_id),
      };
    });
  }

  // ── Transactions + lifecycle ───────────────────────────────────────────────

  transaction<T>(fn: (db: GraphDB) => T): T {
    return this.db.transaction(() => fn(this))();
  }



  close(): void {
    this.db.close();
  }
}

// ── Singleton registry ─────────────────────────────────────────────────────────

const instances = new Map<string, GraphDB>();

export function getDB(dbPath: string): GraphDB {
  let db = instances.get(dbPath);
  if (!db) {
    db = new GraphDB(dbPath);
    instances.set(dbPath, db);
  }
  return db;
}

export function closeDB(dbPath: string): void {
  const db = instances.get(dbPath);
  if (db) {
    db.close();
    instances.delete(dbPath);
  }
}

export function closeAllDBs(): void {
  for (const [dbPath, db] of instances) {
    db.close();
    instances.delete(dbPath);
  }
}
