# Exec Plan

## Goal

Ensure absolute multi-workspace isolation, regression-free pipeline runs, and zero cross-client configurations leaks.

## Scope

- **In Scope**:
  - Test harness setup scripts under `src/pipeline/stages/_tests/`.
  - Concurrent pipeline execution wrapper.
  - Leak-checking SQL query checkers.
- **Out of Scope**:
  - Validating GUI browser rendering issues.

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Parallel disk writes on SQLite WAL databases can occasionally throw locking errors on Windows environments under high CPU contention.
- **Mitigation**:
  - Configure robust connection retry policies and set a sqlite busy-timeout configuration of 10000ms.

## Work Phases

1. **Phase 1**: Structure the testing harness fixtures folder.
2. **Phase 2**: Write concurrent run execution flows.
3. **Phase 3**: Code SQL assertion metrics.
4. **Phase 4**: Run full suite on regression target systems.
