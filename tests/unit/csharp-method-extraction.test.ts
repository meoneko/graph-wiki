import { describe, it, expect, beforeAll } from 'vitest';
import { CSharpParser } from '../../src/scanner/languages/csharp/CSharpParser.js';
import type { ParsedSymbol } from '../../src/scanner/core/ILanguageParser.js';

describe('CSharpParser - extractPartialClassMethods', () => {
  let parser: CSharpParser;
  let parserDisabled: CSharpParser;

  beforeAll(() => {
    parser = new CSharpParser({ extractPartialMethods: true });
    parserDisabled = new CSharpParser({ extractPartialMethods: false });
  });

  function getMethodSymbols(symbols: ParsedSymbol[]): ParsedSymbol[] {
    return symbols.filter(s => s.kind === 'method' && s.containingClass);
  }

  describe('Requirement 3.1 - extracts public methods from partial classes', () => {
    it('extracts public methods when extractPartialMethods is true', async () => {
      const source = `
namespace MyApp.Domain
{
    public partial class Orders
    {
        public void ProcessOrder(string id)
        {
            Console.WriteLine(id);
        }

        public Task<bool> ValidateOrder(int count)
        {
            return Task.FromResult(true);
        }
    }
}`;
      const result = await parser.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(2);
      expect(methods[0]!.name).toBe('ProcessOrder');
      expect(methods[0]!.kind).toBe('method');
      expect(methods[0]!.containingClass).toBe('Orders');
      expect(methods[1]!.name).toBe('ValidateOrder');
      expect(methods[1]!.containingClass).toBe('Orders');
    });
  });

  describe('Requirement 3.5 - qualifiedName format', () => {
    it('sets qualifiedName to ClassName.MethodName', async () => {
      const source = `
public partial class Orders
{
    public void ProcessOrder() { }
}`;
      const result = await parser.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.qualifiedName).toBe('Orders.ProcessOrder');
    });
  });

  describe('Requirement 3.6 - overload disambiguation', () => {
    it('appends _2, _3 suffixes for overloaded methods in same file', async () => {
      const source = `
public partial class Orders
{
    public void Process(string id) { }
    public void Process(int count) { }
    public void Process(string id, int count) { }
}`;
      const result = await parser.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(3);
      expect(methods[0]!.qualifiedName).toBe('Orders.Process');
      expect(methods[1]!.qualifiedName).toBe('Orders.Process_2');
      expect(methods[2]!.qualifiedName).toBe('Orders.Process_3');
    });

    it('scopes disambiguation per-file across multiple partial classes', async () => {
      const source = `
public partial class Orders
{
    public void Process(string id) { }
}

public partial class Orders
{
    public void Process(int count) { }
}`;
      const result = await parser.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(2);
      expect(methods[0]!.qualifiedName).toBe('Orders.Process');
      expect(methods[1]!.qualifiedName).toBe('Orders.Process_2');
    });
  });

  describe('Requirement 3.7 - modifier-independent extraction', () => {
    it('extracts methods with static modifier', async () => {
      const source = `
public partial class Utils
{
    public static void Helper() { }
}`;
      const result = await parser.parse(source, 'Utils.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.name).toBe('Helper');
      expect(methods[0]!.isStatic).toBe(true);
    });

    it('extracts methods with virtual modifier', async () => {
      const source = `
public partial class Base
{
    public virtual void OnInit() { }
}`;
      const result = await parser.parse(source, 'Base.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.name).toBe('OnInit');
    });

    it('extracts methods with async modifier', async () => {
      const source = `
public partial class Service
{
    public async Task<int> FetchData() { return 0; }
}`;
      const result = await parser.parse(source, 'Service.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.name).toBe('FetchData');
    });

    it('extracts methods with override modifier', async () => {
      const source = `
public partial class Derived
{
    public override string ToString() { return ""; }
}`;
      const result = await parser.parse(source, 'Derived.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.name).toBe('ToString');
    });

    it('extracts methods with combined modifiers', async () => {
      const source = `
public partial class Service
{
    public static async Task<bool> RunAsync() { return true; }
}`;
      const result = await parser.parse(source, 'Service.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.name).toBe('RunAsync');
      expect(methods[0]!.isStatic).toBe(true);
    });
  });

  describe('Requirement 3.8 - non-partial class exclusion', () => {
    it('does not extract methods from non-partial classes', async () => {
      const source = `
public class RegularClass
{
    public void DoSomething() { }
}`;
      const result = await parser.parse(source, 'Regular.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(0);
    });
  });

  describe('Requirement 3.9 - zero public methods', () => {
    it('produces no method nodes for partial class with only private methods', async () => {
      const source = `
public partial class Internal
{
    private void Secret() { }
    internal void AlsoSecret() { }
    protected void StillSecret() { }
}`;
      const result = await parser.parse(source, 'Internal.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(0);
    });
  });

  describe('Requirement 2.2 - flag disabled produces zero methods', () => {
    it('produces zero method symbols when extractPartialMethods is false', async () => {
      const source = `
public partial class Orders
{
    public void ProcessOrder() { }
    public void ValidateOrder() { }
}`;
      const result = await parserDisabled.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(0);
    });

    it('produces zero method symbols when options are not provided', async () => {
      const defaultParser = new CSharpParser();
      const source = `
public partial class Orders
{
    public void ProcessOrder() { }
}`;
      const result = await defaultParser.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(0);
    });
  });

  describe('ParsedSymbol field correctness', () => {
    it('sets all required fields correctly', async () => {
      const source = `
namespace MyApp.Domain
{
    public partial class Orders
    {
        public void ProcessOrder(string id, int count)
        {
            Validate(id);
        }
    }
}`;
      const result = await parser.parse(source, 'Orders.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      const method = methods[0]!;

      expect(method.name).toBe('ProcessOrder');
      expect(method.qualifiedName).toBe('Orders.ProcessOrder');
      expect(method.kind).toBe('method');
      expect(method.containingClass).toBe('Orders');
      expect(method.namespace).toBe('MyApp.Domain');
      expect(method.isPublic).toBe(true);
      expect(method.isStatic).toBe(false);
      expect(method.isEntrypoint).toBe(false);
      expect(method.startLine).toBeGreaterThan(0);
      expect(method.endLine).toBeGreaterThanOrEqual(method.startLine);
      expect(method.body).toContain('ProcessOrder');
      expect(method.calledSymbols.length).toBeGreaterThanOrEqual(0);
      expect(method.annotations).toBeInstanceOf(Array);
    });

    it('extracts annotations from methods', async () => {
      const source = `
public partial class Service
{
    [Obsolete("Use NewMethod instead")]
    [CustomAttribute]
    public void OldMethod() { }
}`;
      const result = await parser.parse(source, 'Service.cs');
      const methods = getMethodSymbols(result.symbols);

      expect(methods).toHaveLength(1);
      expect(methods[0]!.annotations.length).toBeGreaterThan(0);
    });
  });
});
