# Harness Backlog

Use this file when an agent discovers a missing harness capability but should
not change the operating model immediately.

## Template

```md
## Missing Harness Capability

### Title

Short name.

### Discovered While

Task or story that exposed the gap.

### Current Pain

What was hard, repeated, ambiguous, or unsafe?

### Suggested Improvement

What should be added or changed?

### Risk

Tiny, normal, or high-risk.

### Status

proposed | accepted | implemented | rejected
```

## Items

## Missing Harness Capability

### Title

VS Code Webview Service Worker Loading Failures

### Discovered While

Investigating a user environment error where the VS Code extension webview fails to load with `Could not register service worker: InvalidStateError`.

### Current Pain

When VS Code webview instances crash due to Chromium's internal service worker states or corrupt cache, agents and humans have no documented resolution path in the codebase or project harness.

### Suggested Improvement

Add a troubleshooting guide specifically for VS Code extension webview issues, explaining the causes (rapid reloads, corrupted cached data, background processes) and providing standard recovery commands.

### Risk

Tiny

### Status

implemented

