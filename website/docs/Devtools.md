---
id: devtools
title: DevTools
---

The DevTools service provides a powerful browser-based debugging interface for WebdriverIO test executions. It allows you to visualize, debug, and control your tests in real-time through an interactive web application.

## Overview

This service enables you to:

- **Rerun tests selectively** - Click on any test case or suite to re-execute it instantly
- **Debug visually** - See live browser previews with automatic screenshots
- **Track execution** - View detailed command logs with timestamps and results
- **Monitor network & console** - Inspect API calls and JavaScript logs
- **Navigate to code** - Jump directly to test source files

## Installation

Install the service as a dev dependency:

```sh
npm install --save-dev @wdio/devtools-service
```

## Configuration

Add the service to your WebDriverIO configuration:

```js
// wdio.conf.js
export const config = {
    // ...
    services: ['devtools'],
    // ...
};
```

### Service Options

Configure the DevTools service with these options:

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

#### Options

- **port** (number, default: `3000`) - Port number for the devtools UI server

## How It Works

When you run your WebdriverIO tests with the DevTools service enabled:

1. The service opens a browser window at `http://localhost:3000` (configurable)
2. Your tests execute normally while the DevTools UI displays real-time updates
3. The UI shows test hierarchy, browser preview, command timeline, and logs
4. After tests complete, you can click any test to rerun it individually
5. Tests rerun in the same browser session for faster debugging

## Features

Explore the DevTools features in detail:

- **[Interactive Test Rerunning & Visualization](devtools/interactive-test-rerunning)** - Real-time browser previews with test rerunning
- **[Multi-Framework Support](devtools/multi-framework-support)** - Works with Mocha, Jasmine, and Cucumber
- **[Console Logs](devtools/console-logs)** - Capture and inspect browser console output
- **[Network Logs](devtools/network-logs)** - Monitor API calls and network activity
- **[TestLens](devtools/testlens)** - Navigate to source code with intelligent code navigation
