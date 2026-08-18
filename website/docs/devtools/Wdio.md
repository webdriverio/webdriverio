---
id: wdio
title: WebDriverIO DevTools
---

A WebdriverIO service that provides a developer tools UI for running, debugging, and inspecting browser automation tests. Features include DOM mutation replay, per-command screenshots, network request inspection, console log capture, and session screencast recording.

## Installation

```sh
npm install @wdio/devtools-service --save-dev
```

## Usage

### Test Runner

```ts
// wdio.conf.ts
export const config = {
  services: ['devtools'],
}
```

### Standalone

```ts
import { remote } from 'webdriverio'
import { setupForDevtools } from '@wdio/devtools-service'

const browser = await remote(setupForDevtools({
  capabilities: { browserName: 'chrome' }
}))
await browser.url('https://example.com')
await browser.deleteSession()
```

## Service Options

```ts
services: [['devtools', options]]
```

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | random | Port the DevTools UI server listens on |
| `hostname` | `string` | `'localhost'` | Hostname the DevTools UI server binds to |
| `devtoolsCapabilities` | `Capabilities` | Chrome 1600x1200 | Capabilities used to open the DevTools UI window |
| `screencast` | `ScreencastOptions` | - | Session video recording ([see Screencast](/docs/devtools/wdio/screencast)) |
| `mode` | `'live' \| 'trace'` | `'live'` | `live` opens the DevTools UI; `trace` skips it and writes a portable artifact instead ([see Trace Mode](/docs/devtools/wdio/trace-mode)) |
| `traceFormat` | `'zip' \| 'ndjson-directory'` | `'zip'` | Trace artifact layout — single archive vs unpacked directory. Only applies when `mode: 'trace'` |
| `traceGranularity` | `'session' \| 'spec' \| 'test'` | `'session'` | One trace per session / spec file / test. `'test'` writes each to `test-results/<spec>-<title>-<browser>[-retryN]/trace.zip`. Only applies when `mode: 'trace'` ([see Trace Mode](/docs/devtools/wdio/trace-mode#trace-granularity--tracegranularity)) |
| `tracePolicy` | `'on' \| 'retain-on-failure' \| 'retain-on-first-failure' \| 'on-first-retry' \| 'on-all-retries' \| 'retain-on-failure-and-retries'` | `'on'` | Which traces to keep. Pairs with `traceGranularity: 'test'`. Only applies when `mode: 'trace'` |
| `filmstrip` | `boolean` | `true` | Records a dense, continuous screencast filmstrip *into* the trace for smooth scrubbable playback in the player — dense frames alongside the per-action frames, thinned and content-addressed at export. Only applies when `mode: 'trace'` |
| `screenshot` | `'off' \| 'on' \| 'only-on-failure'` | `'off'` | Per-test screenshot, attached inline to Allure (`image/png`). Requires `mode: 'trace'` + `traceGranularity: 'test'` |
| `video` | `'off' \| TraceRetentionPolicy` | `'off'` | Per-test screencast video, retained per the given policy and attached inline to Allure (`video/webm`). Requires `mode: 'trace'` + `traceGranularity: 'test'` |
| `emitArtifactsManifest` | `boolean` | `false` | Writes `devtools-artifacts-<sessionId>.json` — a generic index of every produced artifact plus each test's state, for reporters/CI. Auto-enabled when `@wdio/allure-reporter` is in the config. Only applies when `mode: 'trace'` |
| `captureAssertions` | `boolean` | `true` | Capture assertions as trace action rows — `node:assert` plus passing/failing `expect(...)` matchers. Set `false` to opt out |

## Getting Started

1. Run your WebdriverIO tests
2. The DevTools UI automatically opens in an external browser window
3. Tests begin executing immediately with real-time visualization
4. View live browser preview, test progress, and command execution
5. After initial run completes, use play buttons to rerun individual tests or suites
6. Click stop button anytime to terminate running tests
7. Explore actions, metadata, console logs, and source code in the workbench tabs

## Features

Explore the WebDriverIO DevTools features in detail:

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Real-time browser previews with test rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** - Snapshot a failing test, rerun it, and diff the two runs side-by-side
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** - Works with Mocha, Jasmine, and Cucumber
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[Metadata](/docs/devtools/wdio/metadata)** - Session capabilities, environment, and timing per browser session
- **[TestLens](/docs/devtools/wdio/testlens)** - Navigate to source code with intelligent code navigation
- **[Session Screencast](/docs/devtools/wdio/screencast)** - Automatic video recording of browser sessions
- **[Trace Mode](/docs/devtools/wdio/trace-mode)** - Headless capture path producing a portable `trace.zip` artifact (no UI window); supports `zip` and `ndjson-directory` output formats, per-session/spec/test granularity, retry-aware retention policies, and an optional dense `filmstrip`, all viewable in the first-party `show-trace` player

## Trace Player

A trace recorded with `mode: 'trace'` opens in the first-party `show-trace` player (`npx show-trace path/to/trace.zip`) — DOM time-travel, the A11y tab and pick-locator element overlay, the Transcript tab with Copy-for-LLM, the Errors / Console / Network / Source tabs, and a scrubbable timeline (dense filmstrip, Cucumber Feature → Scenario → Step nesting).

See the **[Trace Player](/docs/devtools/trace-player)** page for the full walkthrough and other compatible viewers.

## Allure Reporting

With `@wdio/allure-reporter` in the config, trace-mode artifacts (the trace zip, plus the per-test screenshot and video at `traceGranularity: 'test'`) attach to the Allure report automatically, and `emitArtifactsManifest` is auto-enabled.

See **[Allure Integration](/docs/devtools/allure)** for the attachment details and the reporter step-silencing options.
