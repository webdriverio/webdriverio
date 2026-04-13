---
id: wdio
title: WebDriverIO DevTools
---

The DevTools service provides a powerful browser-based debugging interface for WebdriverIO test executions. It allows you to visualize, debug, and control your tests in real-time through an interactive web application.

## Installation

```sh
npm install --save-dev @wdio/devtools-service
```

## Configuration

Add the service to your WebDriverIO configuration:

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['devtools', {
            port: 3000,      // Port for the devtools UI (default: 3000)
        }]
    ],
    // ...
};
```

## Usage

1. Run your WebdriverIO tests
2. The DevTools UI automatically opens in a browser window at `http://localhost:3000`
3. Tests begin executing with real-time visualization
4. After the initial run, use play buttons to rerun individual tests or suites
5. Click the stop button anytime to terminate running tests
6. Explore the Actions, Metadata, Console Logs, and Network tabs in the workbench

## Features

Explore the WebDriverIO DevTools features in detail:

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Real-time browser previews with test rerunning
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** - Works with Mocha, Jasmine, and Cucumber
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[TestLens](/docs/devtools/wdio/testlens)** - Navigate to source code with intelligent code navigation
