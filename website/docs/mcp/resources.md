---
id: resources
title: Resources
---

MCP resources provide read-only access to live session state. Unlike tools, resources are pulled by the AI model at will; they don't execute actions. All resources use the `wdio://` URI scheme.

## When to use resources vs tools

- **Resources** — ambient state that changes as you interact: current elements, screenshot, cookies, accessibility tree. Read them before acting to understand what's on screen.
- **Tools** — actions that change state: click, navigate, set value.

Prefer `wdio://session/current/elements` over `get_screenshot` for element discovery; it returns ready-to-use selectors and costs far fewer tokens.

---

## Session History

### `wdio://sessions`

Index of all browser and app sessions with metadata and step counts.

```json
{
  "sessions": [
    {
      "sessionId": "abc-123",
      "type": "browser",
      "startedAt": "2024-01-15T10:00:00.000Z",
      "endedAt": "2024-01-15T10:05:00.000Z",
      "stepCount": 12,
      "isCurrent": false
    }
  ]
}
```

---

### `wdio://session/current/steps`

JSON step log for the currently active session. Contains all recorded automation steps with tool names, parameters, and timestamps.

---

### `wdio://session/current/code`

Generated WebdriverIO JavaScript for the currently active session. Auto-generated from recorded steps. Paste into a WebdriverIO test file to replay the session.

---

### `wdio://session/{sessionId}/steps`

Step log for a specific session by ID. URI template — replace `{sessionId}` with the ID from `wdio://sessions`.

---

### `wdio://session/{sessionId}/code`

Generated WebdriverIO JavaScript for a specific session by ID. URI template — replace `{sessionId}` with the ID from `wdio://sessions`.

---

## Live Page State (Current Session)

### `wdio://session/current/elements`

Interactable elements on the current page. Returns ready-to-use selectors, element text, and visibility information.

**This is the primary resource for understanding what's on screen.** Read it before clicking or typing. Much faster and cheaper than a screenshot.

For advanced filtering (viewport-only, containers, bounding boxes, pagination), use the `get_elements` tool instead.

---

### `wdio://session/current/accessibility`

Accessibility tree for the current page. Returns all nodes by default with role, name, selector, and state attributes. Browser-only. On mobile, use `wdio://session/current/elements`.

```json
{
  "total": 84,
  "showing": 84,
  "hasMore": false,
  "nodes": [
    {
      "role": "button",
      "name": "Submit",
      "selector": "button.submit-btn",
      "disabled": false
    }
  ]
}
```

For filtered results (by role, paginated), use the `get_accessibility_tree` tool.

---

### `wdio://session/current/screenshot`

Screenshot of the current page or screen as a base64-encoded image. Automatically resized (max 2000px) and compressed (max 1 MB).

Use for visual verification or debugging layout. For element discovery, prefer `wdio://session/current/elements`.

---

### `wdio://session/current/cookies`

All cookies for the current browser session.

```json
[
  {
    "name": "session_token",
    "value": "abc123",
    "domain": "example.com",
    "path": "/",
    "httpOnly": true,
    "secure": true
  }
]
```

---

### `wdio://session/current/tabs`

All open browser tabs in the current session. Browser-only.

```json
[
  {
    "handle": "CDwindow-ABC",
    "title": "My App",
    "url": "https://example.com/dashboard",
    "isActive": true
  }
]
```

Use before `switch_tab` to find the target handle or index.

---

### `wdio://session/current/contexts`

Available automation contexts (NATIVE_APP, WEBVIEW). Mobile-only.

```json
["NATIVE_APP", "WEBVIEW_com.example.app"]
```

---

### `wdio://session/current/context`

Currently active automation context. Mobile-only.

```json
"NATIVE_APP"
```

---

### `wdio://session/current/app-state/{bundleId}`

App lifecycle state for a given bundle ID. Mobile-only. URI template — replace `{bundleId}` with an iOS bundle ID or Android package name.

Returns one of:
- `0` — not installed
- `1` — not running
- `2` — running in background (suspended)
- `3` — running in background
- `4` — running in foreground

For named output, use the `get_app_state` tool instead.

---

