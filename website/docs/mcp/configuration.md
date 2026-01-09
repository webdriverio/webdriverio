---
id: configuration
title: Configuration
---

This page documents all configuration options for the WebdriverIO MCP server.

## MCP Server Configuration

The MCP server is configured through the Claude Desktop or Claude Code configuration files.

### Basic Configuration

#### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

#### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

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

#### Claude Code

Edit your project's `.claude/settings.json`:

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

## Environment Variables

Configure the Appium server connection and other settings via environment variables.

### Appium Connection

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APPIUM_URL` | string | `127.0.0.1` | Appium server hostname |
| `APPIUM_URL_PORT` | number | `4723` | Appium server port |
| `APPIUM_PATH` | string | `/` | Appium server path |

### Example with Environment Variables

```json
{
    "mcpServers": {
        "wdio-mcp": {
            "command": "npx",
            "args": ["-y", "@wdio/mcp"],
            "env": {
                "APPIUM_URL": "192.168.1.100",
                "APPIUM_URL_PORT": "4724",
                "APPIUM_PATH": "/wd/hub"
            }
        }
    }
}
```

---

## Browser Session Options

Options available when starting a browser session via the `start_browser` tool.

### `headless`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Run Chrome in headless mode (no visible browser window). Useful for CI/CD environments or when you don't need to see the browser.

### `width`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `1280`
-   **Range:** `400` - `3840`

Initial browser window width in pixels.

### `height`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `720`
-   **Range:** `400` - `2160`

Initial browser window height in pixels.

---

## Mobile Session Options

Options available when starting a mobile app session via the `start_app_session` tool.

### Platform Options

#### `platformName`

-   **Type:** `string`
-   **Mandatory:** Yes
-   **Values:** `iOS` | `Android`

The mobile platform to automate.

#### `platformVersion`

-   **Type:** `string`
-   **Mandatory:** No

The OS version of the device/simulator/emulator (e.g., `17.0` for iOS, `14` for Android).

### Device Options

#### `deviceName`

-   **Type:** `string`
-   **Mandatory:** Yes

Name of the device, simulator, or emulator to use.

**Examples:**
-   iOS Simulator: `iPhone 15 Pro`, `iPad Air (5th generation)`
-   Android Emulator: `Pixel 7`, `Nexus 5X`
-   Real Device: The device name as shown in your system

#### `udid`

-   **Type:** `string`
-   **Mandatory:** No (Required for real devices)

Unique Device Identifier. Required for real iOS devices (40-character identifier) and recommended for Android real devices.

**Finding UDID:**
-   **iOS:** Connect device, open Finder/iTunes, click on device → Serial Number (click to reveal UDID)
-   **Android:** Run `adb devices` in terminal

### App Options

#### `appPath`

-   **Type:** `string`
-   **Mandatory:** No*

Path to the application file to install and launch.

**Supported formats:**
-   iOS Simulator: `.app` directory
-   iOS Real Device: `.ipa` file
-   Android: `.apk` file

*Either `appPath` or `bundleId`/`appPackage` is required.

#### `bundleId`

-   **Type:** `string`
-   **Mandatory:** No*

iOS bundle identifier for launching an already-installed app.

**Examples:**
-   Safari: `com.apple.mobilesafari`
-   Settings: `com.apple.Preferences`
-   Your app: `com.yourcompany.yourapp`

#### `appPackage`

-   **Type:** `string`
-   **Mandatory:** No* (Android only)

Android application package name for launching an already-installed app.

**Examples:**
-   Chrome: `com.android.chrome`
-   Settings: `com.android.settings`
-   Your app: `com.yourcompany.yourapp`

#### `appActivity`

-   **Type:** `string`
-   **Mandatory:** No (Android only)

Android activity to launch. If not specified, the app's main/launcher activity is used.

**Example:** `com.example.app.MainActivity`

### Session State Options

#### `noReset`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Preserve the app state between sessions. When `true`:
-   App data is preserved (login state, preferences, etc.)
-   Session will **detach** instead of close (keeps app running)
-   Useful for testing user journeys across multiple sessions

#### `fullReset`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Completely reset the app before the session. When `true`:
-   iOS: Uninstalls and reinstalls the app
-   Android: Clears app data and cache
-   Useful for starting with a clean state

### Automatic Handling Options

#### `autoGrantPermissions`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`

Automatically grant app permissions on install/launch. When `true`:
-   Camera, microphone, location, etc. permissions are auto-granted
-   No manual permission dialog handling needed
-   Streamlines automation by avoiding permission popups

:::note Android Only
This option primarily affects Android. iOS permissions must be handled differently due to system restrictions.
:::

#### `autoAcceptAlerts`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`

Automatically accept system alerts (dialogs) that appear during automation.

**Examples of auto-accepted alerts:**
-   "Allow notifications?"
-   "App would like to access your location"
-   "Allow app to access photos?"

#### `autoDismissAlerts`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Dismiss (cancel) system alerts instead of accepting them. Takes precedence over `autoAcceptAlerts` when both are `true`.

---

## Element Detection Options

Options for the `get_visible_elements` tool on mobile platforms.

### `inViewportOnly`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `true`

Only return elements that are visible within the current viewport. When `false`, returns all elements in the view hierarchy.

### `includeContainers`

-   **Type:** `boolean`
-   **Mandatory:** No
-   **Default:** `false`

Include container/layout elements in the results. When `true`:

**Android containers included:**
-   `ViewGroup`, `FrameLayout`, `LinearLayout`
-   `RelativeLayout`, `ConstraintLayout`
-   `ScrollView`, `RecyclerView`

**iOS containers included:**
-   `View`, `StackView`, `CollectionView`
-   `ScrollView`, `TableView`

Useful for debugging layout issues or understanding the view hierarchy.

---

## Session Behavior

### Session Types

The MCP server tracks session types to provide appropriate tools and behavior:

| Type | Description | Auto-Detach |
|------|-------------|-------------|
| `browser` | Chrome browser session | No |
| `ios` | iOS app session | Yes (if `noReset: true`) |
| `android` | Android app session | Yes (if `noReset: true`) |

### Single-Session Model

The MCP server operates with a **single-session model**:

-   Only one browser OR app session can be active at a time
-   Starting a new session will close/detach the current session
-   Session state is maintained globally across tool calls

### Detach vs Close

| Action | `detach: false` (Close) | `detach: true` (Detach) |
|--------|-------------------------|-------------------------|
| Browser | Closes Chrome completely | Keeps Chrome running, disconnects WebDriver |
| Mobile App | Terminates app | Keeps app running in current state |
| Use Case | Clean slate for next session | Preserve state, manual inspection |

---

## Performance Considerations

### Browser Automation

-   **Headless mode** is faster but doesn't render visual elements
-   **Smaller window sizes** reduce screenshot capture time
-   **Element detection** is optimized with a single script execution

### Mobile Automation

-   **XML page source parsing** uses only 2 HTTP calls (vs 600+ for element queries)
-   **Accessibility ID selectors** are fastest
-   **XPath selectors** are slowest, use sparingly
-   **`inViewportOnly: true`** reduces element count and improves performance

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
3. Check Claude Desktop logs for errors

### Appium Connection Issues

1. Verify Appium is running: `curl http://localhost:4723/status`
2. Check environment variables match Appium server settings
3. Ensure firewall allows connections on the Appium port

### Session Won't Start

1. **Browser:** Ensure Chrome is installed
2. **iOS:** Verify Xcode and simulators are available
3. **Android:** Check `ANDROID_HOME` and emulator is running
4. Review Appium server logs for detailed error messages
