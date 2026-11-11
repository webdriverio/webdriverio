---
id: configuration
title: Configuration
description: "Configure the WebdriverIO MCP server, including session, browser, mobile, cloud provider, element detection and Appium options."
---

This page documents all configuration options for the WebdriverIO MCP server.

## MCP Server Configuration

The MCP server is configured through the configuration files or commands.

### Basic Configuration

Edit your MCP configuration file (e.g. `./.mcp.json`) and add the following:

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

## Environment Variables

The server reads these variables from the environment that starts it.

| Variable                | Default       | Description                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WDIO_MCP_TOOLS`        | unset         | Set to `all` to list every tool from startup. By default, tools that do not apply to the current session's platform, and tools in optional groups, stay hidden until a matching session starts or the client calls `enable_tools`. Use `all` for clients that ignore tool list changes.    |
| `WDIO_MCP_NETWORK_LOGS` | `none`        | Default `networkLogs` for `start_session`: `none`, `failures`, or `all`. A `networkLogs` argument on the call overrides it. An invalid value fails server startup.                                                                                                                           |
| `WDIO_MCP_CACHE_DIR`    | `~/.wdio-mcp` | Directory for the cached WebdriverIO docs corpus used by `query_docs` and the `wdio://docs/*` resources.                                                                                                                                                                                     |
| `APPIUM_URL`            | `127.0.0.1`   | Hostname of the local Appium server, without a scheme.                                                                                                                                                                                                                                       |
| `APPIUM_URL_PORT`       | `4723`        | Port of the local Appium server.                                                                                                                                                                                                                                                             |
| `APPIUM_PATH`           | `/`           | Base path of the local Appium server.                                                                                                                                                                                                                                                        |
| `APPIUM_PROTOCOL`       | `http`        | Protocol of the local Appium server.                                                                                                                                                                                                                                                         |

`appiumConfig` on `start_session` overrides the `APPIUM_*` values for that session.

## Session Options

All session options are passed to the `start_session` tool. There is a single unified tool for browser and mobile sessions; the `platform` parameter determines the session type.

### Common Options

#### `platform`

<Option type={`"browser" | "electron" | "ios" | "android"`} required="Yes">

