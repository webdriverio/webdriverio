---
id: nightwatch
title: Nightwatch DevTools
---

Nightwatch adapter for [WebdriverIO DevTools](https://github.com/webdriverio/devtools) - brings the same visual debugging UI to your Nightwatch test suite with zero test code changes.

## Installation

```bash
npm install @wdio/nightwatch-devtools
```

## Setup

### Standard Nightwatch (mocha-style)

```js
// nightwatch.conf.cjs
const nightwatchDevtools = require('@wdio/nightwatch-devtools').default

module.exports = {
  src_folders: ['tests'],

  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'chrome',
        // Required for network request capture
        'goog:loggingPrefs': { performance: 'ALL' }
      },
      globals: nightwatchDevtools({ port: 3000 })
    }
  }
}
```

Run your tests as normal - the DevTools UI opens automatically in a new browser window:

```bash
nightwatch
```

> No changes to your test files are needed.

### Cucumber / BDD

Import `cucumberHooksPath` alongside the main export and pass it to the Cucumber `require` option. This registers `Before` / `After` scenario hooks that mirror the WebdriverIO service's `beforeScenario` / `afterScenario` behaviour.

```js
// nightwatch.conf.cjs
const nightwatchDevtools = require('@wdio/nightwatch-devtools').default
const { cucumberHooksPath } = require('@wdio/nightwatch-devtools')

module.exports = {
  src_folders: ['features/step_definitions'],

  test_runner: {
    type: 'cucumber',
    options: {
      feature_path: 'features',
      require: [cucumberHooksPath] // <-- register DevTools Cucumber hooks
    }
  },

  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:loggingPrefs': { performance: 'ALL' }
      },
      globals: nightwatchDevtools({ port: 3000 })
    }
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | Port for the DevTools backend server. Auto-incremented if already in use. |
| `hostname` | `string` | `'localhost'` | Hostname the backend server binds to. |
| `screencast` | `ScreencastOptions` | `{ enabled: false }` | Per-session `.webm` video recording. See [Screencast](#screencast) below. |
| `bidi` | `boolean` | `false` | Opt into WebDriver BiDi capture for browser console + JS exceptions + network. Requires `webSocketUrl: true` in your capabilities and a BiDi-capable chromedriver. When attached, the per-command Chrome perf-log network path is gated off so requests don't duplicate. |
| `mode` | `'live' \| 'trace'` | `'live'` | `live` opens the DevTools UI; `trace` skips it and writes a portable artifact instead. See [Trace Mode](/docs/devtools/wdio/trace-mode). |
| `traceFormat` | `'zip' \| 'ndjson-directory'` | `'zip'` | Trace artifact layout. Only applies when `mode: 'trace'`. |

```js
globals: nightwatchDevtools({
  port: 3000,
  hostname: 'localhost',
  screencast: { enabled: true },
  bidi: true
})
```

## Screencast

Record a continuous `.webm` video of the browser session. The recording starts on the first session the plugin sees and is finalized in Nightwatch's `after()` hook.

**Polling mode only.** Nightwatch doesn't expose a stable CDP escape hatch the way WebdriverIO (`browser.getPuppeteer()`) and Selenium (`driver.createCDPConnection`) do, so the screencast captures frames by calling `browser.takeScreenshot()` at a fixed interval. Works on every browser Nightwatch supports.

```js
globals: nightwatchDevtools({
  port: 3000,
  screencast: { enabled: true, pollIntervalMs: 200 }
})
```

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `enabled` | `boolean` | `false` | Master switch. |
| `pollIntervalMs` | `number` | `200` | Screenshot interval (ms). Lower = smoother video, more WebDriver round-trips. 200 ms ≈ 5 fps. |
| `captureFormat` | `'jpeg' \| 'png'` | `'jpeg'` | Per-frame pixel format handed to the ffmpeg encoder before the final `.webm` mux. In polling mode the source screenshots are always captured as PNG, so this does **not** change the capture - only the format the encoder receives per frame. |
| `maxWidth` / `maxHeight` / `quality` | - | - | CDP-only options, ignored in polling mode. Listed for shape compatibility with the WDIO/Selenium adapters. |

**Prerequisites:** `fluent-ffmpeg` (already a runtime dep of the package) plus the `ffmpeg` binary on PATH. macOS: `brew install ffmpeg`. Linux: `apt install ffmpeg`. Without ffmpeg the recorder still runs but the encode step logs a warning and skips writing the file.

**Output:** the video file is written next to the test file that just ran (with `nightwatch.conf.*` directory as a fallback, then `process.cwd()` as a last resort). The full path appears in the Nightwatch log line `📹 Screencast video: <path>` and the video is also streamed to the dashboard's Screencast tab.

For the full screencast feature reference (browser support, output paths across all three adapters), see the [Screencast page](/docs/devtools/wdio/screencast).

## BiDi capture (opt-in)

Enable WebDriver BiDi capture for browser console messages, JS exceptions, and network requests. Equivalent to the path selenium-devtools uses - both adapters share the same attach logic in `@wdio/devtools-core`.

```js
globals: nightwatchDevtools({
  port: 3000,
  bidi: true
})
```

You also need `webSocketUrl: true` in your capabilities so chromedriver actually exposes the BiDi channel:

```js
desiredCapabilities: {
  browserName: 'chrome',
  webSocketUrl: true,                           // ← enables BiDi
  'goog:chromeOptions': { /* ... */ }
}
```

When BiDi is attached, the per-command Chrome performance-log network capture path is gated off so requests don't appear twice in the dashboard. If `webSocketUrl` is missing or the chromedriver version doesn't expose BiDi, the attach silently fails and the perf-log fallback continues to work.

## Trace mode

Headless capture path — no DevTools UI window opens. At session end the adapter writes a portable `trace-<sessionId>.zip` (or directory) next to the config file, with the same shape as the WebdriverIO trace artifact.

```js
globals: nightwatchDevtools({
  mode: 'trace',
  traceFormat: 'ndjson-directory'  // optional; default 'zip'
})
```

The backend port-bind, UI window, and `screencast` option are all skipped in trace mode. For the full feature reference (artifact contents, viewer, mobile testing, when to pick `zip` vs `ndjson-directory`), see the [Trace Mode page](/docs/devtools/wdio/trace-mode).

## Examples

Working examples live in the repo's top-level `examples/` directory. Build the workspace once (`pnpm install && pnpm build`), then run from the repo root:

| Directory | Runner | Command |
|-----------|--------|---------|
| [`examples/nightwatch/`](https://github.com/webdriverio/devtools/tree/main/examples/nightwatch) | Nightwatch mocha-style | `pnpm demo:nightwatch` |

## Features

The Nightwatch adapter provides the same DevTools UI experience as WebdriverIO. Every feature below is captured automatically with the base `globals: nightwatchDevtools({ port: 3000 })` setup — no per-feature config (network logs additionally need `'goog:loggingPrefs': { performance: 'ALL' }`, shown in [Setup](#setup)). Links go to each feature's full reference.

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Live browser previews, per-command screenshots, and one-click test/suite rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** - Snapshot a failing test, rerun it, and diff the two runs side-by-side
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** - Standard (mocha-style) and Cucumber/BDD runners
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output (real-time with `bidi: true`)
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[Metadata](/docs/devtools/wdio/metadata)** - Session capabilities, environment, and timing per browser session
- **[TestLens](/docs/devtools/wdio/testlens)** - Jump from any command to the source line that triggered it
- **[Session Screencast](/docs/devtools/wdio/screencast)** - Continuous `.webm` recording of the browser session
- **[Trace Mode](/docs/devtools/wdio/trace-mode)** - Headless capture producing a portable `trace.zip` (no UI window)

Screencast is the one feature with its own options (full list under [Screencast](#screencast)):

```js
globals: nightwatchDevtools({ port: 3000, screencast: { enabled: true, pollIntervalMs: 200 } })
```

## Limitations

Nightwatch does not provide the same depth of framework hooks as WebdriverIO, so there are a few differences from the WDIO DevTools service:

| Limitation | Detail |
|-----------|--------|
| No native command hooks | Nightwatch has no `beforeCommand` / `afterCommand` hook. Commands are intercepted via a browser proxy wrapper instead. |
| Limited test context | `browser.currentTest` provides less metadata than the WDIO runner context; test names and file paths require additional heuristics. |
| Flat suite nesting | Nightwatch does not natively support multiply-nested `describe` blocks; the plugin reports a maximum of two levels. |
| Delayed result availability | Test results are only finalised in `afterEach`, not available mid-test. |
| Screencast in polling mode only | Unlike WDIO (CDP push via `browser.getPuppeteer()`) and Selenium (CDP push via `driver.createCDPConnection`), Nightwatch lacks a stable CDP escape hatch, so frames are captured by polling `browser.takeScreenshot()`. Works on every browser Nightwatch supports; small per-frame cost proportional to the polling interval. |

Overall feature parity with the WebdriverIO DevTools service is approximately **80-90%**.
