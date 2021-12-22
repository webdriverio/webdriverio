WebdriverIO
===========

> Next-gen browser and mobile automation test framework for Node.js

This package provides an easy to manage API and a lot of syntactical sugar on top of the WebDriver specification. You can use WebdriverIO as a standalone package or via a testrunner using [`@wdio/cli`](https://webdriver.io/docs/clioptions). WebdriverIO allows to run tests locally using the WebDriver or Chrome DevTools protocol as well as remote user agents using cloud providers like [Sauce Labs](https://saucelabs.com/).

## Installation

You can install WebdriverIO via NPM:

```sh
npm install webdriverio
```

## Usage

WebdriverIO by default uses Puppeteer to automate a browser like Chrome, Firefox or Chromium Edge. So if you have Chrome installed, the following script should start a browser for you and get the title of the page:

```js
import { remote } from 'webdriverio'

let browser

;(async () => {
    browser = await remote({
        capabilities: { browserName: 'chrome' }
    })

    await browser.navigateTo('https://www.google.com/ncr')

    const searchInput = await browser.$('#lst-ib')
    await searchInput.setValue('WebdriverIO')

    const searchBtn = await browser.$('input[value="Google Search"]')
    await searchBtn.click()

    console.log(await browser.getTitle()) // outputs "WebdriverIO - Google Search"

    await browser.deleteSession()
})().catch((err) => {
    console.error(err)
    return browser.deleteSession()
})
```

See the raw [protocol example](https://www.npmjs.com/package/webdriver#example) using the `webdriver` package to get a glance on the differences.

For more information on [options](https://webdriver.io/docs/options#webdriver-options), [multiremote usage](https://webdriver.io/docs/multiremote) or integration into [cloud services](https://webdriver.io/docs/cloudservices) please check out the [docs](https://webdriver.io/docs/gettingstarted).
