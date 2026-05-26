---
id: selenium
title: Selenium DevTools
---

Selenium WebDriver adapter for [WebdriverIO DevTools](https://github.com/webdriverio/devtools) — brings the same visual debugging UI to any `selenium-webdriver` test, regardless of the test runner.

Works with **Mocha**, **Jest**, **Cucumber**, or plain `node script.js` — the plugin auto-detects the runner and wires test boundaries accordingly. No changes to your test code are needed beyond a single import.

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

Cucumber's split layout means three small files — one to load the plugin, one for World/hooks, and one for step definitions.

`features/support/setup.js` — load the plugin and configure once:

```js
import { DevTools } from '@wdio/selenium-devtools'

DevTools.configure({
  screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 }
})
```

`features/support/world.js` — driver lifecycle:

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

`cucumber.json` — wire the setup file in **first** so the plugin patches Selenium before any step runs:

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
  DevTools.startTest('search Google for Selenium')   // optional — names the test row

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

> Only use `startTest` / `endTest` for plain Node scripts. Under Mocha / Jest / Cucumber the plugin already knows when each test starts and ends — calling these manually would create duplicate rows.

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

```js
DevTools.configure({
  port: 3000,
  hostname: 'localhost',
  headless: false,
  openUi: true
})
```

> **For CI**, set both `headless: true` (hide the test browser) and `openUi: false` (don't try to open the dashboard window — CI environments have no display). The backend keeps running on the configured port so you can still open the UI later if needed.

## Public API

```js
import { DevTools } from '@wdio/selenium-devtools'

DevTools.configure(opts)             // set runtime options (see above)
DevTools.startTest(name, meta?)      // mark a named test boundary (plain Node scripts only)
DevTools.endTest('passed'|'failed'|'skipped'|'pending')
```

Under Mocha / Jest / Cucumber the plugin auto-hooks the runner's lifecycle, so you don't need `startTest` / `endTest` manually — calling them would create duplicate rows.

## Examples

Working examples are included in the package:

| Directory | Runner | Command |
|-----------|--------|---------|
| [`example/mocha-test/`](https://github.com/webdriverio/devtools/tree/main/packages/selenium-devtools/example/mocha-test) | Mocha | `pnpm example:mocha` |
| [`example/jest-test/`](https://github.com/webdriverio/devtools/tree/main/packages/selenium-devtools/example/jest-test) | Jest | `pnpm example:jest` |
| [`example/cucumber-test/`](https://github.com/webdriverio/devtools/tree/main/packages/selenium-devtools/example/cucumber-test) | Cucumber | `pnpm example:cucumber` |

Build the package first:

```bash
# From repo root
pnpm build --filter @wdio/selenium-devtools
cd packages/selenium-devtools
pnpm example:mocha
```

## Features

The Selenium adapter provides the same DevTools UI experience:

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Real-time browser previews with test rerunning
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[TestLens](/docs/devtools/wdio/testlens)** - Navigate to source code with intelligent code navigation
- **[Session Screencast](/docs/devtools/wdio/screencast)** - Automatic video recording of browser sessions

## How It Works

The plugin patches `selenium-webdriver`'s `Builder`, `WebDriver`, and `WebElement` prototypes at import time:

- **`Builder.build()`** — after construction, the driver is registered with the session capturer and the DevTools backend is started in a detached child process.
- **Every public `WebDriver` / `WebElement` method** — wrapped with command capture (args + result + screenshot + call source).
- **`WebDriver.quit()`** — an awaited cleanup hook flushes screencast encoding, WebSocket buffer, and final metadata before the original quit runs.

When BiDi is available (Chrome ≥114), console logs, JavaScript exceptions, and network events stream directly via the Selenium BiDi handlers. Otherwise the plugin falls back to an injected browser-side collector script.

## Limitations

| Limitation | Detail |
|-----------|--------|
| Cucumber leaf-step rerun | Cucumber's `--name` filter targets scenarios, not individual Gherkin steps. The dashboard's per-step rerun is disabled under Cucumber. |
| Headless mode caveat | `headless: true` injects `--headless=old`; `--headless=new` produces all-black CDP frames in the screencast. |
| Initial viewport | The dashboard's snapshot iframe falls back to 1280×800 until the first navigation completes and the browser-side collector reports the real viewport. |
