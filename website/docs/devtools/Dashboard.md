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

The page a run replays never shows what was typed into a password field, in live and trace mode alike, on all four adapters. The collector replaces the value of every `<input type="password">` with `••••`, a fixed placeholder that hides its length, before it leaves the browser: in the DOM anchor, the field-state records and every `value` attribute mutation, keystroke by keystroke. A field a show-password toggle turned into a text input stays masked. An empty field stays empty, and every other field (text, email, search, textareas, editable regions) is recorded as typed.

The same switch redacts the typed password from rows, network, console and the trace, without listing it: see [Secret redaction](#secret-redaction). The row that typed it reads `setValue("#password", "••••")`.

`maskSelectors` masks more of the replayed page: the text, the value and the `aria-label`, `title`, `alt` and `placeholder` attributes of every element a CSS selector matches, and of everything inside it, password or not (an account number, an address). The A11y tab names such an element `••••`, an ancestor's name reads `••••` where the masked text sat, and neither the A11y tab nor the element list locates either by its text. `maskInputs: false` turns the password masking and the automatic redaction off; selectors given in `maskSelectors` and values listed in `secrets` still apply.

| Option | Values | Default | Description |
|---|---|---|---|
| `maskInputs` | `boolean` | `true` | Mask password fields in the replayed page, and redact what was typed into them and credential header and cookie values from what the adapter sends and writes. `false` records them as typed (a password's live value still stays out of the DOM anchor). |
| `maskSelectors` | `string[]` | `[]` | CSS selectors whose matches have their text and value masked in the replayed page too. |

The Python adapter takes the same options as `enable(mask_inputs=..., mask_selectors=[...])`, `--devtools-no-mask-inputs` / `--devtools-mask-selector`, the `devtools_mask_inputs` / `devtools_mask_selectors` ini keys, or `DEVTOOLS_MASK_INPUTS=0` / `DEVTOOLS_MASK_SELECTORS=".a,.b"`.

**Not covered** by the page masking: text the page displays by itself, unless a `maskSelectors` entry covers it (under a selector, attributes other than `value`, `aria-label`, `title`, `alt` and `placeholder`, such as `data-*` or `href`, replay as written); a field the page creates as `type="password"` and turns into a text field before the collector reads it; a policy changed by Selenium's `configure()` after a driver was built, which applies from the next session; and native apps, which have no DOM. What redaction leaves is listed below.

## Secret redaction

**Passwords and credentials are redacted by default.** Before a test types into an `<input type="password">` (WebdriverIO `setValue` / `addValue`, Selenium `sendKeys`, Nightwatch `setValue` / `setPassword` / `sendKeys` / `updateValue`, Python `send_keys`), the adapter reads the field's type and, for a password field, adds the typed value to the run's redaction set, so the row that types it already carries `••••`, a fixed placeholder that hides its length. From then on the value is replaced in everything the adapter sends or writes: every row, result and error (the Actions list, step titles once re-sent, the Log and Errors sections), `transcript.md` and the trace's action events, console lines and captured stdout, network URLs, headers and bodies, the DOM anchor and every mutation, the element and accessibility captures, the test source, the suite tree and the run's metadata. Independently of any typing, the values of `Authorization`, `Proxy-Authorization`, `Cookie` and `Set-Cookie` are replaced in every network row's `headers`, `requestHeaders` and `responseHeaders` and so in the trace's HAR, keeping the header names; each cookie's value in a navigation row's `cookies` (`document.cookie`) is replaced, keeping its name, and so is the `value` of every cookie object a command returns (`getCookies`). All of this follows `maskInputs`: `maskInputs: false` turns it off with the page masking.

The field-type read is one driver round trip per typing command whose value is 4 characters or more and not already known, taken before the keys are sent. WebdriverIO starts it in `beforeCommand` of the `elementSendKeys` that `setValue` / `addValue` issue (reading the element's `type` property) without holding that hook, and waits for it only before the row is recorded; Selenium awaits `getProperty('type')` on the element before `sendKeys` reaches the driver; Nightwatch queues a `perform` ahead of the typing command that runs one script over the raw WebDriver transport, resolving the selector as a WebDriver find does: its first match, by the call's `using` argument or the definition's `locateStrategy`, else the client's strategy (`useXpath()` / `useCss()` as the test last called them, then the `use_xpath` setting), CSS or XPath only; Python reads `getElementProperty` before `sendKeysToElement` runs. Each read is capped at 2 s and never holds the command back. A read that fails or times out, or a field the adapter cannot locate to read (on Nightwatch, one located by a strategy other than CSS or XPath, or with no selector), counts as a password field: the typed value is redacted, since redacting a value that was not a password is the safer error, and the run logs one warning that names no value. Nightwatch's `setPassword` is taken as a password without a read. In Python a session whose read timed out reads no more, since the abandoned read is still on the session, and what it types afterwards is redacted the same way. A field that answers with no type at all (an element that is not a form control) is not a password field, except on a WebdriverIO Appium mobile-web session, whose direct read cannot tell that answer from a failed one and redacts. Native app sessions skip it on every adapter; on an Appium mobile-web session WebdriverIO reads straight from the driver rather than through `browser`, as its other in-hook probes do.

**`secrets` covers any other value**: an API token, a username, a session id, text typed into a field that is not a password field.

```ts
secrets: ['SuperSecretPassword!', { env: 'LOGIN_PASSWORD' }]
```

A string is the value itself. `{ env: 'NAME' }` reads the value from that environment variable when the adapter starts, so a committed config names the variable rather than carrying the value. A listed value is redacted from the start of the run, not only once it is typed. Selenium's `DevTools.configure()` re-reads `secrets` and keeps the passwords already learned, unless it sets `maskInputs: false`.

Both kinds are matched the same way: a value inside a longer string is replaced, and so are its JSON-escaped, URL-encoded, form-encoded and XML-escaped forms (`SuperSecretPassword!` in a login POST body is `SuperSecretPassword%21`, and `token&1234` in a native app's page source is `token&amp;1234`), a W3C Send Keys payload spelled one character per item (redacted as the text it spells, so the array takes the placeholder's four items), and a value typed with special keys such as Shift pressed between its parts (`sendKeys('Super', Key.SHIFT, 'Secret')`), whose row is replaced whole. A prefix of a value is never replaced: a typed password's keystrokes sit in its own field, whose value the page collector already masks keystroke by keystroke, so an attribute such as `type="password"`, an `id`, a username or a URL that starts the same way is kept. A value shorter than 4 characters after trimming is never redacted, since replacing it would rewrite unrelated text across the trace; a listed one is skipped, as is a variable that is not set, and one warning gives the count of skipped entries, never a value or a variable name. Redaction runs in the adapter on the copy that is sent or written, so the test and the driver still see the real value; the live dashboard, a trace zip or `ndjson-directory` and the Python adapter's archive (built by the backend from what the adapter sent) are all covered. A per-spec or per-test archive written before a later test typed a password is rewritten without it when the run's traces are finalized, since every slice carries the whole spec source. A frame with nothing to redact is not copied: the walk only allocates the containers on the path to a value it changes.

| Option | Values | Default | Description |
|---|---|---|---|
| `secrets` | `Array<string \| { env: string }>` | `[]` | Values replaced by `••••` in everything the dashboard and the trace receive, on top of what `maskInputs` redacts. |

The Python adapter takes `enable(secrets=["...", {"env": "LOGIN_PASSWORD"}])`, `--devtools-secret VALUE` and `--devtools-secret-env NAME` (both repeatable), the `devtools_secret_envs` ini key (variable names, one per line) or `DEVTOOLS_SECRET_ENVS=LOGIN_PASSWORD,API_TOKEN`. A `--devtools-secret` value is dropped from the Run-all and rerun commands the dashboard holds, so a rerun spawned from the dashboard does not redact it: use `--devtools-secret-env`, which a rerun inherits through the environment, when reruns matter. The JavaScript adapters send their Run-all and rerun commands in the run's metadata, which is redacted like every frame, so a secret on their command line reaches Run-all and Rerun as `••••`: pass it through an environment variable instead.

**Not covered:**

- **Pixels.** Screenshots, the screencast, the filmstrip and the video show what the browser painted.
- **What a live run sent before the password was typed.** The dashboard already holds those frames: the spec source (sent when the test's first command runs, so a password written as a literal shows in the live Source tab), a suite tree carrying test code or a step title naming it until it is re-sent, and the login page's own text. A trace is written at the end and carries none of these.
- **Raw keyboard input with no target element**: WebdriverIO `browser.keys()`, Selenium `actions().sendKeys()`, Nightwatch `keys()` and Python `ActionChains`, which name no field to read. List the value in `secrets`.
- **Values typed into fields that are not password fields**, a password field the page turns into a text field before the test types, and, on Nightwatch, a field whose selector first matches another element. List the value in `secrets`; no value is replaced as a keystroke prefix, so the partial values typed into a field the page does not mask stay in its value mutations.
- **A password written in pieces in the test source**, such as `sendKeys('Super', Key.SHIFT, 'Secret')`: the typed row is redacted, but the source keeps each literal, and no single one is the value. List the value in `secrets` and type it from that variable, or read it from the environment.
- **A password typed on a native app**, which has no field type to read.
- **An Allure attachment made before a later test typed the password.** A test's trace, screenshot and video are attached when that test ends; the archive on disk is rewritten at the end of the run, the copy in the Allure results is not. List the value in `secrets` to have it redacted from the start.
- **Binary and base64 data**: an image, a font, a base64 body of 256 characters or more, and any string under a `screenshot` key or under a `data` key beside a `mimeType` (a stored stylesheet), however short, which are left alone unless one is exactly the secret, because a short secret occurs in base64 by chance and rewriting it would corrupt the file.
- **Other encodings** of the value than those above, such as base64 inside a header other than the four credential ones, or HTML entities.
- **Object keys** in captured data (a JSON body's key) and file names, which are kept so the data keeps its shape.
- **The terminal.** What the test runner itself prints is the runner's, not the adapter's.

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
