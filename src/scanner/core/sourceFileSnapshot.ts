import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { TextDecoder } from 'node:util';
import type { SourceFileSnapshot } from './ILanguageParser.js';

function decodeUtf16Be(raw: Buffer): string {
  const length = raw.length - (raw.length % 2);
  const swapped = Buffer.allocUnsafe(length);
  for (let i = 0; i + 1 < length; i += 2) {
    swapped[i] = raw[i + 1] ?? 0;
    swapped[i + 1] = raw[i] ?? 0;
  }
  return new TextDecoder('utf-16le').decode(swapped);
}

function detectAndDecode(raw: Buffer): Pick<SourceFileSnapshot, 'content' | 'encoding'> {
  if (raw.length >= 2) {
    const b0 = raw[0] ?? 0;
    const b1 = raw[1] ?? 0;
    if (b0 === 0xff && b1 === 0xfe) {
      return { content: new TextDecoder('utf-16le').decode(raw.subarray(2)), encoding: 'utf16le' };
    }
    if (b0 === 0xfe && b1 === 0xff) {
      return { content: decodeUtf16Be(raw.subarray(2)), encoding: 'utf16be' };
    }
  }

  const sampleLength = Math.min(raw.length, 4096);
  let evenNulls = 0;
  let oddNulls = 0;
  for (let i = 0; i < sampleLength; i++) {
    if (raw[i] !== 0) continue;
    if (i % 2 === 0) evenNulls++;
    else oddNulls++;
  }

  if (sampleLength > 0 && oddNulls / sampleLength > 0.2) {
    return { content: new TextDecoder('utf-16le').decode(raw), encoding: 'utf16le' };
  }
  if (sampleLength > 0 && evenNulls / sampleLength > 0.2) {
    return { content: decodeUtf16Be(raw), encoding: 'utf16be' };
  }

  return { content: new TextDecoder('utf-8').decode(raw).replace(/\u0000/g, ''), encoding: 'utf8' };
}

export async function readSourceFileSnapshot(filePath: string): Promise<SourceFileSnapshot> {
  const rawBuffer = await readFile(filePath);
  const decoded = detectAndDecode(rawBuffer);
  return {
    filePath,
    rawBuffer,
    content: decoded.content,
    encoding: decoded.encoding,
    hash: createHash('sha1').update(rawBuffer).digest('hex'),
    sizeBytes: rawBuffer.byteLength,
    lineCount: decoded.content.length === 0 ? 0 : decoded.content.split(/\r?\n/).length,
  };
}

