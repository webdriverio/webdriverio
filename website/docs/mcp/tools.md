---
id: tools
title: Tools
---

The WebdriverIO MCP server exposes 29 tools organized by function. Tools marked **browser-only** require a `platform: "browser"` session. Tools marked **mobile-only** require `platform: "ios"` or `platform: "android"`.

## Session Management

### `start_session`

Starts a new browser or mobile automation session. Only one active session at a time; starting a new one closes the existing one.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `platform` | `"browser" \| "ios" \| "android"` | ✓ | — | Session platform |
| `provider` | `"local" \| "browserstack" \| "saucelabs" \| "testmu"` | — | `"local"` | Session provider |
| `browser` | `"chrome" \| "firefox" \| "edge" \| "safari"` | browser only | — | Browser to launch |
| `browserVersion` | string | — | latest | Browser version (cloud providers only, default: latest) |
| `os` | string | — | — | Operating system (cloud providers only, e.g. `"Windows"`, `"OS X"`) |
| `osVersion` | string | — | — | OS version (cloud providers only, e.g. `"11"`, `"Sequoia"`) |
| `headless` | boolean | — | `true` | Run browser headlessly |
| `windowWidth` | number | — | `1920` | Browser window width (400–3840) |
| `windowHeight` | number | — | `1080` | Browser window height (400–2160) |
| `navigationUrl` | string | — | — | URL to navigate to after starting |
| `deviceName` | string | mobile only | — | Device/emulator/simulator name |
| `platformVersion` | string | — | — | OS version (e.g. `"17.0"`, `"14"`) |
| `appPath` | string | — | — | Path to `.app` / `.apk` / `.ipa` |
| `app` | string | — | — | App URL (`bs://...` for BrowserStack, `storage:filename=` for Sauce Labs, `lt://...` for LambdaTest) or custom_id |
| `automationName` | `"XCUITest" \| "UiAutomator2"` | — | auto | Automation driver |
| `autoGrantPermissions` | boolean | — | `true` | Auto-grant app permissions |
| `autoAcceptAlerts` | boolean | — | `true` | Auto-accept alerts |
| `autoDismissAlerts` | boolean | — | `false` | Auto-dismiss alerts |
| `appWaitActivity` | string | — | — | Android activity to wait for on launch |
| `udid` | string | — | — | iOS real device UDID |
| `noReset` | boolean | — | — | Preserve app data between sessions |
| `fullReset` | boolean | — | — | Uninstall app before/after session |
| `newCommandTimeout` | number | — | `300` | Appium command timeout (seconds) |
| `attach` | boolean | — | `false` | Attach to existing Chrome via CDP |
| `attachConfig` | object | — | — | CDP connection: `{ port: 9222, host: "localhost" }` |
| `appiumConfig` | object | — | — | Appium server: `{ host, port, path }` |
| `tunnel` | `boolean \| "external"` | — | `false` | Local tunnel routing (cloud providers). `true` = auto-start, `"external"` = tunnel already running externally |
| `reporting` | object | — | — | Cloud provider reporting labels: `{ project, build, session }` |
| `trace` | boolean | — | `false` | Enable trace recording — produces a Playwright-compatible `.trace` zip |
| `region` | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"` | — | `"eu-central-1"` | Sauce Labs data center region |
| `tunnelName` | string | — | — | Tunnel identifier name (required for `tunnel: "external"`) |
| `capabilities` | object | — | — | Additional raw capabilities to merge |

