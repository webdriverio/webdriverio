---
id: mcp
title: MCP (Model Context Protocol)
---

## What can it do?

WebdriverIO MCP is a **Model Context Protocol (MCP) server** that enables AI assistants like Claude Desktop and Claude Code to automate and interact with web browsers and mobile applications.

### Why WebdriverIO MCP?

-   **Mobile-First**: Unlike browser-only MCP servers, WebdriverIO MCP supports iOS and Android native app automation via Appium
-   **Cross-Platform Selectors**: Smart element detection generates multiple locator strategies (accessibility ID, XPath, UiAutomator, iOS predicates) automatically
-   **WebdriverIO Ecosystem**: Built on the battle-tested WebdriverIO framework with its rich ecosystem of services and reporters

It provides a unified interface for:

-   🖥️ **Desktop Browsers** (Chrome - headed or headless mode)
-   📱 **Native Mobile Apps** (iOS Simulators / Android Emulators / Real Devices via Appium)
-   📳 **Hybrid Mobile Apps** (Native + WebView context switching via Appium)

through the [`@wdio/mcp`](https://www.npmjs.com/package/@wdio/mcp) package.

This allows AI assistants to:

-   **Launch and control browsers** with configurable dimensions, headless mode, and optional initial navigation
-   **Navigate websites** and interact with elements (click, type, scroll)
-   **Analyze page content** via accessibility tree and visible elements detection with pagination support
-   **Take screenshots** automatically optimized (resized, compressed to max 1MB)
-   **Manage cookies** for session handling
-   **Control mobile devices** including gestures (tap, swipe, drag and drop)
-   **Switch contexts** in hybrid apps between native and webview
-   **Execute scripts** - JavaScript in browsers, Appium mobile commands on devices
-   **Handle device features** like rotation, keyboard, geolocation
-   and much more, see the [Tools](./mcp/tools) and [Configuration](./mcp/configuration) options

:::info

NOTE For Mobile Apps
Mobile automation requires a running Appium server with the appropriate drivers installed. See [Prerequisites](#prerequisites) for setup instructions.

:::

## Installation

The easiest way to use `@wdio/mcp` is via npx without any local installation:

```sh
npx @wdio/mcp
```

Or install it globally:

```sh
npm install -g @wdio/mcp
```

## Usage with Claude

To use WebdriverIO MCP with Claude, modify the configuration file:

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

After adding the configuration, restart Claude. The WebdriverIO MCP tools will be available for browser and mobile automation tasks.

### Usage with Claude Code

Claude Code automatically detects MCP servers. You can configure it in your project's `.claude/settings.json`, or `.mcp.json`.

Or add it to .claude.json globally with executing:
```bash
claude mcp add --transport stdio wdio-mcp -- npx -y @wdio/mcp
```
Validate it by running the `/mcp` command inside claude code.

## Quick Start Examples

### Browser Automation

Ask Claude to automate browser tasks:

```
"Open Chrome and navigate to https://webdriver.io"
"Click the 'Get Started' button"
"Take a screenshot of the page"
"Find all visible links on the page"
```

### Mobile App Automation

Ask Claude to automate mobile apps:

```
"Start my iOS app on the iPhone 15 simulator"
"Tap the login button"
"Swipe up to scroll down"
"Take a screenshot of the current screen"
```

## Capabilities

### Browser Automation (Chrome)

| Feature | Description |
|---------|-------------|
| **Session Management** | Launch Chrome in headed/headless mode with custom dimensions and optional navigation URL |
| **Navigation** | Navigate to URLs |
| **Element Interaction** | Click elements, type text, find elements by various selectors |
| **Page Analysis** | Get visible elements (with pagination), accessibility tree (with filtering) |
| **Screenshots** | Capture screenshots (auto-optimized to max 1MB) |
| **Scrolling** | Scroll up/down by configurable pixel amounts |
| **Cookie Management** | Get, set, and delete cookies |
| **Script Execution** | Execute custom JavaScript in browser context |

### Mobile App Automation (iOS/Android)

| Feature | Description |
|---------|-------------|
| **Session Management** | Launch apps on simulators, emulators, or real devices |
| **Touch Gestures** | Tap, swipe, drag and drop |
| **Element Detection** | Smart element detection with multiple locator strategies and pagination |
| **App Lifecycle** | Get app state (via `execute_script` for activate/terminate) |
| **Context Switching** | Switch between native and webview contexts in hybrid apps |
| **Device Control** | Rotate device, keyboard control |
| **Geolocation** | Get and set device GPS coordinates |
| **Permissions** | Automatic permission and alert handling |
| **Script Execution** | Execute Appium mobile commands (pressKey, deepLink, shell, etc.) |

## Prerequisites

### Browser Automation

-   **Chrome** must be installed on your system
-   WebdriverIO handles automated ChromeDriver management

### Mobile Automation

#### iOS

1. **Install Xcode** from the Mac App Store
2. **Install Xcode Command Line Tools**:
   ```sh
   xcode-select --install
   ```
3. **Install Appium**:
   ```sh
   npm install -g appium
   ```
4. **Install the XCUITest driver**:
   ```sh
   appium driver install xcuitest
   ```
5. **Start the Appium server**:
   ```sh
   appium
   ```
6. **For Simulators**: Open Xcode → Window → Devices and Simulators to create/manage simulators
7. **For Real Devices**: You'll need the device UDID (40-character unique identifier)

#### Android

1. **Install Android Studio** and set up Android SDK
2. **Set environment variables**:
   ```sh
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
3. **Install Appium**:
   ```sh
   npm install -g appium
   ```
4. **Install the UiAutomator2 driver**:
   ```sh
   appium driver install uiautomator2
   ```
5. **Start the Appium server**:
   ```sh
   appium
   ```
6. **Create an emulator** via Android Studio → Virtual Device Manager
7. **Start the emulator** before running tests

## Architecture

### How It Works

WebdriverIO MCP acts as a bridge between AI assistants and browser/mobile automation:

```
┌─────────────────┐     MCP Protocol      ┌─────────────────┐
│  Claude Desktop │ ◄──────────────────►  │    @wdio/mcp    │
│  or Claude Code │      (stdio)          │     Server      │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                             WebDriverIO API
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
            ┌───────▼───────┐             ┌───────▼───────┐             ┌───────▼───────┐
            │    Chrome     │             │    Appium     │             │    Appium     │
            │   (Browser)   │             │     (iOS)     │             │   (Android)   │
            └───────────────┘             └───────────────┘             └───────────────┘
```

### Session Management

-   **Single-session model**: Only one browser OR app session can be active at a time
-   **Session state** is maintained globally across tool calls
-   **Auto-detach**: Sessions with preserved state (`noReset: true`) automatically detach on close

### Element Detection

#### Browser (Web)

-   Uses an optimized browser script to find all visible, interactable elements
-   Returns elements with CSS selectors, IDs, classes, and ARIA information
-   Filters to viewport-visible elements by default

#### Mobile (Native Apps)

-   Uses efficient XML page source parsing (2 HTTP calls vs 600+ for traditional queries)
-   Platform-specific element classification for Android and iOS
-   Generates multiple locator strategies per element:
    -   Accessibility ID (cross-platform, most stable)
    -   Resource ID / Name attribute
    -   Text / Label matching
    -   XPath (full and simplified)
    -   UiAutomator (Android) / Predicates (iOS)

## Selector Syntax

The MCP server supports multiple selector strategies. See [Selectors](./mcp/selectors) for detailed documentation.

### Web (CSS/XPath)

```
# CSS Selectors
button.my-class
#element-id
[data-testid="login"]

# XPath
//button[@class='submit']
//a[contains(text(), 'Click')]

# Text Selectors (WebdriverIO specific)
button=Exact Button Text
a*=Partial Link Text
```

### Mobile (Cross-Platform)

```
# Accessibility ID (recommended - works on iOS & Android)
~loginButton

# Android UiAutomator
android=new UiSelector().text("Login")

# iOS Predicate String
-ios predicate string:label == "Login"

# iOS Class Chain
-ios class chain:**/XCUIElementTypeButton[`label == "Login"`]

# XPath (works on both platforms)
//android.widget.Button[@text="Login"]
//XCUIElementTypeButton[@label="Login"]
```

## Available Tools

The MCP server provides 25 tools for browser and mobile automation. See [Tools](./mcp/tools) for the complete reference.

### Browser Tools

| Tool | Description |
|------|-------------|
| `start_browser` | Launch Chrome browser (with optional initial URL) |
| `close_session` | Close or detach from session |
| `navigate` | Navigate to a URL |
| `click_element` | Click an element |
| `set_value` | Type text into input |
| `get_visible_elements` | Get visible/interactable elements (with pagination) |
| `get_accessibility` | Get accessibility tree (with filtering) |
| `take_screenshot` | Capture screenshot (auto-optimized) |
| `scroll` | Scroll the page up or down |
| `get_cookies` / `set_cookie` / `delete_cookies` | Cookie management |
| `execute_script` | Execute JavaScript in browser |

### Mobile Tools

| Tool | Description |
|------|-------------|
| `start_app_session` | Launch iOS/Android app |
| `tap_element` | Tap element or coordinates |
| `swipe` | Swipe in a direction |
| `drag_and_drop` | Drag between locations |
| `get_app_state` | Check if app is running |
| `get_contexts` / `switch_context` | Hybrid app context switching |
| `rotate_device` | Rotate to portrait/landscape |
| `get_geolocation` / `set_geolocation` | Get or set GPS coordinates |
| `hide_keyboard` | Dismiss on-screen keyboard |
| `execute_script` | Execute Appium mobile commands |

## Automatic Handling

### Permissions

By default, the MCP server automatically grants app permissions (`autoGrantPermissions: true`), eliminating the need to manually handle permission dialogs during automation.

### System Alerts

System alerts (like "Allow notifications?") are automatically accepted by default (`autoAcceptAlerts: true`). This can be configured to dismiss instead with `autoDismissAlerts: true`.

## Configuration

### Environment Variables

Configure the Appium server connection:

| Variable | Default | Description |
|----------|---------|-------------|
| `APPIUM_URL` | `127.0.0.1` | Appium server hostname |
| `APPIUM_URL_PORT` | `4723` | Appium server port |
| `APPIUM_PATH` | `/` | Appium server path |

### Example with Custom Appium Server

```json
{
    "mcpServers": {
        "wdio-mcp": {
            "command": "npx",
            "args": ["-y", "@wdio/mcp"],
            "env": {
                "APPIUM_URL": "192.168.1.100",
                "APPIUM_URL_PORT": "4724"
            }
        }
    }
}
```

## Performance Optimization

The MCP server is optimized for efficient AI assistant communication:

-   **TOON Format**: Uses Token-Oriented Object Notation for minimal token usage
-   **XML Parsing**: Mobile element detection uses 2 HTTP calls (vs 600+ traditionally)
-   **Screenshot Compression**: Images auto-compressed to max 1MB using Sharp
-   **Viewport Filtering**: Only visible elements returned by default
-   **Pagination**: Large element lists can be paginated to reduce response size

## TypeScript Support

The MCP server is written in TypeScript and includes full type definitions. If you're extending or integrating with the server programmatically, you'll benefit from auto-completion and type safety.

## Error Handling

All tools are designed with robust error handling:

-   Errors are returned as text content (never thrown), maintaining MCP protocol stability
-   Descriptive error messages help diagnose issues
-   Session state is preserved even when individual operations fail

## Use Cases

### Quality Assurance

-   AI-powered test case execution
-   Visual regression testing with screenshots
-   Accessibility auditing via accessibility tree analysis

### Web Scraping & Data Extraction

-   Navigate complex multi-page flows
-   Extract structured data from dynamic content
-   Handle authentication and session management

### Mobile App Testing

-   Cross-platform test automation (iOS + Android)
-   Onboarding flow validation
-   Deep linking and navigation testing

### Integration Testing

-   End-to-end workflow testing
-   API + UI integration verification
-   Multi-platform consistency checks

## Troubleshooting

### Browser won't start

-   Ensure Chrome is installed
-   Check that no other process is using the default debugging port (9222)
-   Try headless mode if display issues occur

### Appium connection failed

-   Verify Appium server is running (`appium`)
-   Check the Appium URL and port configuration
-   Ensure the appropriate driver is installed (`appium driver list`)

### iOS Simulator issues

-   Ensure Xcode is installed and up to date
-   Check that simulators are available (`xcrun simctl list devices`)
-   For real devices, verify the UDID is correct

### Android Emulator issues

-   Ensure Android SDK is properly configured
-   Verify emulator is running (`adb devices`)
-   Check that `ANDROID_HOME` environment variable is set

## Resources

-   [Tools Reference](./mcp/tools) - Complete list of available tools
-   [Selectors Guide](./mcp/selectors) - Selector syntax documentation
-   [Configuration](./mcp/configuration) - Configuration options
-   [FAQ](./mcp/faq) - Frequently asked questions
-   [GitHub Repository](https://github.com/webdriverio/mcp) - Source code and issues
-   [NPM Package](https://www.npmjs.com/package/@wdio/mcp) - Package on npm
-   [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
