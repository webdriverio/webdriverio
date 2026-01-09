---
id: faq
title: FAQ
---

Frequently asked questions about WebdriverIO MCP.

## General

### What is MCP?

MCP (Model Context Protocol) is an open protocol that enables AI assistants like Claude to interact with external tools and services. WebdriverIO MCP implements this protocol to provide browser and mobile automation capabilities to Claude Desktop and Claude Code.

### What can I automate with WebdriverIO MCP?

You can automate:
-   **Desktop browsers** (Chrome) - navigation, clicking, typing, screenshots
-   **iOS apps** - on simulators or real devices
-   **Android apps** - on emulators or real devices
-   **Hybrid apps** - switching between native and web contexts

### Do I need to write code?

No! That's the main benefit of MCP. You can describe what you want to do in natural language, and Claude will use the appropriate tools to accomplish the task.

**Example prompts:**
-   "Open Chrome and navigate to webdriver.io"
-   "Click the Get Started button"
-   "Take a screenshot of the current page"
-   "Start my iOS app and log in as test user"

---

## Installation & Setup

### How do I install WebdriverIO MCP?

You don't need to install it separately. The MCP server runs automatically via npx when you configure it in Claude Desktop or Claude Code.

Add this to your Claude Desktop config:

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

### Where is the Claude Desktop config file?

-   **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
-   **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Do I need Appium for browser automation?

No. Browser automation only requires Chrome to be installed. WebdriverIO handles the ChromeDriver automatically.

### Do I need Appium for mobile automation?

Yes. Mobile automation requires:
1. Appium server running (`npm install -g appium && appium`)
2. Platform drivers installed (`appium driver install xcuitest` for iOS, `appium driver install uiautomator2` for Android)
3. Appropriate development tools (Xcode for iOS, Android SDK for Android)

---

## Browser Automation

### Which browsers are supported?

Currently, only **Chrome** is supported. Support for other browsers may be added in future versions.

### Can I run Chrome in headless mode?

Yes! Ask Claude to start the browser in headless mode:

"Start Chrome in headless mode"

Or Claude will use this option when appropriate (e.g., in CI/CD contexts).

### Can I set the browser window size?

Yes. You can specify dimensions when starting the browser:

"Start Chrome with a window size of 1920x1080"

Supported dimensions: 400-3840 pixels wide, 400-2160 pixels tall.

### How do I take screenshots?

Simply ask Claude:

"Take a screenshot of the current page"

Screenshots are captured as PNG images.

### Can I interact with iframes?

Currently, the MCP server operates on the main document. iframe interaction may be added in future versions.

---

## Mobile Automation

### How do I start an iOS app?

Ask Claude with the necessary details:

"Start my iOS app located at /path/to/MyApp.app on the iPhone 15 simulator"

Or for an installed app:

"Start the app with bundle ID com.example.myapp on the iPhone 15 simulator"

### How do I start an Android app?

"Start my Android app at /path/to/app.apk on the Pixel 7 emulator"

Or for an installed app:

"Start the app with package com.example.myapp on the Pixel 7 emulator"

### Can I test on real devices?

Yes! For real devices, you'll need the device UDID:

-   **iOS:** Connect device, open Finder, click device, click serial number to reveal UDID
-   **Android:** Run `adb devices` in terminal

Then ask Claude:

"Start my iOS app on the real device with UDID abc123..."

### How do I handle permission dialogs?

By default, permissions are automatically granted (`autoGrantPermissions: true`). If you need to test permission flows, you can disable this:

"Start my app without automatically granting permissions"

### What gestures are supported?

-   **Tap:** Tap on elements or coordinates
-   **Swipe:** Swipe up, down, left, or right
-   **Long Press:** Hold on an element
-   **Drag and Drop:** Drag from one point to another

### How do I scroll in mobile apps?

Use swipe gestures:

"Swipe up to scroll down"
"Swipe down to scroll up"

### Can I rotate the device?

Yes:

"Rotate the device to landscape"
"Rotate the device to portrait"

### How do I handle hybrid apps?

For apps with webviews, you can switch contexts:

"Get available contexts"
"Switch to the webview context"
"Switch back to native context"

---

## Element Selection

### How does Claude know which element to interact with?

Claude uses the `get_visible_elements` tool to identify interactive elements on the page/screen. Each element comes with multiple selector strategies.

### What if Claude clicks the wrong element?

You can be more specific:

