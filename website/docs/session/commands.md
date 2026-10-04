---
id: session-commands
title: wdio session commands
description: Every wdio session action and flag, from open through doctor and skill.
slug: /session-commands
---

<!-- Generated from packages/wdio-session/src/actions/specs.ts by `pnpm run docs:session-commands`. Do not edit by hand. -->

Every `wdio session` action. Global flags apply to all of them. The same text is printed by `npx wdio session <action> --help`. The rest of the [WebdriverIO Session](/docs/session) section covers [targets](/docs/session/targets), [snapshots](/docs/session/snapshots), [`exec`](/docs/session/exec), [export](/docs/session/export) and [debugging](/docs/session/debug).

```sh
npx wdio session <action> [arguments] [flags]
```

## Global flags

| Flag | Description |
| --- | --- |
| `-s, --session` | Session name (env WDIO_SESSION, default "default") |
| `--json` | Print one JSON object (env WDIO_SESSION_JSON=1) |
| `--timeout` | Request timeout in ms |
| `-q, --quiet` | Print nothing on success except requested data |
| `--color` | Use --no-color to disable colors |

Exit codes: 0 success, 1 the action or your code failed, 2 usage error, 3 missing dependency or credentials, 4 no session with that name.

## `open`

Start a session: browser, android, ios, macos, windows, electron, tauri, dioxus or a wdio config file.

Starts a background daemon that keeps the session alive until `close`, or until it was idle for --idle-timeout (default 30m). Browsers run headless unless you pass --headed. Prints the session name, the target, the artifacts directory where snapshots, screenshots and exports go, and for a browser opened on a URL the interactive snapshot of that page.

One session per name. Opening a name that is already running fails; use it, close it, or pass --replace. Pass `-s <name>` only when you need two sessions at once.

```sh
npx wdio session open <target> [url]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | chrome \| firefox \| edge \| safari \| android \| ios \| macos \| windows \| electron `<app>` \| tauri `<app>` \| dioxus `<app>` \| `<wdio.conf>` |
| `url` | no | URL to open (browsers), app path (desktop apps) or capability (config) |

**Flags**

| Flag | Description |
| --- | --- |
| `--replace` | Close a running session with the same name first |
| `--launch-timeout <n>` | Milliseconds to wait for the session to become ready |
| `--idle-timeout <value>` | Shut down after this long without requests (e.g. 30m, 0 disables) |
| `--capabilities <value>` | Extra capabilities as JSON or a path to a JSON file |
| `--hostname <value>` | Remote WebDriver host |
| `--port <n>` | Remote WebDriver port |
| `--path <value>` | Remote WebDriver path |
| `--protocol <value>` | Remote WebDriver protocol |
| `--log-level <value>` | WebdriverIO log level written to daemon.log |
| `--bidi` | Request WebDriver BiDi (use --no-bidi to disable) |
| `--headed` | Show the browser window |
| `--headless` | Run without a window (the default for browsers; overrides --headed) |
| `--snapshot` | Print the interactive snapshot of the opened page (use --no-snapshot to skip) |
| `--viewport <value>` | Initial viewport, e.g. 1280x720 |
| `--browser-version <value>` | Browser version |
| `--binary <value>` | Browser binary |
| `--arg <value>` | Extra browser argument. A value that starts with `-` needs `=`, e.g. `--arg=--disable-gpu` (repeatable) |
| `--profile <value>` | Persistent profile directory |
| `--attach <value>` | Attach to a running Chrome/Edge (debugging port or URL) |
| `--app <value>` | App file or cloud app URL |
| `--package <value>` | Android app package |
| `--activity <value>` | Android app activity |
| `--bundle-id <value>` | iOS/macOS bundle id |
| `--browser <value>` | Mobile web browser (chrome, safari) |
| `--device <value>` | Device name |
| `--platform-version <value>` | Platform version |
| `--udid <value>` | Device UDID |
| `--reset` | Use --no-reset to keep app state (appium:noReset) |
| `--full-reset` | appium:fullReset |
| `--orientation <portrait\|landscape>` | Initial orientation |
| `--appium-url <value>` | Use a running Appium server |
| `--app-arg <value>` | Argument passed to a desktop app. A value that starts with `-` needs `=`, e.g. `--app-arg=--no-sandbox` (repeatable) |
| `--chromedriver <value>` | Electron: Chromedriver binary |
| `--electron-version <value>` | Electron: override version detection |
| `--provider <browserstack\|saucelabs\|testingbot\|testmu>` | Cloud provider |
| `--os <value>` | Cloud: desktop OS |
| `--os-version <value>` | Cloud: desktop OS version |
| `--region <value>` | Cloud: Sauce Labs region |
| `--tunnel <value>` | Cloud: start the provider tunnel (or "external") |
| `--tunnel-name <value>` | Cloud: tunnel identifier |
| `--project <value>` | Cloud: project label |
| `--build <value>` | Cloud: build label |
| `--name <value>` | Cloud: session name label |

**Examples**

```sh
# Open headless Chrome on a local app
npx wdio session open chrome http://localhost:3000

# Open Firefox with a visible window
npx wdio session open firefox http://localhost:3000 --headed

# Open an Android app through Appium
npx wdio session open android --app ./app.apk

# Open an installed iOS app
npx wdio session open ios --bundle-id com.example.shop

