# Overview

## Current Behavior

There is no automated way to measure the quality of knowledge graph answers. Whether a
given `crg ask` query returns correct and complete results can only be verified manually.
This makes it impossible to detect regressions in graph quality when the pipeline,
adapters, or query logic changes.

## Target Behavior

`crg eval [--workspace <id>] [--suite <path>]` runs a benchmark suite of predefined
questions against the current graph and compares answers to expected outcomes. Results are
written to `knowledge/reports/{workspace}/eval.json` and printed as a summary table.

```
$ crg eval --workspace b2g
Running 12 eval cases...
  PASS  what-is-symbol: OrdersController (similarity: 0.94)
  PASS  impact: Blaze.cs → 3 affected nodes
  FAIL  lineage: missing Orders→Processing edge (expected 2 hops, got 0)

Score: 11/12 (91.7%)
Report: knowledge/reports/b2g/eval.json
```

Exit code 1 when score falls below a configurable threshold (`eval.pass_threshold: 0.9`).

## Affected Users

- Developers refactoring pipeline stages who need to confirm graph quality is preserved
- CI pipelines that gate merges on eval score above threshold
- Teams evaluating impact of config changes (new adapters, trust policy changes)

## Affected Product Docs

- `README.md` — add "Evaluation" section
- `knowledge.config.yaml.example` — add `eval` config block

## Non-Goals

- No AI-judged evaluation (all comparisons are structural/deterministic)
- No cross-workspace benchmarking
- No golden-file generation automation (suite files are written manually)