### `wdio://session/current/geolocation`

Current device geolocation override set by `set_geolocation`.

```json
{
  "latitude": 51.5074,
  "longitude": -0.1278,
  "altitude": 0
}
```

---

### `wdio://session/current/logs`

Session logs for the current session. Returns browser console messages and JavaScript exceptions (Chromium sessions), logcat output (Android), or crash/syslog (iOS).

```json
{
  "type": "browser",
  "logs": [
    { "level": "SEVERE", "message": "Uncaught TypeError: ...", "source": "javascript" },
    { "level": "INFO", "message": "Page loaded", "source": "console" }
  ]
}
```

---

### `wdio://session/current/capabilities`

Raw capabilities returned by the WebDriver or Appium server for the current session. Use for debugging; shows the actual values the driver accepted, including defaults applied by the cloud provider or Appium.

---

## Cloud Providers

### `wdio://browserstack/local-binary`

Platform-specific download URL and daemon setup instructions for BrowserStack Local binary. Read this before using `tunnel: true` or `tunnel: "external"` with `provider: "browserstack"`; it contains the exact commands for your OS and architecture.

```json
{
  "platform": "macOS",
  "arch": "arm64",
  "downloadUrl": "https://...",
  "setup": ["step 1", "step 2", "step 3", "step 4"],
  "commands": {
    "start": "./BrowserStackLocal --key YOUR_KEY",
    "stop": "...",
    "status": "..."
  }
}
```

---

### `wdio://saucelabs/local-binary`

Platform-specific download URL and daemon setup instructions for Sauce Connect Proxy. Read this before using `tunnel: "external"` with `provider: "saucelabs"`; for `tunnel: true` the SDK auto-manages Sauce Connect.

```json
{
  "platform": "Linux",
  "arch": "x64",
  "downloadUrl": "https://saucelabs.com/downloads/sc-4.9.2-linux.tar.gz",
  "setup": ["step 1", "step 2", "step 3", "step 4"],
  "commands": {
    "start": "./sc -u YOUR_USERNAME -k YOUR_ACCESS_KEY --region eu-central-1",
    "stop": "./sc --stop",
    "status": "./sc --status"
  }
}
```

---

### `wdio://testmu/local-binary`

Platform-specific download URL and daemon setup instructions for TestMu Tunnel. Only needed for `tunnel: "external"` with `provider: "testmu"` — for `tunnel: true` the SDK auto-manages the tunnel via `@lambdatest/node-tunnel`.

```json
{
  "platform": "Linux",
  "arch": "x64",
  "downloadUrl": "https://downloads.lambdatest.com/tunnel/v4/linux/64bit/LT_Linux.zip",
  "setup": ["step 1", "step 2", "step 3", "step 4"],
  "commands": {
    "start": "./LT --user YOUR_USERNAME --key YOUR_ACCESS_KEY",
    "stop": "./LT --user YOUR_USERNAME --key YOUR_ACCESS_KEY --stop",
    "status": "./LT --status"
  }
}
```

---

### `wdio://testingbot/local-binary`

Download URL and daemon setup instructions for TestingBot Tunnel. The tunnel is a cross-platform Java JAR (requires Java 11+). Only needed for `tunnel: "external"` with `provider: "testingbot"` — for `tunnel: true` the SDK auto-manages the tunnel via `testingbot-tunnel-launcher`.

```json
{
  "requirement": "MUST start the TestingBot Tunnel BEFORE calling start_session with tunnel: \"external\".",
  "runtime": "Java 11+ (17 LTS recommended)",
  "downloadUrl": "https://testingbot.com/downloads/testingbot-tunnel.zip",
  "setup": [
    "1. Download: curl -O https://testingbot.com/downloads/testingbot-tunnel.zip",
    "2. Unzip: unzip testingbot-tunnel.zip",
    "3. Start: java -jar testingbot-tunnel.jar YOUR_KEY YOUR_SECRET"
  ],
  "commands": {
    "start": "java -jar testingbot-tunnel.jar YOUR_KEY YOUR_SECRET",
    "stop": "Press Ctrl+C in the tunnel terminal, or kill the java process."
  }
}
```
