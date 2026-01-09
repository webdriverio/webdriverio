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
| `width` | number | No | `1280` | Browser window width (400-3840) |
| `height` | number | No | `1080` | Browser window height (400-2160) |

#### Example

```
Start a browser with 1920x1080 resolution in headless mode
```

#### Support

- Desktop Browsers

---

### `start_app_session`

Launches a mobile app session on iOS or Android.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `platformName` | string | Yes | - | Platform to automate: `iOS` or `Android` |
| `deviceName` | string | Yes | - | Name of the device or simulator/emulator |
| `appPath` | string | No | - | Path to the app file (.app, .ipa, or .apk) |
| `bundleId` | string | No* | - | iOS bundle identifier (e.g., `com.apple.mobilesafari`) |
| `appPackage` | string | No* | - | Android app package (e.g., `com.android.chrome`) |
| `appActivity` | string | No* | - | Android app activity to launch |
| `platformVersion` | string | No | - | OS version (e.g., `17.0`, `14`) |
| `udid` | string | No | - | Unique device identifier (required for real devices) |
| `noReset` | boolean | No | `false` | Preserve app state between sessions |
| `fullReset` | boolean | No | `false` | Uninstall and reinstall app before session |
| `autoGrantPermissions` | boolean | No | `true` | Automatically grant app permissions |
| `autoAcceptAlerts` | boolean | No | `true` | Automatically accept system alerts |
| `autoDismissAlerts` | boolean | No | `false` | Automatically dismiss (instead of accept) alerts |

*Either `appPath` or `bundleId`/`appPackage` is required.

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

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `selector` | string | Yes | CSS selector, XPath, or mobile selector |

#### Notes

- Automatically scrolls the element into view before clicking
- Uses center alignment for scroll positioning

#### Example

```
Click the element with selector "#submit-button"
```

#### Support

- Desktop Browsers
- Mobile Native Apps

---

### `click_via_text`

Clicks an element by its text content.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `text` | string | Yes | The visible text of the element to click |

#### Example

```
Click the element with text "Sign In"
```

#### Support

- Desktop Browsers

---

### `set_value`

Types text into an input field.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `selector` | string | Yes | Selector for the input element |
| `value` | string | Yes | Text to type |

#### Example

```
Set the value "john@example.com" in the element with selector "#email"
```

#### Support

- Desktop Browsers
- Mobile Native Apps

---

### `find_element`

Finds an element using a selector.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `selector` | string | Yes | CSS selector, XPath, or mobile selector |

#### Returns

Element information if found, error message if not found.

#### Support

- Desktop Browsers
- Mobile Apps

---

### `get_element_text`

Gets the text content of an element.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `selector` | string | Yes | Selector for the element |

#### Example

```
Get the text of the element with selector ".error-message"
```

#### Support

- Desktop Browsers
- Mobile Apps

---

### `is_displayed`

Checks if an element is visible on screen.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `selector` | string | Yes | Selector for the element |

#### Returns

`true` if the element is visible, `false` otherwise.

#### Support

- Desktop Browsers
- Mobile Apps

---

## Page Analysis

### `get_visible_elements`

Gets all visible and interactable elements on the current page or screen.

#### Parameters (Web)

None

#### Parameters (Mobile)

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `inViewportOnly` | boolean | No | `true` | Only return elements visible in the viewport |
| `includeContainers` | boolean | No | `false` | Include container/layout elements |

#### Returns

A list of elements with:
- **Web**: tagName, type, id, className, textContent, value, placeholder, href, ariaLabel, role, cssSelector, isInViewport
- **Mobile**: Multiple locator strategies (accessibility ID, resource ID, XPath, UiAutomator/predicates), element type, text, bounds

#### Notes

- **Web**: Uses an optimized browser script for fast element detection
- **Mobile**: Uses efficient XML page source parsing (2 HTTP calls vs 600+ for element queries)

#### Support

- Desktop Browsers
- Mobile Apps

---

### `get_accessibility`

Gets the accessibility tree of the current page with semantic information.

#### Parameters

None

#### Returns

Structured accessibility information including roles, names, and states.

#### Support

- Desktop Browsers

---

## Screenshots

### `take_screenshot`

Captures a screenshot of the current viewport.

#### Parameters

None

#### Returns

Base64-encoded PNG image data.

#### Support

- Desktop Browsers
- Mobile Apps

---

## Scrolling

### `scroll_down`

Scrolls the page down.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `pixels` | number | No | `300` | Number of pixels to scroll |

#### Support

- Desktop Browsers

---

### `scroll_up`

