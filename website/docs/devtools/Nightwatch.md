---
id: nightwatch
title: Nightwatch DevTools
---

`@wdio/nightwatch-devtools` is a dedicated adapter that brings the same powerful DevTools UI to your [Nightwatch.js](https://nightwatchjs.org/) test suite - **zero changes to your test files required**.

It uses the same backend, same UI, and same capture infrastructure as the WebDriverIO DevTools service, providing approximately **80–90% feature parity**.

## Installation

```sh
npm install --save-dev @wdio/devtools-service
```

> `@wdio/nightwatch-devtools` is included as a dependency of `@wdio/devtools-service`. No separate installation needed — just import from `@wdio/nightwatch-devtools` directly in your config.

## Setup

### Standard Nightwatch (Mocha-style)

```js
// nightwatch.conf.cjs
const nightwatchDevtools = require('@wdio/nightwatch-devtools').default

module.exports = {
    src_folders: ['tests'],

    test_settings: {
        default: {
            desiredCapabilities: {
                browserName: 'chrome',
                // Required for network request capture
                'goog:loggingPrefs': { performance: 'ALL' }
            },
            globals: nightwatchDevtools({ port: 3000 })
        }
    }
}
```

Run your tests as normal — the DevTools UI opens automatically in a new browser window:

```sh
# Run all tests
nightwatch

# Run a specific test file
nightwatch tests/myTest.js

# Run with a specific environment
nightwatch --env chrome
```

### Cucumber / BDD

Import `cucumberHooksPath` alongside the main export and pass it to the Cucumber `require` option. This registers `Before`/`After` scenario hooks automatically:

```js
// nightwatch.conf.cjs
const nightwatchDevtools = require('@wdio/nightwatch-devtools').default
const { cucumberHooksPath } = require('@wdio/nightwatch-devtools')

module.exports = {
    src_folders: ['features/step_definitions'],

    test_runner: {
        type: 'cucumber',
        options: {
            feature_path: 'features',
            require: [cucumberHooksPath]  // registers DevTools Cucumber hooks
        }
    },

    test_settings: {
        default: {
            desiredCapabilities: {
                browserName: 'chrome',
                'goog:loggingPrefs': { performance: 'ALL' }
            },
            globals: nightwatchDevtools({ port: 3000 })
        }
    }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | Port for the DevTools backend server. Auto-incremented if already in use. |
| `hostname` | `string` | `'localhost'` | Hostname the backend server binds to. |

```js
globals: nightwatchDevtools({
    port: 3000,
    hostname: 'localhost'
})
```

## Features

The Nightwatch adapter provides the same DevTools UI experience:

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Real-time browser previews with test rerunning
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[TestLens](/docs/devtools/wdio/testlens)** - Navigate to source code with intelligent code navigation

## Limitations

Nightwatch does not provide the same depth of framework hooks as WebdriverIO, so there are a few differences:

| Limitation | Details |
|-----------|---------|
| No native command hooks | Nightwatch has no `beforeCommand`/`afterCommand` hook. Commands are intercepted via a browser proxy wrapper instead. |
| Limited test context | `browser.currentTest` provides less metadata than the WDIO runner context; test names and file paths require additional heuristics. |
| Flat suite nesting | Nightwatch does not natively support multiply-nested `describe` blocks; the plugin reports a maximum of two levels. |
| Delayed result availability | Test results are only finalised in `afterEach`, not available mid-test. |
