---
id: devtools
title: DevTools
---

DevTools is a powerful browser-based debugging interface for visualizing, controlling, and inspecting your test executions in real-time. It works with both **WebdriverIO** and **Nightwatch.js** — same backend, same UI, same capture infrastructure.

## What It Provides

- **Rerun tests selectively** - Click on any test case or suite to re-execute it instantly
- **Debug visually** - See live browser previews with automatic screenshots after each command
- **Track execution** - View detailed command logs with timestamps and results
- **Monitor network & console** - Inspect API calls and JavaScript logs
- **Navigate to code** - Jump directly to test source files with TestLens

## How It Works

1. Start your tests as normal
2. DevTools automatically opens a browser window at `http://localhost:3000`
3. The UI shows test hierarchy, browser preview, command timeline, and logs in real-time
4. After tests complete, click any test to rerun it individually in the same browser session

## Choose Your Framework

- **[WebDriverIO](/docs/devtools/wdio)** - Use `@wdio/devtools-service` with Mocha, Jasmine, or Cucumber
- **[Nightwatch](/docs/devtools/nightwatch)** - Use `@wdio/nightwatch-devtools` with zero test code changes
