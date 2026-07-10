---
id: selenium
title: Selenium DevTools
---

Selenium WebDriver adapter for [WebdriverIO DevTools](https://github.com/webdriverio/devtools) - brings the same visual debugging UI to any `selenium-webdriver` test, regardless of the test runner.

Works with **Mocha**, **Jest**, **Cucumber**, or plain `node script.js` - the plugin auto-detects the runner and wires test boundaries accordingly. No changes to your test code are needed beyond a single import.

## Installation

```bash
npm install @wdio/selenium-devtools
```

## Setup

Each block below is a **complete, copy-paste-ready example** including the `DevTools.configure(...)` call. Pick the runner you use, drop the snippet into your project, and run it.

### Mocha

```js
// tests/example.test.js
import { strict as assert } from 'node:assert'
import { Builder, By, until } from 'selenium-webdriver'
import { DevTools } from '@wdio/selenium-devtools'

DevTools.configure({
  screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 }
})

describe('smoke test', function () {
  let driver

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build()
  })

  after(async function () {
    if (driver) {
      await driver.quit()
    }
  })

  it('loads example.com and reads the heading', async function () {
    await driver.get('https://example.com')
    const heading = await driver.wait(until.elementLocated(By.css('h1')), 10000)
    assert.equal(await heading.getText(), 'Example Domain')
  })
})
```

Run it:

```bash
mocha --timeout 60000 tests/example.test.js
```

> Alternative: skip the per-file import and use `mocha --require @wdio/selenium-devtools` to load the plugin once for the whole run.

### Jest

```js
// test/example.js
import { DevTools } from '@wdio/selenium-devtools'
import { Builder, By, until } from 'selenium-webdriver'

DevTools.configure({
  screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 }
})

describe('login flow', () => {
  let driver

  beforeEach(async () => {
    driver = await new Builder().forBrowser('chrome').build()
  }, 60000)

  afterEach(async () => {
    if (driver) {
      await driver.quit()
    }
  })

  test('logs in with valid credentials', async () => {
    await driver.get('https://the-internet.herokuapp.com/login')
    await driver.findElement(By.id('username')).sendKeys('tomsmith')
    await driver.findElement(By.id('password')).sendKeys('SuperSecretPassword!')
    await driver.findElement(By.css('button[type="submit"]')).click()

    await driver.wait(until.urlContains('/secure'), 10000)
    const flash = await driver.findElement(By.id('flash'))
    expect(await flash.getText()).toMatch(/You logged into a secure area/i)
  }, 60000)
})
```

`jest.config.json`:

```json
{
  "testEnvironment": "node",
  "testMatch": ["<rootDir>/test/example.js"],
  "testTimeout": 60000,
  "transform": {}
}
```

Run it (ESM needs the experimental flag):

```bash
NODE_OPTIONS=--experimental-vm-modules jest --config jest.config.json
```

### Cucumber

Cucumber's split layout means three small files - one to load the plugin, one for World/hooks, and one for step definitions.

`features/support/setup.js` - load the plugin and configure once:

```js
import { DevTools } from '@wdio/selenium-devtools'

DevTools.configure({
  screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 }
})
```

`features/support/world.js` - driver lifecycle:

```js
import {
  setWorldConstructor,
  World,
  Before,
  After,
  setDefaultTimeout
} from '@cucumber/cucumber'
import { Builder } from 'selenium-webdriver'

setDefaultTimeout(60000)

class CustomWorld extends World {
  constructor (options) {
    super(options)
    this.driver = null
  }
}

setWorldConstructor(CustomWorld)

Before(async function () {
  this.driver = await new Builder().forBrowser('chrome').build()
})

After(async function () {
  if (this.driver) {
    await this.driver.quit()
    this.driver = null
  }
})
```

`cucumber.json` - wire the setup file in **first** so the plugin patches Selenium before any step runs:

```json
{
  "default": {
    "import": [
      "features/support/setup.js",
      "features/support/world.js",
      "features/support/steps.js"
    ],
    "paths": ["features/*.feature"],
    "format": ["progress"]
  }
}
```

Run it:

```bash
cucumber-js --config cucumber.json
```

### Plain Node script (no test runner)

If you run `node tests/google.test.js` directly there's no runner for the plugin to auto-hook. By default you get a single "Selenium Session" row in the dashboard. To get a named test boundary, call `DevTools.startTest` / `endTest` around your work:

```js
// tests/google.test.js
import { DevTools } from '@wdio/selenium-devtools'
import { Builder, By, until, Key } from 'selenium-webdriver'

DevTools.configure({
  screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 },
  headless: false
})

async function run () {
  DevTools.startTest('search Google for Selenium')   // optional - names the test row

  const driver = await new Builder().forBrowser('chrome').build()
  try {
    await driver.get('https://www.google.com')
    const searchBox = await driver.findElement(By.name('q'))
    await searchBox.sendKeys('Selenium WebDriver JavaScript', Key.ENTER)
    await driver.wait(until.titleContains('Selenium'), 10000)
    DevTools.endTest('passed')
  } catch (err) {
    DevTools.endTest('failed')
    throw err
  } finally {
    await driver.quit()
  }
}

run()
```

```bash
node tests/google.test.js
```

> Only use `startTest` / `endTest` for plain Node scripts. Under Mocha / Jest / Cucumber the plugin already knows when each test starts and ends - calling these manually would create duplicate rows.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | Port for the DevTools backend server. Auto-incremented if already in use. |
| `hostname` | `string` | `'localhost'` | Hostname the backend server binds to. |
| `openUi` | `boolean` | `true` | Auto-open the DevTools UI in a new Chrome window. Set `false` for CI. |
| `captureScreenshots` | `boolean` | `true` | Capture a screenshot after every WebDriver command. |
| `headless` | `boolean` | `false` | Run the **test** browser headless (injects `--headless=old`). The DevTools UI window is unaffected. |
| `screencast` | `ScreencastOptions` | `{ enabled: false }` | Per-session `.webm` video recording. Options match the [WebdriverIO Screencast](/docs/devtools/wdio/screencast) page. |
| `rerunCommand` | `string` | auto | Command template for per-test rerun. `{{testName}}` is substituted. Auto-derived from runner argv if omitted. |
| `mode` | `'live' \| 'trace'` | `'live'` | `live` opens the DevTools UI; `trace` skips it and writes a portable artifact instead. See [Trace Mode](/docs/devtools/wdio/trace-mode). Overrides `openUi`. |
| `traceFormat` | `'zip' \| 'ndjson-directory'` | `'zip'` | Trace artifact layout. Only applies when `mode: 'trace'`. |
| `traceGranularity` | `'session' \| 'spec' \| 'test'` | `'session'` | One trace per session / spec file / test. `'test'` writes each to `test-results/<spec>-<title>-<browser>[-retryN]/trace.zip`. Only applies when `mode: 'trace'`. See [Trace Mode](/docs/devtools/wdio/trace-mode#trace-granularity--tracegranularity). |
| `tracePolicy` | `'on' \| 'retain-on-failure' \| 'retain-on-first-failure' \| 'on-first-retry' \| 'on-all-retries' \| 'retain-on-failure-and-retries'` | `'on'` | Which traces to keep. Pairs with `traceGranularity: 'test'`. Only applies when `mode: 'trace'`. |
| `captureAssertions` | `boolean` | `true` | Capture `node:assert` assertions as trace action rows. Set `false` to opt out. |

```js
DevTools.configure({
  port: 3000,
  hostname: 'localhost',
  headless: false,
  openUi: true
})
```

> **For CI**, set both `headless: true` (hide the test browser) and `openUi: false` (don't try to open the dashboard window - CI environments have no display). The backend keeps running on the configured port so you can still open the UI later if needed.

## Trace mode

Headless capture path — no DevTools UI window opens. At session end the adapter writes a portable `trace-<sessionId>.zip` (or directory) next to the test file, with the same shape as the WebdriverIO trace artifact.

```js
DevTools.configure({
  mode: 'trace',
  traceFormat: 'ndjson-directory'  // optional; default 'zip'
})
```

The backend port-bind, UI window, and `screencast` option are all skipped in trace mode. For the full feature reference (artifact contents, viewer, mobile testing, when to pick `zip` vs `ndjson-directory`), see the [Trace Mode page](/docs/devtools/wdio/trace-mode).

## Public API

```js
import { DevTools } from '@wdio/selenium-devtools'

DevTools.configure(opts)             // set runtime options (see above)
DevTools.startTest(name, meta?)      // mark a named test boundary (plain Node scripts only)
DevTools.endTest('passed'|'failed'|'skipped'|'pending')
```

Under Mocha / Jest / Cucumber the plugin auto-hooks the runner's lifecycle, so you don't need `startTest` / `endTest` manually - calling them would create duplicate rows.

## Examples

Working examples live in the repo's top-level `examples/` directory. Build the workspace once (`pnpm install && pnpm build`), then run from the repo root. `pnpm demo:selenium` runs the default (Cucumber) example; the per-runner variants are:

| Directory | Runner | Command |
|-----------|--------|---------|
| [`examples/selenium/mocha-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/mocha-test) | Mocha | `pnpm --filter @wdio/selenium-devtools example:mocha` |
| [`examples/selenium/jest-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/jest-test) | Jest | `pnpm --filter @wdio/selenium-devtools example:jest` |
| [`examples/selenium/cucumber-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/cucumber-test) | Cucumber | `pnpm demo:selenium` |

## Features

The Selenium adapter provides the same DevTools UI experience as WebdriverIO. Every feature below is captured automatically with the base `DevTools.configure({})` setup — no per-feature config (console + network stream via Selenium's BiDi handlers on Chrome ≥114, with an injected-collector fallback). Links go to each feature's full reference.

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Live browser previews, per-command screenshots, and one-click test/suite rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** - Snapshot a failing test, rerun it, and diff the two runs side-by-side
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** - Auto-detects Mocha, Jest, Cucumber, or a plain `node` script
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[Metadata](/docs/devtools/wdio/metadata)** - Session capabilities, environment, and timing per browser session
- **[TestLens](/docs/devtools/wdio/testlens)** - Jump from any command to the source line that triggered it
- **[Session Screencast](/docs/devtools/wdio/screencast)** - Automatic video recording of browser sessions
- **[Trace Mode](/docs/devtools/wdio/trace-mode)** - Headless capture producing a portable `trace.zip` (no UI window)

Screencast is the one feature with its own options (see [Configuration Options](#configuration-options)):

```js
DevTools.configure({ screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 } })
```

## How It Works

The plugin patches `selenium-webdriver`'s `Builder`, `WebDriver`, and `WebElement` prototypes at import time:

- **`Builder.build()`** - after construction, the driver is registered with the session capturer and the DevTools backend is started in a detached child process.
- **Every public `WebDriver` / `WebElement` method** - wrapped with command capture (args + result + screenshot + call source).
- **`WebDriver.quit()`** - an awaited cleanup hook flushes screencast encoding, WebSocket buffer, and final metadata before the original quit runs.

When BiDi is available (Chrome ≥114), console logs, JavaScript exceptions, and network events stream directly via the Selenium BiDi handlers. Otherwise the plugin falls back to an injected browser-side collector script.

## Limitations

| Limitation | Detail |
|-----------|--------|
| Cucumber leaf-step rerun | Cucumber's `--name` filter targets scenarios, not individual Gherkin steps. The dashboard's per-step rerun is disabled under Cucumber. |
| Headless mode caveat | `headless: true` injects `--headless=old`; `--headless=new` produces all-black CDP frames in the screencast. |
| Initial viewport | The dashboard's snapshot iframe falls back to 1280×800 until the first navigation completes and the browser-side collector reports the real viewport. |
