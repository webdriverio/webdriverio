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

Nothing goes in your test files - the plugin is auto-discovered, and a flag turns it on for the run:

```bash
pytest --devtools tests/              # live dashboard
pytest --devtools-trace tests/        # write a trace archive instead (implies --devtools)
```

Or commit the choice, so nobody has to remember the flag:

```toml title="pyproject.toml"
[tool.pytest.ini_options]
devtools = true
# devtools_trace = true                          # trace archive instead of a dashboard
# devtools_trace_granularity = "test"            # ... one archive per test
# devtools_trace_policy = "retain-on-failure"    # ... keeping only what failed
```

A `pytest.ini` with a `[pytest]` section takes the same keys. The two trace settings are covered under [How many archives, and which ones to keep](#how-many-archives-and-which-ones-to-keep).

Capture is always opt-in - installing the package must never change how an existing suite behaves. All that differs is *how* you say yes:

| How you opt in | Scope |
|---|---|
| `--devtools` / `--devtools-trace` | this run |
| `devtools` / `devtools_trace` in `[tool.pytest.ini_options]` | this project |
| `DEVTOOLS_ENABLE=1` (or `DEVTOOLS_PORT=<n>`, which also attaches to a dashboard already running) | this shell - for CI |

Highest wins: CLI, then ini, then environment. `pytest -o devtools=false` turns a project default off for a single run, which is why there is no `--no-devtools`. `DEVTOOLS_TRACE=1` picks trace mode but does **not** switch capture on by itself, so exporting it for your own scripts never captures a pytest run you did not ask for.

In live mode the dashboard opens in a dedicated browser window and **stays open after the run** so you can inspect what happened; close it (or `Ctrl-C`) to finish. Two kinds of run stay uncaptured even when you opt in: `--collect-only`, where nothing executes, and a run that collected no tests - a mistyped path would otherwise park your terminal on an empty dashboard.

### Plain Python script (no test runner)

Two lines around your existing Selenium code:

```python title="login.py"
import selenium_devtools as devtools
from selenium import webdriver

devtools.enable()                     # open the dashboard, capture every command
# devtools.enable(trace=True)         # or: write a trace.zip and open no window

driver = webdriver.Chrome()
driver.get('https://the-internet.herokuapp.com/login')
driver.find_element('id', 'username').send_keys('tomsmith')
driver.quit()

devtools.wait_for_dashboard_close()   # keep the UI up to inspect (no-op when no window is open)
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

There is no options object - nothing devtools-specific has to appear in your test code. Under pytest you configure the adapter the way you configure pytest; a script passes keyword arguments to `enable()`; anything without a flag is an environment variable.

| pytest flag | `[tool.pytest.ini_options]` | Effect |
|---|---|---|
| `--devtools` | `devtools = true` | Capture this run and open the dashboard. |
| `--devtools-trace` | `devtools_trace = true` | Capture this run and write a trace archive instead of opening a dashboard. Implies `--devtools`. |
| `--devtools-trace-granularity <session\|test>` | `devtools_trace_granularity = test` | One archive for the whole run (`session`, the default) or one per test. Implies `--devtools-trace`. |
| `--devtools-trace-policy <policy>` | `devtools_trace_policy = "retain-on-failure"` | Which archives are worth keeping. Implies `--devtools-trace`. See [How many archives, and which ones to keep](#how-many-archives-and-which-ones-to-keep). |

Highest wins: CLI, then ini, then the environment below. `pytest -o devtools=false` turns a project default off for one run, and `pytest -o devtools_trace_policy=on` does the same for any of the others.

| Variable | Effect |
|---|---|
| `DEVTOOLS_ENABLE=1` | Turn capture on, when no flag or ini option already did. |
| `DEVTOOLS_PORT=<n>` | Attach to a dashboard already listening on this port; also opts in. |
| `DEVTOOLS_HOST=<host>` | Host the dashboard is reached on (default `localhost`). |
| `DEVTOOLS_TRACE=1` | Write a trace archive instead of opening a dashboard. Selects the mode for a plain script; under pytest it does not opt the run in by itself. |
| `DEVTOOLS_TRACE_GRANULARITY=<session\|test>` | Trace mode: one archive for the whole run, or one per test. Ambient, so it never selects trace mode by itself - pair it with `DEVTOOLS_TRACE=1`. |
| `DEVTOOLS_TRACE_POLICY=<policy>` | Trace mode: which archives are worth keeping. Ambient, so it never selects trace mode by itself - pair it with `DEVTOOLS_TRACE=1`. |
| `DEVTOOLS_FILMSTRIP=0` | Trace mode: leave the dense filmstrip out of the archive. |
| `DEVTOOLS_A11Y=0` | Trace mode: skip the per-action A11y tree and element rects. |
| `DEVTOOLS_OPEN=0` | Do not open the dashboard window (CI). |
| `DEVTOOLS_BIDI=0` | Disable BiDi, and with it console and network capture. |
| `DEVTOOLS_RUN_ID=<id>` | Join several processes into one run. |
| `DEVTOOLS_BACKEND_CMD=<cmd>` | Start the backend with an explicit command instead of the resolved one. |

The backend is a Node application, so **Node 18+ must be available in every mode** - even in trace mode, where no dashboard window ever opens. It is not only the UI: the page collector is served by the backend, the whole event stream travels over its WebSocket, and in trace mode it is also what builds the archive. `enable()` checks for Node up front and names what is missing rather than failing later as a spawn timeout. The adapter finds or launches the backend for you - see [running the backend on its own](/docs/devtools/dashboard#running-the-backend-on-its-own) if you would rather manage it yourself, or point `DEVTOOLS_PORT` at one you are already running, in which case no local Node is needed.

### Assertions

Passing and failing `assert` statements appear as rows carrying **expected** and **actual**, and failures reach the Errors tab. Python's `assert` is a statement rather than a call, so unlike the Node adapter's `node:assert` patching there is nothing to wrap - the outcome comes from the runner.

**Under pytest**, values come from the assertion rewriter, so every row carries real operands. Capturing *passing* assertions needs pytest's `enable_assertion_pass_hook`, which the plugin switches on for itself. One caveat: pytest decides per module, *while rewriting it*, whether to emit that hook, so a module whose rewritten bytecode was cached before the plugin was installed keeps reporting failures only. The adapter says so once at collection and names the cache to delete - which is **not** always the `__pycache__` beside your tests, since `sys.pycache_prefix` (set by default on macOS's system Python) sends every rewritten module to one central tree.

**In a plain script** there is no rewriter, so outcomes come from the interpreter's line events and values are read from the frame about to run the assert. Only reads that cannot execute your code are resolved: a literal or a local resolves, an attribute or a call does not, because evaluating `driver.current_url` a second time would issue another WebDriver command.

</TabItem>
</Tabs>

## Trace mode

Headless capture path, in **both languages** - no DevTools UI window opens, and the run writes a portable trace archive into a `test-results/` folder, with the same shape as the WebdriverIO trace artifact. The two differ only in how much of the artifact you can tune, and in who builds it.

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

At session end the adapter writes `trace-<sessionId>.zip` (or a directory) itself, into `test-results/` next to the resolved test / config directory.

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

</TabItem>
<TabItem value="python" label="Python">

There is no options object to set - a flag under pytest, a keyword argument in a script:

```bash
pytest --devtools-trace tests/        # implies --devtools
DEVTOOLS_TRACE=1 python3 login.py     # plain script; same as devtools.enable(trace=True)
```

```python title="login.py"
devtools.enable(trace=True)           # write a trace.zip instead of opening a dashboard
```

The archive lands in `test-results/` beside the test file the first captured command came from - the same directory screencast videos already write to - named `trace-<sessionId>.zip`, or named after each test when you ask for [one archive per test](#how-many-archives-and-which-ones-to-keep). When no command carried a source location of yours, it falls back to `test-results/` under the current directory.

**No dashboard window opens.** The artifact is the output, and a live run blocks on the window until you close it - a window would turn writing a file into an interactive session. The backend still starts, because it is what *builds* the archive: the trace transforms are TypeScript, so a Python run asks the backend for them rather than shipping a second copy of them. That is the one way this differs from the Node.js adapter's backend-free trace mode, and the reason [Node 18+ is required in every mode](#configuration-options).

Beyond the command rows, per-command screenshots and selectors, console and network that both modes capture, the archive carries:

| In the archive | Default | Opt out |
|---|---|---|
| DOM time-travel - the mutation stream the player replays step by step | on | - |
| Dense filmstrip - the screencast frames, carried into the trace instead of a `.webm` | on | `DEVTOOLS_FILMSTRIP=0` |
| A11y tree and element overlay - read beside each action, at two extra round trips per command | on | `DEVTOOLS_A11Y=0` |

Trace mode encodes no `.webm`, so it needs no `ffmpeg` - the frames *are* the filmstrip.

**The export is requested when the run finishes, not when the process exits** - pytest asks at `sessionfinish` and a script's `disable()` exports before it closes the transport, so CI gets the artifact whether or not a window was ever involved.

### How many archives, and which ones to keep

Two settings decide that, and neither means anything outside trace mode.

**Granularity** - how many archives the run writes:

| `--devtools-trace-granularity` | Result |
|---|---|
| `session` (default) | One archive for the whole run. |
| `test` | One archive per test, each holding only that test's own commands, console, network, DOM mutations, a11y trees and screencast frames. |

There is deliberately no `spec` value here. This adapter's spec *is* its test file, so a third name could only quietly mean one of the two above.

**Policy** - which of those archives are kept:

| `--devtools-trace-policy` | Result |
|---|---|
| `on` (default) | Keep everything. |
| `retain-on-failure` | Keep only what failed. |
| `retain-on-first-failure`, `on-first-retry`, `on-all-retries`, `retain-on-failure-and-retries` | Accepted, but today they behave **exactly like `retain-on-failure`**. |

Those last four are not retry-aware yet, and it is worth saying plainly rather than discovering it from an archive you expected: nothing this adapter puts on the wire carries an attempt number, so a retried test overwrites its own earlier outcome and the retry-aware question cannot be asked at all. The backend logs the degradation rather than pretending otherwise. Pick one only if you want `retain-on-failure` under a name that will mean more later.

The two combine:

| Granularity | Policy | What you get |
|---|---|---|
| `test` | `retain-on-failure` | Only the tests that failed. |
| `session` | `retain-on-failure` | The whole run's archive, if anything in it failed. |
| either | `on` | Everything. |

Each archive kept at `test` granularity is named after its test (`trace-<test>-<hash>.zip`, the hash taken from the test's nodeid so two parametrised cases sharing a title cannot overwrite each other). A run that keeps nothing writes nothing at all, which is the point - the archives you are left with are the ones worth opening, and a declined export is the policy working rather than a failure.

Set them for one run:

```bash
pytest --devtools-trace-granularity test --devtools-trace-policy retain-on-failure tests/
```

Or commit them, so a contributor who clones the project captures the same way without being told:

```ini title="pytest.ini"
[pytest]
devtools_trace = true
devtools_trace_granularity = test
devtools_trace_policy = retain-on-failure
```

`[tool.pytest.ini_options]` in `pyproject.toml` takes the same keys, and `pytest -o devtools_trace_policy=on tests/` overrides one of them for a single run without editing the file. A fully commented version - every setting and every environment variable, with what each one is for - is in the repo at [`examples/selenium/python-test/trace-py-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/python-test/trace-py-test).

