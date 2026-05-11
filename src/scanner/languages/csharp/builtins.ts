export const CSHARP_BUILTIN_SYMBOLS = new Set([
  // ASP.NET Core results
  'Results', 'IActionResult', 'ActionResult',
  'Ok', 'NotFound', 'BadRequest', 'Unauthorized', 'Conflict',
  'Created', 'NoContent', 'Accepted', 'StatusCode', 'Problem',
  // Infrastructure abstractions
  'IWebHostEnvironment', 'IHostEnvironment', 'IConfiguration',
  'ILogger', 'IServiceProvider', 'IServiceCollection',
  'IMemoryCache', 'IDistributedCache',
  // BCL primitives
  'Task', 'ValueTask', 'CancellationToken',
  'string', 'int', 'bool', 'decimal', 'double', 'float', 'long',
  'Guid', 'DateTime', 'DateTimeOffset', 'TimeSpan',
  // Collections
  'List', 'Dictionary', 'HashSet', 'IEnumerable', 'IQueryable',
  'IReadOnlyList', 'IReadOnlyDictionary', 'ICollection',
  // LINQ
  'Where', 'Select', 'FirstOrDefault', 'ToList', 'ToArray', 'Any', 'Count',
  // EF Core common
  'SaveChanges', 'SaveChangesAsync', 'Add', 'Update', 'Remove', 'Find',
  // HTTP context
  'Cookies', 'Headers', 'HttpContext', 'Request', 'Response',
]);

// ── JS/TS BUILTIN WHITELIST ────────────────────────────────────────────────────
// Ported from Python reference _BUILTIN_CALL_NAMES (~80 names).
// Used by TSReactAdapter.extractCalledSymbols() to filter noise from called_symbols.
// Includes Array, String, Object, Promise, Console, Math, DOM, timers, Prisma ORM.
// Prisma methods (findUnique, findMany, upsert, etc.) look like project methods but are framework.
export const TS_BUILTIN_CALL_NAMES = new Set([
  // Array
  'map', 'filter', 'reduce', 'reduceRight', 'forEach', 'find', 'findIndex',
  'some', 'every', 'includes', 'indexOf', 'lastIndexOf',
  'push', 'pop', 'shift', 'unshift', 'splice', 'slice',
  'concat', 'join', 'flat', 'flatMap', 'sort', 'reverse', 'fill', 'at',
  // String
  'trim', 'trimStart', 'trimEnd', 'split', 'replace', 'replaceAll',
  'match', 'matchAll', 'search', 'substring', 'substr',
  'toLowerCase', 'toUpperCase', 'startsWith', 'endsWith',
  'padStart', 'padEnd', 'repeat', 'charAt', 'charCodeAt',
  // Object
  'assign', 'freeze', 'defineProperty', 'getOwnPropertyNames',
  'hasOwnProperty', 'create', 'is', 'fromEntries', 'keys', 'values', 'entries',
  // Console
  'log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'table',
  'time', 'timeEnd', 'assert', 'clear', 'count',
  // Promise
  'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'allSettled', 'race', 'any',
  // JSON / Math / Date
  'parse', 'stringify',
  'floor', 'ceil', 'round', 'random', 'max', 'min', 'abs', 'pow', 'sqrt',
  'getTime', 'getFullYear', 'now', 'toISOString', 'toJSON',
  // DOM
  'addEventListener', 'removeEventListener', 'querySelector', 'querySelectorAll',
  'getElementById', 'createElement', 'appendChild', 'removeChild',
  'setAttribute', 'getAttribute', 'preventDefault', 'stopPropagation',
  // Timers
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  // Type utils
  'toString', 'valueOf', 'isNaN', 'parseInt', 'parseFloat', 'toFixed',
  'encodeURIComponent', 'decodeURIComponent',
  'call', 'apply', 'bind', 'next',
  // EventEmitter
  'emit', 'on', 'off', 'once',
  // Stream
  'pipe', 'write', 'read', 'end', 'close', 'destroy',
  // Express
  'send', 'status', 'json', 'redirect',
  // Map/Set
  'set', 'get', 'delete', 'has',
  // Prisma ORM — look like project methods but are framework
  'findUnique', 'findFirst', 'findMany', 'createMany',
  'update', 'updateMany', 'deleteMany', 'upsert',
  'aggregate', 'groupBy', 'transaction',
  // Test framework
  'describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach',
  'beforeAll', 'afterAll', 'mock', 'spyOn',
  // Other
  'require', 'fetch', 'from', 'isArray', 'of',
]);
