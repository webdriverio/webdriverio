---
id: setuptypes
title: How to setup WebdriverIO
---

WebdriverIO can be used for various purposes. It implements the Webdriver protocol API and can run a browser in an automated way. The framework is designed to work in any arbitrary environment and for any kind of task. It is independent from any 3rd party frameworks and only requires Node.js to run.

## Standalone Mode

Probably the simplest form to run WebdriverIO is in standalone mode. This has nothing to do with the Selenium server file (which is usually called `selenium-server-standalone`). It basically just means that you require the `webdriverio` package in your project and use its API to run your automation.

Here is a simple example:

```js
const { remote } = require('webdriverio');

(async () => {
    const browser = await remote({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })

    await browser.url('https://duckduckgo.com')

    const inputElem = await browser.$('#search_form_input_homepage')
    await inputElem.setValue('WebdriverIO')

    const submitBtn = await browser.$('#search_button_homepage')
    await submitBtn.click()

    console.log(await browser.getTitle()) // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"

    await browser.deleteSession()
})().catch((e) => console.error(e))
```

Using WebdriverIO in standalone mode allows you to integrate this automation tool in your own (test) project to create a new automation library. Popular examples include [Chimp](https://chimp.readme.io) or [CodeceptJS](http://codecept.io). You can also write plain Node scripts to scrape the web for content (or anything else that requires a running browser).

You can use the `@wdio/sync` package to transform all commands so they run synchronously. This especially simplifies your test as you don't have to deal with `async/await` anymore. Here is an example how you can run synchronous commands with WebdriverIO in a standalone script:

```js
// standalone.js
const { remote } = require('webdriverio')
const sync = require('@wdio/sync').default

remote({
    runner: true,
    outputDir: __dirname,
    capabilities: {
        browserName: 'chrome'
    }
}).then((browser) => sync(() => {
    browser.url('https://webdriver.io')
    console.log(browser.getTitle())
    browser.deleteSession()
}))
```

If you now run the file, it will return the title:

```sh
$ node standalone.js
WebdriverIO · Next-gen WebDriver test framework for Node.js
```

## The WDIO Testrunner

The main purpose of WebdriverIO, though, is end-to-end testing on a big scale. We therefore implemented a test runner that helps you to build a reliable test suite that is easy to read and maintain.

The test runner takes care of many problems that are common when working with plain automation libraries. For one, it organizes your test runs and splits up test specs so your tests can be executed with maximum concurrency. It also handles session management and provides lots of features to help you to debug problems and find errors in your tests.

Here is the same example from above, written as a test spec and executed by WDIO:

```js
describe('DuckDuckGo search', () => {
    it('searches for WebdriverIO', () => {
        browser.url('https://duckduckgo.com/')

        $('#search_form_input_homepage').setValue('WebdriverIO')
        $('#search_button_homepage').click()

        const title = browser.getTitle()
        console.log('Title is: ' + title)
        // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    })
})
```

The test runner is an abstraction of popular test frameworks like Mocha, Jasmine, or Cucumber. A key difference when compared with standalone mode is that all commands that executed by the WDIO test runner are synchronous. That means that you don't need promises anymore to handle async code.

To run your tests using the WDIO test runner, check out the [Getting Started](GettingStarted.md) section for more information.
