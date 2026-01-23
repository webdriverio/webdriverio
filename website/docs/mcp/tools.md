---
id: tools
title: Tools
---

The following tools are available through the WebdriverIO MCP server. These tools enable AI assistants to automate browsers and mobile applications.

## Session Management

### `start_browser`

Launches a Chrome browser session.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `headless` | boolean | No | `false` | Run Chrome in headless mode |
| `windowWidth` | number | No | `1920` | Browser window width (400-3840) |
| `windowHeight` | number | No | `1080` | Browser window height (400-2160) |
| `navigationUrl` | string | No | - | URL to navigate to after starting the browser |

#### Example

```
Start a browser with 1920x1080 resolution and navigate to webdriver.io
```

#### Support

- Desktop Browsers

---

### `start_app_session`

Launches a mobile app session on iOS or Android via Appium.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `platform` | string | Yes | - | Platform to automate: `iOS` or `Android` |
| `deviceName` | string | Yes | - | Name of the device or simulator/emulator |
| `appPath` | string | No* | - | Path to the app file (.app, .ipa, or .apk) |
| `platformVersion` | string | No | - | OS version (e.g., `17.0`, `14`) |
| `automationName` | string | No | Auto | `XCUITest` (iOS), `UiAutomator2` or `Espresso` (Android) |
| `udid` | string | No | - | Unique device identifier (required for real iOS devices) |
| `noReset` | boolean | No | `false` | Preserve app state between sessions |
| `fullReset` | boolean | No | `true` | Uninstall and reinstall app before session |
| `autoGrantPermissions` | boolean | No | `true` | Automatically grant app permissions |
| `autoAcceptAlerts` | boolean | No | `true` | Automatically accept system alerts |
| `autoDismissAlerts` | boolean | No | `false` | Dismiss (instead of accept) alerts |
| `appWaitActivity` | string | No | - | Activity to wait for on launch (Android only) |
| `newCommandTimeout` | number | No | `60` | Seconds before session times out due to inactivity |
| `appiumHost` | string | No | `127.0.0.1` | Appium server hostname |
| `appiumPort` | number | No | `4723` | Appium server port |
| `appiumPath` | string | No | `/` | Appium server path |

*Either `appPath` must be provided, or `noReset: true` to connect to an already-running app.

#### Example

```
Start an iOS app session on iPhone 15 simulator with my app at /path/to/app.app
```

#### Support

- iOS Simulators
- iOS Real Devices
- Android Emulators
- Android Real Devices

---

### `close_session`

Closes the current browser or app session.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `detach` | boolean | No | `false` | Detach from session instead of closing (keeps browser/app running) |

#### Notes

Sessions with `noReset: true` or without `appPath` automatically detach on close to preserve state.

#### Support

- Desktop Browsers
- Mobile Apps

---

## Navigation

### `navigate`

Navigates to a URL.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `url` | string | Yes | The URL to navigate to |

#### Example

```
Navigate to https://webdriver.io
```

#### Support

- Desktop Browsers

---

## Element Interaction

### `click_element`

Clicks an element identified by a selector.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `selector` | string | Yes | - | CSS selector, XPath, or mobile selector |
| `scrollToView` | boolean | No | `true` | Scroll element into view before clicking |
| `timeout` | number | No | `3000` | Max time to wait for element (ms) |

#### Notes

- Supports WebdriverIO text selectors: `button=Exact text` or `a*=Contains text`
- Uses center alignment for scroll positioning

#### Example

```
Click the element with selector "#submit-button"
```

#### Support

- Desktop Browsers
- Mobile Native Apps

---

### `set_value`

Types text into an input field.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `selector` | string | Yes | - | Selector for the input element |
| `value` | string | Yes | - | Text to type |
| `scrollToView` | boolean | No | `true` | Scroll element into view before typing |
| `timeout` | number | No | `3000` | Max time to wait for element (ms) |

#### Notes

Clears existing value before typing new text.

#### Example

```
Set the value "john@example.com" in the element with selector "#email"
```

#### Support

- Desktop Browsers
- Mobile Native Apps

---

## Page Analysis

### `get_visible_elements`

Gets visible and interactable elements on the current page or screen. This is the primary tool for discovering what elements are available for interaction.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `elementType` | string | No | `interactable` | Type of elements: `interactable` (buttons/links/inputs), `visual` (images/SVGs), or `all` |
| `inViewportOnly` | boolean | No | `true` | Only return elements visible in the viewport |
| `includeContainers` | boolean | No | `false` | Include layout containers (ViewGroup, ScrollView, etc.) |
| `includeBounds` | boolean | No | `false` | Include element coordinates (x, y, width, height) |
| `limit` | number | No | `0` | Maximum elements to return (0 = unlimited) |
| `offset` | number | No | `0` | Number of elements to skip (for pagination) |

