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

Both formats open in the first-party `show-trace` player (see [Viewing the artifact](#viewing-the-artifact)) and in other compatible trace viewers.

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

Policies: `'on'` · `'retain-on-failure'` · `'retain-on-first-failure'` · `'on-first-retry'` · `'on-all-retries'` · `'retain-on-failure-and-retries'`. A non-retained slice is decided against and never written to disk. The retry-aware policies need per-attempt retry information; where a runner doesn't expose it they degrade to `retain-on-failure` with a one-time warning.

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

## What trace mode skips

- **DevTools UI window** — no Chrome instance opens for the dashboard.
- **Backend port-bind** — no localhost port is reserved (parity across all three adapters as of v1.2+).
- **`screencast` option** — ignored even if configured. Trace mode embeds per-action JPEG frames inside the archive; the live-mode continuous `.webm` is a separate feature. A warning is logged: `trace mode: ignoring screencast option (live-mode feature)`.
- **`wdio-trace-<sessionId>.json` dump** — removed entirely. The legacy monolithic JSON the WDIO live mode used to write is gone; live mode now streams to the dashboard and writes nothing to disk, and the `trace.zip` is the single trace artifact.

## Viewing the artifact

### `show-trace` — the first-party player

Open a trace in the WebdriverIO DevTools UI itself:

```sh
show-trace trace-<sessionId>.zip          # bin on PATH after install
npx show-trace trace-<sessionId>.zip      # or via npx
pnpm show-trace trace-<sessionId>.zip     # from the devtools monorepo
```

The `show-trace` bin ships with each adapter (`@wdio/devtools-service`, `@wdio/nightwatch-devtools`, `@wdio/selenium-devtools`), so it's available in any project that installs one — no extra dependency. It boots the same DevTools UI in a dedicated **player** mode and opens it in your browser:

- **Action list** (left) with the captured commands.
- **Browser pane** showing the per-action page snapshot.
- **Timeline** along the bottom — a screenshot filmstrip plus Actions / Network / Console tracks, a draggable playhead, and playback controls (play/pause, step, speed). Click a **Network** bar to open the request detail (headers, timing, status).
- **Keyboard shortcuts** — `Space` play/pause, `←`/`→` step between actions, `Home`/`End` jump to first/last, `,`/`.` change speed, `/` focus filter, `?` show all shortcuts.

> Accepts a `.zip` only. The same shortcuts work in the live dashboard (`←`/`→` walk the command list, `?` shows help).

### Other trace viewers

Because the artifact is a portable NDJSON schema, the same `.zip` (or directory) also opens in other compatible trace viewers, which render:
- Timeline of actions with timings
- Per-action screenshots
- Element snapshots
- Network waterfall
- Console events

For LLM / agent consumption, read `transcript.md` directly — it's a tight Markdown rendering of the actions with selectors and values.

The trace pipeline (action-mapping, snapshot serializers, NDJSON writer, zip / directory writer) is shared across adapters via [`@wdio/devtools-core`](https://github.com/webdriverio/devtools/tree/main/packages/core), so the artifact shape is identical no matter which adapter produced it.
