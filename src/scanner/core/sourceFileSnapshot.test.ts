import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { readSourceFileSnapshot } from './sourceFileSnapshot.js';

describe('readSourceFileSnapshot', () => {
  it('decodes UTF-16LE and hashes raw bytes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'crg-snapshot-'));
    try {
      const file = join(dir, 'Sample.cs');
      const raw = Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from('class Sample {}\n', 'utf16le'),
      ]);
      await writeFile(file, raw);

      const snapshot = await readSourceFileSnapshot(file);

      expect(snapshot.encoding).toBe('utf16le');
      expect(snapshot.content).toContain('class Sample');
      expect(snapshot.sizeBytes).toBe(raw.byteLength);
      expect(snapshot.hash).toMatch(/^[a-f0-9]{40}$/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

