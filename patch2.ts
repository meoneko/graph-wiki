import * as fs from 'fs';

let dbCode = fs.readFileSync('src/storage/GraphDB.ts', 'utf8');
dbCode = dbCode.replace(
    /  close\(\): void \{/,
    `  searchNodesFTS(query: string, limit = 5): import('../core/types.js').GraphNode[] {
    const rows = this.db.prepare('SELECT id FROM nodes_fts WHERE nodes_fts MATCH ? LIMIT ?').all(query, limit) as { id: string }[];
    return rows.map(r => this.getNode(r.id)).filter((n): n is import('../core/types.js').GraphNode => Boolean(n));
  }

  close(): void {`
);
fs.writeFileSync('src/storage/GraphDB.ts', dbCode);

let cliCode = fs.readFileSync('src/cli/index.ts', 'utf8');
const replacement = `  if (command === 'ask') {
    const question = rest.find((r) => !r.startsWith('--'));
    if (!question) throw new Error('ask requires <question>');
    const isExact = hasFlag(rest, '--exact');
    const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
    
    // We import here or it's already imported
    const db = getDB(resolveDbPath());
    
    // Filter out node where graph_kind is exploratory maybe? Or just all nodes.
    let nodes = db.getNodesBySymbol(question, ws.id);

    if (nodes.length === 0 && !isExact) {
      try {
        nodes = db.searchNodesFTS(question);
        // filter by workspace if needed:
        nodes = nodes.filter(n => n.workspace === ws.id);
      } catch (e) {}
    }

    if (nodes.length === 0) {
      console.log('INSUFFICIENT_EVIDENCE');
    } else if (nodes.length === 1) {
      console.log('OK');
      console.log(JSON.stringify(nodes[0], null, 2));
    } else {
      console.log('AMBIGUOUS');
      console.log(JSON.stringify(nodes.map(n => ({ id: n.id, symbol: n.symbol })), null, 2));
    }
    return;
  }`;

cliCode = cliCode.replace(/  if \(command === 'ask'\) \{[\s\S]*?return;\n  \}/, replacement);
fs.writeFileSync('src/cli/index.ts', cliCode);
console.log('Updated index.ts and GraphDB.ts for ask contract');
