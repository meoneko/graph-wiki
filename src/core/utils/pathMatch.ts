export function normalizePathForMatch(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+/g, '/').toLowerCase();
}

export function fileMatchesGraphPath(inputFile: string, sourceFile: string | undefined): boolean {
  if (!sourceFile) return false;
  const input = normalizePathForMatch(inputFile);
  const source = normalizePathForMatch(sourceFile);
  return source === input || source.endsWith(`/${input}`) || input.endsWith(`/${source}`);
}
