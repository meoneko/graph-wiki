import { describe, it, expect } from 'vitest';
import { CSharpAdapter } from '../../src/pipeline/adapters/CSharpAdapter.js';
import type { AdapterContext, CandidateRecord } from '../../src/core/types.js';
import type { ParsedSymbol } from '../../src/scanner/core/ILanguageParser.js';

/**
 * Unit tests for CSharpAdapter method mapping (Task 4.2)
 *
 * Tests that the CSharpAdapter correctly maps ParsedSymbol with kind='method'
 * to CandidateRecord with candidate_type='csharp_method' and populated lang_meta.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
describe('CSharpAdapter - method mapping to CandidateRecord', () => {
  /**
   * Helper: creates an AdapterContext with extractPartialMethods option
   */
  function makeContext(extractPartialMethods: boolean): AdapterContext {
    return {
      workspaceId: 'ws-test',
      projectId: 'proj-test',
      projectRoot: '/test/project',
      options: { extractPartialMethods },
    };
  }

  /**
   * Helper: parses C# source through the full adapter flow (parse → extract)
   * and returns the resulting CandidateRecords.
   */
  async function extractCandidates(source: string, filePath: string, extractPartialMethods: boolean): Promise<CandidateRecord[]> {
    const adapter = new CSharpAdapter();
    const context = makeContext(extractPartialMethods);
    const parsed = await adapter.parse([filePath], context);
    // We can't read from disk in tests, so we use the adapter's parse method
    // with a workaround: directly call extract with pre-built parsed data
    // Instead, let's use the full flow by writing to a temp approach
    // Actually, the adapter reads files from disk. Let's use a different approach:
    // We'll create a CSharpParser directly, get symbols, then feed them to extract()
    return adapter.extract(parsed, context);
  }

  /**
   * Helper: creates a minimal ParsedSymbol for a method
   */
  function makeMethodSymbol(overrides: Partial<ParsedSymbol> = {}): ParsedSymbol {
    return {
      name: 'ProcessOrder',
      qualifiedName: 'Orders.ProcessOrder',
      kind: 'method',
      startLine: 5,
      endLine: 10,
      body: 'public void ProcessOrder(string id) { }',
      calledSymbols: [],
      parameters: [{ name: 'id', type: 'string' }],
      returnType: 'void',
      annotations: [],
      isPublic: true,
      isStatic: false,
      isEntrypoint: false,
      containingClass: 'Orders',
      namespace: 'MyApp.Domain',
      ...overrides,
    };
  }

  /**
   * Helper: feeds pre-built symbols through the adapter's extract() method
   */
  async function extractFromSymbols(
    symbols: ParsedSymbol[],
    filePath: string,
    extractPartialMethods: boolean,
  ): Promise<CandidateRecord[]> {
    const adapter = new CSharpAdapter();
    const context = makeContext(extractPartialMethods);
    // Force parser initialization by calling parse with empty paths first
    // Then call extract with our pre-built file data
    const parsed = { files: [{ filePath, symbols }] };
    // Need to initialize the parser so resolveNodeType has access to options
    // We do this by calling parse with an empty array first
    await adapter.parse([], context);
    return adapter.extract(parsed, context);
  }

  describe('ParsedSymbol with kind=method + containingClass + extractPartialMethods=true → csharp_method', () => {
    it('produces CandidateRecord with candidate_type csharp_method', async () => {
      const symbol = makeMethodSymbol();
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.candidate_type).toBe('csharp_method');
    });

    it('maps a method with all fields populated', async () => {
      const symbol = makeMethodSymbol({
        name: 'ValidateOrder',
        qualifiedName: 'Orders.ValidateOrder',
        parameters: [{ name: 'id', type: 'string' }, { name: 'count', type: 'int' }],
        returnType: 'Task<bool>',
        containingClass: 'Orders',
      });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.Methods.cs', true);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.candidate_type).toBe('csharp_method');
    });
  });

  describe('lang_meta fields are correctly populated', () => {
    it('sets lang_meta.containingClass to the class name', async () => {
      const symbol = makeMethodSymbol({ containingClass: 'OrderService' });
      const candidates = await extractFromSymbols([symbol], 'src/OrderService.cs', true);

      expect(candidates[0]!.lang_meta).toBeDefined();
      expect(candidates[0]!.lang_meta!.containingClass).toBe('OrderService');
    });

    it('sets lang_meta.returnType to the method return type', async () => {
      const symbol = makeMethodSymbol({ returnType: 'Task<bool>' });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      expect(candidates[0]!.lang_meta!.returnType).toBe('Task<bool>');
    });

    it('sets lang_meta.parameters with parentheses stripped and whitespace trimmed', async () => {
      const symbol = makeMethodSymbol({
        parameters: [{ name: 'id', type: 'string' }, { name: 'count', type: 'int' }],
      });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      expect(candidates[0]!.lang_meta!.parameters).toBe('string id, int count');
    });

    it('sets lang_meta.sourceFile to the file path', async () => {
      const symbol = makeMethodSymbol();
      const candidates = await extractFromSymbols([symbol], 'src/Domain/Orders.cs', true);

      expect(candidates[0]!.lang_meta!.sourceFile).toBe('src/Domain/Orders.cs');
    });

    it('sets lang_meta.isPartialClass to true', async () => {
      const symbol = makeMethodSymbol();
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      expect(candidates[0]!.lang_meta!.isPartialClass).toBe(true);
    });

    it('does NOT include namespace in lang_meta', async () => {
      const symbol = makeMethodSymbol({ namespace: 'MyApp.Domain' });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      // namespace should NOT be in lang_meta for csharp_method nodes
      expect(candidates[0]!.lang_meta!).not.toHaveProperty('namespace');
    });

    it('handles method with no parameters', async () => {
      const symbol = makeMethodSymbol({ parameters: [] });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      // Empty parameters should result in undefined or empty string
      const params = candidates[0]!.lang_meta!.parameters;
      expect(params === undefined || params === '').toBe(true);
    });

    it('handles method with void return type', async () => {
      const symbol = makeMethodSymbol({ returnType: 'void' });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      expect(candidates[0]!.lang_meta!.returnType).toBe('void');
    });
  });

  describe('symbols without containingClass are NOT mapped to csharp_method', () => {
    it('maps method symbol without containingClass to csharp_class', async () => {
      const symbol = makeMethodSymbol({ containingClass: undefined });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      // Without containingClass, should NOT be csharp_method
      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.candidate_type).not.toBe('csharp_method');
    });

    it('maps class symbol (kind=class) to csharp_class even with containingClass', async () => {
      const symbol = makeMethodSymbol({
        kind: 'class',
        name: 'Orders',
        qualifiedName: 'Orders',
        containingClass: undefined,
      });
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', true);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.candidate_type).toBe('csharp_class');
    });
  });

  describe('extractPartialMethods=false prevents csharp_method mapping (extension method guard)', () => {
    it('does NOT map method symbols to csharp_method when flag is false', async () => {
      const symbol = makeMethodSymbol();
      const candidates = await extractFromSymbols([symbol], 'src/Orders.cs', false);

      // With flag=false, method symbols should fall through to csharp_class
      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.candidate_type).not.toBe('csharp_method');
      expect(candidates[0]!.candidate_type).toBe('csharp_class');
    });

    it('does NOT map method symbols to csharp_method when options are absent', async () => {
      const adapter = new CSharpAdapter();
      const context: AdapterContext = {
        workspaceId: 'ws-test',
        projectId: 'proj-test',
        projectRoot: '/test/project',
        // No options at all
      };
      // Initialize parser with no options
      await adapter.parse([], context);

      const symbol = makeMethodSymbol();
      const parsed = { files: [{ filePath: 'src/Orders.cs', symbols: [symbol] }] };
      const candidates = await adapter.extract(parsed, context);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.candidate_type).not.toBe('csharp_method');
    });

    it('maps method symbols to csharp_method ONLY when flag is explicitly true', async () => {
      const symbol = makeMethodSymbol();

      // With flag=true → csharp_method
      const candidatesTrue = await extractFromSymbols([symbol], 'src/Orders.cs', true);
      expect(candidatesTrue[0]!.candidate_type).toBe('csharp_method');

      // With flag=false → NOT csharp_method
      const candidatesFalse = await extractFromSymbols([symbol], 'src/Orders.cs', false);
      expect(candidatesFalse[0]!.candidate_type).not.toBe('csharp_method');
    });
  });
});