```
// Local Chrome browser
start_session({ platform: "browser", browser: "chrome" })

// iOS simulator
start_session({ platform: "ios", deviceName: "iPhone 16", platformVersion: "18.0", appPath: "/path/to/app.app" })

// BrowserStack Android
start_session({ platform: "android", provider: "browserstack", deviceName: "Samsung Galaxy S24", app: "bs://abc123" })

// Sauce Labs iOS
start_session({ platform: "ios", provider: "saucelabs", deviceName: "iPhone 15", platformVersion: "17.0", app: "storage:filename=MyApp.ipa" })

// LambdaTest browser
start_session({ platform: "browser", provider: "testmu", browser: "chrome", os: "Windows", osVersion: "11" })

// Cloud provider with tunnel
start_session({ platform: "browser", provider: "browserstack", browser: "chrome", tunnel: true })

// Attach to existing Chrome (after launch_chrome)
start_session({ platform: "browser", browser: "chrome", attach: true })
```

---

### `close_session`

Closes or detaches from the current session.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `detach` | boolean | — | `false` | Disconnect without terminating (preserves app state on Appium) |

Sessions started with `noReset: true` auto-detach by default.

---

### `launch_chrome`

Prepares a Chrome instance with remote debugging enabled so `start_session({ attach: true })` can connect. Two modes:

- `newInstance` (default): opens Chrome alongside your existing one using a separate profile directory; your current session is untouched.
- `freshSession`: launches Chrome with an empty profile (no cookies, no logins). Use `copyProfileFiles: true` to carry over cookies and logins.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `port` | number | — | `9222` | Remote debugging port |
| `mode` | `"newInstance" \| "freshSession"` | — | `"newInstance"` | Launch mode |
| `copyProfileFiles` | boolean | — | `false` | Copy Chrome Default profile (cookies, logins) into debug session |

After this tool succeeds, call `start_session({ platform: "browser", browser: "chrome", attach: true })`.

---

## Navigation & Tabs

### `navigate`

Loads a URL in the current tab and waits for the page load event. Resets page state (DOM, JS runtime). **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | ✓ | URL to navigate to |

---

### `get_tabs`

Lists all browser tabs with handle, title, URL, and which is active. Use before `switch_tab` to find the target handle. **Browser-only.**

No parameters.

---

### `switch_tab`

Focuses a browser tab by window handle or 0-based index. All subsequent tool calls operate on the newly active tab. **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `handle` | string | — | Window handle to switch to |
| `index` | number | — | 0-based tab index (≥ 0) |

Provide either `handle` or `index`. Get handles from `get_tabs` or `wdio://session/current/tabs`.

---

### `switch_frame`

Switches WebDriver frame context into an iframe by CSS/XPath selector, or back to top-level if selector is omitted. Changes persist; all subsequent `click_element`, `set_value`, `get_elements` calls operate within the switched frame until you switch back. Waits up to 5s for the iframe. **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `selector` | string | — | CSS/XPath selector for the iframe element. Omit to switch back to the top-level frame. |

```
// Switch into an iframe
switch_frame({ selector: "#my-iframe" })

// Interact with elements inside the iframe
click_element({ selector: "button.submit" })

// Switch back to top-level
switch_frame()
```

---

## Element Interaction

### `click_element`

Waits for an element to exist, scrolls it into view, and clicks it. Works on browser and mobile. On iOS, prefer `tap_element`; `click_element` is sometimes ignored by the native layer.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | string | ✓ | — | CSS, XPath, or text selector |
| `scrollToView` | boolean | — | `true` | Scroll element into view before clicking |
| `timeout` | number | — | — | Max wait time (ms) |

---

### `set_value`

Clears an input or textarea and types the given text. Always replaces existing content.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | string | ✓ | — | CSS, XPath, or text selector |
| `value` | string | ✓ | — | Text to type |
| `scrollToView` | boolean | — | `true` | Scroll element into view before typing |
| `timeout` | number | — | — | Max wait time (ms) |

---

### `scroll`

Scrolls the page by a number of pixels. **Browser-only.** For mobile, use `swipe`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `direction` | `"up" \| "down"` | ✓ | — | Scroll direction |
| `pixels` | number | — | `500` | Pixels to scroll |

---

## Element Analysis

### `get_elements`