#### Returns

```json
{
  "total": 42,
  "showing": 20,
  "hasMore": true,
  "elements": [...]
}
```

**Web elements include:** tagName, type, id, className, textContent, value, placeholder, href, ariaLabel, role, cssSelector, isInViewport

**Mobile elements include:** Multiple locator strategies (accessibility ID, resource ID, XPath, UiAutomator/predicates), element type, text, and optionally bounds

#### Notes

- **Web**: Uses an optimized browser script for fast element detection
- **Mobile**: Uses efficient XML page source parsing (2 HTTP calls vs 600+ for element queries)
- Use pagination (`limit` and `offset`) for large pages to reduce token usage

#### Example

```
Get all visible elements on the page with their coordinates
```

#### Support

- Desktop Browsers
- Mobile Apps

---

### `get_accessibility`

Gets the accessibility tree of the current page with semantic information about roles, names, and states.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `limit` | number | No | `100` | Maximum nodes to return (0 = unlimited) |
| `offset` | number | No | `0` | Number of nodes to skip (for pagination) |
| `roles` | string[] | No | All | Filter to specific roles (e.g., `["button", "link", "textbox"]`) |
| `namedOnly` | boolean | No | `true` | Only return nodes with a name/label |

#### Returns

```json
{
  "total": 85,
  "showing": 100,
  "hasMore": false,
  "nodes": [
    { "role": "button", "name": "Submit" },
    { "role": "link", "name": "Home" }
  ]
}
```

#### Notes

- Browser-only. For mobile apps, use `get_visible_elements` instead
- Useful when `get_visible_elements` doesn't return expected elements
- `namedOnly: true` filters out anonymous containers and reduces noise

#### Support

- Desktop Browsers

---

## Screenshots

### `take_screenshot`

Captures a screenshot of the current viewport.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `outputPath` | string | No | Path to save screenshot file. If omitted, returns base64 data |

#### Returns

Base64-encoded image data (PNG or JPEG) with size information.

#### Notes

Screenshots are automatically optimized:
- Maximum dimension: 2000px (scaled down if larger)
- Maximum file size: 1MB
- Format: PNG with max compression, or JPEG if needed to meet size limit

#### Support

- Desktop Browsers
- Mobile Apps

---

## Scrolling

### `scroll`

Scrolls the page up or down by a specified number of pixels.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `direction` | string | Yes | - | Scroll direction: `up` or `down` |
| `pixels` | number | No | `500` | Number of pixels to scroll |

#### Notes

Browser-only. For mobile scrolling, use the `swipe` tool instead.

#### Support

- Desktop Browsers

---

## Cookie Management

### `get_cookies`

Gets cookies from the current session.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `name` | string | No | Specific cookie name to retrieve (omit for all cookies) |

#### Returns

Cookie objects with name, value, domain, path, expiry, secure, and httpOnly properties.

#### Support

- Desktop Browsers

---

### `set_cookie`

Sets a cookie in the current session.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `name` | string | Yes | - | Cookie name |
| `value` | string | Yes | - | Cookie value |
| `domain` | string | No | Current | Cookie domain |
| `path` | string | No | `/` | Cookie path |
| `expiry` | number | No | - | Expiration as Unix timestamp (seconds) |
| `secure` | boolean | No | - | Secure flag |
| `httpOnly` | boolean | No | - | HttpOnly flag |
| `sameSite` | string | No | - | SameSite attribute: `strict`, `lax`, or `none` |

#### Support

- Desktop Browsers

---

### `delete_cookies`

Deletes cookies from the current session.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `name` | string | No | Specific cookie name to delete (omit to delete all) |

#### Support

- Desktop Browsers

---

## Touch Gestures (Mobile)

### `tap_element`

Taps on an element or screen coordinates.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `selector` | string | No* | Selector for the element to tap |
| `x` | number | No* | X coordinate for tap |
| `y` | number | No* | Y coordinate for tap |

*Either `selector` or both `x` and `y` are required.

#### Support

- Mobile Apps

---

### `swipe`

Performs a swipe gesture in the specified direction.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `direction` | string | Yes | - | Swipe direction: `up`, `down`, `left`, `right` |
| `duration` | number | No | `500` | Swipe duration in milliseconds (100-5000) |
| `percent` | number | No | 0.5/0.95 | Percentage of screen to swipe (0-1) |