# Open an Electron app
npx wdio session open electron ./main.js

# Open the first capability of a config
npx wdio session open ./wdio.conf.ts 0

# Open Chrome in a cloud grid
npx wdio session open chrome https://example.com --provider browserstack
```

See also: [`snapshot`](#snapshot), [`close`](#close), [`doctor`](#doctor).

## `close`

End the session and stop its daemon.

On a session opened by `wdio run --debug=agent` this fails the paused test; use `resume` to let it continue.

```sh
npx wdio session close
```

**Flags**

| Flag | Description |
| --- | --- |
| `--all` | Close every session |
| `--clean` | Also delete the artifacts dir |

**Examples**

```sh
# Close the default session
npx wdio session close

# Close every session and delete their artifacts
npx wdio session close --all --clean
```

See also: [`open`](#open), [`list`](#list).

## `list`

List running sessions.

Prints one line per session: name, target, URL and age. Removes state left behind by sessions that died.

```sh
npx wdio session list
```

**Examples**

```sh
# Show every running session
npx wdio session list
```

See also: [`info`](#info), [`status`](#status).

## `info`

Show session details.

Prints the target, browser and version, BiDi support, artifacts directory, and the current URL, title, window size and frame (web) or context and activity (mobile).

```sh
npx wdio session info
```

**Examples**

```sh
# Show where the session is and what it runs
npx wdio session info
```

See also: [`list`](#list), [`get`](#get).

## `restart`

Close and re-open with the same target and flags.

Keeps the recorded history, so `export` still covers the steps from before the restart.

```sh
npx wdio session restart
```

**Examples**

```sh
# Start over with a fresh browser
npx wdio session restart
```

See also: [`open`](#open), [`close`](#close).

## `status`

Exit 0 if the session is running, 4 if not.

```sh
npx wdio session status
```

**Examples**

```sh
# Open a session only when none is running
npx wdio session status || npx wdio session open chrome http://localhost:3000
```

See also: [`list`](#list), [`open`](#open).

## `exec`

Run WebdriverIO code from stdin, -e or a file.

Runs as an async function with `browser`, `$`, `$$`, `expect` and `ref('e3')` in scope. Top-level variables persist between calls. `wdio session` without an action runs `exec` when code is piped on stdin.

Always `await` commands. `$` returns exactly one element and throws StrictSelectorError when more than one matches. Prefer a single action (click, fill, …) when one does the job; use `exec` for loops, conditions and assertions.

```sh
npx wdio session exec [file]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `file` | no | Script file (.js, .ts, .mjs) |

**Flags**

| Flag | Description |
| --- | --- |
| `-e, --eval <value>` | Code to run |
| `--history` | Record the code in the history (use --no-history to skip) |

**Examples**

```sh
# Run a one-liner
npx wdio session exec -e "await browser.getTitle()"

# Assert on the page (single quotes keep the shell away from $)
npx wdio session exec -e 'await expect($("h1")).toHaveText("Cart")'

# Pipe several steps on stdin
npx wdio session <<'JS'
await $('aria/Sign in').click()
await expect(browser).toHaveUrl(expect.stringContaining('/dashboard'))
JS

# Run a script file
npx wdio session exec ./scripts/login.ts
```

