---
id: dashboard
title: The Dashboard
description: "Watch test runs live in the DevTools dashboard, rerun single tests or suites, and configure the dashboard window and backend."
---

Live mode opens the DevTools UI in an external browser window and streams your test run in real time. It's the interactive counterpart to [Trace Mode](/docs/devtools/wdio/trace-mode), which skips the UI and writes a portable offline artifact instead. Live mode is enabled by default (`mode: 'live'`), so simply running your WebdriverIO tests launches the dashboard.

When you run your tests, the DevTools UI automatically opens in an external browser window and tests begin executing immediately with real-time visualization. After the initial run completes, use the play buttons to rerun individual tests or suites, and the stop button to terminate running tests at any time.

## What the dashboard shows

- **Live browser preview** — watch the browser under test as commands execute.
- **Test progress** — suites and tests update as they run.
- **Command execution** — each action streams in as it happens. A wait appears as soon as it starts, as one row with the commands its condition issues nested under it; see [Waits](/docs/devtools/wdio/trace-mode#waits).
- **Workbench tabs** — Actions and Metadata, plus Source, Log, Console, Network and Errors (each badged with a count), and Compare after a [Preserve & Rerun](/docs/devtools/wdio/preserve-and-rerun).

## Live-mode features

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** — Real-time browser previews with test rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** — Snapshot a failing test, rerun it, and diff the two runs side-by-side
- **[Console Logs](/docs/devtools/wdio/console-logs)** — Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** — Monitor API calls and network activity
- **[Metadata](/docs/devtools/wdio/metadata)** — Session capabilities, environment, and timing per browser session
- **[TestLens](/docs/devtools/wdio/testlens)** — Navigate to source code with intelligent code navigation
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** — Works with Mocha, Jasmine, and Cucumber
- **[Session Screencast](/docs/devtools/wdio/screencast)** — Automatic video recording of browser sessions

## Password masking

The page a run replays never shows what was typed into a password field, in the live dashboard and in a trace alike, on every adapter. The page collector replaces the value of every `<input type="password">` with `••••`, a fixed placeholder that hides the password's length, before it leaves the browser: in the recorded DOM, the field-state records and every `value` attribute mutation, keystroke by keystroke. A field a show-password toggle turned into a text input stays masked. An empty field stays empty, and every other field (text, email, search, textareas, editable regions) is recorded as typed.

Command rows are not masked. The Actions list, the Log tab, the trace's action titles and `transcript.md` show the real text a `setValue` / `sendKeys` / `send_keys` typed, password included, so a failing step can be read as it ran.

Two options control it, on every JavaScript adapter:

```ts
{
  maskInputs: true,                    // default; false records password fields as typed
  maskSelectors: ['.account-number']   // default []; also mask whatever these selectors match
}
```

- **`maskSelectors`** masks more of the replayed page: the text, the value and the `aria-label`, `title`, `alt` and `placeholder` attributes of every element a CSS selector matches, and of everything inside it, password or not (an account number, an address). The A11y tab names such an element `••••`, an ancestor's name reads `••••` where the masked text sat, and neither the A11y tab nor the element list locates either by its text.
- **`maskInputs: false`** turns the password masking off; selectors given in `maskSelectors` still apply.

The Python adapter takes the same settings; command line first, then the ini file, then the environment:

| Setting | `enable()` | pytest flag | ini | Environment |
|---|---|---|---|---|
| Turn password masking off | `mask_inputs=False` | `--devtools-no-mask-inputs` | `devtools_mask_inputs = false` | `DEVTOOLS_MASK_INPUTS=0` |
| Also mask elements by CSS selector | `mask_selectors=[".account-number"]` | `--devtools-mask-selector .account-number` (repeatable) | `devtools_mask_selectors` (one per line) | `DEVTOOLS_MASK_SELECTORS=.a,.b` |

### What masking does not cover

Masking only changes the replayed page. Treat a trace as being as sensitive as the run that produced it:

- **Command rows.** A typed password is in the row that typed it, the trace's action events and `transcript.md`, and in a value read back or an assertion that compares it.
- **Test source.** A credential written as a literal in the test file appears in the Source tab and the suite tree.
- **Pixels.** Screenshots, the screencast and the filmstrip show the page as the browser painted it (a password field paints dots).
- **Everything outside the DOM.** Console lines, request and response bodies (a login POST) and errors carry whatever the page or the test put there.
- **Text the page displays by itself**, unless a `maskSelectors` entry covers it. Under a selector, attributes other than `value`, `aria-label`, `title`, `alt` and `placeholder` (`data-*`, `href`, ...) replay as written.
- **A password field the collector never saw as one.** A field the page creates as `type="password"` and turns into a text field before the collector reads it is recorded as typed.
- **A policy changed mid-run.** Selenium's `DevTools.configure()` called after a driver was built keeps the policy that driver's collector was registered with until the next session.
- **Native apps.** A native session has no DOM to mask.

## Configuring the dashboard window

The `port`, `hostname`, and `devtoolsCapabilities` options control the DevTools UI server and the window it opens in. See the [Configuration Reference](/docs/devtools/reference) for details.

## Running the backend on its own

The adapters start the dashboard server in-process, so you normally never touch it. It also ships as a standalone binary, which is what you want when the dashboard should outlive a single run - or when the tests are not JavaScript, as with the Python adapter (see the [Selenium](/docs/devtools/selenium) page).

```bash
npx @wdio/devtools-backend
```

```
Usage: devtools-backend [options]

Options:
  --port <number>     Preferred port; a free one is chosen if it is taken
  --hostname <host>   Host to bind (default: localhost)
  -h, --help          Show this message
```

Both `--port 8080` and `--port=8080` forms are accepted. `--port` is a *preference*, not a promise: if that port is taken the server binds a free one instead of failing. It prints the port it actually bound, which is the line to read rather than the one you asked for:

```
devtools-backend listening at http://localhost:3000
```

The Python adapter attaches to an already-listening server when `DEVTOOLS_PORT` is set, instead of starting a second one. The JavaScript adapters start their backend in-process; use their `port` option to choose the port.

A second binary, `show-trace`, opens a trace archive in the offline player; the same player also runs as a web page at [trace.webdriver.io](https://trace.webdriver.io). See [Trace Player](/docs/devtools/trace-player).
