WebdriverIO
===========

> Next-gen browser and mobile automation test framework for Node.js

This package provides an easy-to-manage API and a lot of syntactical sugar on top of the WebDriver specification. You can use WebdriverIO as a standalone package or via a test runner using [`@wdio/cli`](https://webdriver.io/docs/clioptions). WebdriverIO allows you to run tests locally using the WebDriver as well as remote user agents using cloud providers like [Sauce Labs](https://saucelabs.com/).

## Installation

You can install WebdriverIO via NPM:

```sh
npm install webdriverio
```

## Usage

WebdriverIO by default uses Puppeteer to automate a browser like Chrome, Firefox or Chromium Edge. So if you have Chrome installed, the following script should start a browser for you and get the title of the page:

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})

await browser.navigateTo('https://www.google.com/ncr')

const searchInput = await browser.$('#lst-ib')
await searchInput.setValue('WebdriverIO')

const searchBtn = await browser.$('input[value="Google Search"]')
await searchBtn.click()

console.log(await browser.getTitle()) // outputs "WebdriverIO - Google Search"

await browser.deleteSession()
```

See the raw [protocol example](https://www.npmjs.com/package/webdriver#example) using the `webdriver` package to get a glance at the differences.

For more information on [options](https://webdriver.io/docs/options#webdriver-options), [multiremote usage](https://webdriver.io/docs/multiremote) or integration into [cloud services](https://webdriver.io/docs/cloudservices) please check out the [docs](https://webdriver.io/docs/gettingstarted).

## Browser Build

WebdriverIO provides a standalone browser build that allows you to run automation scripts directly in the browser (e.g. for AI sandboxes or debugging). This build includes necessary polyfills for Node.js globals like `process`, `buffer`, `events`, `path`, `url`, and `util`.

Bundlers like **Vite** can resolve WebdriverIO to this browser-compatible build via the `exports.browser` condition when targeting the browser environment.

```js
import { remote } from 'webdriverio'

// Initialize a session directly in the browser!
// Note: Requires a WebDriver server (like ChromeDriver) running on localhost or a cloud provider.
const browser = await remote({
    // ...
})
```

**Note:** Node.js-specific modules like `fs` or `child_process` are not available in the browser build. Attempting to use methods that rely on them will throw a descriptive error.

See the [Browser Build documentation](https://webdriver.io/docs/BrowserBuild) for more details on installation, polyfills, and usage examples.

---

<center>Package Sponsors:</center>
<p align="center">
    <a href="https://www.browserstack.com/automation-webdriverio">
        <img src="https://webdriver.io/img/sponsors/browserstack_black.svg" alt="BrowserStack" width="300" />
    </a>
</p>
