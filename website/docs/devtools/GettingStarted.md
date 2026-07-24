---
id: getting-started
title: Getting Started
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

WebdriverIO DevTools gives your end-to-end browser tests a developer-tools UI for running, debugging, and inspecting automation — DOM replay, per-command screenshots, network and console capture, and session screencasts. It runs in two modes. **Live mode** opens an interactive [dashboard](/docs/devtools/dashboard) in a browser window while your tests execute, so you can watch and rerun them in real time. **Trace mode** skips the UI and writes a portable, offline [trace artifact](/docs/devtools/wdio/trace-mode) (`trace.zip`) you can open later in the `show-trace` player — ideal for CI. This page gets you into live mode fast; trace mode is one option away.

## Install & first run

Pick your adapter, install it, and add the minimal wiring below. Run your tests as usual — the DevTools dashboard opens automatically in a new browser window.

<Tabs
defaultValue="wdio"
values={[
{label: 'WebdriverIO', value: 'wdio'},
{label: 'Selenium', value: 'selenium'},
{label: 'Nightwatch', value: 'nightwatch'},
]}
>
<TabItem value="wdio">

Install the service:

```sh
npm install @wdio/devtools-service --save-dev
```

Add it to your test-runner config:

```ts
// wdio.conf.ts
export const config = {
  services: ['devtools'],
}
```

Run your WebdriverIO tests as normal — the DevTools UI opens automatically and tests begin visualizing immediately.

</TabItem>
<TabItem value="selenium">

Works with Mocha, Jest, Cucumber, or a plain `node` script — the plugin auto-detects the runner. Install it:

```bash
npm install @wdio/selenium-devtools
```

Add a single import and one `configure` call at the top of your test file (Mocha shown):

```js
// tests/example.test.js
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

  it('loads example.com', async function () {
    await driver.get('https://example.com')
    await driver.wait(until.elementLocated(By.css('h1')), 10000)
  })
})
```

Run it — the DevTools UI opens in a new Chrome window:

```bash
mocha --timeout 60000 tests/example.test.js
```

See the [Selenium page](/docs/devtools/selenium) for the Jest, Cucumber, and plain-Node setups.

</TabItem>
<TabItem value="nightwatch">

Install the adapter:

```bash
npm install @wdio/nightwatch-devtools
```

Wire it into your Nightwatch config via `globals` — no test-file changes needed:

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

Run your tests as normal — the DevTools UI opens automatically:

```bash
nightwatch
```

See the [Nightwatch page](/docs/devtools/nightwatch) for the Cucumber/BDD setup.

</TabItem>
</Tabs>

## Next steps

- **[Trace Mode](/docs/devtools/wdio/trace-mode)** — set `mode: 'trace'` to skip the UI and produce a portable, offline trace artifact for CI.
- **[Configuration Reference](/docs/devtools/reference)** — every option across all three adapters.
- **Frameworks** — full per-adapter guides: [WebdriverIO](/docs/devtools/wdio), [Selenium](/docs/devtools/selenium), [Nightwatch](/docs/devtools/nightwatch).