A plain script passes the same two as keyword arguments:

```python title="login.py"
devtools.enable(trace_granularity='test', trace_policy='retain-on-failure')
```

**Naming either one explicitly selects trace mode.** The CLI flag, the ini option and the `enable()` argument all imply it, since a policy or a granularity means nothing in live mode and honouring one without the mode would silently drop what you asked for. `DEVTOOLS_TRACE_POLICY` and `DEVTOOLS_TRACE_GRANULARITY` deliberately do **not**: an exported variable is ambient and may have been set for a different script in the same shell, so flipping a live run to trace mode on that basis would take away the dashboard nobody asked to lose - pair them with `DEVTOOLS_TRACE=1`. A run that ends up ignoring an exported trace setting logs a warning, rather than leaving you to notice an archive that never appeared.

</TabItem>
</Tabs>

### Viewing the trace

Open any trace `.zip` in the first-party player — the same DevTools UI in a dedicated **player** mode:

```bash
npx show-trace path/to/trace.zip      # in a project that installs the adapter
pnpm show-trace path/to/trace.zip     # from the devtools monorepo
```

The `show-trace` bin ships with `@wdio/selenium-devtools`, so it's available in any project that installs it — no extra dependency. A Python project installs no Node.js adapter, but the same player ships with the backend the adapter already fetches for you: `npx -p @wdio/devtools-backend show-trace path/to/trace.zip`.

