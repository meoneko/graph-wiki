import fs from 'node:fs';
import path from 'node:path';
import type { ClientDefinition } from './clientRegistry.js';
import { expandConfigPath } from './clientRegistry.js';

/**
 * A client definition enriched with detection results.
 */
export interface DetectedClient extends ClientDefinition {
  /** Resolved absolute path to the config file for the current platform */
  configPath: string;
  /** Whether the config file (or its parent directory) exists on disk */
  detected: boolean;
}

/**
 * Detects which MCP clients are installed by checking whether their
 * config file paths exist on the current platform.
 *
 * For each client in the registry, resolves the platform-specific config path
 * and checks if the file or its parent directory exists.
 */
export function detectClients(registry: ClientDefinition[]): DetectedClient[] {
  const platform = process.platform;

  return registry.map((client) => {
    const rawPath = client.configPaths[platform];

    // No config path defined for this platform — mark as not detected
    if (!rawPath) {
      return {
        ...client,
        configPath: '',
        detected: false,
      };
    }

    const configPath = expandConfigPath(rawPath);
    const detected = fileOrParentExists(configPath);

    return {
      ...client,
      configPath,
      detected,
    };
  });
}

/**
 * Checks if the file exists, or if its parent directory exists
 * (the config file may not yet be created but the client is installed).
 */
function fileOrParentExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    // File doesn't exist — check parent directory
    try {
      const parentDir = path.dirname(filePath);
      if (!parentDir || parentDir === filePath) return false;
      fs.accessSync(parentDir, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
