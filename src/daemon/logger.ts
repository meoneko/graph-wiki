import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents a structured log event written to the daemon JSONL log.
 */
export interface DaemonLogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  workspaceId?: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Synchronously appends a single JSON log line to the specified log file.
 * Creates parent directories if they don't exist.
 * Each line is a complete JSON object followed by a newline.
 */
export function appendLog(logPath: string, event: DaemonLogEvent): void {
  const dir = path.dirname(logPath);
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(logPath, line, 'utf-8');
}
