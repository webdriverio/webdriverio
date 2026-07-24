---
id: dashboard
title: The Dashboard
---

Live mode opens the DevTools UI in an external browser window and streams your test run in real time. It's the interactive counterpart to [Trace Mode](/docs/devtools/wdio/trace-mode), which skips the UI and writes a portable offline artifact instead. Live mode is enabled by default (`mode: 'live'`), so simply running your WebdriverIO tests launches the dashboard.

When you run your tests, the DevTools UI automatically opens in an external browser window and tests begin executing immediately with real-time visualization. After the initial run completes, use the play buttons to rerun individual tests or suites, and the stop button to terminate running tests at any time.

## What the dashboard shows

- **Live browser preview** — watch the browser under test as commands execute.
- **Test progress** — suites and tests update as they run.
- **Command execution** — each action streams in as it happens.
- **Workbench tabs** — explore Actions, Console, Network, Metadata, and Source for the selected test.

## Live-mode features

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** — Real-time browser previews with test rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** — Snapshot a failing test, rerun it, and diff the two runs side-by-side
- **[Console Logs](/docs/devtools/wdio/console-logs)** — Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** — Monitor API calls and network activity
- **[Metadata](/docs/devtools/wdio/metadata)** — Session capabilities, environment, and timing per browser session
- **[TestLens](/docs/devtools/wdio/testlens)** — Navigate to source code with intelligent code navigation
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** — Works with Mocha, Jasmine, and Cucumber
- **[Session Screencast](/docs/devtools/wdio/screencast)** — Automatic video recording of browser sessions

## Configuring the dashboard window

The `port`, `hostname`, and `devtoolsCapabilities` options control the DevTools UI server and the window it opens in. See the [Configuration Reference](/docs/devtools/reference) for details.
