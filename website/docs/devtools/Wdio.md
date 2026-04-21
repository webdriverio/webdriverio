---
id: wdio
title: WebDriverIO DevTools
---

A WebdriverIO service that provides a developer tools UI for running, debugging, and inspecting browser automation tests. Features include DOM mutation replay, per-command screenshots, network request inspection, console log capture, and session screencast recording.

## Installation

```sh
npm install @wdio/devtools-service --save-dev
```

## Usage

### Test Runner

```ts
// wdio.conf.ts
export const config = {
  services: ['devtools'],
}
```

### Standalone

```ts
import { remote } from 'webdriverio'
import { setupForDevtools } from '@wdio/devtools-service'

const browser = await remote(setupForDevtools({
  capabilities: { browserName: 'chrome' }
}))
await browser.url('https://example.com')
await browser.deleteSession()
```

## Service Options

```ts
services: [['devtools', options]]
```

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | random | Port the DevTools UI server listens on |
| `hostname` | `string` | `'localhost'` | Hostname the DevTools UI server binds to |
| `devtoolsCapabilities` | `Capabilities` | Chrome 1600x1200 | Capabilities used to open the DevTools UI window |
| `screencast` | `ScreencastOptions` | — | Session video recording ([see Screencast](/docs/devtools/wdio/screencast)) |

## Getting Started

1. Run your WebdriverIO tests
2. The DevTools UI automatically opens in an external browser window
3. Tests begin executing immediately with real-time visualization
4. View live browser preview, test progress, and command execution
5. After initial run completes, use play buttons to rerun individual tests or suites
6. Click stop button anytime to terminate running tests
7. Explore actions, metadata, console logs, and source code in the workbench tabs

## Features

Explore the WebDriverIO DevTools features in detail:

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Real-time browser previews with test rerunning
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** - Works with Mocha, Jasmine, and Cucumber
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[TestLens](/docs/devtools/wdio/testlens)** - Navigate to source code with intelligent code navigation
- **[Session Screencast](/docs/devtools/wdio/screencast)** - Automatic video recording of browser sessions
