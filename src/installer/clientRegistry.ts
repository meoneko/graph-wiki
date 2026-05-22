import os from 'node:os';
import path from 'node:path';

/**
 * Defines a known MCP client that can be auto-detected and configured.
 */
export interface ClientDefinition {
  /** Unique identifier, e.g. "claude-desktop" */
  id: string;
  /** Human-readable label, e.g. "Claude Desktop" */
  label: string;
  /** OS-specific config file paths (keyed by NodeJS.Platform) */
  configPaths: Partial<Record<NodeJS.Platform, string>>;
  /** Format of the config file determines JSON key structure */
  configFormat: 'claude-desktop' | 'vscode-mcp';
}

/**
 * Resolves platform-specific path tokens:
 * - `~` → os.homedir()
 * - `%APPDATA%` → process.env.APPDATA (Windows)
 */
export function expandConfigPath(rawPath: string): string {
  let resolved = rawPath;
  if (resolved.startsWith('~')) {
    resolved = path.join(os.homedir(), resolved.slice(1));
  }
  if (resolved.includes('%APPDATA%')) {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    resolved = resolved.replace('%APPDATA%', appData);
  }
  return path.normalize(resolved);
}

/**
 * Known MCP-capable clients with their platform-specific config paths.
 */
export const CLIENT_REGISTRY: ClientDefinition[] = [
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    configPaths: {
      win32: '%APPDATA%\\Claude\\claude_desktop_config.json',
      darwin: '~/.config/claude/claude_desktop_config.json',
      linux: '~/.config/claude/claude_desktop_config.json',
    },
    configFormat: 'claude-desktop',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    configPaths: {
      win32: '%APPDATA%\\Cursor\\User\\globalStorage\\mcp.json',
      darwin: '~/.cursor/mcp.json',
      linux: '~/.cursor/mcp.json',
    },
    configFormat: 'vscode-mcp',
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    configPaths: {
      win32: '%APPDATA%\\Windsurf\\mcp.json',
      darwin: '~/.codeium/windsurf/mcp.json',
      linux: '~/.codeium/windsurf/mcp.json',
    },
    configFormat: 'vscode-mcp',
  },
  {
    id: 'vscode',
    label: 'VS Code',
    configPaths: {
      win32: '%APPDATA%\\Code\\User\\globalStorage\\mcp.json',
      darwin: '~/.vscode/mcp.json',
      linux: '~/.vscode/mcp.json',
    },
    configFormat: 'vscode-mcp',
  },
];