Scrolls the page up.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `pixels` | number | No | `300` | Number of pixels to scroll |

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

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `name` | string | Yes | Cookie name |
| `value` | string | Yes | Cookie value |
| `domain` | string | No | Cookie domain |
| `path` | string | No | Cookie path |
| `expiry` | number | No | Expiration timestamp |
| `secure` | boolean | No | Secure flag |
| `httpOnly` | boolean | No | HttpOnly flag |

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

Taps on an element or coordinates.

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

Performs a swipe gesture.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `direction` | string | Yes | - | Swipe direction: `up`, `down`, `left`, `right` |
| `duration` | number | No | `300` | Swipe duration in milliseconds |

#### Example

```
Swipe up to scroll down the screen
```

#### Support

- Mobile Apps

---

### `long_press`

Performs a long press on an element or coordinates.

#### Parameters

| Parameter | Type | Mandatory | Default | Description |
|-----------|------|-----------|---------|-------------|
| `selector` | string | No* | - | Selector for the element |
| `x` | number | No* | - | X coordinate |
| `y` | number | No* | - | Y coordinate |
| `duration` | number | No | `1000` | Press duration in milliseconds |

*Either `selector` or both `x` and `y` are required.

#### Support

- Mobile Apps

---

### `drag_and_drop`

Drags from one location to another.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `startX` | number | Yes | Starting X coordinate |
| `startY` | number | Yes | Starting Y coordinate |
| `endX` | number | Yes | Ending X coordinate |
| `endY` | number | Yes | Ending Y coordinate |
| `duration` | number | No | Duration of the drag gesture |

#### Support

- Mobile Apps

---

## App Lifecycle (Mobile)

### `get_app_state`

Gets the current state of an app.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `bundleId` | string | No* | iOS bundle identifier |
| `appPackage` | string | No* | Android app package |

*Use `bundleId` for iOS, `appPackage` for Android.

#### Returns

App state: `not installed`, `not running`, `running in background`, or `running in foreground`.

#### Support

- Mobile Apps

---

### `activate_app`

Brings an app to the foreground.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `bundleId` | string | No* | iOS bundle identifier |
| `appPackage` | string | No* | Android app package |

#### Support

- Mobile Apps

---

### `terminate_app`

Terminates a running app.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `bundleId` | string | No* | iOS bundle identifier |
| `appPackage` | string | No* | Android app package |

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
| `context` | string | Yes | Context name to switch to |

#### Example

```
Switch to the WEBVIEW_com.example.app context
```

#### Support

- Mobile Hybrid Apps

---

## Device Control (Mobile)

### `get_device_info`

Gets information about the connected device.

#### Parameters

None

#### Returns

Platform name, version, and screen size.

#### Support

- Mobile Apps

---

### `rotate_device`

Rotates the device to a specific orientation.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `orientation` | string | Yes | `portrait` or `landscape` |

#### Support

- Mobile Apps

---

### `get_orientation`

Gets the current device orientation.

#### Parameters

None

#### Returns

Current orientation: `portrait` or `landscape`.

#### Support

- Mobile Apps

---

### `lock_device`

Locks the device screen.

#### Parameters

None

#### Support

- Mobile Apps

---

### `unlock_device`

Unlocks the device screen.

#### Parameters

None

#### Support

- Mobile Apps

---

### `is_device_locked`

Checks if the device is locked.

#### Parameters

None

#### Returns

`true` if locked, `false` otherwise.

#### Support

- Mobile Apps

---

### `shake_device`

Shakes the device (iOS only).

#### Parameters

None

#### Support

- iOS only

---

## Keyboard (Mobile)

### `send_keys`

Sends keyboard input (Android only).

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `text` | string | Yes | Text to type via keyboard |

#### Support

- Android only

---

### `press_key_code`

Presses an Android key code.

#### Parameters

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `keyCode` | number | Yes | Android key code (e.g., 4=BACK, 3=HOME, 66=ENTER) |

#### Common Key Codes

| Key | Code |
|-----|------|
| BACK | 4 |
| HOME | 3 |
| ENTER | 66 |
| MENU | 82 |
| SEARCH | 84 |

#### Support

- Android only

---

### `hide_keyboard`

Hides the on-screen keyboard.

#### Parameters

None

#### Support

- Mobile Apps

---

### `is_keyboard_shown`

Checks if the keyboard is currently visible.

#### Parameters

None

#### Returns

`true` if keyboard is shown, `false` otherwise.

#### Support

- Mobile Apps

---

## System (Mobile)

### `open_notifications`

Opens the notification panel (Android only).

#### Parameters

None

#### Support

- Android only

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
| `latitude` | number | Yes | Latitude coordinate |
| `longitude` | number | Yes | Longitude coordinate |
| `altitude` | number | No | Altitude in meters |

#### Example

```
Set geolocation to San Francisco (37.7749, -122.4194)
```

#### Support

- Mobile Apps
