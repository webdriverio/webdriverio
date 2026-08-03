---
id: trace-mode
title: Trace Mode
---

Headless capture path — no DevTools UI window opens. At session end the adapter writes trace artifacts into a `test-results/` folder next to your spec / config directory. For `session` / `spec` granularity that's a `trace-<sessionId>.zip` (or a `trace-<sessionId>/` directory); for `test` granularity each test gets its own subfolder (see [Trace granularity](#trace-granularity--tracegranularity)). The artifact is portable and ships everything needed for offline replay, AI-agent diffing, or any consumer that prefers a file over a live UI.

Trace mode is **mutually exclusive with live mode**. Pick one per session: humans debugging interactively want live; agents diffing runs or CI bots collecting artifacts want trace.

## Enable

```ts
// wdio.conf.ts
services: [
  [
    'devtools',
    {
      mode: 'trace',
      traceFormat: 'zip' // optional; 'zip' (default) | 'ndjson-directory'
    }
  ]
]
```

A complete, copy-pasteable reference config ships at [`examples/wdio/wdio.trace.conf.ts`](https://github.com/webdriverio/devtools/blob/main/examples/wdio/wdio.trace.conf.ts).

Selenium and Nightwatch ship the same trace pipeline — see their adapter pages for framework-specific enable syntax: [Selenium](/docs/devtools/selenium#trace-mode) · [Nightwatch](/docs/devtools/nightwatch#trace-mode).

## What's inside the artifact

| File | Contents |
|---|---|
| `trace.trace` | NDJSON `context-options` + `before` / `after` action events; one line per record |
| `trace.network` | HAR-style network entries, one per line |
| `transcript.md` | Human/LLM-readable Markdown summary with timing, selectors, value annotations |
| `resources/page@<id>-<ts>.jpeg` | Screenshot taken at each user-facing action |
| `resources/page@<id>-<ts>-elements.json` | Flat list of interactable elements at that action |
| `resources/page@<id>-<ts>-snapshot.txt` | Depth-indented accessibility-tree snapshot (AI-friendly) |

### What counts as an "action"

Commands are filtered through an allow-list before they produce trace entries. Examples that land in the trace:

- `url` / `get` → `Page.navigate`
- `click` → `Element.click`
- `setValue` / `sendKeys` → `Element.fill`
- `submit`, `clear`, `selectByVisibleText`, …

Internal commands like `findElement`, `waitUntil`, `executeScript` are deliberately excluded — they don't represent user-facing intent and would noise up the timeline. The full allow-list lives in [`@wdio/devtools-core/action-mapping.ts`](https://github.com/webdriverio/devtools/blob/main/packages/core/src/action-mapping.ts).

## Output format — `traceFormat`

```ts
{
  mode: 'trace',
  traceFormat: 'zip' | 'ndjson-directory'  // default: 'zip'
}
```

- **`zip`** (default) — single archive at `test-results/trace-<sessionId>.zip`.
- **`ndjson-directory`** — same files unpacked into `test-results/trace-<sessionId>/`. One less unzip step for scripted or agentic consumers that want to grep / stream the NDJSON directly.

Both formats open in the first-party [`show-trace` player](/docs/devtools/trace-player) and in other compatible trace viewers.

## Trace granularity — `traceGranularity`

How many trace artifacts a run produces:

```ts
{
  mode: 'trace',
  traceGranularity: 'session' | 'spec' | 'test' // default: 'session'
}
```

| Value | Output |
|---|---|
| `session` (default) | One trace per worker/session — `test-results/trace-<sessionId>.zip`. |
| `spec` | One trace per spec file. Smaller, easier to navigate. |
| `test` | One trace **per test**, each in its own folder: `test-results/<spec>-<title>-<browser>[-retry<N>]/trace.zip`. |

For `test` granularity the folder name is built from the spec basename, a slug of the test title, the browser, and a `-retry<N>` suffix on retried attempts — e.g. `test-results/login_e2e-logs-in-chrome/trace.zip`, with a first retry at `test-results/login_e2e-logs-in-chrome-retry1/trace.zip`. Per-test traces are the most navigable and pair best with a retention policy so only the traces you care about are written.

## Retention — `tracePolicy`

By default every trace is kept (`'on'`). To keep only the interesting ones — ideal with `traceGranularity: 'test'`:

```ts
{
  mode: 'trace',
  traceGranularity: 'test',
  tracePolicy: 'retain-on-failure' // default: 'on'
}
```

| Policy | Keeps the trace when… |
|---|---|
| `'on'` (default) | Always — every trace is written. |
| `'retain-on-failure'` | The test's **final** attempt failed. A fail-then-pass retry sequence ends `passed`, so it is *not* kept — you don't over-retain a flake that eventually went green. |
| `'retain-on-first-failure'` | **Attempt 0** failed, regardless of whether a later retry passed. |
| `'on-first-retry'` | The test was retried at least once (an attempt 1 exists). |
| `'on-all-retries'` | Any retried attempt (attempt ≥ 1) exists. |
| `'retain-on-failure-and-retries'` | The final attempt failed **or** the test was retried. |

A non-retained slice is decided against and never written to disk. The retry-aware policies key on a per-attempt **outcome ledger** the adapter keeps per retry-stable test id, so `retain-on-failure` and `retain-on-first-failure` evaluate the right attempt. Where a runner doesn't expose per-attempt retry information, every policy except `retain-on-failure` degrades to `retain-on-failure`; a run with no observed outcomes (e.g. a plain standalone script) fails **open** and keeps the trace rather than risk dropping one you need.

> Retry-aware retention is verified end-to-end for **WebdriverIO** (mocha / cucumber) and **Selenium** (mocha). For **Nightwatch**, `retain-on-failure` works, but the other retry-aware policies degrade to it because Nightwatch's `--retries` re-runs a testcase internally without re-firing the per-test hooks. WDIO's cross-process `specFileRetries` also falls outside the (per-worker) ledger. See the [Nightwatch adapter page](/docs/devtools/nightwatch#trace-mode) for the specifics.

## Dense filmstrip — `filmstrip`

**By default** the trace records a **dense, continuous** screencast so the player scrubs smooth playback rather than jumping frame-to-frame. The dense frames sit alongside the per-action frames (which carry the DOM snapshots). Set `filmstrip: false` to record only one frame per action — a smaller trace with no continuous recorder:

```ts
{
  mode: 'trace',
  filmstrip: false // opt out — one frame per action (default is true)
}
```

- Dense frames are added **alongside** the per-action frames (which carry the DOM snapshots), so no DOM data is lost — when dense frames are present they supersede the sparse per-action filmstrip for scrubbing.
- Frames are thinned at export (≥100 ms apart) and content-addressed, so identical frames (a static wait) collapse to one resource. The live session buffer is bounded by `screencast.maxBufferFrames` (default 2000).
- Recording uses the screencast recorder — CDP push on Chrome/Chromium, screenshot polling elsewhere. On non-Chrome browsers the polling issues many `takeScreenshot` commands; pair with your reporter's step-silencing option (see [Allure Integration](/docs/devtools/allure)).

`filmstrip` is available on all three adapters (WebdriverIO / Selenium / Nightwatch).

## Per-test screenshot & video — `screenshot` / `video`

At `traceGranularity: 'test'` each test can also produce a standalone screenshot and/or a per-test video slice, mirroring the familiar screenshot/video-on-failure ergonomics:

```ts
{
  mode: 'trace',
  traceGranularity: 'test',
  screenshot: 'only-on-failure', // 'off' (default) | 'on' | 'only-on-failure'
  video: 'retain-on-failure'     // 'off' (default) | any tracePolicy value
}
```

| Option | Values | Behavior |
|---|---|---|
| `screenshot` | `'off'` (default) · `'on'` · `'only-on-failure'` | `'on'` captures after every test; `'only-on-failure'` only after a failing test. PNG. |
| `video` | `'off'` (default) · any `tracePolicy` value | Records the screencast continuously and keeps each test's slice per the same retention semantics as `tracePolicy`. WebM. Setting a non-`off` value starts the recorder on its own — you don't also need `filmstrip` or `screencast.enabled`. |

Both are gated to trace mode + `traceGranularity: 'test'` (the per-test scope these attach to). At coarser granularities they no-op.

- **WebdriverIO** — `screenshot` / `video` are service options; attached inline to Allure when `@wdio/allure-reporter` is present.
- **Selenium** — same options on its `DevToolsOptions`; attached inline to Allure via `allure-js-commons` when an Allure runner adapter is active.
- **Nightwatch** — **produce-only**: the files are written to the trace output dir (and listed in the manifest), but not attached inline to Allure — Nightwatch has no live Allure attach API. See [Trace Mode Limitations](/docs/devtools/limitations).

> `screencast.enabled` is the separate **live-mode** continuous `.webm` recording and is ignored in trace mode. In trace mode use `filmstrip` (dense frames into the trace) or per-test `video`; the screencast tuning fields (`quality`, `maxWidth`, `pollIntervalMs`, …) still apply to whichever recorder runs.

## Artifacts manifest — `emitArtifactsManifest`

Writes a `devtools-artifacts-<sessionId>.json` next to the trace — a generic index that reporters and CI consume to discover the produced artifacts (every trace / screenshot / video, plus each test's state):

```ts
{
  mode: 'trace',
  emitArtifactsManifest: true // default: off; auto-on when Allure is detected
}
```

- **Off by default.** It **auto-enables** when an Allure reporter is detected — WebdriverIO's `@wdio/allure-reporter` in the config, or an active Selenium `allure-js-commons` runtime.
- **Nightwatch is opt-in**: it has no live Allure signal to auto-detect against (`nightwatch-allure` is post-hoc), so it never auto-enables — set it explicitly if you want the manifest.

## Assertions — `captureAssertions`

Assertions surface as first-class action rows in the trace (on by default; set `captureAssertions: false` to opt out):

- **`node:assert`** — captured across all three adapters as `assert.<method>` rows.
- **WebdriverIO `expect`** — passing *and* failing `expect(...)` matchers (`expect($el).toHaveText(...)`, `toBeExisting()`, …) appear as `expect.<matcher>` rows carrying the expected value, the element's source location, and a snapshot; the matcher's internal polling commands are suppressed so only the assertion shows.
- **Nightwatch `browser.assert.*` / `browser.verify.*`** — native assertions surface as `assert.<m>` / `verify.<m>` rows.

Passing assertions render green; failing ones render red with the error message.

## Mobile testing

Trace mode detects mobile sessions via `platformName: 'android' | 'ios'` (case-insensitive) and adjusts:

- **Mobile web** (Chrome on Android, Safari on iOS): same DOM-based snapshot pipeline as desktop.
- **Native mobile**: the page-injected DOM scripts are guarded off; `getPageSource()` is used to grab the Appium XML tree, which feeds the snapshot serializer instead.

The trace's `context-options` records `title: 'android — <deviceName>'` / `'ios — <deviceName>'` so the viewer labels frames correctly. A reference WDIO config for Android Chrome via Appium ships at [`examples/wdio/wdio.mobile.conf.ts`](https://github.com/webdriverio/devtools/blob/main/examples/wdio/wdio.mobile.conf.ts).

## Viewing the artifact

Open a trace in the first-party **[Trace Player](/docs/devtools/trace-player)** — the WebdriverIO DevTools UI in a dedicated read-only player mode:

```sh
show-trace trace-<sessionId>.zip          # bin on PATH after install
npx show-trace trace-<sessionId>.zip      # or via npx
```

The player gives you DOM time-travel, the A11y tab and pick-locator overlay, the Transcript tab with Copy-for-LLM, the Errors / Console / Network / Source dock tabs, and a scrubbable timeline. The same portable `.zip` also opens in other standalone trace viewers and inside an Allure report's embedded viewer. See the **[Trace Player](/docs/devtools/trace-player)** page for the full walkthrough, features, and keyboard shortcuts.

## Learn more

- **[Trace Player](/docs/devtools/trace-player)** — the full `show-trace` player walkthrough, features, and keyboard shortcuts.
- **[Allure Integration](/docs/devtools/allure)** — how trace / screenshot / video artifacts attach to an Allure report.
- **[Cross-Framework Support](/docs/devtools/cross-framework)** — the per-adapter capability matrix (WebdriverIO / Selenium / Nightwatch).
- **[Trace Mode Limitations](/docs/devtools/limitations)** — what trace mode skips and the known per-adapter gaps.
- **[Configuration Reference](/docs/devtools/reference)** — every option at a glance.
