WebdriverIO Sync
================

> A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously

A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously. It overwrites global functions depending on the test framework (e.g. for Mocha describe and it) and uses Fibers to make commands of WebdriverIO using the wdio testrunner synchronous. This package is consumed by all wdio framework adapters.

## Usage

### Using WDIO Testrunner

If you are using the WDIO testrunner all you need to make all your specs run synchronous is to have `@wdio/sync` installed in your project. The testrunner automatically will detect it and transform the commands to make a test like this:

```js
describe('webdriver.io page', () => {
    it('should have the right title', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser)
            .toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

easier to read and write like this:

```js
describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

### Using WebdriverIO as standalone package

Given you have a simple standalone WebdriverIO script like this:

```js
// standalone.js
const { remote } = require('webdriverio')
const sync = require('@wdio/sync').default

;(() => {
    const browser = await remote({
        outputDir: __dirname,
        capabilities: {
            browserName: 'chrome'
        }
    })

    await browser.url('https://webdriver.io')
    console.log(await browser.getTitle())
    await browser.deleteSession()
})().catch(console.error)
```

With this package you can make WebdriverIO commands synchronous by using the `sync` wrapper:

```js
// standalone.js
const { remote } = require('webdriverio')
const sync = require('@wdio/sync').default

remote({
    runner: 'local',
    outputDir: __dirname,
    capabilities: {
        browserName: 'chrome'
    }
}).then((browser) => sync(() => {
    /**
     * sync code from here on
     */
    browser.url('https://webdriver.io')
    console.log(browser.getTitle())
    browser.deleteSession()
}))
```

## Switching Between Sync And Async

While using `@wdio/sync` you can still switch between both by using the `browser.call()` command. It allows you to run async code and return the result into a synchronous environment. For example:

```js
describe('webdriver.io page', () => {
    it('should have the right title', () => {
        /**
         * synchronous execution here
         */
        browser.url('https://webdriver.io')

        const result = browser.call(async () => {
            /**
             * asynchronous execution here
             */
            await browser.url('https://google.com')
            return Promise.all([
                browser.getTitle(),
                browser.getUrl()
            ])
        })

        /**
         * synchronous execution here
         */
        console.log(result) // returns: ['Google', 'https://www.google.com/']
    })
})
```
