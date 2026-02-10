---
title: "Introducing WebdriverIO MCP: We're Late, But We Brought Snacks"
authors: winify
---

Yes, we know. [Playwright has an MCP server](https://github.com/microsoft/playwright-mcp). [Appium has one too](https://github.com/anthropics/mcp-server-appium). We're not first to the party.

But if you're already using WebdriverIO for cross-platform testing, you know it handles both web and mobile in one framework. Why should your AI assistant need two separate MCP servers to do the same thing?

That's why we built `@wdio/mcp`. One server for browsers and mobile apps, built on the WebdriverIO you already know.

<!-- truncate -->

## What It Does

Hook up Claude (or any MCP-compatible assistant) and start automating:

- **Desktop Browsers** - Chrome, headed or headless
- **Native Mobile Apps** - iOS Simulators, Android Emulators, real devices via Appium
- **Hybrid Apps** - Switch between native and webview contexts

The nice part: you can say *"test the login flow on iPhone 15"* then *"now try the same on Chrome desktop"* without switching tools or reconfiguring. Same conversation, same context.

## Quick Start

Add this to your Claude Desktop or Claude Code MCP config:

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

Restart Claude, and you're ready to go:

```
"Open Chrome and navigate to https://webdriver.io"
"Click the Get Started button"
"Take a screenshot"
```

For mobile:

```
"Launch my app on iPhone 15 simulator"
"Tap the login button"
"Swipe up to scroll"
```

## Why Not Just Use Playwright MCP + Appium MCP?

You could, and they're solid tools. But if your testing already spans web and mobile, managing two MCP servers adds friction - two configs, two mental models, and an assistant that needs to know which tool to reach for.

With `@wdio/mcp`, the assistant doesn't need to care whether it's talking to a browser or a phone. It sends commands and WebdriverIO handles the rest.

## What's Next: Cloud Testing

Local automation is useful for development and exploration, but real validation needs scale. We're working on cloud provider support, starting with BrowserStack.

The goal: point your AI assistant at a device farm and validate your app across dozens of browser and device combinations. Describe what you want to verify, and let the assistant handle execution across the matrix.

BrowserStack integration is first, with LambdaTest and Sauce Labs on the roadmap.

## Learn More

Full documentation at [MCP docs](/docs/mcp) - setup guides, tool reference, and selector syntax for web and mobile.

Questions or feedback? Find us on [Discord](https://discord.webdriver.io).

Happy testing!
