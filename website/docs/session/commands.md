---
id: session-commands
title: wdio session commands
description: Every wdio session action and flag, from open through doctor and skill.
slug: /session-commands
---

Every `wdio session` action. Global flags apply to all of them. See [wdio session](/docs/session) for a walkthrough.

```sh
npx wdio session <action> [arguments] [flags]
```

## Global flags

| Flag | Description |
| --- | --- |
| `--session`, `-s` | Session name (env `WDIO_SESSION`, default `default`) |
| `--json` | Print one JSON object (env `WDIO_SESSION_JSON=1`) |
| `--timeout` | Request timeout in ms |
| `--quiet`, `-q` | Print nothing on success except requested data |
| `--color`, `--no-color` | Colorize human output |

Exit codes: 0 success, 1 the action failed, 2 usage, 3 a missing dependency or credentials, 4 no session with that name.

## `open`

Start a session: browser, android, ios, macos, windows, electron, tauri, dioxus or a wdio config file.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | chrome \| firefox \| edge \| safari \| android \| ios \| macos \| windows \| electron `<app>` \| tauri `<app>` \| dioxus `<app>` \| `<wdio.conf>` |
| `url` | no | URL to open (browsers), app path (desktop apps) or capability (config) |

**Flags**

| Flag | Description |
| --- | --- |
| `--replace` | Close a running session with the same name first |
| `--launch-timeout` | Milliseconds to wait for the session to become ready |
| `--idle-timeout` | Shut down after this long without requests (e.g. 30m, 0 disables) |
| `--capabilities` | Extra capabilities as JSON or a path to a JSON file |
| `--hostname` | Remote WebDriver host |
| `--port` | Remote WebDriver port |
| `--path` | Remote WebDriver path |
| `--protocol` | Remote WebDriver protocol |
| `--log-level` | WebdriverIO log level written to daemon.log |
| `--bidi` | Request WebDriver BiDi (use --no-bidi to disable) Default: `true`. |
| `--headed` | Show the browser window |
| `--viewport` | Initial viewport, e.g. 1280x720 |
| `--browser-version` | Browser version |
| `--binary` | Browser binary |
| `--arg` | Extra browser argument (repeatable) |
| `--profile` | Persistent profile directory |
| `--attach` | Attach to a running Chrome/Edge (debugging port or URL) |
| `--app` | App file or cloud app URL |
| `--package` | Android app package |
| `--activity` | Android app activity |
| `--bundle-id` | iOS/macOS bundle id |
| `--browser` | Mobile web browser (chrome, safari) |
| `--device` | Device name |
| `--platform-version` | Platform version |
| `--udid` | Device UDID |
| `--reset` | Use --no-reset to keep app state (appium:noReset) |
| `--full-reset` | appium:fullReset |
| `--orientation` | Initial orientation Choices: portrait, landscape. |
| `--appium-url` | Use a running Appium server |
| `--app-arg` | Argument passed to a desktop app (repeatable) |
| `--chromedriver` | Electron: Chromedriver binary |
| `--electron-version` | Electron: override version detection |
| `--provider` | Cloud provider Choices: browserstack, saucelabs, testingbot, testmu. |
| `--os` | Cloud: desktop OS |
| `--os-version` | Cloud: desktop OS version |
| `--region` | Cloud: Sauce Labs region |
| `--tunnel` | Cloud: start the provider tunnel (or "external") |
| `--tunnel-name` | Cloud: tunnel identifier |
| `--project` | Cloud: project label |
| `--build` | Cloud: build label |
| `--name` | Cloud: session name label |

```sh
$0 session open chrome http://localhost:3000
```

Open headless Chrome

```sh
$0 session open android --app ./app.apk
```

Open an Android app through Appium

```sh
$0 session open electron ./main.js
```

Open an Electron app

```sh
$0 session open ./wdio.conf.ts 0
```

Open the first capability of a config

## `close`

