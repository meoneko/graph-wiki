PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,
  workspace   TEXT NOT NULL,
  project     TEXT NOT NULL,
  label       TEXT NOT NULL,
  type        TEXT NOT NULL,
  roles       TEXT NOT NULL DEFAULT '[]',
  language    TEXT NOT NULL DEFAULT 'unknown',
  framework   TEXT,
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
