---
id: reference
title: Configuration Reference
description: "Look up every DevTools option for live mode and trace mode across the WebdriverIO, Selenium and Nightwatch adapters, with defaults."
---

All DevTools options at a glance, across the three adapters. Shared options have the same **names, types and defaults** on every adapter; where behaviour or availability differs, it's noted, and adapter-only options are listed separately. The Python adapter takes no options object; see the Python tabs on the [Selenium](/docs/devtools/selenium#configuration-options) page. For the full explanation of each trace option see the linked section on the [Trace Mode](/docs/devtools/wdio/trace-mode) page.

Pass options the way each adapter takes them:

- **WebdriverIO** — `services: [['devtools', { … }]]`
- **Selenium** — `DevTools.configure({ … })`
- **Nightwatch** — `globals: nightwatchDevtools({ … })`

## Mode & live-mode options

| Option | Type / values | Default | Notes |
|---|---|---|---|
| `mode` | `'live' \| 'trace'` | `'live'` | `'live'` opens the DevTools UI dashboard; `'trace'` skips it and writes a portable artifact. The two are mutually exclusive. |
| `port` | `number` | `3000` (a free port is used if it is taken) | Port the DevTools UI / backend binds to. Live mode only. |
| `hostname` | `string` | `'localhost'` | Hostname the server binds to. Live mode only. |
| `screencast` | `ScreencastOptions` | `{ enabled: false }` | Continuous session video (`.webm`). Live mode only — for trace mode use `video`. Includes `maxBufferFrames` (default `2000`), the cap on frames held in memory. See [Screencast](/docs/devtools/wdio/screencast). |
| `devtoolsCapabilities` | `Capabilities` | Chrome 1600×1200 | Capabilities used to open the DevTools UI window. WebdriverIO, live mode only. |

## Trace-mode options

Only apply when `mode: 'trace'`.

| Option | Type / values | Default | Details |
|---|---|---|---|
| `traceFormat` | `'zip' \| 'ndjson-directory'` | `'zip'` | Single archive vs. an unpacked directory. [Output format](/docs/devtools/wdio/trace-mode#output-format--traceformat) |
| `traceGranularity` | `'session' \| 'spec' \| 'test'` | `'session'` | One trace per session / spec file / test. `'test'` is required for per-test screenshot/video and inline Allure attach. [Trace granularity](/docs/devtools/wdio/trace-mode#trace-granularity--tracegranularity) |
| `tracePolicy` | `'on' \| 'retain-on-failure' \| 'retain-on-first-failure' \| 'on-first-retry' \| 'on-all-retries' \| 'retain-on-failure-and-retries'` | `'on'` | Which traces to keep. Pairs with `traceGranularity: 'test'`. [Retention](/docs/devtools/wdio/trace-mode#retention--tracepolicy) |
| `filmstrip` | `boolean` | `true` | Dense, continuous screencast into the trace for smooth scrubbing; `false` records one frame per action. Thinned at export to frames at least 100 ms apart, about 600 at most. [Dense filmstrip](/docs/devtools/wdio/trace-mode#dense-filmstrip--filmstrip) |
| `screenshot` | `'off' \| 'on' \| 'only-on-failure'` | `'off'` | Per-test screenshot (needs `traceGranularity: 'test'`). Attached inline to Allure on WebdriverIO and Selenium; produce-only on Nightwatch. [Per-test screenshot & video](/docs/devtools/wdio/trace-mode#per-test-screenshot--video--screenshot--video) |
| `video` | `'off' \| <tracePolicy value>` | `'off'` | Per-test video slice (needs `traceGranularity: 'test'`; encoding needs `ffmpeg` on `PATH`). Attached inline to Allure on WebdriverIO and Selenium; produce-only on Nightwatch. [Per-test screenshot & video](/docs/devtools/wdio/trace-mode#per-test-screenshot--video--screenshot--video) |
| `emitArtifactsManifest` | `boolean` | `false` | Write `devtools-artifacts-<sessionId>.json`. Auto-enabled when an Allure reporter is detected (opt-in on Nightwatch). [Artifacts manifest](/docs/devtools/wdio/trace-mode#artifacts-manifest--emitartifactsmanifest) |
| `captureAssertions` | `boolean` | `true` | Capture `node:assert` (and framework `expect` matchers where supported) as trace actions. [Assertions](/docs/devtools/wdio/trace-mode#assertions--captureassertions) |

## Selenium-only (Node.js)

| Option | Type / values | Default | Notes |
|---|---|---|---|
| `openUi` | `boolean` | `true` | Open the dashboard window automatically. Set `false` for CI. |
| `headless` | `boolean` | `false` | Run the test browser headless (`--headless=old`). The dashboard window is unaffected. |
| `rerunCommand` | `string` | auto | Command template for a per-test rerun; `{{testName}}` is substituted. Derived from the runner's argv when omitted. |

## Nightwatch-only

| Option | Type / values | Default | Notes |
|---|---|---|---|
| `bidi` | `boolean` | `false` | Opt into WebDriver BiDi capture (console + JS exceptions + network). Requires `webSocketUrl: true` in capabilities. On WebdriverIO and Selenium, BiDi is auto-attached. See [Nightwatch → BiDi capture](/docs/devtools/nightwatch#bidi-capture-opt-in). |

## Per-adapter differences

Some trace capabilities degrade on certain adapters — see the [cross-framework support matrix](/docs/devtools/cross-framework) for the full picture. The notable ones:

- **Nightwatch retry-aware retention** — only `retain-on-failure` is reliable; other `tracePolicy` values degrade to it.
- **Nightwatch BDD `describe/it`** — `traceGranularity: 'test'` collapses to one session-scoped slice.
- **Nightwatch Allure attach** — per-test `screenshot`/`video` are produce-only (files + manifest), not attached inline.