#### Notes

- Default percent: 0.5 for vertical swipes, 0.95 for horizontal swipes
- Direction indicates content movement: "swipe up" scrolls content up

#### Example

```
Swipe up to scroll down the screen
```

#### Support

- Mobile Apps

---

### `drag_and_drop`

Drags an element to another element or coordinates.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `sourceSelector` | string | Yes | Source element selector to drag |
| `targetSelector` | string | No* | Target element selector to drop onto |
| `x` | number | No* | Target X offset (if no targetSelector) |
| `y` | number | No* | Target Y offset (if no targetSelector) |
| `duration` | number | No | Default | Drag duration in milliseconds (100-5000) |

*Either `targetSelector` or both `x` and `y` are required.

#### Support

- Mobile Apps

---

## App Lifecycle (Mobile)

### `get_app_state`

Gets the current state of an app.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `bundleId` | string | Yes | App identifier (bundle ID for iOS, package name for Android) |

#### Returns

App state: `not installed`, `not running`, `running in background (suspended)`, `running in background`, or `running in foreground`.

#### Support

- Mobile Apps

---

## Context Switching (Hybrid Apps)

### `get_contexts`

Lists all available contexts (native and webviews).

#### Parameters

None

#### Returns

Array of context names (e.g., `["NATIVE_APP", "WEBVIEW_com.example.app"]`).

#### Support

- Mobile Hybrid Apps

---

### `get_current_context`

Gets the currently active context.

#### Parameters

None

#### Returns

Current context name (e.g., `NATIVE_APP` or `WEBVIEW_*`).

#### Support

- Mobile Hybrid Apps

---

### `switch_context`

Switches between native and webview contexts.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `context` | string | Yes | Context name or index (1-based) from `get_contexts` |

#### Example

```
Switch to the WEBVIEW_com.example.app context
```

#### Support

- Mobile Hybrid Apps

---

## Device Control (Mobile)

### `rotate_device`

Rotates the device to a specific orientation.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `orientation` | string | Yes | `PORTRAIT` or `LANDSCAPE` |

#### Support

- Mobile Apps

---

### `hide_keyboard`

Hides the on-screen keyboard.

#### Parameters

None

#### Support

- Mobile Apps

---

### `get_geolocation`

Gets the current GPS coordinates.

#### Parameters

None

#### Returns

Object with `latitude`, `longitude`, and `altitude`.

#### Support

- Mobile Apps

---

### `set_geolocation`

Sets the device GPS coordinates.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `latitude` | number | Yes | Latitude coordinate (-90 to 90) |
| `longitude` | number | Yes | Longitude coordinate (-180 to 180) |
| `altitude` | number | No | Altitude in meters |

#### Example

```
Set geolocation to San Francisco (37.7749, -122.4194)
```

#### Support

- Mobile Apps

---

## Script Execution

### `execute_script`

Executes JavaScript in the browser or mobile commands via Appium.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `script` | string | Yes | JavaScript code (browser) or mobile command (e.g., `mobile: pressKey`) |
| `args` | array | No | Arguments for the script |

#### Browser Examples

```javascript
// Get page title
execute_script({ script: "return document.title" })

// Get scroll position
execute_script({ script: "return window.scrollY" })

// Click element by selector
execute_script({ script: "arguments[0].click()", args: ["#myButton"] })
```

#### Mobile (Appium) Examples

```javascript
// Press back key (Android)
execute_script({ script: "mobile: pressKey", args: [{ keycode: 4 }] })

// Activate app
execute_script({ script: "mobile: activateApp", args: [{ appId: "com.example" }] })

// Terminate app
execute_script({ script: "mobile: terminateApp", args: [{ appId: "com.example" }] })

// Deep link
execute_script({ script: "mobile: deepLink", args: [{ url: "myapp://screen", package: "com.example" }] })

// Shell command (Android)
execute_script({ script: "mobile: shell", args: [{ command: "dumpsys", args: ["battery"] }] })
```

#### Common Android Key Codes

| Key | Code |
|-----|------|
| BACK | 4 |
| HOME | 3 |
| ENTER | 66 |
| MENU | 82 |
| SEARCH | 84 |

#### More Mobile Commands

For a complete list of available Appium mobile commands, see:
- [XCUITest Mobile Commands](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/) (iOS)
- [UiAutomator2 Mobile Commands](https://github.com/appium/appium-uiautomator2-driver#mobile-commands) (Android)

#### Support

- Desktop Browsers
- Mobile Apps (via Appium mobile commands)
