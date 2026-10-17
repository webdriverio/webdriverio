---
id: nightwatch
title: Nightwatch DevTools
description: "Add the DevTools debugging UI to a Nightwatch test suite without changing tests, and configure screencasts, BiDi capture and trace mode."
---

Nightwatch adapter for [WebdriverIO DevTools](https://github.com/webdriverio/devtools) - brings the same visual debugging UI to your Nightwatch test suite with zero test code changes.

## Installation

```bash
npm install @wdio/nightwatch-devtools
```

Requires Nightwatch 3 or later. For Cucumber, `@cucumber/cucumber` must be installed in your project; the adapter uses your copy rather than bundling one.

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

In live mode the run stays open after your tests finish so you can review the results. Close the DevTools window to end it, or press Ctrl+C to exit and leave the window open.

### Cucumber / BDD

Import `cucumberHooksPath` alongside the main export and pass it to the Cucumber `require` option. This registers `Before` / `After` scenario hooks and `BeforeStep` / `AfterStep` step hooks that mirror the WebdriverIO service's `beforeScenario` / `afterScenario` behaviour. A pre-quit `After` hook flushes each scenario's trace while its browser session is still live.

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
| `screencast` | `ScreencastOptions` | `{ enabled: false }` | Per-session `.webm` video recording, live mode only. In trace mode use `filmstrip` / `video`. See [Screencast](#screencast) below. |
| `bidi` | `boolean` | `false` | Opt into WebDriver BiDi capture for browser console + JS exceptions + network. Requires `webSocketUrl: true` in your capabilities and a BiDi-capable chromedriver. When attached, the per-command Chrome perf-log network path is gated off so requests don't duplicate. |
| `mode` | `'live' \| 'trace'` | `'live'` | `live` opens the DevTools UI; `trace` skips it and writes a portable artifact instead. See [Trace Mode](/docs/devtools/wdio/trace-mode). |
| `traceFormat` | `'zip' \| 'ndjson-directory'` | `'zip'` | Trace artifact layout. Only applies when `mode: 'trace'`. |
| `traceGranularity` | `'session' \| 'spec' \| 'test'` | `'session'` | One trace per session / spec file / test. `'test'` writes each to `test-results/<spec>-<title>-<browser>[-retryN]/trace.zip`. Only applies when `mode: 'trace'`. See [Trace Mode](/docs/devtools/wdio/trace-mode#trace-granularity--tracegranularity). **Caveat:** the BDD `describe/it` interface collapses to a single session-scoped slice (see [Per-test slicing](#per-test-slicing--the-bdd-describeit-caveat)). |
| `tracePolicy` | `'on' \| 'retain-on-failure' \| 'retain-on-first-failure' \| 'on-first-retry' \| 'on-all-retries' \| 'retain-on-failure-and-retries'` | `'on'` | Which traces to keep. Pairs with `traceGranularity: 'test'`. Only applies when `mode: 'trace'`; setting it outside trace mode logs a warning. **Caveat:** only `'retain-on-failure'` is reliable on Nightwatch. The other retry-aware policies degrade to it, because `--retries` re-runs a testcase internally without re-firing the plugin's per-test hooks. |
| `filmstrip` | `boolean` | `true` | Record a dense, continuous screencast filmstrip into the trace for scrubbable playback in the trace player — not just one frame per action. Runs the screencast recorder (polling mode on Nightwatch) for the session. Only applies when `mode: 'trace'`. |
| `screenshot` | `'off' \| 'on' \| 'only-on-failure'` | `'off'` | Per-test screenshot. Trace mode + `traceGranularity: 'test'` only. **Produce-only** — the PNG is written to the trace output dir (and the manifest when `emitArtifactsManifest: true`); not attached inline to Allure (see note below). |
| `video` | `'off' \| TraceRetentionPolicy` | `'off'` | Per-test video slice, retained per the given policy (e.g. `'retain-on-failure'`). Trace mode + `traceGranularity: 'test'` only. A non-`off` value starts the screencast recorder itself — you do **not** also need `filmstrip` or `screencast.enabled`. **Produce-only** — the `.webm` is written to the trace output dir (and the manifest when `emitArtifactsManifest: true`); not attached inline to Allure. |
| `emitArtifactsManifest` | `boolean` | `false` | Write the `devtools-artifacts-<sessionId>.json` manifest (the generic index reporters/CI consume to discover produced artifacts) next to the trace. **Opt-in for Nightwatch** — it has no live Allure signal to auto-detect against, so unlike WDIO/Selenium it never auto-enables. Only applies when `mode: 'trace'`. |
| `captureAssertions` | `boolean` | `true` | Capture assertions as trace action rows — `node:assert` plus native `browser.assert`/`browser.verify`, including negated `.not.*` matchers. Set `false` to opt out. |

> **Inline Allure attachment is not supported for Nightwatch.** Its official `nightwatch-allure` reporter is post-hoc (no live attach API), and `allure-js-commons`' `attachment()` no-ops in a Nightwatch run. So `screenshot` / `video` artifacts are *produced* (files, plus the artifacts manifest when `emitArtifactsManifest: true`) in the trace output dir but not attached to an Allure test. Per-test slicing — and therefore these artifacts — is meaningful for the Cucumber and exports-object interfaces; the BDD `describe/it` interface collapses to session granularity, so the per-test gate no-ops there.

```js
globals: nightwatchDevtools({
  port: 3000,
  hostname: 'localhost',
  screencast: { enabled: true },
  bidi: true
})
```

## Screencast

Record a continuous `.webm` video of the browser session. Each WebDriver session gets its own recording: a mid-run `browser.end()`, or the per-scenario browser quit in Cucumber, finalizes the current video and starts a new one for the next session. The last recording is finalized in Nightwatch's `after()` hook, and every recording can be picked from the Screencast tab's dropdown.

**Polling mode only.** Nightwatch doesn't expose a stable CDP escape hatch the way WebdriverIO (`browser.getPuppeteer()`) and Selenium (`driver.createCDPConnection`) do, so the screencast captures frames by requesting a WebDriver screenshot at a fixed interval. The request goes straight over the WebDriver HTTP transport, bypassing Nightwatch's command queue, so it never waits behind your test's commands. Works on every browser Nightwatch supports.

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
| `maxBufferFrames` | `number` | `2000` | Cap on frames held in memory. Past it the buffer is thinned in place, keeping the first and last frames. |
| `maxWidth` / `maxHeight` / `quality` | - | - | CDP-only options, ignored in polling mode. Listed for shape compatibility with the WDIO/Selenium adapters. |

**Prerequisites:** `fluent-ffmpeg` (already a runtime dep of the package) plus the `ffmpeg` binary on PATH. macOS: `brew install ffmpeg`. Linux: `apt install ffmpeg`. Without ffmpeg the recorder still runs but the encode step logs a warning and skips writing the file.

**Output:** `nightwatch-video-<sessionId>.webm` is written to a `test-results/` folder next to the test file that just ran, falling back to the `nightwatch.conf.*` directory, then `process.cwd()`. Directories under `node_modules/` are skipped, and if the chosen directory isn't writable the file goes to the OS temp directory. The full path appears in the Nightwatch log line `📹 Screencast video: <path>` and the video is also streamed to the dashboard's Screencast tab.

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

When BiDi is attached, the per-command Chrome performance-log network capture path is gated off so requests don't appear twice in the dashboard. If `webSocketUrl` is missing or the chromedriver version doesn't expose BiDi, the attach logs a warning and the perf-log fallback continues to work.

**Set `webSocketUrl: true` even without `bidi: true`.** With it, the adapter registers its page collector at document start on every page, so DOM time-travel stays accurate across navigations. Without it, the adapter falls back to injecting the collector after each navigation, which can miss the first moments of a new page.

## Trace mode

Headless capture path — no DevTools UI window opens. At session end the adapter writes a portable `trace-<sessionId>.zip` (or directory) into a `test-results/` folder (next to the resolved test / config directory), with the same shape as the WebdriverIO trace artifact.

```js
globals: nightwatchDevtools({
  mode: 'trace',
  traceFormat: 'ndjson-directory'  // optional; default 'zip'
})
```

### Granularity and Cucumber

`traceGranularity` chooses what one artifact covers — `'session'` (default), `'spec'`, or `'test'`.

Nightwatch quits the browser after every Cucumber scenario. A `'session'` trace spans that: one zip for the whole run, with every scenario nested under its feature. `'test'` writes one zip per scenario into its own folder, which is the recommendation for Cucumber — smaller artifacts, and the granularity that `tracePolicy` retention keys on.

```js
globals: nightwatchDevtools({
  mode: 'trace',
  traceGranularity: 'test'  // one trace per Cucumber scenario
})
```

On the BDD `describe/it` interface, `'test'` collapses to a single session-scoped slice: Nightwatch runs each `it()` internally and fires the plugin's per-test hook only once per module. The action tree still shows each `it` as its own group.

The backend port-bind and UI window are skipped in trace mode, and `screencast.enabled` is ignored (a warning is logged when nothing else needs the recorder). Trace mode records the dense `filmstrip` by default instead, and the screencast tuning fields (`pollIntervalMs`, `captureFormat`, `maxBufferFrames`) still apply to that recorder. For the full feature reference (artifact contents, viewer, mobile testing, when to pick `zip` vs `ndjson-directory`), see the [Trace Mode page](/docs/devtools/wdio/trace-mode).

Nightwatch shares the same trace pipeline as the WebdriverIO and Selenium adapters, so the artifact shape is identical no matter which adapter produced it. A Nightwatch trace carries the full per-action capture — a screenshot, the depth-indented accessibility-tree snapshot, the interactable-element list, and the Markdown transcript — so it opens in the `show-trace` player with DOM/snapshot time-travel, the **A11y**, **Transcript** and **Errors** tabs (failures with jump-to-source), the pick-locator element overlay, and (for Cucumber) **Feature → Scenario** nesting. Steps are tracked in the live dashboard but are not yet nested as their own groups in the trace. Copied locators prefer plain CSS, which Nightwatch reads by default; only when no unique CSS selector exists does the player hand you XPath, captioned with `useXpath()` / `locateStrategy: 'xpath'`.

Open a trace with the `show-trace` bin, shipped with `@wdio/nightwatch-devtools` (no extra dependency):

```sh
npx show-trace test-results/trace-<sessionId>.zip   # in a project that installs the adapter
pnpm show-trace test-results/trace-<sessionId>.zip  # from the devtools monorepo
```

See the [Trace Player](/docs/devtools/trace-player) page for the full walkthrough and keyboard shortcuts.

### Per-test slicing & the BDD `describe/it` caveat

The per-test options — `traceGranularity: 'test'`, and the `tracePolicy`, `screenshot`, and `video` options that pair with it — need a per-test hook to cut each test's slice. The **exports-object (mocha-style)** interface and **Cucumber** (per-scenario hooks) expose one, so they get real per-test slicing. The **BDD `describe/it`** interface is the exception: Nightwatch runs each `it()` internally and fires the plugin's per-test hook only once per module, so `traceGranularity: 'test'` collapses to a single **session-scoped** slice keyed to the first test. The artifacts manifest still lists every testcase with its correct state; only the per-test slice/artifact keying collapses. Session- and spec-granularity traces are unaffected.

## Examples

Working examples live in the repo's top-level `examples/` directory. Build the workspace once (`pnpm install && pnpm build`), then run from the repo root:

| Directory | Runner | Command |
|-----------|--------|---------|
| [`examples/nightwatch/`](https://github.com/webdriverio/devtools/tree/main/examples/nightwatch) | Nightwatch BDD `describe/it` (trace mode by default; `DEVTOOLS_MODE=live` for the UI) | `pnpm demo:nightwatch` (`pnpm demo:nightwatch:retry` adds `--retries 1`) |
| [`examples/nightwatch/cucumber/`](https://github.com/webdriverio/devtools/tree/main/examples/nightwatch/cucumber) | Nightwatch + Cucumber | `pnpm --filter @wdio/nightwatch-devtools example:cucumber` |
| [`examples/nightwatch/`](https://github.com/webdriverio/devtools/tree/main/examples/nightwatch) (`nightwatch.mobile.conf.cjs`) | Appium (Android Clock app; iOS Settings with `DEVTOOLS_MOBILE_PLATFORM=ios`) | `pnpm demo:nightwatch:mobile` |

## Mobile (Appium)

Appium sessions are captured in live and trace mode. Declare Appium under `selenium` with `use_appium: true`, `start_process: false` and `default_path_prefix: ''`. For a native app set `browserName: null`; otherwise Nightwatch fills in Firefox and the adapter treats the session as having a web page. Leave `bidi` off, since Appium serves no BiDi.

```js
// nightwatch.mobile.conf.cjs
const nightwatchDevtools = require('@wdio/nightwatch-devtools').default

module.exports = {
  selenium: {
    start_process: false,
    use_appium: true,
    host: '127.0.0.1',
    port: 4723,
    default_path_prefix: ''
  },
  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: null,
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2'
      },
      globals: nightwatchDevtools({ mode: 'trace', bidi: false })
    }
  }
}
```

Native sessions record commands, screenshots and element data from the platform's XML tree, with no DOM. A hybrid app's webview is captured as if it were still native. Try it with `pnpm demo:nightwatch:mobile`, run from the root of a built checkout of the devtools repo (setup steps in [Running an example](/docs/devtools/mobile#running-an-example)). See the [Mobile Testing page](/docs/devtools/mobile) for the full mobile reference.

## Features

The Nightwatch adapter provides the same DevTools UI experience as WebdriverIO. Every feature below is captured automatically with the base `globals: nightwatchDevtools({ port: 3000 })` setup — no per-feature config (network logs additionally need `'goog:loggingPrefs': { performance: 'ALL' }`, shown in [Setup](#setup)). Links go to each feature's full reference.

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Live browser previews, per-command screenshots, and one-click test/suite rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** - Snapshot a failing test, rerun it, and diff the two runs side-by-side. Nightwatch reruns relaunch your config with `DEVTOOLS_RERUN_LABEL` set and filter down to that test; they need a discoverable `nightwatch.conf.*`, without which the plugin warns and rerun is unavailable
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
| Screencast in polling mode only | Unlike WDIO (CDP push via `browser.getPuppeteer()`) and Selenium (CDP push via `driver.createCDPConnection`), Nightwatch lacks a stable CDP escape hatch, so frames are captured by polling the WebDriver screenshot endpoint. Works on every browser Nightwatch supports; small per-frame cost proportional to the polling interval. |
| Per-test trace slicing (BDD `describe/it`) | The BDD interface fires the plugin's per-test hook once per module, so `traceGranularity: 'test'` collapses to one session-scoped slice. The exports-object (mocha-style) and Cucumber interfaces get real per-test slicing. See [Per-test slicing](#per-test-slicing--the-bdd-describeit-caveat). |
| Retry-aware retention | Only `tracePolicy: 'retain-on-failure'` is reliable; the other retry-aware policies degrade to it. |
| Produce-only trace artifacts | Per-test `screenshot` / `video` files are written to the trace output dir (and the manifest when `emitArtifactsManifest: true`) but not attached inline to Allure — Nightwatch has no live Allure attach API. |

Overall feature parity with the WebdriverIO DevTools service is approximately **80-90%**.
