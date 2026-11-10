---
id: trace-mode
title: Trace Mode
description: "Capture headless trace artifacts with DevTools trace mode and configure format, granularity, retention, screenshots, video and assertions."
---

Headless capture path — no DevTools UI window opens. At session end the adapter writes trace artifacts into a `test-results/` folder: under WebdriverIO's `outputDir` (or `rootDir`), and for Selenium and Nightwatch next to the test file, falling back to the config directory, then the current directory. For `session` / `spec` granularity that's a `trace-<sessionId>.zip` (or a `trace-<sessionId>/` directory); for `test` granularity each test gets its own subfolder (see [Trace granularity](#trace-granularity--tracegranularity)). The artifact is portable and ships everything needed for offline replay, AI-agent diffing, or any consumer that prefers a file over a live UI.

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

Trace mode needs WebDriver BiDi (Chrome 114+, Firefox 130+), which WebdriverIO enables automatically.

When a worker finishes, the WebdriverIO service prints the path of every trace it kept, whatever the `logLevel`:

```text
DevTools trace saved to /path/to/project/test-results/trace-<sessionId>.zip
```

A trace that a [`tracePolicy`](#retention--tracepolicy) decided against is not written and not printed.

To try it, run the mocha example in trace mode with `DEVTOOLS_MODE=trace pnpm demo:wdio:mocha`; add `DEVTOOLS_TRACE_GRANULARITY=test DEVTOOLS_TRACE_POLICY=retain-on-failure` for per-test retention. The config is [`examples/wdio/mocha/wdio.conf.ts`](https://github.com/webdriverio/devtools/blob/main/examples/wdio/mocha/wdio.conf.ts).

Selenium and Nightwatch ship the same trace pipeline — see their adapter pages for framework-specific enable syntax: [Selenium](/docs/devtools/selenium#trace-mode) · [Nightwatch](/docs/devtools/nightwatch#trace-mode).

## What's inside the artifact

| File | Contents |
|---|---|
| `trace.trace` | NDJSON `context-options` + `before` / `after` action events; one line per record. Also one `frame-snapshot` event per action for viewers that render a page per action: a page holding that action's screenshot, which its `resourceOverrides` maps to the file under `resources/` rather than storing the image a second time |
| `trace.network` | HAR-style network entries, one per line; an entry read from the page's Resource Timing buffer (no BiDi, e.g. Safari or Appium) carries `_source: "resource-timing"` and `_resourceType` |
| `trace.mutations` | NDJSON DOM mutation stream behind DOM time-travel; omitted when nothing was captured |
| `transcript.md` | Human/LLM-readable Markdown summary with timing, selectors, value annotations |
| `resources/page@<id>-<ts>.png` (or `.jpeg`) | Screenshot taken at each user-facing action, named by its actual image format |
| `resources/page@<id>-<ts>-elements.json` | Flat list of interactable elements at that action |
| `resources/page@<id>-<ts>-snapshot.txt` | Depth-indented accessibility-tree snapshot (AI-friendly) |
| `resources/<sha1>.png` (or `.jpeg`) | Dense filmstrip frames, content-addressed, named by their actual image format |
| `resources/src@<sha1>.txt` | Captured test source for the Source tab |
| `resources/<sha1>` | Network response bodies, and the stylesheets and fonts the pages used (see [`traceResources`](#stylesheets-and-fonts-traceresources)), content-addressed |
| `page-resources.ndjson` | Index of the stored stylesheets and fonts, one line per URL; omitted when nothing was stored |

### What counts as an "action"

Commands are filtered through an allow-list before they produce trace entries. Examples that land in the trace:

- `url` / `get` → `Page.navigate`
- `click` → `Element.click`
- `setValue` / `sendKeys` → `Element.fill`
- `submit`, `clear`, `selectByVisibleText`, …

Locator resolution (`$`, `$$`, `findElement(s)`), Selenium's `executeScript` polling and the `clearValue` that `setValue` fires internally are deliberately excluded: they don't represent user-facing intent and would noise up the timeline. Explicit waits (`waitFor*`, `waitUntil`, Nightwatch `waitForElement*`, Selenium `driver.wait`, Python `WebDriverWait`; see [Waits](#waits)), element reads (`getText`, `isDisplayed`, …), page reads such as `getTitle`, and `execute` do appear. The allow-list is `ACTION_MAP` in [`packages/shared/src/trace-actions.ts`](https://github.com/webdriverio/devtools/blob/main/packages/shared/src/trace-actions.ts).

### Which actions capture the page

A trace-mode action row carries a capture of the page: a screenshot, the accessibility tree and element list, plus the page source on a native app. Each capture costs page reads through the driver, so the JavaScript adapters take one only for commands that can change the page. Reads and waits (`getText`, `isDisplayed`, `waitForDisplayed`, …) and assertions take none: their rows still appear in the trace and show the capture of the last command that took one. The first traced command of each test is captured even when it is a read, so a test that starts by reading has a frame to show (on Nightwatch's `describe`/`it` interface, the first command of each module).

Selenium and Nightwatch capture every other command, including ones that can navigate without being in the allow-list (`executeScript`, `actions`, Nightwatch `submitForm`), and take one more capture at a test's end when reads follow its last capture, so reads after a click that navigates show the page the click led to.

### Waits

A wait the test wrote is one row, named after what it waited for: `Element.waitForExist` on its selector for a wait on an element locator, `Element.waitForDisplayed` for a wait on an element's visibility, and `Browser.waitForFunction` for a wait on any other condition. The row appears as soon as the wait starts and is updated when it ends, so the live dashboard shows a long wait as running rather than listing it only once it is over. A wait that times out is a failed row carrying the timeout, in the Actions list, the Errors tab and the trace.

The commands the wait's condition issued nest under its row, one row per distinct call rather than one per poll, in the live dashboard and the trace player alike. They are collapsed by default, and open by themselves when the wait failed or holds the selected row. The chevron beside a wait is a button of its own, so the keyboard reaches it (`Enter` or `Space` expands or collapses it) while `Enter` on the row still selects the wait. A wait started inside another wait's condition nests under that wait.

A command under a wait that failed before the wait passed, such as a `getText` on an element that appears a moment later, is a poll the wait retried past, not a failure: it shows neutral with its error in a tooltip, does not open the wait, and is left out of the Errors tab, the copied failures and the trace's errors. Under a wait that timed out, the same commands keep their errors, since the last poll is what explains the timeout.

What each adapter shows:

| Adapter | Waits | Nested under the wait |
|---|---|---|
| WebdriverIO | `waitUntil` and the `waitFor*` family | The commands a `waitUntil` condition issued, and the polls of an element wait (such as `isExisting`). |
| Nightwatch | `waitUntil` and the `waitForElement*` family | The commands a `waitUntil` condition issued. A `waitForElement*` row has no children: Nightwatch polls for the element through its own transport, which the plugin does not see. |
| Selenium (Node.js) | `driver.wait(...)`. `until.elementLocated` is `waitForElementLocated` (`Element.waitForExist`) on its locator, `until.elementIsVisible` is `waitForElementVisible` (`Element.waitForDisplayed`), and any other condition is `wait` (`Browser.waitForFunction`), labelled with the condition's description. | The commands the condition issued. An element wait's `findElement(s)` polls nest in the live dashboard but are left out of the trace, like every locator lookup. |
| Selenium (Python) | `WebDriverWait(...).until(...)` and `until_not(...)`. `EC.presence_of_element_located` is `waitForElementLocated` (`Element.waitForExist`), `EC.visibility_of_element_located` is `waitForElementVisible` (`Element.waitForDisplayed`), and any other condition, every `until_not` included, is `wait` (`Browser.waitForFunction`), labelled with the condition (an `expected_conditions` condition by its name and arguments). | As for Node.js. |

## Output format — `traceFormat`

```ts
{
  mode: 'trace',
  traceFormat: 'zip' | 'ndjson-directory'  // default: 'zip'
}
```

- **`zip`** (default) — single archive at `test-results/trace-<sessionId>.zip`.
- **`ndjson-directory`** — same files unpacked into `test-results/trace-<sessionId>/`. One less unzip step for scripted or agentic consumers that want to grep / stream the NDJSON directly.

The `zip` opens in the first-party [`show-trace` player](/docs/devtools/trace-player) or the [hosted player](/docs/devtools/trace-player#hosted-player) at trace.webdriver.io; an `ndjson-directory` trace opens in other compatible trace viewers, or zip it first to open it in `show-trace`.

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
| `spec` | One trace per spec file, at `test-results/trace-<spec>-<hash>-<sessionId8>.zip`. Smaller, easier to navigate. |
| `test` | One trace **per test**, each in its own folder: `test-results/<spec>-<title>-<browser>[-retry<N>]/trace.zip`. |

For `test` granularity the folder name is built from the spec basename, a slug of the test title, the browser, and a `-retry<N>` suffix on retried attempts — e.g. `test-results/login_e2e-logs-in-chrome/trace.zip`, with a first retry at `test-results/login_e2e-logs-in-chrome-retry1/trace.zip`. Per-test traces are the most navigable and pair best with a retention policy so only the traces you care about are written.

Open the whole run at once with `npx show-trace test-results/`: the player lists every test with its outcome, failures first (see [Opening a whole run](/docs/devtools/trace-player#opening-a-whole-run)).

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

## Stylesheets and fonts: `traceResources`

By default a trace stores the stylesheets and fonts its pages used, and the player replays the page with them from the archive rather than loading them from the site under test. A replayed page therefore renders the same after the site changes, and for a viewer who cannot reach the site. Images still load from the site.

```ts
{
  mode: 'trace',
  traceResources: 'none' // 'styles' (default) | 'none'
}
```

- **`'styles'`** (default) stores the stylesheets and fonts each archive's pages reference, each once by content hash, capped at 1 MiB per resource and 8 MiB per archive. A resource past a cap replays from the site.
- **`'none'`** stores nothing, and the replayed page loads its stylesheets and fonts from the site as it runs.

The page collector reads each resource back from the browser's HTTP cache, cross-origin ones only where the site allows CORS (a same-origin stylesheet it cannot read again falls back to its parsed rules), and the trace leaves those reads out of its network rows. Live mode reads nothing back.

The Python adapter stores them too: turn it off with `--devtools-trace-resources none`, the ini key `devtools_trace_resources = none`, `DEVTOOLS_TRACE_RESOURCES=none`, or `enable(trace_resources="none")`. It needs a backend at least as new as the adapter's pinned version; an older one stores nothing.

What it does not cover:

- Images, media, and stylesheets or fonts from tracking hosts always replay from the site, as does anything past the size caps or a cross-origin stylesheet whose server sends no CORS headers.
- The collector's reads happen in the page under test, so the page can see them: they show up in its own `PerformanceObserver` and Resource Timing buffer, so a real-user-monitoring script may report them, and a service worker answers them like any other fetch.
- A cross-origin read the server refuses for CORS makes the browser log a CORS error in the page console, which the trace records.
- A network row is dropped only when it is certainly a read. A row without the browser's own start time, or one the browser marked as a stylesheet or font load, stays, so a read can occasionally appear as a second row.
- A native app has no document, so nothing is stored.

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
| `video` | `'off'` (default) · any `tracePolicy` value | Records the screencast continuously and keeps each test's slice per the same retention semantics as `tracePolicy`. WebM; encoding needs `ffmpeg` on `PATH`. Setting a non-`off` value starts the recorder on its own — you don't also need `filmstrip` or `screencast.enabled`. |

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

- **`node:assert`** — captured across all three JavaScript adapters as `assert.<method>` rows. The Python adapter captures Python's own `assert` statement the same way; see the Python tab of [Selenium → Assertions](/docs/devtools/selenium#assertions).
- **WebdriverIO `expect`** — passing *and* failing `expect(...)` matchers (`expect($el).toHaveText(...)`, `toBeExisting()`, …) appear as `expect.<matcher>` rows carrying the expected value, the element's source location, and a snapshot; the matcher's internal polling commands are suppressed so only the assertion shows.
- **Nightwatch `browser.assert.*` / `browser.verify.*`** — native assertions surface as `assert.<m>` / `verify.<m>` rows.

Passing assertions render green; failing ones render red with the error message.

An assertion row names the element it is about, so selecting it boxes that element in the snapshot. A `node:assert` call (or a Python `assert`) takes values rather than elements, so its element comes from where the asserted value was read: `assert.equal(await heading.getText(), 'Secure Area')` names `heading`'s selector, and so does a value from any other element read, `getHTML` and `getComputedRole` included. Only a read made earlier in the same test (or Cucumber scenario) counts, and a value read from the page itself rather than from an element, such as the title or the URL, names no element, even when some element's text reads the same: `assert.notEqual(await browser.getTitle(), 'Secure Area')` boxes nothing. WebdriverIO's `browser.getTitle()` is a `Page.getTitle` row of its own, and `expect(browser).toHaveTitle(...)` folds into that read as one `expect.toHaveTitle` row.

## Measuring capture cost

A trace-mode run is slower than a live one because for every captured action the adapter reads the page through the driver: url, title, accessibility tree, element list and a screenshot, plus the page source on a native app. Set `DEVTOOLS_CAPTURE_TIMING=1` on a trace-mode run to see where that time goes:

```sh
DEVTOOLS_CAPTURE_TIMING=1 npx wdio run wdio.conf.ts
```

When the trace is written, the run prints a table to stderr with each read's count, total, median, p95 and max, plus how much of the run's wall time went to capturing, and appends the raw records, one line per capture, to `capture-timing-<pid>.ndjson` beside the trace (one file per worker process). Each record names the command and what triggered the capture: `action` for a user command, `wait-poll` for a command a wait issued, `matcher-poll` for a capture taken while a WebdriverIO `expect` matcher was polling, and `final` for the WebdriverIO capture of the last action's result.

- The JavaScript adapters issue every read of a capture at once and the driver serves them in order, so a read's time from issue to settle includes waiting behind the reads before it. The `svc` columns subtract that wait and give the read's own cost; `process` is the in-process step that turns the reads into a snapshot, and `capture` the whole capture.
- The Python adapter reads one thing at a time and times the screenshot and the two page reads, in the same record format.

The variable only measures: nothing is captured differently, and with it unset nothing is timed or written. It works the same on every adapter.

## Mobile testing

Appium sessions are captured in live and trace mode. The discriminator is the **browser name** in the capabilities, not the device:

- **Mobile web** (Chrome on Android, Safari on iOS): same DOM-based snapshot pipeline as desktop.
- **Native app** (no `browserName`): the page-injected DOM scripts are guarded off; the Appium XML tree feeds the snapshot serializer instead.
- **Hybrid app**: only WebdriverIO follows the session into its webview; the other adapters decide from the startup capabilities.

The trace's `context-options` records the platform, model and OS version so the viewer labels frames correctly. Run the examples with `pnpm demo:wdio:mobile` (also `:selenium:mobile`, `:nightwatch:mobile`, `:python:mobile`). See **[Mobile Testing](/docs/devtools/mobile)** for the full reference.

## Viewing the artifact

Open a trace in the first-party **[Trace Player](/docs/devtools/trace-player)** — the WebdriverIO DevTools UI in a dedicated read-only player mode:

```sh
show-trace trace-<sessionId>.zip          # bin on PATH after install
npx show-trace trace-<sessionId>.zip      # or via npx
npx show-trace test-results/              # every zip under a folder, listed by test
```

The player gives you DOM time-travel, the A11y tab and pick-locator overlay, the Transcript tab with Copy-for-LLM, the Errors / Console / Network / Source dock tabs, and a scrubbable timeline. The same portable `.zip` also opens in other standalone trace viewers and inside an Allure report's embedded viewer. See the **[Trace Player](/docs/devtools/trace-player)** page for the full walkthrough, features, and keyboard shortcuts.

To open a trace without installing anything, or to share a link to one, use the [hosted player](/docs/devtools/trace-player#hosted-player) at [trace.webdriver.io](https://trace.webdriver.io): it parses the zip in your browser tab and uploads nothing, opens a zip from a URL with `?trace=<url>`, and a [link](/docs/devtools/trace-player#links) can name the action and tab to open on.

## Locators in the A11y tab

The `show-trace` bin shipped by each adapter opens the same archive in the DevTools player, which additionally exposes an **A11y tab**: the accessibility tree captured per action, where clicking a row copies that element's locator.

Those locators are written in the recording runner's own dialect, so they paste straight into the framework that produced the trace. An element identified only by its text is `a*=Logout` under WebdriverIO and `//a[contains(., "Logout")]` under Selenium — captioned with the call that resolves it, `By.xpath()`. Nightwatch prefers a native CSS locator such as `button[type="submit"]`, because it is the only runner that reads a bare selector string under a default CSS strategy, and falls back to XPath (captioned `useXpath()` / `locateStrategy: 'xpath'`) only when no unique CSS locator exists. Every other locator is portable CSS.

For LLM / agent consumption, read `transcript.md` directly — it's a tight Markdown rendering of the actions with selectors and values.

## Learn more

- **[Trace Player](/docs/devtools/trace-player)** — the full `show-trace` player walkthrough, features, and keyboard shortcuts.
- **[Allure Integration](/docs/devtools/allure)** — how trace / screenshot / video artifacts attach to an Allure report.
- **[Cross-Framework Support](/docs/devtools/cross-framework)** — the per-adapter capability matrix (WebdriverIO / Selenium / Nightwatch).
- **[Trace Mode Limitations](/docs/devtools/limitations)** — what trace mode skips and the known per-adapter gaps.
- **[Configuration Reference](/docs/devtools/reference)** — every option at a glance.