Returns interactable elements on the current page with selectors ready to use. Prefer the `wdio://session/current/elements` resource for ambient awareness; use this tool when you need filtering or pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `inViewportOnly` | boolean | — | `false` | Only return viewport-visible elements |
| `includeContainers` | boolean | — | `false` | Include container elements (divs, sections) |
| `includeBounds` | boolean | — | `false` | Include bounding box coordinates |
| `limit` | number | — | `0` | Max elements to return (0 = unlimited) |
| `offset` | number | — | `0` | Elements to skip (pagination) |

---

### `get_accessibility_tree`

Returns the page accessibility tree with roles, names, and selectors. Supports filtering and pagination. **Browser-only.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | — | `0` | Max nodes to return (0 = unlimited) |
| `offset` | number | — | `0` | Nodes to skip (pagination) |
| `roles` | string[] | — | — | Filter by ARIA roles, e.g. `["button", "link", "heading"]` |

---

## Screenshots

### `get_screenshot`

Takes a screenshot of the current page or screen. Returns a base64-encoded image, automatically resized and compressed to stay within model context limits (max 1 MB, max 2000px).

No parameters. Prefer `wdio://session/current/elements` over screenshots for element discovery; it's faster and uses far fewer tokens. Use screenshots for visual verification or debugging layout.

---

## Cookie Management

### `get_cookies`

Returns all cookies for the current session, or a single cookie by name. **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | — | Cookie name. Omit to return all cookies. |

---

### `set_cookie`

Sets a browser cookie. The browser must already be on the target domain — cookies cannot be set cross-domain. Use to inject session tokens or feature flags without going through login flows. **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✓ | Cookie name |
| `value` | string | ✓ | Cookie value |
| `domain` | string | — | Cookie domain (defaults to current domain) |
| `path` | string | — | Cookie path (defaults to `/`) |
| `expiry` | number | — | Expiry as Unix timestamp (seconds) |
| `httpOnly` | boolean | — | HttpOnly flag |
| `secure` | boolean | — | Secure flag |
| `sameSite` | `"strict" \| "lax" \| "none"` | — | SameSite attribute |

---

### `delete_cookies`

Deletes all cookies or a specific cookie by name. **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | — | Cookie name to delete. Omit to delete all cookies. |

---

## Touch Gestures (Mobile)

### `tap_element`

Calls `element.tap()` on a matched element or taps at absolute screen coordinates. Use on iOS when `click_element` is ignored; tap is the native gesture iOS responds to. **Mobile-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `selector` | string | — | Element selector |
| `x` | number | — | X coordinate for screen tap (if no selector) |
| `y` | number | — | Y coordinate for screen tap (if no selector) |

Provide either `selector` or `x`/`y` coordinates.

---

### `swipe`

Performs a full-screen swipe gesture. Direction is content movement direction (e.g. `"up"` scrolls a list upward). Use for scrolling beyond visible bounds. For moving a specific element, use `drag_and_drop`. **Mobile-only.** For browsers, use `scroll`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `direction` | `"up" \| "down" \| "left" \| "right"` | ✓ | — | Swipe direction |
| `duration` | number | — | `500` | Swipe duration (ms, 100–5000) |
| `percent` | number | — | `0.5` / `0.95` | Fraction of screen to swipe (0–1) |

---

### `drag_and_drop`

Drags an element to another element or coordinates. **Mobile-only.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sourceSelector` | string | ✓ | — | Source element to drag |
| `targetSelector` | string | — | — | Target element to drop onto |
| `x` | number | — | — | Target X offset (if no targetSelector) |
| `y` | number | — | — | Target Y offset (if no targetSelector) |
| `duration` | number | — | — | Drag duration (ms, 100–5000) |

---

## Context Switching (Mobile)

### `get_contexts`

Returns available automation contexts and the currently active one. Use before `switch_context` to discover `NATIVE_APP` and `WEBVIEW_*` targets. **Mobile-only.**

No parameters.

---

### `switch_context`

Switches between native and webview automation contexts in a hybrid mobile app. Required before using CSS/XPath selectors inside an embedded webview. **Mobile-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `context` | string | ✓ | Context name, e.g. `"NATIVE_APP"`, `"WEBVIEW_com.example.app"` |

Get available context names from `get_contexts` or `wdio://session/current/contexts`.

