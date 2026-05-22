import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CSharpParser } from '../../src/scanner/languages/csharp/CSharpParser.js';
import type { ParsedSymbol } from '../../src/scanner/core/ILanguageParser.js';

/**
 * Feature: partial-class-support, Property 1: Config flag disables method extraction
 *
 * For any valid C# source file containing a partial class with public methods,
 * when parsed with `extractPartialMethods` set to false (or absent), the parser
 * SHALL produce zero symbols of kind 'method' with `containingClass` set.
 *
 * **Validates: Requirements 2.2, 2.4**
 */
describe('Feature: partial-class-support, Property 1: Config flag disables method extraction', () => {
  /**
   * Arbitrary that generates a valid C# identifier (starts with uppercase letter,
   * followed by alphanumeric characters).
   */
  const csharpIdentifierArb = fc
    .string({ minLength: 2, maxLength: 12 })
    .filter((s) => /^[A-Z][a-zA-Z0-9_]+$/.test(s));

  /**
   * Arbitrary that generates a valid C# return type.
   */
  const returnTypeArb = fc.constantFrom(
    'void', 'int', 'string', 'bool', 'Task', 'Task<bool>', 'Task<int>', 'List<string>',
  );

  /**
   * Arbitrary that generates a single public method declaration string.
   */
  const publicMethodArb = fc.tuple(returnTypeArb, csharpIdentifierArb).map(
    ([returnType, methodName]) =>
      `        public ${returnType} ${methodName}() { }`,
  );

  /**
   * Arbitrary that generates a valid C# partial class source with 1-5 public methods.
   */
  const partialClassSourceArb = fc
    .tuple(
      csharpIdentifierArb,
      fc.array(publicMethodArb, { minLength: 1, maxLength: 5 }),
    )
    .map(([className, methods]) => {
      const methodsBlock = methods.join('\n');
      return `namespace TestNamespace
{
    public partial class ${className}
    {
${methodsBlock}
    }
}`;
    });

  it('produces zero method symbols when extractPartialMethods is false', async () => {
    const parser = new CSharpParser({ extractPartialMethods: false });

    await fc.assert(
      fc.asyncProperty(partialClassSourceArb, async (source) => {
        const result = await parser.parse(source, 'test.cs');

        // Filter for method symbols with containingClass set
        const methodSymbols = result.symbols.filter(
          (s) => s.kind === 'method' && s.containingClass != null,
        );

        expect(methodSymbols).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it('produces zero method symbols when extractPartialMethods is absent (default)', async () => {
    const parser = new CSharpParser();

    await fc.assert(
      fc.asyncProperty(partialClassSourceArb, async (source) => {
        const result = await parser.parse(source, 'test.cs');

        // Filter for method symbols with containingClass set
        const methodSymbols = result.symbols.filter(
          (s) => s.kind === 'method' && s.containingClass != null,
        );

        expect(methodSymbols).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: partial-class-support, Property 4: Modifier-independent extraction
 *
 * For any public method in a partial class, regardless of additional modifiers
 * (static, virtual, async, override, or combinations thereof), the parser SHALL
 * extract it as a ParsedSymbol with kind: 'method'.
 *
 * **Validates: Requirements 3.7**
 */
describe('Feature: partial-class-support, Property 4: Modifier-independent extraction', () => {
  /**
   * The set of additional modifiers that can appear alongside `public`.
   */
  const additionalModifiers = ['static', 'virtual', 'async', 'override'] as const;

  /**
   * Arbitrary that generates a random subset of additional modifiers.
   * Filters out invalid combinations (static+virtual, static+override).
   */
  const modifierSubsetArb = fc
    .subarray([...additionalModifiers], { minLength: 0, maxLength: 4 })
    .filter((mods) => {
      // static cannot combine with virtual or override in C#
      if (mods.includes('static') && (mods.includes('virtual') || mods.includes('override'))) {
        return false;
      }
      // virtual and override are mutually exclusive
      if (mods.includes('virtual') && mods.includes('override')) {
        return false;
      }
      return true;
    });

  /**
   * Arbitrary that generates a valid C# identifier for class/method names.
   */
  const csharpIdentifierArb = fc
    .string({ minLength: 2, maxLength: 12 })
    .filter((s) => /^[A-Z][a-zA-Z0-9_]+$/.test(s));

  /**
   * Generates a return type appropriate for the given modifiers.
   * Async methods must return Task or Task<T>.
   */
  const returnTypeForModifiers = (modifiers: string[]): fc.Arbitrary<string> => {
    if (modifiers.includes('async')) {
      return fc.constantFrom('Task', 'Task<bool>', 'Task<int>', 'Task<string>');
    }
    return fc.constantFrom('void', 'int', 'string', 'bool', 'List<string>');
  };

  /**
   * Generates a full method declaration with the given modifiers.
   */
  const methodWithModifiersArb = fc
    .tuple(modifierSubsetArb, csharpIdentifierArb)
    .chain(([modifiers, methodName]) =>
      returnTypeForModifiers(modifiers).map((returnType) => ({
        modifiers,
        methodName,
        returnType,
        declaration: `        public ${modifiers.join(' ')}${modifiers.length > 0 ? ' ' : ''}${returnType} ${methodName}() { }`,
      })),
    );

  /**
   * Generates a complete partial class source with a single method using random modifiers.
   */
  const partialClassWithModifiedMethodArb = fc
    .tuple(csharpIdentifierArb, methodWithModifiersArb)
    .map(([className, method]) => ({
      className,
      method,
      source: `namespace TestNamespace
{
    public partial class ${className}
    {
${method.declaration}
    }
}`,
    }));

  it('extracts public methods regardless of additional modifiers (static, virtual, async, override)', async () => {
    const parser = new CSharpParser({ extractPartialMethods: true });

    await fc.assert(
      fc.asyncProperty(partialClassWithModifiedMethodArb, async ({ className, method, source }) => {
        const result = await parser.parse(source, 'test.cs');

        // Find method symbols extracted from the partial class
        const methodSymbols = result.symbols.filter(
          (s) => s.kind === 'method' && s.containingClass === className,
        );

        // Exactly one method should be extracted
        expect(methodSymbols).toHaveLength(1);

        const extracted = methodSymbols[0];

        // Verify it has the correct kind
        expect(extracted.kind).toBe('method');

        // Verify containingClass is set
        expect(extracted.containingClass).toBe(className);

        // Verify the method name matches
        expect(extracted.name).toBe(method.methodName);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: partial-class-support, Property 5: Non-partial class exclusion
 *
 * For any C# class declaration that lacks the `partial` modifier, when parsed
 * with `extractPartialMethods` set to true, the parser SHALL produce zero
 * ParsedSymbol instances with kind='method' and containingClass set from that class.
 *
 * **Validates: Requirements 3.8**
 */
describe('Feature: partial-class-support, Property 5: Non-partial class exclusion', () => {
  /**
   * Arbitrary that generates a valid C# identifier (starts with uppercase letter,
   * followed by alphanumeric characters).
   */
  const csharpIdentifierArb = fc
    .string({ minLength: 2, maxLength: 12 })
    .filter((s) => /^[A-Z][a-zA-Z0-9_]+$/.test(s));

  /**
   * Arbitrary that generates a valid C# return type.
   */
  const returnTypeArb = fc.constantFrom(
    'void', 'int', 'string', 'bool', 'Task', 'Task<bool>', 'Task<int>', 'List<string>',
  );

  /**
   * Arbitrary that generates a single public method declaration string.
   */
  const publicMethodArb = fc.tuple(returnTypeArb, csharpIdentifierArb).map(
    ([returnType, methodName]) =>
      `        public ${returnType} ${methodName}() { }`,
  );

  /**
   * Arbitrary that generates a valid C# non-partial class source with 1-5 public methods.
   * The class does NOT have the `partial` modifier.
   */
  const nonPartialClassSourceArb = fc
    .tuple(
      csharpIdentifierArb,
      fc.array(publicMethodArb, { minLength: 1, maxLength: 5 }),
    )
    .map(([className, methods]) => {
      const methodsBlock = methods.join('\n');
      return `namespace TestNamespace
{
    public class ${className}
    {
${methodsBlock}
    }
}`;
    });

  it('produces zero method symbols from non-partial classes even when extractPartialMethods is true', async () => {
    const parser = new CSharpParser({ extractPartialMethods: true });

    await fc.assert(
      fc.asyncProperty(nonPartialClassSourceArb, async (source) => {
        const result = await parser.parse(source, 'test.cs');

        // Filter for method symbols with containingClass set
        const methodSymbols = result.symbols.filter(
          (s) => s.kind === 'method' && s.containingClass != null,
        );

        expect(methodSymbols).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: partial-class-support, Property 2: Method extraction produces correct metadata
 *
 * For any valid C# partial class with at least one public method, when parsed with
 * `extractPartialMethods` set to true, each extracted ParsedSymbol SHALL have:
 * `kind` equal to 'method', `containingClass` equal to the simple class name
 * (no namespace, no generics), `qualifiedName` equal to 'ClassName.MethodName',
 * `namespace` matching the declared namespace, `name` equal to the method name,
 * `isPublic` equal to true, and `isEntrypoint` equal to false.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
describe('Feature: partial-class-support, Property 2: Method extraction produces correct metadata', () => {
  /**
   * Arbitrary that generates a valid C# identifier starting with uppercase letter.
   */
  const csharpIdentifierArb = fc
    .tuple(
      fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'),
      fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
    )
    .map(([first, rest]) => `${first}${rest}`);

  /**
   * Arbitrary that generates a valid C# namespace like "MyApp.Domain".
   */
  const namespaceArb = fc
    .tuple(csharpIdentifierArb, csharpIdentifierArb)
    .map(([ns1, ns2]) => `${ns1}.${ns2}`);

  /**
   * Arbitrary that generates a valid C# return type.
   */
  const returnTypeArb = fc.constantFrom(
    'void', 'int', 'string', 'bool', 'Task', 'double', 'float', 'long',
    'Task<bool>', 'Task<int>', 'Task<string>', 'List<string>', 'IEnumerable<int>',
  );

  /**
   * Arbitrary that generates a C# parameter list string (without parentheses).
   */
  const paramTypeArb = fc.constantFrom(
    'int', 'string', 'bool', 'double', 'float', 'long', 'object',
    'List<string>', 'Dictionary<string, int>',
  );

  const paramNameArb = fc
    .tuple(
      fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'),
      fc.stringMatching(/^[a-zA-Z0-9]{0,6}$/),
    )
    .map(([first, rest]) => `${first}${rest}`);

  const singleParamArb = fc
    .tuple(paramTypeArb, paramNameArb)
    .map(([type, name]) => `${type} ${name}`);

  const paramListArb = fc
    .array(singleParamArb, { minLength: 0, maxLength: 4 })
    .map((params) => params.join(', '));

  /**
   * Arbitrary that generates a complete test case: class name, method name,
   * namespace, return type, and parameter list.
   */
  const methodTestCaseArb = fc.record({
    className: csharpIdentifierArb,
    methodName: csharpIdentifierArb,
    namespace: namespaceArb,
    returnType: returnTypeArb,
    paramList: paramListArb,
  });

  it('produces correct ParsedSymbol metadata for each extracted method', async () => {
    const parser = new CSharpParser({ extractPartialMethods: true });

    await fc.assert(
      fc.asyncProperty(methodTestCaseArb, async ({ className, methodName, namespace, returnType, paramList }) => {
        const paramDecl = paramList.length > 0 ? paramList : '';
        const source = `namespace ${namespace}
{
    public partial class ${className}
    {
        public ${returnType} ${methodName}(${paramDecl}) { }
    }
}`;

        const result = await parser.parse(source, 'src/TestFile.cs');

        // Filter for method symbols
        const methodSymbols = result.symbols.filter(
          (s): s is ParsedSymbol => s.kind === 'method' && s.containingClass != null,
        );

        // Should have exactly one method symbol
        expect(methodSymbols.length).toBe(1);

        const sym = methodSymbols[0];

        // Verify kind
        expect(sym.kind).toBe('method');

        // Verify name equals the method name
        expect(sym.name).toBe(methodName);

        // Verify containingClass equals the simple class name (no namespace, no generics)
        expect(sym.containingClass).toBe(className);

        // Verify qualifiedName is 'ClassName.MethodName'
        expect(sym.qualifiedName).toBe(`${className}.${methodName}`);

        // Verify namespace matches the declared namespace
        expect(sym.namespace).toBe(namespace);

        // Verify isPublic is true
        expect(sym.isPublic).toBe(true);

        // Verify isEntrypoint is false
        expect(sym.isEntrypoint).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('sets containingClass to simple class name without namespace prefix', async () => {
    const parser = new CSharpParser({ extractPartialMethods: true });

    await fc.assert(
      fc.asyncProperty(
        csharpIdentifierArb,
        csharpIdentifierArb,
        namespaceArb,
        async (className, methodName, namespace) => {
          const source = `namespace ${namespace}
{
    public partial class ${className}
    {
        public void ${methodName}() { }
    }
}`;

          const result = await parser.parse(source, 'src/TestFile.cs');

          const methodSymbols = result.symbols.filter(
            (s) => s.kind === 'method' && s.containingClass != null,
          );

          expect(methodSymbols.length).toBe(1);

          // containingClass should be the simple class name, NOT namespace-prefixed
          expect(methodSymbols[0].containingClass).toBe(className);
          expect(methodSymbols[0].containingClass).not.toContain('.');
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: partial-class-support, Property 3: Overload disambiguation
 *
 * For any partial class containing N methods with the same name in the same file,
 * the parser SHALL produce N ParsedSymbol instances whose `qualifiedName` values are
 * `ClassName.MethodName`, `ClassName.MethodName_2`, ..., `ClassName.MethodName_N`
 * (suffix starts at `_2` for the second occurrence).
 *
 * Disambiguation is per-file scoped (shared across multiple partial class declarations
 * in the same file).
 *
 * **Validates: Requirements 3.6**
 */
describe('Feature: partial-class-support, Property 3: Overload disambiguation', () => {
  /**
   * Arbitrary that generates a valid C# class name (starts with uppercase letter,
   * followed by alphanumeric characters).
   */
  const csharpClassNameArb = fc
    .string({ minLength: 2, maxLength: 12 })
    .filter((s) => /^[A-Z][a-zA-Z0-9]+$/.test(s));

  /**
   * Arbitrary that generates a valid C# method name.
   */
  const csharpMethodNameArb = fc
    .string({ minLength: 2, maxLength: 12 })
    .filter((s) => /^[A-Z][a-zA-Z0-9]+$/.test(s));

  /**
   * Arbitrary that generates a C# parameter type.
   */
  const paramTypeArb = fc.constantFrom(
    'int', 'string', 'bool', 'double', 'float', 'long', 'decimal', 'object', 'byte',
  );

  /**
   * Arbitrary that generates a C# parameter name.
   */
  const paramNameArb = fc
    .string({ minLength: 2, maxLength: 8 })
    .filter((s) => /^[a-z][a-zA-Z0-9]+$/.test(s));

  /**
   * Arbitrary that generates a unique parameter list for overload differentiation.
   * Each overload gets a different number of parameters (0 to N-1) to ensure valid C# overloads.
   */
  const paramListForIndex = (index: number): string => {
    if (index === 0) return '';
    const params: string[] = [];
    for (let i = 0; i < index; i++) {
      params.push(`int p${i}`);
    }
    return params.join(', ');
  };

  /**
   * Arbitrary that generates the number of overloaded methods (1-5).
   */
  const overloadCountArb = fc.integer({ min: 1, max: 5 });

  /**
   * Generates a partial class source with N methods sharing the same name
   * but with different parameter lists (valid C# overloads).
   */
  const overloadedClassSourceArb = fc
    .tuple(csharpClassNameArb, csharpMethodNameArb, overloadCountArb)
    .map(([className, methodName, overloadCount]) => {
      const methods: string[] = [];
      for (let i = 0; i < overloadCount; i++) {
        const params = paramListForIndex(i);
        methods.push(`        public void ${methodName}(${params}) { }`);
      }
      const methodsBlock = methods.join('\n');
      return {
        source: `namespace TestNamespace
{
    public partial class ${className}
    {
${methodsBlock}
    }
}`,
        className,
        methodName,
        overloadCount,
      };
    });

  it('produces correct qualifiedName suffixes for overloaded methods in a single partial class', async () => {
    const parser = new CSharpParser({ extractPartialMethods: true });

    await fc.assert(
      fc.asyncProperty(overloadedClassSourceArb, async ({ source, className, methodName, overloadCount }) => {
        const result = await parser.parse(source, 'test.cs');

        // Filter for method symbols with the overloaded name
        const methodSymbols = result.symbols.filter(
          (s: ParsedSymbol) => s.kind === 'method' && s.name === methodName && s.containingClass === className,
        );

        // Should have exactly N method symbols
        expect(methodSymbols).toHaveLength(overloadCount);

        // Verify qualifiedName suffixes follow the pattern:
        // ClassName.MethodName, ClassName.MethodName_2, ..., ClassName.MethodName_N
        const expectedQualifiedNames: string[] = [];
        for (let i = 1; i <= overloadCount; i++) {
          const suffix = i > 1 ? `_${i}` : '';
          expectedQualifiedNames.push(`${className}.${methodName}${suffix}`);
        }

        const actualQualifiedNames = methodSymbols.map((s: ParsedSymbol) => s.qualifiedName);
        expect(actualQualifiedNames).toEqual(expectedQualifiedNames);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Generates source with multiple partial class declarations in the same file
   * sharing the same class name, each with methods of the same name.
   * This tests that disambiguation is per-file scoped (shared across declarations).
   */
  const multiDeclarationSourceArb = fc
    .tuple(
      csharpClassNameArb,
      csharpMethodNameArb,
      fc.integer({ min: 1, max: 3 }), // methods in first declaration
      fc.integer({ min: 1, max: 3 }), // methods in second declaration
    )
    .map(([className, methodName, countInFirst, countInSecond]) => {
      const firstMethods: string[] = [];
      for (let i = 0; i < countInFirst; i++) {
        const params = paramListForIndex(i);
        firstMethods.push(`        public void ${methodName}(${params}) { }`);
      }

      const secondMethods: string[] = [];
      for (let i = 0; i < countInSecond; i++) {
        // Use different param types to differentiate from first declaration's overloads
        const params = Array.from({ length: i + countInFirst }, (_, j) => `string s${j}`).join(', ');
        secondMethods.push(`        public void ${methodName}(${params}) { }`);
      }

      const totalCount = countInFirst + countInSecond;

      return {
        source: `namespace TestNamespace
{
    public partial class ${className}
    {
${firstMethods.join('\n')}
    }

    public partial class ${className}
    {
${secondMethods.join('\n')}
    }
}`,
        className,
        methodName,
        countInFirst,
        countInSecond,
        totalCount,
      };
    });

  it('disambiguation is per-file scoped across multiple partial class declarations', async () => {
    const parser = new CSharpParser({ extractPartialMethods: true });

    await fc.assert(
      fc.asyncProperty(multiDeclarationSourceArb, async ({ source, className, methodName, totalCount }) => {
        const result = await parser.parse(source, 'test.cs');

        // Filter for method symbols with the overloaded name
        const methodSymbols = result.symbols.filter(
          (s: ParsedSymbol) => s.kind === 'method' && s.name === methodName && s.containingClass === className,
        );

        // Should have exactly totalCount method symbols
        expect(methodSymbols).toHaveLength(totalCount);

        // Verify qualifiedName suffixes are sequential across both declarations:
        // ClassName.MethodName, ClassName.MethodName_2, ..., ClassName.MethodName_N
        const expectedQualifiedNames: string[] = [];
        for (let i = 1; i <= totalCount; i++) {
          const suffix = i > 1 ? `_${i}` : '';
          expectedQualifiedNames.push(`${className}.${methodName}${suffix}`);
        }

        const actualQualifiedNames = methodSymbols.map((s: ParsedSymbol) => s.qualifiedName);
        expect(actualQualifiedNames).toEqual(expectedQualifiedNames);
      }),
      { numRuns: 100 },
    );
  });
});
