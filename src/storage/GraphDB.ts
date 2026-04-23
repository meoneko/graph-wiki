import Database from 'better-sqlite3';
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

const MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: '0001_init', sql: MIGRATION_0001 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
          this.db.exec(m.sql);
          this.db.prepare('INSERT OR IGNORE INTO schema_migrations(version) VALUES (?)').run(m.version);
        })();
      }
    }
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────

  upsertNode(node: GraphNode): void {
    this.db.prepare(`
      INSERT INTO nodes(id, workspace, project, label, type, graph_kind, confidence, source_file, symbol, http_method, http_path, domain, lang_meta, provenance)
      VALUES (@id, @workspace, @project, @label, @type, @graph_kind, @confidence, @source_file, @symbol, @http_method, @http_path, @domain, @lang_meta, @provenance)
      ON CONFLICT(id) DO UPDATE SET
        workspace=excluded.workspace, project=excluded.project, label=excluded.label, type=excluded.type,
        graph_kind=excluded.graph_kind, confidence=excluded.confidence, source_file=excluded.source_file,
        symbol=excluded.symbol, http_method=excluded.http_method, http_path=excluded.http_path,
        domain=excluded.domain, lang_meta=excluded.lang_meta, provenance=excluded.provenance
    `).run({ ...node, lang_meta: JSON.stringify(node.lang_meta ?? {}), provenance: JSON.stringify(node.provenance ?? {}) });

    this.db.prepare(`
      INSERT INTO nodes_fts(rowid, id, label, symbol, http_path, domain)
      VALUES ((SELECT rowid FROM nodes WHERE id = ?), ?, ?, ?, ?, ?)
      ON CONFLICT(rowid) DO UPDATE SET
        id=excluded.id, label=excluded.label, symbol=excluded.symbol,
        http_path=excluded.http_path, domain=excluded.domain
    `).run(node.id, node.id, node.label, node.symbol ?? '', node.http_path ?? '', node.domain ?? '');
  }

  getNode(id: string): GraphNode | undefined {
    const row = this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.mapNode(row) : undefined;
  }

  getNodesByWorkspace(workspace: string, graphKind = 'canonical'): GraphNode[] {
    return (this.db.prepare('SELECT * FROM nodes WHERE workspace = ? AND graph_kind = ?').all(workspace, graphKind) as Record<string, unknown>[]).map((r) => this.mapNode(r));
  }

  getNodesBySymbol(symbol: string, workspace?: string): GraphNode[] {
    const rows = workspace
      ? this.db.prepare('SELECT * FROM nodes WHERE symbol = ? AND workspace = ?').all(symbol, workspace)
      : this.db.prepare('SELECT * FROM nodes WHERE symbol = ?').all(symbol);
    return (rows as Record<string, unknown>[]).map((r) => this.mapNode(r));
  }

  deleteNodesByWorkspace(workspace: string): void {
    this.db.prepare('DELETE FROM nodes WHERE workspace = ?').run(workspace);
  }

  // ── Edges ─────────────────────────────────────────────────────────────────

  upsertEdge(edge: GraphEdge): void {
    this.db.prepare(`
      INSERT INTO edges(id, workspace, from_id, to_id, type, graph_kind, confidence, metadata, provenance)
      VALUES (@id, @workspace, @from_id, @to_id, @type, @graph_kind, @confidence, @metadata, @provenance)
      ON CONFLICT(id) DO UPDATE SET
        workspace=excluded.workspace, from_id=excluded.from_id, to_id=excluded.to_id,
        type=excluded.type, graph_kind=excluded.graph_kind, confidence=excluded.confidence,
        metadata=excluded.metadata, provenance=excluded.provenance
    `).run({ ...edge, metadata: JSON.stringify(edge.metadata ?? {}), provenance: JSON.stringify(edge.provenance ?? {}) });
  }

  getEdgesFrom(nodeId: string): GraphEdge[] {
    return (this.db.prepare('SELECT * FROM edges WHERE from_id = ?').all(nodeId) as Record<string, unknown>[]).map((r) => this.mapEdge(r));
  }

  getEdgesTo(nodeId: string): GraphEdge[] {
    return (this.db.prepare('SELECT * FROM edges WHERE to_id = ?').all(nodeId) as Record<string, unknown>[]).map((r) => this.mapEdge(r));
  }

  getEdgesByWorkspace(workspace: string): GraphEdge[] {
    return (this.db.prepare('SELECT * FROM edges WHERE workspace = ?').all(workspace) as Record<string, unknown>[]).map((r) => this.mapEdge(r));
  }

  deleteEdgesByWorkspace(workspace: string): void {
    this.db.prepare('DELETE FROM edges WHERE workspace = ?').run(workspace);
  }

  // ── Facts ─────────────────────────────────────────────────────────────────

  upsertFact(fact: NormalizedFact): void {
    const id = fact.fact_id || fact.candidate_id;
    this.db.prepare(`
      INSERT INTO facts(id, workspace, project, type, symbol, source_file, line_start, line_end, status, data, fingerprint)
      VALUES (@id, @workspace, @project, @type, @symbol, @source_file, @line_start, @line_end, @status, @data, @fingerprint)
      ON CONFLICT(id) DO UPDATE SET
        workspace=excluded.workspace, project=excluded.project, type=excluded.type,
        symbol=excluded.symbol, source_file=excluded.source_file, line_start=excluded.line_start,
        line_end=excluded.line_end, status=excluded.status, data=excluded.data, fingerprint=excluded.fingerprint
    `).run({
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

    this.db.prepare(`
      INSERT INTO facts_fts(rowid, id, symbol, source_file)
      VALUES ((SELECT rowid FROM facts WHERE id = ?), ?, ?, ?)
      ON CONFLICT(rowid) DO UPDATE SET id=excluded.id, symbol=excluded.symbol, source_file=excluded.source_file
    `).run(id, id, fact.symbol, fact.source_file);
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
      : this.db.prepare('SELECT n.* FROM nodes_fts f JOIN nodes n ON n.rowid = f.rowid WHERE nodes_fts MATCH ? LIMIT ?').all(query, limit);
    return (rows as Record<string, unknown>[]).map((r) => this.mapNode(r));
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

  // ── Transactions + lifecycle ───────────────────────────────────────────────

  transaction<T>(fn: (db: GraphDB) => T): T {
    return this.db.transaction(() => fn(this))();
  }

  close(): void {
    this.db.close();
  }

  // ── Private mappers ────────────────────────────────────────────────────────

  private mapNode(row: Record<string, unknown>): GraphNode {
    return {
      id: String(row['id']),
      workspace: String(row['workspace']),
      project: String(row['project']),
      label: String(row['label']),
      type: String(row['type']),
      graph_kind: (row['graph_kind'] as GraphNode['graph_kind']) ?? 'canonical',
      confidence: (row['confidence'] as GraphNode['confidence']) ?? 'EXTRACTED',
      source_file: row['source_file'] ? String(row['source_file']) : undefined,
      symbol: row['symbol'] ? String(row['symbol']) : undefined,
      http_method: row['http_method'] ? String(row['http_method']) : undefined,
      http_path: row['http_path'] ? String(row['http_path']) : undefined,
      domain: row['domain'] ? String(row['domain']) : undefined,
      lang_meta: jsonParse<Record<string, unknown>>(row['lang_meta'], {}),
      provenance: jsonParse<Record<string, unknown>>(row['provenance'], {}),
    };
  }

  private mapEdge(row: Record<string, unknown>): GraphEdge {
    return {
      id: String(row['id']),
      workspace: String(row['workspace']),
      from_id: String(row['from_id']),
      to_id: String(row['to_id']),
      type: String(row['type']),
      graph_kind: (row['graph_kind'] as GraphEdge['graph_kind']) ?? 'canonical',
      confidence: (row['confidence'] as GraphEdge['confidence']) ?? 'EXTRACTED',
      metadata: jsonParse<Record<string, unknown>>(row['metadata'], {}),
      provenance: jsonParse<Record<string, unknown>>(row['provenance'], {}),
    };
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
