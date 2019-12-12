---
id: runprogrammatically
title: Running Programmatically
---

WebdriverIO allows running tests without built-in test runner.

Before starting, you have to setup either [driver binaries](DriverBinaries.md) or selenium-standalone/selenium-grid/Appium/etc.

Let's start with installing `webdriverio` by calling:

```sh
npm install webdriverio
```

Create a test file (e.g. `test.js`) with the following content:

```js
const { remote } = require('webdriverio')

(async () => {
    const browser = await remote({
        logLevel: 'error',
        path: '/', // remove `path` if you decided using something different from driver binaries.
        capabilities: {
            browserName: 'firefox'
        }
    })

    await browser.url('https://webdriver.io')

    const title = await browser.getTitle()
    console.log('Title was: ' + title)

    await browser.deleteSession()
})().catch((e) => console.error(e))
```

### Run your test file


```sh
node test.js
```

This should output the following:

```sh
Title was: WebdriverIO · Next-gen WebDriver test framework for Node.js
```

Yay, Congratulations! You’ve just run your automation script with WebdriverIO.