```
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

---

## Device Control (Mobile)

### `rotate_device`

Rotates the device to portrait or landscape and waits for the OS rotation to complete. Use to test orientation-dependent layouts. **Mobile-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orientation` | `"PORTRAIT" \| "LANDSCAPE"` | ✓ | Target orientation |

---

### `hide_keyboard`

Dismisses the software keyboard. Call after text entry when the keyboard obscures elements you need next. No-op if already hidden. **Mobile-only.**

No parameters.

---

### `set_geolocation`

Overrides device GPS coordinates for the session. Affects `navigator.geolocation` on web and location services on mobile. Location permissions must be granted to the app beforehand.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | ✓ | Latitude (−90 to 90) |
| `longitude` | number | ✓ | Longitude (−180 to 180) |
| `altitude` | number | — | Altitude in metres |

---

## App Lifecycle (Mobile)

### `get_app_state`

Returns the current lifecycle state of a mobile app. **Mobile-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bundleId` | string | ✓ | iOS bundle ID or Android package name, e.g. `"com.example.app"` |

Returns one of: `not installed`, `not running`, `background (suspended)`, `background`, `foreground`.

---

## Browser Utilities

### `emulate_device`

Emulates a mobile or tablet device in the current browser session (sets viewport, DPR, user-agent, touch events). Requires a BiDi-enabled session: `start_session({ capabilities: { webSocketUrl: true } })`. **Browser-only.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device` | string | — | Device preset name (e.g. `"iPhone 15"`, `"Pixel 7"`). Omit to list presets. Pass `"reset"` to restore desktop defaults. |

---

### `execute_script`

Executes JavaScript in the browser or mobile commands via Appium.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `script` | string | ✓ | JS code (browser) or Appium command like `"mobile: pressKey"` |
| `args` | any[] | — | Arguments passed to the script or command |

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

## Cloud Providers

### `list_apps`

Lists apps uploaded to a cloud provider (BrowserStack App Automate, Sauce Labs App Storage, or LambdaTest TestMu). Reads provider-specific credentials from environment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `provider` | `"browserstack" \| "saucelabs" \| "testmu"` | ✓ | — | Cloud provider |
| `sortBy` | `"app_name" \| "uploaded_at"` | — | `"uploaded_at"` | Sort order |
| `organizationWide` | boolean | — | `false` | (BrowserStack only) List all org uploads |
| `limit` | number | — | `20` | Max results |
| `region` | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"` | — | `"eu-central-1"` | Sauce Labs region |

```
// List all three providers
list_apps({ provider: "browserstack" })
list_apps({ provider: "saucelabs", region: "us-west-1" })
list_apps({ provider: "testmu" })
```

---

### `upload_app`

Uploads a local `.apk` or `.ipa` to a cloud provider (BrowserStack, Sauce Labs, or LambdaTest). Returns the app URL for use in `start_session`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `provider` | `"browserstack" \| "saucelabs" \| "testmu"` | ✓ | — | Cloud provider |
| `path` | string | ✓ | — | Absolute path to the `.apk` or `.ipa` file |
| `customId` | string | — | — | Optional custom ID for referencing the app later |
| `region` | `"us-west-1" \| "eu-central-1" \| "apac-southeast-1"` | — | `"eu-central-1"` | Sauce Labs region |

```
// Upload to each provider
upload_app({ provider: "browserstack", path: "/path/to/app.apk" })
upload_app({ provider: "saucelabs", path: "/path/to/app.ipa", region: "us-west-1" })
upload_app({ provider: "testmu", path: "/path/to/app.apk" })
```