End the session and stop its daemon.

**Flags**

| Flag | Description |
| --- | --- |
| `--all` | Close every session |
| `--clean` | Also delete the artifacts dir |

## `list`

List running sessions.

## `info`

Show session details.

## `restart`

Close and re-open with the same target and flags.

## `status`

Exit 0 if the session is running, 4 if not.

## `exec`

Run WebdriverIO code from stdin, -e or a file.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `file` | no | Script file (.js, .ts, .mjs) |

**Flags**

| Flag | Description |
| --- | --- |
| `--e`, `-eval` | Code to run |
| `--history` | Record the code in the history (use --no-history to skip) Default: `true`. |

```sh
$0 session exec -e "await browser.getTitle()"
```

Run a one-liner

```sh
$0 session <<'JS'
await $('aria/Sign in').click()
JS
```

Pipe code on stdin

## `helpers`

List project helpers from .wdio/helpers.

**Flags**

| Flag | Description |
| --- | --- |
| `--reload` | Re-import the helpers |

## `snapshot`

Accessibility snapshot with refs. Applies to web, native mobile, native desktop.

**Flags**

| Flag | Description |
| --- | --- |
| `--depth` | Maximum depth |
| `--scope` | Only snapshot below this target |
| `--interactive`, `-i` | Only interactive elements |
| `--all` | Include hidden elements |
| `--boxes` | Append bounding boxes |
| `--file-only` | Only write the file |
| `--max-chars` | Print inline up to this many characters (default 8000) |

## `find`

Search a fresh snapshot for text. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `text` | yes | Text to search for |

**Flags**

| Flag | Description |
| --- | --- |
| `--regex` | Treat text as a regular expression |
| `--context` | Lines of context (default 2) |

## `diff`

Diff a fresh snapshot against the previous one. Applies to web, native mobile, native desktop.

**Flags**

| Flag | Description |
| --- | --- |
| `--baseline` | Snapshot file to compare with |

## `screenshot`

Save a PNG of the viewport, an element or the full page. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Element to capture |

**Flags**

| Flag | Description |
| --- | --- |
| `--full` | Full page (web) |
| `--path` | Output file |

## `source`

Save the page HTML or app XML. Applies to web, native mobile, native desktop.

**Flags**

| Flag | Description |
| --- | --- |
| `--path` | Output file |

## `get`

Read text, html, value, an attribute, the title, the URL, a count or a box. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | text \| html \| value \| attr \| title \| url \| count \| box Choices: text, html, value, attr, title, url, count, box. |
| `target` | no | Ref or selector (not used for title and url) |
| `name` | no | Attribute name (attr only) |

**Examples**

```sh
$0 session get text e1
```

Text of a ref

```sh
$0 session get url
```

Current URL

```sh
$0 session get attr e3 href
```

href of a link

## `is`

Check whether an element is visible, enabled or checked. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | visible \| enabled \| checked Choices: visible, enabled, checked. |
| `target` | yes | Ref or selector |

**Examples**

```sh
$0 session is visible e1
```

Print true or false

## `logs`

Print console, page error, network and device logs since the last call. Applies to web, native mobile.

**Flags**

| Flag | Description |
| --- | --- |
| `--errors` | Only errors |
| `--network` | Only network entries |
| `--since` | Only entries newer than this duration (e.g. 30s) |
| `--peek` | Do not advance the read cursor |
| `--source` | Log source Choices: browser, driver, logcat, syslog, main. |

## `navigate`

Open a URL. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `url` | yes | URL (relative URLs use baseUrl) |

## `back`

Go back. Applies to web.

## `forward`

Go forward. Applies to web.

## `reload`

Reload the page. Applies to web.

## `wait`

Wait for an element, text, a URL, a load state, a condition or a few milliseconds. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Ref, selector or milliseconds |

**Flags**

