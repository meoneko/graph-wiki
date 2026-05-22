import fs from 'node:fs';
import path from 'node:path';
import type { ClientDefinition } from './clientRegistry.js';

/**
 * Represents an MCP server entry to be written into a client's config file.
 */
export interface McpServerEntry {
  command: string;
  args: string[];
  cwd?: string;
}

/**
 * Result of a writeClientConfig operation.
 */
export interface WriteResult {
  written: boolean;
  action: 'created' | 'updated' | 'unchanged';
}

/**
 * Returns the JSON key under which server entries are stored,
 * based on the client's config format.
 *
 * - `claude-desktop` → `mcpServers`
 * - `vscode-mcp` → `servers`
 */
function getServersKey(format: ClientDefinition['configFormat']): string {
  return format === 'claude-desktop' ? 'mcpServers' : 'servers';
}

/**
 * Deep-equality check for MCP server entries.
 * Compares command, args (order-sensitive), and optional cwd.
 */
function entriesMatch(existing: unknown, entry: McpServerEntry): boolean {
  if (typeof existing !== 'object' || existing === null) return false;

  const obj = existing as Record<string, unknown>;

  if (obj.command !== entry.command) return false;

  if (!Array.isArray(obj.args) || obj.args.length !== entry.args.length) return false;
  for (let i = 0; i < entry.args.length; i++) {
    if (obj.args[i] !== entry.args[i]) return false;
  }

  // Compare cwd: both undefined/absent = match; both present and equal = match
  const existingCwd = obj.cwd as string | undefined;
  if (entry.cwd !== undefined) {
    if (existingCwd !== entry.cwd) return false;
  } else {
    if (existingCwd !== undefined) return false;
  }

  // Check no extra keys beyond command, args, cwd
  const expectedKeys = new Set(['command', 'args']);
  if (entry.cwd !== undefined) expectedKeys.add('cwd');
  const existingKeys = Object.keys(obj);
  if (existingKeys.length !== expectedKeys.size) return false;
  for (const key of existingKeys) {
    if (!expectedKeys.has(key)) return false;
  }

  return true;
}

/**
 * Writes (or merges) an MCP server entry into a client's config file.
 *
 * Behavior:
 * - If the config file does not exist, creates it with the server entry.
 * - If the config file exists, merges the entry under the correct key
 *   without removing other entries.
 * - If the entry already matches exactly, returns `unchanged` without writing.
 * - If the config file contains malformed JSON, throws an error with the file path.
 * - In `dryRun` mode, never writes to disk.
 *
 * @param configPath - Absolute path to the client's config JSON file
 * @param serverName - Key name for the server entry (e.g. "code-review-graph")
 * @param entry - The MCP server entry to write
 * @param format - Config format determining the JSON key structure
 * @param dryRun - When true, compute the result without writing to disk
 * @returns The write result indicating what action was taken
 */
export function writeClientConfig(
  configPath: string,
  serverName: string,
  entry: McpServerEntry,
  format: ClientDefinition['configFormat'],
  dryRun: boolean,
): WriteResult {
  const serversKey = getServersKey(format);

  // Read existing config or start with empty object
  let config: Record<string, unknown>;
  let fileExists = false;

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    fileExists = true;
    try {
      config = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`Malformed JSON in config file: ${configPath}`);
    }
  } catch (err) {
    // If the error is our malformed JSON error, re-throw it
    if (err instanceof Error && err.message.startsWith('Malformed JSON')) {
      throw err;
    }
    // File doesn't exist — start fresh
    config = {};
  }

  // Ensure the servers container key exists
  if (typeof config[serversKey] !== 'object' || config[serversKey] === null) {
    config[serversKey] = {};
  }

  const servers = config[serversKey] as Record<string, unknown>;

  // Check idempotency — if entry already matches exactly, return unchanged
  if (serverName in servers && entriesMatch(servers[serverName], entry)) {
    return { written: false, action: 'unchanged' };
  }

  // Determine action type
  const action: 'created' | 'updated' = serverName in servers ? 'updated' : 'created';

  // Build the entry object (only include cwd if defined)
  const entryObj: Record<string, unknown> = {
    command: entry.command,
    args: entry.args,
  };
  if (entry.cwd !== undefined) {
    entryObj.cwd = entry.cwd;
  }

  // Merge the entry
  servers[serverName] = entryObj;

  // Write to disk unless dry-run
  if (!dryRun) {
    // Ensure parent directory exists
    const dir = path.dirname(configPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  }

  return { written: !dryRun, action };
}
