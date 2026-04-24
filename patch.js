const fs = require('fs');
let code = fs.readFileSync('src/storage/GraphDB.ts', 'utf8');

code = code.replace(
  /const MIGRATIONS: Array<{ version: string; sql: string }> = \[\r?\n  { version: '0001_init', sql: MIGRATION_0001 },\r?\n  { version: '0002_updated_at', sql: MIGRATION_0002 },\r?\n\];/,
  `const MIGRATION_0003 = \`
ALTER TABLE nodes ADD COLUMN trust_level TEXT;
ALTER TABLE edges ADD COLUMN trust_level TEXT;
\`;

const MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: '0001_init', sql: MIGRATION_0001 },
  { version: '0002_updated_at', sql: MIGRATION_0002 },
  { version: '0003_trust_level', sql: MIGRATION_0003 },
];`
);

code = code.replace(
  /INSERT INTO nodes\((.*?)\)\s+VALUES \((.*?)\)\s+ON CONFLICT\(id\) DO UPDATE SET([\s\S]*?)updated_at=excluded.updated_at/,
  (match, cols, vals, update) => {
    if (!cols.includes('trust_level')) {
      cols = cols.replace('confidence, source_file', 'confidence, trust_level, source_file');
      vals = vals.replace('@confidence, @source_file', '@confidence, @trust_level, @source_file');
      update = update.replace('confidence=excluded.confidence, source_file=excluded.source_file', 'confidence=excluded.confidence, trust_level=excluded.trust_level, source_file=excluded.source_file');
    }
    return `INSERT INTO nodes(${cols})\n      VALUES (${vals})\n      ON CONFLICT(id) DO UPDATE SET${update}updated_at=excluded.updated_at`;
  }
);

code = code.replace(
  /INSERT INTO edges\((.*?)\)\s+VALUES \((.*?)\)\s+ON CONFLICT\(id\) DO UPDATE SET([\s\S]*?)updated_at=excluded.updated_at/,
  (match, cols, vals, update) => {
    if (!cols.includes('trust_level')) {
      cols = cols.replace('confidence, metadata', 'confidence, trust_level, metadata');
      vals = vals.replace('@confidence, @metadata', '@confidence, @trust_level, @metadata');
      update = update.replace('confidence=excluded.confidence,\r\n        metadata=excluded.metadata', 'confidence=excluded.confidence, trust_level=excluded.trust_level,\r\n        metadata=excluded.metadata');
      update = update.replace('confidence=excluded.confidence,\n        metadata=excluded.metadata', 'confidence=excluded.confidence, trust_level=excluded.trust_level,\n        metadata=excluded.metadata');
    }
    return `INSERT INTO edges(${cols})\n      VALUES (${vals})\n      ON CONFLICT(id) DO UPDATE SET${update}updated_at=excluded.updated_at`;
  }
);

fs.writeFileSync('src/storage/GraphDB.ts', code);
console.log('GraphDB.ts updated');
