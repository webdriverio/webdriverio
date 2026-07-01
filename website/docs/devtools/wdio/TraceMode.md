---
id: trace-mode
title: Trace Mode
---

Headless capture path — no DevTools UI window opens. At session end the adapter writes a `trace-<sessionId>.zip` (or `trace-<sessionId>/` directory) next to your spec / config file. The artifact is portable and ships everything needed for offline replay, AI-agent diffing, or any consumer that prefers a file over a live UI.

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

- **`zip`** (default) — single archive at `trace-<sessionId>.zip`.
- **`ndjson-directory`** — same files unpacked into `trace-<sessionId>/`. One less unzip step for scripted or agentic consumers that want to grep / stream the NDJSON directly.

Both formats open in the first-party `show-trace` player (see [Viewing the artifact](#viewing-the-artifact)) and in `npx playwright show-trace <path>`.

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

### `playwright show-trace`

Because the format is a Playwright-compatible NDJSON schema, the same artifact also opens in the Playwright trace viewer:

```sh
# Either a .zip or a directory works
npx playwright show-trace trace-<sessionId>.zip
npx playwright show-trace trace-<sessionId>/
```

The Playwright trace viewer renders:
- Timeline of actions with timings
- Per-action screenshots
- Element snapshots
- Network waterfall
- Console events

For LLM / agent consumption, read `transcript.md` directly — it's a tight Markdown rendering of the actions with selectors and values.

The trace pipeline (action-mapping, snapshot serializers, NDJSON writer, zip / directory writer) is shared across adapters via [`@wdio/devtools-core`](https://github.com/webdriverio/devtools/tree/main/packages/core), so the artifact shape is identical no matter which adapter produced it.
