---
id: configuration
title: Configuration
---

This page documents all configuration options for the WebdriverIO MCP server.

## MCP Server Configuration

The MCP server is configured through the configuration files or commands.

### Basic Configuration

Edit your MCP configuration file (e.g. `./.mcp.json`) and add the following::

```json
{
    "mcpServers": {
        "wdio-mcp": {
            "command": "npx",
            "args": ["-y", "@wdio/mcp"]
        }
    }
}
```

---

## Session Options

All session options are passed to the `start_session` tool. There is a single unified tool for browser and mobile sessions — the `platform` parameter determines the session type.

### Common Options

#### `platform`

-   **Type:** `"browser" | "ios" | "android"`
-   **Mandatory:** Yes

The platform to automate.

#### `provider`

-   **Type:** `"local" | "browserstack"`
-   **Mandatory:** No
-   **Default:** `"local"`

Where the session runs. Use `"browserstack"` for cloud devices — requires `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` environment variables. See [BrowserStack](./browserstack) for details.

---

## Browser Session Options

Options for `platform: "browser"` sessions.

### `browser`

-   **Type:** `"chrome" | "firefox" | "edge" | "safari"`
-   **Mandatory:** Yes (for browser platform)

Browser to launch.

### `browserVersion`

-   **Type:** `string`
-   **Mandatory:** No
-   **Default:** `"latest"`

Browser version. BrowserStack only.

### `os` / `osVersion`

-   **Type:** `string`
-   **Mandatory:** No

Operating system for BrowserStack browser sessions. Examples: `os: "Windows"`, `osVersion: "11"` or `os: "OS X"`, `osVersion: "Sequoia"`.

### `headless`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`

Run browser in headless mode (no visible window). Set to `false` to see the browser.

### `windowWidth`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `1920`
-   **Range:** `400` - `3840`

Initial browser window width in pixels.

### `windowHeight`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `1080`
-   **Range:** `400` - `2160`

Initial browser window height in pixels.

### `navigationUrl`

-   **Type:** `string`
-   **Mandatory:** No

URL to navigate to immediately after starting the browser. More efficient than calling `start_session` followed by `navigate` separately.

### `attach`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Attach to an existing Chrome instance instead of launching a new one. Use after `launch_chrome` to connect via CDP.

### `attachConfig`

-   **Type:** `{ port?: number; host?: string }`
-   **Mandatory:** No
-   **Default:** `{ port: 9222, host: "localhost" }`

Chrome remote debugging connection config. Only applies when `attach: true`.

---

## Mobile Session Options

Options for `platform: "ios"` or `platform: "android"` sessions.

### `deviceName`

-   **Type:** `string`
-   **Mandatory:** Yes (for mobile platforms)

Name of the device, simulator, or emulator.

**Examples:**
-   iOS Simulator: `"iPhone 16"`, `"iPad Air (5th generation)"`
-   Android Emulator: `"Pixel 7"`, `"Nexus 5X"`
-   Real Device: The device name as shown in your system

### `platformVersion`

-   **Type:** `string`
-   **Mandatory:** No

OS version of the device/simulator/emulator (e.g., `"18.0"` for iOS, `"14"` for Android).

### `automationName`

-   **Type:** `"XCUITest" | "UiAutomator2"`
-   **Mandatory:** No

Automation driver. Defaults to `XCUITest` for iOS and `UiAutomator2` for Android.

### `udid`

-   **Type:** `string`
-   **Mandatory:** No (Required for real iOS devices)

Unique Device Identifier. Required for real iOS devices (40-character identifier).

**Finding UDID:**
-   **iOS:** Connect device, open Finder, click on device → Serial Number (click to reveal UDID)
-   **Android:** Run `adb devices` in terminal

### `appPath`

-   **Type:** `string`
-   **Mandatory:** No

Path to the application file to install and launch.

**Supported formats:**
-   iOS Simulator: `.app` directory
-   iOS Real Device: `.ipa` file
-   Android: `.apk` file

Either `appPath` must be provided, or `noReset: true` to connect to an already-running app.

