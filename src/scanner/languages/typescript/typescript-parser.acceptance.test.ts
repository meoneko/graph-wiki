import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TypeScriptTreeSitterParser } from './TypeScriptTreeSitterParser.js';
import { WebTreeSitterWrapper } from '../../core/WebTreeSitterWrapper.js';

function fixture(name: string): string {
  return fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));
}

async function parseFixture(name: string) {
  const parser = new TypeScriptTreeSitterParser();
  const filePath = fixture(name);
  const source = await readFile(filePath, 'utf-8');
  return parser.parse(source, filePath);
}

describe('TypeScriptTreeSitterParser', () => {
  it('extracts TypeScript functions, classes, imports, exports, decorators, and scoped calls', async () => {
    const parsed = await parseFixture('basic.ts');
    const byName = new Map(parsed.symbols.map((symbol) => [symbol.name, symbol]));

    expect(parsed.imports.map((imp) => imp.module)).toContain('./dep');
    expect(byName.get('Worker')?.kind).toBe('class');
    expect(byName.get('Worker')?.annotations).toContain('@service');
    expect(byName.get('Worker')?.isPublic).toBe(true);
    expect(byName.get('doWork')?.isPublic).toBe(true);
    expect(byName.get('localHelper')?.isPublic).toBe(true);
    expect(byName.get('doWork')?.calledSymbols.map((call) => call.name)).toEqual(expect.arrayContaining(['innerCall', 'importedHelper']));
    expect(byName.get('localHelper')?.calledSymbols.map((call) => call.name)).toContain('doWork');
  });

  it('extracts TSX components via JSX CST nodes and hooks by name', async () => {
    const parsed = await parseFixture('component.tsx');
    const byName = new Map(parsed.symbols.map((symbol) => [symbol.name, symbol]));

    expect(byName.get('Dashboard')?.annotations).toContain('jsx_component');
    expect(byName.get('Dashboard')?.isEntrypoint).toBe(true);
    expect(byName.get('Card')?.annotations).toContain('jsx_component');
    expect(byName.get('useDashboard')?.name).toMatch(/^use[A-Z]/);
    expect(byName.get('Dashboard')?.calledSymbols.map((call) => call.name)).toEqual(expect.arrayContaining(['useState', 'refresh']));
  });

  it('extracts React components wrapped by CST call expressions', async () => {
    const parser = new TypeScriptTreeSitterParser();
    const parsed = await parser.parse(`
      import React, { memo, forwardRef } from 'react';
      export const MemoCard = memo(() => <article />);
      export const ForwardedCard = React.forwardRef(function ForwardedCard() {
        return <section />;
      });
      export default connect(mapState)(function Screen() {
        return <main />;
      });
      export const routes = [{ path: '/users', element: <Users /> }];
    `, 'wrapped.tsx');
    const byName = new Map(parsed.symbols.map((symbol) => [symbol.name, symbol]));

    expect(byName.get('MemoCard')?.annotations).toContain('jsx_component');
    expect(byName.get('ForwardedCard')?.annotations).toContain('jsx_component');
    expect(byName.get('Screen')?.annotations).toContain('jsx_component');
    expect(byName.get('Route:/users')?.annotations).toContain('ts_route');
    expect(byName.get('Route:/users')?.calledSymbols.map((call) => call.name)).toContain('Users');
  });

  it('extracts JavaScript imports, require calls, and functions', async () => {
    const parsed = await parseFixture('basic.js');

    expect(parsed.imports.map((imp) => imp.module)).toEqual(expect.arrayContaining(['./runner.js', './legacy']));
    expect(parsed.symbols.map((symbol) => symbol.name)).toContain('start');
  });

  it('extracts JSX components via JSX CST nodes', async () => {
    const parsed = await parseFixture('component.jsx');
    const panel = parsed.symbols.find((symbol) => symbol.name === 'Panel');

    expect(panel?.annotations).toContain('jsx_component');
    expect(panel?.calledSymbols.map((call) => call.name)).toContain('renderPanel');
  });

  it('loads all selected VS Code grammar WASMs and reports missing grammars clearly', async () => {
    await expect(WebTreeSitterWrapper.create({ backendId: 'test', wasmFile: 'tree-sitter-c-sharp.wasm' })).resolves.toBeDefined();
    await expect(WebTreeSitterWrapper.create({ backendId: 'test', wasmFile: 'tree-sitter-typescript.wasm' })).resolves.toBeDefined();
    await expect(WebTreeSitterWrapper.create({ backendId: 'test', wasmFile: 'tree-sitter-tsx.wasm' })).resolves.toBeDefined();
    await expect(WebTreeSitterWrapper.create({ backendId: 'test', wasmFile: 'tree-sitter-javascript.wasm' })).resolves.toBeDefined();
    await expect(WebTreeSitterWrapper.create({ backendId: 'test', wasmFile: 'missing.wasm' })).rejects.toThrow(/Grammar WASM not found: missing\.wasm/);
  });
});
