import { CLIENT_REGISTRY } from './clientRegistry.js';
import { detectClients } from './detector.js';
import type { DetectedClient } from './detector.js';
import { writeClientConfig } from './writer.js';
import type { McpServerEntry, WriteResult } from './writer.js';

/**
 * The MCP server entry that `crg install` writes into client configs.
 */
function getServerEntry(): McpServerEntry {
  return {
    command: 'npx',
    args: ['code-review-graph', 'serve-mcp'],
  };
}

/** Summary of install results for a single client. */
interface InstallResult {
  clientId: string;
  label: string;
  action: WriteResult['action'] | 'skipped' | 'error';
  message?: string;
}

/**
 * Orchestrates MCP server installation across detected clients.
 *
 * 1. Detects installed clients (or filters to `clientId` if specified)
 * 2. For each detected client, writes the MCP server entry
 * 3. Prints a per-client result summary
 *
 * @param options.clientId - Install for a specific client only
 * @param options.autoAccept - Skip prompting (install all detected clients)
 * @param options.dryRun - Print what would be written without modifying files
 */
export async function installClients(options: {
  clientId?: string;
  autoAccept?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const { clientId, autoAccept = false, dryRun = false } = options;

  // Detect clients
  let clients: DetectedClient[] = detectClients(CLIENT_REGISTRY);

  // Filter to specific client if --client flag provided
  if (clientId) {
    const match = clients.find((c) => c.id === clientId);
    if (!match) {
      const validIds = CLIENT_REGISTRY.map((c) => c.id).join(', ');
      console.error(`Unknown client: ${clientId}. Valid clients: ${validIds}`);
      process.exitCode = 1;
      return;
    }
    clients = [match];
  }

  // Filter to detected clients only
  const detected = clients.filter((c) => c.detected);

  if (detected.length === 0) {
    console.log('No MCP clients detected on this system.');
    return;
  }

  if (dryRun) {
    console.log('[dry-run] The following changes would be made:\n');
  }

  const serverName = 'code-review-graph';
  const entry = getServerEntry();
  const results: InstallResult[] = [];

  for (const client of detected) {
    // If not auto-accept and not dry-run, we'd normally prompt.
    // For now, without a TTY prompt library, --yes is required for non-interactive use.
    // If neither --yes nor --dry-run, skip with a message.
    if (!autoAccept && !dryRun) {
      results.push({
        clientId: client.id,
        label: client.label,
        action: 'skipped',
        message: 'Use --yes to install without prompting',
      });
      continue;
    }

    try {
      const result = writeClientConfig(
        client.configPath,
        serverName,
        entry,
        client.configFormat,
        dryRun,
      );

      results.push({
        clientId: client.id,
        label: client.label,
        action: result.action,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        clientId: client.id,
        label: client.label,
        action: 'error',
        message,
      });
    }
  }

  // Print summary
  printSummary(results, dryRun);
}

/**
 * Prints a formatted summary of install results.
 */
function printSummary(results: InstallResult[], dryRun: boolean): void {
  const prefix = dryRun ? '[dry-run] ' : '';

  for (const r of results) {
    switch (r.action) {
      case 'created':
        console.log(`${prefix}✓ ${r.label}: config created`);
        break;
      case 'updated':
        console.log(`${prefix}✓ ${r.label}: config updated`);
        break;
      case 'unchanged':
        console.log(`${prefix}· ${r.label}: already configured`);
        break;
      case 'skipped':
        console.log(`  ⊘ ${r.label}: skipped — ${r.message}`);
        break;
      case 'error':
        console.log(`  ✗ ${r.label}: error — ${r.message}`);
        break;
    }
  }

  const installed = results.filter((r) => r.action === 'created' || r.action === 'updated').length;
  const unchanged = results.filter((r) => r.action === 'unchanged').length;
  const skipped = results.filter((r) => r.action === 'skipped').length;
  const errors = results.filter((r) => r.action === 'error').length;

  console.log('');
  if (dryRun) {
    console.log(`[dry-run] Summary: ${installed} would be written, ${unchanged} unchanged, ${skipped} skipped, ${errors} errors`);
  } else {
    console.log(`Summary: ${installed} installed, ${unchanged} unchanged, ${skipped} skipped, ${errors} errors`);
  }
}