### `app`

-   **Type:** `string`
-   **Mandatory:** No

BrowserStack app URL (`bs://...`) or `customId`. Used instead of `appPath` for BrowserStack App Automate sessions.

### `appWaitActivity`

-   **Type:** `string`
-   **Mandatory:** No (Android only)

Activity to wait for on app launch. If not specified, the app's main/launcher activity is used.

**Example:** `"com.example.app.MainActivity"`

### Session State Options

#### `noReset`

-   **Type:** `boolean`
-   **Mandatory:** No

Preserve the app state between sessions. When `true`:
-   App data is preserved (login state, preferences, etc.)
-   Session will **detach** instead of close (keeps app running)
-   Can be used without `appPath` to connect to an already-running app

#### `fullReset`

-   **Type:** `boolean`
-   **Mandatory:** No

Completely reset the app before the session:
-   iOS: Uninstalls and reinstalls the app
-   Android: Clears app data and cache

Set `fullReset: false` with `noReset: true` to preserve app state completely.

### Session Timeout

#### `newCommandTimeout`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `300`

How long (in seconds) Appium will wait for a new command before ending the session. Increase for longer debugging sessions.

### Automatic Handling

#### `autoGrantPermissions`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`

Automatically grant app permissions on install/launch (camera, microphone, location, etc.).

:::note Android Only
This option primarily affects Android. iOS permissions must be handled differently due to system restrictions.
:::

#### `autoAcceptAlerts`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`

Automatically accept system alerts (dialogs) during automation ("Allow notifications?", etc.).

#### `autoDismissAlerts`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Dismiss system alerts instead of accepting them. Takes precedence over `autoAcceptAlerts` when `true`.

### Appium Server Connection

Override the Appium server connection on a per-session basis using `appiumConfig`:

```
start_session({
  platform: "ios",
  deviceName: "iPhone 16",
  appPath: "/path/to/app.app",
  appiumConfig: { host: "192.168.1.100", port: 4724, path: "/wd/hub" }
})
```

#### `appiumConfig`

-   **Type:** `{ host?: string; port?: number; path?: string }`
-   **Mandatory:** No

Appium server connection. Defaults to `{ host: "127.0.0.1", port: 4723, path: "/" }`.

---

## BrowserStack Options

### `browserstackLocal`

-   **Type:** `boolean | "external"`
-   **Mandatory:** No
-   **Default:** `false`

Enable BrowserStack Local tunnel for accessing localhost from BrowserStack devices.

-   `true` — Auto-start the tunnel before the session and stop it on close
-   `"external"` — Tunnel already running externally; set `local: true` in capabilities only

Before using `true`, read `wdio://browserstack/local-binary` for setup instructions specific to your OS and architecture.

### `reporting`

-   **Type:** `{ project?: string; build?: string; session?: string }`
-   **Mandatory:** No

BrowserStack Automate session labels visible in the dashboard.

---

## Element Detection Options

Options for the `get_elements` tool.

### `inViewportOnly`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Only return elements visible in the current viewport. Set to `true` to reduce results on long pages.

### `includeContainers`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Include container/layout elements in the results:

**Android containers:** `ViewGroup`, `FrameLayout`, `LinearLayout`, `RelativeLayout`, `ConstraintLayout`, `ScrollView`, `RecyclerView`

**iOS containers:** `View`, `StackView`, `CollectionView`, `ScrollView`, `TableView`

### `includeBounds`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Include element bounding box coordinates (x, y, width, height) in the response.

### Pagination

#### `limit`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `0` (unlimited)

Maximum number of elements to return.

#### `offset`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `0`

Number of elements to skip before returning results.

**Example:** Get elements 21–40:
```
Get elements with limit 20 and offset 20
```

---

## Accessibility Tree Options

Options for the `get_accessibility_tree` tool (browser-only).

### `limit`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `0` (unlimited)

Maximum number of nodes to return.

### `offset`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `0`

Number of nodes to skip for pagination.

### `roles`

-   **Type:** `string[]`
-   **Mandatory:** No
-   **Default:** All roles

