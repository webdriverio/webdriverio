# RFC 0001: `wdio session`

| | |
|---|---|
| Status | Accepted, in implementation |
| Target release | WebdriverIO v10 |
| Packages | new `@wdio/session`, `@wdio/cli`, `@wdio/utils`, `@wdio/appium-service`, `@wdio/local-runner`, `@wdio/runner`, `create-wdio`, `website` |
| Branch | `cb/wdio-session-9c46` (feature), `cb/wdio-session-frontpage-9c46` (homepage) |

This document is the source of truth for the `wdio session` feature. It is
written so that the feature can be implemented and verified from this file
alone. When the implementation deviates, update this file in the same commit.

## Table of contents

1. [Summary](#1-summary)
2. [Goals and non-goals](#2-goals-and-non-goals)
3. [Terminology](#3-terminology)
4. [CLI conventions](#4-cli-conventions)
5. [Targets: `wdio session open`](#5-targets-wdio-session-open)
6. [Command reference](#6-command-reference)
7. [Code mode (`exec`)](#7-code-mode-exec)
8. [Snapshots and refs](#8-snapshots-and-refs)
9. [Architecture](#9-architecture)
10. [Optional dependencies](#10-optional-dependencies)
11. [Integrations](#11-integrations)
12. [Test runner and REPL bridge](#12-test-runner-and-repl-bridge)
13. [Doctor, skill and project scaffolding](#13-doctor-skill-and-project-scaffolding)
14. [Documentation](#14-documentation)
15. [Homepage](#15-homepage)
16. [Work items and validation](#16-work-items-and-validation)
17. [Risks and open questions](#17-risks-and-open-questions)

---

## 1. Summary

`wdio session` starts a WebdriverIO session that outlives the command that
created it. A small background process (the *daemon*) owns the session. Every
later `wdio session …` call talks to that daemon over a local socket, so a
coding agent (or a human) can drive a browser, a mobile app or a desktop app
with many short shell commands, and turn what worked into a test.

```bash
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot
npx wdio session click e3
npx wdio session <<'JS'
await expect($('aria/Cart (1)')).toBeDisplayed()
JS
npx wdio session visual check cart
npx wdio session export > test/specs/cart.e2e.ts
npx wdio session close
```

Design principles, in priority order:

1. **Code first.** The primary interface is `exec`: the agent sends
   WebdriverIO code on stdin. Commands exist where WebdriverIO can format
   information better than the agent can (observation) or where a one-liner
   is common (shortcuts). Every shortcut prints the code it ran.
2. **Every platform.** Browsers, Android and iOS (native, hybrid, mobile web)
   through Appium, macOS and Windows apps through Appium, Electron, Tauri and
   Dioxus apps through their services. The same commands work on all of them;
   commands that cannot apply to a platform fail with `NOT_SUPPORTED`.
3. **Light install.** `@wdio/session` depends only on `webdriverio` and core
   helpers. Appium, the visual service and the desktop services are resolved
   when a command needs them. A missing one produces exit code `3` and the
   exact install command.
4. **Replayable.** Actions address elements, not pixels. The session history
   exports as a spec that runs under `wdio run`.
5. **Agent-readable output.** Short text by default, `--json` for machines,
   large payloads (snapshots, screenshots, page source) written to files with
   the path printed.

## 2. Goals and non-goals

### Goals

- A persistent, named, multi-platform automation session controllable from a
  shell, with no interactive terminal needed.
- A token-efficient observation layer: accessibility snapshots with refs,
  text search, structural diffs.
- Visual snapshots through `@wdio/visual-service`.
- Turning a session into a spec (`export`).
- Joining a live session as a human (`wdio repl --session`) and exposing a
  paused test to an agent (`wdio run --debug=agent`).
- Clear, machine-readable failures for missing dependencies.

### Non-goals

- No LLM inside WebdriverIO. The coding agent is the intelligence.
- No coordinate-based clicking as the default interaction model (coordinates
  are only available through `exec`, e.g. `browser.action('pointer')`).
- No MCP server in this package. `@wdio/mcp` stays the MCP surface; sharing
  the snapshot code with it is a follow-up (see §17).
- No hosted/cloud component.

## 3. Terminology

| Term | Meaning |
|---|---|
| Session | A named `wdio session` instance: one daemon, one WebdriverIO browser object. Default name `default`. |
| Daemon | The detached Node.js process that owns the WebdriverIO browser object and serves requests. |
| Target | What `open` automates: `chrome`, `android`, `electron`, a config file, … (§5). |
| Action | A `wdio session` subcommand executed by the daemon (`click`, `snapshot`, …). |
| Ref | A short element handle (`e12`) assigned by `snapshot`, valid within the session (§8.4). |
| Stable selector | A WebdriverIO selector computed for a ref that is unique on the page and suitable for a committed test (§8.5). |
| Artifacts dir | Per-session output folder in the project: `<cwd>/.wdio/session/<name>/`. |
| Runtime dir | Per-user folder holding sockets and state files (§9.3). |
| History | The ordered list of successful steps, as WebdriverIO code (§9.8). |

## 4. CLI conventions

### 4.1 Invocation

`wdio session <action> [args] [flags]`. When stdin is not a TTY and no action
is given, the action is `exec` (`wdio session <<'JS' … JS`).

### 4.2 Global flags

| Flag | Env | Default | Meaning |
|---|---|---|---|
| `--session, -s <name>` | `WDIO_SESSION` | `default` | Session to address. Must match `^[A-Za-z0-9_-]{1,64}$`. |
| `--json` | `WDIO_SESSION_JSON=1` | off | Print exactly one JSON object on stdout (§4.4). |
| `--timeout <ms>` | | action specific (§6) | Client-side request timeout. |
| `--quiet, -q` | | off | Print nothing on success except requested data. |
| `--no-color` | `NO_COLOR` | color when stdout is a TTY | Disable ANSI colors. |

`WDIO_SESSION_DIR` overrides the runtime dir, `WDIO_SESSION_ARTIFACTS`
overrides the artifacts dir root.

### 4.3 Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The action or the agent's code failed (element not found, assertion failed, timeout, visual mismatch, …). |
| `2` | Usage error: unknown action, invalid flag, invalid session name, action needs an argument. |
| `3` | Missing dependency: a package, an Appium driver, a binary or credentials. |
| `4` | Session not found: no running daemon with that name (including stale state that was cleaned up). |

### 4.4 Output

Text mode prints short, stable lines designed for agents. No spinners and no
color when stdout is not a TTY. Progress messages go to stderr.

JSON mode prints one object on stdout and nothing else:

```json
{ "ok": true, "session": "default", "action": "click", "result": { "text": "Clicked e3 (button \"Add to cart\")", "code": "await $('aria/Add to cart').click()", "data": {} } }
```

```json
{ "ok": false, "session": "default", "action": "open", "error": { "code": "MISSING_DEPENDENCY", "message": "Cannot open an Android session: Appium is not installed.", "hint": "Run `wdio session doctor android` to check your setup.", "package": "appium", "install": ["pnpm add -D appium@^3", "npx appium driver install uiautomator2"] } }
```

`result.files` lists files an action wrote (absolute paths). `result.code`
is the WebdriverIO code equivalent, when one exists.

### 4.5 Error codes

| Code | Exit | Raised when |
|---|---|---|
| `USAGE` | 2 | Invalid invocation. |
| `MISSING_DEPENDENCY` | 3 | An optional package is not resolvable (§10). |
| `MISSING_APPIUM_DRIVER` | 3 | Appium is installed but the needed driver is not. |
| `MISSING_BINARY` | 3 | A required binary (`tauri-driver`, `ffmpeg` when explicitly requested, `adb`, …) is not found. |
| `MISSING_CREDENTIALS` | 3 | Cloud provider credentials are not set. |
| `SESSION_NOT_FOUND` | 4 | No live daemon for the session name. |
| `SESSION_EXISTS` | 1 | `open` on a name that is running, without `--replace`. |
| `SESSION_START_FAILED` | 1 | The daemon exited or timed out before the session was ready. Includes the last 40 lines of `daemon.log`. |
| `SESSION_DIED` | 1 | The browser, app or driver went away during a request. The daemon shuts down. |
| `BUSY` | 1 | More than 16 requests queued for one session. |
| `TIMEOUT` | 1 | A request exceeded its timeout. |
| `EXEC_ERROR` | 1 | Code sent to `exec` threw. |
| `ELEMENT_NOT_FOUND` | 1 | A selector target matched nothing. |
| `REF_NOT_FOUND` | 1 | A ref was never assigned in this session. |
| `REF_STALE` | 1 | A ref's element no longer exists (e.g. after navigation). |
| `NOT_SUPPORTED` | 1 | The action does not apply to the session's platform (e.g. `rotate` in Chrome). |
| `BIDI_REQUIRED` | 1 | The action needs WebDriver BiDi and the session has none. |
| `VISUAL_MISMATCH` | 1 | `visual check` exceeded the threshold. |
| `INTERNAL` | 1 | Anything else. Message includes the path to `daemon.log`. |

### 4.6 Targets for element actions

Actions that take a `<target>` accept either a ref (`/^e\d+$/`) or any
WebdriverIO selector string (`aria/Sign in`, `#email`, `button=Save`,
`~loginButton`, `android=new UiSelector().text("OK")`, …). Selectors must
resolve to exactly one element (v10 strict `$`).

## 5. Targets: `wdio session open`

`wdio session open <target> [url] [flags]`

The daemon is started, the session is created, and the command returns when
the session is ready. Output (text):

```
Session "default" ready: chrome 131.0 (headless) · http://localhost:3000/
Artifacts: /repo/.wdio/session/default
```

### 5.1 Common `open` flags

| Flag | Default | Meaning |
|---|---|---|
| `--replace` | off | Close a running session with the same name first. |
| `--launch-timeout <ms>` | `180000` | Wait for the session to become ready (covers browser/driver downloads and app installs). |
| `--idle-timeout <duration>` | `30m` | Shut down after this long without requests. `0` disables. Accepts `ms`, `s`, `m`, `h`. |
| `--capabilities <json\|file>` | | Extra capabilities merged last (deep merge). |
| `--hostname`, `--port`, `--path`, `--protocol` | | Use a remote WebDriver endpoint instead of a local driver. |
| `--log-level <level>` | `warn` | WebdriverIO log level written to `daemon.log`. |
| `--no-bidi` | BiDi on | Do not request `webSocketUrl: true`. |

### 5.2 Browsers: `chrome`, `firefox`, `edge`, `safari`

`wdio session open chrome [url]`

| Flag | Default | Meaning |
|---|---|---|
| `--headed` | headless | Show the browser window. `WDIO_SESSION_HEADED=1` sets the default. |
| `--viewport <w>x<h>` | `1280x720` | Initial viewport via `browser.setViewport`. |
| `--browser-version <v>` | stable | Passed as `browserVersion` (downloads handled by `@wdio/utils`). |
| `--binary <path>` | | Browser binary. |
| `--arg <arg>` | | Extra browser argument, repeatable (Chrome/Edge `args`, Firefox `args`). |
| `--profile <dir>` | temporary | Persistent profile directory. |
| `--attach <port\|url>` | | Chrome/Edge only: attach to a running browser via `goog:chromeOptions.debuggerAddress` / `ms:edgeOptions.debuggerAddress`. Headless flags are ignored. `close` detaches without quitting the browser. |

Capabilities (Chrome example):

```json
{
  "browserName": "chrome",
  "webSocketUrl": true,
  "goog:chromeOptions": { "args": ["--headless=new", "--disable-gpu", "--window-size=1280,720"] }
}
```

Firefox uses `moz:firefoxOptions.args: ["-headless"]`, Edge
`ms:edgeOptions`. Safari has no headless mode: `--headed` is implied and a
note is printed. Safari requires macOS; on other platforms `open safari`
fails with `NOT_SUPPORTED`.

If `url` is given, the daemon calls `browser.url(url)` after the session
starts, and the history begins with that step.

### 5.3 Android and iOS: `android`, `ios`

`wdio session open android --app ./app.apk`
`wdio session open android --package com.example --activity .MainActivity`
`wdio session open android --browser chrome [url]`
`wdio session open ios --app ./App.app --device "iPhone 16" --platform-version 18.0`
`wdio session open ios --bundle-id com.example.app`
`wdio session open ios --browser safari [url]`

| Flag | Meaning |
|---|---|
| `--app <path\|url>` | App file (`.apk`, `.aab`, `.app`, `.ipa`) or cloud app URL. Local paths are resolved to absolute paths. |
| `--package`, `--activity` | Android installed app (`appium:appPackage`, `appium:appActivity`). |
| `--bundle-id` | iOS installed app (`appium:bundleId`). |
| `--browser <chrome\|safari>` | Mobile web instead of an app. |
| `--device <name>` | `appium:deviceName`. Default `Android Emulator` / `iPhone 16`. |
| `--platform-version <v>` | `appium:platformVersion`. |
| `--udid <id>` | `appium:udid` (real devices). |
| `--no-reset`, `--full-reset` | `appium:noReset`, `appium:fullReset`. |
| `--orientation <portrait\|landscape>` | `appium:orientation`. |
| `--appium-url <url>` | Use a running Appium server instead of starting one. |

Base capabilities:

```json
{ "platformName": "Android", "appium:automationName": "UiAutomator2", "appium:deviceName": "Android Emulator", "appium:autoGrantPermissions": true, "appium:newCommandTimeout": 3600 }
{ "platformName": "iOS", "appium:automationName": "XCUITest", "appium:deviceName": "iPhone 16", "appium:autoAcceptAlerts": false, "appium:newCommandTimeout": 3600 }
```

`newCommandTimeout` is 3600 s so Appium does not end a session that the agent
is merely thinking about; the daemon's idle timeout governs the lifetime.
Appium server handling is described in §11.4.

### 5.4 Native desktop: `macos`, `windows`

`wdio session open macos --bundle-id com.apple.TextEdit`
`wdio session open windows --app "C:\\Program Files\\App\\app.exe"`

| Target | Capabilities | Appium driver |
|---|---|---|
| `macos` | `platformName: "mac"`, `appium:automationName: "Mac2"`, `appium:bundleId` | `mac2` |
| `windows` | `platformName: "windows"`, `appium:automationName: "Windows"`, `appium:app` (path or `Root`) | `windows` |

`macos` requires macOS and `windows` requires Windows; otherwise
`NOT_SUPPORTED`.

### 5.5 Electron, Tauri, Dioxus

`wdio session open electron ./dist/linux-unpacked/my-app`
`wdio session open electron ./main.js` (unpackaged app entry point)
`wdio session open tauri ./src-tauri/target/release/my-app`
`wdio session open dioxus ./target/release/my-app`

| Flag | Meaning |
|---|---|
| `--app-arg <arg>` | Argument passed to the app, repeatable. |
| `--chromedriver <path>` | Electron only: explicit Chromedriver binary. |
| `--electron-version <v>` | Electron only: override detection. |

Electron: a path ending in `.js`, `.mjs` or `.cjs` is an entry point
(`appEntryPoint`), anything else a binary (`appBinaryPath`). The session is
created through `@wdio/electron-service` standalone mode (§11.2).

On Linux without `DISPLAY`/`WAYLAND_DISPLAY`, desktop targets start a virtual
display through `@wdio/display-server` (`startDisplayDaemonFromConfig` with
`displayServer: 'auto'`), stopped when the daemon exits.

### 5.6 Config file

`wdio session open ./wdio.conf.ts [capability]`

`capability` is an index into the capabilities array or a name in a
multi-remote capabilities object, like `wdio repl` today (reuse
`getCapabilities` from `@wdio/cli`). The session uses the config's
`baseUrl`, timeouts, `hostname`/`port`/`path`, and the options of supported
services found in `services` (`visual`, `electron`, `tauri`, `dioxus`,
`appium`). Other services are ignored with a note on stderr. Relative URLs in
`navigate` and `exec` resolve against `baseUrl`.

### 5.7 Cloud providers

`wdio session open chrome --provider browserstack --os Windows --os-version 11`
`wdio session open android --provider saucelabs --device "Google Pixel 8" --app ./app.apk`

| Flag | Meaning |
|---|---|
| `--provider <browserstack\|saucelabs\|testingbot\|testmu>` | Cloud provider. |
| `--os`, `--os-version` | Desktop OS for browser sessions. |
| `--region <us-west-1\|eu-central-1\|apac-southeast-1>` | Sauce Labs data center. Default `us-west-1`. |
| `--tunnel [external]` | Start the provider's tunnel (or use one already running with `external`). |
| `--tunnel-name <name>` | Tunnel identifier. |
| `--project`, `--build`, `--name` | Reporting labels. |

| Provider | Credentials (env) | Hub | Options key | App upload endpoint | Tunnel package |
|---|---|---|---|---|---|
| BrowserStack | `BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY` | `https://hub.browserstack.com/wd/hub` | `bstack:options` | `https://api-cloud.browserstack.com/app-automate/upload` | `browserstack-local` |
| Sauce Labs | `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY` | `https://ondemand.<region>.saucelabs.com/wd/hub` | `sauce:options` | `https://api.<region>.saucelabs.com/v1/storage/upload` | `saucectl` (Sauce Connect) |
| TestingBot | `TESTINGBOT_KEY`, `TESTINGBOT_SECRET` | `https://hub.testingbot.com/wd/hub` | `tb:options` | `https://api.testingbot.com/v1/storage` | `testingbot-tunnel-launcher` |
| TestMu AI | `LT_USERNAME`, `LT_ACCESS_KEY` | `https://hub.lambdatest.com/wd/hub` (browsers), `https://mobile-hub.lambdatest.com/wd/hub` (apps) | `LT:Options` | `https://manual-api.lambdatest.com/app/upload/realDevice` | `@lambdatest/node-tunnel` |

Endpoints and option keys must be re-checked against provider documentation
during implementation (item 15). A local `--app` path is uploaded first and
replaced by the returned app URL. Missing credentials fail with
`MISSING_CREDENTIALS` listing the variable names.

## 6. Command reference

Applicability legend: **W** web (browsers, Electron renderer, mobile web),
**M** native mobile, **D** native desktop (mac2/Windows). Unless noted,
actions time out after 30 s client-side.

### 6.1 Lifecycle

| Action | Args / flags | Applies | Behavior | Text output |
|---|---|---|---|---|
| `open` | `<target> [url]` (§5) | all | Starts daemon and session. | `Session "x" ready: …` |
| `close` | `[--all] [--clean]` | all | Ends the session (`deleteSession`, or detach for `--attach`/Appium `noReset`), stops the daemon, removes runtime files. `--clean` also deletes the artifacts dir. `--all` closes every session of this user. | `Closed "x"` |
| `list` | | all | Lists sessions. Stale state (dead PID or refused socket) is removed and reported. | one line per session: `default  chrome 131.0  http://localhost:3000/  12m` |
| `info` | | all | Session id, target, platform, capabilities summary, BiDi on/off, current URL/title (W) or context/activity (M), window size, artifacts dir. | key/value lines |
| `restart` | | all | Closes and re-opens with the same target and flags. History is kept and a `// restart` marker added. | as `open` |
| `status` | | all | Exit `0` if the session is alive, `4` if not. Prints `running`/`not running`. For scripts. | |

### 6.2 Code

| Action | Args / flags | Behavior |
|---|---|---|
| `exec` | stdin, `-e <code>`, or `<file>` (`.js`, `.ts`, `.mjs`); `--timeout <ms>` default `60000`; `--no-history` | Runs code (§7). |
| `helpers` | `[--reload]` | Lists project helpers loaded from `.wdio/helpers/` (§9.9). `--reload` re-imports them. |

### 6.3 Observation

| Action | Args / flags | Applies | Behavior |
|---|---|---|---|
| `snapshot` | `[--depth N] [--scope <target>] [--interactive] [--all] [--boxes] [--file-only] [--max-chars N]` | W M D | Accessibility snapshot with refs (§8). Always written to `snapshots/<ts>.yml`; printed inline when ≤ `--max-chars` (default 8000) and not `--file-only`, else a summary and the file path. |
| `find` | `<text> [--regex] [--context N]` | W M D | Takes a fresh snapshot and prints matching lines with `N` (default 2) lines of context, like `grep -C`. Exit 1 with `No match` when nothing matches. |
| `diff` | `[--baseline <file>]` | W M D | Takes a snapshot and prints a unified line diff against the previous snapshot of this session (or the given file). `No changes` when equal. |
| `screenshot` | `[target] [--full] [--path <file>]` | W M D | Viewport, element (`target`) or full page (`--full`, W only) PNG. Default path `screenshots/<ts>.png`. Prints the path and dimensions. |
| `source` | `[--path <file>]` | W M D | Page HTML (W) or XML page source (M, D) written to a file. Prints the path and byte size. |
| `logs` | `[--errors] [--network] [--since <duration>] [--peek] [--source <browser\|driver\|logcat\|syslog\|main>]` | W M | Prints buffered events since the last `logs` call and clears the buffer (`--peek` keeps it). Format: `12:00:01.123 error console  Uncaught TypeError: …` (§9.7). |

### 6.4 Interaction shortcuts

Every shortcut prints `→ <code>` with the equivalent WebdriverIO code, using
the stable selector for refs, and appends that code to the history.

| Action | Args | Applies | Code emitted |
|---|---|---|---|
| `navigate` | `<url>` | W | `await browser.url('<url>')` |
| `back` / `forward` | | W | `await browser.back()` / `await browser.forward()` |
| `reload` | | W | `await browser.refresh()` |
| `click` | `<target> [--double] [--right]` | W M D | `await $(sel).click()` / `.doubleClick()` / `.click({ button: 'right' })` |
| `tap` | `<target>` | M | `await $(sel).tap()` |
| `fill` | `<target> <text>` | W M D | `await $(sel).setValue('<text>')` |
| `type` | `<text>` | W M D | `await browser.keys('<text>')` (types into the focused element) |
| `press` | `<keys>` e.g. `Enter`, `Control+a`, `Shift+Tab` | W D | `await browser.keys(['Control', 'a'])` |
| `select` | `<target> <value> [--by text\|value\|index]` default `text` | W | `selectByVisibleText` / `selectByAttribute('value', v)` / `selectByIndex(n)` |
| `upload` | `<target> <file>` | W | local: `await $(sel).setValue('<abs path>')`; remote: `const p = await browser.uploadFile('<abs>'); await $(sel).setValue(p)` |
| `hover` | `<target>` | W D | `await $(sel).moveTo()` |
| `drag` | `<from> <to>` | W M D | `await $(from).dragAndDrop($(to))` |
| `scroll` | `[target\|up\|down\|top\|bottom] [--px N]` default `down`, 600 px | W | `await $(sel).scrollIntoView()` / `await browser.scroll(0, ±N)` |
| `swipe` | `<up\|down\|left\|right> [--percent 0..1]` | M | `await browser.swipe({ direction, percent })` |
| `long-press` | `<target> [--duration ms]` | M | `await $(sel).longPress({ duration })` |

### 6.5 Contexts and targets

| Action | Args | Applies | Behavior / code |
|---|---|---|---|
| `tabs` | `[switch <index\|handle> \| new [url] \| close <index>]` | W | Without args: list tabs `[0]* title — url`. `new` → `browser.newWindow(url)`, `switch` → `browser.switchToWindow(handle)`, `close` → close that handle. |
| `windows` | `[switch <index\|handle>]` | W D | Desktop/Electron windows. Same format as `tabs`. |
| `frame` | `<target\|top\|parent>` | W | `browser.switchFrame($(sel))` / `browser.switchFrame(null)` / parent. Subsequent snapshots are scoped to the frame; `info` shows the frame. |
| `contexts` | `[switch <name>]` | M | List `NATIVE_APP`, `WEBVIEW_*` (with URL/title when available); `switch` → `browser.switchContext(name)`. |
| `dialog` | `<accept\|dismiss> [--text <prompt text>]` | W M | W: accepts/dismisses the open alert via the BiDi `dialog` event or classic `acceptAlert`. M: `browser.acceptDialog()` / `browser.dismissDialog()`. `NOT_SUPPORTED` if no dialog is open (`No dialog open`). |

### 6.6 Device and app control

| Action | Args | Applies | Code |
|---|---|---|---|
| `app launch` | `<id>` | M D | `browser.execute('mobile: activateApp', { appId/bundleId })` |
| `app terminate` | `<id>` | M D | `mobile: terminateApp` |
| `app install` | `<path>` | M | `browser.installApp(path)` |
| `app state` | `<id>` | M | `browser.queryAppState(id)` → `not installed \| not running \| background (suspended) \| background \| foreground` |
| `deeplink` | `<url> [--package id]` | M | `browser.deepLink(url, packageOrBundleId)` |
| `rotate` | `<portrait\|landscape>` | M | `browser.setOrientation('PORTRAIT'\|'LANDSCAPE')` |
| `keyboard hide` | | M | `browser.hideKeyboard()` |
| `background` | `<seconds>` | M | `browser.background(seconds)` |
| `lock` / `unlock` | | M | `browser.lock()` / `browser.unlock(...)` |
| `geolocation` | `<lat> <lon> [--accuracy m]` | W M | W: `browser.emulate('geolocation', { latitude, longitude, accuracy })`; M: `browser.setGeoLocation({ latitude, longitude, altitude: 0 })` |

### 6.7 Emulation (W, BiDi where WebdriverIO requires it)

| Action | Code |
|---|---|
| `emulate device <name>` | `browser.emulate('device', name)`; lists names when `<name>` is omitted |
| `emulate viewport <w>x<h> [--dpr n]` | `browser.setViewport({ width, height, devicePixelRatio })` |
| `emulate network <offline\|online\|GPRS\|Regular3G\|Good3G\|Regular4G\|DSL\|WiFi>` | `browser.emulate('onLine', false)` for offline, else `browser.throttleNetwork(preset)` |
| `emulate cpu <rate>` | `browser.throttleCPU(rate)` (Chromium only; else `NOT_SUPPORTED`) |
| `emulate clock [<iso date>] [--tick <ms>]` | `const clock = await browser.emulate('clock', { now })`; `--tick` calls `clock.tick(ms)` on the stored clock |
| `emulate color-scheme <light\|dark>` | `browser.emulate('colorScheme', scheme)` |
| `emulate user-agent <ua>` | `browser.emulate('userAgent', ua)` |
| `emulate reset` | Calls every stored restore function, resets viewport to the `open` value. |

Emulations that WebdriverIO applies only after reload print `Reload the page
to apply` when needed (all scopes except `clock`).

### 6.8 Network (W, requires BiDi)

| Action | Args | Behavior |
|---|---|---|
| `requests` | `[--filter <substring\|glob>] [--failed] [--since <duration>] [--limit N]` default limit 50 | Lists captured requests: `200 GET https://…/api/user 34ms 1.2kB`. Captured from `network.responseCompleted` / `network.fetchError` since session start (ring buffer of 1000). |
| `mock` | `<url pattern> [--status N] [--body <json\|file>] [--header k:v] [--abort] [--method M] [--once]` | `const m = await browser.mock(pattern, { method })`; then `m.respond(body, { statusCode, headers })`, `m.abort()`, or `respondOnce`/`abortOnce` for `--once`. Mocks are stored by pattern. Prints `Mocked <pattern> (id m1)`. |
| `unmock` | `[<pattern\|id>] [--all]` | `m.restore()` / `browser.mockRestoreAll()`. |

Without BiDi these fail with `BIDI_REQUIRED` and a hint to reopen without
`--no-bidi` or with a BiDi-capable browser.

### 6.9 State

| Action | Args | Applies | Behavior |
|---|---|---|---|
| `cookies` | `[get [name] \| set <name> <value> [--domain d] [--path p] [--http-only] [--secure] [--same-site s] [--expiry unix] \| clear [name]]` | W | `getCookies` / `setCookies` / `deleteCookies`. |
| `storage` | `[get [key] \| set <key> <value> \| clear] [--session]` | W | localStorage (default) or sessionStorage of the current origin via `browser.execute`. |
| `state save` | `<file>` | W | Writes `{ version: 1, url, origin, cookies, localStorage, sessionStorage }` for the current origin. |
| `state load` | `<file>` | W | Navigates to `origin` if needed, sets cookies and storage, then reloads. Prints what was restored. |

### 6.10 Visual (requires `@wdio/visual-service`, §11.1)

| Action | Args | Behavior |
|---|---|---|
| `visual save` | `<tag> [--element <target>] [--full] [--tabbable]` | Saves a baseline image (`saveScreen`, `saveElement`, `saveFullPageScreen`, `saveTabbablePage`). Prints the path. |
| `visual check` | `<tag> [--element <target>] [--full] [--tabbable] [--threshold <percent>]` default threshold `0` | Compares with the baseline (`checkScreen`, …). Prints `mismatch 0.00% (threshold 0%)`; above threshold prints the diff image path and exits `1` with `VISUAL_MISMATCH`. Missing baseline: saves it (visual service `autoSaveBaseline: true`) and prints `Baseline created`. |
| `visual accept` | `<tag> \| --all` | Copies the latest actual image of the tag over the baseline. |
| `visual list` | | Tags with baseline path, last mismatch and diff path. |

### 6.11 Evidence

| Action | Args | Applies | Behavior |
|---|---|---|---|
| `trace start` | `[--screenshots] [--snapshots]` (both default on) | W M D | Starts recording every subsequent action and exec call into `trace/<ts>/` (§9.10). |
| `trace stop` | | | Finalizes and prints the trace folder and `transcript.md` path. |
| `record start` | `[--fps N]` default 5 | W M | W: BiDi `browsingContext.startScreencast` when supported; otherwise frame capture at `fps` with `takeScreenshot`. M: `browser.startRecordingScreen()`. |
| `record stop` | `[--path <file>]` | | W screencast: saves the returned file. W frame capture: encodes with `ffmpeg` to MP4 if on `PATH`, else leaves `frames/*.png` and prints a note. M: `browser.saveRecordingScreen(path)`. |
| `history` | `[--json] [--clear]` | all | Prints numbered steps (§9.8). |
| `export` | `[--out <file>] [--title <text>] [--page-objects] [--framework mocha\|jasmine]` default mocha | all | Generates a spec from the history (§9.8). Prints it (or writes `--out`, plus page objects next to it). |

### 6.12 Session bridge and tooling

| Action | Behavior |
|---|---|
| `resume` | Only for sessions created by `wdio run --debug=agent` (§12.2): continues the paused test. `NOT_SUPPORTED` for normal sessions. |
| `doctor` | `[target] [--json]` environment checks (§13.1). |
| `skill` | Prints the bundled `SKILL.md` (§13.2). `--install [dir]` writes it to `.agents/skills/wdio-session/SKILL.md` (or `dir`). |

## 7. Code mode (`exec`)

### 7.1 Input

- stdin (default when piped), `-e "<code>"`, or `exec <file>`.
- TypeScript is accepted everywhere: the code is passed through
  `module.stripTypeScriptTypes(code, { mode: 'strip' })` (Node ≥ 22.13). If
  stripping throws, the original code is used. Enums/namespaces are not
  supported (documented).
- Top-level `await` works.

### 7.2 Transformation

The daemon parses the code with `acorn` (`ecmaVersion: 'latest'`,
`sourceType: 'module'`, `allowAwaitOutsideFunction: true`,
`allowReturnOutsideFunction: true`) and rewrites it before running:

1. **Persistent declarations.** Top-level `const`, `let`, `var`, `function`
   and `class` declarations become assignments on the context
   (`const x = 1` → `globalThis.x = 1`; destructuring is supported by
   assigning each bound identifier). Variables therefore persist across
   calls, like the Node.js REPL. `const` loses immutability (documented).
2. **Last expression value.** If the last top-level statement is an
   expression statement, it becomes `return (<expr>)`.
3. **Imports.** Static `import x from 'y'` becomes
   `const x = (await import('y')).default` (and named/namespace forms
   accordingly), resolved from the project `cwd`.
4. The result is wrapped in `(async () => { … })()` and run with
   `vm.runInContext` in the session context.

Syntax errors return `EXEC_ERROR` with `line:column` relative to the
submitted code.

### 7.3 Context

| Global | Value |
|---|---|
| `browser` | The WebdriverIO browser object (also `driver`). |
| `$`, `$$` | Bound to `browser`. |
| `expect` | `expect-webdriverio`'s `expect`, configured with the session's `waitforTimeout`. |
| `ref(id)` | Returns the element for a ref (§8.4). |
| `session` | `{ name, artifactsDir, snapshot(opts), log(...args) }`. `snapshot()` returns the snapshot text. |
| `console` | Captured (§7.4). |
| `process`, `setTimeout`, `fetch`, `URL`, `Buffer`, `structuredClone` | Node.js globals. |
| Helpers | Custom commands registered by `.wdio/helpers/*` are on `browser`. |

The context is created once per daemon and reused by every call.

### 7.4 Output

- `console.log/info/debug` lines are collected in order, `console.warn` and
  `console.error` lines are prefixed with `warn:` / `error:`.
- The return value is printed after the console lines using these rules:

| Value | Printed as |
|---|---|
| `undefined` | nothing |
| string, number, boolean, null | as is (strings without quotes) |
| WebdriverIO element | `<button "Add to cart" ref=e3 selector="aria/Add to cart">` (tag, accessible name when cheap, ref if known, selector) |
| element array | `ElementArray(12) [first 10 as above] …` |
| `Buffer` / `Uint8Array` | `<Buffer 12345 bytes>` |
| `Error` | `EXEC_ERROR` |
| other objects/arrays | JSON, 2-space indent, depth 6, truncated at 4000 chars with `… (truncated, use --json for full value)` |

- A returned Promise is awaited (so `$('h1').getText()` without `await` as
  the last expression still prints the text).

### 7.5 Errors and hints

On a thrown error the output is `Error: <message>` plus at most one hint. No
stack trace unless `--log-level debug`. Hints come from a table in
`exec/hints.ts`:

| Pattern | Hint |
|---|---|
| `browser.(element\|elements\|click\|setValue\|getText\|waitForVisible\|waitForExist) is not a function` | The v4 `browser.<cmd>(selector)` style was removed. Use `await $(selector).<cmd>()`. |
| `executeAsync is not a function` | Removed in v10: use `browser.execute` with an async function. |
| `touchAction is not a function` | Removed in v10: use `browser.action('pointer')` or mobile commands like `tap`/`swipe`. |
| `StrictSelectorError` | `$` must match exactly one element in v10. Use `$$(selector)[0]`, a ref, or a narrower selector. Run `wdio session find "<text>"` to locate it. |
| `element ("…") still not existing after` | Take a new `wdio session snapshot`; the page may have changed. |

Static warning: statements whose expression is a call chain starting with
`browser.` or `$(`/`$$(` and not awaited produce
`warn: line N: WebdriverIO commands are async, add await` (acorn AST check).

### 7.6 Timeouts and concurrency

- Default `exec` timeout 60 s (`--timeout`). On timeout the request fails
  with `TIMEOUT`, the session stays usable, and the still-running promise is
  ignored (its result discarded, a warning logged to `daemon.log`).
- Requests to one session run one at a time in arrival order (§9.5).

### 7.7 History

A successful `exec` appends its code (after ref rewriting, §8.4) to the
history unless `--no-history` is set or the code only reads state (the
expression is a single call to a getter: `get*`, `is*`, `$`/`$$` without a
following action). Failed calls are never recorded.

## 8. Snapshots and refs

### 8.1 Format

YAML-like, one node per line, two spaces per depth level:

```
- document "Shop · Cart" url=http://localhost:3000/cart
  - banner
    - link "Home" [ref=e1]
    - navigation "Main"
      - link "Products" [ref=e2]
      - link "Cart (1)" [ref=e3] [current=page]
  - main
    - heading "Your cart" [level=1]
    - list
      - listitem
        - text "Blue T-Shirt"
        - spinbutton "Quantity" [ref=e4] value="1" [min=1] [max=9]
        - button "Remove" [ref=e5]
    - button "Checkout" [ref=e6] [disabled]
```

Grammar (per line): `- <role>[ "<name>"][ [ref=eN]][ value="<v>"][ [state]…][ url=<u>]`.

- `role`: ARIA role (explicit `role` attribute, else implicit role from
  `aria-query`'s `elementRoles`, else `generic` which is omitted by pruning).
- `name`: accessible name, whitespace collapsed, truncated to 80 chars with
  `…`.
- States (only when true/non-default): `checked`, `checked=mixed`,
  `selected`, `expanded`, `collapsed` (expanded=false), `pressed`,
  `disabled`, `required`, `readonly`, `invalid`, `focused`, `current=<v>`,
  `level=<n>`, `min/max` for ranges.
- `value`: for textboxes, comboboxes, spinbuttons, sliders; passwords are
  shown as `value="••••"`.
- `--boxes` appends `[box=x,y,w,h]` in CSS px relative to the viewport.

### 8.2 Web collection (`snapshot/web.ts`)

A single self-contained function executed with `browser.execute` walks the
DOM from `document.body` (or the `--scope` element):

- **Visibility**: skip elements with `display:none`, `visibility:hidden`,
  `content-visibility:hidden`, `hidden` attribute, `aria-hidden="true"`,
  `inert`, or zero-size boxes with no visible descendants. `--all` disables
  the visibility filter (hidden nodes get `[hidden]`).
- **Accessible name** (simplified accname): `aria-labelledby` →
  `aria-label` → `<label for>` / wrapping `<label>` → `alt` (img, input
  image) → `title` → `placeholder` → text content for roles that take their
  name from content (button, link, heading, option, tab, menuitem, cell,
  listitem text).
- **Text nodes**: runs of text directly inside non-interactive elements are
  emitted as `text "…"` (truncated to 80 chars).
- **Pruning**: `generic`/`presentation`/`none` nodes without name are
  replaced by their children; single-child chains are collapsed.
- **Shadow DOM**: open shadow roots are traversed as children of the host.
- **iframes**: same-origin iframes are inlined under
  `- iframe "<title or src>" [ref=eN]`. Cross-origin iframes are emitted as
  `- iframe "<src>" [ref=eN] (cross-origin: run \`wdio session frame eN\`)`.
- **Interactive** (`--interactive` keeps only these and their ancestors'
  landmarks): roles button, link, textbox, searchbox, checkbox, radio,
  switch, combobox, listbox, option, menuitem*, tab, slider, spinbutton,
  treeitem, plus elements with `tabindex >= 0`, `contenteditable`, or
  `cursor: pointer` with an `onclick` attribute.
- **Depth**: `--depth N` stops at depth N and marks truncated nodes with
  `[+K]` (number of hidden descendants).

The role table is generated from `aria-query` at build time and embedded
into the function (no runtime dependency in the page).

### 8.3 Native collection (`snapshot/native.ts`)

The daemon calls `browser.getPageSource()` and parses the XML in Node.js
(no per-element requests). Mapping:

| Platform | Role from | Name from | Refs for |
|---|---|---|---|
| Android (UiAutomator2) | `class`: `Button`/`ImageButton` → button, `EditText` → textbox, `CheckBox` → checkbox, `Switch` → switch, `RadioButton` → radio, `TextView` → text, `ImageView` → img, `RecyclerView`/`ListView` → list, `ScrollView` → scrollview, else `clickable=true` → button, else group | `content-desc` → `text` → `hint` → `resource-id` (suffix) | `clickable`, `checkable`, `focusable` + editable, `long-clickable` |
| iOS (XCUITest) | `type`: `XCUIElementTypeButton` → button, `TextField`/`SecureTextField`/`TextView` → textbox, `Switch` → switch, `StaticText` → text, `Image` → img, `Cell` → listitem, `Table`/`CollectionView` → list, `NavigationBar` → navigation, `Alert` → alertdialog, `Link` → link | `label` → `name` → `value` | buttons, text inputs, switches, cells, links, `accessible=true` with a name |
| macOS (Mac2) | `elementType` (numeric XCUIElement type mapped like iOS) | `title` → `label` → `identifier` | same as iOS |
| Windows | `ControlType`: `Button`, `Edit` → textbox, `CheckBox`, `RadioButton`, `ComboBox`, `ListItem`, `MenuItem`, `TabItem`, `Hyperlink` → link, `Text` → text, `Window` → window | `Name` → `AutomationId` | invokable control types |

Invisible nodes (`displayed="false"`, `visible="false"`,
`IsOffscreen="True"`, zero bounds) are skipped unless `--all`. States:
`checked`, `selected`, `enabled=false` → `disabled`, `focused`. `--boxes`
uses `bounds`/`x,y,width,height`/`BoundingRectangle`.

### 8.4 Refs

- Ref ids are `e1, e2, …`, allocated per session, never reused within a
  session.
- **Web**: the page keeps `window.__wdioSession = { refs: Map<string, WeakRef<Element>>, ids: WeakMap<Element, string> }`
  (installed with `browser.addInitScript` so it exists after navigations,
  and lazily if missing). The same element keeps its ref across snapshots on
  the same document. After navigation the page map is empty, refs of the
  old document resolve to nothing → `REF_STALE`.
- **Native**: the daemon stores for each ref the element's stable selector
  (§8.5) and the snapshot generation it came from. A new snapshot re-matches
  nodes by selector and reuses refs when the selector still matches exactly
  one node.
- **Resolution** (`ref(id)` in exec, `<target>` in actions):
  - web: `await $(() => window.__wdioSession?.refs.get(id)?.deref() ?? null)`
    (function selector, works across browsers). If null → `REF_STALE`.
  - native: `await $(stableSelector)`; 0 matches → `REF_STALE`.
  - unknown id → `REF_NOT_FOUND`.
- **History rewriting**: when a ref is resolved during an `exec` call, the
  daemon records `{ id, stableSelector }`. After a successful call,
  occurrences of `ref('<id>')` / `ref("<id>")` in the stored code are
  replaced with `$('<stableSelector>')`.

### 8.5 Stable selector algorithm

Computed during snapshot for every node that gets a ref. The first candidate
that matches exactly one element wins:

Web (checked in page with `document.querySelectorAll` / accname):

1. `[data-testid="…"]`, `[data-test="…"]`, `[data-qa="…"]`
2. `aria/<accessible name>` if no other element on the page has the same
   accessible name
3. `#id` if the id does not look generated (rejects ids with ≥ 4 digits in
   a row, UUID/hex fragments ≥ 8 chars, or framework prefixes `:r`, `ember`,
   `mui-`, `radix-`)
4. `<tag>=<exact text>` for buttons/links with short text (≤ 40 chars)
5. `[name="…"]` for form fields
6. CSS path from the nearest ancestor with a stable id or test id, using
   `:nth-of-type` only where needed

Native: `~<accessibility id>` → `id=<resource-id>` (Android) →
`-ios predicate string:name == "…"` / `-ios class chain` (iOS) →
`android=new UiSelector().text("…")` → shortest unique XPath.

### 8.6 Diff

Line-based LCS diff (own implementation, no dependency) between the last
stored snapshot text and the new one, printed in unified format with 2 lines
of context and `@@` hunk headers. The new snapshot becomes the stored one.

## 9. Architecture

### 9.1 Packages and files

New package `packages/wdio-session` (`@wdio/session`), created with
`pnpm run create` and then filled in:

```
packages/wdio-session/
  README.md                    # package page (docs source)
  package.json                 # exports ".", "./daemon"; optional peers (§10)
  src/
    index.ts                   # public API: sessionCommand (yargs module), SessionServer, types
    constants.ts               # defaults, exit codes, error codes
    errors.ts                  # SessionError(code, message, { hint, exitCode, … })
    types.ts
    cli/
      command.ts               # yargs command tree for `wdio session`
      client.ts                # connect, send, stale detection
      spawn.ts                 # start daemon, wait for readiness
      output.ts                # text/JSON rendering, exit code mapping
    daemon/
      main.ts                  # daemon entry (process.argv carries encoded open request)
      server.ts                # SessionServer: socket, auth, queue, dispatch
      state.ts                 # runtime dir, state files, locking
      watchdog.ts              # liveness and idle timeout
      events.ts                # BiDi/log ring buffers
    targets/
      index.ts                 # target parsing → OpenPlan { caps, remoteOptions, setup, platform }
      browser.ts  mobile.ts  desktop.ts  electron.ts  tauri.ts  dioxus.ts  config.ts  cloud.ts
      appium.ts                # Appium server start/stop, driver check
    actions/
      index.ts                 # action registry: name → { applies, timeout, run(ctx, args) }
      lifecycle.ts exec.ts observe.ts interact.ts contexts.ts device.ts emulate.ts
      network.ts state.ts visual.ts evidence.ts history.ts bridge.ts
    exec/
      transform.ts             # acorn rewrite (§7.2)
      context.ts               # vm context, console capture
      serialize.ts             # value rendering (§7.4)
      hints.ts                 # error hints and static warnings (§7.5)
    snapshot/
      web.ts                   # in-page collector (§8.2)
      roles.ts                 # generated from aria-query at build time
      native.ts                # XML collectors (§8.3)
      format.ts                # tree → text
      refs.ts                  # ref registry, resolution (§8.4)
      selectors.ts             # stable selector candidates (§8.5, native part)
      diff.ts                  # LCS diff (§8.6)
    history.ts  export.ts  trace.ts  record.ts  helpers.ts  doctor.ts  deps.ts
    skill/SKILL.md
  tests/                       # mirrors src/
```

Dependencies: `webdriverio`, `@wdio/utils`, `@wdio/logger`, `@wdio/types`,
`expect-webdriverio`, `acorn`, `yargs`. Optional peer dependencies are
listed in §10.

`@wdio/cli` adds `commands/session.ts`, a thin yargs module that imports
`@wdio/session` lazily inside its handler, and lists `@wdio/session` as a
dependency. `wdio repl` gains `--session` (§12.1).

### 9.2 Process model

```
wdio session <action>  ──(socket, NDJSON)──>  daemon (node daemon/main.js)
                                                ├─ WebdriverIO browser (remote() / startWdioSession())
                                                ├─ driver or Appium child processes
                                                ├─ optional display server
                                                └─ event buffers, refs, history
```

**Spawning** (`cli/spawn.ts`):

1. `open` validates flags, resolves optional dependencies (§10) and builds
   the open plan in the CLI process. Failures here exit before anything is
   spawned.
2. If a live session with the name exists: `SESSION_EXISTS` unless
   `--replace` (then close it first).
3. Create the artifacts dir and runtime dir, write `<name>.json` with
   `{ status: "starting", pid: null }` (exclusive create; a concurrent
   `open` of the same name fails with `SESSION_EXISTS`).
4. Spawn `process.execPath [daemon/main.js]` with `detached: true`,
   `stdio: ['ignore', logFd, logFd]` (log = `<artifacts>/daemon.log`), env
   inherited plus `WDIO_SESSION_OPEN=<base64 JSON open plan>`, then `unref()`.
5. Poll the state file every 100 ms until `status` is `ready` or `failed`,
   the daemon PID dies, or `--launch-timeout` passes. Stream new
   `daemon.log` lines prefixed with `…` to stderr while waiting when stderr
   is a TTY.

**Daemon start** (`daemon/main.ts`): decode plan → start display server
(if needed) → start Appium (if needed) → create session → install init
script and subscriptions (BiDi) → load helpers → start socket server → write
state `ready` with session info. Any failure: write `{ status: "failed",
error }`, clean up children, exit 1.

**Shutdown** (on `close`, idle timeout, session death, SIGTERM/SIGINT):
reject queued requests with `SESSION_DIED` (or success for `close`), end
the session (`deleteSession`, or detach), stop Appium/display server, close
the socket, remove the socket and state files, exit 0.

### 9.3 Runtime files

Runtime dir: `$WDIO_SESSION_DIR`, else `$XDG_RUNTIME_DIR/wdio-session`, else
`<os.tmpdir()>/wdio-session-<uid>` (POSIX), else
`%LOCALAPPDATA%\wdio-session` (Windows). Created with mode `0700`.

| File | Content |
|---|---|
| `<name>.json` | `{ version: 1, name, pid, status, socket, token, cwd, artifactsDir, target, platform, browserName, browserVersion, sessionId, bidi, startedAt, lastRequestAt, error? }`, mode `0600` |
| `<name>.sock` | Unix domain socket, mode `0600` (POSIX) |

Windows uses the named pipe `\\.\pipe\wdio-session-<sha1(runtimeDir)[0..8]>-<name>`.

Artifacts dir `<cwd>/.wdio/session/<name>/`: `daemon.log`, `snapshots/`,
`screenshots/`, `source/`, `trace/`, `recordings/`, `visual/actual/`,
`visual/diff/`, `history.json`, `export/`. Visual baselines default to
`<cwd>/.wdio/visual/baseline/` (shared across sessions, meant to be
committed). `open` prints a one-time hint to add `.wdio/session/` to
`.gitignore` if the project is a git repository and the path is not ignored.

### 9.4 Protocol

Newline-delimited JSON, one request per connection.

Request:

```json
{ "v": 1, "id": "c0ffee", "token": "<hex>", "action": "click", "args": { "target": "e3", "double": false }, "cwd": "/repo", "timeout": 30000 }
```

Response:

```json
{ "v": 1, "id": "c0ffee", "ok": true, "result": { "text": "Clicked e3 (button \"Add to cart\")", "code": "await $('aria/Add to cart').click()", "data": {}, "files": [] } }
{ "v": 1, "id": "c0ffee", "ok": false, "error": { "code": "REF_STALE", "message": "e3 no longer exists on the page", "hint": "Run `wdio session snapshot` to get fresh refs." } }
```

- The token (32 random bytes, hex) is generated at start and stored in the
  state file. Requests with a missing/wrong token are rejected and the
  connection closed. This is the only access check on Windows; on POSIX it
  adds to the file permissions.
- Protocol version mismatch (`v`) → `INTERNAL` with a hint to close and
  reopen the session (happens after upgrading WebdriverIO).
- Large results are files; responses stay below 1 MB. `exec` output above
  256 kB is written to `<artifacts>/exec/<ts>.txt` and truncated inline.

### 9.5 Request handling

- A FIFO queue per daemon; one request runs at a time. More than 16 queued
  → `BUSY`.
- Server-side timeout = request `timeout` (defaults from §6). On timeout the
  queue moves on (§7.6).
- `lastRequestAt` is updated on every request (state file write is
  debounced to once per second).
- Before running an action the registry checks `applies` against the
  session platform → `NOT_SUPPORTED`.

### 9.6 Liveness

- Idle timer resets on every request; when it fires the daemon shuts down.
- Watchdog every 5 s: driver/Appium child PIDs alive; for BiDi sessions the
  WebSocket `close` event triggers shutdown immediately.
- Errors from WebdriverIO that indicate a dead session (`invalid session
  id`, `ECONNREFUSED` to the driver, `no such window` for the last window,
  Electron app exited) → respond `SESSION_DIED`, then shut down.
- Client stale detection: state file present but PID not alive, or socket
  connect `ECONNREFUSED`/`ENOENT` → delete runtime files → `SESSION_NOT_FOUND`
  with `Session "x" is not running (stale state removed).`

### 9.7 Event buffers (`daemon/events.ts`)

Ring buffers (1000 entries each) filled from session start:

| Source | Platform | Mechanism |
|---|---|---|
| console | W with BiDi | `sessionSubscribe(['log.entryAdded'])` → `{ time, level, source: 'console', text, url? }` |
| page errors | W with BiDi | `log.entryAdded` with `type: 'javascript'` → level `error`, source `page` |
| network | W with BiDi | `network.responseCompleted`, `network.fetchError` → `{ time, method, url, status, durationMs, size, failed }` |
| dialogs | W with BiDi | `browsingContext.userPromptOpened` → used by `dialog`, logged as `info dialog` |
| console (classic) | Chromium without BiDi | `getLogs('browser')` polled on each `logs` call |
| logcat / syslog / crashlog | M | `getLogs('logcat')`, `getLogs('syslog')`, `getLogs('crashlog')` polled on each `logs` call |
| Electron main | Electron | files in the service `logDir`, tailed on each `logs` call |

`logs` prints entries newer than the read cursor, then advances it.

### 9.8 History and export

`history.json` holds `[{ n, time, kind: 'open'|'action'|'exec'|'marker', code, action?, args? }]`.
Written after every successful step (append + fsync).

`export` generates:

```ts
import { browser, $, expect } from '@wdio/globals'

describe('<title, default: session name>', () => {
    it('<title>', async () => {
        await browser.url('http://localhost:3000/')
        await $('aria/Add to cart').click()
        await expect($('aria/Cart (1)')).toBeDisplayed()
    })
})
```

- `open` with a URL becomes `browser.url(url)` (relative to `baseUrl` when
  the session came from a config and the URL starts with it).
- Consecutive `exec` blocks are inserted verbatim (after ref rewriting),
  re-indented; top-level declaration rewriting (§7.2) is not applied to the
  exported code.
- Markers become comments.
- `--framework jasmine` uses the same structure (Jasmine globals).
- `--page-objects`: selectors used via `$()` are grouped by the URL path
  active when the step ran. Each group becomes `pageobjects/<Name>.page.ts`
  (name from the last path segment, PascalCase, `Home` for `/`) with a
  getter per selector (`get addToCart () { return $('aria/Add to cart') }`,
  name from the accessible name or selector, camelCase, deduplicated). The
  spec imports the page objects and uses the getters.
- Refs never appear in exported code; if a `ref(` survives (e.g. built
  dynamically), export fails with `EXEC_ERROR` naming the step.

### 9.9 Project helpers

On start (and `helpers --reload`, and automatically when a file changes,
via `fs.watch` with 200 ms debounce), the daemon imports every
`.wdio/helpers/*.{js,mjs,ts}` file (TypeScript via type stripping, loaded
through a data URL import of the stripped source so relative imports are
rewritten against the file's directory). Each module must export a default
function `(browser: WebdriverIO.Browser) => void | Promise<void>` that
registers custom commands with `browser.addCommand`. Re-loading calls
`browser.overwriteCommand` semantics by first deleting the previously added
command names. `helpers` prints `name (file)` per command. Because helpers
are custom commands, the same files can be imported from a `wdio.conf.ts`
`before` hook; the skill tells agents so.

### 9.10 Trace

`trace/<ts>/` layout mirrors DevTools trace `ndjson-directory` mode for
the parts we produce:

| File | Content |
|---|---|
| `transcript.md` | One section per step: time, action or code, result text, links to resources |
| `trace.trace` | NDJSON `{ type: 'before'\|'after', stepId, time, action, args, code, error? }` |
| `resources/step-<n>.png` | Screenshot after the step (`--screenshots`) |
| `resources/step-<n>-snapshot.txt` | Snapshot after the step (`--snapshots`) |

## 10. Optional dependencies

### 10.1 Resolver (`@wdio/utils`)

```ts
export interface ResolveOptions { cwd?: string, from?: string | URL, global?: boolean }
export function resolveOptionalDependency (name: string, opts?: ResolveOptions): Promise<string | null>
export function importOptionalDependency <T = unknown> (name: string, opts?: ResolveOptions & { feature: string, install?: string[] }): Promise<T>
export class MissingDependencyError extends Error {
    code: 'MISSING_DEPENDENCY'
    package: string
    feature: string
    install: string[]
}
export function detectPackageManager (cwd?: string): 'npm' | 'pnpm' | 'yarn' | 'bun'
export function installCommand (pkg: string, opts?: { dev?: boolean, cwd?: string }): string
```

Resolution order (same as `determineAppiumCliCommand` today):

1. `<cwd>/node_modules` (the user's project),
2. the resolving package's own location (`from`, default the caller's
   `import.meta.url`),
3. the global npm prefix (`npm config get prefix` + `lib/node_modules`),
   only when `global: true`.

`detectPackageManager`: `packageManager` field in the nearest
`package.json`, else lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`/`bun.lockb`,
`package-lock.json`), else `npm_config_user_agent`, else `npm`.
`installCommand`: `npm i -D x`, `pnpm add -D x`, `yarn add -D x`,
`bun add -d x`.

`@wdio/appium-service` `determineAppiumCliCommand` and
`Launcher._getAppiumCommand` switch to this resolver; their messages keep the
same wording where tests assert it.

### 10.2 Dependency table (`@wdio/session` `deps.ts`)

| Feature | Package / binary | Version | Checked at | Install hint |
|---|---|---|---|---|
| `android`, `ios`, `macos`, `windows` targets | `appium` (global allowed) | `^3` | `open`, `doctor` | `<pm> add -D appium@^3` |
| Android | Appium driver `uiautomator2` | | `open` (after Appium) | `npx appium driver install uiautomator2` |
| iOS | Appium driver `xcuitest` | | | `npx appium driver install xcuitest` |
| macOS | Appium driver `mac2` | | | `npx appium driver install mac2` |
| Windows | Appium driver `windows` | | | `npx appium driver install --source=npm appium-windows-driver` |
| `electron` target | `@wdio/electron-service` | | `open` | `<pm> add -D @wdio/electron-service` |
| `electron` target | `electron` (only for entry point targets) | | `open` | `<pm> add -D electron` |
| `tauri` target | `@wdio/tauri-service`, binary `tauri-driver` | | `open` | `<pm> add -D @wdio/tauri-service`, `cargo install tauri-driver --locked` |
| `dioxus` target | `@wdio/dioxus-service`, binary `wdio-dioxus-driver` (Windows external provider) | | `open` | `<pm> add -D @wdio/dioxus-service` |
| `visual *` | `@wdio/visual-service` | | first `visual` action, `doctor` | `<pm> add -D @wdio/visual-service` |
| `--tunnel` | provider tunnel package (§5.7) | | `open` | `<pm> add -D <pkg>` |
| `record` without screencast support | binary `ffmpeg` | | `record stop` (soft: falls back to frames) | OS-specific note |
| Linux desktop targets without display | `Xvfb` or `weston` binary | | `open` | `sudo apt-get install -y xvfb` |

Installed Appium drivers are read with `node <appium> driver list --installed --json`
(5 s timeout; parse keys of the returned object).

All checks run in the CLI process before spawning. Driver checks are skipped
with `--appium-url` (remote server) and for cloud providers.

### 10.3 Error rendering

```
✖ Cannot open an Android session: Appium is not installed.

  Install it in your project:   pnpm add -D appium@^3
  Then add the Android driver:  npx appium driver install uiautomator2

  Or run `wdio session doctor android` to check your whole setup.
```

Exit code `3`. JSON form in §4.4.

## 11. Integrations

### 11.1 Visual service

- Loaded with `importOptionalDependency('@wdio/visual-service')`.
- Set up once per session on first use:
  `new VisualService({ baselineFolder, screenshotPath, autoSaveBaseline: true, formatImageName: '{tag}-{platformName}-{browserName}-{width}x{height}' }).remoteSetup(browser)`.
  `baselineFolder` = `<cwd>/.wdio/visual/baseline`, `screenshotPath` =
  `<artifacts>/visual`. When opened from a config with a `visual` service
  entry, its options are used instead (with our paths only as fallbacks).
- `check*` results are read from the returned mismatch percentage; the diff
  image path is found in `<screenshotPath>/diff/…` using the same image name
  the service reports.
- Compatibility: the published service currently peers on WebdriverIO 9. If
  it does not work with v10 during implementation, the fix goes upstream to
  `webdriverio/visual-testing`; `visual` actions then document the minimum
  service version (§17).

### 11.2 Electron

- `const { startWdioSession, createElectronCapabilities, cleanupWdioSession } = await importOptionalDependency('@wdio/electron-service')`.
- Capabilities: `createElectronCapabilities({ appBinaryPath | appEntryPoint, appArgs })`
  merged with `--capabilities`; `webSocketUrl: true` unless `--no-bidi`;
  `wdio:electronServiceOptions.logDir = <artifacts>/electron-logs`.
- `browser = await startWdioSession([caps], { rootDir: cwd })`.
- Shutdown: `await cleanupWdioSession(browser)`.
- `exec` exposes `browser.electron.*` (added by the service).
- `logs --source main` tails the service log files.

### 11.3 Tauri and Dioxus

- Tauri: if `@wdio/tauri-service` exports a standalone `startWdioSession`,
  use it like Electron. Otherwise start `tauri-driver --port <free>` as a
  child process, then `remote({ hostname: 'localhost', port, capabilities: { browserName: 'wry', 'tauri:options': { application: <path> } } })`.
- Dioxus: same pattern with `@wdio/dioxus-service` / `wdio-dioxus-driver`.
- These paths are unit-tested (capabilities, process arguments, dependency
  errors) and not run end to end in this repo's CI.

### 11.4 Appium

- Without `--appium-url`: resolve Appium (§10), pick a free port, spawn
  `node <appium main> --port <p> --base-path / --log <artifacts>/appium.log --log-no-colors`,
  wait for `GET /status` 200 (60 s), stop it on shutdown (SIGTERM, then
  SIGKILL after 5 s).
- With `--appium-url`: parse into `protocol/hostname/port/path`, no driver
  checks.
- Mobile web sessions use the same server.

### 11.5 Display server

Linux desktop targets without a display call
`startDisplayDaemonFromConfig({ displayServer: 'auto' })` from
`@wdio/display-server` (a workspace package; added as a dependency of
`@wdio/session` because it is small and has no heavy dependencies) and stop
it on shutdown. Headed browser sessions on Linux without a display do the
same.

## 12. Test runner and REPL bridge

### 12.1 `wdio repl --session <name>`

- `repl` becomes `repl [option] [capabilities]`; `option` is required unless
  `--session` is given.
- With `--session`, no new browser is started. A `node:repl` server runs
  with a custom `eval` that sends each input as an `exec` request (with
  `--no-history`) and prints the rendered result. `.exit` leaves the session
  running and prints `Detached from "x" (still running)`.
- Works with piped stdin (non-TTY), which the tests use.

### 12.2 `wdio run --debug=agent`

- New `run` flag `--debug <mode>`, only `agent` for now.
- When set:
  - framework timeouts are raised to 24 h (Mocha `timeout`, Jasmine
    `defaultTimeoutInterval`, Cucumber `timeout`), like the documented
    advice for `browser.debug()`;
  - `browser.debug()` in a worker starts a `SessionServer` around the
    worker's existing browser object instead of the REPL, with the session
    name `debug-<cid>` (e.g. `debug-0-0`) and `platform` derived from the
    capabilities;
  - after a failing test (runner `afterTest` with `passed === false`), the
    worker pauses the same way before the next hook runs.
- The launcher prints (stderr): `Paused in <spec> › <test>. Inspect with \`wdio session -s debug-0-0 snapshot\`, continue with \`wdio session -s debug-0-0 resume\`.`
- `resume` resolves the pause promise, closes the socket and state file,
  and does not end the browser session. `close` on a debug session behaves
  like `resume` and then fails the current test with
  `Session closed from wdio session`.
- Multiple paused workers each get their own session name; `list` shows
  them with target `wdio run (<spec>)`.

## 13. Doctor, skill and project scaffolding

### 13.1 `doctor`

`wdio session doctor [target] [--json]`. Without a target it checks
everything; with a target only what that target needs.

| Check id | Status rules |
|---|---|
| `node` | fail if `< 22.19.0` |
| `webdriverio` | ok with version |
| `runtime-dir` | fail if not writable |
| `sessions` | warn per stale session (and removes it) |
| `browser:<chrome\|firefox\|edge\|safari>` | ok if installed (path), warn "downloaded on first use" otherwise; safari fail off macOS |
| `display` (Linux) | ok if `DISPLAY`/`WAYLAND_DISPLAY`, ok if Xvfb/weston available, warn otherwise |
| `appium` | ok with version ≥ 3, fail if missing or < 3 |
| `appium-driver:<name>` | per target |
| `android-sdk` | `ANDROID_HOME`/`ANDROID_SDK_ROOT` and `adb` on PATH |
| `xcode` (macOS) | `xcrun simctl help` succeeds |
| `package:<name>` | optional packages from §10.2, with version |
| `binary:<name>` | `tauri-driver`, `ffmpeg` |
| `credentials:<provider>` | env var names present (values never printed) |

Text output: one line per check `✔ node 24.4.0`, `⚠ …`, `✖ … → fix: …`.
JSON: `{ ok, checks: [{ id, status: 'ok'|'warn'|'fail', message, fix? }] }`.
Exit `1` if any check fails.

### 13.2 Skill (`src/skill/SKILL.md`)

Frontmatter `name: wdio-session`, `description: Drive browsers, mobile apps
and desktop apps with WebdriverIO from the shell to explore UI, verify
changes and write tests.` Sections:

1. When to use it (and when to use `curl`/fetch instead).
2. Start: `open` examples for each platform; reuse the `default` session;
   use `-s` only for parallel work.
3. Observe before acting: `snapshot --interactive`, `find`, `diff`;
   screenshots only for layout.
4. Act: refs from the latest snapshot; re-snapshot after navigation; prefer
   `exec` for multi-step work; v10 rules (always `await`, strict `$`, no
   sync mode, no `browser.element`).
5. Verify with `expect` inside `exec`, `visual check` for looks.
6. Turn it into a test: `export`, run it with `wdio run --spec`.
7. Missing tool? Add a helper in `.wdio/helpers/` instead of long `exec`
   scripts; helpers become custom commands for the test suite.
8. Debugging a failing test: `wdio run --debug=agent`.
9. Errors: exit code table, `doctor`.
10. Clean up: `close` when done.

### 13.3 `create-wdio`

New question after the framework questions: *"Set up coding agent support
(AGENTS.md section and wdio-session skill)?"* (default yes, skipped with
`--yes` → yes). When yes:

- write `.agents/skills/wdio-session/SKILL.md` (copied from
  `@wdio/session`),
- append the "End-to-end tests (WebdriverIO v10)" block from
  `website/docs/AIAgents.md` to `AGENTS.md` (create if missing), with a
  line pointing to the skill,
- add `.wdio/session/` to `.gitignore`.

## 14. Documentation

- New page `website/docs/Session.md` (`id: session`, title "wdio session"):
  what it is, install, a walkthrough per platform (web, Android, Electron),
  observation, refs, exec, visual, export, debugging with `--debug=agent`,
  troubleshooting. Written for agents first (STYLEGUIDE).
- New page `website/docs/session/commands.md` (`id: session-commands`):
  generated-looking but hand-written reference of every action and flag
  (from §5, §6), kept in sync by a unit test that compares the documented
  action list with the registry.
- `website/docs/AIAgents.md`: new section "Let your agent use `wdio session`"
  before the MCP section; project rules mention it.
- `website/docs/repl.md` and `website/docs/Debugging.md`: `--session` and
  `--debug=agent`.
- `packages/wdio-session/README.md`: short overview linking the docs.
- Sidebar entries in `website/_sidebars.json`.

## 15. Homepage

Branch `cb/wdio-session-frontpage-9c46`, stacked on the feature branch.

### 15.1 Placement and copy

New section between the "One API" platforms section and the "Built for
coding agents" section of `website/src/pages/index.tsx`:

- Eyebrow: "wdio session"
- Heading: "One command line. Every screen."
- Text: "Open a browser, a phone or a desktop app and drive it from your
  terminal or your coding agent. Snapshot what is on screen, click by ref,
  check it visually, and export what worked as a test."
- Links: "Read the guide" → `/docs/session`, "Commands" →
  `/docs/session-commands`.

The "Built for coding agents" feature list gains an item
"wdio session: Let agents drive any app from the shell and turn the session
into a test." → `/docs/session`.

All strings use `Translate`/`translate` with ids `homepage.session.*`.

### 15.2 Animation (`website/src/components/home/SessionDemo.tsx`)

Layout (≥ 996 px): a terminal on the left, a stage on the right with three
device frames fanned in depth (browser window, phone, desktop app window).
Animated connector lines (SVG paths with a moving gradient packet, same
technique as `PlatformDiagram`) run from the terminal to the active device.
Below 996 px: terminal on top, a single device frame below that swaps.

Storyboard, 14 s loop (step timings in `SESSION_STEPS`):

| Step | Time | Terminal line | Stage |
|---|---|---|---|
| 1 | 0.0 s | `$ wdio session open chrome localhost:3000` | Browser frame comes to front, page paints (shop header, product card, "Add to cart" button). |
| 2 | 1.6 s | `$ wdio session snapshot` → output lines `button "Add to cart" [ref=e3]` | Ref badges (`e1`, `e2`, `e3`) pop onto elements, staggered 80 ms. |
| 3 | 3.0 s | `$ wdio session click e3` | Ripple on the button, cart badge increments to 1. |
| 4 | 4.2 s | `$ wdio session visual check cart` → `mismatch 0.00%` | Scan line sweeps the frame, green check. |
| 5 | 5.6 s | `$ wdio session open android --app shop.apk` | Stack rotates, phone comes to front; steps 2–4 replay compressed (0.6 s each) on the phone UI. |
| 6 | 8.6 s | `$ wdio session open electron ./dist/shop` | Desktop window comes to front; compressed replay. |
| 7 | 11.6 s | `$ wdio session export > cart.e2e.ts` → `✓ 1 spec · 3 platforms` | Frames fan out side by side, each with a green check; connector lines pulse together. |
| – | 14.0 s | reset | |

Implementation rules:

- React + CSS modules (`home.module.css`), SVG for connectors, no new
  dependencies.
- Timeline driven by a `useTimeline(steps)` hook (extends the existing
  `useStepper` pattern): starts when 30 % visible (IntersectionObserver),
  pauses when hidden or when the tab is hidden, uses `setTimeout` (so
  `emulate clock` can fast-forward it in tests).
- `prefers-reduced-motion: reduce`: no timeline, render the final step
  (all three devices with checks, full terminal transcript).
- Accessibility: the stage is `aria-hidden`, the section has a visually
  hidden `<p>` describing the demo; terminal lines are real text
  (`aria-hidden` too, the description covers it).
- No layout shift: fixed aspect-ratio containers; CLS contribution 0.
- Light and dark theme via existing CSS variables.

### 15.3 Validation

See item 19 in §16.

## 16. Work items and validation

Each item is one or more commits on the feature branch with the tests
listed. "E2E" means `e2e/session/*.test.ts` run by
`pnpm run test:e2e:session` (vitest, real headless Chrome, fixture pages
served by a local static server from `e2e/session/__fixtures__/site/`).
Unit tests live in `packages/<pkg>/tests/` mirroring `src/`.

### Item 0: Environment and scaffolding

- Node from `.nvmrc`, `pnpm install`, `pnpm run setup`.
- `pnpm run create` → `packages/wdio-session`; add to compile lists if
  required by `infra/compiler`.
- `@wdio/cli` `commands/session.ts` registering `wdio session` (lazy import).
- `e2e/session/` with `helpers.ts` (static server, `runSession(args, { stdin, env })`
  wrapper around `node packages/wdio-cli/bin/wdio.js session …` returning
  `{ code, stdout, stderr, json }`, per-test `WDIO_SESSION_DIR` and cwd in a
  temp dir), fixture site (`index.html`, `form.html`, `shadow.html`,
  `frames.html`, `dialogs.html`, `network.html`, `cart.html`), Electron
  fixture app (`__fixtures__/electron-app/main.js`, `index.html` with a
  counter button, `package.json`).
- Root script `test:e2e:session`: `vitest --config ./e2e/vitest.config.ts --run session`.

**Validation**
- `pnpm run setup` exits 0.
- `npx wdio session --help` lists every action of §6.
- `e2e/session/smoke.test.ts`: helpers start the static server and a raw
  `remote()` headless Chrome loads `index.html` (proves the harness).
- `xvfb-run -a npx electron e2e/session/__fixtures__/electron-app/main.js --version`
  or equivalent prints a version (proves Electron runs on the VM).

### Item 1: Optional dependency resolver

Build §10.1, migrate `@wdio/appium-service`, implement `deps.ts` (§10.2)
and the error rendering (§10.3).

**Validation**
- `packages/wdio-utils/tests/node/optionalDependency.test.ts`: resolves
  from cwd, from `from`, from global (mocked `execSync`), returns `null`
  when missing; `importOptionalDependency` throws `MissingDependencyError`
  with `install`; `detectPackageManager` for each lockfile, the
  `packageManager` field and the user agent; `installCommand` per manager.
- `pnpm run test:package @wdio/appium-service` passes unchanged.
- `packages/wdio-session/tests/deps.test.ts`: driver list parsing, missing
  driver → `MISSING_APPIUM_DRIVER`.
- E2E `deps.test.ts`: in an empty temp project with
  `NODE_PATH` unset and a fake global prefix, `open android --app x.apk --json`
  → exit 3, `error.code === 'MISSING_DEPENDENCY'`, `install[0]` matches the
  temp project's package manager, and the runtime dir contains no files for
  the session afterwards. Same for `visual save x` on a running Chrome
  session when `@wdio/visual-service` is hidden (exit 3).

### Item 2: Daemon and lifecycle

Build §9.2–§9.6, targets `chrome`, `firefox`, `edge`, `safari`, remote
endpoint flags, actions `open`, `close`, `list`, `info`, `restart`,
`status`.

**Validation** (E2E `lifecycle.test.ts`)
- `open chrome <fixture url>` exit 0 within the launch timeout; `info --json`
  has a `sessionId` and `bidi: true`.
- 100 sequential `info --json` calls return the same `sessionId`.
- `-s a` and `-s b` run side by side, `list --json` shows both.
- `open` again on `a` → exit 1 `SESSION_EXISTS`; with `--replace` → new
  `sessionId`.
- Kill the Chrome process tree (PIDs from `ps` children of the daemon) →
  within 10 s the daemon PID is gone; `info` → exit 4.
- Kill the daemon with SIGKILL → `list` reports and removes stale state;
  `info` → exit 4.
- `open --idle-timeout 2s` → daemon exits within 5 s of the last request.
- Socket mode is `0600`, runtime dir `0700`; a request with a wrong token
  is rejected (raw socket test).
- `close --all` → no daemon PIDs, no `chromedriver`/`chrome` processes from
  the test remain.
- `open firefox` (download allowed) → `info` reports `firefox`.
- Unit: `state.ts` path selection per platform (Windows pipe name), token
  check, queue `BUSY`, stale detection.

### Item 3: Code mode

Build §7.

**Validation**
- Unit `exec/transform.test.ts`: declarations hoisted (incl.
  destructuring, functions, classes), last expression returned, imports
  rewritten, syntax error positions.
- Unit `exec/serialize.test.ts`: every row of §7.4.
- Unit `exec/hints.test.ts`: every hint pattern; un-awaited warning.
- E2E `exec.test.ts`: `return 1+1` style last value; console ordering with
  warn/error prefixes; `-e`, stdin and file input; TypeScript annotations;
  `const x = 1` then `x + 1` → `2` in a second call; thrown error → exit 1,
  no stack; `await browser.pause(3000)` with `--timeout 500` → `TIMEOUT`,
  then `await browser.getTitle()` works; `browser.element('h1')` → hint
  text; last expression `$('h1').getText()` without await prints the text.

### Item 4: Snapshots, refs, observation

Build §8, actions `snapshot`, `find`, `diff`, `screenshot`, `source`,
`ref()` in exec.

**Validation**
- Unit `snapshot/format.test.ts`, `diff.test.ts`, `selectors.test.ts`.
- E2E `snapshot.test.ts` with golden files in
  `e2e/session/__snapshots__/`: `index.html`, `form.html` (labels, states,
  values, password masking), `shadow.html` (open shadow root),
  `frames.html` (same-origin inline, cross-origin note), hidden elements
  excluded and present with `--all`, `--depth 2` truncation markers,
  `--interactive` output, `--boxes` format.
- Size budget: `snapshot --interactive` of `cart.html` ≤ 1500 chars.
- Refs stable across two snapshots of the same document; after
  `navigate` → old ref gives `REF_STALE`; unknown `e999` → `REF_NOT_FOUND`.
- `find "Add to cart"` prints the line with context; `find nothing-here`
  exit 1.
- `diff` after clicking a button that adds an item shows `+` lines only for
  the new node.
- `screenshot` file starts with the PNG signature and its IHDR size equals
  the viewport × DPR; `screenshot e3` smaller than the viewport; `--full`
  taller than the viewport on a long page.
- `source` writes HTML containing the page title.
- Stable selectors: for each ref in `form.html`, `$(stableSelector)`
  resolves to the same element as the ref (checked via `isEqual`).

### Item 5: Interaction shortcuts

Build §6.4.

**Validation** (E2E `interact.test.ts` on `form.html` and `cart.html`)
- Each action changes the page as expected, verified with `exec` reading
  DOM state (value, checked, selected option, file input `files.length`,
  hover style via `:hover` class toggled by JS, drag result, scroll
  position).
- Round trip: for each action, the printed `→ code` executed via `exec` on
  a freshly reloaded page produces the same DOM state.
- `tap` in Chrome → `NOT_SUPPORTED`.

### Item 6: Contexts, dialogs, emulation, geolocation

Build §6.5 (web parts), §6.6 `geolocation`, §6.7.

**Validation** (E2E `contexts.test.ts`, `emulate.test.ts`)
- `tabs new <url>` → `tabs --json` length 2; `switch 0`, `close 1`.
- `frame e<n>` on `frames.html` then `snapshot` shows iframe content;
  `frame top` restores.
- `dialogs.html`: `alert` → `dialog accept` → page records "accepted";
  `prompt` with `--text` → page records the text; no dialog → exit 1.
- `emulate device "iPhone 15"` + reload → `window.innerWidth` equals the
  descriptor width; `emulate color-scheme dark` + reload →
  `matchMedia('(prefers-color-scheme: dark)').matches`; `emulate clock 2030-01-01T00:00:00Z`
  → `new Date().getUTCFullYear() === 2030`; `--tick 60000` advances by a
  minute; `emulate network offline` → `fetch` rejects; `emulate reset`
  restores all; `geolocation 52.52 13.40` + reload → page reads the
  coordinates.
- `rotate portrait` in Chrome → `NOT_SUPPORTED`.

### Item 7: Logs and network

Build §9.7, §6.3 `logs`, §6.8.

**Validation** (E2E `network.test.ts` on `network.html`)
- Page logs `console.error('boom')` on click → `logs --errors` contains
  `boom` once; a second `logs --errors` does not; `--peek` keeps it.
- Uncaught exception appears with source `page`.
- `requests --failed` lists the request to a closed port; `requests --filter /api/user`
  shows status 200.
- `mock "**/api/user" --body '{"name":"Mocked"}'` → page shows "Mocked";
  `unmock --all` → real value; `--status 500 --once` affects only one
  request; `--abort` → page shows its error state.
- Session opened with `--no-bidi` → `mock` exit 1 `BIDI_REQUIRED`.

### Item 8: State

Build §6.9.

**Validation** (E2E `state.test.ts`)
- `cookies set a 1`, `storage set k v`, `storage set s t --session`,
  `state save state.json` (file has version 1 and the values), `close`,
  new `open`, `state load state.json` → `cookies get a` → `1`,
  `storage get k` → `v`, session storage `s` → `t`.
- `cookies clear` removes all.

### Item 9: History and export

Build §9.8, actions `history`, `export`.

**Validation** (E2E `export.test.ts`)
- Session on `cart.html`: `snapshot`, `click e3`, `exec` with an `expect`
  using `ref('e5')`, then `export --out <tmp>/cart.e2e.ts`.
- The file contains no `ref(`; contains `browser.url`, the stable selector
  of `e3`, the expect.
- Generate a minimal `wdio.conf.ts` in the temp dir (mocha, local runner,
  headless Chrome, `baseUrl` of the fixture server) and run
  `npx wdio run wdio.conf.ts --spec cart.e2e.ts` → exit 0.
- Same with `--page-objects`: page object file exists, spec imports it,
  run passes.
- `history --json` lists steps with kinds; `history --clear` empties it;
  failed exec not recorded; `--no-history` not recorded.

### Item 10: Helpers and config targets

Build §9.9, §5.6.

**Validation** (E2E `helpers.test.ts`, `config.test.ts`)
- `.wdio/helpers/login.ts` registering `browser.addCommand('fillLogin', …)`
  → `exec 'await browser.fillLogin("a","b")'` fills the form; `helpers`
  lists `fillLogin (login.ts)`.
- Edit the helper file (change behavior) → next exec uses the new code
  without reopening (within 1 s).
- Helper with a syntax error → `helpers` reports the file and error;
  other helpers still load.
- `open ./wdio.conf.ts 0` with `baseUrl` → `navigate /cart.html` resolves
  against it; `info` shows the config's capabilities; unsupported service
  in config → note on stderr.

### Item 11: Visual

Build §11.1, §6.10.

**Validation** (E2E `visual.test.ts`, `@wdio/visual-service` installed as
an e2e dev dependency)
- `visual save home` → baseline PNG exists under `.wdio/visual/baseline`.
- `exec` changes the heading color → `visual check home` exit 1
  `VISUAL_MISMATCH`, mismatch > 0, diff file exists.
- `visual accept home` → `visual check home` exit 0, mismatch 0.
- `visual check new-tag` without baseline → exit 0, `Baseline created`.
- `--element e3` compares only that element (changing another element does
  not cause a mismatch).
- `visual list --json` lists tags.
- Hidden package (item 1 harness) → exit 3.

### Item 12: Trace and recording

Build §9.10, §6.11 `trace`, `record`.

**Validation** (E2E `evidence.test.ts`)
- `trace start`, `click e3`, `exec …`, `trace stop` → `transcript.md`
  has two step sections in order; `resources/step-1.png` is a PNG;
  `step-1-snapshot.txt` contains the ref line.
- `record start`, three actions, `record stop` → output file exists, size
  > 0; if screencast unsupported, `frames/` holds ≥ 2 PNGs and, if
  `ffmpeg` is on PATH, the MP4 has `ffprobe` duration > 0.

### Item 13: Electron (plus Tauri and Dioxus wiring)

Build §5.5, §11.2, §11.3, §11.5.

**Validation**
- E2E `electron.test.ts` (Linux uses the display server; skipped with a
  clear message when Electron cannot start):
  - `open electron e2e/session/__fixtures__/electron-app/main.js` exit 0;
    `info` shows platform `electron`.
  - `snapshot --interactive` contains `button "Increment"`.
  - `click <ref>` twice → `exec 'await $("#count").getText()'` → `2`.
  - `exec 'await browser.electron.execute((electron) => electron.app.getName())'`
    → the fixture's name.
  - `visual save app` then `visual check app` → mismatch 0.
  - `logs --source main` shows the fixture's `console.log('main ready')`.
  - `close` → no `electron` processes from the test remain.
- Unit `targets/tauri.test.ts`, `targets/dioxus.test.ts`: capabilities,
  driver process args, missing binary → `MISSING_BINARY`.

### Item 14: Mobile and native desktop through Appium

Build §5.3, §5.4, §8.3, §11.4, mobile rows of §6.4–§6.6, mobile logs.

**Validation** (no simulators on this VM)
- Unit `snapshot/native.test.ts` with golden files from real page-source
  fixtures in `tests/__fixtures__/pagesource/` for Android, iOS, mac2 and
  Windows: roles, names, states, refs, `--interactive`, `--boxes`.
- Unit `snapshot/selectors.test.ts` native candidates and uniqueness.
- Unit `targets/mobile.test.ts`, `targets/desktop.test.ts`: capabilities
  for every flag combination; platform guards (`macos` off macOS →
  `NOT_SUPPORTED`).
- Unit `targets/appium.test.ts`: spawn args, `/status` wait, shutdown
  sequence (mocked child process).
- Integration `e2e/session/appium-stub.test.ts`: a stub WebDriver HTTP
  server (`e2e/session/stub/appium.ts`) implements `POST /session`,
  `GET /source`, `POST /element(s)`, `POST /element/:id/click`,
  `POST /actions`, `POST /execute/sync`, `GET /contexts`, `DELETE /session`,
  and records requests. `open android --appium-url http://localhost:<p>/ --app /tmp/x.apk`
  → `snapshot` renders the stub's Android XML; `tap e2` sends a find with
  the stable selector and a click; `swipe up` sends `POST /actions` with a
  pointer sequence; `app state com.x` sends `mobile: queryAppState`;
  `contexts switch WEBVIEW_1` sends the context switch. Assertions on the
  recorded requests.
- Not verified here: real emulators, simulators and devices.

### Item 15: Cloud providers

Build §5.7.

**Validation**
- Unit `targets/cloud.test.ts`: per provider and region, hub URL,
  options key and fields, labels, tunnel flag handling, missing credentials
  → `MISSING_CREDENTIALS` naming the variables, app upload request (mocked
  `fetch`: URL, method, multipart field names, auth header) and caps
  rewritten with the returned app URL.
- Integration: stub WebDriver server as `--hostname localhost --port <p>`
  override with `--provider browserstack` → recorded `POST /session` body
  contains `bstack:options` with credentials from env.
- Not verified here: real provider accounts.

### Item 16: REPL and test runner bridge

Build §12.

**Validation**
- E2E `repl.test.ts`: `open chrome <url>`, then
  `printf 'await browser.getTitle()\n.exit\n' | npx wdio repl --session default`
  → output contains the fixture title; session still `running` afterwards.
- E2E `debug-agent.test.ts`: temp project with a spec that navigates to
  the fixture, calls `await browser.debug()`, then asserts the page title;
  start `npx wdio run wdio.conf.ts --debug=agent` in the background;
  poll `list --json` until `debug-0-0` appears (≤ 30 s); `exec` returns the
  title; `resume` → the run exits 0. Second spec with a failing assertion:
  the run pauses after the failure, `snapshot` works, `resume` → run exits
  1.
- Unit: runner timeout overrides per framework; `close` on a debug session
  fails the test.

### Item 17: Doctor, skill, scaffolding, docs

Build §13, §14.

**Validation**
- E2E `doctor.test.ts` on this VM: `doctor --json` → `node` ok,
  `browser:chrome` ok, `appium` fail with a `fix`; `doctor android --json`
  lists only Android-related checks; exit 1 when a check fails.
- `skill` output equals `src/skill/SKILL.md`; `skill --install <tmp>`
  writes the file.
- `create-wdio` unit tests: agent support question → files written
  (`.agents/skills/wdio-session/SKILL.md`, `AGENTS.md` block, `.gitignore`
  entry); declining writes nothing.
- Unit `docs.test.ts`: every action in the registry appears in
  `website/docs/session/commands.md` and vice versa.
- `pnpm run docs:generate:en` and `pnpm run docs:check` pass;
  `cd website && pnpm build:en` passes.
- Agent dry run: a fresh subagent receives only `wdio session skill`
  output and the task "Add the blue T-shirt to the cart on
  <fixture url> and write a test for it" and completes it; the exported
  spec passes under `wdio run`. Transcript summary goes into the PR.

### Item 18: Hardening

**Validation**
- `pnpm oxlint packages/wdio-session packages/wdio-cli packages/wdio-utils`
  clean; package typecheck clean.
- `pnpm run test:changed` passes; `pnpm run test:smoke` suites that touch
  the CLI pass; `pnpm run test:typings` passes.
- Multi-remote naming check from `AGENTS.md` prints nothing.
- Overhead benchmark (`e2e/session/bench.ts`, not in CI): 50 `exec -e 1`
  calls, median client round trip ≤ 50 ms above a raw
  `browser.execute('return 1')`; result recorded in the PR.
- Leak check: after the whole e2e suite, no `wdio-session` daemons,
  sockets or state files remain.

### Item 19: Homepage

Build §15.

**Validation**
- `cd website && pnpm build:en` passes; `npx tsc -p website --noEmit`
  passes (or the site's existing typecheck).
- Dogfooding with `wdio session` against `docusaurus serve`:
  - `open chrome http://localhost:3000/ --viewport 1440x900`,
    `emulate clock` and tick through each storyboard step,
    `screenshot` each step (light), then `emulate color-scheme dark` and
    repeat for steps 1, 4, 7.
  - Same at `--viewport 390x844` for steps 1 and 7.
  - `emulate` reduced motion via `--capabilities` Chrome arg
    `--force-prefers-reduced-motion` → only the final state renders.
  - `visual save` baselines for the final state at both widths.
  - `exec` measures CLS with a `PerformanceObserver` over one full loop:
    `< 0.01`.
  - `snapshot` confirms the section heading and the links are present and
    the animated stage is not in the accessibility tree.
- Before/after screenshots and a screen recording of the animation are
  attached to the homepage PR.

## 17. Risks and open questions

| Risk | Mitigation |
|---|---|
| `@wdio/visual-service` peers on WebdriverIO 9 | Test early in item 11; fix upstream if needed; document minimum version. |
| Standalone APIs of Tauri/Dioxus services | Fallback to starting their drivers directly (§11.3). |
| BiDi screencast not implemented by drivers yet | Frame capture fallback (§6.11). |
| Models write pre-v9 WebdriverIO code | Hints (§7.5), skill rules, docs. |
| Orphaned daemons | Idle timeout, watchdog, stale cleanup, `close --all`, leak check in item 18. |
| Windows not covered by CI on this branch | Unit tests for pipe naming and token auth; manual verification requested in the PR. |
| Snapshot code overlaps `@wdio/mcp` | Follow-up: move `snapshot/` into a shared package consumed by both, after v10. |