-   Provide exact text: "Click the button that says 'Submit Order'"
-   Provide selector: "Click the element with selector #submit-btn"
-   Provide accessibility ID: "Click the element with accessibility ID loginButton"

### What's the best selector strategy for mobile?

1. **Accessibility ID** (best) - `~loginButton`
2. **Resource ID** (Android) - `id=login_button`
3. **Predicate String** (iOS) - `-ios predicate string:label == "Login"`
4. **XPath** (last resort) - slower but works everywhere

---

## Session Management

### Can I have multiple sessions at once?

No. The MCP server uses a single-session model. Only one browser or app session can be active at a time.

### What happens when I close a session?

It depends on the session type and settings:

-   **Browser:** Chrome closes completely
-   **Mobile with `noReset: false`:** App terminates
-   **Mobile with `noReset: true`:** App stays open (session detaches)

### Can I preserve app state between sessions?

Yes! Use the `noReset` option:

"Start my app with noReset enabled"

This preserves login state, preferences, and other app data.

### What's the difference between close and detach?

-   **Close:** Terminates the browser/app completely
-   **Detach:** Disconnects automation but keeps browser/app running

Detach is useful when you want to manually inspect the state after automation.

---

## Troubleshooting

### "Session not found" error

This means no active session exists. Start a browser or app session first:

"Start Chrome and navigate to google.com"

### "Element not found" error

The element might not be visible or might have a different selector. Try:

1. Asking Claude to get all visible elements first
2. Providing a more specific selector
3. Waiting for the page/app to fully load

### Browser won't start

1. Ensure Chrome is installed
2. Check if another process is using the debugging port (9222)
3. Try headless mode

### Appium connection failed

1. Verify Appium is running: `curl http://localhost:4723/status`
2. Check your Appium URL configuration
3. Ensure drivers are installed: `appium driver list --installed`

### iOS Simulator won't start

1. Ensure Xcode is installed: `xcode-select --install`
2. List available simulators: `xcrun simctl list devices`
3. Check for specific simulator errors in Console.app

### Android Emulator won't start

1. Set `ANDROID_HOME`: `export ANDROID_HOME=$HOME/Library/Android/sdk`
2. Check emulators: `emulator -list-avds`
3. Start emulator manually: `emulator -avd <avd-name>`
4. Verify device is connected: `adb devices`

### Screenshots aren't working

1. For mobile, ensure the session is active
2. For browser, try a different page (some pages block screenshots)
3. Check Claude Desktop logs for errors

---

## Performance

### Why is mobile automation slow?

Mobile automation involves:
1. Network communication with Appium server
2. Appium communicating with the device/simulator
3. Device rendering and response

Tips for faster automation:
-   Use emulators/simulators instead of real devices for development
-   Use accessibility IDs instead of XPath
-   Enable `inViewportOnly: true` for element detection

### How can I speed up element detection?

The MCP server already optimizes element detection using XML page source parsing (2 HTTP calls vs 600+ for traditional element queries). Additional tips:

-   Keep `inViewportOnly: true` (default)
-   Set `includeContainers: false` (default)
-   Use specific selectors instead of finding all elements

---

## Limitations

### What are the current limitations?

-   **Single session:** Only one browser/app at a time
-   **Browser support:** Chrome only (for now)
-   **iframe support:** Limited support for iframes
-   **File uploads:** Not directly supported via tools
-   **Audio/Video:** Cannot interact with media playback
-   **Browser extensions:** Not supported

### Can I use this for production testing?

WebdriverIO MCP is designed for interactive AI-assisted automation. For production CI/CD testing, consider using WebdriverIO's traditional test runner with full programmatic control.

---

## Security

### Is my data secure?

The MCP server runs locally on your machine. All automation happens through local browser/Appium connections. No data is sent to external servers beyond what you explicitly navigate to.

### Can Claude access my passwords?

Claude can see page content and interact with elements, but:
-   Passwords in `<input type="password">` fields are masked
-   You should avoid automating sensitive credentials
-   Use test accounts for automation

---

## Contributing

### How can I contribute?

Visit the [GitHub repository](https://github.com/webdriverio/mcp) to:
-   Report bugs
-   Request features
-   Submit pull requests

### Where can I get help?

-   [WebdriverIO Discord](https://discord.webdriver.io/)
-   [GitHub Issues](https://github.com/webdriverio/mcp/issues)
-   [WebdriverIO Documentation](https://webdriver.io/)
