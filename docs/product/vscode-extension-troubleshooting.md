# VS Code Extension Webview Troubleshooting

This document lists common environment-specific errors when running or developing the `code-review-graph` VS Code Extension and provides step-by-step instructions to resolve them.

---

## 1. Webview Service Worker Registration Failure

### Symptom
When opening the Blast Radius panel or Setup panel in VS Code, the panel does not load and instead displays an error:
```text
Error loading webview: Error: Could not register service worker: InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state.
```

### Cause
This is a known upstream VS Code platform-level issue (related to how Chromium handles ServiceWorker registrations for iframes). It typically occurs due to:
1. Rapidly reloading or opening/closing webview panels.
2. Stale or corrupted Chromium ServiceWorker cached files within VS Code's user profile cache.
3. Stuck background `Code` / `Code - Helper` processes that prevent proper cleanup of file locks.

### Resolution Steps

#### Option A: Reload the Window (Fastest)
In most cases, reloading the VS Code window resolves the temporary invalid state:
1. Open the VS Code Command Palette: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).
2. Run the command: **`Developer: Reload Window`**.

#### Option B: Full Application Restart
If reloading does not work, a stuck helper process may be holding onto the cache:
1. Close all VS Code windows.
2. Open **Task Manager** (Windows) or **Activity Monitor** (macOS).
3. Ensure all background `Code.exe` / `Code - Helper` processes are fully terminated.
4. Relaunch VS Code and reopen the extension panel.

#### Option C: Clear VS Code's Local Caches
If the error persists across restarts, the local ServiceWorker cache files must be manually deleted:
1. Close VS Code.
2. Open your system's file manager and go to the VS Code AppData folder:
   * **Windows:** `%APPDATA%\Code\`
   * **macOS:** `~/Library/Application Support/Code/`
   * **Linux:** `~/.config/Code/`
3. Delete the contents of these specific folders inside the `Code` folder:
   * `Cache`
   * `Code Cache`
   * `CachedData`
   * `CachedExtensions`
   * `Service Worker`
4. Start VS Code again.
