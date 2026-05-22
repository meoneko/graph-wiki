# Design

## Domain Model

New module: `src/eval/`

```
src/eval/
  index.ts       — exports runEval()
  loader.ts      — loads and validates suite YAML/JSON files
  runner.ts      — executes each case against the live graph
  scorer.ts      — computes pass/fail per case
  reporter.ts    — writes eval.json and console summary
  types.ts       — EvalCase, EvalResult, EvalReport
```

`EvalCase` (suite file format — YAML or JSON):

```typescript
interface EvalCase {
  id: string;
  description: string;
  queryType: StructuredQueryType;     // same values as --query-type
  query: string;                       // the question string
  mode?: QueryMode;                    // default: authoritative
  expect: {
    minNodeCount?: number;             // result must have >= N nodes
    nodeLabels?: string[];             // result must contain these labels
    nodeKinds?: string[];              // result nodes must include these kinds
    maxHops?: number;                  // for lineage queries
    notEmpty?: boolean;                // result.data.nodes must be non-empty
  };
}
```

`EvalReport`:

```typescript
interface EvalReport {
  workspaceId: string;
  suiteFile: string;
  runAt: string;
  totalCases: number;
  passed: number;
  failed: number;
  score: number;             // passed / totalCases
  passThreshold: number;     // from config
  passed_overall: boolean;   // score >= passThreshold
  cases: EvalCaseResult[];
}

interface EvalCaseResult {
  id: string;
  description: string;
  status: 'pass' | 'fail' | 'error';
  actualNodeCount: number;
  matchedLabels: string[];
  missingLabels: string[];
  errorMessage?: string;
  durationMs: number;
}
```

## Application Flow

1. Load suite file(s) from `--suite <path>` or default `knowledge/eval/{workspace}.yaml`.
2. For each `EvalCase`, call `StructuredAskEngine.ask()` with the case's query and mode.
3. `scorer.ts` compares result against `expect` predicates.
4. Aggregate results into `EvalReport`.
5. Write `eval.json` to reports dir. Print table to stdout.
6. Exit 0 if `score >= passThreshold`, else exit 1.

## Interface Contract

Config in `knowledge.config.yaml`:

```yaml
eval:
  suite: knowledge/eval/{workspace}.yaml   # path pattern
  pass_threshold: 0.9                       # 0.0–1.0
```

CLI:

```
crg eval [--workspace <id>] [--suite <path>] [--threshold <float>] [--json]
```

## Data Model

No DB changes. Reads from existing graph via `StructuredAskEngine`.

Report file: `knowledge/reports/{workspace}/eval.json`.
Suite file: user-created YAML at `knowledge/eval/{workspace}.yaml` (not committed by default).

## UI / Platform Impact

Terminal table output. JSON report file.

## Observability

Each case result written to `eval.json` with duration and mismatch detail.

## Alternatives Considered

1. **AI-judged evaluation** — rejected for initial version. Deterministic structural
   checks are reproducible without an API key and run offline.

2. **Snapshot testing (golden files)** — similar, but requires regenerating snapshots on
   every intentional graph change. Predicate-based checks are more resilient to minor
   graph evolution.