| Flag | Description |
| --- | --- |
| `--text` | Wait until the page contains this text |
| `--url` | Wait until the URL matches (substring, or * and ** globs) |
| `--load` | domcontentloaded, load or networkidle |
| `--fn` | Wait until this JavaScript expression is true |
| `--state` | visible (default), hidden, enabled or disabled |
| `--limit` | Milliseconds to wait (default 10000) |

**Examples**

```sh
$0 session wait e1
```

Wait until a ref is visible

```sh
$0 session wait --text Welcome
```

Wait for text

```sh
$0 session wait --url "**/dashboard"
```

Wait for a URL

```sh
$0 session wait 500
```

Pause 500ms

## `click`

Click an element. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Flags**

| Flag | Description |
| --- | --- |
| `--double` | Double click |
| `--right` | Right click |
| `--new-tab` | Open the link in a new tab |

## `tap`

Tap an element (mobile). Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

## `fill`

Replace the value of an input. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |
| `text` | yes | Text |

## `type`

Type into the focused element. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `text` | yes | Text |

## `press`

Press keys, e.g. Enter, Control+a. Applies to web, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `keys` | yes | Key combination |

## `select`

Select an option of a `<select>`. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |
| `value` | yes | Option text, value or index |

**Flags**

| Flag | Description |
| --- | --- |
| `--by` | How to match the option (default text) Choices: text, value, index. |

## `upload`

Set a file input. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |
| `file` | yes | File to upload |

## `hover`

Move the pointer over an element. Applies to web, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

## `focus`

Focus an element. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

## `check`

Check a checkbox or radio. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

## `uncheck`

Uncheck a checkbox. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

## `drag`

Drag an element onto another. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `from` | yes | Source |
| `to` | yes | Destination |

## `scroll`

Scroll an element into view or the page. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Ref, selector, up, down, top or bottom |

**Flags**

| Flag | Description |
| --- | --- |
| `--px` | Pixels for up/down (default 600) |

## `swipe`

Swipe the screen (mobile). Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `direction` | yes | Direction Choices: up, down, left, right. |

**Flags**

| Flag | Description |
| --- | --- |
| `--percent` | Swipe length 0..1 |

## `long-press`

Long press an element (mobile). Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Flags**

| Flag | Description |
| --- | --- |
| `--duration` | Milliseconds |

## `tabs`

List, open, switch or close tabs. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | switch \| new \| close Choices: switch, new, close. |
| `arg` | no | Index, handle or URL |

## `windows`

List or switch windows. Applies to web, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | switch Choices: switch. |
| `arg` | no | Index or handle |

## `frame`

Switch into an iframe, to the parent or to the top. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref, selector, parent or top |

## `contexts`

List or switch native/webview contexts. Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | switch Choices: switch. |
| `name` | no | Context name |

## `dialog`

Accept or dismiss an open dialog. Applies to web, native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | accept \| dismiss Choices: accept, dismiss. |

**Flags**

| Flag | Description |
| --- | --- |
| `--text` | Prompt text |

## `app`

Launch, terminate, install or query an app. Applies to native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | launch \| terminate \| install \| state Choices: launch, terminate, install, state. |
| `id` | yes | App id, bundle id or file |

## `deeplink`

Open a deep link. Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `url` | yes | URL |

**Flags**

| Flag | Description |
| --- | --- |
| `--package` | Android package or iOS bundle id |

## `rotate`

Rotate the device. Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `orientation` | yes | portrait \| landscape Choices: portrait, landscape. |

## `keyboard`

Hide the on-screen keyboard. Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | hide Choices: hide. |

## `background`

Send the app to the background. Applies to native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `seconds` | yes | Seconds (-1 keeps it there) |

## `lock`

Lock the device. Applies to native mobile.

## `unlock`

Unlock the device. Applies to native mobile.

## `geolocation`

Set the geolocation. Applies to web, native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `lat` | yes | Latitude |
| `lon` | yes | Longitude |

**Flags**

