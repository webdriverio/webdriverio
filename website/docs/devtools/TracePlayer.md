---
id: trace-player
title: Trace Player
description: "Open trace-mode artifacts in the show-trace player or the hosted player at trace.webdriver.io for replay and review, link into them, or load them into other trace viewers."
---

The `show-trace` player opens any trace produced in [Trace Mode](/docs/devtools/wdio/trace-mode) in the WebdriverIO DevTools UI itself — a dedicated, read-only **player** mode for offline replay, review, and AI-agent diffing.

The same player also runs as a web page at [trace.webdriver.io](https://trace.webdriver.io), with nothing to install; see [Hosted player](#hosted-player).

## Demo

![Trace Player Demo](/img/devtools/trace-player.gif)

## `show-trace` — the first-party player

Open a trace in the DevTools UI:

```sh
show-trace trace-<sessionId>.zip          # bin on PATH after install
npx show-trace trace-<sessionId>.zip      # or via npx
pnpm show-trace trace-<sessionId>.zip     # from the devtools monorepo
npx show-trace test-results/              # a folder of per-test zips opens as a list of tests
```

The `show-trace` bin ships with each adapter (`@wdio/devtools-service`, `@wdio/nightwatch-devtools`, `@wdio/selenium-devtools`), so it's available in any project that installs one, with no extra dependency. It is also a bin of `@wdio/devtools-backend` itself, so a project without a JavaScript adapter (for example a Python one) can run `npx -p @wdio/devtools-backend show-trace <trace.zip>`. It boots the same DevTools UI in a dedicated **player** mode and opens it in your browser:

- **Action list** (left) — the captured commands, with a **Metadata** tab alongside. A wait is one row with the commands its condition issued nested under it, collapsed unless the wait failed or holds the selected row; see [Waits](/docs/devtools/wdio/trace-mode#waits).
- **Browser pane** (centre) — the reconstructed page for the selected action (see [DOM time-travel](#trace-player-features) below). When the trace carries a filmstrip/video, a **Snapshot / Screencast** toggle switches to the recorded video.
- **Timeline strip** (top) — a filmstrip of thumbnails at their wall-clock positions plus a scrub bar with a draggable playhead. Click a thumbnail or drag anywhere to seek.
- **Controls bar** — play/pause, step, and speed.
- **Dock tabs** (bottom) — **Source**, **Log**, **Console**, **Network**, **Errors** (each badged with its count), plus the player-only **A11y** and **Transcript** tabs. Click a **Network** row for the request detail (headers, timing, status).
- **Keyboard shortcuts** — `Space` play/pause, `←`/`→` step between actions, `Home`/`End` jump to first/last, `,`/`.` change speed, `/` focus filter, `?` show all shortcuts.

> Accepts `.zip` files, or folders searched for them; zip an `ndjson-directory` trace first, or open it in another compatible viewer. The same shortcuts work in the live dashboard (`←`/`→` walk the command list, `?` shows help).

### Opening a whole run

With [`traceGranularity: 'test'`](/docs/devtools/wdio/trace-mode#trace-granularity--tracegranularity) every test writes its own `trace.zip`, so a run is a folder of them. Give `show-trace` the folder, or several zips, and the player lists every trace beside the timeline: one row per test with its outcome, failures first and then in the order they ran. Picking a row plays that trace without reloading (`↑`/`↓` move between rows, `Enter` opens one).

```sh
npx show-trace test-results/                     # every zip under the folder, subfolders included
npx show-trace a/trace.zip b/trace.zip           # several zips
```

- Each zip is read once, as the list fills in, and kept for when it is picked.
- Anything in the folder that is not a `.zip` (screenshots, videos, the artifacts manifest) is skipped. A zip that cannot be opened stays in the list with the reason, and the rest open normally.
- A zip records no test state, so the outcome is read from the trace itself: **failed** when an action or step in it failed, **passed** when it holds actions and none failed, **unknown** when it holds none. An assertion library that records no row (a jest `expect`, chai) can fail a test whose trace still reads as passed.
- One zip opens exactly as before, with no list.

### Opening a trace someone else recorded

A replayed trace runs no script. The page a trace recorded is rendered in a sandboxed frame, and its scripts, inline event handlers, `srcdoc` and `javascript:` URLs are dropped on every update, in `show-trace` and the live dashboard alike, so a trace from someone else can be opened safely. Its stylesheets and fonts replay from the trace when it stored them (`traceResources`, on by default); its images, and stylesheets a trace did not store, still load from the site under test.

Opening a trace is still opening a recording of that run: it holds everything the run showed or typed (see [Trace Mode Limitations](/docs/devtools/limitations)).

### Trace player features

Beyond static frame stepping, the player reconstructs and cross-references the run:

- **DOM time-travel** — the browser pane replays the captured DOM-mutation stream (and form field-state — input `value`, checkbox `checked`, including fields cleared back to empty) to rebuild the *real* DOM as of the selected action's time, not just a screenshot. Points that carry no captured frame (assertions, static waits) still show the true page state.
- **Stored stylesheets and fonts**: the replayed page renders with the stylesheets and fonts the run used, served from the archive rather than the site under test, so it renders the same after the site changes and for a site you cannot reach. Images still load from the site. See [`traceResources`](/docs/devtools/wdio/trace-mode#stylesheets-and-fonts-traceresources).
- **A11y tab + element overlay ("pick locator")** — the **A11y** tab shows the accessibility tree (roles + accessible names) captured for the selected command. Toggle the element overlay in the browser chrome to outline every element the test interacted with; **hover** a box to highlight its row in the A11y tree, **click** to copy a resilient locator. Locators are written in the recording runner's dialect: `a*=Logout` under WebdriverIO, `//a[contains(., "Logout")]` with a `By.xpath()` caption under Selenium, and plain CSS under Nightwatch with an XPath fallback. On a native Appium session they read as `android=new UiSelector()…` or `-ios predicate string:…`. The link is bidirectional — hovering a tree row highlights the element back in the snapshot.
- **Transcript tab + Copy-for-LLM** — the **Transcript** tab renders the run's `transcript.md` (a human/LLM-readable summary in execution order). A one-click **Copy** bundles the transcript with any failing-command errors as paste-ready context for an LLM.
- **Timeline input markers** — each action is marked on the scrub bar by kind: keyboard actions as a green bar, pointer actions (which carry a hit point) as a blue dot, others as a plain tick — so you can read the interaction rhythm at a glance.
- **Cucumber nesting** — Cucumber runs nest under their scenario in the action tree. Depth varies by adapter (Selenium nests Feature → Scenario → Step, WebdriverIO Scenario → Step, Nightwatch Feature → Scenario); see [Cross-Framework Support](/docs/devtools/cross-framework).
- **Dense filmstrip scrubbing** — with [`filmstrip`](/docs/devtools/wdio/trace-mode#dense-filmstrip--filmstrip) enabled, the timeline packs the dense frames for smooth scrubbing instead of one-frame-per-action jumps.
- **Stored stylesheets and fonts**: the replayed page renders with the stylesheets and fonts the run used, served from the archive rather than the site under test, so it renders the same after the site changes, for a site the viewer cannot reach, and from an `https` page replaying an `http` site. Images still load from the site. The `traceResources` adapter option decides what a trace stores: `'styles'` (the default) stores stylesheets and fonts, `'none'` stores nothing.

## Hosted player

[trace.webdriver.io](https://trace.webdriver.io) is the same player as a web page, for opening a trace without installing anything. Pick one or several `.zip` files with its Open button, or drop zips or a folder of them on the page; several zips open as a run, listed by test, as they do in `show-trace`. A browser's file dialog picks files or folders, never both, so drop a folder rather than picking it.

- **Nothing is uploaded.** The archive is parsed in the browser tab and sent nowhere, which matters because a trace records everything the run showed or typed.
- **Read-only.** Run controls are absent, as in `show-trace`.
- **Untrusted traces are safe to open.** A trace from someone else runs no script: its replayed page is rendered without any of its scripts, in the hosted player as in `show-trace` and the live dashboard.
- **Styles come from the archive.** A replayed page takes its stylesheets and fonts from the trace and loads its images from the site under test, as in `show-trace`. From an `https` page the browser blocks `http` images, and any stylesheet the trace did not store, so a trace of an `http` site written with `traceResources: 'none'` can render unstyled in the hosted player and fully in `show-trace`.

### Opening a trace from a URL

Add `?trace=<url>` to download a zip and open it, so a CI job or a bug report can link straight to a trace:

```text
https://trace.webdriver.io/?trace=https%3A%2F%2Fci.example.com%2Fartifacts%2Ftrace.zip
```

- The URL must be `https`, or a path on the player's own origin.
- Its host must send an `Access-Control-Allow-Origin` header that admits the player (`*` or `https://trace.webdriver.io`). Without it the browser refuses the download and the player says so.
- The request carries no cookies, credentials or referrer, so a private artifact needs a URL that is its own credential, such as a pre-signed link. The player names a download by its host and path only, never its query.
- A URL with its own query, such as a signed link, can be pasted as it is when `trace` is the last parameter: everything after `trace=` is then taken as the URL, `&` parameters included. Anywhere else, percent-encode it; an encoded URL ends at the first raw `&`, so other parameters can follow it.
- An empty `trace=` is refused, as is a zip over 512 MB (opening one takes a few times its size in memory) and a body that does not start as a zip. A host that sends nothing for 30 seconds is given up on.

The downloaded zip is then parsed in the tab like a picked file and sent nowhere.

## Links

The part of the address after `#` names a position in the trace, in the hosted player and in `show-trace` alike:

```text
https://trace.webdriver.io/?trace=https%3A%2F%2Fci.example.com%2Fartifacts%2Ftrace.zip#action=call@12&tab=network
```

- `action=<callId>` opens the trace on that action, by its `callId` in the zip (`call@12`, stable for the life of the zip).
- `tab=<tab>` opens that bottom tab: `source`, `log`, `console`, `network`, `errors`, `a11y` or `transcript`.

The player rewrites the address as you pick actions and tabs, without adding history entries, so the address bar always links to what you are looking at; copy it to share that view. A link applies to the trace the page opened with, and again whenever you edit the part after `#` yourself. Opening another trace by hand clears the link and the `?trace=` URL, since the address no longer names what is on screen. An action or tab the trace does not have is ignored. When several traces are open as a run, the link carries the tab only, since it names no entry of the run.

Opening a trace keeps the bottom tab you last had open rather than switching to **Log**; a link's `tab=` takes precedence. Picking an action then shows its detail in **Log**.

## Other trace viewers

Because the artifact uses a portable, standard trace-viewer on-disk format, the same `.zip` (or directory) also opens in compatible **standalone trace viewers**, and — sharing that format — inside an **Allure report's embedded trace viewer** (Allure ≥ 2.35). They render:
- Timeline of actions with timings
- Per-action screenshots
- Element snapshots
- Network waterfall
- Console events

For LLM / agent consumption, read `transcript.md` directly — it's a tight Markdown rendering of the actions with selectors and values.

The trace pipeline (action-mapping, snapshot serializers, NDJSON writer, zip / directory writer) is shared across adapters via [`@wdio/devtools-trace`](https://github.com/webdriverio/devtools/tree/main/packages/trace), so the artifact shape is identical no matter which adapter produced it — see [Cross-Framework Support](/docs/devtools/cross-framework).
