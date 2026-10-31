---
id: tools
title: Tools
description: "Look up the tools exposed by the WebdriverIO MCP server for sessions, navigation, page snapshots, element interaction, Electron, mocking, screenshots, gestures and app lifecycle."
---

The WebdriverIO MCP server exposes 42 tools organized by function. Which of them your client sees depends on the active session and on the groups you enable, so read [Tool visibility](#tool-visibility) before relying on a tool being listed. Each section states any platform or group restriction that applies to its tools.

Every tool except `start_session`, `attach_session`, `launch_chrome`, `list_apps`, `upload_app`, `query_docs` and `enable_tools` also takes an optional `session` argument. It names a live session, either by the `name` it was started with or by its session ID, and you can omit it to use the default session. When you pass `session`, or when more than one session is live, the result starts with a line such as `[session: admin (1a2b3c4d)]` so you can tell which session answered. The sessionless tools do not take `session`, because they either create a session or do not use one.

## Tool visibility

Every tool definition is sent with every model request, so the server hides tools that cannot apply yet. Three things decide what is listed.

**Platform.** Some tools work only on certain platforms. They are listed only while a session of a matching platform is active. With no session active, the browser set applies. The gated tools are:

| Platform      | Tools                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `browser`     | `select_option`, `press_key`                                                                                                                                       |
| `electron`    | `execute_electron_script`, `trigger_electron_deeplink`, `get_accessibility_tree`, `get_elements`                                                                   |
| `ios`, `android` | `tap_element`, `swipe`, `drag_and_drop`, `switch_context`, `get_contexts`, `rotate_device`, `hide_keyboard`, `get_app_state`, `get_elements`                    |

Every other tool is listed on all platforms. `get_elements` is not listed on browser sessions, so read the `wdio://session/current/elements` resource there instead. Calling a tool that does not apply to the active session returns an error rather than running.

**Groups.** Tools that agents rarely need are hidden until their group is enabled with `enable_tools`. A group's tools still have to match the current platform to appear.

| Group        | Tools                                                    | Covers                                                                                  |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `mocks`      | `mock`, `get_mock_calls`, `manage_mock`                  | Mock network requests or Electron APIs                                                  |
| `cookies`    | `get_cookies`, `set_cookie`, `delete_cookies`            | Read, set and delete cookies                                                            |
| `device`     | `emulate_device`, `set_geolocation`                      | Emulate a phone or tablet, fake the location                                            |
| `extensions` | `open_web_extension`                                     | Install and open a browser extension                                                    |
| `attach`     | `launch_chrome`, `attach_session`                        | Launch Chrome with remote debugging, attach to a running WebDriver or Appium session    |
| `elements`   | `get_elements`                                           | Raw element list with bounds                                                            |
| `cloud-apps` | `list_apps`, `upload_app`                                | Upload and list mobile apps on BrowserStack, Sauce Labs, TestMu, TestingBot and Digital.ai |

**Everything up front.** Some clients ignore tool list change notifications. For those, set `WDIO_MCP_TOOLS=all` in the server environment. Every tool is then listed from the start, and the platform and group rules above no longer hide anything. In this mode `enable_tools` is not registered at all, so the server exposes 41 tools instead of 42. Calls to a tool that does not apply to the active session still return an error.

### `enable_tools`

Adds the tools of one or more groups to the list. The enabled groups stay enabled for the rest of the server process, and the tools appear right away in clients that honor tool list changes. Read-only and sessionless.

| Parameter | Type                                                                                              | Required | Description                                            |
| --------- | ------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `groups`  | array of `"mocks" \| "cookies" \| "device" \| "extensions" \| "attach" \| "elements" \| "cloud-apps"` | ✓        | Groups to enable. Pass at least one.                   |

The result names the tools that were added. If none of the tools in the requested groups apply to the current session, it says so instead, for example when you enable `elements` on a browser session.

```js
// Mocks and cookies, for a browser session
enable_tools({ groups: ["mocks", "cookies"] })
```

## Session Management

### `start_session`

Starts a browser, Electron app or mobile app session. By default it closes the active session first. With `onExisting: "keep"` the new session runs alongside the sessions already live, and you target it by `name` through the `session` argument. Browsers run headless at 1280×800 by default; pass `navigationUrl` to open a page right away.

| Parameter              | Type                                                                                                   | Required     | Default          | Description                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                 | string                                                                                                 | —            | —                | Name for this session, unique among live sessions. Target it from other tools with `session: <name>`                                                         |
| `onExisting`           | `"close" \| "keep"`                                                                                    | —            | `"close"`        | `close` replaces the active session. `keep` runs the new session alongside the existing ones and does not make it the default                                |
| `platform`             | `"browser" \| "electron" \| "ios" \| "android"`                                                        | ✓            | —                | Session platform                                                                                                                                             |
| `provider`             | `"local" \| "browserstack" \| "saucelabs" \| "testmu" \| "testingbot" \| "digitalai" \| "external"`    | —            | `"local"`        | Session provider. Cloud providers read credentials from the environment. `external` connects to a W3C WebDriver endpoint set with `webdriverConfig`           |
| `browser`              | `"chrome" \| "firefox" \| "edge" \| "safari"`                                                          | browser only | —                | Browser to launch                                                                                                                                            |
| `browserVersion`       | string                                                                                                 | —            | —                | Browser version on cloud providers; Electron version on `electron` sessions                                                                                                                       |
| `os`                   | string                                                                                                 | —            | —                | Operating system (cloud providers only). Provider-native; see [Cloud Providers](./cloud-providers#operating-system-values)                                   |
| `osVersion`            | string                                                                                                 | —            | —                | OS version (cloud providers only). Provider-native; see [Cloud Providers](./cloud-providers#operating-system-values)                                         |
| `headless`             | boolean                                                                                                | —            | `true`           | Run browser headlessly                                                                                                                                       |
| `windowWidth`          | number                                                                                                 | —            | `1280`           | Browser window width (400–3840)                                                                                                                              |
| `windowHeight`         | number                                                                                                 | —            | `800`            | Browser window height (400–2160)                                                                                                                             |
| `navigationUrl`        | string                                                                                                 | —            | —                | URL to open after starting                                                                                                                                   |
| `electronRootDir`      | string                                                                                                 | conditional  | —                | Project root of the Electron app, used to find Electron Builder or Forge configuration. Electron sessions need this or `capabilities["wdio:electronServiceOptions"].appBinaryPath` / `.appEntryPoint`                                                                       |
| `electronDeeplinkScheme` | string                                                                                               | —            | —                | URI scheme without the colon, such as `"myapp"`. Required before `trigger_electron_deeplink` can run. Stored in lowercase                                   |
| `deviceName`           | string                                                                                                 | mobile only  | —                | Device, emulator or simulator name                                                                                                                           |
| `deviceQuery`          | string                                                                                                 | —            | —                | Digital.ai mobile device query                                                                                                                               |
| `platformVersion`      | string                                                                                                 | —            | —                | Mobile OS version (e.g. `"17.0"`, `"14"`)                                                                                                                    |
| `appPath`              | string                                                                                                 | —            | —                | Local `.app`, `.apk` or `.ipa` to install                                                                                                                    |
| `app`                  | string                                                                                                 | —            | —                | Cloud app URL from `upload_app`: `bs://…` (BrowserStack), `storage:filename=…` (Sauce Labs), `lt://…` (TestMu), `tb://…` (TestingBot), or `cloud:<name>` (Digital.ai) |
| `automationName`       | `"XCUITest" \| "UiAutomator2"`                                                                         | —            | —                | Automation driver (mobile only)                                                                                                                              |
| `autoGrantPermissions` | boolean                                                                                                | —            | `true`           | Auto-grant app permissions (mobile only)                                                                                                                     |
| `autoAcceptAlerts`     | boolean                                                                                                | —            | `true`           | Auto-accept alerts (mobile only)                                                                                                                             |
| `autoDismissAlerts`    | boolean                                                                                                | —            | —                | Auto-dismiss alerts (mobile only)                                                                                                                            |
| `appWaitActivity`      | string                                                                                                 | —            | —                | Android activity to wait for on launch                                                                                                                       |
| `udid`                 | string                                                                                                 | —            | —                | iOS real device UDID                                                                                                                                         |
| `noReset`              | boolean                                                                                                | —            | —                | Preserve app data between sessions                                                                                                                           |
| `fullReset`            | boolean                                                                                                | —            | —                | Uninstall app before and after the session                                                                                                                   |
| `newCommandTimeout`    | number                                                                                                 | —            | `300`            | Appium command timeout (seconds)                                                                                                                             |
| `attach`               | boolean                                                                                                | —            | `false`          | Attach to a running Chrome over CDP, using `attachConfig`. Run `launch_chrome` first                                                                         |
| `attachConfig`         | object                                                                                                 | —            | `{ port: 9222, host: "localhost" }` | CDP connection. Missing keys fall back to these defaults                                                                                    |
| `webdriverConfig`      | object                                                                                                 | `external` only | `{ protocol: "http", hostname: "127.0.0.1", port: 4445, path: "/" }` | W3C WebDriver endpoint for `provider: "external"`. Missing keys fall back to these defaults                       |
| `appiumConfig`         | object                                                                                                 | —            | —                | Local Appium server: `{ host, port, path, protocol }`                                                                                                        |
| `tunnel`               | `boolean \| "external"`                                                                                | —            | `false`          | Cloud providers. `true` starts a tunnel, `"external"` uses one that is already running                                                                       |
| `tunnelName`           | string                                                                                                 | —            | —                | Tunnel identifier name                                                                                                                                       |
| `reporting`            | object                                                                                                 | —            | —                | Cloud provider reporting labels: `{ project, build, session }`                                                                                              |
| `trace`                | boolean                                                                                                | —            | `false`          | Save a Playwright-compatible trace zip to `.trace/` on `close_session`                                                                                       |
| `networkLogs`          | `"none" \| "failures" \| "all"`                                                                        | —            | `"none"`         | Local Chromium performance log capture. The default comes from `WDIO_MCP_NETWORK_LOGS` when set                                                             |
| `region`               | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"`                                                  | —            | `"eu-central-1"` | Sauce Labs data center region                                                                                                                                |
| `capabilities`         | object                                                                                                 | —            | —                | Additional raw capabilities to merge, e.g. `"wdio:electronServiceOptions"`                                                                                   |

```js
// Local Chrome browser
start_session({ platform: "browser", browser: "chrome" })

// A named browser session that runs alongside the active one
start_session({ platform: "browser", browser: "chrome", name: "admin", onExisting: "keep" })

// Browser session with WebDriver BiDi, needed for mocks, emulate_device and open_web_extension
start_session({ platform: "browser", browser: "chrome", capabilities: { webSocketUrl: true } })

// Electron app, with a deeplink scheme for trigger_electron_deeplink
start_session({ platform: "electron", electronRootDir: "/path/to/app", electronDeeplinkScheme: "myapp" })

// iOS simulator
start_session({ platform: "ios", deviceName: "iPhone 16", platformVersion: "18.0", appPath: "/path/to/app.app" })

// BrowserStack Android
start_session({ platform: "android", provider: "browserstack", deviceName: "Samsung Galaxy S24", app: "bs://abc123" })

// Sauce Labs iOS
start_session({ platform: "ios", provider: "saucelabs", deviceName: "iPhone 15", platformVersion: "17.0", app: "storage:filename=MyApp.ipa" })

// TestMu browser
start_session({ platform: "browser", provider: "testmu", browser: "chrome", os: "Windows", osVersion: "11" })

// TestingBot browser
start_session({ platform: "browser", provider: "testingbot", browser: "chrome", os: "Windows", osVersion: "11" })

// Digital.ai Android
start_session({ platform: "android", provider: "digitalai", app: "cloud:<name>" })

// Cloud provider with tunnel
start_session({ platform: "browser", provider: "browserstack", browser: "chrome", tunnel: true })

// Attach to existing Chrome (after launch_chrome; the attach group must be enabled)
start_session({ platform: "browser", browser: "chrome", attach: true })
```

---

### `attach_session`

Attaches to an existing remote WebDriver or Appium session by ID, without creating a new session. It closes the active session unless you pass `onExisting: "keep"`. Given only a `name`, with no `sessionId`, it looks up a session that is already live under that name. Names are scoped to this server process. An externally managed session is detached rather than terminated when it closes, by default. Sessionless and hidden until `enable_tools({ groups: ["attach"] })`. Electron sessions cannot be attached.

| Parameter       | Type                                                                                           | Required | Default   | Description                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------- | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId`     | string                                                                                         | —        | —         | Existing remote WebDriver or Appium session ID. Required unless you only look up a live session by `name`                                   |
| `name`          | string                                                                                         | —        | —         | Name to register the session under, or the name of a live session to look up when `sessionId` is omitted                                    |
| `onExisting`    | `"close" \| "keep"`                                                                            | —        | `"close"` | `close` replaces the active session. `keep` runs the attached session alongside the existing ones                                           |
| `provider`      | `"local" \| "browserstack" \| "saucelabs" \| "testmu" \| "testingbot" \| "digitalai" \| "external"` | —        | `"local"` | Provider hosting the existing session. Use `"external"` for a custom W3C WebDriver endpoint                                                 |
| `platform`      | `"browser" \| "ios" \| "android"`                                                              | with `sessionId` | —    | Platform of the existing session                                                                                                             |
| `browser`       | `"chrome" \| "firefox" \| "edge" \| "safari"`                                                  | —        | `"chrome"` | Browser for local command registration (browser platform only)                                                                              |
| `automationName` | `"XCUITest" \| "UiAutomator2"`                                                                | —        | —         | Appium automation driver for local command registration (mobile only)                                                                        |
| `webdriverConfig` | object                                                                                        | —        | `{ hostname: "127.0.0.1", port: 4445, path: "/", protocol: "http" }` | W3C WebDriver endpoint, with `provider: "external"`                                                    |
| `appiumConfig`  | object                                                                                         | —        | —         | Appium server connection (local provider only): `{ host, port, path, protocol }`                                                            |
| `region`        | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"`                                          | —        | `"eu-central-1"` | Sauce Labs region, with `provider: "saucelabs"`                                                                                       |
| `trace`         | boolean                                                                                        | —        | `false`   | Record a trace for subsequent commands, saved to `.trace/` on `close_session`                                                               |
| `capabilities`  | object                                                                                         | —        | —         | Capabilities used to register the right browser or Appium command surface locally. They are not sent to the remote endpoint                |

```js
// Attach to a session that is already running on a local Appium server
attach_session({ sessionId: "abc123", platform: "android", automationName: "UiAutomator2", name: "device" })

// Look up a session that is already live under a name
attach_session({ name: "device" })
```

---

### `close_session`

Closes or detaches from the current session.

| Parameter | Type    | Required | Default | Description                                                    |
| --------- | ------- | -------- | ------- | -------------------------------------------------------------- |
| `detach`  | boolean | —        | `false` | Disconnect without terminating (preserves app state on Appium) |

Sessions started with `noReset: true` auto-detach by default.

---

### `launch_chrome`

Prepares a Chrome instance with remote debugging enabled so `start_session({ attach: true })` can connect. Sessionless and hidden until `enable_tools({ groups: ["attach"] })`. Two modes:

- `newInstance` (default): opens Chrome alongside your existing one using a separate profile directory; your current session is untouched.
- `freshSession`: launches Chrome with an empty profile (no cookies, no logins). Use `copyProfileFiles: true` to carry over cookies and logins.

| Parameter          | Type                              | Required | Default         | Description                                                      |
| ------------------ | --------------------------------- | -------- | --------------- | ---------------------------------------------------------------- |
| `port`             | number                            | —        | `9222`          | Remote debugging port                                            |
| `mode`             | `"newInstance" \| "freshSession"` | —        | `"newInstance"` | Launch mode                                                      |
| `copyProfileFiles` | boolean                           | —        | `false`         | Copy Chrome Default profile (cookies, logins) into debug session |

After this tool succeeds, call `start_session({ platform: "browser", browser: "chrome", attach: true })`.

## Navigation & Tabs

### `navigate`

Loads a URL in the current tab and waits for the page load event. Resets page state (DOM, JS runtime). **Browser-only.**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `url`     | string | ✓        | URL to navigate to |

---

### `get_tabs`

Lists all browser tabs with handle, title, URL, and which is active. Use before `switch_tab` to find the target handle. **Browser-only.**

No parameters.

---

### `switch_tab`

Focuses a browser tab by window handle or 0-based index. All subsequent tool calls operate on the newly active tab. **Browser-only.**

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `handle`  | string | —        | Window handle to switch to |
| `index`   | number | —        | 0-based tab index (≥ 0)    |

Provide either `handle` or `index`. Get handles from `get_tabs` or `wdio://session/current/tabs`.

---

### `switch_frame`

Switches WebDriver frame context into an iframe by CSS/XPath selector, or back to top-level if selector is omitted. Changes persist; all subsequent `click_element`, `set_value`, `get_elements` calls operate within the switched frame until you switch back. Waits up to 5s for the iframe. **Browser-only.**

| Parameter  | Type   | Required | Description                                                                            |
| ---------- | ------ | -------- | -------------------------------------------------------------------------------------- |
| `selector` | string | —        | CSS/XPath selector for the iframe element. Omit to switch back to the top-level frame. |

```js
// Switch into an iframe
switch_frame({ selector: "#my-iframe" })

// Interact with elements inside the iframe
click_element({ selector: "button.submit" })

// Switch back to top-level
switch_frame()
```

## Element Interaction

### `click_element`

Clicks an element. On web pages the result lists what changed: new elements with refs, or the new page. In apps it does not, so take a snapshot to see the new screen. Several steps in a row belong in one `perform_actions` call.

| Parameter  | Type   | Required | Default | Description                                                                                            |
| ---------- | ------ | -------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `selector` | string | ✓        | —       | Ref from `snapshot` (e.g. `e12`), or a CSS, XPath, `button=Exact text` or `a*=Partial text` selector  |

---

### `set_value`

Replaces the text of an input or textarea. On web pages the result lists what changed. In apps it does not, so take a snapshot to see the new screen. To fill several fields, or fill and then click, use one `perform_actions` call.

| Parameter  | Type   | Required | Default | Description                                                                                            |
| ---------- | ------ | -------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `selector` | string | ✓        | —       | Ref from `snapshot` (e.g. `e12`), or a CSS, XPath, `button=Exact text` or `a*=Partial text` selector  |
| `value`    | string | ✓        | —       | Text to enter into the element                                                                         |

---

### `select_option`

Selects an option of a `<select>` by its text. The result lists what changed on the page. **Browser-only.**

| Parameter  | Type   | Required | Description                                                       |
| ---------- | ------ | -------- | ----------------------------------------------------------------- |
| `selector` | string | ✓        | Ref from `snapshot` (e.g. `e12`), or a selector of the `<select>` |
| `value`    | string | ✓        | Option text to select                                             |

---

### `press_key`

Presses a key or combination in the focused element, such as `Enter`, `Tab`, `Escape` or `Control+a`. The result lists what changed on the page. **Browser-only.**

| Parameter | Type    | Required | Default | Description                                                  |
| --------- | ------- | -------- | ------- | ------------------------------------------------------------ |
| `keys`    | string  | ✓        | —       | Key or combination                                           |
| `times`   | number  | —        | —       | Press it this many times, e.g. to move a slider (1–100)      |

---

### `perform_actions`

Runs several actions in one call, such as filling a form and then submitting it, on the page or app screen. On web pages it returns what each step changed. Put every step of a sequence into one call rather than sending one tool call per step.

Each entry in `actions` names one of these `action` values: `click`, `fill`, `select`, `check`, `uncheck` or `press`. `value` is the text for `fill`, the option for `select` and the keys for `press`. `times` applies to `press` only.

The run stops at the first failure, when a step loads a new page, or before a key press that follows a click, select, check or uncheck that changed the page. Continue with the refs from the new result. Steps the current session does not support are rejected before any step runs.

| Parameter           | Type     | Required | Default | Description                                                                 |
| ------------------- | -------- | -------- | ------- | --------------------------------------------------------------------------- |
| `actions`           | object[] | ✓        | —       | Steps to run in order. At least one                                         |
| `actions[].action`  | string   | ✓        | —       | `"click" \| "fill" \| "select" \| "check" \| "uncheck" \| "press"`          |
| `actions[].selector` | string  | —        | —       | Ref (e.g. `e12`) or selector. Not used by `press`                           |
| `actions[].value`   | string   | —        | —       | Text for `fill`, option for `select`, keys for `press`                      |
| `actions[].times`   | number   | —        | —       | `press` only: repeat count (1–100)                                          |

```js
perform_actions({ actions: [
  { action: "fill", selector: "e4", value: "ada@example.com" },
  { action: "fill", selector: "e5", value: "correct horse" },
  { action: "click", selector: "e6" },
] })
```

---

### `scroll`

Scrolls the page by a number of pixels. **Browser-only.** For mobile, use `swipe`.

| Parameter   | Type             | Required | Default | Description      |
| ----------- | ---------------- | -------- | ------- | ---------------- |
| `direction` | `"up" \| "down"` | ✓        | —       | Scroll direction |
| `pixels`    | number           | —        | `500`   | Pixels to scroll |

## Element Analysis

### `snapshot`

Returns the page or app screen as an accessibility tree with refs, such as `button "Save" [ref=e3]`. This is the primary way to read a page: take a snapshot, then pass a ref such as `e12` to `click_element`, `set_value`, `select_option` or `perform_actions`. Refs from the latest result stay valid until the page changes.

By default the snapshot lists interactive elements only and drops plain text. Pass `full: true` to include text. Pass `find` to return only the parts of the page that contain the text, with their refs. Pass `viewport: true` to limit the snapshot to what is on screen. `find` cannot be combined with `viewport`. Snapshots are capped at 12,000 characters, so use `find` or `scope` to narrow a large page.

| Parameter  | Type    | Required | Default | Description                                                                    |
| ---------- | ------- | -------- | ------- | ------------------------------------------------------------------------------ |
| `find`     | string  | —        | —       | Text to look for. Returns only the matching parts of the page, with refs       |
| `full`     | boolean | —        | `false` | Include text, not just interactive elements                                    |
| `scope`    | string  | —        | —       | Only the part below this ref or selector                                       |
| `viewport` | boolean | —        | `false` | Only what is on screen (not together with `find`)                              |

```js
// Read the page, then act on a ref from the result
snapshot()
click_element({ selector: "e12" })

// Find the part of the page that mentions a term
snapshot({ find: "Shipping address" })
```

---

### `get_elements`

Returns interactable elements on the current page with selectors ready to use. Prefer the `wdio://session/current/elements` resource for ambient awareness; use this tool when you need filtering or pagination.

**Platform:** listed only on `ios`, `android` and `electron` sessions. It is not listed on browser sessions. **Group:** `elements`, so enable it with `enable_tools({ groups: ["elements"] })` first.

| Parameter           | Type    | Required | Default | Description                                 |
| ------------------- | ------- | -------- | ------- | ------------------------------------------- |
| `inViewportOnly`    | boolean | —        | `false` | Only return viewport-visible elements       |
| `includeContainers` | boolean | —        | `false` | Include container elements (divs, sections) |
| `includeBounds`     | boolean | —        | `false` | Include bounding box coordinates            |
| `limit`             | number  | —        | `0`     | Max elements to return (0 = unlimited)      |
| `offset`            | number  | —        | `0`     | Elements to skip (pagination)               |

---

### `get_accessibility_tree`

Returns the accessibility tree with roles, names, and selectors. Supports filtering and pagination. **Listed on Electron sessions:** the platform gating in [Tool visibility](#tool-visibility) lists it only on `electron` sessions. It works in any web context, so with `WDIO_MCP_TOOLS=all` it also runs on browser sessions; it rejects native iOS and Android.

| Parameter | Type     | Required | Default | Description                                                |
| --------- | -------- | -------- | ------- | ---------------------------------------------------------- |
| `limit`   | number   | —        | `0`     | Max nodes to return (0 = unlimited)                        |
| `offset`  | number   | —        | `0`     | Nodes to skip (pagination)                                 |
| `roles`   | string[] | —        | —       | Filter by ARIA roles, e.g. `["button", "link", "heading"]` |

## Screenshots

### `get_screenshot`

Takes a screenshot of the current page or screen. Returns a base64-encoded image, automatically resized and compressed to stay within model context limits (max 1 MB, max 2000px).

No parameters. Prefer `wdio://session/current/elements` over screenshots for element discovery; it's faster and uses far fewer tokens. Use screenshots for visual verification or debugging layout.

## Cookie Management

Cookie tools are hidden until `enable_tools({ groups: ["cookies"] })`.

### `get_cookies`

Returns all cookies for the current session, or a single cookie by name. **Browser-only.**

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `name`    | string | —        | Cookie name. Omit to return all cookies. |

---

### `set_cookie`

Sets a browser cookie. The browser must already be on the target domain — cookies cannot be set cross-domain. Use to inject session tokens or feature flags without going through login flows. **Browser-only.**

| Parameter  | Type                          | Required | Description                                |
| ---------- | ----------------------------- | -------- | ------------------------------------------ |
| `name`     | string                        | ✓        | Cookie name                                |
| `value`    | string                        | ✓        | Cookie value                               |
| `domain`   | string                        | —        | Cookie domain (defaults to current domain) |
| `path`     | string                        | —        | Cookie path (defaults to `/`)              |
| `expiry`   | number                        | —        | Expiry as Unix timestamp (seconds)         |
| `httpOnly` | boolean                       | —        | HttpOnly flag                              |
| `secure`   | boolean                       | —        | Secure flag                                |
| `sameSite` | `"strict" \| "lax" \| "none"` | —        | SameSite attribute                         |

---

### `delete_cookies`

Deletes all cookies or a specific cookie by name. **Browser-only.**

| Parameter | Type   | Required | Description                                        |
| --------- | ------ | -------- | -------------------------------------------------- |
| `name`    | string | —        | Cookie name to delete. Omit to delete all cookies. |

## Touch Gestures (Mobile)

### `tap_element`

Calls `element.tap()` on a matched element or taps at absolute screen coordinates. Use on iOS when `click_element` is ignored; tap is the native gesture iOS responds to. **Mobile-only.**

| Parameter  | Type   | Required | Description                                  |
| ---------- | ------ | -------- | -------------------------------------------- |
| `selector` | string | —        | Element selector                             |
| `x`        | number | —        | X coordinate for screen tap (if no selector) |
| `y`        | number | —        | Y coordinate for screen tap (if no selector) |

Provide either `selector` or `x`/`y` coordinates.

---

### `swipe`

Performs a full-screen swipe gesture. Direction is content movement direction (e.g. `"up"` scrolls a list upward). Use for scrolling beyond visible bounds. For moving a specific element, use `drag_and_drop`. **Mobile-only.** For browsers, use `scroll`.

| Parameter   | Type                                  | Required | Default        | Description                       |
| ----------- | ------------------------------------- | -------- | -------------- | --------------------------------- |
| `direction` | `"up" \| "down" \| "left" \| "right"` | ✓        | —              | Swipe direction                   |
| `duration`  | number                                | —        | `500`          | Swipe duration (ms, 100–5000)     |
| `percent`   | number                                | —        | `0.5` / `0.95` | Fraction of screen to swipe (0–1) |

---

### `drag_and_drop`

Drags an element to another element or coordinates. **Mobile-only.**

| Parameter        | Type   | Required | Default | Description                            |
| ---------------- | ------ | -------- | ------- | -------------------------------------- |
| `sourceSelector` | string | ✓        | —       | Source element to drag                 |
| `targetSelector` | string | —        | —       | Target element to drop onto            |
| `x`              | number | —        | —       | Target X offset (if no targetSelector) |
| `y`              | number | —        | —       | Target Y offset (if no targetSelector) |
| `duration`       | number | —        | —       | Drag duration (ms, 100–5000)           |

## Context Switching (Mobile)

### `get_contexts`

Returns available automation contexts and the currently active one. Use before `switch_context` to discover `NATIVE_APP` and `WEBVIEW_*` targets. **Mobile-only.**

No parameters.

---

### `switch_context`

Switches between native and webview automation contexts in a hybrid mobile app. Required before using CSS/XPath selectors inside an embedded webview. **Mobile-only.**

| Parameter | Type   | Required | Description                                                    |
| --------- | ------ | -------- | -------------------------------------------------------------- |
| `context` | string | ✓        | Context name, e.g. `"NATIVE_APP"`, `"WEBVIEW_com.example.app"` |

Get available context names from `get_contexts` or `wdio://session/current/contexts`.

```js
// 1. Check what's available
get_contexts()
// → { contexts: ["NATIVE_APP", "WEBVIEW_com.example.app"], currentContext: "NATIVE_APP" }

// 2. Switch into the webview for CSS/XPath
switch_context({ context: "WEBVIEW_com.example.app" })

// 3. Interact with webview elements using CSS selectors
click_element({ selector: "#login-button" })

// 4. Switch back to native for native UI
switch_context({ context: "NATIVE_APP" })
```

## Device Control (Mobile)

### `rotate_device`

Rotates the device to portrait or landscape and waits for the OS rotation to complete. Use to test orientation-dependent layouts. **Mobile-only.**

| Parameter     | Type                        | Required | Description        |
| ------------- | --------------------------- | -------- | ------------------ |
| `orientation` | `"PORTRAIT" \| "LANDSCAPE"` | ✓        | Target orientation |

---

### `hide_keyboard`

Dismisses the software keyboard. Call after text entry when the keyboard obscures elements you need next. No-op if already hidden. **Mobile-only.**

No parameters.

---

### `set_geolocation`

Overrides device GPS coordinates for the session. Affects `navigator.geolocation` on web and location services on mobile. Location permissions must be granted to the app beforehand. Hidden until `enable_tools({ groups: ["device"] })`.

| Parameter   | Type   | Required | Description             |
| ----------- | ------ | -------- | ----------------------- |
| `latitude`  | number | ✓        | Latitude (−90 to 90)    |
| `longitude` | number | ✓        | Longitude (−180 to 180) |
| `altitude`  | number | —        | Altitude in metres      |

## App Lifecycle (Mobile)

### `get_app_state`

Returns the current lifecycle state of a mobile app. **Mobile-only.**

| Parameter  | Type   | Required | Description                                                     |
| ---------- | ------ | -------- | --------------------------------------------------------------- |
| `bundleId` | string | ✓        | iOS bundle ID or Android package name, e.g. `"com.example.app"` |

Returns one of: `not installed`, `not running`, `background (suspended)`, `background`, `foreground`.

## Browser Utilities

### `emulate_device`

Emulates a mobile or tablet device in the current browser session (sets viewport, DPR, user-agent, touch events). Requires a BiDi-enabled session: `start_session({ capabilities: { webSocketUrl: true } })`. **Browser-only.** Hidden until `enable_tools({ groups: ["device"] })`.

| Parameter | Type   | Required | Description                                                                                                             |
| --------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `device`  | string | —        | Device preset name (e.g. `"iPhone 15"`, `"Pixel 7"`). Omit to list presets. Pass `"reset"` to restore desktop defaults. |

---

### `execute_script`

Executes JavaScript in the browser or mobile commands via Appium.

| Parameter | Type   | Required | Description                                                   |
| --------- | ------ | -------- | ------------------------------------------------------------- |
| `script`  | string | ✓        | JS code (browser) or Appium command like `"mobile: pressKey"` |
| `args`    | any[]  | —        | Arguments passed to the script or command                     |

**Browser:** use `return` to get values back.

```javascript
// Get page title
execute_script({ script: "return document.title" })

// Scroll element into view
execute_script({ script: "arguments[0].scrollIntoView()", args: ["#my-element"] })
```

**Mobile (Appium):** uses `mobile: <command>` syntax.

```javascript
// Press Android back key
execute_script({ script: "mobile: pressKey", args: [{ keycode: 4 }] })

// Activate app (iOS/Android)
execute_script({ script: "mobile: activateApp", args: [{ bundleId: "com.example.app" }] })

// Deep link (iOS)
execute_script({ script: "mobile: deepLink", args: [{ url: "myapp://route", bundleId: "com.example.app" }] })
```

---

### `open_web_extension`

Installs a web extension through WebDriver BiDi and opens one of its extension pages, so the other tools can inspect and drive its UI. **Browser-only.** Requires a BiDi-enabled session: `start_session({ capabilities: { webSocketUrl: true } })`. Hidden until `enable_tools({ groups: ["extensions"] })`.

Use the `base64` form for cloud or remote sessions where the browser driver cannot read the MCP server's filesystem.

| Parameter               | Type                                                  | Required | Description                                                                                  |
| ----------------------- | ----------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `extensionData`         | object                                                | ✓        | One of `{ type: "path", path }` (unpacked directory), `{ type: "archivePath", path }` (packaged archive), or `{ type: "base64", value }` (base64-encoded archive). Paths are on the remote end |
| `path`                  | string                                                | ✓        | Page inside the extension, such as `options.html` or `popup.html`. Leading slashes are ignored |

```js
// Install an unpacked extension and open its options page
open_web_extension({ extensionData: { type: "path", path: "/tmp/my-extension" }, path: "options.html" })
```

## Electron

Electron tools run only in Electron sessions, started with `start_session({ platform: "electron" })`. They are listed only while such a session is active.

### `execute_electron_script`

Executes JavaScript in the Electron main process, with access to the Electron APIs. This is privileged code execution, so use it only with trusted scripts. **Electron-only.**

| Parameter | Type   | Required | Description                                                                                                  |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| `script`  | string | ✓        | JavaScript body. `electron` gives the Electron APIs, `args` the supplied values, and `return` sends back a result |
| `args`    | any[]  | —        | Values made available to the script as `args[0]`, `args[1]`, and so on                                        |

```js
execute_electron_script({ script: "return electron.app.getName()" })

execute_electron_script({ script: "return args[0] + 1", args: [41] })
```

---

### `trigger_electron_deeplink`

Triggers a deeplink through the running Electron app. The session must have been started with `electronDeeplinkScheme`, and the URL's scheme must match it. Packaged binaries are required for deeplinks on Windows and Linux. **Electron-only.**

| Parameter | Type   | Required | Description                                                                        |
| --------- | ------ | -------- | ---------------------------------------------------------------------------------- |
| `url`     | string | ✓        | Deeplink URI, such as `myapp://route/settings`. Must be a valid URL with the session's scheme |

## Mocking

Mocks are scoped to the session that created them. The three mock tools are hidden until `enable_tools({ groups: ["mocks"] })`. A mock targets either the browser or an Electron API, selected with `mockType`. `mockType` defaults to `browser` in WebDriver sessions and is required in Electron sessions. Appium sessions do not support mocks.

| Parameter    | Type                    | Required                  | Description                                                                       |
| ------------ | ----------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| `mockType`   | `"browser" \| "electron"` | Electron sessions         | Which kind of mock to create or read. Defaults to `browser` in WebDriver sessions |
| `apiName`    | string                  | `electron` mocks          | Electron API module, such as `dialog`, `app` or `clipboard`                       |
| `funcName`   | string                  | `electron` mocks          | API function, such as `showOpenDialog` or `getName`                               |
| `url`        | string                  | `browser` mocks           | URL glob to intercept, such as `**/api/todos`                                      |
| `method`     | string                  | —                         | Browser mocks only: request method filter, such as `get`                          |

### `mock`

Configures a session-scoped mock. Browser mocks intercept the network requests that match `url`. They need a BiDi-enabled session, started with `capabilities: { webSocketUrl: true }`. Electron mocks replace an Electron API function in the main process and need an Electron session.

Omit `behavior` to observe. The mock then records matching requests without altering them, and you read them with `get_mock_calls`. An existing mock keeps its configured behavior when you call `mock` again without one, so use `manage_mock` with `action: "reset"` to return it to observe-only.

| Parameter    | Type                                                                                                              | Required | Default                                              | Description                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `behavior`   | `"mockReturnValue" \| "mockReturnValueOnce" \| "mockResolvedValue" \| "mockResolvedValueOnce" \| "mockRejectedValue" \| "mockRejectedValueOnce"` (Electron), or `"respond" \| "respondOnce" \| "abort" \| "abortOnce" \| "redirect" \| "redirectOnce"` (browser) | — | Electron: `mockReturnValue`. Browser: none (observe) | What the mock does. `Once` behaviors apply to the next matching call only          |
| `value`      | any JSON                                                                                                          | —        | —                                                    | Electron: the value to return, resolve or reject with. Browser `respond`: the response body, required (`""` for an empty body). Browser `redirect`: the target URL, required. Omit for `abort` and observing |
| `statusCode` | number                                                                                                            | —        | —                                                    | Browser `respond` behaviors only: response status code                                                                                                 |
| `headers`    | object of strings                                                                                                 | —        | —                                                    | Browser `respond` behaviors only: response header overrides                                                                                            |

Repeated calls keep the call history. Queued `Once` values survive further `Once` calls, but a later sticky behavior (a non-`Once` behavior such as `respond`, `abort`, `redirect` or `mockResolvedValue`) replaces the queue.

```js
// Observe every request to the API without changing it
mock({ url: "**/api/**" })
get_mock_calls({ url: "**/api/**" })

// Answer GET requests to the API with an empty list
mock({ url: "**/api/todos", method: "get", behavior: "respond", value: "[]", statusCode: 200, headers: { "content-type": "application/json" } })

// Make the next dialog.showOpenDialog call resolve as cancelled, in an Electron session
mock({ mockType: "electron", apiName: "dialog", funcName: "showOpenDialog", behavior: "mockResolvedValueOnce", value: { canceled: true, filePaths: [] } })
```

---

### `get_mock_calls`

Reads the arguments of every recorded call for a mock, with the same target fields as `mock`. Returns `{ "calls": [...], "callCount": n }` as JSON. It fails if no mock exists for that target yet. **Read-only.**

```js
get_mock_calls({ mockType: "electron", apiName: "dialog", funcName: "showOpenDialog" })
```

---

### `manage_mock`

Manages an existing mock, with the same target fields as `mock`. The `action` decides how far the cleanup goes:

| `action`  | Effect                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `clear`   | Removes the call history. The configured behavior stays in place                                          |
| `reset`   | Removes the call history, the configured behavior and any queued `Once` values. The mock keeps observing  |
| `restore` | Reinstates the original behavior and releases the mock. A later `mock` call creates it again              |

```js
manage_mock({ url: "**/api/todos", action: "restore" })
```

## Cloud Providers

### `list_apps`

Lists apps uploaded to a cloud provider (BrowserStack App Automate, Sauce Labs App Storage, TestMu, TestingBot Storage or Digital.ai Applications). Reads provider-specific credentials from the environment. Sessionless and hidden until `enable_tools({ groups: ["cloud-apps"] })`.

| Parameter          | Type                                                                                       | Required | Default          | Description                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------ | -------- | ---------------- | --------------------------------------------------------------------------- |
| `provider`         | `"browserstack" \| "saucelabs" \| "testmu" \| "testingbot" \| "digitalai"`                  | ✓        | —                | Cloud provider                                                              |
| `sortBy`           | `"app_name" \| "uploaded_at"`                                                               | —        | `"uploaded_at"`  | Sort order                                                                  |
| `organizationWide` | boolean                                                                                    | —        | `false`          | (BrowserStack only) List apps uploaded by all users in the organization      |
| `limit`            | number                                                                                     | —        | `20`             | Max results. Applies when `organizationWide` is `true`                      |
| `region`           | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"`                                      | —        | `"eu-central-1"` | Sauce Labs region                                                           |

```js
// List apps on each provider
list_apps({ provider: "browserstack" })
list_apps({ provider: "saucelabs", region: "us-west-1" })
list_apps({ provider: "testmu" })
list_apps({ provider: "testingbot" })
list_apps({ provider: "digitalai" })
```

---

### `upload_app`

Uploads a local `.apk` or `.ipa` to a cloud provider (BrowserStack, Sauce Labs, TestMu, TestingBot or Digital.ai). Returns the app URL for use in `start_session`. Sessionless and hidden until `enable_tools({ groups: ["cloud-apps"] })`.

| Parameter  | Type                                                                                       | Required | Default          | Description                                      |
| ---------- | ------------------------------------------------------------------------------------------ | -------- | ---------------- | ------------------------------------------------ |
| `provider` | `"browserstack" \| "saucelabs" \| "testmu" \| "testingbot" \| "digitalai"`                  | ✓        | —                | Cloud provider                                   |
| `path`     | string                                                                                     | ✓        | —                | Absolute path to the `.apk` or `.ipa` file       |
| `customId` | string                                                                                     | —        | —                | Optional custom ID for referencing the app later |
| `region`   | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"`                                      | —        | `"eu-central-1"` | Sauce Labs region                                |

```js
// Upload to each provider
upload_app({ provider: "browserstack", path: "/path/to/app.apk" })
upload_app({ provider: "saucelabs", path: "/path/to/app.ipa", region: "us-west-1" })
upload_app({ provider: "testmu", path: "/path/to/app.apk" })
upload_app({ provider: "testingbot", path: "/path/to/app.apk" })
upload_app({ provider: "digitalai", path: "/path/to/app.apk" })
```

## Documentation

### `query_docs`

Searches the official WebdriverIO documentation and returns the most relevant excerpts, each with its page title, section trail, `path` and score. The corpus is fetched on first use and cached locally. Sessionless, read-only, and listed on every platform. Results come back in TOON format.

Query with 2 to 3 distinctive keywords, not a sentence. `appium setup`, `devtools trace.zip` and `allure reporter` each return the right page first, while a full question dilutes the ranking. A word can also collide with an unrelated page: `wire` matches Wire Protocol, so if a query misses, retry with the exact page title. To browse instead of searching, read the `wdio://docs/index` resource for every page title and slug, then `wdio://docs/page/{slug}` for one page in full.

Cite the `path` of any page you rely on.

| Parameter  | Type    | Required | Default | Description                                                                        |
| ---------- | ------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `query`    | string  | ✓        | —       | 2–3 distinctive keywords: an API name, config key, page title or feature           |
| `limit`    | number  | —        | `5`     | Number of results (1–20)                                                           |
| `fullPage` | boolean | —        | `false` | Return the full matched pages instead of excerpts                                  |

```js
query_docs({ query: "appium setup" })
query_docs({ query: "devtools trace.zip", fullPage: true, limit: 3 })
```