The platform to automate. See [Electron Session Options](#electron-session-options) for `"electron"`.

</Option>
#### `provider`

<Option type={`"local" | "browserstack" | "saucelabs" | "testmu" | "testingbot" | "digitalai" | "external"`} default={`"local"`} required="No">

Where the session runs. Use a cloud provider name for remote devices; each requires its own environment variables. Use `external` for any W3C WebDriver endpoint. See [Cloud Providers](./cloud-providers) for details.

</Option>
## Browser Session Options

Options for `platform: "browser"` sessions.

### `browser`

<Option type={`"chrome" | "firefox" | "edge" | "safari"`} required="Yes (for browser platform)">

Browser to launch.

</Option>
### `browserVersion`

<Option type="string" default={`"latest"`} required="No">

Browser version. Cloud providers only (default: latest).

</Option>
### `os` / `osVersion`

<Option type="string" required="No">

Operating system for cloud provider browser sessions. Values are provider-native and passed through unchanged; see [Operating system values](./cloud-providers#operating-system-values).

</Option>
### `headless`

<Option type="boolean" default="true" required="No">

Run browser in headless mode (no visible window). Set to `false` to see the browser.

</Option>
### `windowWidth`

<Option type="number" default="1280" required="No">

-   **Range:** `400` - `3840`

Initial browser window width in pixels.

</Option>
### `windowHeight`

<Option type="number" default="800" required="No">

-   **Range:** `400` - `2160`

Initial browser window height in pixels.

</Option>
### `navigationUrl`

<Option type="string" required="No">

URL to navigate to immediately after starting the browser. More efficient than calling `start_session` followed by `navigate` separately.

</Option>
### `attach`

<Option type="boolean" default="false" required="No">

Attach to an existing Chrome instance instead of launching a new one. Use after `launch_chrome` to connect via CDP.

</Option>
### `attachConfig`

<Option type={`{ port?: number; host?: string }`} default={`{ port: 9222, host: "localhost" }`} required="No">

Chrome remote debugging connection config. Only applies when `attach: true`.

</Option>
## Mobile Session Options

Options for `platform: "ios"` or `platform: "android"` sessions.

### `deviceName`

<Option type="string" required="Yes (for mobile platforms)">

Name of the device, simulator, or emulator.

**Examples:**
-   iOS Simulator: `"iPhone 16"`, `"iPad Air (5th generation)"`
-   Android Emulator: `"Pixel 7"`, `"Nexus 5X"`
-   Real Device: The device name as shown in your system

</Option>
### `platformVersion`

<Option type="string" required="No">

OS version of the device/simulator/emulator (e.g., `"18.0"` for iOS, `"14"` for Android).

</Option>
### `automationName`

<Option type={`"XCUITest" | "UiAutomator2"`} required="No">

Automation driver. Defaults to `XCUITest` for iOS and `UiAutomator2` for Android.

</Option>
### `udid`

<Option type="string" required="No (Required for real iOS devices)">

Unique Device Identifier. Required for real iOS devices (40-character identifier).

**Finding UDID:**
-   **iOS:** Connect device, open Finder, click on device → Serial Number (click to reveal UDID)
-   **Android:** Run `adb devices` in terminal

</Option>
### `appPath`

<Option type="string" required="No">

Path to the application file to install and launch.

**Supported formats:**
-   iOS Simulator: `.app` directory
-   iOS Real Device: `.ipa` file
-   Android: `.apk` file

Either `appPath` must be provided, or `noReset: true` to connect to an already-running app.

</Option>
### `app`

<Option type="string" required="No">

Cloud provider app URL (`bs://...` for BrowserStack, `storage:filename=` for Sauce Labs, `lt://...` for TestMu, TestingBot app_url, `cloud:<name>` for Digital.ai) or `customId`. Used instead of `appPath` for cloud mobile sessions.

</Option>
### `appWaitActivity`

<Option type="string" required="No (Android only)">

Activity to wait for on app launch. If not specified, the app's main/launcher activity is used.

**Example:** `"com.example.app.MainActivity"`

</Option>
### Session State Options

#### `noReset`

<Option type="boolean" required="No">

Preserve the app state between sessions. When `true`:
-   App data is preserved (login state, preferences, etc.)
-   Session will **detach** instead of close (keeps app running)
-   Can be used without `appPath` to connect to an already-running app

</Option>
#### `fullReset`

<Option type="boolean" required="No">

Completely reset the app before the session:
-   iOS: Uninstalls and reinstalls the app
-   Android: Clears app data and cache

Set `fullReset: false` with `noReset: true` to preserve app state completely.

</Option>
### Session Timeout

#### `newCommandTimeout`

<Option type="number" default="300" required="No">

How long (in seconds) Appium will wait for a new command before ending the session. Increase for longer debugging sessions.

</Option>
### Automatic Handling

#### `autoGrantPermissions`

<Option type="boolean" default="true" required="No">

Automatically grant app permissions on install/launch (camera, microphone, location, etc.).

:::note Android Only
This option primarily affects Android. iOS permissions must be handled differently due to system restrictions.
:::

</Option>
#### `autoAcceptAlerts`

<Option type="boolean" default="true" required="No">

Automatically accept system alerts (dialogs) during automation ("Allow notifications?", etc.).

</Option>
#### `autoDismissAlerts`

<Option type="boolean" default="false" required="No">

Dismiss system alerts instead of accepting them. Takes precedence over `autoAcceptAlerts` when `true`.

</Option>
### Appium Server Connection

Override the Appium server connection on a per-session basis using `appiumConfig`:

```js
start_session({
  platform: "ios",
  deviceName: "iPhone 16",
  appPath: "/path/to/app.app",
  appiumConfig: { host: "192.168.1.100", port: 4724, path: "/wd/hub" }
})
```

#### `appiumConfig`

<Option type={`{ host?: string; port?: number; path?: string; protocol?: string }`} required="No">

Appium server connection. Defaults to the `APPIUM_*` environment variables, or `{ host: "127.0.0.1", port: 4723, path: "/" }` when they are unset.

</Option>
## Electron Session Options

Options for `platform: "electron"` sessions. Electron runs locally only (`provider: "local"`), and the server manages its lifecycle: Electron sessions can't be attached, and `close_session` cannot detach them.

Point the session at the app with `electronRootDir`, or with `capabilities` containing `wdio:electronServiceOptions` with `appBinaryPath` or `appEntryPoint`.

### `electronRootDir`

<Option type="string" required="Conditional">

Project root used to discover the Electron Builder or Forge configuration. Required unless `capabilities` sets `wdio:electronServiceOptions` with `appBinaryPath` or `appEntryPoint`.

</Option>
### `electronDeeplinkScheme`

<Option type="string" required="No">

URI scheme without the colon (for example `myapp`) that `trigger_electron_deeplink` uses. Stored in lowercase.

</Option>
## Cloud Provider Options

### Credentials

Each cloud provider requires its own environment variables:

| Provider     | Username Variable            | Access Key Variable       |
| ------------ | ---------------------------- | ------------------------- |
| BrowserStack | `BROWSERSTACK_USERNAME`      | `BROWSERSTACK_ACCESS_KEY` |
| Sauce Labs   | `SAUCE_USERNAME`             | `SAUCE_ACCESS_KEY`        |
| TestMu       | `TESTMU_USERNAME`            | `TESTMU_ACCESS_KEY`       |
| TestingBot   | `TESTINGBOT_KEY`             | `TESTINGBOT_SECRET`       |
| Digital.ai   | `DIGITALAI_CLOUD_URL` (host) | `DIGITALAI_ACCESS_KEY`    |

Set these before starting the MCP server.

### `region`

<Option type={`"us-west-1" | "eu-central-1" | "apac-southeast-1"`} default={`"eu-central-1"`} required="No">

Sauce Labs data center region. Ignored for other providers.

</Option>
### `tunnel`

<Option type={`boolean | "external"`} default="false" required="No">

Enable local tunnel routing for cloud provider sessions (accessing localhost, staging environments, internal services). Only BrowserStack, Sauce Labs, TestMu, and TestingBot start tunnels; Digital.ai has no tunnel support, so the flag has no effect there.

-   `true` — Auto-start the tunnel before the session and stop it on close
-   `"external"` — Tunnel already running externally; sets provider-appropriate flags only

Before using `true`, read the provider's local-binary resource (`wdio://browserstack/local-binary`, `wdio://saucelabs/local-binary`, `wdio://testmu/local-binary`, or `wdio://testingbot/local-binary`) for setup instructions specific to your OS and architecture.

</Option>
### `tunnelName`

<Option type="string" required="No">

Tunnel identifier name. Required when `tunnel: "external"` to match the running tunnel. When `tunnel: true`, a unique name is auto-generated if not provided.

</Option>
### `reporting`

<Option type={`{ project?: string; build?: string; session?: string }`} required="No">

Cloud provider session labels visible in the provider's dashboard. Works identically across BrowserStack, Sauce Labs, TestMu, and TestingBot. Digital.ai uses the session label, or the project label when none is set, as its test name; `build` is not sent.

</Option>
### `trace`

<Option type="boolean" default="false" required="No">

Enable trace recording. When the session closes, or a later `start_session` replaces it, the server writes a Playwright-compatible zip to `.trace/` in the working directory, named `<timestamp>-<id8>.zip`. `<timestamp>` is the ISO time with `:` and `.` replaced by `-`, and `<id8>` is the first eight characters of the session ID. See [Viewing Traces](#viewing-traces).

</Option>
## Element Detection Options

Options for the `get_elements` tool.

### `inViewportOnly`

<Option type="boolean" default="false" required="No">

Only return elements visible in the current viewport. Set to `true` to reduce results on long pages.

</Option>
### `includeContainers`

<Option type="boolean" default="false" required="No">

Include container/layout elements in the results:

**Android containers:** `ViewGroup`, `FrameLayout`, `LinearLayout`, `RelativeLayout`, `ConstraintLayout`, `ScrollView`, `RecyclerView`

**iOS containers:** `View`, `StackView`, `CollectionView`, `ScrollView`, `TableView`

</Option>
### `includeBounds`

<Option type="boolean" default="false" required="No">

Include element bounding box coordinates (x, y, width, height) in the response.

</Option>
### Pagination

#### `limit`

<Option type="number" default="0 (unlimited)" required="No">

Maximum number of elements to return.

</Option>
#### `offset`

<Option type="number" default="0" required="No">

Number of elements to skip before returning results.

**Example:** Get elements 21–40:
```text
Get elements with limit 20 and offset 20
```

</Option>
## Accessibility Tree Options

Options for the `get_accessibility_tree` tool, which is listed only for Electron sessions. Browsers use `snapshot`.

### `limit`

<Option type="number" default="0 (unlimited)" required="No">

Maximum number of nodes to return.

</Option>
### `offset`

<Option type="number" default="0" required="No">

Number of nodes to skip for pagination.

</Option>
### `roles`

<Option type="string[]" default="All roles" required="No">

Filter to specific accessibility roles.

**Common roles:** `button`, `link`, `textbox`, `checkbox`, `radio`, `heading`, `img`, `listitem`

**Example:** Get only buttons and links:
```text
Get accessibility tree filtered to button and link roles
```

</Option>
## Screenshot

The `get_screenshot` tool takes no parameters. Screenshots are automatically processed:

| Optimization  | Value    | Description                                       |
| ------------- | -------- | ------------------------------------------------- |
| Max dimension | 2000px   | Images larger than 2000px are scaled down         |
| Max file size | 1MB      | Images are compressed to stay under 1MB           |
| Format        | PNG/JPEG | PNG with max compression; JPEG if needed for size |

## Viewing Traces

`wdio-show-trace` is a bin of the `@wdio/mcp` package. It serves one trace zip on a local port and opens it in the trace viewer at [player.vibium.dev](https://player.vibium.dev).

```sh
# Newest zip in ./.trace
npx -p @wdio/mcp wdio-show-trace

# A specific zip
npx -p @wdio/mcp wdio-show-trace path/to/trace.zip
```

Without a path, it opens the newest `.zip` in `./.trace` by modification time. Press Ctrl+C to stop the server.

## Session Behavior

### Session Types

| Type       | Description          | Auto-Detach                              |
| ---------- | -------------------- | ---------------------------------------- |
| `browser`  | Browser session      | No                                       |
| `electron` | Electron app session | No                                       |
| `ios`      | iOS app session      | Yes (if `noReset: true` or no `appPath`) |
| `android`  | Android app session  | Yes (if `noReset: true` or no `appPath`) |

### Named Sessions

The server can run several sessions at once. Every session has a session ID, and it can also have a name.

-   Give a session a `name` in `start_session` or `attach_session`. Names must be unique among live sessions.
-   `onExisting: "close"` (default) replaces the active session. `onExisting: "keep"` leaves the existing sessions running. A kept session does not become the default when one already exists, so target it by name.
-   Pass `session` (a name or a session ID) to any tool to target that session. Without it, the tool acts on the default session.
-   Results from a targeted call, or from any call while more than one session is live, start with `[session: <name> (<id8>)]`. Unnamed sessions show `[session: <id8>]`.
-   A tool that does not apply to a session's platform returns an error for that session.
-   Names last only while the server process runs.

```js
start_session({ name: "shop", platform: "browser", browser: "chrome", navigationUrl: "https://example.com" })
start_session({ name: "admin", onExisting: "keep", platform: "browser", browser: "firefox" })
snapshot({ session: "admin" })
```

### Detach vs Close

| Action     | `detach: false` (Close)      | `detach: true` (Detach)                      |
| ---------- | ---------------------------- | -------------------------------------------- |
| Browser    | Closes browser completely    | Keeps browser running, disconnects WebDriver |
| Mobile App | Terminates app               | Keeps app running in current state           |
| Use Case   | Clean slate for next session | Preserve state, manual inspection            |

## Performance Considerations

### Browser Automation

-   **Headless mode** is faster but doesn't render visual elements
-   **Smaller window sizes** reduce screenshot capture time
-   **Element detection** is optimized with a single script execution
-   **Screenshot optimization** keeps images under 1MB for efficient processing

### Mobile Automation

-   **XML page source parsing** uses only 2 HTTP calls (vs 600+ for traditional element queries)
-   **Accessibility ID selectors** are fastest and most reliable
-   **XPath selectors** are slowest; use only as a last resort
-   **Pagination** (`limit` and `offset`) reduces token usage for screens with many elements

### Token Usage Tips

| Setting                    | Impact                                              |
| -------------------------- | --------------------------------------------------- |
| `inViewportOnly: true`     | Filters off-screen elements, reducing response size |
| `includeContainers: false` | Excludes layout elements (ViewGroup, etc.)          |
| `includeBounds: false`     | Omits x/y/width/height data                         |
| `limit` with pagination    | Process elements in batches instead of all at once  |

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
