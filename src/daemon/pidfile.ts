import fs from 'node:fs';
import path from 'node:path';

/**
 * Writes a PID number to the specified file.
 * Creates parent directories if they don't exist.
 */
export function writePid(filePath: string, pid: number): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, String(pid) + '\n', 'utf-8');
}

/**
 * Reads a PID from the specified file.
 * Returns null if the file doesn't exist or contains invalid content.
 */
export function readPid(filePath: string): number | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    const pid = parseInt(raw, 10);
    if (Number.isNaN(pid) || pid <= 0) return null;
    return pid;
  } catch {
    return null;
  }
}

/**
 * Deletes the PID file. No-op if the file doesn't exist.
 */
export function clearPid(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // Ignore errors (file may not exist)
  }
}

/**
 * Checks if a process with the given PID is currently running.
 * Uses the `process.kill(pid, 0)` trick which throws if the process doesn't exist.
 */
export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