Because the Selenium adapter captures the page's **DOM mutation stream** and a per-command element / accessibility snapshot alongside each screenshot, a Selenium trace drives the player's full feature set — DOM time-travel, the A11y tab and pick-locator overlay, the Transcript tab with Copy-for-LLM, Cucumber Feature → Scenario → Step nesting, and the scrubbable timeline. A Python trace carries the same mutation stream and per-action snapshot (the element / a11y read is trace mode only there, and on by default); the Gherkin nesting is the one entry that has no pytest equivalent.

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

`enable()` takes an optional `host` and `port`, plus keyword arguments:

```python
devtools.enable(trace=True)                            # write a trace.zip; open no window
devtools.enable(trace=True, filmstrip=False)           # ... without the dense filmstrip
devtools.enable(trace=True, a11y=False)                # ... without the per-action element / a11y read
devtools.enable(trace_granularity='test')              # ... one archive per test (implies trace=True)
devtools.enable(trace_policy='retain-on-failure')      # ... keep only what failed (implies trace=True)
```

`filmstrip` and `a11y` apply to trace mode only, and each defaults to on (`DEVTOOLS_FILMSTRIP` / `DEVTOOLS_A11Y` set the same thing from the environment). `trace` falls back to `DEVTOOLS_TRACE`. `trace_granularity` and `trace_policy` fall back to `DEVTOOLS_TRACE_GRANULARITY` / `DEVTOOLS_TRACE_POLICY`, and passing either one turns trace mode on by itself - see [How many archives, and which ones to keep](#how-many-archives-and-which-ones-to-keep). A value outside the accepted set warns and falls back to the default rather than being discovered later as a missing file.

Under pytest the plugin drives all of this from `--devtools` / `--devtools-trace` (or the matching ini option, or `DEVTOOLS_ENABLE=1`), and test boundaries come from pytest's own hooks - there is no `startTest` / `endTest` equivalent to call.

</TabItem>
</Tabs>

## Examples

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

Working examples live in the repo's top-level `examples/` directory. Build the workspace once (`pnpm install && pnpm build`), then run from the repo root. `pnpm demo:selenium` runs the default (Cucumber) example; the per-runner variants are:

| Directory | Runner | Command |
|-----------|--------|---------|
| [`examples/selenium/mocha-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/mocha-test) | Mocha | `pnpm --filter @wdio/selenium-devtools example:mocha` |
| [`examples/selenium/jest-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/jest-test) | Jest | `pnpm --filter @wdio/selenium-devtools example:jest` |
| [`examples/selenium/cucumber-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/cucumber-test) | Cucumber | `pnpm demo:selenium` |

</TabItem>
<TabItem value="python" label="Python">

The Python examples live in [`examples/selenium/python-test/`](https://github.com/webdriverio/devtools/tree/main/examples/selenium/python-test). Install the adapter and build the workspace once (`pnpm install && pnpm build`, so the backend exists), then run from the repo root:

| Example | What it shows | Command |
|---|---|---|
| `web_form.py` | The three-line plain-script setup | `pnpm demo:python` |
| `login.py` | A longer script: navigation, form fill, assertions | `pnpm demo:python:login` |
| `trace-py-test/` | pytest with a class and a module-level test, plus a `pytest.ini` that commits trace mode, granularity and retention - every setting in it is commented with what it does | `pnpm demo:python:pytest` |

</TabItem>
</Tabs>

## Features

The Selenium adapter provides the same DevTools UI experience as WebdriverIO, in both languages. Every feature below is captured automatically with no per-feature config — the base `DevTools.configure({})` in Node.js, or `pytest --devtools` in Python. Console and network stream via Selenium's BiDi handlers, with an injected-collector fallback in Node.js. Links go to each feature's full reference.

- **[Interactive Test Rerunning & Visualization](/docs/devtools/wdio/interactive-test-rerunning)** - Live browser previews, per-command screenshots, and one-click test/suite rerunning
- **[Preserve & Rerun (Compare)](/docs/devtools/wdio/preserve-and-rerun)** - Snapshot a failing test, rerun it, and diff the two runs side-by-side
- **[Multi-Framework Support](/docs/devtools/wdio/multi-framework-support)** - Auto-detects Mocha, Jest, Cucumber, or a plain script in Node.js; pytest or a plain script in Python
- **[Console Logs](/docs/devtools/wdio/console-logs)** - Capture and inspect browser console output
- **[Network Logs](/docs/devtools/wdio/network-logs)** - Monitor API calls and network activity
- **[Metadata](/docs/devtools/wdio/metadata)** - Session capabilities, environment, and timing per browser session
- **[TestLens](/docs/devtools/wdio/testlens)** - Jump from any command to the source line that triggered it
- **[Session Screencast](/docs/devtools/wdio/screencast)** - Automatic video recording of browser sessions
- **[Trace Mode](/docs/devtools/wdio/trace-mode)** - Headless capture producing a portable `trace.zip` (no UI window), in both languages, with per-test slicing and retention in both (`traceGranularity` / `tracePolicy` in Node.js; `--devtools-trace-granularity` / `--devtools-trace-policy` in Python). Per-test `screenshot` / `video` and inline Allure attachment remain Node.js only; see [Trace mode](#trace-mode)

In Node.js, screencast is the one feature with its own options (see [Configuration Options](#configuration-options)):

```js
DevTools.configure({ screencast: { enabled: true, quality: 70, maxWidth: 1280, maxHeight: 720 } })
```

In Python it needs no configuration: Chrome streams frames over CDP, other browsers fall back to one screenshot per command, and encoding the `.webm` needs `ffmpeg` on `PATH`. In trace mode the same frames become the archive's dense filmstrip instead of a `.webm`, so nothing is encoded and `ffmpeg` is not needed.

## How It Works

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

The plugin patches `selenium-webdriver`'s `Builder`, `WebDriver`, and `WebElement` prototypes at import time:

- **`Builder.build()`** - after construction, the driver is registered with the session capturer and the DevTools backend is started in a detached child process.
- **Every public `WebDriver` / `WebElement` method** - wrapped with command capture (args + result + screenshot + call source).
- **`WebDriver.quit()`** - an awaited cleanup hook flushes screencast encoding, WebSocket buffer, and final metadata before the original quit runs.

When BiDi is available (Chrome ≥114), console logs, JavaScript exceptions, and network events stream directly via the Selenium BiDi handlers. Otherwise the plugin falls back to an injected browser-side collector script.

The same injected collector also records the page's **DOM mutation stream** and a per-command element / accessibility snapshot, so a trace carries enough to rebuild the live DOM at each step (per-navigation mapping) — this is what powers the player's DOM time-travel and A11y tab rather than a screenshot-only replay.

</TabItem>
<TabItem value="python" label="Python">

There are no prototypes to patch, so the Python adapter wraps one method instead:

- **`WebDriver.execute()`** - the single chokepoint every command flows through. Element methods delegate to it too (`self._parent.execute`), so `click`, `send_keys` and `text` are captured by the same wrapper without touching the element classes.
- **Session setup** - on the first real command the driver is registered, metadata is sent, and BiDi, the collector and the screencast are armed.
- **`quit()`** - intercepted before the session is torn down, so the screencast is encoded and the final frames flushed while the driver still exists.

Console, JavaScript exceptions and network stream over selenium's BiDi layer (4.44+), which the adapter enables for you by injecting the `webSocketUrl` capability into the `newSession` request.

The **DOM mutation stream** comes from the same browser-side collector as Node.js, registered at document start through BiDi so a page instruments itself before any of its own script runs. On Chrome the screencast is pushed by the browser over a CDP websocket of its own — separate from the session's command channel, which is what makes a real frame stream safe when a Selenium session is not thread-safe.

</TabItem>
</Tabs>

## Limitations

<Tabs groupId="devtools-language">
<TabItem value="node" label="Node.js" default>

| Limitation | Detail |
|-----------|--------|
| Cucumber leaf-step rerun | Cucumber's `--name` filter targets scenarios, not individual Gherkin steps. The dashboard's per-step rerun is disabled under Cucumber. |
| Headless mode caveat | `headless: true` injects `--headless=old`; `--headless=new` produces all-black CDP frames in the screencast. |
| Initial viewport | The dashboard's snapshot iframe falls back to 1280×800 until the first navigation completes and the browser-side collector reports the real viewport. |

</TabItem>
<TabItem value="python" label="Python">

| Limitation | Detail |
|-----------|--------|
| No per-test screenshot, video or Allure attach | Per-test **trace archives** are supported (`--devtools-trace-granularity test`), but the Node.js adapter's per-test `screenshot` and `video` options and its inline `allure-js-commons` attachment have no Python equivalent - the archives are the artifacts. |
| Retry-aware retention degrades | `retain-on-first-failure`, `on-first-retry`, `on-all-retries` and `retain-on-failure-and-retries` are accepted but behave exactly like `retain-on-failure`: nothing on the wire carries an attempt number, so a retried test overwrites its own earlier outcome. The backend logs the degradation. |
| Node is required in every mode | The backend is a Node application - it serves the page collector, carries the event stream, and builds the trace archive - so Node 18+ must be present even in trace mode, where no window opens. The adapter finds or launches it for you. |
| Browser options are yours | There is no `headless` option; configure Chrome through selenium's own `Options` object as you normally would. |
| Live-mode video needs ffmpeg | Without `ffmpeg` on `PATH` the `.webm` encode is skipped with a warning rather than an error. Trace mode encodes none - its frames go into the filmstrip - so it never needs ffmpeg. |

</TabItem>
</Tabs>
