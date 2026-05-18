/**
 * Writes ArchitectureReport to disk as JSON.
 *
 * Default output path: knowledge/reports/{workspaceId}/architecture.json
 * Supports custom output path override via the `outputPath` parameter.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { ArchitectureReport } from './types.js';

export class ArchitectureReportWriter {
  write(workspaceId: string, report: ArchitectureReport, outputPath?: string): string {
    const path = outputPath ?? join('knowledge', 'reports', workspaceId, 'architecture.json');
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(report, null, 2));
    } catch (error) {
      throw new Error(
        `Failed to write architecture report to ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return path;
  }
}
