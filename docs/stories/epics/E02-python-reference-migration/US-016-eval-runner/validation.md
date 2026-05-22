# Validation

## Proof Strategy

Run `crg eval` against a workspace with a known suite. Confirm pass/fail per case matches
expectations. Confirm exit code 1 when score below threshold.

## Test Plan

| Layer | Cases |
|---|---|
| Unit | `scoreCase()` with all predicates satisfied → `status: 'pass'` |
| Unit | `scoreCase()` with `minNodeCount: 3` and 2 nodes → `status: 'fail'` |
| Unit | `scoreCase()` with `nodeLabels: ['Orders']` and result missing 'Orders' → `missingLabels: ['Orders']` |
| Unit | `scoreCase()` with `notEmpty: true` and empty result → `status: 'fail'` |
| Unit | `loadSuite()` parses valid JSON suite file and returns array of `EvalCase` |
| Integration | `runEval()` with all-passing suite → `EvalReport.passed_overall: true`, exit 0 |
| Integration | `runEval()` with one failing case and threshold 1.0 → exit code 1 |
| E2E | `crg eval --workspace b2g --suite knowledge/eval/b2g.json` produces `knowledge/reports/b2g/eval.json` |
| E2E | `--json` flag outputs full `EvalReport` JSON to stdout |
| Platform | `npm run typecheck` zero errors |

## Fixtures

```json
[
  {
    "id": "basic-node-exists",
    "description": "OrdersController exists in graph",
    "queryType": "what-is-symbol",
    "query": "OrdersController",
    "expect": { "notEmpty": true }
  }
]
```

## Commands

```bash
npm run typecheck
npm test
crg eval --workspace b2g --suite knowledge/eval/b2g.json
echo $?    # check exit code
```

## Acceptance Evidence

Pending implementation:

- All 5 unit cases pass
- Integration: correct exit codes for pass/fail suites
- E2E: `eval.json` exists and contains `totalCases`, `passed`, `score` fields
- Printed table matches `eval.json` data
