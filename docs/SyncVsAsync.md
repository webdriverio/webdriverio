---
id: sync-vs-async
title: Sync mode vs async
---

## How to enable/disable sync mode

To enable sync mode it's only required to install `@wdio/sync` package, to disable sync mode uninstall `@wdio/sync`.

## Async mode

Every browser/element function call returns a Promise and needs to be awaited to get result.

Example

```js
describe('suite async', () => {
    it('test', async () => { // pay attention to `async` keyword
        const el = await $('body') // note `await` keyword
        await el.click()

        await browser.pause(500)

        console.log(browser.capabilities) // static properties should not be awaited

        await $('body').click() // WON'T WORK! You can't chain functions like this.
    })
})
```

### Common issues in async mode

`await $('body').click()` throws `$(...).click is not a function` because the element was not awaited. To fix this, first await element then trigger the click, like so:
```js
const el = await $('body')
await el.click()
```
- previous command was not awaited:
```js
const el = await $('body')
el.waitForExist() // await is missing here, you'll get `Unhandled promise rejection`.
await el.click()
```

## Sync mode

If you're using`@wdio/sync` then you can avoid awaiting for browser/element calls. It is still required to deal with Promises from 3rd-party libraries, you should use [browser.call](/api/browser/call.html) for this.

Example

```js
// 3rd-party library example
// https://www.npmjs.com/package/got#gotgeturl-options
const { get } = require('got')

describe('suite sync', () => {
    it('test sync',
    // make sure to remove `async` keyword otherwise function treated as async
    // and you have to await every browser call.
    // The same is applicable to hooks in `wdio.conf.js` as well.
    () => {
        browser.pause(500)

        // wrap 3rd-party library calls with `browser.call`
        const response = browser.call(() => get('https://cat-fact.herokuapp.com/facts/'))

        $('body').click() // You can chain functions in sync mode
    })

    it('using async function in sync mode',
    // If you have `@wdio/sync` installed and configured, it is still possible to use async functions.
    // However, in such case you have to await every browser/element call like in async mode, and this can
    // be confusing when other tests are sync, so we discourage mixing modes, but it is possible to do so.
    // The best practice in sync mode is to wrap anything async with `browser.call`.
    async () => {
        await browser.pause(500)

        const response = await get('https://cat-fact.herokuapp.com/facts/')

        const el = await $('body')
        await el.click()
    })
})
```

### How does sync mode work?

Every browser/element command is wrapped with [fibers](https://github.com/laverdet/node-fibers) while in sync mode.

### Common issues in sync mode

- declaring test function as `async` and not awaiting browser/element functions
- not awaiting 3rd-party library promises with `browser.call`
- using sync mode while `@wdio/sync` package is not installed
- `fibers` failed to install properly. There might be some issues with `node-gyp` or you have unsupported NodeJS version. See `npm install` errors for more details
