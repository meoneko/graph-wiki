# Exec Plan

## Goal

Implement `crg eval` as a predicate-based benchmark runner against the live graph, with
structured JSON report output and a configurable pass threshold.

## Scope

In scope:

- `src/eval/types.ts` — `EvalCase`, `EvalCaseResult`, `EvalReport` interfaces
- `src/eval/loader.ts` — load and parse suite YAML or JSON
- `src/eval/runner.ts` — execute each case via `StructuredAskEngine`
- `src/eval/scorer.ts` — predicate matching
- `src/eval/reporter.ts` — write `eval.json`, print table
- `src/eval/index.ts` — `runEval()` orchestrator
- `src/cli/index.ts` — `eval` command handler
- `knowledge/eval/` directory with example suite file
- `knowledge.config.yaml.example` — add `eval` block

Out of scope:

- AI-judged evaluation
- Cross-workspace comparison
- Suite file auto-generation

## Risk Classification

Risk flags:

- **Low**: reads from existing graph only; no pipeline or DB writes.
- **Low**: YAML parsing requires a dependency (`js-yaml` or similar) if not already present.
  Check `package.json` for existing YAML parser; if absent, use JSON suite files to avoid
  adding a dependency.

Hard gates:

- `npm run typecheck` must pass
- `npm test` must pass
- Exit code 1 when score < threshold

## Work Phases

### Phase 1 — Types

1. Create `src/eval/types.ts` with `EvalCase`, `EvalCaseResult`, `EvalReport`.

### Phase 2 — Loader

2. Create `src/eval/loader.ts`:

```typescript
export function loadSuite(filePath: string): EvalCase[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const raw = filePath.endsWith('.json')
    ? JSON.parse(content)
    : parseYaml(content);  // use js-yaml or yaml package
  return raw as EvalCase[];
}
```

### Phase 3 — Runner and scorer

3. `src/eval/runner.ts` — for each case:

```typescript
const result = await engine.ask({
  question: evalCase.query,
  workspace: workspaceId,
  queryType: evalCase.queryType,
  mode: evalCase.mode ?? 'authoritative',
});
return scoreCase(evalCase, result);
```

4. `src/eval/scorer.ts` — predicate checks:

```typescript
export function scoreCase(c: EvalCase, result: QueryResult): EvalCaseResult {
  const nodes = result.data?.nodes ?? [];
  const labels = nodes.map(n => n.label);
  const kinds = nodes.map(n => n.kind);
  const missingLabels = (c.expect.nodeLabels ?? []).filter(l => !labels.includes(l));
  const pass =
    (!c.expect.notEmpty || nodes.length > 0) &&
    (!c.expect.minNodeCount || nodes.length >= c.expect.minNodeCount) &&
    missingLabels.length === 0 &&
    (!c.expect.nodeKinds || c.expect.nodeKinds.every(k => kinds.includes(k)));
  return { ...c, status: pass ? 'pass' : 'fail', actualNodeCount: nodes.length, matchedLabels: labels.filter(l => c.expect.nodeLabels?.includes(l)), missingLabels };
}
```

### Phase 4 — Reporter

5. `src/eval/reporter.ts` — writes `eval.json` and prints formatted table.

### Phase 5 — CLI

6. In `src/cli/index.ts`:

```typescript
if (command === 'eval') {
  const ws = await resolveWorkspace(parseFlag(rest, '--workspace'));
  const suiteFlag = parseFlag(rest, '--suite');
  const thresholdFlag = parseFlag(rest, '--threshold');
  const { runEval } = await import('../eval/index.js');
  const config = await loadConfig();
  const suitePath = suiteFlag ?? config.eval?.suite?.replace('{workspace}', ws)
    ?? `knowledge/eval/${ws}.yaml`;
  const threshold = thresholdFlag ? parseFloat(thresholdFlag) : (config.eval?.pass_threshold ?? 0.9);
  const report = await runEval({ workspaceId: ws, suitePath, threshold, json: hasFlag(rest, '--json') });
  if (!report.passed_overall) process.exitCode = 1;
  return;
}
```

7. Create `knowledge/eval/example.yaml` with 2–3 sample cases as a reference.

### Phase 6 — Verification

8. `npm run typecheck` — fix any errors.
9. `npm test` — fix any failures.
10. Create a minimal suite file for a local workspace and run `crg eval` to confirm pass/fail output.

## Stop Conditions

- If `js-yaml` / `yaml` not in `package.json`: use JSON suite files and skip YAML support
  for now. Add a comment in `loader.ts` to wire YAML when dependency is available.