| Flag | Description |
| --- | --- |
| `--accuracy` | Accuracy in meters |

## `emulate`

Emulate a device, viewport, network, cpu, clock, color scheme or user agent. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | device \| viewport \| network \| cpu \| clock \| color-scheme \| user-agent \| reset Choices: device, viewport, network, cpu, clock, color-scheme, user-agent, reset. |
| `value` | no | Value for the emulation |

**Flags**

| Flag | Description |
| --- | --- |
| `--dpr` | Device pixel ratio (viewport) |
| `--tick` | Advance the emulated clock by ms |

## `requests`

List captured network requests (BiDi). Applies to web.

**Flags**

| Flag | Description |
| --- | --- |
| `--filter` | Substring or glob |
| `--failed` | Only failed requests |
| `--since` | Only requests newer than this duration |
| `--limit` | Maximum lines (default 50) |

## `mock`

Mock responses for a URL pattern (BiDi). Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `pattern` | yes | URL pattern |

**Flags**

| Flag | Description |
| --- | --- |
| `--status` | Status code |
| `--body` | Body as JSON/text or a file path |
| `--header` | Header k:v (repeatable) |
| `--abort` | Abort matching requests |
| `--method` | Only this method |
| `--once` | Only the next request |

## `unmock`

Remove mocks. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `pattern` | no | Pattern or mock id |

**Flags**

| Flag | Description |
| --- | --- |
| `--all` | Remove all mocks |

## `cookies`

Get, set or clear cookies. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | get \| set \| clear Choices: get, set, clear. |
| `name` | no | Cookie name |
| `value` | no | Cookie value |

**Flags**

| Flag | Description |
| --- | --- |
| `--domain` |  |
| `--path` | Cookie path |
| `--http-only` |  |
| `--secure` |  |
| `--same-site` |  |
| `--expiry` |  |

## `storage`

Get, set or clear localStorage (or sessionStorage). Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | get \| set \| clear Choices: get, set, clear. |
| `key` | no | Key |
| `value` | no | Value |

**Flags**

| Flag | Description |
| --- | --- |
| `--session-storage` | Use sessionStorage |

## `state`

Save or load cookies and storage. Applies to web.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | save \| load Choices: save, load. |
| `file` | yes | State file |

## `visual`

Visual snapshots through @wdio/visual-service. Applies to web, native mobile, native desktop.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | save \| check \| accept \| list Choices: save, check, accept, list. |
| `tag` | no | Image tag |

**Flags**

| Flag | Description |
| --- | --- |
| `--element` | Only this element |
| `--full` | Full page |
| `--tabbable` | Tabbable page |
| `--threshold` | Allowed mismatch in percent (default 0) |
| `--all` | accept: every tag |

## `trace`

Record every step with screenshots and snapshots.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | start \| stop Choices: start, stop. |

**Flags**

| Flag | Description |
| --- | --- |
| `--screenshots` |  Default: `true`. |
| `--snapshots` |  Default: `true`. |

## `record`

Record a video. Applies to web, native mobile.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | start \| stop Choices: start, stop. |

**Flags**

| Flag | Description |
| --- | --- |
| `--fps` | Frames per second (default 5) |
| `--path` | Output file |

## `history`

Print the recorded steps.

**Flags**

| Flag | Description |
| --- | --- |
| `--clear` | Clear the history |

## `export`

Generate a spec from the history.

**Flags**

| Flag | Description |
| --- | --- |
| `--out` | Output file |
| `--title` | Suite title |
| `--page-objects` | Generate page objects |
| `--framework` | Framework (default mocha) Choices: mocha, jasmine. |

## `resume`

Continue a test paused by wdio run --debug=agent.

## `doctor`

Check your environment.

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Only check what this target needs |

## `skill`

Print the agent skill.

**Flags**

| Flag | Description |
| --- | --- |
| `--install` | Write it to .agents/skills/wdio-session/SKILL.md (or this dir) |

