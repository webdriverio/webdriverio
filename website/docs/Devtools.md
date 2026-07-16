---
id: devtools
title: DevTools
---

DevTools is a powerful browser-based debugging interface for visualizing, controlling, and inspecting your test executions in real-time. It works with **WebdriverIO**, **Nightwatch.js**, and **Selenium WebDriver** (any runner) — same backend, same UI, same capture infrastructure.

## What It Provides

- **Rerun tests selectively** - Click on any test case or suite to re-execute it instantly ([details](/docs/devtools/wdio/interactive-test-rerunning))
- **Preserve & Rerun (Compare)** - Snapshot a failing test, rerun it, and diff the two runs side-by-side aligned by command ([details](/docs/devtools/wdio/preserve-and-rerun))
- **Debug visually** - See live browser previews with automatic screenshots after each command
- **Track execution** - View detailed command logs with timestamps and results
- **Monitor network & console** - Inspect API calls and JavaScript logs ([network](/docs/devtools/wdio/network-logs) · [console](/docs/devtools/wdio/console-logs))
- **Navigate to code** - Jump directly to test source files with TestLens ([details](/docs/devtools/wdio/testlens))
- **Record sessions** - Continuous `.webm` video of the browser, per session ([details](/docs/devtools/wdio/screencast))
- **Trace mode** - Headless capture path producing a portable `trace.zip` artifact for offline replay or agentic consumption ([details](/docs/devtools/wdio/trace-mode))

## How It Works

1. Start your tests as normal
2. DevTools automatically opens a browser window at `http://localhost:3000`
3. The UI shows test hierarchy, browser preview, command timeline, and logs in real-time
4. After tests complete, click any test to rerun it individually in the same browser session

## Choose Your Framework

- **[WebDriverIO](/docs/devtools/wdio)** - Use `@wdio/devtools-service` with Mocha, Jasmine, or Cucumber
- **[Nightwatch](/docs/devtools/nightwatch)** - Use `@wdio/nightwatch-devtools` with zero test code changes
- **[Selenium](/docs/devtools/selenium)** - Use `@wdio/selenium-devtools` with Mocha, Jest, Cucumber, or plain Node scripts
