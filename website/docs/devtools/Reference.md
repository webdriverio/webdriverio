---
id: reference
title: Configuration Reference
---

All DevTools options at a glance, across the three adapters. Option **names, types, and defaults are identical** on every adapter; where behaviour differs, it's noted. For the full explanation of each trace option see the linked section on the [Trace Mode](/docs/devtools/wdio/trace-mode) page.

Pass options the way each adapter takes them:

- **WebdriverIO** — `services: [['devtools', { … }]]`
- **Selenium** — `DevTools.configure({ … })`
- **Nightwatch** — `globals: nightwatchDevtools({ … })`

## Mode & live-mode options

| Option | Type / values | Default | Notes |
|---|---|---|---|
| `mode` | `'live' \| 'trace'` | `'live'` | `'live'` opens the DevTools UI dashboard; `'trace'` skips it and writes a portable artifact. The two are mutually exclusive. |
| `port` | `number` | random | Port the DevTools UI / backend binds to. Live mode only. |
| `hostname` | `string` | `'localhost'` | Hostname the server binds to. Live mode only. |
| `screencast` | `ScreencastOptions` | `{ enabled: false }` | Continuous session video (`.webm`). Live mode only — for trace mode use `video`. See [Screencast](/docs/devtools/wdio/screencast). |
| `devtoolsCapabilities` | `Capabilities` | Chrome 1600×1200 | Capabilities used to open the DevTools UI window. WebdriverIO, live mode only. |

## Trace-mode options

Only apply when `mode: 'trace'`.

| Option | Type / values | Default | Details |
|---|---|---|---|
| `traceFormat` | `'zip' \| 'ndjson-directory'` | `'zip'` | Single archive vs. an unpacked directory. [Output format](/docs/devtools/wdio/trace-mode#output-format--traceformat) |
| `traceGranularity` | `'session' \| 'spec' \| 'test'` | `'session'` | One trace per session / spec file / test. `'test'` is required for per-test screenshot/video and inline Allure attach. [Trace granularity](/docs/devtools/wdio/trace-mode#trace-granularity--tracegranularity) |
| `tracePolicy` | `'on' \| 'retain-on-failure' \| 'retain-on-first-failure' \| 'on-first-retry' \| 'on-all-retries' \| 'retain-on-failure-and-retries'` | `'on'` | Which traces to keep. Pairs with `traceGranularity: 'test'`. [Retention](/docs/devtools/wdio/trace-mode#retention--tracepolicy) |
| `filmstrip` | `boolean` | `true` | Dense, continuous screencast into the trace for smooth scrubbing; `false` records one frame per action. [Dense filmstrip](/docs/devtools/wdio/trace-mode#dense-filmstrip--filmstrip) |
| `screenshot` | `'off' \| 'on' \| 'only-on-failure'` | `'off'` | Per-test screenshot (needs `traceGranularity: 'test'`). WebdriverIO service option. [Per-test screenshot & video](/docs/devtools/wdio/trace-mode#per-test-screenshot--video--screenshot--video) |
| `video` | `'off' \| <tracePolicy value>` | `'off'` | Per-test video slice (needs `traceGranularity: 'test'`). WebdriverIO service option. [Per-test screenshot & video](/docs/devtools/wdio/trace-mode#per-test-screenshot--video--screenshot--video) |
| `emitArtifactsManifest` | `boolean` | `false` | Write `devtools-artifacts-<sessionId>.json`. Auto-enabled when an Allure reporter is detected (opt-in on Nightwatch). [Artifacts manifest](/docs/devtools/wdio/trace-mode#artifacts-manifest--emitartifactsmanifest) |
| `captureAssertions` | `boolean` | `true` | Capture `node:assert` (and framework `expect` matchers where supported) as trace actions. [Assertions](/docs/devtools/wdio/trace-mode#assertions--captureassertions) |

## Nightwatch-only

| Option | Type / values | Default | Notes |
|---|---|---|---|
| `bidi` | `boolean` | `false` | Opt into WebDriver BiDi capture (console + JS exceptions + network). Requires `webSocketUrl: true` in capabilities. On WebdriverIO and Selenium, BiDi is auto-attached. See [Nightwatch → BiDi capture](/docs/devtools/nightwatch#bidi-capture-opt-in). |

## Per-adapter differences

Some trace capabilities degrade on certain adapters — see the [cross-framework support matrix](/docs/devtools/cross-framework) for the full picture. The notable ones:

- **Nightwatch retry-aware retention** — only `retain-on-failure` is reliable; other `tracePolicy` values degrade to it.
- **Nightwatch BDD `describe/it`** — `traceGranularity: 'test'` collapses to one session-scoped slice.
- **Nightwatch Allure attach** — per-test `screenshot`/`video` are produce-only (files + manifest), not attached inline.