See also: [`helpers`](#helpers), [`history`](#history), [`export`](#export).

## `helpers`

List project helpers from .wdio/helpers.

Each file under .wdio/helpers default-exports a function that receives the browser and registers custom commands with addCommand. Helpers load when the session opens, and they become custom commands in the exported test.

```sh
npx wdio session helpers
```

**Flags**

| Flag | Description |
| --- | --- |
| `--reload` | Re-import the helpers |

**Examples**

```sh
# List helpers and the commands they add
npx wdio session helpers

# Pick up edits to a helper
npx wdio session helpers --reload
```

See also: [`exec`](#exec), [`export`](#export).

## `snapshot`

Accessibility snapshot with refs. Applies to web, native mobile, native desktop.

Prints the accessibility tree, one node per line, e.g. `button "Add to cart" [ref=e3]`. Pass a ref to click, fill, get and the other actions. Refs stay valid while the element exists; an action on a removed element fails with REF_STALE.

Every snapshot is written to the artifacts dir. Output longer than --max-chars is printed in parts: the first part, then `--offset <line>` for the next one. `find` searches all of it.

The text layout and the --json shape are experimental and may change in a minor release. The ref syntax and the actions that take a ref stay stable.

```sh
npx wdio session snapshot
```

**Flags**

| Flag | Description |
| --- | --- |
| `--depth <n>` | Maximum depth |
| `--scope <value>` | Only snapshot below this ref or selector |
| `-i, --interactive` | Only interactive elements |
| `--all` | Include hidden elements |
| `--boxes` | Append bounding boxes |
| `--compact` | Drop unnamed nodes that have no content |
| `-u, --urls` | Include link hrefs |
| `--file-only` | Only write the file |
| `--max-chars <n>` | Print up to this many characters at a time (default 8000) |
| `--offset <n>` | Print from this line on, for the next part of a long snapshot |

**Examples**

```sh
# Interactive elements only, the usual first look
npx wdio session snapshot -i

# Whole page with link targets
npx wdio session snapshot --compact --urls

# Only part of the page
npx wdio session snapshot --scope "#checkout" --depth 4

# Act, then look again
npx wdio session click e3 && npx wdio session snapshot -i
```

See also: [`find`](#find), [`diff`](#diff), [`screenshot`](#screenshot).

## `read`

Read the page text as Markdown. Applies to web.

Headings, paragraphs, list items, table rows and links with their URL, from the main content when the page marks it (main, article), else the whole page; navigation, footers and hidden text are left out. Cut at --max-chars (default 6000). Use it to answer "what does the page say"; use snapshot or find for refs to act on.

```sh
npx wdio session read
```

**Flags**

| Flag | Description |
| --- | --- |
| `--scope <value>` | Only read below this ref or selector |
| `--max-chars <n>` | Print up to this many characters (default 6000) |

**Examples**

```sh
# Read the main content
npx wdio session read

# Read one section
npx wdio session read --scope e12
```

See also: [`find`](#find), [`snapshot`](#snapshot), [`get`](#get).

## `find`

Search a fresh snapshot for text. Applies to web, native mobile, native desktop.

Takes a new snapshot and prints each match with the node around it (e.g. the whole list item, so a value next to the match is included), with line numbers and refs, and scrolls the first match into view. Matching ignores case, then spaces ("SO2" finds "SO 2"), then looks for all of the words and for words like them. Text that is only in hidden parts of the page (closed menus, tabs, "Show more") is listed as such. Cheaper than reading a whole snapshot of a large page. -A/-B/-C print plain line context instead, like grep.

```sh
npx wdio session find <text>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `text` | yes | Text to search for |

**Flags**

| Flag | Description |
| --- | --- |
| `--regex` | Treat text as a regular expression |
| `--scope <value>` | Only search below this ref or selector |
| `-C, --context <n>` | Lines of context before and after instead of the surrounding node |
| `-A, --after-context <n>` | Lines of context after each match |
| `-B, --before-context <n>` | Lines of context before each match |

**Examples**

```sh
# Find the ref of a button
npx wdio session find "Add to cart"

# List every link
npx wdio session find "^\s*link" --regex --context 0
```

See also: [`snapshot`](#snapshot), [`wait`](#wait).

## `diff`

Diff a fresh snapshot against the previous one. Applies to web, native mobile, native desktop.

Prints a unified diff of what changed since the last snapshot, or "No changes". The first call stores a baseline. Use it after an action to see what the action did without reading the whole page again.

```sh
npx wdio session diff
```

**Flags**

| Flag | Description |
| --- | --- |
| `--baseline <value>` | Snapshot file to compare with |
| `--scope <value>` | Only snapshot within this ref or selector, like `snapshot --scope` |
| `--interactive` | Only interactive elements, like `snapshot -i` |

**Examples**

```sh
# See what a click changed
npx wdio session click e7 && npx wdio session diff

# Compare with a saved snapshot
npx wdio session diff --baseline before.yml
```

See also: [`snapshot`](#snapshot), [`find`](#find).

## `screenshot`

Save a PNG of the viewport, an element or the full page. Applies to web, native mobile, native desktop.

Prints the file path and the image size. Take a screenshot when the question is about layout or looks; read text and state with `snapshot` and `get`.

```sh
npx wdio session screenshot [target]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Ref or selector of the element to capture |

**Flags**

| Flag | Description |
| --- | --- |
| `--full` | Full page (web) |
| `--path <value>` | Output file |

**Examples**

```sh
# Capture the viewport
npx wdio session screenshot

# Capture one element
npx wdio session screenshot e5 --path card.png

# Capture the whole page
npx wdio session screenshot --full
```

See also: [`visual`](#visual), [`pdf`](#pdf), [`snapshot`](#snapshot).

## `pdf`

Save the current page as a PDF. Applies to web.

Calls `browser.savePDF`. A BiDi session prints with `browsingContext.print`, headed or headless, in Chrome, Edge and Firefox. A Classic session uses `printPage`, which older Chrome only supports headless.

```sh
npx wdio session pdf [file]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `file` | no | Output file (must end in .pdf) |

**Flags**

| Flag | Description |
| --- | --- |
| `--path <value>` | Output file (must end in .pdf) |

**Examples**

```sh
# Write report.pdf in the current directory
npx wdio session pdf report.pdf
```

See also: [`screenshot`](#screenshot).

## `source`

Save the page HTML or app XML. Applies to web, native mobile, native desktop.

Writes the file and prints its path and size. Use it when a snapshot hides what you need, such as attributes for a selector.

```sh
npx wdio session source
```

**Flags**

| Flag | Description |
| --- | --- |
| `--path <value>` | Output file |

**Examples**

```sh
# Save the HTML next to you
npx wdio session source --path page.html
```

See also: [`snapshot`](#snapshot), [`get`](#get).

## `get`

Read text, html, value, an attribute, the title, the URL, a count or a box. Applies to web.

Prints the value, then the WebdriverIO code it ran (`→ …`). Pass -q to print only the value, e.g. to capture it in a shell variable. Read a value before you write an assertion for it.

```sh
npx wdio session get <sub> [target] [name]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | text \| html \| value \| attr \| title \| url \| count \| box |
| `target` | no | Ref or selector (not used for title and url) |
| `name` | no | Attribute name (attr only) |

**Examples**

```sh
# Text of a ref
npx wdio session get text e1

# Current URL
npx wdio session get url

# Only the value, for a shell variable
url=$(npx wdio session get url -q)

# href of a link
npx wdio session get attr e3 href

# How many elements match
npx wdio session get count "aria/Remove"
```

See also: [`is`](#is), [`wait`](#wait), [`exec`](#exec).

## `is`

Check whether an element is visible, enabled or checked. Applies to web.

Prints true or false, then the WebdriverIO code it ran; pass -q to print only the value. The exit code is 0 either way.

```sh
npx wdio session is <sub> <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | visible \| enabled \| checked |
| `target` | yes | Ref or selector |

**Examples**

```sh
# Print true or false
npx wdio session is visible e1

# Check a button by its label
npx wdio session is enabled "aria/Place order"
```

See also: [`get`](#get), [`wait`](#wait).

## `logs`

Print console, page error, network and device logs since the last call. Applies to web, native mobile.

Each call advances a read cursor, so the next call only shows new entries. Run it after an action to see the errors that action caused.

```sh
npx wdio session logs
```

**Flags**

| Flag | Description |
| --- | --- |
| `--errors` | Only errors |
| `--network` | Only network entries |
| `--since <value>` | Only entries newer than this duration (e.g. 30s) |
| `--peek` | Do not advance the read cursor |
| `--source <browser\|driver\|logcat\|syslog\|main>` | Log source |

**Examples**

```sh
# Errors caused by a click
npx wdio session click e4 && npx wdio session logs --errors

# Recent entries, keep them for the next call
npx wdio session logs --since 30s --peek
```

See also: [`requests`](#requests).

## `navigate`

Open a URL. Applies to web.

Accepts `example.com`, full URLs and paths relative to baseUrl. Leaves any frame first. Prints the new URL and title.

```sh
npx wdio session navigate <url>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `url` | yes | URL (relative URLs use baseUrl) |

**Examples**

```sh
# Go to a page and look at it
npx wdio session navigate /cart && npx wdio session snapshot -i

# Open another site
npx wdio session navigate example.com
```

See also: [`back`](#back), [`reload`](#reload), [`wait`](#wait).

## `back`

Go back. Applies to web.

```sh
npx wdio session back
```

**Examples**

```sh
# Go back one page
npx wdio session back
```

See also: [`forward`](#forward), [`navigate`](#navigate).

## `forward`

Go forward. Applies to web.

```sh
npx wdio session forward
```

**Examples**

```sh
# Go forward one page
npx wdio session forward
```

See also: [`back`](#back), [`navigate`](#navigate).

## `reload`

Reload the page. Applies to web.

```sh
npx wdio session reload
```

**Examples**

```sh
# Reload and wait until the network is quiet
npx wdio session reload && npx wdio session wait --load networkidle
```

See also: [`navigate`](#navigate), [`wait`](#wait).

## `wait`

Wait for an element, text, a URL, a load state, a condition or a few milliseconds. Applies to web.

Pass exactly one of: a ref or selector, --text, --url, --load, --fn, or milliseconds. Fails with exit code 1 after --limit.

Prefer a condition over a pause, both here and over `sleep` in a chain. A pause longer than 30 seconds is refused.

```sh
npx wdio session wait [target]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Ref, selector or milliseconds |

**Flags**

| Flag | Description |
| --- | --- |
| `--text <value>` | Wait until the page contains this text |
| `--url <value>` | Wait until the URL matches (substring, or * and ** globs) |
| `--load <value>` | domcontentloaded, load or networkidle |
| `--fn <value>` | Wait until this JavaScript expression is true |
| `--state <value>` | With a target: visible (default), hidden, enabled or disabled |
| `--limit <n>` | Milliseconds to wait (default 10000) |

**Examples**

```sh
# Wait until a ref is visible
npx wdio session wait e1

# Wait until a spinner is gone
npx wdio session wait "aria/Loading" --state hidden

# Act, wait for the result, look again
npx wdio session click e3 && npx wdio session wait --text "Cart (1)" && npx wdio session snapshot -i

# Wait for a URL
npx wdio session wait --url "**/dashboard"

# Wait until no request is in flight
npx wdio session wait --load networkidle

# Pause 500ms
npx wdio session wait 500
```

See also: [`find`](#find), [`is`](#is), [`get`](#get).

## `click`

Click an element. Applies to web, native mobile, native desktop.

Prints what was clicked and, when the click navigated, the new URL. Take a new snapshot before you use refs on the next page. A hidden or covered element fails at once with what is in the way. `x,y` clicks a point of the viewport (pixels from the top left, as in a screenshot) for what has no ref, like a canvas or map.

```sh
npx wdio session click <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12), WebdriverIO selector, or x,y viewport coordinates |

**Flags**

| Flag | Description |
| --- | --- |
| `--double` | Double click |
| `--right` | Right click |
| `--new-tab` | Open the link in a new tab and switch to it |

**Examples**

```sh
# Click a ref from the latest snapshot
npx wdio session click e3

# Click by accessible name
npx wdio session click "aria/Add to cart"

# Click, wait, look again
npx wdio session click e3 && npx wdio session wait --load networkidle && npx wdio session snapshot -i

# Open a link in a new tab
npx wdio session click e8 --new-tab

# Click a point of the viewport, e.g. on a map
npx wdio session click 320,480
```

See also: [`tap`](#tap), [`fill`](#fill), [`wait`](#wait), [`snapshot`](#snapshot).

## `tap`

Tap an element (mobile). Applies to native mobile.

```sh
npx wdio session tap <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Examples**

```sh
# Tap a ref from the latest snapshot
npx wdio session tap e2
```

See also: [`click`](#click), [`long-press`](#long-press), [`swipe`](#swipe).

## `fill`

Replace the value of an input. Applies to web, native mobile, native desktop.

Clears the field first. To type into whatever has focus, use `type`; to send keys like Enter, use `press`.

```sh
npx wdio session fill <target> <text..>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |
| `text` | yes | Text (words after the target are joined with spaces) |

**Examples**

```sh
# Fill a field
npx wdio session fill e2 ada@example.com

# Fill a form and submit it
npx wdio session fill e2 ada@example.com && npx wdio session fill e4 secret && npx wdio session press Enter
```

See also: [`type`](#type), [`press`](#press), [`select`](#select), [`check`](#check).

## `type`

Type into an element or the focused element. Applies to web, native mobile, native desktop.

Sends the text as key presses without clearing anything: `type e2 Ada` types into e2, `type Ada` into whatever has focus. To replace a value, use `fill`.

```sh
npx wdio session type <text..>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `text` | yes | Text (words are joined with spaces). Start with a ref, e.g. `type e2 Ada`, to type into that element instead of the focused one |

**Examples**

```sh
# Type into a field
npx wdio session type e5 hello

# Type into whatever has focus
npx wdio session focus e5 && npx wdio session type "hello"
```

See also: [`fill`](#fill), [`press`](#press), [`focus`](#focus).

## `press`

Press keys, e.g. Enter, Control+a. Applies to web, native desktop.

Combine keys with +. Names ignore case; ctrl, cmd, esc, up, down, left and right are accepted as short forms.

```sh
npx wdio session press <keys>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `keys` | yes | Key combination |

**Flags**

| Flag | Description |
| --- | --- |
| `--times <n>` | Press it this many times (up to 100), e.g. to move a slider |

**Examples**

```sh
# Submit a form
npx wdio session press Enter

# Move a focused slider five steps
npx wdio session press ArrowRight --times 5

# Select all
npx wdio session press Control+a

# Move focus back
npx wdio session press Shift+Tab
```

See also: [`type`](#type), [`fill`](#fill).

## `select`

Select an option of a `<select>`. Applies to web.

```sh
npx wdio session select <target> <value>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |
| `value` | yes | Option text, value or index |

**Flags**

| Flag | Description |
| --- | --- |
| `--by <text\|value\|index>` | How to match the option (default text) |

**Examples**

```sh
# Select by visible text
npx wdio session select e6 Germany

# Select by value
npx wdio session select e6 de --by value
```

See also: [`fill`](#fill), [`check`](#check).

## `upload`

Set a file input. Applies to web.

The path is relative to your working directory. Target the `<input type="file">` itself, not the button that opens the picker.

```sh
npx wdio session upload <target> <file>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |
| `file` | yes | File to upload |

**Examples**

```sh
# Attach a file
npx wdio session upload e9 ./fixtures/avatar.png
```

See also: [`fill`](#fill).

## `hover`

Move the pointer over an element. Applies to web, native desktop.

```sh
npx wdio session hover <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Examples**

```sh
# Open a hover menu and look at it
npx wdio session hover e4 && npx wdio session snapshot -i
```

See also: [`click`](#click).

## `focus`

Focus an element. Applies to web.

```sh
npx wdio session focus <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Examples**

```sh
# Focus a field before `type`
npx wdio session focus e5
```

See also: [`type`](#type), [`press`](#press).

## `check`

Check a checkbox or radio. Applies to web.

Does nothing when it is already checked, and fails when it does not end up checked.

```sh
npx wdio session check <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Examples**

```sh
# Accept the terms
npx wdio session check e7
```

See also: [`uncheck`](#uncheck), [`is`](#is).

## `uncheck`

Uncheck a checkbox. Applies to web.

Does nothing when it is already unchecked. A selected radio button cannot be unchecked.

```sh
npx wdio session uncheck <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Examples**

```sh
# Opt out of the newsletter
npx wdio session uncheck e7
```

See also: [`check`](#check), [`is`](#is).

## `drag`

Drag an element onto another. Applies to web, native mobile, native desktop.

```sh
npx wdio session drag <from> <to>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `from` | yes | Ref or selector to drag |
| `to` | yes | Ref or selector to drop on |

**Examples**

```sh
# Move a card to another column
npx wdio session drag e3 e9
```

See also: [`scroll`](#scroll).

## `scroll`

Scroll an element into view or the page. Applies to web.

Without a target it scrolls down 600px. Lazy-loaded content shows up in the next snapshot.

```sh
npx wdio session scroll [target]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Ref, selector, up, down, top or bottom |

**Flags**

| Flag | Description |
| --- | --- |
| `--px <n>` | Pixels for up/down (default 600) |

**Examples**

```sh
# Bring an element into view
npx wdio session scroll e40

# Load more results and look at them
npx wdio session scroll bottom && npx wdio session snapshot -i

# Scroll two screens
npx wdio session scroll down --px 1200
```

See also: [`swipe`](#swipe), [`snapshot`](#snapshot).

## `swipe`

Swipe the screen (mobile). Applies to native mobile.

```sh
npx wdio session swipe <direction>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `direction` | yes | up \| down \| left \| right |

**Flags**

| Flag | Description |
| --- | --- |
| `--percent <n>` | Swipe length 0..1 |

**Examples**

```sh
# Scroll a list and look at it
npx wdio session swipe up && npx wdio session snapshot
```

See also: [`scroll`](#scroll), [`tap`](#tap).

## `long-press`

Long press an element (mobile). Applies to native mobile.

```sh
npx wdio session long-press <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref (e12) or WebdriverIO selector |

**Flags**

| Flag | Description |
| --- | --- |
| `--duration <n>` | Milliseconds |

**Examples**

```sh
# Open a context menu
npx wdio session long-press e4 --duration 1500
```

See also: [`tap`](#tap).

## `tabs`

List, open, switch or close tabs. Applies to web.

Without a subcommand it lists tabs with their index; the current one is marked. `new` opens and switches to a tab. `switch` and `close` take an index or handle.

```sh
npx wdio session tabs [sub] [arg]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | switch \| new \| close |
| `arg` | no | Index, handle or URL |

**Examples**

```sh
# List tabs
npx wdio session tabs

# Open a tab
npx wdio session tabs new http://localhost:3000/help

# Go back to the first tab
npx wdio session tabs switch 0

# Close the second tab
npx wdio session tabs close 1
```

See also: [`windows`](#windows), [`frame`](#frame).

## `windows`

List or switch windows. Applies to web, native desktop.

```sh
npx wdio session windows [sub] [arg]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | switch |
| `arg` | no | Index or handle |

**Examples**

```sh
# List windows
npx wdio session windows

# Switch to the second window
npx wdio session windows switch 1
```

See also: [`tabs`](#tabs).

## `frame`

Switch into an iframe, to the parent or to the top. Applies to web.

The page snapshot already shows the content of its iframes, with refs that actions use directly, so `frame` is only needed to work inside one frame for a while or to see a frame the snapshot cut short. Snapshots and actions apply to the current frame until you switch back. `navigate` returns to the top document.

```sh
npx wdio session frame <target>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | yes | Ref, selector, parent or top |

**Examples**

```sh
# Enter an iframe and look inside
npx wdio session frame e12 && npx wdio session snapshot -i

# Go back to the page
npx wdio session frame top
```

See also: [`tabs`](#tabs), [`snapshot`](#snapshot).

## `contexts`

List or switch native/webview contexts. Applies to native mobile.

```sh
npx wdio session contexts [sub] [name]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | switch |
| `name` | no | Context name |

**Examples**

```sh
# List NATIVE_APP and WEBVIEW contexts
npx wdio session contexts

# Drive the webview
npx wdio session contexts switch WEBVIEW_com.example.shop
```

See also: [`snapshot`](#snapshot).

## `dialog`

Accept, dismiss or report an open dialog. Applies to web, native mobile.

An open alert, confirm or prompt blocks other actions, which fail with a hint to run this.

```sh
npx wdio session dialog <sub>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | accept \| dismiss \| status |

**Flags**

| Flag | Description |
| --- | --- |
| `--text <value>` | Prompt text (accept only) |

**Examples**

```sh
# Show the open dialog
npx wdio session dialog status

# Confirm
npx wdio session dialog accept

# Answer a prompt
npx wdio session dialog accept --text "Ada"
```

See also: [`click`](#click).

## `app`

Launch, terminate, install or query an app. Applies to native mobile, native desktop.

```sh
npx wdio session app <sub> <id>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | launch \| terminate \| install \| state |
| `id` | yes | App id, bundle id or file |

**Examples**

```sh
# Restart the app
npx wdio session app terminate com.example.shop && npx wdio session app launch com.example.shop

# Is it running?
npx wdio session app state com.example.shop
```

See also: [`deeplink`](#deeplink), [`background`](#background).

## `deeplink`

Open a deep link. Applies to native mobile.

```sh
npx wdio session deeplink <url>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `url` | yes | URL |

**Flags**

| Flag | Description |
| --- | --- |
| `--package <value>` | Android package or iOS bundle id |

**Examples**

```sh
# Open a product screen
npx wdio session deeplink shop://product/42 --package com.example.shop
```

See also: [`app`](#app).

## `rotate`

Rotate the device. Applies to native mobile.

```sh
npx wdio session rotate <orientation>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `orientation` | yes | portrait \| landscape |

**Examples**

```sh
# Turn the device sideways
npx wdio session rotate landscape
```

## `keyboard`

Hide the on-screen keyboard. Applies to native mobile.

```sh
npx wdio session keyboard <sub>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | hide |

**Examples**

```sh
# Uncover the elements under the keyboard
npx wdio session keyboard hide
```

## `background`

Send the app to the background. Applies to native mobile.

```sh
npx wdio session background <seconds>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `seconds` | yes | Seconds (-1 keeps it there) |

**Examples**

```sh
# Background the app for 3 seconds
npx wdio session background 3
```

See also: [`app`](#app).

## `lock`

Lock the device. Applies to native mobile.

```sh
npx wdio session lock
```

**Examples**

```sh
# Lock the screen
npx wdio session lock
```

See also: [`unlock`](#unlock).

## `unlock`

Unlock the device. Applies to native mobile.

```sh
npx wdio session unlock
```

**Examples**

```sh
# Unlock the screen
npx wdio session unlock
```

See also: [`lock`](#lock).

## `geolocation`

Set the geolocation. Applies to web, native mobile.

```sh
npx wdio session geolocation <lat> <lon>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `lat` | yes | Latitude |
| `lon` | yes | Longitude |

**Flags**

| Flag | Description |
| --- | --- |
| `--accuracy <n>` | Accuracy in meters |

**Examples**

```sh
# Pretend to be in Berlin
npx wdio session geolocation 52.52 13.405
```

See also: [`emulate`](#emulate).

## `emulate`

Emulate a device, viewport, network, cpu, clock or a BiDi emulation scope. Applies to web.

An emulation stays until `emulate reset` or the session ends; setting the same kind again replaces it. `emulate device` without a value lists the device names. Network presets and cpu throttling need a Chromium browser.

```sh
npx wdio session emulate <sub> [value]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | device \| viewport \| network \| cpu \| clock \| color-scheme \| user-agent \| media \| locale \| timezone \| touch \| orientation \| screen \| viewport-meta \| text-layout \| scripting \| scrollbar \| forced-colors \| reset |
| `value` | no | Value for the emulation |

**Flags**

| Flag | Description |
| --- | --- |
| `--dpr <n>` | Device pixel ratio (viewport) |
| `--tick <n>` | Advance the emulated clock by ms (clock) |

**Examples**

```sh
# Emulate a phone
npx wdio session emulate device "iPhone 15"

# Set a viewport
npx wdio session emulate viewport 375x812 --dpr 3

# Go offline
npx wdio session emulate network offline

# Dark mode
npx wdio session emulate color-scheme dark

# Freeze the date
npx wdio session emulate clock 2030-01-01T00:00:00Z

# Reduce motion
npx wdio session emulate media prefersReducedMotion=reduce

# Undo every emulation
npx wdio session emulate reset
```

See also: [`geolocation`](#geolocation), [`screenshot`](#screenshot).

## `requests`

List captured network requests (BiDi). Applies to web.

```sh
npx wdio session requests
```

**Flags**

| Flag | Description |
| --- | --- |
| `--filter <value>` | Substring or glob |
| `--failed` | Only failed requests |
| `--since <value>` | Only requests newer than this duration |
| `--limit <n>` | Maximum lines (default 50) |

**Examples**

```sh
# API calls only
npx wdio session requests --filter "**/api/**"

# Requests a click broke
npx wdio session click e3 && npx wdio session requests --failed --since 10s
```

See also: [`mock`](#mock), [`logs`](#logs).

## `mock`

Mock responses for a URL pattern (BiDi). Applies to web.

Prints the mock id (m1, m2, …). Mocking the same pattern again replaces the earlier mock.

```sh
npx wdio session mock <pattern>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `pattern` | yes | URL pattern |

**Flags**

| Flag | Description |
| --- | --- |
| `--status <n>` | Status code |
| `--body <value>` | Body as JSON/text or a file path |
| `--header <value>` | Header k:v (repeatable) |
| `--abort` | Abort matching requests |
| `--method <value>` | Only this method |
| `--once` | Only the next request |

**Examples**

```sh
# Return fixed JSON
npx wdio session mock "**/api/user" --body '{"name":"Mocked"}'

# Fail the next request
npx wdio session mock "**/api/cart" --status 500 --once

# Block images
npx wdio session mock "**/*.png" --abort
```

See also: [`unmock`](#unmock), [`requests`](#requests).

## `unmock`

Remove mocks. Applies to web.

```sh
npx wdio session unmock [pattern]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `pattern` | no | Pattern or mock id |

**Flags**

| Flag | Description |
| --- | --- |
| `--all` | Remove all mocks |

**Examples**

```sh
# Remove one mock
npx wdio session unmock m1

# Remove every mock
npx wdio session unmock --all
```

See also: [`mock`](#mock).

## `cookies`

Get, set or clear cookies. Applies to web.

Without a subcommand it prints every cookie as name=value. `clear` without a name deletes all cookies.

```sh
npx wdio session cookies [sub] [name] [value]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | get \| set \| clear |
| `name` | no | Cookie name |
| `value` | no | Cookie value |

**Flags**

| Flag | Description |
| --- | --- |
| `--domain <value>` | Cookie domain (set) |
| `--path <value>` | Cookie path (set) |
| `--http-only` | HttpOnly cookie (set) |
| `--secure` | Secure cookie (set) |
| `--same-site <value>` | lax, strict, none or default (set) |
| `--expiry <n>` | Expiry as a Unix timestamp in seconds (set) |

**Examples**

```sh
# List cookies
npx wdio session cookies

# Value of one cookie
npx wdio session cookies get session

# Set a cookie and reload
npx wdio session cookies set session abc && npx wdio session reload

# Delete all cookies
npx wdio session cookies clear
```

See also: [`storage`](#storage), [`state`](#state).

## `storage`

Get, set or clear localStorage (or sessionStorage). Applies to web.

Without a subcommand it prints every entry. `clear` without a key empties the store.

```sh
npx wdio session storage [sub] [key] [value]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | no | get \| set \| clear |
| `key` | no | Key |
| `value` | no | Value |

**Flags**

| Flag | Description |
| --- | --- |
| `--session-storage` | Use sessionStorage |

**Examples**

```sh
# List localStorage
npx wdio session storage

# Set a key
npx wdio session storage set token abc

# Empty sessionStorage
npx wdio session storage clear --session-storage
```

See also: [`cookies`](#cookies), [`state`](#state).

## `state`

Save or load cookies and storage. Applies to web.

`save` writes cookies, localStorage and sessionStorage of the current origin to a JSON file. `load` opens that origin and restores them, e.g. to skip a login.

```sh
npx wdio session state <sub> <file>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | save \| load |
| `file` | yes | State file |

**Examples**

```sh
# Save a logged-in state
npx wdio session state save .wdio/logged-in.json

# Start logged in
npx wdio session state load .wdio/logged-in.json && npx wdio session reload
```

See also: [`cookies`](#cookies), [`storage`](#storage).

## `visual`

Visual snapshots through @wdio/visual-service. Applies to web, native mobile, native desktop.

`save` stores a baseline under .wdio/visual/baseline, `check` compares with it and prints the mismatch, `accept` turns the last actual image into the baseline, `list` shows the tags. Needs @wdio/visual-service in the project.

```sh
npx wdio session visual <sub> [tag]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | save \| check \| accept \| list |
| `tag` | no | Image tag |

**Flags**

| Flag | Description |
| --- | --- |
| `--element <value>` | Only this element |
| `--full` | Full page |
| `--tabbable` | Tabbable page |
| `--threshold <n>` | Allowed mismatch in percent (default 0) |
| `--all` | accept: every tag |

**Examples**

```sh
# Store a baseline
npx wdio session visual save cart

# Compare with it
npx wdio session visual check cart --threshold 0.5

# Accept an intended change
npx wdio session visual accept cart
```

See also: [`screenshot`](#screenshot).

## `trace`

Record every step with screenshots and snapshots.

`stop` prints the trace directory and a transcript of the steps.

```sh
npx wdio session trace <sub>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | start \| stop |

**Flags**

| Flag | Description |
| --- | --- |
| `--screenshots` | Screenshot after each step (use --no-screenshots to skip) |
| `--snapshots` | Snapshot after each step (use --no-snapshots to skip) |

**Examples**

```sh
# Start tracing
npx wdio session trace start

# Stop and print the transcript
npx wdio session trace stop
```

See also: [`record`](#record), [`history`](#history).

## `record`

Record a video. Applies to web, native mobile.

```sh
npx wdio session record <sub>
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `sub` | yes | start \| stop |

**Flags**

| Flag | Description |
| --- | --- |
| `--fps <n>` | Frames per second (default 5) |
| `--path <value>` | Output file |

**Examples**

```sh
# Start recording
npx wdio session record start

# Stop and save the video
npx wdio session record stop --path checkout.mp4
```

See also: [`trace`](#trace), [`screenshot`](#screenshot).

## `history`

Print the recorded steps.

Every action that changes the page records the WebdriverIO code it ran. `export` turns this history into a spec.

```sh
npx wdio session history
```

**Flags**

| Flag | Description |
| --- | --- |
| `--clear` | Clear the history |

**Examples**

```sh
# Show the steps so far
npx wdio session history

# Start the recording over before the steps you want to keep
npx wdio session history --clear
```

See also: [`export`](#export), [`exec`](#exec).

## `export`

Generate a spec from the history.

Writes a describe/it spec with the recorded steps. Refs become stable selectors and helpers become custom commands. Without --out the file goes into the artifacts dir. Run it with `wdio run` to confirm it passes.

```sh
npx wdio session export
```

**Flags**

| Flag | Description |
| --- | --- |
| `--out <value>` | Output file |
| `--title <value>` | Suite title |
| `--page-objects` | Generate page objects |
| `--framework <mocha\|jasmine>` | Framework (default mocha) |

**Examples**

```sh
# Write the spec
npx wdio session export --out test/specs/cart.e2e.ts

# Write the spec and run it
npx wdio session export --out test/specs/cart.e2e.ts && npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
```

See also: [`history`](#history), [`helpers`](#helpers).

## `resume`

Continue a test paused by wdio run --debug=agent.

`wdio run --debug=agent` pauses a failing test and exposes it as session debug-`<worker>`. Inspect it with any action, then resume. `close` on that session fails the test instead.

```sh
npx wdio session resume
```

**Examples**

```sh
# Look at the paused test, then let it continue
npx wdio session -s debug-0-0 snapshot -i && npx wdio session -s debug-0-0 resume
```

See also: [`close`](#close), [`list`](#list).

## `doctor`

Check your environment.

Prints one line per check with a fix for each failure. Exits 1 when a check fails.

```sh
npx wdio session doctor [target]
```

**Arguments**

| Name | Required | Description |
| --- | --- | --- |
| `target` | no | Only check what this target needs |

**Examples**

```sh
# Check everything
npx wdio session doctor

# Check what an Android session needs
npx wdio session doctor android
```

See also: [`open`](#open).

## `skill`

Print the agent skill.

```sh
npx wdio session skill
```

**Flags**

| Flag | Description |
| --- | --- |
| `--install <value>` | Write it to .agents/skills/wdio-session/SKILL.md (or this dir) |

**Examples**

```sh
# Print the skill
npx wdio session skill

# Add it to this project
npx wdio session skill --install .
```
