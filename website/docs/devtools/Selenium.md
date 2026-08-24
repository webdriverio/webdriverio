---
id: selenium
title: Selenium DevTools
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Selenium WebDriver adapter for [WebdriverIO DevTools](https://github.com/webdriverio/devtools) - brings the same visual debugging UI to any Selenium test, in **Node.js** or **Python**, regardless of the test runner.

Node.js works with **Mocha**, **Jest**, **Cucumber**, or a plain script - the plugin auto-detects the runner and wires test boundaries accordingly. Python works with **pytest** or a plain script, and under pytest needs no changes to your test files at all.

Pick your language in the tabs below; the choice follows you down the page.

## Installation

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

```bash
npm install @wdio/selenium-devtools
```

</TabItem>
<TabItem value="python" label="Python">

```bash
pip install selenium-devtools-py
```

**Requires Python 3.10+ and `selenium>=4.44`.** Both are declared in the package metadata, so pip enforces them rather than leaving you to find an empty Network tab at runtime. Network capture subscribes through the public BiDi event API that selenium regenerated in 4.44; the private connection it replaced was removed in the same release, and 4.44 is what sets the Python floor.

</TabItem>
</Tabs>

## Setup

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

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

</TabItem>
<TabItem value="python" label="Python">

### pytest

Nothing goes in your test files - the plugin is auto-discovered and turns itself on from an environment variable:

```bash
DEVTOOLS_ENABLE=1 pytest tests/
```

The dashboard opens in a dedicated browser window and **stays open after the run** so you can inspect what happened; close it (or `Ctrl-C`) to finish. `DEVTOOLS_PORT=<n>` also opts in, and attaches to a dashboard that is already running instead of starting one.

### Plain Python script (no test runner)

Two lines around your existing Selenium code:

```python title="login.py"
import selenium_devtools as devtools
from selenium import webdriver

devtools.enable()                     # open the dashboard, capture every command

driver = webdriver.Chrome()
driver.get('https://the-internet.herokuapp.com/login')
driver.find_element('id', 'username').send_keys('tomsmith')
driver.quit()

devtools.wait_for_dashboard_close()   # keep the UI up to inspect
devtools.disable()
```

If the backend cannot be launched or reached, `enable()` logs a warning and returns `None`. Capture is skipped and your tests still run - a missing dashboard never fails a suite.

### Parallel runs (`pytest -n`)

**pytest-xdist works with no extra configuration.** Every process reporting into one run has to agree on a run id, or the backend treats each connect as a new run and wipes what the previous one captured. With xdist they do agree: the plugin loads in the **controller** as well, and enabling capture there resolves the id before xdist spawns any worker - workers are child processes, so they inherit it.

What genuinely reads as separate runs: two independent `pytest` invocations, or a worker started without the environment. Export `DEVTOOLS_RUN_ID` yourself to join such processes into one run.

</TabItem>
</Tabs>

## Configuration Options

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

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
| `filmstrip` | `boolean` | `true` | Record a dense, continuous screencast into the trace for frame-by-frame scrubbing in the player. Only applies when `mode: 'trace'`. |
| `screenshot` | `'off' \| 'on' \| 'only-on-failure'` | `'off'` | Trace mode + `traceGranularity: 'test'`. Per-test screenshot, attached inline to Allure (`image/png`) via `allure-js-commons` when an Allure runner adapter is active. |
| `video` | `'off' \| TraceRetentionPolicy` | `'off'` | Trace mode + `traceGranularity: 'test'`. Per-test screencast video, retained per the given policy, attached inline to Allure (`video/webm`) via `allure-js-commons` when an Allure runner adapter is active. |
| `emitArtifactsManifest` | `boolean` | auto | Write the `devtools-artifacts-<sessionId>.json` manifest — the generic index reporters/CI consume to discover produced artifacts — next to the trace. Off by default; **auto-enables** when an `allure-js-commons` runtime is active. Trace mode only. |
| `captureAssertions` | `boolean` | `true` | Capture `node:assert` assertions (both passing and failing) as trace action rows. Set `false` to opt out. |

```js
DevTools.configure({
  port: 3000,
  hostname: 'localhost',
  headless: false,
  openUi: true
})
```

> **For CI**, set both `headless: true` (hide the test browser) and `openUi: false` (don't try to open the dashboard window - CI environments have no display). The backend keeps running on the configured port so you can still open the UI later if needed.

</TabItem>
<TabItem value="python" label="Python">

The Python adapter is configured by environment variables rather than an options object, so nothing devtools-specific has to appear in your test code.

| Variable | Effect |
|---|---|
| `DEVTOOLS_ENABLE=1` | Turn capture on (pytest). |
| `DEVTOOLS_PORT=<n>` | Attach to a dashboard already listening on this port; also opts in. |
| `DEVTOOLS_HOST=<host>` | Host the dashboard is reached on (default `localhost`). |
| `DEVTOOLS_OPEN=0` | Do not open the dashboard window (CI). |
| `DEVTOOLS_BIDI=0` | Disable BiDi, and with it console and network capture. |
| `DEVTOOLS_RUN_ID=<id>` | Join several processes into one run. |
| `DEVTOOLS_BACKEND_CMD=<cmd>` | Start the backend with an explicit command instead of the resolved one. |

The dashboard server is a Node application, so **Node 18+ must be available** even though your tests are Python. The adapter finds or launches it for you - see [running the backend on its own](/docs/devtools/dashboard#running-the-backend-on-its-own) if you would rather manage it yourself.

### Assertions

Passing and failing `assert` statements appear as rows carrying **expected** and **actual**, and failures reach the Errors tab. Python's `assert` is a statement rather than a call, so unlike the Node adapter's `node:assert` patching there is nothing to wrap - the outcome comes from the runner.

**Under pytest**, values come from the assertion rewriter, so every row carries real operands. Capturing *passing* assertions needs pytest's `enable_assertion_pass_hook`, which the plugin switches on for itself. One caveat: pytest decides per module, *while rewriting it*, whether to emit that hook, so a module whose rewritten bytecode was cached before the plugin was installed keeps reporting failures only. The adapter says so once at collection and names the cache to delete - which is **not** always the `__pycache__` beside your tests, since `sys.pycache_prefix` (set by default on macOS's system Python) sends every rewritten module to one central tree.

**In a plain script** there is no rewriter, so outcomes come from the interpreter's line events and values are read from the frame about to run the assert. Only reads that cannot execute your code are resolved: a literal or a local resolves, an attribute or a call does not, because evaluating `driver.current_url` a second time would issue another WebDriver command.

</TabItem>
</Tabs>

## Trace mode

:::note Node.js only
Trace mode is not available for the Python adapter yet - it streams to the live dashboard and does not write a `trace.zip`. Everything in this section describes the Node.js adapter.
:::

Headless capture path — no DevTools UI window opens. At session end the adapter writes a portable `trace-<sessionId>.zip` (or directory) into a `test-results/` folder (next to the resolved test / config directory), with the same shape as the WebdriverIO trace artifact.

```js
DevTools.configure({
  mode: 'trace',
  traceFormat: 'ndjson-directory'  // optional; default 'zip'
})
```

The backend port-bind, UI window, and `screencast` option are all skipped in trace mode. For the full feature reference (artifact contents, viewer, mobile testing, when to pick `zip` vs `ndjson-directory`), see the [Trace Mode page](/docs/devtools/wdio/trace-mode).

### Per-test artifacts and retention

At `traceGranularity: 'test'` each test gets its own artifact folder, and `tracePolicy` decides which are kept (e.g. `retain-on-failure`). In that mode you can also capture a per-test `screenshot` (PNG) and `video` (`.webm`), and enable a dense `filmstrip` recorded into the trace for frame-by-frame scrubbing. When an `allure-js-commons` runner adapter is active, per-test traces / screenshots / videos are attached inline to the Allure report (and `emitArtifactsManifest` auto-enables); otherwise they're written to `test-results/` and recorded in the manifest.

```js
DevTools.configure({
  mode: 'trace',
  traceGranularity: 'test',
  tracePolicy: 'retain-on-failure',
  filmstrip: true,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
})
```

### Viewing the trace

Open any trace `.zip` in the first-party player — the same DevTools UI in a dedicated **player** mode:

```bash
npx show-trace path/to/trace.zip      # in a project that installs the adapter
pnpm show-trace path/to/trace.zip     # from the devtools monorepo
```

The `show-trace` bin ships with `@wdio/selenium-devtools`, so it's available in any project that installs it — no extra dependency. Because the Selenium adapter captures the page's **DOM mutation stream** and a per-command element / accessibility snapshot alongside each screenshot, a Selenium trace drives the player's full feature set — DOM time-travel, the A11y tab and pick-locator overlay, the Transcript tab with Copy-for-LLM, Cucumber Feature → Scenario → Step nesting, and the scrubbable timeline.

The trace uses a portable NDJSON schema, so the same `.zip` (or directory) also opens in other compatible trace viewers. See the **[Trace Player](/docs/devtools/trace-player)** page for the full walkthrough.

## Public API

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

```js
import { DevTools } from '@wdio/selenium-devtools'

DevTools.configure(opts)             // set runtime options (see above)
DevTools.startTest(name, meta?)      // mark a named test boundary (plain Node scripts only)
DevTools.endTest('passed'|'failed'|'skipped'|'pending')
```

Under Mocha / Jest / Cucumber the plugin auto-hooks the runner's lifecycle, so you don't need `startTest` / `endTest` manually - calling them would create duplicate rows.

</TabItem>
<TabItem value="python" label="Python">

```python
import selenium_devtools as devtools

devtools.enable()                     # connect and instrument; idempotent
devtools.disable()                    # tear down; safe to call twice
devtools.wait_for_dashboard_close()   # block until the window is closed
devtools.get_capturer()               # the live SessionCapturer, or None
devtools.dashboard_url()              # the URL the dashboard is served on
```

Under pytest the plugin drives all of this from `DEVTOOLS_ENABLE=1`, and test boundaries come from pytest's own hooks - there is no `startTest` / `endTest` equivalent to call.

</TabItem>
</Tabs>

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

The same injected collector also records the page's **DOM mutation stream** and a per-command element / accessibility snapshot, so a trace carries enough to rebuild the live DOM at each step (per-navigation mapping) — this is what powers the player's DOM time-travel and A11y tab rather than a screenshot-only replay.

## Limitations

| Limitation | Detail |
|-----------|--------|
| Cucumber leaf-step rerun | Cucumber's `--name` filter targets scenarios, not individual Gherkin steps. The dashboard's per-step rerun is disabled under Cucumber. |
| Headless mode caveat | `headless: true` injects `--headless=old`; `--headless=new` produces all-black CDP frames in the screencast. |
| Initial viewport | The dashboard's snapshot iframe falls back to 1280×800 until the first navigation completes and the browser-side collector reports the real viewport. |