Filter to specific accessibility roles.

**Common roles:** `button`, `link`, `textbox`, `checkbox`, `radio`, `heading`, `img`, `listitem`

**Example:** Get only buttons and links:
```
Get accessibility tree filtered to button and link roles
```

---

## Screenshot

The `get_screenshot` tool takes no parameters. Screenshots are automatically processed:

| Optimization | Value | Description |
|--------------|-------|-------------|
| Max dimension | 2000px | Images larger than 2000px are scaled down |
| Max file size | 1MB | Images are compressed to stay under 1MB |
| Format | PNG/JPEG | PNG with max compression; JPEG if needed for size |

---

## Session Behavior

### Session Types

| Type | Description | Auto-Detach |
|------|-------------|-------------|
| `browser` | Browser session | No |
| `ios` | iOS app session | Yes (if `noReset: true` or no `appPath`) |
| `android` | Android app session | Yes (if `noReset: true` or no `appPath`) |

### Single-Session Model

The MCP server operates with a **single-session model**:

-   Only one browser OR app session can be active at a time
-   Starting a new session will close/detach the current session
-   Session state is maintained globally across tool calls

### Detach vs Close

| Action | `detach: false` (Close) | `detach: true` (Detach) |
|--------|-------------------------|-------------------------|
| Browser | Closes browser completely | Keeps browser running, disconnects WebDriver |
| Mobile App | Terminates app | Keeps app running in current state |
| Use Case | Clean slate for next session | Preserve state, manual inspection |

---

## Performance Considerations

### Browser Automation

-   **Headless mode** is faster but doesn't render visual elements
-   **Smaller window sizes** reduce screenshot capture time
-   **Element detection** is optimized with a single script execution
-   **Screenshot optimization** keeps images under 1MB for efficient processing

### Mobile Automation

-   **XML page source parsing** uses only 2 HTTP calls (vs 600+ for traditional element queries)
-   **Accessibility ID selectors** are fastest and most reliable
-   **XPath selectors** are slowest — use only as a last resort
-   **Pagination** (`limit` and `offset`) reduces token usage for screens with many elements

### Token Usage Tips

| Setting | Impact |
|---------|--------|
| `inViewportOnly: true` | Filters off-screen elements, reducing response size |
| `includeContainers: false` | Excludes layout elements (ViewGroup, etc.) |
| `includeBounds: false` | Omits x/y/width/height data |
| `limit` with pagination | Process elements in batches instead of all at once |

---

## Appium Server Setup

Before using mobile automation, ensure Appium is properly configured.

### Basic Setup

```sh
# Install Appium globally
npm install -g appium

# Install drivers
appium driver install xcuitest    # iOS
appium driver install uiautomator2  # Android

# Start the server
appium
```

### Custom Server Configuration

```sh
# Start with custom host and port
appium --address 0.0.0.0 --port 4724

# Start with logging
appium --log-level debug

# Start with specific base path
appium --base-path /wd/hub
```

### Verify Installation

```sh
# Check installed drivers
appium driver list --installed

# Check Appium version
appium --version

# Test connection
curl http://localhost:4723/status
```

---

## Troubleshooting Configuration

### MCP Server Not Starting

1. Verify npm/npx is installed: `npm --version`
2. Try running manually: `npx @wdio/mcp`
3. Check your harness' logs for errors

### Appium Connection Issues

1. Verify Appium is running: `curl http://localhost:4723/status`
2. Check `appiumConfig` in `start_session` matches the Appium server settings
3. Ensure firewall allows connections on the Appium port

### Session Won't Start

1. **Browser:** Ensure the target browser is installed
2. **iOS:** Verify Xcode and simulators are available
3. **Android:** Check `ANDROID_HOME` and emulator is running
4. Review Appium server logs for detailed error messages

### Session Timeouts

If sessions are timing out during debugging:
1. Increase `newCommandTimeout` when starting the session
2. Use `noReset: true` to preserve state between sessions
3. Use `detach: true` when closing to keep the app running
