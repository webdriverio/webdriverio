---
id: sync-vs-async
title: Sync mode vs async
---

## Async mode

Every browser/element function call returns a Promise and have to be awaited to get result.

It's not allowed to chain methods.

Example

```js
describe('suite async', () => {
    it('test', async () => { // pay attention to `async` keyword
        const el = await $('body') // note `await` keyword
        await el.click()

        await browser.pause(500)

        console.log(browser.capabilities) // static properties should not be awaited

        await $('body').click() // WON'T WORK! You can't chain methods like this.
    })
})
```

## Sync mode

If you have `@wdio/sync` installed you can avoid awaiting browser/element calls. It is still required to deal with Promises from 3rd-party libraries, use [browser.call](/api/browser/call.html) to do that.

Example

```js
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

        $('body').click() // You can chain methods in sync mode
    })

    it('async test in sync mode',
    // even if you have `@wdio/sync` installed you can use async functions.
    // However in such case you have to await every browser/element call like in async mode!
    async () => {
        await browser.pause(500)

        const response = await get('https://cat-fact.herokuapp.com/facts/')

        const el = await $('body')
        await el.click()
    })
})
```

Every browser/element command is wrapped with [fibers](https://github.com/laverdet/node-fibers) in sync mode to make async code look like sync.
